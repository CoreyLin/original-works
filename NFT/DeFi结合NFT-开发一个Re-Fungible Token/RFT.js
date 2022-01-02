// import time to simulate ICO finishment
const { time } = require('@openzeppelin/test-helpers');
// create contract artifacts
const RFT = artifacts.require('RFT.sol');
const NFT = artifacts.require('NFT.sol');
const DAI = artifacts.require('DAI.sol');

const DAI_AMOUNT = web3.utils.toWei('25000'); // 25000 * (10^18) wei
const SHARE_AMOUNT = web3.utils.toWei('25000');

// testsuites
contract('RFT', async addresses => {
    const [admin, buyer1, buyer2, buyer3, buyer4, _] = addresses;

    // testcase
    it('ICO should work', async () => {
        // deploy dai and nft contracts
        const dai = await DAI.new();
        const nft = await NFT.new('Corey NFT', 'NFT');
        await nft.mint(admin, 1); // 1 is nftId here
        await Promise.all([dai.mint(buyer1, DAI_AMOUNT), dai.mint(buyer2, DAI_AMOUNT), dai.mint(buyer3, DAI_AMOUNT), dai.mint(buyer4, DAI_AMOUNT)]);

        // deploy RFT
        const rft = await RFT.new(
            'Corey RFT',
            'RFT',
            nft.addresses,
            1, // nftId
            1, // every share of NFT price is 1 wei of DAI
            web3.utils.toWei('1000000'), // icoShareSupply
            dai.address
        );

        await nft.approve(rft.address, 1); // from is not specified, defaults to first address of address array
        await rft.startIco();

        await dai.approve(rft.address, DAI_AMOUNT, { from: buyer1 });
        await rft.buyShare(SHARE_AMOUNT, { from: buyer1 });
        await dai.approve(rft.address, DAI_AMOUNT, { from: buyer2 });
        await rft.buyShare(SHARE_AMOUNT, { from: buyer2 });
        await dai.approve(rft.address, DAI_AMOUNT, { from: buyer3 });
        await rft.buyShare(SHARE_AMOUNT, { from: buyer3 });
        await dai.approve(rft.address, DAI_AMOUNT, { from: buyer4 });
        await rft.buyShare(SHARE_AMOUNT, { from: buyer4 });

        // simulate time flies so that ICO is finished
        await time.increase(7 * 86400 + 1);
        await rft.withdrawProfits();

        // check the balances
        const balanceShareBuyer1 = await rft.balanceOf(buyer1);
        const balanceShareBuyer2 = await rft.balanceOf(buyer2);
        const balanceShareBuyer3 = await rft.balanceOf(buyer3);
        const balanceShareBuyer4 = await rft.balanceOf(buyer4);
        assert(balanceShareBuyer1.toString() === SHARE_AMOUNT);
        assert(balanceShareBuyer2.toString() === SHARE_AMOUNT);
        assert(balanceShareBuyer3.toString() === SHARE_AMOUNT);
        assert(balanceShareBuyer4.toString() === SHARE_AMOUNT);

        const balanceAdminDai = await dai.balanceOf(admin);
        assert(balanceAdminDai.toString() === web3.utils.toWei('100000'));
    });
});