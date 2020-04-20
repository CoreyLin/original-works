# failed to get client context to create channel client: user not found

如何解决这个错误

方法一：

* org1AdminChannelContext := sdk.ChannelContext("mychannel", fabsdk.WithUser("Admin"), fabsdk.WithOrg("org1.mycompany.com")) 注意参数是"Admin"，"Org1"，如果行不通，就把"Org1"改成"org1"

* 代码默认找的Admin的证书的格式是：key.ID + "@" + key.MSPID + "-cert.pem"，所以把Admin@Org1MSP-cert.pem放在MSP下面

* cryptoconfig.path和cryptoPath的路径都不能太长，不然的话在代码中会被截断，这一点在debug的时候已经得到了验证

方法二：

如果方法一行不通，就把admin@Org1MSP-cert.pem放在credentialStore.path下面。因为在debug单步调试的过程中发现代码在找/tmp/state-store\admin@Org1MSP-cert.pem

经实验，方法一行不通，方法二行得通。
