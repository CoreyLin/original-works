今天demo一下用Fabric java SDK来为一个组织生成一个新的user的私钥和证书，并且利用这个新生成的user的私钥和证书，发起对已有链码的调用，然后验证是否能够成功的调用链码。

Fabric java SDK的文档不是很全，Fabric java SDK的文档主要是以单元测试代码体现的，也就是说，要学习Fabric java SDK，需要仔细阅读其单元测试。它的单元测试写得非常的复杂，一个方法往往就是几百行，没有严格遵守clean code的规范，很容易看晕，尤其是如果没有掌握Fabric CA原理的话，那么更容易晕。比如说，runChannel这个方法就有300多行，里面包含很多的业务逻辑。

我为了用Fabric java SDK生成新user的私钥和证书，以及对已有链码进行调用，就对现有的代码进行了分析、剥离和简化，以达到用尽量清晰的代码实现想达到的目的。

首先过一遍代码，解释一下里面的业务逻辑。这里主要是实现业务功能，用于验证Fabric CA，并没有对代码结构做优化。

首先，第一步要做的就是，为org1生成一个新的user，也就是新的client identity，后续要用这个user去调用链码。这里172.19.102.63:7054是已经搭建好的org1的Fabric CA server。

然后检查一下是否能成功连接到Fabric CA server，如果成功连接到Fabric CA server，那么HFCAInfo不为null。

这里要注意，在注册新的user之前，需要enroll admin，也就是为admin生成私钥和证书，然后用admin这个特殊的用户来注册新的user。注意，admin是一个bootstrap identity，在Fabric CA server启动的时候就已经被register了，此处只需要enroll admin即可。

接下来就是用admin来register一个新的user。这个地方我注释掉了，是因为user3我之前在跑这段代码的时候已经register过了，对同一个user，不能重复register，所以注释掉了。如果是一个新的user，比如user4，那么就需要register。

register user3之后，就是enroll user3，enroll就是为user3生成私钥和证书。生成之后我们打印一下。

然后创建一个User，用于封装刚刚enroll的identity。

接下来，构造一个HFClient，与已经搭建好的Fabric网络进行交互，然后把刚刚生成的User设置为客户端的上下文，也就是发起交易请求时，使用user3的私钥和证书。

然后构造一个Channel，注意，此处调用的是public Channel newChannel(String name)，用于返回一个已经配置好的通道，并不会创建一个新的通道。

然后，把这个channel相关的所有orderer都添加到channel里面。同样，把与这个channel相关的所有peer都添加到channel里面。注意：只添加安装了链码的peer。由于peer1org1,peer1org2没有安装链码，所以不添加。

然后初始化channel，这一步非常重要，如果缺失，就会报错。

然后注册一个链码事件监听器。

好，接下来，我们构造一个链码，链码名称是mycc，版本是1.0.注意，此处的mycc 1.0是已经安装并且实例化的链码。
接下来，根据这个链码，构造一个交易提议请求，把a的值转10给b，a的值就减少10.

接下来，把transaction proposal发送给channel中的peer，注：peer上必须安装了链码，没有安装链码的peer不用发送。

最后，把ProposalResponse，也就是peer返回的签名读写集发送给orderer进行排序，写入一个新的区块，写入账本，即couchdb。

在运行这段代码之前，我们先通过peer cli查询一下链码，看看当前账本中a的值是多少。

然后我们再运行这段代码，执行完后，再用peer cli查询一下链码，a的值变化了，减少了10.
说明什么呢，说明了两点：
1.我们成功的用Fabric java SDK为组织1生成了一个新的user
2.我们成功的用这个新生成的user对链码进行了调用，从侧面对新生成的user的有效性进行了验证

