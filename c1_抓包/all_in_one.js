/*

分别从Java层、Native层
    HOOK Android 系统底层， TCP、UDP、HTTP(S)
*/


//function printStack() {
//    console.log(Java.use("android.util.Log").getStackTraceString(Java.use("java.lang.Exception").$new()))
//}

function printStack(tag = "") {
    let threadClz = Java.use("java.lang.Thread");
    let androidLogClz = Java.use("android.util.Log");
    let exceptionClz = Java.use("java.lang.Exception");

    let currentThread = threadClz.currentThread();
    let threadId = currentThread.getId();
    let threadName = currentThread.getName();
    let stackInfo = androidLogClz.getStackTraceString(exceptionClz.$new()).substring(20);

    let logContent = `${tag}\n--->threadId=>${threadId}, threadName=>${threadName}, stackInfo=>\n${stackInfo}`;
    console.log(logContent);

    //console.log(Java.use("android.util.Log").getStackTraceString(Java.use("java.lang.Exception").$new()))
}

var printJavaStack = printStack;

//将java的数组转换成js的数组
function byte_to_ArrayBuffer(bytes) {
    var size = bytes.length;
    var tmparray = [];
    for (var i = 0; i < size; i++) {
        var val = bytes[i];
        if (val < 0) {
            val += 256;
        }
        tmparray[i] = val
    }
    return tmparray;
}

//将java数组转换成c++的byte[]。并且hexdump打印结果
function print_bytes(bytes, size) {
    var buf = Memory.alloc(bytes.length);
    Memory.writeByteArray(buf, byte_to_ArrayBuffer(bytes));
    console.log(hexdump(buf, {offset: 0, length: size, header: false, ansi: true}));
}


//打印Socket连接信息：在JNI层
//SSL_write(long sslNativePointer, FileDescriptor fd, SSLHandshakeCallbacks shc, byte[] b, int off, int len, int writeTimeoutMillis)
//SSL_read(long sslNativePointer, FileDescriptor fd, SSLHandshakeCallbacks shc, byte[] b, int off, int len, int readTimeoutMillis)
function getSocketData(fd) {
    // console.log("fd:",fd);
    var socketType = Socket.type(fd)
    if (socketType != null) {
        var res = "type:" + socketType + ",loadAddress:" + JSON.stringify(Socket.localAddress(fd)) + ",peerAddress" + JSON.stringify(Socket.peerAddress(fd));
        return res;
    } else {
        return "type:" + socketType;
    }
}

//打印Socket连接信息：在Java层
function getSocketData2(stream) {
    var data0 = stream.this$0.value;
    var sockdata = data0.socket.value;
    return sockdata;
}


function getip(ip_ptr) {
    var result = ptr(ip_ptr).readU8() + "." + ptr(ip_ptr.add(1)).readU8() + "." + ptr(ip_ptr.add(2)).readU8() + "." + ptr(ip_ptr.add(3)).readU8()
    return result;
}

function getudpaddr(addrptr) {
    var port_ptr = addrptr.add(2);
    var port = ptr(port_ptr).readU8() * 256 + ptr(port_ptr.add(1)).readU8();
    var ip_ptr = addrptr.add(4);
    var ip_addr = getip(ip_ptr);
    return "peer:" + ip_addr + "--port:" + port;
}


// 1.1 TCP java层hook (Android 8.1.0、Android 10)
// java.net.Socket$init(ip,port) 获取ip和端口
// socketWrite0(FileDescriptor fd, byte[] b, int off,int len) 获取发送的数据
// socketRead0(FileDescriptor fd, byte b[], int off, int len,int timeout) 获取接受的数据
function hook_tcp_java() {
    var socketClass = Java.use("java.net.Socket");
    socketClass.$init.overload('java.net.InetAddress', 'int').implementation = function (ip, port) {
        console.log("socket$init ", ip, ":", port);
        return this.$init(ip, port);
    };

    //发送
    var outputClass = Java.use("java.net.SocketOutputStream");
    outputClass.socketWrite0.implementation = function (fd, buff, off, len) {
        console.log("tcp write fd:", fd);
        //console.log(this.socket.value.getLocalAddress());
        //console.log(this.socket.value.getLocalPort());
        //console.log(this.socket.value.getRemoteSocketAddress());
        //console.log(this.socket.value.getPort());

        printStack("hook_tcp_java send--->");
        print_bytes(buff, len);
        return this.socketWrite0(fd, buff, off, len);
    };
    //接收
    var inputClass = Java.use("java.net.SocketInputStream");
    inputClass.socketRead0.implementation = function (fd, buff, off, len, timeout) {
        var res = this.socketRead0(fd, buff, off, len, timeout);
        console.log("tcp read fd:", fd);
        //console.log(this.socket.value.getLocalAddress());
        //console.log(this.socket.value.getLocalPort());
        //console.log(this.socket.value.getRemoteSocketAddress());
        //console.log(this.socket.value.getPort());
        printStack("hook_tcp_java receive--->");
        print_bytes(buff, res);
        return res;
    };
}

