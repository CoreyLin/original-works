# 使用Fabric CA来生成私钥和证书

## 前置条件

先按照 https://hyperledger-fabric-ca.readthedocs.io/en/release-1.4/users-guide.html ，把Go 1.10+安装好，设置GOPATH环境变量，以及安装libtool和libtdhl-dev包。

## 1.安装Fabric CA服务器和客户端

下面将在$GOPATH/bin中安装fabric-ca-server和fabric-ca-client二进制文件。

    go get -u github.com/hyperledger/fabric-ca/cmd/...
	
安装之后可以看到如下结果

![1.png](1.png)

现在我们就可以在机器上执行fabric-ca-server和fabric-ca-client命令了。

## 2.通过Docker启动服务器

就像 https://hyperledger-fabric-ca.readthedocs.io/en/release-1.4/users-guide.html 中说的，有两种方式可以启动Fabric CA服务器：本地启动服务器或者通过Docker启动服务器。我在实践中是通过Docker启动服务器的。

### 2.1.创建一个文件夹，用于Fabric CA

个人认为最好是单独创建一个文件夹，比如名字就叫fabric_ca_org1，专门用于Fabric CA，这样的话很清晰。但我在实践中并没有单独创建这样一个文件夹，而是使用的$FABRIC_CFG_PATH

### 2.2.创建fabric-ca-server和fabric-ca-client子文件夹

创建两个子文件夹，分别用于存储Fabric CA服务器和客户端。此时这两个文件夹是空的，没有任何文件。

创建之后如下图所示

![2.png](2.png)

### 2.3.准备Fabric CA服务器的docker compose文件

$GOPATH/src/github.com/hyperledger/fabric-ca/docker/server里有一个示例docker-compose.yml。把这个文件拷贝到上述创建的Fabric CA文件夹中。我在实践中把它重命名为了docker-compose-ca.yml

然后修改文件的内容，首先修改的就是hyperledger/fabric-ca镜像的版本，替换为需要的版本。在 https://hub.docker.com/r/hyperledger/fabric-ca/tags/ 可以看到所有fabric-ca镜像的版本。由于我搭建的Fabric集群是1.4.0的版本，所以把hyperledger/fabric-ca镜像的版本修改成如下：

![3.png](3.png)

上图中，除了fabric-ca镜像的版本外，还有一个volume，把fabric-ca-server子文件夹挂载到fabric-ca-server容器中。

### 2.4.启动fabric-ca-server容器

执行以下命令

    docker-compose -f docker-compose-ca.yml up -d
	
容器启动之后，可以看到原本是空的fabric-ca-server子文件夹，现在产生了一些文件

![4.png](4.png)

ca-cert.pem是这个CA自身的自签名证书。

msp/keystore/中是CA自身的私钥文件。

fabric-ca-server-config.yaml是自动产生的Fabric CA的配置文件。如果fabric-ca-server子文件夹中原来没有fabric-ca-server-config.yaml，则会按照默认的配置自动产生。如果fabric-ca-server子文件夹中原来就有fabric-ca-server-config.yaml，则不会重新产生这个文件，Fabric CA服务器会按照fabric-ca-server-config.yaml中的配置启动。如果想更改fabric-ca-server-config.yaml的内容，步骤为：

1. docker stop fabric-ca-server

2. 修改fabric-ca-server-config.yaml的内容

3. docker start fabric-ca-server

这样的话Fabric CA服务器就会按照修改后的fabric-ca-server-config.yaml中的配置启动。

经过实践，个人认为我们暂时不需要修改fabric-ca-server-config.yaml，默认配置经实测（在部署Fabric集群时使用），是没有问题的。

注意：有一点需要尤其注意，默认Fabric CA服务器的tls是没有enabled的，如果有兴趣，可以查看自动生成的fabric-ca-server-config.yaml的tls的部分

![5.png](5.png)

我实践中尝试过enable服务器tls，但是仅仅是服务器开启tls还不够，是会报错的，还需要客户端开启tls，这一块还没仔细研究，是TODO的状态。本文档的剩余部分默认都是没有enable tls的。

## 3.使用Fabric CA客户端产生org1的证书

### 3.1.设置FABRIC_CA_CLIENT_HOME环境变量

把上述创建的fabric-ca-client子文件夹设置为FABRIC_CA_CLIENT_HOME环境变量

    export FABRIC_CA_CLIENT_HOME=/home/yzapps/hyperledger/fabric-samples/yingzi/fabric-ca-client
	
### 3.2.产生org1的admin（管理员）的私钥和签名证书

    fabric-ca-client enroll -u http://admin:adminpw@localhost:7054 -M $FABRIC_CA_CLIENT_HOME/admin/msp
	
