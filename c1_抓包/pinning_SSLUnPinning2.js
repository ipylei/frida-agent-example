const color = {};
color.black = "\x1b[30m";
color.red = "\x1b[31m";
color.green = "\x1b[32m";
color.yellow = "\x1b[33m";
color.blue = "\x1b[34m";
color.magenta = "\x1b[35m";
color.cyan = "\x1b[36m";
color.white = "\x1b[37m";

function printStack(tag = "") {
    let threadClz = Java.use("java.lang.Thread");
    let androidLogClz = Java.use("android.util.Log");
    let exceptionClz = Java.use("java.lang.Exception");

    let currentThread = threadClz.currentThread();
    let threadId = currentThread.getId();
    let threadName = currentThread.getName();
    let stackInfo = androidLogClz.getStackTraceString(exceptionClz.$new()).substring(20);

    let logContent = `${tag}--->threadId=>${threadId}, threadName=>${threadName}, stackInfo=>\n${stackInfo}`;
    console.log(logContent);

    //console.log(Java.use("android.util.Log").getStackTraceString(Java.use("java.lang.Exception").$new()))
}

function hook_checkServerTrusted_overloads(className) {
    let methodName = "checkServerTrusted";
    let fullMethodName = className + '.' + methodName;

    let Method = Java.use(className)[methodName];
    if(!Method){
        console.warn("不存在此方法！", fullMethodName);
        return;
    }

    let overloads = Method.overloads;
    for (let overload of overloads) {
        let paramName = '(';
        let tmpArray = [];
        // overload.argumentTypes获取该方法的参数类型
        for (let i = 0; i < overload.argumentTypes.length; i++) {
            // prot += overload.argumentTypes[i].className + ',';
            tmpArray.push(overload.argumentTypes[i].className);
        }
        paramName += tmpArray.join(", ");
        paramName += ')';
        let returnTypeName = overload.returnType.className;
        let fullNameWithParams = `${color.red}${returnTypeName} ${color.blue}${fullMethodName}${paramName}`;

        /*if (returnTypeName !== "void"){
            console.log(fullNameWithParams);
            continue;
        }*/

        console.log(`${color.green} Hooked `, fullNameWithParams);
        overload.implementation = function () {
            console.log(`${color.green} Called `, fullNameWithParams);
            printStack();
            if (returnTypeName !== "void") {
                return this[methodName].apply(this, arguments);
            }
        }
    }
}


function hook_verifyChain_overloads(className) {
    let methodName = "verifyChain";
    let fullMethodName = className + '.' + methodName;

    let Method = Java.use(className)[methodName];
    if(!Method){
        console.warn("不存在此方法！", fullMethodName);
        return;
    }

    let overloads = Method.overloads;
    for (let overload of overloads) {
        let paramName = '(';
        let tmpArray = [];
        // overload.argumentTypes获取该方法的参数类型
        for (let i = 0; i < overload.argumentTypes.length; i++) {
            // prot += overload.argumentTypes[i].className + ',';
            tmpArray.push(overload.argumentTypes[i].className);
        }
        paramName += tmpArray.join(", ");
        paramName += ')';
        let returnTypeName = overload.returnType.className;
        let fullNameWithParams = `${color.red}${returnTypeName} ${color.blue}${fullMethodName}${paramName}`;

        /*if (returnTypeName !== "void"){
            console.log(fullNameWithParams);
            continue;
        }*/

        console.log(`${color.green} Hooked `, fullNameWithParams);
        overload.implementation = function () {
            console.log(`${color.green} Called `, fullNameWithParams);
            printStack();
            return arguments[0];
        }
    }
}

function search_implementation_class(target_interface, package_name = "") {
    var all_target_class = new Set();
    Java.enumerateLoadedClasses({
        onComplete: function () {
        },

        onMatch: function (name, handle) {
            if (package_name && name.indexOf(package_name) < 0) {
                return;
            }
            var valid_class_list = [];
            try {
                var currentCls = Java.use(name);
                var parentClass;
                var status = false;
                while (true) {
                    // 遍历类实现的接口
                    let class_name = currentCls.$className;
                    valid_class_list.push(class_name);

                    let interfaceList = currentCls.class.getInterfaces();
                    for (let s_interface of interfaceList) {
                        var interface_name = s_interface.toString();
                        if (interface_name.indexOf(target_interface) > -1) {
                            console.log(`找到目标接口的实现类, 接口名:${interface_name}, 类名:${class_name}`);
                            status = true;
                            break;
                        }
                    }
                    // 继续去父类找
                    parentClass = currentCls.$super;
                    if (parentClass.$className === "java.lang.Object") {
                        if (status) {
                            for (let valid_class of valid_class_list) {
                                all_target_class.add(valid_class);
                            }
                        }
                        break;
                    }
                    currentCls = parentClass;
                }
            } catch (e) {
                // console.error(e.message);
            }

        }
    });

    console.log("结束, 结果如下 =======>");
    for (let item of all_target_class.values()) {
        console.log(item);
    }

}

function hook1() {
    Java.perform(function () {
        try {
            var TrustManagerImpl = Java.use('com.android.org.conscrypt.TrustManagerImpl');
            TrustManagerImpl.verifyChain.implementation = function (untrustedChain, trustAnchorChain, host, clientAuth, ocspData, tlsSctData) {
                console.log('[+] Bypassing TrustManagerImpl (Android > 7): ' + host);
                return untrustedChain;
            };
        } catch (err) {
            console.log('[-] TrustManagerImpl (Android > 7) pinner not found');
            //console.log(err);
        }
    })
}

function hook2() {
    Java.perform(function () {
        //hook_overloads("javax.net.ssl.X509ExtendedTrustManager");

        //hook_overloads("android.security.net.config.RootTrustManager");
        //hook_overloads("android.security.net.config.NetworkSecurityTrustManager");
        //hook_overloads("android.net.SSLCertificateSocketFactory$1");

        hook_checkServerTrusted_overloads("com.android.org.conscrypt.TrustManagerImpl"); //okhttp3
        hook_verifyChain_overloads("com.android.org.conscrypt.TrustManagerImpl"); //webView

    })
}

/*验证：
    1.证书链验证：实现接口：java.security.cert.X509Certificate
            比如：com.android.org.conscrypt.TrustManagerImpl.checkServerTrusted
            比如：com.android.org.conscrypt.TrustManagerImpl.verifyChain

    2.主机验证：实现接口：javax.net.ssl.HostnameVerifier
            比如：okhttp3.internal.tls.OkHostnameVerifier

    3.证书绑定：自定义证书绑定相关类
            比如：okhttp3.CertificatePinner.verify


    4.证书类：java.security.cert.Certificate
*/



/*
//第一步，先找到所有实现：javax.net.ssl.X509TrustManager
//第二步，hook实现类的checkServerTrusted方法，置为空，即默认都可信

如果以上都不行：
1.那么从调用栈中查找结果，或者hook File构造函数(参考:pinning_hook_File.js)查看调用栈，因为一般TLS握手和验证逻辑是放在一起的。
2.找到如下类的子类：
     java.security.cert.Certificate
     java.security.cert.X509Certificate

一定会实现.getPublicKey()、.verify()等方法，打印调用栈hook过掉即可。
 */