// 1.2 UDP java层hook (Android 8.1.0)
// private native int sendtoBytes(FileDescriptor fd, Object buffer, int byteOffset, int byteCount, int flags, InetAddress inetAddress, int port) throws ErrnoException, SocketException;
// private native int sendtoBytes(FileDescriptor fd, Object buffer, int byteOffset, int byteCount, int flags, SocketAddress address) throws ErrnoException, SocketException;
// private native int recvfromBytes(FileDescriptor fd, Object buffer, int byteOffset, int byteCount, int flags, InetSocketAddress srcAddress) throws ErrnoException, SocketException;
function hook_udp_java() {
    var LinuxClass = Java.use("libcore.io.Linux");
    LinuxClass.sendtoBytes.overload('java.io.FileDescriptor', 'java.lang.Object', 'int', 'int', 'int', 'java.net.SocketAddress').implementation = function () {
        var result = this.sendtoBytes.apply(this, arguments);
        console.log("sendtoBytes1", arguments[5]);
        var arg1 = arguments[1];
        var bytearray = Java.array('byte', arg1);
        print_bytes(bytearray, result);
        return result;

    }
    //发送
    LinuxClass.sendtoBytes.overload('java.io.FileDescriptor', 'java.lang.Object', 'int', 'int', 'int', 'java.net.InetAddress', 'int').implementation = function () {
        var result = this.sendtoBytes.apply(this, arguments);
        console.log("sendtoBytes2", arguments[5], arguments[6]);
        var arg1 = arguments[1];
        var bytearray = Java.array('byte', arg1);
        print_bytes(bytearray, result);
        return result;
    }
    //接收
    LinuxClass.recvfromBytes.implementation = function () {
        var result = this.recvfromBytes.apply(this, arguments);
        console.log("recvfromBytes", arguments[5]
        );
        var arg1 = arguments[1];
        var bytearray = Java.array('byte', arg1);
        print_bytes(bytearray, result);
        return result;
    }

}

// 1.3 TCP\UDP\HTTP JNI层hook (Android 8.1.0)
function hook_jni_tcp_udp() {
    var sendtoPtr = Module.getExportByName("libc.so", "sendto");
    var recvfromPtr = Module.getExportByName("libc.so", "recvfrom");
    console.log("sendto:", sendtoPtr, ",recvfrom:", recvfromPtr);

    //sendto(int fd, const void *buf, size_t n, int flags, const struct sockaddr *addr, socklen_t addr_len)
    Interceptor.attach(sendtoPtr, {
        onEnter: function (args) {
            var fd = args[0];
            var buff = args[1];
            var size = args[2];

            var addr = args[4];
            var sockdata = getSocketData(fd.toInt32());
            if ((sockdata.indexOf("tcp") != -1) || (sockdata.indexOf("udp") != -1)) {
                console.log(sockdata);
                console.log(hexdump(buff, {length: size.toInt32()}));
                if (sockdata.indexOf("udp") != -1) {
                    console.log(getudpaddr(addr));
                }
            }
        },
        onLeave: function (retval) {
        }
    });

    //recvfrom(int fd, void *buf, size_t n, int flags, struct sockaddr *addr, socklen_t *addr_len)
    Interceptor.attach(recvfromPtr, {
        onEnter: function (args) {
            this.fd = args[0];
            this.buff = args[1];
            this.size = args[2];
            this.addr = args[4];
        },
        onLeave: function (retval) {
            var sockdata = getSocketData(this.fd.toInt32());
            if ((sockdata.indexOf("tcp") != -1) || (sockdata.indexOf("udp") != -1)) {
                console.log(sockdata);
                console.log(hexdump(this.buff, {length: retval.toInt32()}));
                if (sockdata.indexOf("udp") != -1) {
                    console.log(getudpaddr(this.addr));
                }
            }

        }
    });
}


