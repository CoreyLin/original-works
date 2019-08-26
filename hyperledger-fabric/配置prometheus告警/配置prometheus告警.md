# 配置prometheus告警

Prometheus的告警分为两部分。Prometheus服务器中的告警规则向Alertmanager发送告警。Alertmanager然后管理这些告警，包括静默、抑制、聚合和通过电子邮件、PagerDuty和HipChat等方法发送通知。

设置告警和通知的主要步骤如下:

* 安装和配置Alertmanager
* 配置Prometheus，使其与Alertmanager通信
* 在Prometheus中创建告警规则

## 1.安装和配置Alertmanager

### 1.1.下载Alertmanager

去 https://prometheus.io/download/ 下载Alertmanager，比如alertmanager-0.17.0.linux-amd64.tar.gz

专门创建一个文件夹，比如alertmanager，用来放下载的预编译二进制文件。

通过下面的命令解压

	tar xvfz alertmanager-0.17.0.linux-amd64.tar.gz
	
### 1.2.配置Alertmanager的配置文件

在解压了之后，进入解压后的文件夹，默认就会生成alertmanager的配置文件alertmanager.yml

	[yzapps@00VMTL-FabricPeer-172-19-102-64 alertmanager]$ cd alertmanager-0.17.0.linux-amd64
	[yzapps@00VMTL-FabricPeer-172-19-102-64 alertmanager-0.17.0.linux-amd64]$ ll
	total 51688
	-rwxr-xr-x. 1 yzapps yzadmin 26856136 May  3 17:10 alertmanager
	-rw-r--r--. 1 yzapps yzadmin      604 May 15 19:41 alertmanager.yml
	-rwxr-xr-x. 1 yzapps yzadmin 22325499 May  3 17:11 amtool
	drwxr-xr-x. 2 yzapps yzadmin       35 May 16 22:27 data
	-rw-r--r--. 1 yzapps yzadmin    11357 May  3 17:45 LICENSE
	-rw-------. 1 yzapps yzadmin  3720624 May 15 21:20 nohup.out
	-rw-r--r--. 1 yzapps yzadmin      457 May  3 17:45 NOTICE
	[yzapps@00VMTL-FabricPeer-172-19-102-64 alertmanager-0.17.0.linux-amd64]$
	
现在就需要根据业务的需求对配置文件进行修改。先把修改后的内容列出来，然后再讲解

	global:
	  resolve_timeout: 5m
	  smtp_smarthost: 'smtp.yingzi.com:25'
	  smtp_from: 'blockchain@yingzi.com'
	  smtp_auth_username: 'blockchain@yingzi.com'
	  smtp_auth_password: 'rTfb7nShI2y'
	  smtp_require_tls: false

	route:
	  group_by: ['alertname']
	  group_wait: 10s
	  group_interval: 10s
	  repeat_interval: 1h
	  receiver: 'team-blockchain-mails'
	receivers:
	- name: 'team-blockchain-mails'
	  email_configs:
	  - to: 'linke@yingzi.com'
		require_tls: false
	inhibit_rules:
	  - source_match:
		  severity: 'critical'
		target_match:
		  severity: 'warning'
		equal: ['alertname', 'dev', 'instance']

其中关键的配置如下：

* smtp_smarthost：用于发送电子邮件的默认SMTP smarthost，包括端口号。这里smtp.yingzi.com:25就是邮件服务器的地址和端口。

* smtp_from：The default SMTP From header field.我就设置为和smtp_auth_username相同的值，也就是用来发送告警邮件的邮箱账号。

* smtp_auth_username：用来发送告警邮件的邮箱账号。

* smtp_auth_password：邮箱账号的密码。

