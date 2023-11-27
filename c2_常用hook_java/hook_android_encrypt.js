/*
* Hook 系统类的所有加密相关方法
* */


function printStack() {
    console.log(Java.use("android.util.Log").getStackTraceString(Java.use("java.lang.Exception").$new()))
}

//hook 哈希/消息摘要算法
function hookMessageDigest() {
    let Base64 = Java.use('android.util.Base64');
    let ByteString = Java.use("com.android.okhttp.okio.ByteString");

    let md = Java.use('java.security.MessageDigest');
    md.getInstance.overload('java.lang.String').implementation = function (algorithm) {
        console.log(">>>>>======================================");
        console.log("算法名：" + algorithm);
        printStack();
        console.log("<<<<<======================================");
        return this.getInstance(algorithm);
    }
    md.getInstance.overload('java.lang.String', 'java.lang.String').implementation = function (algorithm, provider) {
        console.log(">>>>>======================================");
        console.log("算法名：" + algorithm);
        printStack();
        console.log("<<<<<======================================");
        return this.getInstance(algorithm, provider);
    }

    md.update.overload('[B').implementation = function (input) {
        console.log(">>>>>======================================");
        console.log("update:" + Java.use('java.lang.String').$new(input))
        printStack();
        console.log("<<<<<======================================");
        return this.update(input);
    }
    md.update.overload('[B', 'int', 'int').implementation = function (input, offset, len) {
        console.log(">>>>>======================================");
        console.log("update:" + Java.use('java.lang.String').$new(input) + "|" + offset + "|" + len);
        printStack();
        console.log("<<<<<======================================");
        return this.update(input, offset, len);
    }

    md.digest.overload().implementation = function () {
        console.log(">>>>>======================================");
        let result = this.digest();
        console.log("digest结果:" + ByteString.of(result).hex());
        console.log("digest结果:" + Base64.encodeToString(result, 0));
        printStack();
        console.log("<<<<<======================================");
        return result;
    }
    md.digest.overload('[B').implementation = function (input) {
        console.log(">>>>>======================================");
        let result = this.digest(input);
        console.log("digest参数:" + Java.use('java.lang.String').$new(input));
        console.log("digest结果:" + ByteString.of(result).hex());
        console.log("digest结果:" + Base64.encodeToString(result, 0));
        printStack();
        console.log("<<<<<======================================");
        return result;
    }
}

//hook Hmac算法
//Hmac算法总是和某种哈希算法配合起来用的。例如，我们使用MD5算法，对应的就是HmacMD5算法，它相当于“加盐”的MD5
function hookMac() {
    let Base64 = Java.use('android.util.Base64');
    let ByteString = Java.use("com.android.okhttp.okio.ByteString");
    let mac = Java.use('javax.crypto.Mac');

    mac.getInstance.overload('java.lang.String').implementation = function (algorithm) {
        console.log(">>>>>======================================");
        let result = this.getInstance(algorithm);
        console.log("算法名：" + algorithm);
        printStack();
        console.log("<<<<<======================================");
        return result;
    }

    mac.update.overload('[B').implementation = function (input) {
        console.log(">>>>>======================================");
        this.update(input);
        console.log("update:" + Java.use('java.lang.String').$new(input))
        printStack();
        console.log("<<<<<======================================");
    }
    mac.update.overload('[B', 'int', 'int').implementation = function (input, offset, len) {
        console.log(">>>>>======================================");
        this.update(input, offset, len)
        console.log("update:" + Java.use('java.lang.String').$new(input) + "|" + offset + "|" + len);
        printStack();
        console.log("<<<<<======================================");
    }

    mac.doFinal.overload().implementation = function () {
        console.log(">>>>>======================================");
        let result = this.doFinal();
        console.log("mac doFinal结果: |str  :" + Java.use('java.lang.String').$new(result));
        console.log("mac doFinal结果: |hex  :" + ByteString.of(result).hex());
        console.log("mac doFinal结果: |base64  :" + Base64.encodeToString(result, 0));
        printStack();
        console.log("<<<<<======================================");
        return result;
    }
    mac.doFinal.overload('[B').implementation = function (input) {
        console.log(">>>>>======================================");
        let result = this.doFinal(input);
        console.log("mac doFinal参数: |str  :" + Java.use('java.lang.String').$new(input));
        console.log("mac doFinal结果: |str  :" + Java.use('java.lang.String').$new(result));
        console.log("mac doFinal结果: |hex  :" + ByteString.of(result).hex());
        console.log("mac doFinal结果: |base64  :" + Base64.encodeToString(result, 0));
        printStack();
        console.log("<<<<<======================================");
        return result;
    }
}