//TODO 以下是ssl抓包相关
/*
http://androidxref.com/8.1.0_r33/xref/external/conscrypt/common/src/main/java/org/conscrypt/ConscryptFileDescriptorSocket.java -> write(byte[] buf,
 http://androidxref.com/8.1.0_r33/xref/external/conscrypt/common/src/main/java/org/conscrypt/SslWrapper.java ->   SSL_write(long sslNativePointer
   http://androidxref.com/8.1.0_r33/xref/external/conscrypt/common/src/main/java/org/conscrypt/NativeCrypto.java ->   static native void SSL_write(long sslNativePointer
    http://androidxref.com/8.1.0_r33/xref/external/conscrypt/common/src/jni/main/cpp/NativeCrypto.cpp -> static void NativeCrypto_SSL_write(
     http://androidxref.com/8.1.0_r33/xref/external/conscrypt/common/src/jni/main/cpp/NativeCrypto.cpp#sslWrite
      http://androidxref.com/8.1.0_r33/xref/external/boringssl/src/ssl/ssl_lib.cc#752 -> int SSL_write(SSL *ssl, const void *buf, int num
       http://androidxref.com/8.1.0_r33/xref/external/boringssl/src/ssl/s3_pkt.cc#192 -> int ssl3_write_app_data(
        http://androidxref.com/8.1.0_r33/xref/external/boringssl/src/ssl/s3_pkt.cc#do_ssl3_write ->
        # 明文终点了
*/
// 3.1 SSL java层hook(最底层) (Android 10; 8.1.0)
// 实际它们才是java层的最底层，但是这个hook点不好获取socket连接的服务器ip地址和端口，
// 故选择了hook_ssl2_java()中的hook点
function hook_ssl_java_nosocketinfo() {
    var NativeCryptoClass = Java.use("com.android.org.conscrypt.NativeCrypto");
    NativeCryptoClass.SSL_write.implementation = function (sslPtr, fd, shc, b, off, len, timeout) {
        print_bytes(b, len);
        //console.log("enter SSL_write");
        printStack("===>enter SSL_write");
        return this.SSL_write(sslPtr, fd, shc, b, off, len, timeout);
    };
    NativeCryptoClass.SSL_read.implementation = function (sslPtr, fd, shc, b, off, len, timeout) {
        //console.log("enter SSL_read");
        var res = this.SSL_read(sslPtr, fd, shc, b, off, len, timeout);
        print_bytes(b, res);
        printStack("===>enter SSL_read");
        return res;
    };
}

// 3.2 SSL java层hook(建议版) (ip和端口该对象this里面) Android 8.1.0
//SSLOutputStream  write(byte[] buf, int offset, int byteCount)
//SSLInputStream   read(byte[] buf, int offset, int byteCount)
function hook_ssl2_java() {
    var SSLOutputClass = Java.use("com.android.org.conscrypt.ConscryptFileDescriptorSocket$SSLOutputStream");
    SSLOutputClass.write.overload('[B', 'int', 'int').implementation = function (buf, off, cnt) {
        console.log("---", getSocketData2(this)); //1.打印socket信息
        print_bytes(buf, cnt); //2.打印数据信息
        printStack("===>hook_ssl2_java send--->");  //3.最后打印调用堆栈
        return this.write(buf, off, cnt);
    };
    var SSLInputClass = Java.use("com.android.org.conscrypt.ConscryptFileDescriptorSocket$SSLInputStream");
    SSLInputClass.read.overload('[B', 'int', 'int').implementation = function (buf, off, cnt) {
        var res = this.read(buf, off, cnt);
        console.log("---", getSocketData2(this)); //1.再打印socket信息
        print_bytes(buf, res); //2.先打印数据信息
        printStack("===>hook_ssl2_java receive--->"); //3.最后打印调用堆栈
        return res;
    }
}

