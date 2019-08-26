# Fabric CA用户指南

Hyperledger Fabric CA是Hyperledger Fabric的证书颁发机构(CA)。

它提供的功能包括:

* 标识的注册，或作为用户注册中心连接到LDAP

* 登记（Enrollment，ECerts）证书的签发

* 证书更新和撤销

Hyperledger Fabric CA由一个服务器和一个客户端组件组成，如本文档后面所述。

对于有兴趣为Hyperledger Fabric CA做出贡献的开发人员，请参阅Fabric CA repository以获得更多信息。

## 综述

下图说明了Hyperledger Fabric CA服务器如何适应整个Hyperledger Fabric架构。

![1.png](1.png)

与Hyperledger Fabric CA服务器交互的方法有两种:通过Hyperledger Fabric CA客户端或通过一种Fabric SDK。与Hyperledger Fabric CA服务器的所有通信都是通过REST APIs进行的。可以查看Fabric CA的swagger文档fabric-ca/swagger/swagger-fabric-ca.json以进一步了解这些接口。这些REST api的swagger文档的json。你可以通过 http://editor2.swagger.io 在线编辑器查看此文档。

Hyperledger Fabric CA客户端或SDK可以连接到Hyperledger Fabric CA服务器集群中的一台服务器。图的右上角说明了这一点。客户机路由到HA Proxy端点，该端点负载均衡流量到fabric-ca-server集群成员之一。

集群中的所有Hyperledger Fabric CA服务器共享一个数据库，用于跟踪标识和证书。如果配置了LDAP，则标识信息最好保存在LDAP中，而不是数据库中。

一个服务器可以包含多个CAs。每个CA要么是根CA，要么是中间CA。每个中间CA都有一个父CA，父CA要么是根CA，要么是另一个中间CA。

## 准备开始

### 先决条件

* 安装了Go 1.10+
* 正确设置了**GOPATH**环境变量
* 安装了libtool和libtdhl-dev包

下面在Centos上安装libtool依赖:

    yum list installed |grep -i libtool

下面在Ubuntu上安装libtool依赖:

    sudo apt install libtool libltdl-dev

下面在MacOSX上安装libtool依赖:

    brew install libtool

注意：如果你通过Homebrew安装libtool，那么MacOSX上不需要libtldl-dev

有关libtool的更多信息，请参见 https://www.gnu.org/software/libtool 。

有关libltdl-dev的更多信息，请参见 https://www.gnu.org/software/libtool/manual/html_node/Using-libltdl.html 。

### 安装

下面将在$GOPATH/bin中安装fabric-ca-server和fabric-ca-client二进制文件。

    go get -u github.com/hyperledger/fabric-ca/cmd/...

注意:如果你已经克隆了fabric-ca仓库，那么在运行上面的“go get”命令之前，请确保你位于master分支上。否则，你可能会看到以下错误:

    <gopath>/src/github.com/hyperledger/fabric-ca; git pull --ff-only
    There is no tracking information for the current branch.
    Please specify which branch you want to merge with.
    See git-pull(1) for details.

        git pull <remote> <branch>

    If you wish to set tracking information for this branch you can do so with:

        git branch --set-upstream-to=<remote>/<branch> tlsdoc

    package github.com/hyperledger/fabric-ca/cmd/fabric-ca-client: exit status 1

### 本地启动服务器

下面将使用默认设置启动fabric-ca-server

    fabric-ca-server start -b admin:adminpw

-b选项为一个引导管理员提供登记（enrollment）ID和密匙;这是必要的，如果LDAP没有以“ldap.enabled”设置启用。

一个名为fabric-ca-server-config.yaml的默认配置文件在可以自定义的本地目录中被创建。

### 通过Docker启动服务器

#### Docker Hub

转到 https://hub.docker.com/r/hyperledger/fabric-ca/tags/

找到与你想要pull的fabric-ca的架构和版本匹配的tag。

导航到*$GOPATH/src/github.com/hyperledger/fabric-ca/docker/server*并在一个编辑器中打开docker-compose.yml。

更改image这一行以反映前面找到的tag。对于beta版的x86架构，这个文件可能看起来像这样。

    fabric-ca-server:
      image: hyperledger/fabric-ca:x86_64-1.0.0-beta
      container_name: fabric-ca-server
      ports:
        - "7054:7054"
      environment:
        - FABRIC_CA_HOME=/etc/hyperledger/fabric-ca-server
      volumes:
        - "./fabric-ca-server:/etc/hyperledger/fabric-ca-server"
      command: sh -c 'fabric-ca-server start -b admin:adminpw'
  
