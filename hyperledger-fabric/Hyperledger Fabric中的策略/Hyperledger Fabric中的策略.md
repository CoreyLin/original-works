# Hyperledger Fabric中的策略

一个Hyperledger Fabric区块链网络的配置由策略管理。这些策略通常驻留在通道配置中。本文档的主要目的是解释如何在通道配置中定义策略以及策略如何与通道进行交互。但是，策略也可以在其他一些地方指定，比如链码，因此这些信息可能超出了通道配置的范围。

## 什么是策略？

在最基本的层次上，策略是一个函数，它接受一组带签名的数据作为输入并成功计算，或者返回一个错误，因为带签名的数据的某些方面不满足策略。

更具体地说，策略测试某些数据的一个签名者或多个签名者是否满足某些条件，以便将这些签名视为“合法”。这对于确定正确的各方（各组织）是否同意进行一个交易或更改非常有用。

例如，一个策略可以定义以下任何一种:

* 来自5个不同组织中的2个的管理员必须对数据签名。

* 任何组织的任何成员都必须对数据签名。

* 两个特定的证书必须同时对数据签名。

当然，这些只是示例，还可以构造其他更强大的规则。

## 策略类型

目前实现的政策有两种:

1. **SignaturePolicy**: 这种策略类型是最强大的，它将策略指定为MSP主体（Principals）的评估规则的组合。它支持AND、OR和NOutOf的任意组合，允许构造非常强大的规则，比如:“org A的一个管理员和2个其他管理员，或者20个org管理员中的11个”。

2. **ImplicitMetaPolicy**:这种策略类型不如SignaturePolicy灵活，只在配置上下文中有效。它聚合了深在配置架构中的评估策略的结果，这些评估策略最终由SignaturePolicies定义。它支持良好的默认规则，比如“大多数组织管理员策略”。

策略是在一个**common.Policy** message中编码的，common.Policy message在**fabric/protos/common/policies.proto**中定义。它们由以下message定义:

	message Policy {
		enum PolicyType {
			UNKNOWN = 0; // Reserved to check for proper initialization
			SIGNATURE = 1;
			MSP = 2;
			IMPLICIT_META = 3;
		}
		int32 type = 1; // For outside implementors, consider the first 1000 types reserved, otherwise one of PolicyType
		bytes policy = 2;
	}

要对策略进行编码，只需选择**SIGNATURE**或**IMPLICIT_META**作为策略类型，将其设置为type字段，并将相应的策略实现原型marshal到**policy**。

## 配置和策略

通道配置表示为很多配置组的一个层次结构，每个配置组都有一组与之关联的值和策略。对于具有两个应用程序组织和一个排序组织的合法配置的应用程序通道，通道配置看起来最少如下:

	Channel:
		Policies:
			Readers
			Writers
			Admins
		Groups:
			Orderer:
				Policies:
					Readers
					Writers
					Admins
				Groups:
					OrdereringOrganization1:
						Policies:
							Readers
							Writers
							Admins
			Application:
				Policies:
					Readers
	----------->    Writers
					Admins
				Groups:
					ApplicationOrganization1:
						Policies:
							Readers
							Writers
							Admins
					ApplicationOrganization2:
						Policies:
							Readers
							Writers
							Admins
							
考虑上面示例中使用**------->**标记引用的Writers策略。此策略可以通过简写符号**/Channel/Application/Writers**引用。注意，与目录组件相似的元素是组名，而与一个文件basename相似的最后一个组件是策略名。

系统的不同组件将引用这些策略名称。例如，要调用orderer上的**Deliver**，请求上的签名必须满足**/Channel/Readers**策略。然而，向一个peer gossip一个区块需要满足**/Channel/Application/Readers**策略。

通过设置这些不同的策略，系统可以配置丰富的访问控制。

## 构建一个SignaturePolicy

与所有策略一样，SignaturePolicy表示为protobuf。