// 3.3 SSL JNI层hook(jni的ssl明文数据hook) (Android 8.1.0)
function hook_jni_ssl() {
    var sslWritePtr = Module.getExportByName("libssl.so", "SSL_write");
    var sslReadPtr = Module.getExportByName("libssl.so", "SSL_read");
    console.log("sslWrite:", sslWritePtr, ",sslRead:", sslReadPtr);
    var sslGetFdPtr = Module.getExportByName("libssl.so", "SSL_get_rfd");
    var sslGetFdFunc = new NativeFunction(sslGetFdPtr, 'int', ['pointer']);

    //int SSL_write(SSL *ssl, const void *buf, int num)
    Interceptor.attach(sslWritePtr, {
        onEnter: function (args) {
            var sslPtr = args[0];
            var buff = args[1];
            var size = ptr(args[2]).toInt32();
            if (size > 0) {
                var fd = sslGetFdFunc(sslPtr);
                var sockdata = getSocketData(fd);
                //ddd = this;
                // console.log("SSL_write", ddd==this, this, ddd);

                console.log("SSL_write", sockdata);
                console.log(hexdump(buff, {length: size}));
                console.log("\n\n");
                // console.log('RegisterNatives called from:\n' + Thread.backtrace(this.context, Backtracer.ACCURATE).map(DebugSymbol.fromAddress).join('\n') + '\n');
            }
        },
        onLeave: function (retval) {

        }
    });
    //int SSL_read(SSL *ssl, void *buf, int num)
    Interceptor.attach(sslReadPtr, {
        onEnter: function (args) {
            this.sslPtr = args[0];
            this.buff = args[1];
            this.size = args[2];
        },
        onLeave: function (retval) {
            var size = retval.toInt32();
            if (size > 0) {
                var fd = sslGetFdFunc(this.sslPtr);
                var sockdata = getSocketData(fd);
                // console.log("SSL_read", this==ddd, this, ddd);

                console.log("SSL_read", sockdata);
                console.log(hexdump(this.buff, {length: size}));
                console.log("\n\n");
                // console.log('RegisterNatives called from:\n' + Thread.backtrace(this.context, Backtracer.ACCURATE).map(DebugSymbol.fromAddress).join('\n') + '\n');
            }

        }
    });
}

// 3.4 SSL JNI层hook(jni的ssl的加密数据hook) (Android 8.1.0)
// 针对于自编译SSL_Write，但还是用libc.so库的情况，这样就可以继续跟踪堆栈到自编译SSL_Write那一层
function hook_jni_ssl_enc() {
    var writePtr = Module.getExportByName("libc.so", "write");
    var readPtr = Module.getExportByName("libc.so", "read");
    console.log("write:", writePtr, ",read:", readPtr);
    Interceptor.attach(writePtr, {
        onEnter: function (args) {
            var fd = args[0];
            var buff = args[1];
            var size = args[2];
            var sockdata = getSocketData(fd.toInt32());
            if (sockdata.indexOf("tcp") != -1) {
                console.log(sockdata);
                console.log(hexdump(buff, {length: size.toInt32()}));
            }
        },
        onLeave: function (retval) {

        }
    });
    Interceptor.attach(readPtr, {
        onEnter: function (args) {
            this.fd = args[0];
            this.buff = args[1];
            this.size = args[2];
        },
        onLeave: function (retval) {
            var sockdata = getSocketData(this.fd.toInt32());
            if (sockdata.indexOf("tcp") != -1) {
                console.log(sockdata);
                console.log(hexdump(this.buff, {length: this.size.toInt32()}));
            }
        }
    });
}


function main() {
    hook_strstr();

    /* hook到内容后，就可以在java层hook函数中去打印调用栈 */

    //TCP\HTTP\UDP java层hook
    // hook_tcp_java();
    // hook_udp_java();

    /* TCP/UDP/HTTP native层hook */
    // hook_jni_tcp_udp();

    /* SSL Java层hook */
    // hook_ssl_java_nosocketinfo(); // 实际它们才是java层的最底层，但是这个hook点不好获取socket连接的服务器ip地址和端口，所以选择了hook_ssl2_java()
    //hook_ssl2_java();

    /* SSL Native层hook */
    //hook_jni_ssl();  //明文hook
    //hook_jni_ssl_enc(); //密文hook，针对于自编译SSL_Write，但还是用libc.so库的情况

    //getFullName("SSLOutputStream");
}

setImmediate(main);


//TODO 以下是检测相关