在与docker-compose.yml文件相同的目录中打开一个终端，并执行以下命令:

    docker-compose up -d

如果compose文件中不存在指定的fabric-ca镜像，那么它将pull down该镜像，并启动一个fabric-ca服务器的实例。

#### 构建你自己的Docker镜像

你可以通过docker-compose构建和启动服务器，如下所示。

    cd $GOPATH/src/github.com/hyperledger/fabric-ca
    make docker
    cd docker/server
    docker-compose up -d

hyperledger/fabric-ca docker镜像同时包含fabric-ca-server和fabric-ca-client。

    # cd $GOPATH/src/github.com/hyperledger/fabric-ca
    # FABRIC_CA_DYNAMIC_LINK=true make docker
    # cd docker/server
    # docker-compose up -d

### 探索Fabric CA CLI

为了方便起见，本节仅简单提供Fabric CA服务器和客户端的使用信息。其他使用信息在以下几节中提供。

下面的链接显示了Server Command Line和Client Command Line。

注意，如果命令行选项是字符串切片(列表)，那么可以通过使用逗号分隔的列表元素指定该选项，也可以通过多次指定该选项(每个选项都有一个组成列表的字符串值)来指定。例如，为csr.hosts选项指定host1和host2，你可以传递--csr.hosts 'host1,host2'或--csr.hosts host1 --csr.hosts host2。使用前一种格式时，请确保逗号前后没有空格。

## 配置设置

Fabric CA提供了三种方法来配置Fabric CA服务器和客户端上的设置。优先顺序为:

1. CLI flags

2. 环境变量

3. 配置文件

在本文档的剩余部分中，我们将提到对配置文件进行更改。但是，可以通过环境变量或CLI flags覆盖配置文件的更改。

例如，如果我们在客户端配置文件中有以下内容:

    tls:
      # Enable TLS (default: false)
      enabled: false

      # TLS for the client's listenting port (default: false)
      certfiles:
      client:
        certfile: cert.pem
        keyfile:
	
以下环境变量可用于覆盖配置文件中的cert.pem设置:

    export FABRIC_CA_CLIENT_TLS_CLIENT_CERTFILE=cert2.pem

如果我们想覆盖环境变量和配置文件，我们可以使用一个命令行flag。

    fabric-ca-client enroll --tls.client.certfile cert3.pem

同样的方法也适用于fabric-ca-server，只是使用了**FABRIC_CA_SERVER**，而不是使用**FABRIC_CA_CLIENT**作为环境变量的前缀。

### 关于文件路径

Fabric CA服务器和客户端配置文件中指定文件名的所有属性都支持相对路径和绝对路径。相对路径相对于配置目录，配置文件位于其中。例如，如果配置目录是**~/config**，并且tls部分如下所示，Fabric CA服务器或客户端将在**~/config**目录中寻找**root.pem**文件，在**~/config/certs**目录中寻找**cert.pem**文件，在**/abs/path**目录中寻找**key.pem**文件。

    tls:
      enabled: true
      certfiles:
        - root.pem
      client:
        certfile: certs/cert.pem
        keyfile: /abs/path/key.pem
	
## Fabric CA服务器

本节描述Fabric CA服务器。

你可以在启动Fabric CA服务器之前先初始化它。这为你提供了生成默认配置文件的机会，可以在启动服务器之前查看和定制该配置文件。

**Fabric CA服务器的主目录确定如下**:

* 如果设置了-home命令行选项，使用它的值

* 否则，如果设置了**FABRIC_CA_SERVER_HOME**环境变量，则使用它的值

* 否则，如果设置了**FABRIC_CA_HOME**环境变量，则使用它的值

* 否则，如果设置了**CA_CFG_PATH**环境变量，则使用它的值

* 否则，使用当前工作目录

对于本服务器部分的剩余部分，我们假设你已经将**FABRIC_CA_HOME**环境变量设置为**$HOME/fabric-ca/server**。

下面的指导假设服务器配置文件存在于服务器的主目录中。

### 初始化服务器

初始化Fabric CA服务器如下:

    fabric-ca-server init -b admin:adminpw

当禁用LDAP时，初始化需要**-b**(引导标识)选项。启动Fabric CA服务器至少需要一个引导标识;这个标识是服务器管理员。