//hook Hmac、AES的密钥生成；DES的密钥生成
function hookKeySpec() {
    let Base64 = Java.use('android.util.Base64');
    let ByteString = Java.use("com.android.okhttp.okio.ByteString");

    let secretKeySpec = Java.use('javax.crypto.spec.SecretKeySpec');
    secretKeySpec.$init.overload('[B', 'java.lang.String').implementation = function (key, algorithm) {
        console.log(">>>>>======================================");
        let result = this.$init(key, algorithm);
        console.log("算法名：" + algorithm + "|str密钥:" + Java.use('java.lang.String').$new(key));
        console.log("算法名：" + algorithm + "|Hex密钥:" + ByteString.of(key).hex());
        printStack();
        console.log("<<<<<======================================");
        return result;
    }


    let DESKeySpec = Java.use('javax.crypto.spec.DESKeySpec');
    DESKeySpec.$init.overload('[B').implementation = function (key) {
        console.log(">>>>>======================================");
        let result = this.$init(key);
        let bytes_key_des = this.getKey();
        console.log("des密钥  |str " + Java.use('java.lang.String').$new(bytes_key_des));
        console.log("des密钥  |hex " + ByteString.of(bytes_key_des).hex());
        printStack();
        console.log("<<<<<======================================");
        return result;
    }
    DESKeySpec.$init.overload('[B', 'int').implementation = function (key, offset) {
        console.log(">>>>>======================================");
        let result = this.$init(key, offset);
        let bytes_key_des = this.getKey();
        console.log("des密钥  |str " + Java.use('java.lang.String').$new(bytes_key_des));
        console.log("des密钥  |hex " + ByteString.of(bytes_key_des).hex());
        printStack();
        console.log("<<<<<======================================");
        return result;
    }
}

//hook RSA的公钥读取
function hookRSAKeySpec() {
    let Base64 = Java.use('android.util.Base64');
    let ByteString = Java.use("com.android.okhttp.okio.ByteString");

    //hook读取公钥
    let x509EncodedKeySpec = Java.use('java.security.spec.X509EncodedKeySpec');
    x509EncodedKeySpec.$init.overload('[B').implementation = function (encodedKey) {
        console.log(">>>>>======================================");
        let result = this.$init(encodedKey);
        console.log("RSA密钥:" + Base64.encodeToString(encodedKey, 0));
        printStack();
        console.log("<<<<<======================================");
        return result;
    }

    //根据n、e读取公钥
    let rSAPublicKeySpec = Java.use('java.security.spec.RSAPublicKeySpec');
    rSAPublicKeySpec.$init.overload('java.math.BigInteger', 'java.math.BigInteger').implementation = function (modulus, publicExponent) {
        console.log(">>>>>======================================");
        let result = this.$init(modulus, publicExponent);
        console.log("RSA密钥N:" + modulus.toString(16));
        console.log("RSA密钥E:" + publicExponent.toString(16));
        printStack();
        console.log("<<<<<======================================");
        return result;
    }

}

//hook AES加密算法等中的向量IV
function hookIvParameterSpec() {
    let Base64 = Java.use('android.util.Base64');
    let ByteString = Java.use("com.android.okhttp.okio.ByteString");

    let ivParameterSpec = Java.use('javax.crypto.spec.IvParameterSpec');
    ivParameterSpec.$init.overload('[B').implementation = function (iv) {
        console.log(">>>>>======================================");
        let result = this.$init(iv);
        console.log("iv向量: |str:" + Java.use('java.lang.String').$new(iv));
        console.log("iv向量: |hex:" + ByteString.of(iv).hex());
        printStack();
        console.log("<<<<<======================================");
        return result;
    }
}

