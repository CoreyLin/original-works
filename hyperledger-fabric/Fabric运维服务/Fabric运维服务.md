# 运维服务

peer和orderer都承载了（host）一个HTTP服务器，该服务器提供RESTful的“运维”API。这个API与Fabric网络服务无关，它的目的是供运维人员使用，而不是供网络管理员或“用户”使用。

该API公开了以下功能:

* 日志级别管理

* 健康检查

* 用于运维度量的普罗米修斯（Prometheus）目标(在配置时)

## 配置运维服务

运维服务需要两项基本配置:

* 监听的**地址**和**端口**

* 用于身份验证和加密的**TLS证书**和**密钥**。注意，**这些证书应该由一个单独的专用CA生成**。不要使用已经为任何通道中的任何组织生成证书的CA。

### Peer

对于每个peer，可以在**core.yaml**的**operations**部分配置运维服务器:

	operations:
	  # host and port for the operations server。运维服务器的主机和端口
	  listenAddress: 127.0.0.1:9443

	  # TLS configuration for the operations endpoint。运维endpoint的TLS配置
	  tls:
		# TLS enabled
		enabled: true

		# path to PEM encoded server certificate for the operations server。运维的PEM编码的服务器证书的路径
		cert:
		  file: tls/server.crt

		# path to PEM encoded server key for the operations server。运维的PEM编码的服务器密钥的路径
		key:
		  file: tls/server.key

		# most operations service endpoints require client authentication when TLS
		# is enabled. clientAuthRequired requires client certificate authentication
		# at the TLS layer to access all resources.
		# 当启用TLS时，大多数运维服务endpoints都需要客户端身份验证。clientAuthRequired要求在TLS层对客户端证书进行身份验证，以访问所有资源。
		clientAuthRequired: false

		# paths to PEM encoded ca certificates to trust for client authentication
		# 要信任用于客户端身份验证的PEM编码ca证书的路径
		clientRootCAs:
		  files: []
		  
**listenAddress**键定义运维服务器将监听的主机和端口。如果服务器应该监听所有地址，则可以省略主机（host）部分。

**tls**部分用于指示是否为运维服务启用TLS、服务的证书和私钥的路径，以及证书颁发机构（CA）根证书的路径(应该信任这些CA根证书进行客户端身份验证)。当**enabled**为true时，大多数运维服务endpoints都需要客户端身份验证，因此**clientRootCAs.files**必须被设置。当**clientAuthRequired**为**true**时，TLS层将要求客户端为每个请求提供一个用于身份验证的证书。有关详细信息，请参阅下面的运维安全（Operations Security）部分。

### Orderer

对于每个orderer，可以在**orderer.yaml**的Operations部分配置运维服务器:

	Operations:
	  # host and port for the operations server。运维服务器的主机和端口
	  ListenAddress: 127.0.0.1:8443

	  # TLS configuration for the operations endpoint。运维endpoint的TLS配置
	  TLS:
		# TLS enabled
		Enabled: true

		# PrivateKey: PEM-encoded tls key for the operations endpoint。私钥：运维端点的PEM编码的tls密钥
		PrivateKey: tls/server.key

		# Certificate governs the file location of the server TLS certificate.证书管理服务器TLS证书的文件路径
		Certificate: tls/server.crt

		# Paths to PEM encoded ca certificates to trust for client authentication
		# 要信任用于客户端身份验证的PEM编码ca证书的路径
		ClientRootCAs: []

		# Most operations service endpoints require client authentication when TLS
		# is enabled. ClientAuthRequired requires client certificate authentication
		# at the TLS layer to access all resources.
		# 当启用TLS时，大多数运维服务endpoints都需要客户端身份验证。clientAuthRequired要求在TLS层对客户端证书进行身份验证，以访问所有资源。
		ClientAuthRequired: false
		
**ListenAddress**键定义运维服务器将监听的主机和端口。如果服务器应该监听所有地址，则可以省略主机（host）部分。

**TLS**部分用于指示是否为运维服务启用TLS、服务的证书和私钥的路径，以及证书颁发机构（CA）根证书的路径(应该信任这些CA根证书进行客户端身份验证)。当**Enabled**为true时，大多数运维服务endpoints都需要客户端身份验证，因此**RootCAs**必须被设置。当**ClientAuthRequired**为**true**时，TLS层将要求客户端为每个请求提供一个用于身份验证的证书。有关详细信息，请参阅下面的运维安全（Operations Security）部分。

### Operations Security（运维安全）

由于运维服务专注于运维，并且有意与Fabric网络无关，所以它不使用MSP进行访问控制。相反，运维服务完全依赖于与客户端证书身份验证的相互TLS。

当禁用TLS时，授权将被绕过，任何能够连接到运维端点的客户端都可以使用该API。

当启用TLS时，必须提供一个有效的客户端证书，以便访问所有资源，除非下面另有明确说明。

