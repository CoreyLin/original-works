# 显示go package的依赖

1. 根据 https://github.com/KyleBanks/depth ，执行以下命令安装这个开源工具

        go get github.com/KyleBanks/depth/cmd/depth
	   
2. 对需要进行依赖分析的go package执行以下命令（由于篇幅限制，依赖没有显示完）

		hp@▒ֿ▒1 MINGW64 /d/GOCODE/src/gitlab.yingzi.com/yingzi/Blockchain-Team/yingzi-app-chaincode/chaincode (master)
		$ depth gitlab.yingzi.com/yingzi/Blockchain-Team/yingzi-app-chaincode/chaincode
		gitlab.yingzi.com/yingzi/Blockchain-Team/yingzi-app-chaincode/chaincode
		  ├ encoding/json
		  ├ fmt
		  ├ log
		  ├ os
		  ├ strings
		  ├ github.com/hyperledger/fabric/core/chaincode/shim
			├ container/list
			├ context
			├ flag
			├ fmt
			├ io
			├ io/ioutil
			├ os
			├ strings
			├ sync
			├ time
			├ unicode/utf8
			├ github.com/hyperledger/fabric/bccsp/factory
			
更多用法，请参考 https://github.com/KyleBanks/depth

2019.6.3