* smtp_require_tls：SMTP TLS需求，默认是true，也就是需要tls，这样的话就需要提供tls证书以及CA证书，配置难度较高。暂且把这个值设置为false，即不需要tls。但是需要注意的是，即使这个地方设置为false，如果邮箱服务器端强制blockchain@yingzi.com这个邮箱必须用tls登录，那么会遇到如下错误，发送不了邮件

	  level=error ts=2019-05-15T09:41:43.329538201Z caller=dispatch.go:264 component=dispatcher msg="Notify for alerts failed" num_alerts=1 err="x509: certificate signed by unknown authority"
	
  这时需要在邮箱服务器端把这个邮箱地址配置为可以不使用tls
	
  如果失败的次数过多，还会出现以下错误

	  level=error ts=2019-05-15T11:43:23.280133627Z caller=dispatch.go:264 component=dispatcher msg="Notify for alerts failed" num_alerts=1 err="554 IP<172.19.102.64> is rejected: 0."
	
  这说明该IP验证失败次数过多，被临时禁止连接，请检查验证信息设置。这时需要在邮箱服务器端把这个邮箱地址加入白名单。

* group_by：用来聚合告警的标签，可以设置为一个或者多个。此处alertname是一个特殊的label，每个告警都有这个label。其就是对应prometheus的alert_rules.yml的groups.rules.alert的值。补充知识：每个alert都有很多自定义的label，可用于路由和分组等等，比如service，cluster，instance，database，owner等等，是自定义的。

* group_wait：初始等待多长时间才能发送一组告警的一条通知。允许等待一个抑制告警到达或为同一组告警收集更多的初始告警。(通常是0s到几分钟。)。这里设置为10s，意思就是当一个告警产生之后，等待10s再发出一条通知，比如发送一封邮件给相关运维人员。

* group_interval：在为一组告警发送一条初始通知之后，如果有新的告警又加入这个告警组，在为新加入的告警发送一条通知之前，需要等待多长时间(一般约5m或以上)。默认是5m。

* repeat_interval：如果已为一个告警成功发送一条通知，则需要等待多长时间才能再次发送一条通知。(通常~3h或以上)。

* receiver：告警的接收者，指向receivers中的一个name

* receivers：通知接收者的一个列表，里面可以配置很多receiver，比如告警发送给哪个邮箱地址。

* inhibit_rules：抑制规则的一个列表。比如这里配置的就是当两个告警的三个label 'alertname', 'dev', 'instance'都相等时，critical的告警会抑制warning的告警。

### 1.3.启动alertmanager

通过如下命令启动alertmanager

	./alertmanager --config.file=<your_file>
	比如
	./alertmanager --config.file=alertmanager.yml
	
alertmanager启动之后，会在当前文件夹下生成一个data文件夹，用于存储告警数据。

	[yzapps@00VMTL-FabricPeer-172-19-102-64 alertmanager-0.17.0.linux-amd64]$ ll
	total 51688
	-rwxr-xr-x. 1 yzapps yzadmin 26856136 May  3 17:10 alertmanager
	-rw-r--r--. 1 yzapps yzadmin      604 May 15 19:41 alertmanager.yml
	-rwxr-xr-x. 1 yzapps yzadmin 22325499 May  3 17:11 amtool
	drwxr-xr-x. 2 yzapps yzadmin       35 May 16 22:27 data
	-rw-r--r--. 1 yzapps yzadmin    11357 May  3 17:45 LICENSE
	-rw-------. 1 yzapps yzadmin  3720624 May 15 21:20 nohup.out
	-rw-r--r--. 1 yzapps yzadmin      457 May  3 17:45 NOTICE
	
另外，如果还需要指定其他的启动参数，可以通过如下命令查看有些什么参数可以指定

	./alertmanager -h
	
### 1.4.查看alertmanager当前已有的告警

请注意，在alertmanager的文件夹下有一个脚本amtool，这个脚本就可以和alertmanager交互，比如可通过如下命令查看alertmanager当前已有的告警

	[yzapps@00VMTL-FabricPeer-172-19-102-64 alertmanager-0.17.0.linux-amd64]$ ./amtool alert
	Alertname                                          Starts At                Summary                                                      
	grpc_server_stream_request_duration_avg_too_large  2019-05-15 14:53:28 CST  grpc_server_stream_request_duration average value is too large
	[yzapps@00VMTL-FabricPeer-172-19-102-64 alertmanager-0.17.0.linux-amd64]$
  