服务器配置文件包含一个可以配置的证书签名请求(Certificate Signing Request，CSR)部分。下面是一个示例CSR。

    cn: fabric-ca-server
    names:
       - C: US
         ST: "North Carolina"
         L:
         O: Hyperledger
         OU: Fabric
    hosts:
      - host1.example.com
      - localhost
    ca:
       expiry: 131400h
       pathlength: 1
   
上面的所有字段都属于由**fabric-ca-server init**生成的X.509签名密钥和证书。这对应于服务器配置文件中的**ca.certfile**和**ca.keyfile**文件。这些字段如下:

* cn is the Common Name
* O is the organization name
* OU is the organizational unit
* L is the location or city
* ST is the state
* C is the country

如果需要自定义CSR的值，可以自定义配置文件，删除由**ca.certfile**和**ca.keyfile**配置项指定的文件，然后再次运行**fabric-ca-server init -b admin:adminpw**命令。

除非指定了**-u <parent-fabric-ca-server-URL>**选项，否则**fabric-ca-server init**命令生成自签名的CA证书。如果指定了**-u**，则服务器的CA证书由父Fabric CA服务器签名。为了向父Fabric CA服务器进行标识验证，URL的格式必须是**<scheme>://<enrollmentID>:<secret>@<host>:<port>**，其中<enrollmentID>和<secret>对应一个标识，这个标识的‘hf.IntermediateCA’属性的值等于‘true’。**fabric-ca-server init**命令还在服务器的主目录中生成了一个名为**fabric-ca-server-config.yaml**的默认配置文件。

如果你希望Fabric CA服务器使用你提供的CA签名证书和密钥文件，则必须将你的文件分别放在**ca.certfile**和**ca.keyfile**引用的位置。这两个文件都必须是PEM编码的，并且不能加密。更具体地说，CA证书文件的内容必须以**-----BEGIN CERTIFICATE-----**开始，密钥文件的内容必须以**-----BEGIN PRIVATE KEY-----**开始，而不是以**-----BEGIN ENCRYPTED PRIVATE KEY-----**开始。

算法和密钥大小

CSR可以被定制为生成支持椭圆曲线(Elliptic Curve，ECDSA)的X.509证书和密钥。下面的设置是用**curve prime256v1**和签名算法**ecdsa-with-SHA256**实现椭圆曲线数字签名算法(Elliptic Curve Digital Signature Algorithm，ECDSA)的一个例子:

    key:
       algo: ecdsa
       size: 256
   
算法的选择和密钥大小是基于安全需求的。

椭圆曲线(ECDSA)提供了以下密钥大小的选项:

![2.png](2.png)

### 启动服务器

启动Fabric CA服务器如下:

    fabric-ca-server start -b <admin>:<adminpw>

如果服务器之前没有被初始化，它将在第一次启动时初始化自己。在初始化期间，如果ca-cert.pem和ca-key.pem文件不存在，那么服务器将生成ca-cert.pem和ca-key.pem；另外，如果默认配置文件不存在，服务器还将创建一个默认配置文件。请参阅Initialize the Fabric CA server部分。

除非Fabric CA服务器配置为使用LDAP，否则它必须配置至少一个预先注册的引导标识，以便您能够注册和登记其他标识。选项-b指定引导标识的名称和密码。

要使Fabric CA服务器监听**https**而不是**http**，请设置**tls.enabled**为**true**。

安全警告:Fabric CA服务器应该始终在启用TLS (**tls.enabled**设置为true)的情况下启动。如果不这样做，服务器将很容易受到能够访问网络流量的攻击者的攻击。

要限制登记时使用相同的secret(或 password)的次数，请将配置文件中的registry.maxenrollments设置为适当的值。如果将值设置为1,Fabric CA服务器只允许对一个特定登记ID使用一次密码。如果将值设置为-1,Fabric CA服务器对登记时重用密匙的次数没有限制。默认值是-1。如果将值设置为0,Fabric CA服务器将禁用所有标识的登记，并且不允许注册标识。

Fabric CA服务器现在应该监听在端口7054上了。

如果你不希望将Fabric CA服务器配置为在集群中运行或使用LDAP，可以直接跳到Fabric CA客户端部分。

## Fabric CA客户端

本节描述如何使用fabric-ca-client命令。

**Fabric CA客户端的主目录确定如下**:

* 如果设置了-home命令行选项，请使用它的值

* 否则，如果设置了**FABRIC_CA_CLIENT_HOME**环境变量，则使用它的值

* 否则，如果设置了**FABRIC_CA_HOME**环境变量，则使用它的值