当启用clientAuthRequired时，TLS层将需要一个有效的客户端证书，而不管访问的是什么资源。

### 日志级别管理

运维服务提供了一个**/logspec**资源，运维人员可以使用它来管理一个peer或orderer的活动日志规范。该资源是传统的REST资源，支持**GET**和**PUT**请求。

当运维服务接收到一个**GET /logspec**请求时，它将使用包含当前日志规范的一个JSON有效负载进行响应:

	{"spec":"info"}
	
当运维服务接收到一个**PUT /logspec**请求时，它将把请求主体作为一个JSON有效负载读取。有效负载必须包括一个名为**spec**的属性。

	{"spec":"chaincode=debug:info"}
	
如果这个spec被成功激活，服务将响应一个**204 "No Content"**响应。如果发生一个错误，服务将响应一个**400 "Bad Request"**和一个错误负载:

	{"error":"error message"}
	
## 健康检查

运维服务提供一个/healthz资源，运维人员可以使用该资源帮助确定peers和orderers的活力和健康状况。该资源是一个支持GET请求的传统REST资源。该实现旨在与Kubernetes使用的活性探针模型（liveness probe model）兼容，但也可用于其他上下文中。

当收到一个**GET /healthz**请求时，运维服务将调用这个进程的所有已注册的健康检查器（health checkers）。当所有的健康检查器都成功返回时，运维服务将返回一个**200 "OK"**和一个JSON body:
	
	{
	  "status": "OK",
	  "time": "2009-11-10T23:00:00Z"
	}
	
如果一个或多个健康检查器返回一个错误，运维服务将响应一个**503 "Service Unavailable"**和一个JSON body，JSON body包含关于哪个健康检查器失败的信息:
	
	{
	  "status": "Service Unavailable",
	  "time": "2009-11-10T23:00:00Z",
	  "failed_checks": [
		{
		  "component": "docker",
		  "reason": "failed to connect to Docker daemon: invalid endpoint"
		}
	  ]
	}
	
在当前版本中，唯一已注册的健康检查是针对Docker的。未来的版本将增强添加额外的健康检查。

启用TLS时，除非将clientAuthRequired设置为true，否则使用健康检查服务不需要一个有效的客户端证书。

## Metrics（度量）

Fabric peer和orderer的一些组件暴露了度量，这些度量可以帮助提供对系统行为的洞察。运维人员和管理员可以使用这些信息更好地了解系统在一段时间内的运行情况。

### 配置度量

Fabric提供了两种暴露度量的方法:基于Prometheus的pull模型和基于StatsD的push模型。

### Prometheus

一个典型的Prometheus部署通过从测试目标公开的一个HTTP端点请求度量指标来scrapes度量指标。因为Prometheus负责请求度量，所以它被认为是一个pull系统。

配置好后，一个Fabric peer或orderer将在其运维服务上显示一个**/metrics**资源。

#### Peer

通过在**core.yaml**的**metrics**部分中将metrics provider设置为**prometheus**，可以配置一个peer来公开一个**/metrics**端点，以便Prometheus进行刮取。

	metrics:
	  provider: prometheus
	  
#### Orderer

通过在**orderer.yaml**的**Metrics**部分中将metrics provider设置为**prometheus**，可以将一个orderer配置为公开一个**/metrics**端点，以便Prometheus进行抓取。

	Metrics:
	  Provider: prometheus

### StatsD

StatsD是一个简单的统计信息聚合守护进程（statistics aggregation daemon）。度量数据被发送到一个statsd daemon，在那里收集、聚合并推送到一个后端以进行可视化和警报。由于这个模型需要仪表化的流程将度量数据发送到StatsD，所以这被认为是一个push系统。

#### Peer

通过在**core.yaml**的**metrics**部分中将metrics provider设置为**statsd**，可以配置一个peer将度量发送到StatsD。**statsd**子部分还必须配置StatsD daemon的地址、要使用的网络类型(**tcp**或**udp**)以及发送度量的频率。可以指定一个可选的**prefix**来帮助区分度量的来源——例如，区分来自不同peers的度量——这将作为所有生成度量的前缀。

	metrics:
	  provider: statsd
	  statsd:
		network: udp
		address: 127.0.0.1:8125
		writeInterval: 10s
		prefix: peer-0

#### Orderer

通过在**orderer.yaml**的**Metrics**部分中将metrics provider设置为**statsd**，可以将一个orderer配置为向StatsD发送度量。**Statsd**子部分还必须配置StatsD daemon的地址、要使用的网络类型(**tcp**或**udp**)以及发送度量的频率。可以指定一个可选**prefix**来帮助区分度量的来源。

	Metrics:
		Provider: statsd
		Statsd:
		  Network: udp
		  Address: 127.0.0.1:8125
		  WriteInterval: 30s
		  Prefix: org-orderer

要查看生成的不同度量，请查看Metrics Reference。