//hook线程追踪
function hook_thread() {
    Java.perform(function () {
        var Thread = Java.use("java.lang.Thread");

        // 线程初始化
        //1.Thread构造函数传入一个Runnable接口
        //2.派生类(继承Thread)->覆写run方法
        Thread.init.implementation = function (arg0, arg1, arg2, arg3) {
            var res = this.init(arg0, arg1, arg2, arg3);
            var threadid = this.getId();

            var target = this.target.value;
            if (target) {
                let className = target.$className;
                //console.log("\n****** Runnable init, classname ==>", className, threadid);
                //printJavaStack("****** Runnable " + threadid);

                //(1.Thread构造函数传入一个Runnable接口)线程创建时的信息，及创建该线程时的调用栈
                let tag = `****** Runnable init, classname:${className}, NewThreadID:${threadid}`;
                printJavaStack(tag)
            } else {
                let className = this.$className;
                //console.log("\n****** The Thread classname ==>", className, threadid);
                //printJavaStack("****** The Thread " + threadid);

                //(2.派生类->继承Thread)线程创建时的信息，及创建该线程时的调用栈
                let tag = `****** Runnable |init|, classname:${className}, NewThreadID:${threadid}`;
                printJavaStack(tag)
            }

            return res;
        }

        // 线程执行
        Thread.run.implementation = function () {
            var threadid = this.getId();
            var className = this.$className;
            console.log("////// The Thread run, classname ==>", className, threadid, '\n\n\n');
            return this.run();
        }
    });
}

//抓包vpn检测
function hook_vpn() {
    Java.perform(function () {
        var String = Java.use("java.lang.String");
        var NetworkInterface = Java.use("java.net.NetworkInterface");
        NetworkInterface.getName.implementation = function () {
            var result = this.getName();
            //console.log("find getName：", result);
            if (result && (result.indexOf("ppp0") > -1 || result.indexOf("tun0") > -1)) {
                console.log("find getName：", result);
                result = String.$new("rmnet_data0");
            }
            return result;
        }


        //情况一
        var ConnectivityManager = Java.use("android.net.ConnectivityManager");
        ConnectivityManager.getNetworkCapabilities.implementation = function (arg) {
            var result = this.getNetworkCapabilities(arg);
            console.log("find getNetworkCapabilities：", result);
            return null;
        }

        //情况二 (2选1)
        //Java.use("android.net.NetworkCapabilities").hasTransport.implementation = function (v) {
        //    console.log(v)
        //    var res = this.hasTransport(v)
        //    console.log("res hasTransport ==> ", res)
        //    return false;
        //}

    })
}

//frida特征检测1 -> hook JNI字符串比较
function hook_strstr() {
    var pfn_strstr = Module.findExportByName("libc.so", "strstr");
    Interceptor.attach(pfn_strstr, {
        onEnter: function (args) {
            var str1 = Memory.readCString(args[0]);
            var str2 = Memory.readCString(args[1]);
            if (str2.indexOf("SigBlk") !== -1 ||
                str2.indexOf("gdbus") !== -1 ||
                str2.indexOf("frida") !== -1 ||
                str2.indexOf("gum-js-loop") !== -1 ||
                str2.indexOf("gmain") !== -1 ||
                str2.indexOf("linjector") !== -1
            ) {
                console.log("str1:%s - str2:%s\n", str1, str2);
                this.hook = true;
            }
        },
        onLeave: function (retval) {
            if (this.hook) {
                retval.replace(0x0);
            }
        }
    });
}

//frida特征检测2 -> 线程检测->  这里是未确定哪个函数在检测frida，但大概知道是在启用线程去检测(甚至有可能不只一个线程在检测)
function hook_pthread() {

    var pthread_create_addr = Module.findExportByName(null, 'pthread_create');
    console.log("pthread_create_addr,", pthread_create_addr);

    //保留原函数？
    var pthread_create = new NativeFunction(pthread_create_addr, "int", ["pointer", "pointer", "pointer", "pointer"]);

    //替换新函数
    Interceptor.replace(pthread_create_addr, new NativeCallback(function (parg0, parg1, parg2, parg3) {
        var so_name = Process.findModuleByAddress(parg2).name;
        var so_path = Process.findModuleByAddress(parg2).path;
        var so_base = Module.getBaseAddress(so_name);

        //下标为2的参数 - 所在so文件的基地址
        var offset = parg2 - so_base;
        //将hook到的所有so文件名、偏移全打印出来
        console.log(`hooked -----> so_name:${so_name},  offset:${offset},  path:${so_path},  parg2:${parg2}`);

        var PC = 0;
        // 注意一：这里根据实际情况更改
        if (
            (so_name.indexOf("libart.so") > -1)
            //|| (so_name.indexOf("libutils.so") > -1)
            //|| (so_name.indexOf("libmsaoaidsec.so") > -1)

        ) {
            if (so_name === "libart.so" && offset === 4678744) {
                console.log(`√√√ anti bypass ${so_name}=>${offset}`);
            }
                //else if (so_name === "libart.so" && offset === 3236248) { //感觉没啥用
                //    console.log(`√√√ anti bypass ${so_name}=>${offset}`);
                //}

                //else if ((offset === 69396 && so_name === "libutils.so")) { //这个要了会阻塞死app
                //    console.log(`√√√ anti bypass ${so_name}=>${offset}`);
            //}
            else {
                PC = pthread_create(parg0, parg1, parg2, parg3);
                //console.log("ordinary sequence", PC);
            }

            // 注意二：这里根据实际情况更改
            //switch (offset) {
            //    case 69396:
            //        console.log(`===> anti bypass,  so_name=>${so_name}, offset:${offset}`);
            //        break
            //    default:
            //        PC = pthread_create(parg0, parg1, parg2, parg3);
            //        console.log("ordinary sequence", PC);
            //        console.log("========================================================")
            //}

        } else {
            PC = pthread_create(parg0, parg1, parg2, parg3);
            // console.log("ordinary sequence", PC)
            // console.log("========================================================")
        }
        return PC;
    }, "int", ["pointer", "pointer", "pointer", "pointer"]))

}

