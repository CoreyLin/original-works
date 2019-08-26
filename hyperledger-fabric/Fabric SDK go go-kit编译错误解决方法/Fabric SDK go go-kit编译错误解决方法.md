# not enough arguments in call to s.statsd.SendLoop

在用Fabric SDK Go写代码之后，如果遇到如下编译错误

	# github.com/hyperledger/fabric-sdk-go/internal/github.com/hyperledger/fabric/core/operations
	..\..\..\..\github.com\hyperledger\fabric-sdk-go\internal\github.com\hyperledger\fabric\core\operations\system.go:227:23: not enough arguments in call to s.statsd.SendLoop
		have (<-chan time.Time, string, string)
		want (context.Context, <-chan time.Time, string, string)

	Compilation finished with exit code 2
	
这是因为$GOPATH/src/github.com/go-kit/kit/metrics/statsd/statsd.go:114的master分支是声明的四个参数

	func (s *Statsd) SendLoop(ctx context.Context, c <-chan time.Time, network, address string) {
		s.WriteLoop(ctx, c, conn.NewDefaultManager(network, address, s.logger))
	}
	
但是$GOPATH/src/github.com/hyperledger/fabric-sdk-go/internal/github.com/hyperledger/fabric/core/operations/system.go:227只传了三个参数进去

	go s.statsd.SendLoop(s.sendTicker.C, network, address)
	
## 解决的办法

进入$GOPATH/src/github.com/go-kit/kit/目录，执行以下命令即可

	cd $GOPATH/src/github.com/go-kit/kit
	git fetch --tags
	git checkout v0.8.0

v0.8.0的SendLoop函数就只有三个参数

	func (s *Statsd) SendLoop(c <-chan time.Time, network, address string) {
		s.WriteLoop(c, conn.NewDefaultManager(network, address, s.logger))
	}
	
参考资料： https://stackoverflow.com/questions/55811937/getting-error-not-enough-arguments-in-call-to-s-statsd-sendloop-when-running

2019.5.29
