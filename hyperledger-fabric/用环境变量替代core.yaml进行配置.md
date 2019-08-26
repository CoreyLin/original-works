# 用环境变量替代core.yaml进行配置

如果我们用docker compose启动一个peer，也就是说用docker容器启动peer，那么就不能直接使用core.yaml文件中的配置。那么如何才能使用或者覆盖core.yaml文件中的配置呢？

可以定义docker容器的环境变量来实现这一点。以core.yaml中定义的operations.listenAddress为例

![1.png](1.png)

我们在启动一个peer时，可以在docker compose yaml文件中定义一个环境变量，同样可以配置这个配置项

    CORE_OPERATIONS_LISTENADDRESS=127.0.0.1:9443

注意两点

* 全部为大写
* 用下划线隔开
* 对于core.yaml，即peer的配置来说，有CORE_前缀。如果是orderer.yaml，即orderer的配置，前缀为ORDERER_。