* 否则，如果设置了**CA_CFG_PATH**环境变量，则使用它的值

* 否则，使用**$HOME/.fabric-ca-client**

下面的指导假设客户端配置文件存在于客户端的主目录中。

### 登记引导标识

首先，如果需要，在客户端配置文件中定制CSR(证书签名请求，Certificate Signing Request)部分。注意，**csr.cn**字段必须设置为引导标识的ID。默认CSR值如下所示:

    csr:
      cn: <<enrollment ID>>
      key:
        algo: ecdsa
        size: 256
      names:
        - C: US
          ST: North Carolina
          L:
          O: Hyperledger Fabric
          OU: Fabric CA
      hosts:
       - <<hostname of the fabric-ca-client>>
      ca:
        pathlen:
        pathlenzero:
        expiry:
	
有关字段的描述，请参见CSR fields。

然后运行**fabric-ca-client enroll**命令来登记这个标识。例如，下面的命令通过调用运行在本地7054端口的Fabric CA服务器来登记ID为**admin**、密码为**adminpw**的标识。

    export FABRIC_CA_CLIENT_HOME=$HOME/fabric-ca/clients/admin
    fabric-ca-client enroll -u http://admin:adminpw@localhost:7054

注意：个人理解此处的admin:adminpw是指的Fabric CA服务器的引导标识的用户名和密码，也就是说，用户在执行这条命令时，必须知道Fabric CA服务器的引导标识的用户名和密码。此处还存疑。

enroll命令将登记证书(ECert)、对应的私钥和CA证书链PEM文件存储在Fabric CA客户端的**msp**目录的子目录中。你将看到提示PEM文件存储在什么路径的消息。

### 注册一个新标识

执行注册请求的标识当前必须已经被登记，并且必须具有注册正在被注册的标识类型的适当权限。

具体来说，Fabric CA服务器在注册时进行了以下三次授权检查:

1. registrar(即调用者)必须有“hf.Registrar.Roles”属性，该属性具有一个由逗号分隔的值列表，其中一个值必须等于正在被注册的标识的类型;例如，如果registrar有“hf.Registrar.Roles”属性，该属性的值是“peer,app,user”，那么这个registrar可以注册peer、app和user类型的标识，但不能注册orderer类型的标识。

2. registrar的从属关系必须等于正在被注册的标识的从属关系，或者等于正在被登记的标识的从属关系的前缀。例如，从属关系为“a.b”的一个registrar，可注册从属关系为“a.b.c”的一个标识，但不能注册从属关系为“a.c”的一个标识。如果一个标识需要根从属关系，那么从属关系请求应该是一个点(”.”)，并且registrar也必须有根从属关系。如果注册请求中未指明从属关系，则正在被注册的标识会被赋予registrar的从属关系。

3. 如符合下列所有条件，registrar可以为一个用户（user）注册属性:

    * Registrar可以注册前缀为‘hf.’的Fabric CA保留属性，前提是registrar必须拥有该属性，并且该属性是hf.Registrar.Attributes属性的值的一部分。此外，如果这个属性是list类型的，则被注册的属性的值必须等于registrar拥有的该属性的值，或者是registrar拥有的该属性的值的子集。如果属性类型为boolean，registrar只能在registrar的该属性值为“true”时注册该属性。

    * 注册自定义属性(即名称不以‘hf.’开头的任何属性)要求registrar具有‘hf.Registar.Attributes’属性，并且该属性的值包含正在被注册的属性或属性模式。惟一受支持的属性模式是一个末尾带有“*”的字符串。例如,“a.b.*”是一个模式，它匹配所有以“a.b.”开头的属性名。例如，如果registrar拥有属性hf.Registrar.Attributes=orgAdmin，那么这个registrar可以对一个标识添加或删除的唯一属性就是‘orgAdmin’属性。

    * 如果被请求的属性名是‘hf.Registrar.Attributes’，则执行一个附加检查，以查看此属性的被请求值是否等于registrar的‘hf.Registrar.Attributes’的值或是其子集。要实现这一点，每个被请求的值都必须匹配registrar的‘hf.Registrar.Attributes’属性值中的一个值。例如，如果registrar的‘hf.Registrar.Attributes’的值为‘a.b.*, x.y.z’，被请求的属性值为‘a.b.c, x.y.z’，那么这是合法的，因为‘a.b.c’匹配‘a.b.*’，‘x.y.z’匹配registrar的‘x.y.z’值。

