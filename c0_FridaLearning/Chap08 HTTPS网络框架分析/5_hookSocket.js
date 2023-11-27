function jhexdump(array) {
    var ptr = Memory.alloc(array.length); //API手动开辟的内存区域
    for (var i = 0; i < array.length; ++i)
        Memory.writeS8(ptr.add(i), array[i]);
    //console.log(hexdump(ptr, { offset: off, length: len, header: false, ansi: false }));
    console.log(hexdump(ptr, {offset: 0, length: array.length, header: false, ansi: false}));
}

/*Hook 发送的地址(ip:port)*/
function hookAddress() {
    Java.perform(function () {
        // java.net.InetSocketAddress.InetSocketAddress(java.net.InetAddress, int)
        Java.use('java.net.InetSocketAddress').$init.overload('java.net.InetAddress', 'int').implementation = function (addr, port) {
            var result = this.$init(addr, port)

            //console.log('addr,port =>',addr.toString(),port)
            if (addr.isSiteLocalAddress()) {  /* TODO 区分本地地址和远程地址 */
                console.log('Local address =>', addr.toString(), ', port is ', port)
            } else {
                console.log('Server address =>', addr.toString(), ', port is ', port)
            }

            return result
        }
    })
}


/*
Hook Socket发送的内容和响应的数据
发送和响应的数据是Bytes数组， 响应的数据是被压缩了的
如果是https的话，这里还是经过ssl层加密的
*/
function hookSocket() {
    Java.perform(function () {
        // TODO 1.Hook 发送的请求内容，若是HTTP则是明文，若是HTTPS则在SSL层加密后传过来(写到网络中去)
        //调用栈如下：
        // java.net.SocketOutputStream.socketWrite (Hook这个)
        // java.net.SocketOutputStream.write
        Java.use('java.net.SocketOutputStream').socketWrite.overload('[B', 'int', 'int').implementation = function (bytearray1, int1, int2) {
            var result = this.socketWrite(bytearray1, int1, int2)
            console.log('socketWrite result,bytearray1,int1,int2=>', result, bytearray1, int1, int2)

            /* TODO 得到的数据是被压缩的，可以保存下来并解压 */

            /* 方法一：打印参数 */
            // var ByteString = Java.use("com.android.okhttp.okio.ByteString");
            // console.log('contents: => ', ByteString.of(bytearray1).hex())

            /* 方法二：打印参数 */
            jhexdump(bytearray1)
            return result
        }

        // TODO 2.Hook 接收的响应内容，若是HTTP则是明文，若是HTTPS则在SSL层解密(读到内存中来)
        //调用栈如下：
        // java.net.SocketInputStream.socketRead0
        // java.net.SocketInputStream.read (Hook这个)
        Java.use('java.net.SocketInputStream').read.overload('[B', 'int', 'int').implementation = function (bytearray1, int1, int2) {
            var result = this.read(bytearray1, int1, int2)
            console.log('read result,bytearray1,int1,int2=>', result, bytearray1, int1, int2)

            /* 方法一：打印参数 */
            // var ByteString = Java.use("com.android.okhttp.okio.ByteString");
            //console.log('contents: => ', ByteString.of(bytearray1).hex())

            /* 方法二：打印参数 */
            jhexdump(bytearray1)
            return result
        }
    })

}

/*
Hook SSL层发送和响应的数据(是明文)
*/
function hookSSLSocketAndroid8() {
    Java.perform(function () {

        // TODO 1.Hook (写到网络中去) 发送的请求内容前，对请求内容(明文)进行加密
        // com.android.org.conscrypt.ConscryptFileDescriptorSocket$SSLOutputStream.write
        Java.use('com.android.org.conscrypt.ConscryptFileDescriptorSocket$SSLOutputStream').write.overload('[B', 'int', 'int').implementation = function (bytearray1, int1, int2) {
            var result = this.write(bytearray1, int1, int2)
            console.log('write result,bytearray1,int1,int2=>', result, bytearray1, int1, int2)

            var ByteString = Java.use("com.android.okhttp.okio.ByteString");
            console.log('contents: => ', ByteString.of(bytearray1).hex())


            return result
        }

        // TODO 2.Hook (读到内存中来) 响应内容到来时(密文)，对响应内容进行解密
        // com.android.org.conscrypt.ConscryptFileDescriptorSocket$SSLInputStream.read
        Java.use('com.android.org.conscrypt.ConscryptFileDescriptorSocket$SSLInputStream').read.overload('[B', 'int', 'int').implementation = function (bytearray1, int1, int2) {
            var result = this.read(bytearray1, int1, int2)
            console.log('read result,bytearray1,int1,int2=>', result, bytearray1, int1, int2)

            var ByteString = Java.use("com.android.okhttp.okio.ByteString");
            //console.log('contents: => ', ByteString.of(bytearray1).hex())
            jhexdump(bytearray1)


            return result
        }
    })
}

function main() {
    //hookAddress()
    hookSocket()
    //hookSSLSocketAndroid8()
}

setImmediate(main)