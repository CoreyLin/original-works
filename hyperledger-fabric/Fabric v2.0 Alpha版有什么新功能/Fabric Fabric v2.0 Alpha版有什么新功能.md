# v2.0 Alpha版有什么新功能

## 关于Alpha版本的一句话

Hyperledger Fabric v2.0的Alpha版本允许用户尝试两个令人兴奋的新特性——新的Fabric chaincode lifecycle和FabToken。Alpha版被提供给用户预览新功能，并不打算在生产中使用。此外，不支持升级到v2.0 Alpha版本，也不支持从Alpha版本升级到v2.x的未来版本。

## Fabric链码生命周期

Fabric 2.0 Alpha为chaincode引入了去中心化的治理，并提供了一个新流程，用于在peers上安装一个chaincode并在一个通道上启动它。新的Fabric链码生命周期允许多个组织在chaincode与账本交互之前，就一个chaincode的参数达成一致，比如chaincode的背书策略。新模型比之前的生命周期提供了几个改进:

* 多个组织必须一致同意一个链码的参数:在Fabric的1.x版本中，一个组织能够为所有其他通道成员设置一个链码的参数(例如背书策略)。新的Fabric链码生命周期更加灵活，因为它既支持中心化信任模型(如以前的生命周期模型)，也支持去中心化信任模型，后者需要足够多的组织在一个背书策略生效之前就其达成一致。

* 更安全的链码升级过程:在以前的链码生命周期中，升级交易可以由单个组织发出，为尚未安装新链码的通道成员带来风险。新模型允许一个链码只有在足够多的组织批准升级之后才能升级。

* 更简单的背书策略更新:Fabric生命周期允许您更改一个背书策略，而无需重新打包或重新安装链码。用户还可以利用一个新的默认策略，该策略需要通道上的大多数成员的背书。当从通道中添加或删除组织时，此策略将自动更新。

* 可检查的链码包:Fabric生命周期将链码打包在易读的tar文件中。这使得检查链码包（package）和跨多个组织协调安装变得更加容易。

* 使用一个包（package）启动一个通道上的多个链码:以前的生命周期使用安装（install）链码包时指定的一个名称和版本定义通道上的每个链码。现在，您可以使用一个链码包，并在相同或不同的通道上多次以不同的名称部署它。

### 使用新的链码生命周期

使用以下教程开始新的链码生命周期:

* https://hyperledger-fabric.readthedocs.io/en/latest/chaincode4noah.html ：提供安装和定义一个链码所需步骤的详细概述，以及新模型的可用功能。

* https://hyperledger-fabric.readthedocs.io/en/latest/build_network.html :如果您想立即开始使用新的生命周期，那么BYFN教程已经被更新为使用peer生命周期链码CLI在一个示例网络上安装和定义链码。

* https://hyperledger-fabric.readthedocs.io/en/latest/private_data_tutorial.html :已被更新，以演示如何在新的链码生命周期中使用私有数据集合。

* https://hyperledger-fabric.readthedocs.io/en/latest/endorsement-policies.html:了解新生命周期如何允许您在通道配置中使用策略作为链码背书策略。

#### 限制和局限性

在v2.0 Alpha版本中，新的Fabric链码生命周期还不是一个正式的已完成的feature。具体来说，要注意Alpha版本中的以下限制:

* 还不支持CouchDB索引

* 使用新生命周期定义的链码还不能通过服务发现被发现

这些限制将在Alpha版本之后得到解决。

## FabToken

Fabric 2.0 Alpha还为用户提供了方便地将资产表示为Fabric通道上的令牌的能力。FabToken是一个令牌管理系统，它使用未花费交易输出(Unspent Transaction Output, UTXO)模型，使用Hyperledger Fabric提供的标识和成员基础设施发出、传输和赎回令牌。

使用FabToken（ https://hyperledger-fabric.readthedocs.io/en/latest/token/FabToken.html ）:本操作指南提供了如何在一个Fabric网络上使用令牌的一个详细概述。该指南还包括一个关于如何使用令牌CLI创建和传输令牌的一个示例。

## Alpine images

从v2.0开始，Hyperledger Fabric Docker镜像将使用Alpine Linux，这是一个面向安全的轻量级Linux发行版。这意味着Docker镜像要小得多，提供更快的下载和启动时间，并且在主机系统上占用更少的磁盘空间。Alpine Linux从头开始设计时就考虑到了安全性，Alpine发行版的极简特性大大降低了安全漏洞的风险。

## Raft排序服务

在v1.4.1中引入了Raft，它是一种基于etcd Raft协议实现的一种崩溃容错(crash fault tolerant，CFT)排序服务。Raft遵循一个“leader and follower”模型，其中为每个通道选择一个leader节点，并将其决策复制到followers。Raft排序服务应该比基于Kafka的排序服务更容易设置和管理，而且它们的设计允许分布在世界各地的组织为一个去中心化的排序服务贡献节点。

* 排序服务（ https://hyperledger-fabric.readthedocs.io/en/latest/orderer/ordering_service.html ）:描述一个排序服务在Fabric中的角色，并概述当前可用的三种排序服务实现:Solo、Kafka和Raft。

* 配置和运行一个Raft排序服务（ https://hyperledger-fabric.readthedocs.io/en/latest/raft_configuration.html ）:展示部署一个Raft排序服务时的配置参数和注意事项。

* 设置一个排序节点（ https://hyperledger-fabric.readthedocs.io/en/latest/orderer_deploy.html ）:描述部署一个排序节点的过程，与具体的排序服务实现无关。

* 构建您的第一个网络（ https://hyperledger-fabric.readthedocs.io/en/latest/build_network.html ）:已更新，允许您使用一个示例网络的一个Raft排序服务。

## Release notes

Release notes为迁移到新版本的用户提供了更多的细节，以及完整版本更改日志的一个链接。

Fabric v2.0.0-alpha release notes.（ https://github.com/hyperledger/fabric/releases/tag/v2.0.0-alpha ）
Fabric CA v2.0.0-alpha release notes.（ https://github.com/hyperledger/fabric-ca/releases/tag/v2.0.0-alpha ）