**例子**

**合法场景**

1. 如果registrar具有属性‘hf.Registrar.Attributes = a.b.*, x.y.z’，且正在注册属性‘a.b.c’，那么这是合法的，因为‘a.b.c’匹配‘a.b.*’

2. 如果registrar具有属性‘hf.Registrar.Attributes = a.b.*, x.y.z’，且正在注册属性‘x.y.z’，那么这是合法的，因为‘x.y.z’匹配registrar的‘x.y.z’值

3. 如果registrar具有属性‘hf.Registrar.Attributes = a.b.*, x.y.z’，且被请求的属性是‘a.b.c, x.y.z’，那么这是合法的，因为‘a.b.c’匹配‘a.b.*’，并且‘x.y.z’匹配registrar的‘x.y.z’值

4. 如果registrar具有属性‘hf.Registrar.Roles = peer,client’，而被请求的属性值是‘peer’或‘peer,client’，那么它是有效的，因为被请求的值等于registrar的值或是其值的子集。

下表列出了可以为一个标识注册的所有属性。属性的名称是大小写敏感的。

| **名称** | **类型** | **描述** |
| :------| :------ | :------ |
| hf.Registrar.Roles | List | 允许Registrar管理的角色列表 |
| hf.Registrar.DelegateRoles | List | registrar可为其‘hf.Registrar.Roles’属性向registree授予的角色列表 |
| hf.Registrar.Attributes | List | 允许Registrar注册的属性 |
| hf.GenCRL | Boolean | 如果属性值为true，则标识（identity）能够生成CRL |
| hf.Revoker | Boolean | 如果属性值为true，则标识可以撤销用户和/或证书 |
| hf.AffiliationMgr | Boolean | 如果属性值为true，则标识能够管理从属关系 |
| hf.IntermediateCA | Boolean | 如果属性值为true，则标识可以注册成为中间CA |

注意:在注册一个标识时，指定一个属性名称和值的数组。如果这个数组指定多个同名数组元素，则当前只使用最后一个元素。换句话说，目前不支持多值属性。

下面的命令使用**admin**标识凭证注册一个新用户，登记id为“admin2”，隶属于“org1.department1”，“hf.Revoker”属性值为“true”，“admin”属性值为“true”。后缀”:ecert”表示，默认情况下，“admin”属性及其值将被插入到用户的登记证书里面，这样的话可以使用该证书做出访问控制决策。

    export FABRIC_CA_CLIENT_HOME=$HOME/fabric-ca/clients/admin
    fabric-ca-client register --id.name admin2 --id.affiliation org1.department1 --id.attrs 'hf.Revoker=true,admin=true:ecert'

被注册的用户的密码，也称为登记密钥，会被打印出来。登记这个标识需要这个密码。这允许一个管理员先注册一个标识，然后将登记ID和密码交给其他人去登记该标识。也就是说，注册标识和登记标识可以由两个人分别负责。注意，对于一个新标识来说，流程是先注册，再登记。

可以将多个属性指定为–id.attrs flag的一部分，每个属性必须用逗号分隔。对于包含一个逗号的属性值，必须将属性封装在双引号中。请参见下面的例子。

    fabric-ca-client register -d --id.name admin2 --id.affiliation org1.department1 --id.attrs '"hf.Registrar.Roles=peer,user",hf.Revoker=true'

或者

    fabric-ca-client register -d --id.name admin2 --id.affiliation org1.department1 --id.attrs '"hf.Registrar.Roles=peer,user"' --id.attrs hf.Revoker=true

通过编辑客户端的配置文件，可以为register命令中使用的任何字段设置默认值。例如，假设客户端配置文件包含以下内容:

    id:
      name:
      type: user
      affiliation: org1.department1
      maxenrollments: -1
      attributes:
        - name: hf.Revoker
          value: true
        - name: anotherAttrName
          value: anotherAttrValue
	  
然后，下面的命令将注册一个新的标识，其登记id为“admin3”，登记id从命令行中获取，剩余的则从配置文件中获取，包括identity type: “user”, affiliation: “org1.department1”和两个属性:“hf.Revoker”和“anotherAttrName”。

    export FABRIC_CA_CLIENT_HOME=$HOME/fabric-ca/clients/admin
    fabric-ca-client register --id.name admin3

要注册一个具有多个属性的标识，需要在上面所示的配置文件中指定所有属性的名称和值。

