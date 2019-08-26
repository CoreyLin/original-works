# Gossip数据传播协议

Hyperledger Fabric通过在交易执行(背书和提交)的peers和交易排序的节点之间划分工作负载，优化区块链网络性能、安全性和可伸缩性。这种网络操作的解耦需要一个安全、可靠和可伸缩的数据传播协议，以确保数据的完整性和一致性。为了满足这些需求，Fabric实现了一个Gossip数据传播协议。

## Gossip协议

peers利用gossip以一种可伸缩的方式广播账本和通道数据。gossip消息是连续的，一个通道上的每个peer都不断地从多个peers接收当前和一致的账本数据。每条gossip消息都被签名，因此可以很容易地识别发送假消息的Byzantine参与者，并防止将消息分发给不想要的目标（unwanted targets）。受延迟、网络分区或其他导致丢失区块的原因影响的peers最终将通过与拥有这些丢失区块的peers联系，同步到当前的账本状态。

基于gossip的数据传播协议在一个Fabric网络上执行三个主要功能:

* 通过不断识别可用的成员peers，并最终检测离线和脱机的peers，管理peer发现和通道成员资格。

* 在一个通道上跨所有peers分发账本数据。任何具有与通道的其他peers不同步的数据的peer都可以识别缺失的区块，并通过复制正确的数据来同步自身。

* 通过允许点对点状态传输账本数据的更新，使新连接的peers跟上进度。

基于gossip的广播由peers运行，这些peers接收来自通道上其他peers的消息，然后将这些消息转发到通道上随机选择的多个peers，其中“多个”是一个可配置的常量，也就是说具体转发给多少个peers是可以配置的。peers还可以使用一种pull的机制，而不是等待一条消息的传递。这种循环不断重复，其结果是通道成员资格、账本和状态信息不断地保持最新和同步。为了传播新的区块，通道上的leader peer从排序服务中pull数据，并向其所在组织中的peers发起gossip传播。

## Leader选举

leader选举机制用于为每个组织选举一个peer，该peer将保持与排序服务的连接，并在其所在组织的peers之间启动新到达的区块的分发。利用leader选举为系统提供了有效利用排序服务的带宽的能力。一个leader选举模块有两种可能的运行模式:

1. Static（静态）--- 一个系统管理员手动配置组织中的一个peer为leader。

2. Dynamic（动态）--- peers执行一个leader选举程序，以选择一个组织中的一个peer成为leader。

### 静态leader选举

静态leader选举允许你手动将一个组织中的一个或多个peers定义为leader peers。但是，请注意，太多的peers连接到排序服务可能会导致带宽的低效使用。要启用静态leader选举模式，请在core.yaml部分中配置以下参数:

	peer:
		# Gossip related configuration
		gossip:
			useLeaderElection: false
			orgLeader: true

或者，这些参数可以用环境变量来配置和覆盖:

	export CORE_PEER_GOSSIP_USELEADERELECTION=false
	export CORE_PEER_GOSSIP_ORGLEADER=true
	
注意

以下配置将保持peer处于stand-by模式，即peer不会试图成为一个leader:

	export CORE_PEER_GOSSIP_USELEADERELECTION=false
	export CORE_PEER_GOSSIP_ORGLEADER=false

2. 将CORE_PEER_GOSSIP_USELEADERELECTION和CORE_PEER_GOSSIP_ORGLEADER都设置为true值会引起歧义，将导致一个错误。

在静态配置中，组织管理员（admin）负责在发生故障或崩溃时提供leader节点的高可用性。

### 动态leader选举

动态leader选举允许组织peers选择一个peer，该peer将连接到排序服务并pull出新的区块。这个leader是为一个组织的peers独立选出的。

一个动态选出的leader会向其他peers发送心跳信息，作为一个liveness的证据。如果一个或多个peers在规定的时间内没有收到心跳的更新，他们将选举一个新的leader。

在一个网络分区的最坏情况下，组织将有超过一个active的leader来确保弹性和可用性，以允许组织的peers继续取得进展。网络分区被修复后，其中一个leader将放弃其领导地位（leadership）。在没有网络分区的一个稳定状态下，将只有一个active的leader连接到排序服务。

以下配置控制leader心跳消息的频率:

	peer:
		# Gossip related configuration
		gossip:
			election:
				leaderAliveThreshold: 10s

为了启用动态leader选举，需要在core.yaml中配置以下参数:

	peer:
		# Gossip related configuration
		gossip:
			useLeaderElection: true
			orgLeader: false

