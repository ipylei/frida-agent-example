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
    //var content="";
    //for (var n = 0; n < bytes.length; n++) {
    //    content += String.fromCharCode(aa[n]);
    //}

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
        //type: tcp4 or tcp6
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


// 【1.1】 TCP java层hook (Android 8.1.0、Android 10)
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

// 【2.1】 UDP java层hook (Android 8.1.0)
// private native int sendtoBytes(FileDescriptor fd, Object buffer, int byteOffset, int byteCount, int flags, InetAddress inetAddress, int port) throws ErrnoException, SocketException;
// private native int sendtoBytes(FileDescriptor fd, Object buffer, int byteOffset, int byteCount, int flags, SocketAddress address) throws ErrnoException, SocketException;
// private native int recvfromBytes(FileDescriptor fd, Object buffer, int byteOffset, int byteCount, int flags, InetSocketAddress srcAddress) throws ErrnoException, SocketException;
function hook_udp_java() {
    var LinuxClass = Java.use("libcore.io.Linux");


    //发送
    LinuxClass.sendtoBytes.overload('java.io.FileDescriptor', 'java.lang.Object', 'int', 'int', 'int', 'java.net.SocketAddress').implementation = function () {
        var result = this.sendtoBytes.apply(this, arguments);
        var arg1 = arguments[1];
        var bytearray = Java.array('byte', arg1);

        console.log(">>>> sendtoBytes1", arguments[5]);
        print_bytes(bytearray, result);   //需要result，因为是长度信息
        return result;

    }
    //发送
    LinuxClass.sendtoBytes.overload('java.io.FileDescriptor', 'java.lang.Object', 'int', 'int', 'int', 'java.net.InetAddress', 'int').implementation = function () {
        var result = this.sendtoBytes.apply(this, arguments);
        var arg1 = arguments[1];
        var bytearray = Java.array('byte', arg1);

        console.log(">>>> sendtoBytes2", arguments[5], arguments[6]);
        print_bytes(bytearray, result);   //需要result，因为是长度信息
        return result;
    }
    //接收
    //LinuxClass.recvfromBytes.implementation = function () {
    LinuxClass.recvfromBytes.overload('java.io.FileDescriptor', 'java.lang.Object', 'int', 'int', 'int', 'java.net.InetSocketAddress').implementation = function (a, b, c, d, e, f) {
        var result = this.recvfromBytes.apply(this, arguments);
        var arg1 = arguments[1];
        var bytearray = Java.array('byte', arg1);

        //var holder = f.holder.value;
        //console.log(holder.toString());
        console.log("<<<< recvfromBytes", arguments[5]);
        print_bytes(bytearray, result);   //需要result，因为是长度信息
        return result;
    }

}

// 【1.2、2.2】 TCP\UDP\HTTP
// JNI层hook (Android 8.1.0)
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
      //[*] hook点
      http://androidxref.com/8.1.0_r33/xref/external/boringssl/src/ssl/ssl_lib.cc#752 -> int SSL_write(SSL *ssl, const void *buf, int num
       http://androidxref.com/8.1.0_r33/xref/external/boringssl/src/ssl/s3_pkt.cc#192 -> int ssl3_write_app_data(
        http://androidxref.com/8.1.0_r33/xref/external/boringssl/src/ssl/s3_pkt.cc#do_ssl3_write ->
        # 明文终点了
*/
// 3.1 SSL java层hook(最底层) (Android 10; 8.1.0)
// 实际它们才是java层的最底层，但是这个hook点不好获取socket连接的服务器ip地址和端口，
// 故选择了 hook_ssl2_java() 中的hook点
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
// 明文hook
function hook_jni_ssl() {
    var sslWritePtr = Module.getExportByName("libssl.so", "SSL_write");
    var sslReadPtr = Module.getExportByName("libssl.so", "SSL_read");
    console.log("sslWrite:", sslWritePtr, ",sslRead:", sslReadPtr);

    var sslGetFdPtr = Module.getExportByName("libssl.so", "SSL_get_rfd");
    var sslGetFdFunc = new NativeFunction(sslGetFdPtr, 'int', ['pointer']);

    //int SSL_write(SSL *ssl, const void *buf, int num)
    Interceptor.attach(sslWritePtr, {
        onEnter: function (args) {
            var sslPtr = args[0];                    //ssl
            var buff = args[1];                      //buf
            var size = ptr(args[2]).toInt32();       //num
            if (size > 0) {
                var fd = sslGetFdFunc(sslPtr);
                var sockdata = getSocketData(fd);

                console.log("SSL_write", sockdata);
                //console.log(hexdump(buff, {length: size}));
                //console.log("\n\n");
                console.log('SSL_write called from >>>>>>>>>> :\n' + Thread.backtrace(this.context, Backtracer.ACCURATE).map(DebugSymbol.fromAddress).join('\n') + '\n');
            }
        },
        onLeave: function (retval) {

        }
    });
    //int SSL_read(SSL *ssl, void *buf, int num)
    /*Interceptor.attach(sslReadPtr, {
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

                console.log("SSL_read", sockdata);
                console.log(hexdump(this.buff, {length: size}));
                console.log("\n\n");
                // console.log('RegisterNatives called from:\n' + Thread.backtrace(this.context, Backtracer.ACCURATE).map(DebugSymbol.fromAddress).join('\n') + '\n');
            }

        }
    });*/
}

