# 在使用Fabric SDK Go时禁用TLS

一般我们用如下代码来New一个FabricSDK

	configProvider := config.FromFile("D:\\GOCODE\\src\\gitlab.yingzi.com\\CoreyLin\\fabric-sdk-go-experiment\\config\\config_test.yaml")
	sdk, err := fabsdk.New(configProvider)
	
如果遇到如下错误

	panic: Failed to create new SDK: failed to initialize configuration: unable to load endpoint config: failed to initialize endpoint config from config backend: network configuration load failed: failed to load channel configs: failed to load orderer configs: Orderer has no certs configured. Make sure TLSCACerts.Pem or TLSCACerts.Path is set for 172.19.102.63:7050 [recovered]
	
而如果我们要连接的Fabric网络本身又没有开启TLS，那么我们就需要在Fabric SDK Go中禁用TLS。如何禁用TLS呢？在配置文件config_test.yaml中设置如下配置项

    grpcOptions:
      # allow-insecure will be taken into consideration if address has no protocol defined, if true then grpc or else grpcs
      allow-insecure: true
	  
allow-insecure默认为false，把allow-insecure设置为true即可。

2019.5.29