或者，这些参数可以用环境变量配置和覆盖:

	export CORE_PEER_GOSSIP_USELEADERELECTION=true
	export CORE_PEER_GOSSIP_ORGLEADER=false

## 锚peers

锚peers被gossip使用，用来确保不同组织的peers彼此通信、彼此了解。

当一个包含对锚peers的一个更新的配置区块被提交时，peers将与锚peers联系，向锚peers学习锚peers所知道的所有peers。一旦每个组织中至少有一个peer与一个锚peer联系，这个锚peer就会了解通道中的每个peer。由于gossip通信是持续的，而且peers总是要求被告知他们不认识的peers的存在，所以可以为一个通道建立一个共同的成员观（view of membership）。

例如，假设通道中有三个组织—A, B, C—和一个为组织C定义的锚peer-peer0.orgC。当peer1.orgA(来自组织A)联系peer0.orgC时，它将告诉peer0.orgC关于peer0.orgA的信息。之后，当peer1.orgB联系peer0.orgC时，peer0.orgC会告诉peer1.orgB关于peer0.orgA的情况。从那时起，组织A和组织B将开始直接交换成员信息，而不需要锚peer peer0.orgC的任何协助。

由于跨组织的通信依赖于gossip才能正常工作，因此必须在通道配置中定义至少一个锚peer。强烈建议基于高可用性和冗余的考虑，每个组织提供自己的一组锚peers（即每个组织多个锚peers）。注意，锚peer不需要与leader peer相同。

### 外部和内部endpoints

为了使gossip能够有效地工作，peers需要能够获得自己组织中的peers以及其他组织中的peers的endpoint信息。

当一个peer被引导（bootstrapped）时，它会使用它的core.yaml中的peer.gossip.bootstrap来为自己做广告，并交换成员信息，构建一个自己所属组织中所有可用的peers的视图。

core.yaml中的peer.gossip.bootstrap属性被用于引导一个组织内的gossip。如果你正在使用gossip，你通常会配置你组织中的所有peers来指向一组初始引导peers(你可以指定一个以空格分隔的peers列表)。内部endpoint通常由peer自身自动计算，或者直接通过core.yaml中的core.peer.address显式传递。如果需要覆盖这个值，可以将CORE_PEER_GOSSIP_ENDPOINT作为一个环境变量export。

建立跨组织的通信同样需要引导(bootstrap)信息。初始的跨组织引导信息是通过上面描述的“锚peer”设置提供的。如果你想让你的组织里的其他peers被其他组织所知，你就得在你的peer的core.yaml中设置peer.gossip.externalendpoint。如果不设置，则不会将这个peer的endpoint信息广播给其他组织中的peers。

要设置这些属性，请发出以下命令:

	export CORE_PEER_GOSSIP_BOOTSTRAP=<a list of peer endpoints within the peer's org>
	export CORE_PEER_GOSSIP_EXTERNALENDPOINT=<the peer endpoint, as known outside the org>

## Gossip消息

在线peers通过不断广播“alive”消息来表明它们的可用性（availability），每个消息都包含公钥基础设施(PKI) ID和消息发送方的签名。peers通过收集这些alive消息来维持通道成员关系;如果没有一个peer接收到来自一个特定peer的一个alive消息，则最终将从通道成员中清除这个“死”peer。由于“alive”消息是加密签名的，恶意peers永远不能模拟其他peers，因为它们缺少一个根证书颁发机构(CA)授权的签名私钥。

除了自动转发接收到的消息外，一个状态协调过程还跨每个通道上的peers同步世界状态。每个peer不断地从通道上的其他peers pull区块，以便在发现差异时修复它自己的状态。由于不需要固定连接来维护基于gossip的数据分发，因此该过程可靠地为共享账本提供了数据一致性和完整性，包括对节点崩溃的容忍度。

由于通道是隔离的，一个通道上的peers不能在任何其他通道上发送消息或共享信息。尽管任何peer都可以属于多个通道，但是通过应用基于一个peer的通道订阅的消息路由策略，分区消息传递可以防止区块传播到不在这个通道中的peers。

注意

1. 点对点消息的安全性由peer的TLS层处理，不需要签名。peers通过由CA分配的证书进行身份验证。虽然TLS certs也被使用，但是在gossip层中被身份验证的是peer证书。账本区块由排序服务签名，然后在一个通道上传递给leader peers。

2. 身份验证由这个peer的成员资格服务提供者（MSP）管理。当peer第一次连接到通道时，TLS会话与成员身份（membership identity）绑定。这本质上是根据网络和通道中的成员身份，向连接的peer验证channel中已存在的每个peer。