// 3.4 SSL JNI层hook(jni的ssl的加密数据hook) (Android 8.1.0)
// 针对于自编译SSL_Write，但还是用libc.so库的情况，这样就可以继续跟踪堆栈到自编译SSL_Write那一层
// 密文hook
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
                console.log("libc write", sockdata);
                console.log(hexdump(buff, {length: size.toInt32()}));
            }
            console.log('write called from >>>>>>>>>>>>>>>>>>>>>>:\n' + Thread.backtrace(this.context, Backtracer.ACCURATE).map(DebugSymbol.fromAddress).join('\n') + '\n');
        },
        onLeave: function (retval) {

        }
    });
    /*Interceptor.attach(readPtr, {
        onEnter: function (args) {
            this.fd = args[0];
            this.buff = args[1];
            this.size = args[2];
        },
        onLeave: function (retval) {
            var sockdata = getSocketData(this.fd.toInt32());
            if (sockdata.indexOf("tcp") != -1) {
                console.log("libc read", sockdata);
                console.log(hexdump(this.buff, {length: this.size.toInt32()}));
            }
            console.log('<<<<<<<<<<<<<<<<<<<<<<<<<:\n' + Thread.backtrace(this.context, Backtracer.ACCURATE).map(DebugSymbol.fromAddress).join('\n') + '\n');
        }
    });*/
}


//测试 write_app_data 是否指向 ssl3_write_app_data
//结果：true
/*
ssl3_write_app_data  0x7534de9c74
>>>>   target_addr:  0x7534e14fc8
>>>> * target_addr:  0x7534de9c74
x8 is  0x7534de9c74
*/
function test_ssl3_write_app_data() {
    let module = Module.findBaseAddress("libssl.so");
    var sslWritePtr = Module.getExportByName("libssl.so", "SSL_write");

    //hook SSL_write()
    Interceptor.attach(sslWritePtr, {
        onEnter: function (args) {
            var ssl = args[0];
            var buff = args[1];
            var size = args[2];

            let target_addr = ssl.readPointer().add(0x48);
            console.log(">>>> target_addr: ", target_addr);
            console.log(">>>> * target_addr: ", target_addr.readPointer());


        },
        onLeave: function (retval) {

        }
    });

    //BLR  X8
    let addr1 = module.add(0x2288C);
    Interceptor.attach(addr1, {
        onEnter: function (args) {
            console.log("x8 is ", this.context.x8)
        }
    })

    //ssl3_write_app_data
    let addr2 = module.add(0x19C74);
    console.log("ssl3_write_app_data ", addr2);
}

//测试 bwrite 是否指向 sock_write
//结果：true
/*
    sock_write addr is,  0x75bf0de988

    x0=>  0x7520e9ac80
    [x0]=>  0x75bf19ac38
    x3 =>  0x10
    x8 =>  0x75bf19ac38
    x8+x3 =>  75bf19ac48
    [x8+x3] =>  0x75bf0de988
    x24 addr =>  0x75bf0de988

    x24 addr2=>  0x75bf0de988
*/
function test_bi_io() {
    let module = Module.findBaseAddress("libcrypto.so");

    /* hook bi_io()
   let addr = module.add(0x486A8);  //io_write
   Interceptor.attach(addr, {
        onEnter: function (args) {
            let arg_bio = args[0];
            let arg_method_offset = args[3];
            console.log("x0 1=> ", this.context.x0);
            console.log("x0 2=> ", this.context.x0.readPointer());

            console.log("x3 1=> ", this.context.x3);
            //console.log("x3 2=> ", this.context.x3.readPointer());

            console.log("arg_bio addr 1=>: ", arg_bio);
            console.log("arg_bio addr 2=>: ", arg_bio.readPointer());
            console.log("method offset 1: ", arg_method_offset);
            console.log("method offset 2: ", arg_method_offset.toUInt32());
        }
    })    */

    //LDR X24, [X8,X3] ; 这里读取到bwite()
    let addr = module.add(0x486E4);
    Interceptor.attach(addr, {
        onEnter: function (args) {
            console.log("x0=> ", this.context.x0);
            console.log("[x0]=> ", this.context.x0.readPointer());
            console.log("x3 => ", this.context.x3);
            console.log("x8 => ", this.context.x8);
            let x8_3 = parseInt(this.context.x8) + parseInt(this.context.x3);
            console.log("x8+x3 => ", x8_3.toString(16));
            console.log("[x8+x3] => ", ptr(x8_3).readPointer());
            console.log("x24 addr => ", this.context.x24);

        }
    })

    // BLR  X24
    let addr2 = module.add(0x48734);
    Interceptor.attach(addr2, {
        onEnter: function (args) {
            console.log("x24 addr2=> ", this.context.x24);
        }
    })

    //sock_write
    let addr4 = module.add(0x4B988);
    console.log("sock_write addr is, ", addr4);
}


function main() {
    //hook_strstr();

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
    //hook_jni_ssl();     //明文hook
    //hook_jni_ssl_enc(); //密文hook，针对于自编译SSL_Write，但还是用libc.so库的情况

    //test_ssl3_write_app_data();
    //test_bi_io();

    //getFullName("SSLOutputStream");
}

setImmediate(main);

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