//hook 对称加密、非对称加密算法的Cipher
function hookCipher() {
    let Base64 = Java.use('android.util.Base64');
    let ByteString = Java.use("com.android.okhttp.okio.ByteString");

    let ENCRYPT_MODE = 1;
    let DECRYPT_MODE = 2;

    let cipher = Java.use('javax.crypto.Cipher');
    //填充模式
    cipher.getInstance.overload('java.lang.String').implementation = function (transformation) {
        console.log(">>>>>======================================");
        let result = this.getInstance(transformation);
        console.log("模式填充:" + transformation);
        printStack();
        console.log("<<<<<======================================");
        return result;
    }
    //这里的init不是构造函数!
    cipher.init.overload('int', 'java.security.Key').implementation = function (mode, key) {
        console.log(">>>>>======================================");
        let result = this.init(mode, key);

        if (mode === ENCRYPT_MODE) {
            console.log("init  | 加密模式");
        } else if (mode === DECRYPT_MODE) {
            console.log("init  | 解密模式");
        } else {
            console.log("init | 未知的模式", mode)
        }
        let bytes_key = key.getEncoded();
        console.log("init key:" + "|密钥str:" + Java.use('java.lang.String').$new(bytes_key));
        console.log("init key: |密钥base64  :" + Base64.encodeToString(bytes_key, 0));
        console.log("init key:" + "|密钥Hex:" + ByteString.of(bytes_key).hex());
        printStack();
        console.log("<<<<<======================================");
        return result;
    }
    cipher.init.overload('int', 'java.security.cert.Certificate').implementation = function (mode, certificate) {
        console.log(">>>>>======================================");
        let result = this.init(mode, certificate);
        if (mode === ENCRYPT_MODE) {
            console.log("init  | 加密模式");
        } else if (mode === DECRYPT_MODE) {
            console.log("init  | 解密模式");
        } else {
            console.log("init | 未知的模式", mode)
        }
        printStack();
        console.log("<<<<<======================================");
        return result;
    }
    cipher.init.overload('int', 'java.security.Key', 'java.security.spec.AlgorithmParameterSpec').implementation = function (mode, key, params) {
        console.log(">>>>>======================================");
        let result = this.init(mode, key, params);
        if (mode === ENCRYPT_MODE) {
            console.log("init  | 加密模式");
        } else if (mode === DECRYPT_MODE) {
            console.log("init  | 解密模式");
        } else {
            console.log("init | 未知的模式", mode)
        }
        let bytes_key = key.getEncoded();
        console.log("init key:" + "|密钥str密钥:" + Java.use('java.lang.String').$new(bytes_key));
        console.log("init key: |密钥base64  :" + Base64.encodeToString(bytes_key, 0));
        console.log("init key:" + "|密钥Hex:" + ByteString.of(bytes_key).hex());
        printStack();
        console.log("<<<<<======================================");
        return result;
    }
    cipher.init.overload('int', 'java.security.cert.Certificate', 'java.security.SecureRandom').implementation = function (mode, certificate, random) {
        console.log(">>>>>======================================");
        let result = this.init(mode, certificate, random);
        if (mode === ENCRYPT_MODE) {
            console.log("init  | 加密模式");
        } else if (mode === DECRYPT_MODE) {
            console.log("init  | 解密模式");
        } else {
            console.log("init | 未知的模式", mode)
        }
        printStack();
        console.log("<<<<<======================================");
        return result;
    }
    cipher.init.overload('int', 'java.security.Key', 'java.security.SecureRandom').implementation = function (mode, key, random) {
        console.log(">>>>>======================================");
        printStack();
        let result = this.init(mode, key, random);
        if (mode === ENCRYPT_MODE) {
            console.log("init  | 加密模式");
        } else if (mode === DECRYPT_MODE) {
            console.log("init  | 解密模式");
        } else {
            console.log("init | 未知的模式", mode)
        }
        let bytes_key = key.getEncoded();
        console.log("init key:" + "|密钥str:" + Java.use('java.lang.String').$new(bytes_key));
        console.log("init key: |密钥base64  :" + Base64.encodeToString(bytes_key, 0));
        console.log("init key:" + "|密钥Hex:" + ByteString.of(bytes_key).hex());
        console.log("<<<<<======================================");
        return result;
    }
    cipher.init.overload('int', 'java.security.Key', 'java.security.AlgorithmParameters').implementation = function (mode, key, params) {
        console.log(">>>>>======================================");
        let result = this.init(mode, key, params);
        if (mode === ENCRYPT_MODE) {
            console.log("init  | 加密模式");
        } else if (mode === DECRYPT_MODE) {
            console.log("init  | 解密模式");
        } else {
            console.log("init | 未知的模式", mode)
        }
        let bytes_key = key.getEncoded();
        console.log("init key:" + "|密钥str:" + Java.use('java.lang.String').$new(bytes_key));
        console.log("init key: |密钥base64  :" + Base64.encodeToString(bytes_key, 0));
        console.log("init key:" + "|密钥Hex:" + ByteString.of(bytes_key).hex());
        printStack();
        console.log("<<<<<======================================");
        return result;
    }
    cipher.init.overload('int', 'java.security.Key', 'java.security.AlgorithmParameters', 'java.security.SecureRandom').implementation = function (mode, key, params, random) {
        console.log(">>>>>======================================");
        let result = this.init(mode, key, params, random);
        if (mode === ENCRYPT_MODE) {
            console.log("init  | 加密模式");
        } else if (mode === DECRYPT_MODE) {
            console.log("init  | 解密模式");
        } else {
            console.log("init | 未知的模式", mode)
        }

        let bytes_key = key.getEncoded();
        console.log("init key:" + "|密钥str:" + Java.use('java.lang.String').$new(bytes_key));
        console.log("init key: |密钥base64  :" + Base64.encodeToString(bytes_key, 0));
        console.log("init key:" + "|密钥Hex:" + ByteString.of(bytes_key).hex());
        printStack();
        console.log("<<<<<======================================");
        return result;
    }
    cipher.init.overload('int', 'java.security.Key', 'java.security.spec.AlgorithmParameterSpec', 'java.security.SecureRandom').implementation = function (mode, key, params, random) {
        console.log(">>>>>======================================");
        let result = this.update(mode, key, params, random);
        if (mode === ENCRYPT_MODE) {
            console.log("init  | 加密模式");
        } else if (mode === DECRYPT_MODE) {
            console.log("init  | 解密模式");
        } else {
            console.log("init | 未知的模式", mode)
        }
        let bytes_key = key.getEncoded();
        console.log("init key:" + "|密钥str:" + Java.use('java.lang.String').$new(bytes_key));
        console.log("init key: |密钥base64  :" + Base64.encodeToString(bytes_key, 0));
        console.log("init key:" + "|密钥Hex:" + ByteString.of(bytes_key).hex());
        printStack();
        console.log("<<<<<======================================");
        return result;
    }

    cipher.update.overload('[B').implementation = function (input) {
        console.log(">>>>>======================================");
        let result = this.update(input);
        console.log("update:" + Java.use('java.lang.String').$new(input));
        printStack();
        console.log("<<<<<======================================");
        return result;
    }
    cipher.update.overload('[B', 'int', 'int').implementation = function (input, inputOffset, inputLen) {
        console.log(">>>>>======================================");
        let result = this.update(input, inputOffset, inputLen);
        console.log("update:" + Java.use('java.lang.String').$new(input) + "|" + inputOffset + "|" + inputLen);
        printStack();
        console.log("<<<<<======================================");
        return result;
    }

    cipher.doFinal.overload().implementation = function () {
        console.log(">>>>>======================================");
        let result = this.doFinal();
        console.log("doFinal结果: |str  :" + Java.use('java.lang.String').$new(result));
        console.log("doFinal结果: |hex  :" + ByteString.of(result).hex());
        console.log("doFinal结果: |base64  :" + Base64.encodeToString(result, 0));
        printStack();
        console.log("<<<<<======================================");
        return result;
    }
    cipher.doFinal.overload('[B').implementation = function (input) {
        console.log(">>>>>======================================");
        let result = this.doFinal(input);
        console.log("doFinal参数: |str  :" + Java.use('java.lang.String').$new(input));
        console.log("doFinal参数: |base64  :" + Base64.encodeToString(input, 0));
        console.log("doFinal结果: |str  :" + Java.use('java.lang.String').$new(result));
        console.log("doFinal结果: |hex  :" + ByteString.of(result).hex());
        console.log("doFinal结果: |base64  :" + Base64.encodeToString(result, 0));
        printStack();
        console.log("<<<<<======================================");
        return result;
    }
}

//hook 系统内建的 编码算法、消息摘要算法、对称加密、非对称加密算法
function hookBuiltInAlgorithm() {
    Java.perform(function () {
        console.log('start hooking');

        //hook 哈希/消息摘要算法
        hookMessageDigest();
        //hook Hmac算法
        hookMac();

        //hook Hmac、AES的密钥生成；DES的密钥生成
        hookKeySpec();
        //hook RSA的公钥读取
        hookRSAKeySpec();
        //hook AES加密算法等中的向量IV
        hookIvParameterSpec();

        //hook 对称加密、非对称加密算法的Cipher
        hookCipher();

    })
}


// setImmediate(hookBuiltInAlgorithm)