将maxenrollments设置为0或将其从配置文件中删除，将导致被注册的标识使用CA的max enrollment值。此外，正在被注册的标识的max enrollment值不能超过CA的max enrollment值。例如，如果CA的max enrollment值为5。那么任何新标识的max enrollment值必须小于或等于5，并且不能将其设置为-1(无限登记)。

接下来，让我们注册一个peer标识，它将用于在下一节中登记这个peer。下面的命令注册**peer1**标识。注意，我们选择指定自己的密码(或密钥secret)，而不是让服务器为我们生成一个。

    export FABRIC_CA_CLIENT_HOME=$HOME/fabric-ca/clients/admin
    fabric-ca-client register --id.name peer1 --id.type peer --id.affiliation org1.department1 --id.secret peer1pw

请注意，除了在服务器配置文件中指定的非叶子从属关系外，从属关系是区分大小写的，这些非叶子从属关系总是以小写存储。例如，如果服务器配置文件的从属关系部分如下所示:

    affiliations:
      BU1:
        Department1:
          - Team1
      BU2:
        - Department2
        - Department3
	
BU1、Department1、BU2被以小写字母存储。这是因为Fabric CA使用Viper读取配置。Viper将map的键视为大小写不敏感的，并且总是返回小写值。要注册一个从属于Team1的标识，需要将bu1.department1.Team1指定为–id.affiliation flag，如下图所示:

    export FABRIC_CA_CLIENT_HOME=$HOME/fabric-ca/clients/admin
    fabric-ca-client register --id.name client1 --id.type client --id.affiliation bu1.department1.Team1

### 登记一个peer标识

现在你已经成功注册了一个peer标识，您现在可以根据登记ID和secret(即上一节的密码)登记这个peer。这类似于登记引导标识，只是我们还将演示如何使用“-M”选项填充Hyperledger Fabric MSP(成员资格服务提供者)目录结构。

The following command enrolls peer1. Be sure to replace the value of the “-M” option with the path to your peer’s MSP directory which is the ‘mspConfigPath’ setting in the peer’s core.yaml file. You may also set the FABRIC_CA_CLIENT_HOME to the home directory of your peer.
下面的命令登记peer1。请确保将“-M”选项的值替换为你的peer的MSP目录的路径，该目录是peer的core.yaml中的‘mspConfigPath’设置。您还可以将FABRIC_CA_CLIENT_HOME设置为你的peer的主目录。

    export FABRIC_CA_CLIENT_HOME=$HOME/fabric-ca/clients/peer1
    fabric-ca-client enroll -u http://peer1:peer1pw@localhost:7054 -M $FABRIC_CA_CLIENT_HOME/msp

登记一个orderer是相同的，只是到MSP目录的路径是orderer的orderer.yaml中的‘LocalMSPDir’设置。

这个fabric-ca-server颁发的所有登记的证书都具有以下组织单位(简称“OUs”):

1. 这个OU层次结构的根等于标识的类型

2. 为这个标识的从属关系的每个组件添加一个OU

例如，如果一个标识的类型（type）为peer，它的从属关系是department1.team1，那么这个标识的OU层次结构(从叶子到根)是OU=team1, OU=department1, OU=peer。

### 从另一个Fabric CA服务器获取一个CA证书链

通常，MSP目录的cacerts子目录必须包含其他证书颁发机构（CA）的CA链，代表peer的所有信任根。

**fabric-ca-client getcainfo**命令用于从其他Fabric CA服务器实例（instances）检索这些证书链。

例如，下面将在本地主机上启动第二个Fabric CA服务器，该服务器监听端口7055，名称为“CA2”。这表示一个完全独立的信任根，将由区块链上的不同成员管理。

    export FABRIC_CA_SERVER_HOME=$HOME/ca2
    fabric-ca-server start -b admin:ca2pw -p 7055 -n CA2

下面的命令将把CA2的证书链安装到peer1的MSP目录中。

    export FABRIC_CA_CLIENT_HOME=$HOME/fabric-ca/clients/peer1
    fabric-ca-client getcainfo -u http://localhost:7055 -M $FABRIC_CA_CLIENT_HOME/msp

默认情况下，Fabric CA服务器以child-first顺序返回CA链。这意味着链中的每个CA证书后面都跟着它的颁发者的CA证书。如果你需要Fabric CA服务器以相反的顺序返回CA链，那么将环境变量**CA_CHAIN_PARENT_FIRST**设置为**true**并重启Fabric CA服务器。对于这两种CA链的顺序，Fabric CA客户端都能够正确处理。
