# Peer基于通道的事件服务

## 总体概述

在Fabric以前的版本中，peer事件服务被称为event hub。每当一个新区块被添加到这个peer的账本中时，该事件服务都会发送事件，无论该区块属于哪个通道，并且只有运行这个事件peer所属组织的成员可以访问这个peer的事件服务，组织成员连接到这个peer以获取事件。

从v1.1开始，有两个提供事件的新服务。这些服务使用一个完全不同的设计来提供基于每个通道的事件。这意味着事件的注册发生在通道级别而不是peer级别，允许对peer的数据访问进行细粒度控制。接收事件的请求接受来自这个peer所属组织外部的标识(由通道配置定义)。这还提供了更高的可靠性和接收可能错过的事件的一种方法(无论是由于一个连接问题还是由于peer正在加入一个已经运行的网络)。

## 可用的服务

### Deliver

Deliver服务发送已提交到账本的整个区块（blocks）。如果任何事件是由一个链码设置的，那么可以在区块的ChaincodeActionPayload中找到这些事件。

### DeliverFiltered

DeliverFiltered服务发送“过滤”区块，即已提交到账本的区块（blocks）的最小信息集。它的目的是在这样的一种网络中使用：peers的所有者希望外部客户端主要接收关于其交易和这些交易状态的信息。如果任何事件是由一个链码设置的，那么可以在过滤区块的FilteredChaincodeAction中找到这些事件。

注意

链码事件的有效负载将不包含在过滤区块中。

## 如何注册事件

通过向peer发送一个包含一个deliver seek info message的信封（envelope）来注册来自这两种服务的事件，该信封包含所需的开始和停止位置、查找行为(阻塞直到准备好，如果没有准备好则失败)。有helper变量SeekOldest和SeekNewest，可以用来表示账本上最老的(即第一个)区块或最新的(即最后一个)区块。要让服务无限期地发送事件，SeekInfo消息应该包含一个MAXINT64的停止位置。

注意

如果在peer上启用了双向TLS，则必须在信封的通道header中设置TLS证书哈希。

默认情况下，Deliver服务和DeliverFiltered服务都使用Channel Readers策略来决定是否为事件授权请求的客户端。

## deliver响应消息的概述

事件服务发回DeliverResponse消息。

每条消息都包含以下内容之一:

* status –  HTTP status code。如果发生失败，两个服务都会返回相应的失败码;否则，一旦服务完成发送SeekInfo消息请求的所有信息，它将返回200 - SUCCESS。

* block – 仅由Deliver服务返回。

* filtered block – 仅由DeliverFiltered服务返回。

一个filtered block包含:

* channel ID.

* number (区块号).

* array of filtered transactions（过滤的交易数组）.

* transaction ID.

    * type (e.g. ENDORSER_TRANSACTION, CONFIG.
    * transaction validation code（交易验证码）.
* filtered transaction actions.
    * array of filtered chaincode actions.
        * chaincode event for the transaction (with the payload nilled out).交易的链码事件(已填充有效负载)。

## SDK事件documentation

有关使用事件服务的详细信息，请参阅SDK文档（ https://fabric-sdk-node.github.io/tutorial-channel-events.html ）。

2019.6.10