按正常流程来说，产生一个终端实体的私钥和签名证书，需要经过两步，第一步是register(注册)，第二步是enroll（登记）。也就是说先执行fabric-ca-client register命令，再执行fabric-ca-client enroll命令。

此处之所以只执行了enroll来产生admin的私钥和证书，是因为在docker文件中，执行了fabric-ca-server start -b admin:adminpw ，-b选项为一个引导管理员提供登记（enrollment）ID和密匙;这是必要的，如果LDAP没有以“ldap.enabled”设置启用。也就是说在Fabric CA服务器容器启动的时候，已经注册（register）了一个引导的admin，就不用再通过fabric-ca-client register命令来重新注册了。

命令中的-M选项用于指定产生的msp存放在什么位置。产生的msp的详细目录结构和文件如下

![6.png](6.png)

上图中红色方框框起来的文件就是在部署Fabric集群的时候需要的admin的私钥和证书文件。具体怎么使用，会在另一篇文章中介绍。

### 3.3.产生org1的peer0的私钥和签名证书

#### 3.3.1.注册peer0

用以下命令注册peer0

    fabric-ca-client register --id.name peer0 --id.type peer --id.affiliation org1 --id.secret peer0pw
	
在此条命令执行之后，可以观察到，./fabric-ca-server/fabric-ca-server.db文件的更新时间变化了，也就是说注册peer0产生的数据存储在./fabric-ca-server/fabric-ca-server.db文件中。
	
#### 3.3.2.登记peer0

用以下命令登记peer0

    fabric-ca-client enroll -u http://peer0:peer0pw@localhost:7054 -M $FABRIC_CA_CLIENT_HOME/peer0/msp

注意，只有执行了fabric-ca-client enroll之后才会产生msp。产生的msp如下

![7.png](7.png)

上图中红色方框框起来的文件就是在部署Fabric集群的时候需要的org1的peer0的私钥和证书文件。具体怎么使用，会在另一篇文章中介绍。

### 3.4.产生org1的peer1的私钥和签名证书

同理，执行如下命令

    fabric-ca-client register --id.name peer1 --id.type peer --id.affiliation org1 --id.secret peer1pw

    fabric-ca-client enroll -u http://peer1:peer1pw@localhost:7054 -M $FABRIC_CA_CLIENT_HOME/peer1/msp
	
至此，org1的所有私钥和签名证书都已经生成完毕。

## 4.使用Fabric CA服务器和客户端产生org2的证书

注意，一个组织对应一个单独的Fabric CA服务器，不同组织的根CA的私钥和自签名证书是不同的。这样的话，就要求为每个组织都搭建一个Fabric CA服务器。另外，Fabric CA服务器和客户端对应的文件夹和子文件夹也最好单独创建，实现不同组织之间的隔离，这样也更加清晰。

重复第2到第3步，用于产生org2的证书。要注意的是，如果是在同一台主机上创建两个以上的Fabric CA服务器，需要注意docker compose yaml文件中的端口冲突问题，另外选择一个没有被占用的端口。

## 5.使用Fabric CA服务器和客户端产生orderer的证书

所有的orderer节点都属于一个组织。

在产生orderer的证书之前，先在服务器配置文件fabric-ca-server-config.yaml中加上如下内容，然后重启orderer组织的fabric ca server容器，这样才能产生orderer组织的证书

![8.png](8.png)

接下来，同样是重复第2到第3步。不同的是，注册和登记orderer的命令有一些不同，--id.type的值是orderer，如下

    fabric-ca-client register --id.name orderer0 --id.type orderer --id.affiliation orderer --id.secret orderer0pw

    fabric-ca-client enroll -u http://orderer0:orderer0pw@localhost:7054 -M $FABRIC_CA_CLIENT_HOME/orderer0/msp

    fabric-ca-client register --id.name orderer1 --id.type orderer --id.affiliation orderer --id.secret orderer1pw

    fabric-ca-client enroll -u http://orderer1:orderer1pw@localhost:7054 -M $FABRIC_CA_CLIENT_HOME/orderer1/msp

    fabric-ca-client register --id.name orderer2 --id.type orderer --id.affiliation orderer --id.secret orderer2pw

    fabric-ca-client enroll -u http://orderer2:orderer2pw@localhost:7054 -M $FABRIC_CA_CLIENT_HOME/orderer2/msp

---

至此，我们已经为org1的两个peer，org2的两个peer，orderer的三个orderer，以及各组织的CA和admin，产生了私钥和签名证书。至于如何在实际部署Fabric集群中使用，请参见另一篇文章。
