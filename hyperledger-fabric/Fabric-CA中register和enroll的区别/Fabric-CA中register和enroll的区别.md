# register和enroll的区别

在搭建了一个Fabric CA server之后，我们往往会向这个Fabric CA server发起请求，创建一个新的标识（peer，或orderer，user）的私钥和证书。创建私钥和证书的过程分为两步：register和enroll。register在前，enroll在后。

那么register（注册）和enroll（登记）有什么区别呢？官方文档上没有说得特别明确。

经过操作命令进行实践，以及查阅资料。把它们的含义和区别总结如下：

## register

register一个标识（identity）是指在Fabric CA server上为这个标识创建名称（name）和密码（secret）。也就是说把标识的信息添加到Fabric CA server中。一个name只能被register一次，不能重复register。register的命令示例如下：

    fabric-ca-client register --id.name peer0 --id.type peer --id.affiliation org1 --id.secret peer0pw
	
在register命令执行之后，Fabric CA server对应的文件夹fabric-ca-server下的fabric-ca-server.db文件就会有更新（修改时间会有变化），说明register一个标识之后，服务器端的数据是有变化的。

有一个特殊的bootstrap标识，admin，在启动Fabric CA server（fabric-ca-server start -b admin:adminpw）的时候就已经自动注册了。

所有其他标识在enroll之前都需要先被register。执行register请求的标识必须当前已被enroll，并且必须具有register正在被register的标识类型的适当权限。通常来讲，在register一个普通标识之前，通常要求客户端已经enroll admin。

## enroll

enroll一个标识指的是为这个标识生成私钥和证书。enroll是指已经注册的标识连接到CA并向CA发送证书签名请求(Certificate Signing Request，CSR)的过程。CA检查标识是否已经注册并执行其他一些验证，如果检查成功，则将私钥和签名的证书返回给标识。enroll命令的示例如下：

    fabric-ca-client enroll -u http://peer0:peer0pw@localhost:7054 -M $FABRIC_CA_CLIENT_HOME/peer0/msp

其中，peer0:peer0pw就是已经register的标识的名称和密码，这证明了enroll的前提是该标识已经被register。

enroll命令执行之后，服务器端没有任何文件发生变化，切记这一点。enroll命令执行之后，只有客户端的文件有变化，因为enroll会为一个标识生成私钥和证书。

对同一个已经注册的标识，可以在Fabric CA client执行多次enroll（具体次数取决于fabric-ca-server-config.yaml中的maxenrollments），用以生成私钥和证书。每次执行enroll，都会为这个标识生成新的私钥和证书，切记这一点。

## 总结

总的来说，对一个客户端来说，先enroll admin，再register一个标识，再enroll这个标识。
