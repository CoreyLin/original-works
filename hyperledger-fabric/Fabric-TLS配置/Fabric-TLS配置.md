# 用传输层安全协议(Transport Layer Security,TLS)确保通信安全

Fabric支持使用TLS在节点之间进行安全通信。TLS通信既可以使用单向(server only)身份验证，也可以使用双向(server and client)身份验证。

## 为peers配置TLS

一个peer既是一个TLS服务器，也是一个TLS客户端。当另一个peer、应用程序或CLI与它建立连接时它是TLS服务器，当它与另一个peer或orderer建立连接时它是TLS客户端。

要在一个peer上启用TLS，请设置以下peer配置属性:

* peer.tls.enabled = true

* peer.tls.cert.file = 包含TLS服务器证书的文件的完全限定路径

* peer.tls.key.file = 包含TLS服务器私钥的文件的完全限定路径

* peer.tls.rootcert.file = 包含颁发TLS服务器证书的证书颁发机构(CA)的证书链的文件的完全限定路径

默认情况下，当在一个peer上启用TLS时，TLS客户端身份验证是被关闭的。这意味着在一次TLS握手期间，peer节点不会验证一个客户端(另一个peer节点、应用程序或CLI)的证书。要在一个peer节点上启用TLS客户端身份验证，请设置peer配置属性peer.tls.clientAuthRequired为true并设置peer.tls.clientRootCAs.files属性指向CA链文件，该CA链文件包含为你的组织的客户端颁发TLS证书的CA证书链。

默认情况下，一个peer节点在充当一个TLS服务器和一个TLS客户端时将使用相同的证书和私钥对（pair）。要为充当TLS客户端时使用一个不同的证书和私钥对，请设置peer.tls.clientCert.file和peer.tls.clientKey.file配置属性分别指向客户端证书和私钥文件的完全限定路径。

客户端身份验证的TLS也可以通过设置以下环境变量来启用:

* CORE_PEER_TLS_ENABLED = true

* CORE_PEER_TLS_CERT_FILE = 包含TLS服务器证书的文件的完全限定路径

* CORE_PEER_TLS_KEY_FILE = 包含TLS服务器私钥的文件的完全限定路径

* CORE_PEER_TLS_ROOTCERT_FILE = 包含颁发TLS服务器证书的证书颁发机构(CA)的证书链的文件的完全限定路径

* CORE_PEER_TLS_CLIENTAUTHREQUIRED = true

* CORE_PEER_TLS_CLIENTROOTCAS_FILES = CA链文件的完全限定路径，用于颁发TLS客户端证书

* CORE_PEER_TLS_CLIENTCERT_FILE = 客户端证书的完全限定路径

* CORE_PEER_TLS_CLIENTKEY_FILE = 客户端私钥的完全限定路径

当在一个peer节点上启用客户端身份验证时，一个客户端需要在一次TLS握手期间向这个peer发送其证书。如果客户端不发送它的证书，握手将失败，peer将关闭连接。

当一个peer加入一个通道时，通道成员的根CA证书链将被从通道的配置区块中读取出来，并添加到TLS客户端和服务器的根CAs数据结构中。因此，peer和peer间的通信，peer和orderer的通信应该无缝地工作。

## 为orderer节点配置TLS

要在一个orderer节点上启用TLS，请设置以下orderer配置属性:

* General.TLS.Enabled = true

* General.TLS.PrivateKey = 包含服务器私钥的文件的完全限定路径

* General.TLS.Certificate = 包含服务器证书的文件的完全限定路径

* General.TLS.RootCAs = 包含颁发TLS服务器证书的CA的证书链的文件的完全限定路径

默认情况下，TLS客户端身份验证在orderer上是关闭的，和peer一样。要启用TLS客户端身份验证，请设置以下配置属性:

* General.TLS.ClientAuthRequired = true

* General.TLS.ClientRootCAs = 包含颁发TLS客户端证书的CA的证书链的文件的完全限定路径

客户端身份验证的TLS也可以通过设置以下环境变量来启用:

* ORDERER_GENERAL_TLS_ENABLED = true

* ORDERER_GENERAL_TLS_PRIVATEKEY = 包含服务器私钥的文件的完全限定路径

* ORDERER_GENERAL_TLS_CERTIFICATE = 包含服务器证书的文件的完全限定路径

* ORDERER_GENERAL_TLS_ROOTCAS = 包含颁发TLS服务器证书的CA的证书链的文件的完全限定路径

* ORDERER_GENERAL_TLS_CLIENTAUTHREQUIRED = true

* ORDERER_GENERAL_TLS_CLIENTROOTCAS = 包含颁发TLS客户端证书的CA的证书链的文件的完全限定路径

## 为peer CLI配置TLS

当对一个启用了TLS的peer节点运行peer CLI命令时，必须设置以下环境变量:

* CORE_PEER_TLS_ENABLED = true

* CORE_PEER_TLS_ROOTCERT_FILE = 包含发出TLS服务器证书的CA的证书链的文件的完全限定路径

如果在远程服务器上也启用了TLS客户端身份验证，除了上述变量外，还必须设置以下变量:

* CORE_PEER_TLS_CLIENTAUTHREQUIRED = true

* CORE_PEER_TLS_CLIENTCERT_FILE = 客户端证书的完全限定路径

* CORE_PEER_TLS_CLIENTKEY_FILE = 客户端私钥的完全限定路径

当运行连接到orderer服务的一条命令时，比如peer channel <create|update|fetch>或peer chaincode <invoke|instantiate>，如果在orderer上启用了TLS，还必须指定以下命令行参数:

* –tls

* –cafile <包含orderer CA证书链的文件的完全限定路径>

如果在orderer上启用了TLS客户端身份验证，还必须指定以下参数:

* –clientauth

* –keyfile <包含客户端私钥的文件的完全限定路径>

* –certfile <包含客户端证书的文件的完全限定路径>

## 调试TLS问题

在调试TLS问题之前，建议在TLS客户端和服务器端都启用**GRPC debug**，以获取附加信息。要启用**GRPC debug**，请将环境变量**FABRIC_LOGGING_SPEC**设置为包含**grpc=debug**。例如，将默认日志级别设置为**INFO**，将GRPC日志级别设置为**DEBUG**，请将日志规范（logging specification）设置为**grpc=debug:info**。

如果你在客户端看到错误消息**remote error: tls: bad certificate**，这通常意味着TLS服务器启用了客户端身份验证，而服务器要么没有收到正确的客户端证书，要么收到了它不信任的一个客户端证书。确保客户端正在发送它的证书，并且这个证书已经由peer或orderer节点信任的CA证书之一签名。

如果你在链码日志中看到错误消息**remote error: tls: bad certificate**，请确保你的链码是使用Fabric v1.1或更新版本提供的chaincode shim构建的。如果你的chaincode不包含shim的一个vendored副本，那么删除chaincode容器并重新启动它的peer将使用当前shim版本重新构建chaincode容器。

2019.5.22
