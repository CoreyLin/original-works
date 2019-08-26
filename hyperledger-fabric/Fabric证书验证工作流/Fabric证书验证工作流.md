# x.509证书验证流程

## 前置知识

一个证书包含几个重要的部分

1. 证书主体，即证书的内容，即TBSCertificate字段。证书主体里包含很多子字段，比如subjectPublicKeyInfo，Issuer，Subject等等。证书绑定了一个公钥（subjectPublicKeyInfo）到一个identity（Subject）

2. 签名算法，即CA用什么算法对end entity的证书进行签名的，也就是signatureAlgorithm字段，比如RSAwithSHA1，id-ecdsa-with-SHAKE128，id-ecdsa-with-SHAKE256。

3. 加密的数字签名，此签名是先对证书主体计算哈希（比如用SHA1算法），注意，计算哈希不需要使用CA的私钥或公钥；然后CA用自己的私钥对哈希进行签名，签名的意思就是CA用自己的私钥对哈希进行加密（比如RSA算法，注：RSA私钥加密，就需要用公钥解密），简单说，签名就是先计算证书的哈希，然后用私钥加密，加密的数字签名就是用私钥加密的哈希。最后得到的数字签名就是一个对证书主体的加密哈希


## 验证流程

1. 取end entity证书的签名体，即signatureValue字段，此签名体是由CA的私钥加过密的

2. 取end entity证书的signatureAlgorithm字段，确定是用什么算法对证书进行签名的，典型的算法例如RSAwithSHA1，id-ecdsa-with-SHAKE128，id-ecdsa-with-SHAKE256。

3. 根据第2步得到的算法，取end entity证书的主体，即证书的内容，也就是TBSCertificate字段的内容，对其做hash运算，得到一个hash值

4. 取end entity证书的TBSCertificate.issuer字段，即证书发行者名称。

5. 根据第4步的issuer，找已知的CA的证书，issuer名称必须和CA证书的TBSCertificate.subject（即CA证书的名称）匹配

6. 找到匹配的CA证书之后，从CA证书中取公钥，即TBSCertificate.subjectPublicKeyInfo字段，取出来是一个RSA公钥或者ECDSA公钥

7. 用CA的公钥来对end entity证书的签名进行解密，即对signatureValue字段进行解密，得到未加密的签名，此签名是一个hash

8. 把第3步和第7步的两个hash做比较，看是否相等。如果相等，说明这个end entity的证书包含由这个CA数字签名的信息，这个end entity是由这个CA颁发的，验证成功

**总之，验证流程是很缜密的，验证流程需要CA的证书，没有CA的证书，无法完成对end entity证书的验证。**

## 参考资料

https://tools.ietf.org/html/rfc5280

https://tools.ietf.org/id/draft-ietf-lamps-pkix-shake-08.html
