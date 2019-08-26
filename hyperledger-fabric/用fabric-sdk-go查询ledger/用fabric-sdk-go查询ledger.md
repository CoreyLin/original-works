# 使用Fabric SDK Go查询账本

## 1.解决编译错误

进入$GOPATH/src/github.com/go-kit/kit/目录，执行以下命令

	cd $GOPATH/src/github.com/go-kit/kit
	git fetch --tags
	git checkout v0.8.0

## 2.准备配置文件

需要先准备一个yaml格式的配置文件，名字可以自己取，比如config_test.yaml。

### 2.1.TLS

如果连接的目标Fabric网络没有启用TLS，那么在配置文件中需要禁用TLS，把orderers和peers的**allow-insecure**设置为true

	orderers:
	  _default:
		grpcOptions:
		  # allow-insecure will be taken into consideration if address has no protocol defined, if true then grpc or else grpcs
		  allow-insecure: true
	peers:
	  _default:
		grpcOptions:
		  # allow-insecure will be taken into consideration if address has no protocol defined, if true then grpc or else grpcs
		  allow-insecure: true
		  
### 2.2.用于连接到Fabric网络的Admin client的私钥和证书配置

要连接到目标Fabric网络，需要一个Admin client，比如org1的Admin。这时就需要在client.credentialStore.path里配置Admin证书所在的本地路径，在client.credentialStore.cryptoStore.path里配置Admin私钥所在的本地路径，如下

	client:
	  credentialStore:
		path: "F:\\crypto-config-by-CA\\state-store"
		cryptoStore:
		  path: "F:\\crypto-config-by-CA\\key-store"
		  
* 由于我是用的windows，所以路径分隔符是\\

* Admin证书应该取名为key.ID + "@" + key.MSPID + "-cert.pem"，此处就是Admin@Org1MSP-cert.pem。此处Admin中的A是大写的，个人猜测应该是与测试代码中准备上下文中传入的Admin有关：

	  org1AdminChannelContext := sdk.ChannelContext("mychannel", fabsdk.WithUser("Admin"), fabsdk.WithOrg("Org1"))
	
	证书的名字必须满足要求，经过实测，如果改成Admin@org1.yingzi.com-cert.pem，就会报以下错误
	
	  failed to get client context to create channel client: user not found
	  
	注意，Admin@Org1MSP-cert.pem直接放在F:\\crypto-config-by-CA\\state-store下就可以了
	
* Admin私钥文件放到F:\\crypto-config-by-CA\\key-store\\keystore下，不能改名，CA生成是什么名字就是什么名字（比如20aafc1d4771f2b734f30b93f447c40d6d7832008ced7f7d0ed7d8b60a9c1a6a_sk）。注意，这里是放在子文件夹**keystore**下。

## 3.配置peers的本地DNS映射

由于在config_test.yaml里配置了几个peers:peer0.org1.yingzi.com,peer1.org1.yingzi.com,peer0.org2.yingzi.com,peer1.org2.yingzi.com，Fabric SDK客户端就会连接比如peer0.org1.yingzi.com:7051，所以需要配置DNS映射。

windows中，在C:\Windows\System32\drivers\etc\HOSTS文件中加入以下内容

	# used for Fabric SDK Go
	172.**.***.62 peer0.org1.yingzi.com
	172.**.***.62 peer1.org1.yingzi.com
	172.**.***.63 peer0.org2.yingzi.com
	172.**.***.63 peer1.org2.yingzi.com




参考资料：

https://www.lijiaocn.com/%E7%BC%96%E7%A8%8B/2018/07/28/hyperledger-fabric-sdk-go.html

https://github.com/introclass/hyperledger-fabric-sdks-usage/tree/master/go

https://chainhero.io/2018/06/tutorial-build-blockchain-app-v1-1-0/

2019.5.29