//frida特征检测3 -> 线程检测->  这里是已经确定哪个函数在检测frida特征的情况下，现在想阻止启动线程去检测？
function hook_frida_check() {
    // var exports = Process.findModuleByName("libnative-lib.so").enumerateExports(); 导出
    // var imports = Process.findModuleByName("libnative-lib.so").enumerateImports(); 导入
    // var symbols = Process.findModuleByName("libnative-lib.so").enumerateSymbols(); 符号

    var pthread_create_addr = null;
    var symbols = Process.getModuleByName("libc.so").enumerateSymbols();
    for (var i = 0; i < symbols.length; i++) {
        var symbol = symbols[i];
        if (symbol.name === "pthread_create") {
            pthread_create_addr = symbol.address;
            console.log("pthread_create name is ->", symbol.name);
            console.log("pthread_create address is ->", pthread_create_addr);
        }
    }

    Java.perform(function () {
        // 定义方法 之后主动调用的时候使用
        var pthread_create = new NativeFunction(pthread_create_addr, 'int', ['pointer', 'pointer', 'pointer', 'pointer'])
        Interceptor.replace(pthread_create_addr, new NativeCallback(function (a0, a1, a2, a3) {
            var result = null;
            var detect_frida_loop = Module.findExportByName("libnative-lib.so", "_Z17detect_frida_loopPv");
            //console.log("a0,a1,a2,a3 ->", a0, a1, a2, a3);

            if (String(a2) === String(detect_frida_loop)) {
                result = 0;
                console.log("阻止frida反调试启动");
            } else {
                result = pthread_create(a0, a1, a2, a3);
                //console.log("正常启动");
            }
            return result;
        }, 'int', ['pointer', 'pointer', 'pointer', 'pointer']));
    })
}

//获取类的完整类名
function getFullName(name) {
    Java.perform(function () {
        Java.enumerateLoadedClassesSync().forEach(function (className) {
            if (className.indexOf(name) != -1) {
                console.log(className);
            }
        })
    });
}

//切换loader并寻找类，找不到则切换下一个loader
function switchLoaderHook(targetClsName) {
    let count = 0
    Java.enumerateClassLoaders({
        onMatch: function (loader) {
            //let targetClsName = "com.taobao.wireless.security.adapter.JNICLibrary";
            let targetMethodName = "";

            //方法0:(x-不是很好用)不用切换loader，直接加载类：loader.loadClass("com.google.gson.Gson");
            count++;
            console.log("\n\n");
            console.log(`*********> current loader_${count}: ${loader}`)

            //方法一：直接切换classLoader, 然后hook
            //Java.classFactory.loader = loader;
            //hookClass(targetClsName);


            //方法二：先findClass, 若不报错才再切换loader, 然后hook
            try {
                if (loader.findClass(targetClsName)) {
                    console.log(`---------> findClass success, current loader: ${loader}`);

                    //切换classLoader
                    Java.classFactory.loader = loader;

                    //然后hook
                    //let JNICLibrary = Java.use(targetClsName);
                    //JNICLibrary["doCommandNative"].implementation = function (i, objArr) {
                    //    console.log('doCommandNative is called' + ', ' + 'i: ' + i + ', ' + 'objArr: ' + objArr);
                    //    let ret = this.doCommandNative(i, objArr);
                    //    console.log('doCommandNative ret value is ' + ret);
                    //    return ret;
                    //};

                }
            } catch (e) {
                console.log("=========> findClass error", e.message);
            }
        },

        onComplete: function () {
        }
    })
}


/*
//TODO 以下是淘宝专用hook

//淘宝专用线程进程id检测  -> 自编译frida不必管它
var ByPassTracerPid = function () {
    var fgetsPtr = Module.findExportByName("libc.so", "fgets");
    var fgets = new NativeFunction(fgetsPtr, 'pointer', ['pointer', 'int', 'pointer']);
    Interceptor.replace(fgetsPtr, new NativeCallback(function (buffer, size, fp) {
        var retval = fgets(buffer, size, fp);
        var bufstr = Memory.readUtf8String(buffer);
        if (bufstr.indexOf("TracerPid:") > -1) {
            Memory.writeUtf8String(buffer, "TracerPid:\t0");
            console.log("tracerpid replaced: " + Memory.readUtf8String(buffer));
        }
        return retval;
    }, 'pointer', ['pointer', 'int', 'pointer']));
};


//淘宝使用http协议
function hook_spdy() {

    Java.enumerateClassLoaders({
        onMatch: function (loader) {
            //切换classLoader
            Java.classFactory.loader = loader;
            try {
                let SwitchConfig = Java.use("mtopsdk.mtop.global.SwitchConfig");
                console.log("===============> hook success");

                SwitchConfig["isGlobalSpdySwitchOpen"].implementation = function () {
                    //console.log('--->isGlobalSpdySwitchOpen is called');
                    let ret = this.isGlobalSpdySwitchOpen();
                    //console.log('--->isGlobalSpdySwitchOpen ret value is ' + ret);
                    //return ret;
                    return false;
                }

            } catch (error) {
                console.log("hookClass报错", error.message);
            }
        },

        onComplete: function () {
        }
    })

    //let SwitchConfig = Java.use("mtopsdk.mtop.global.SwitchConfig");
    //SwitchConfig["isGlobalSpdySwitchOpen"].implementation = function () {
    //    console.log('---------> isGlobalSpdySwitchOpen is called');
    //    let ret = this.isGlobalSpdySwitchOpen();
    //    console.log('--------> isGlobalSpdySwitchOpen ret value is ' + ret);
    //    //return ret;
    //    return false;
    //}
}


function hookDoCommandNative() {
    let targetClsName = "com.taobao.wireless.security.adapter.JNICLibrary";

    switchLoaderHook(targetClsName);

    //然后hook
    let JNICLibrary = Java.use(targetClsName);
    JNICLibrary["doCommandNative"].implementation = function (i, objArr) {
        //console.log('doCommandNative is called' + ', ' + 'i: ' + i + ', ' + 'objArr: ' + objArr);
        let ret = this.doCommandNative(i, objArr);
        if (i == 70102) {
            console.log("\n---> argument.length: ", arguments.length);

            for (var j = 0; j < arguments.length; j++) {
                console.log("arg[" + j + "]: " + arguments[j] + " => " + JSON.stringify(arguments[j]));
            }
            console.log("===> return: ", ret);
            console.log("============Stack start end================");
            printStack("stack DoCommandNative==>");
            console.log("============Stack start end================");

        }
        return ret;
    };
}

function hook_start() {
    let targetClsName = 'mtopsdk.network.impl.b';

    switchLoaderHook(targetClsName);

    //var ANetworkCallImpl = Java.use('mtopsdk.network.impl.b');
    //ANetworkCallImpl.$init.overload('mtopsdk.network.domain.Request', 'android.content.Context').implementation = function () {
    //    console.log("\nANetworkCallImpl " + arguments[0])
    //    var ret = this.$init.apply(this, arguments);
    //
    //    console.log("===> return: ", ret);
    //    console.log("============Stack start end================");
    //    printStack("stack DoCommandNative==>");
    //    console.log("============Stack start end================");
    //    return ret
    //}
}

function hook_tb() {
    //hook_ssl2_java();
    //hook_thread();

    hook_spdy();

    ByPassTracerPid();
    //hook_strstr();
    hook_frida_check();
    //hook_pthread();
}

//setImmediate(hook_tb)
*/

