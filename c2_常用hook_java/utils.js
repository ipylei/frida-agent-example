//获取context
function getContext() {
    let currentApplication = Java.use("android.app.ActivityThread").currentApplication();
    return currentApplication.getApplicationContext();
}


function logStart() {
    console.log("=>".repeat(50));
}

function logEnd() {
    console.log("<=".repeat(50) + '\n');
}


//java层打印调用栈
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

function printStackSimple() {
    console.log(Java.use("android.util.Log").getStackTraceString(Java.use("java.lang.Exception").$new()))
}

//so层打印调用栈(在Interceptor.attach的hook中执行)
console.log('RegisterNatives called from:\n' + Thread.backtrace(this.context, Backtracer.ACCURATE).map(DebugSymbol.fromAddress).join('\n') + '\n');


/* 【***】 打印Java层内建数据类型
*
*
* */


//打印hashMap
function printHashMap(param) {
    console.log(">>>==========================");
    var HashMap = Java.use("java.util.HashMap");
    var newretObj = Java.cast(param, HashMap); //向下转型(将Map转为HashMap)
    var keys = newretObj.keySet();
    var iterator = keys.iterator();
    while (iterator.hasNext()) {
        var k = iterator.next();
        //打印key和value
        console.log(k, "==>", newretObj.get(k));
    }
    console.log("<<<=========================\n");
}

//打印ArrayList
function printArrayList(param) {
    console.log(">>>==========================");
    var ArrayList = Java.use("java.util.ArrayList");
    var newretObj = Java.cast(param, ArrayList); //向下转型(将Map转为HashMap)
    var iterator = newretObj.iterator();
    while (iterator.hasNext()) {
        var item = iterator.next();
        //打印key和value
        console.log("==>", item);
    }
    console.log("<<<=========================\n");
}


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

//java byte[]以hexdump格式输出。 即：将java byte[] 转换成c++的指针类型。并且hexdump打印结果
function print_bytes(bytes, size) {
    var buf = Memory.alloc(bytes.length);
    Memory.writeByteArray(buf, byte_to_ArrayBuffer(bytes));
    console.log(hexdump(buf, {offset: 0, length: size, header: false, ansi: true}));
}


//java byte[]以hexdump格式输出。 即：将java byte[] 转换成c++的指针类型。并且hexdump打印结果
function jhexdump(array) {
    var ptr = Memory.alloc(array.length); //API手动开辟的内存区域
    for (var i = 0; i < array.length; ++i) {
        Memory.writeS8(ptr.add(i), array[i]);
    }
    console.log(hexdump(ptr, {offset: 0, length: array.length, header: false, ansi: false}));
}

//打印java byte[]数据(以16进制输出)
function printByteHex(bytearray1) {
    var ByteString = Java.use("com.android.okhttp.okio.ByteString");
    console.log('contents: => ', ByteString.of(bytearray1).hex())
}

/* 【***】 Java => JS，将Java数据类型转成js数据类型
*
*
* */

//HashMap转js中json格式字符串：hashMap -> String(json格式)
function HashMapToString(param) {
    //var obj = {};
    var finnalString = ""
    var HashMap = Java.use("java.util.HashMap");
    var newretObj = Java.cast(param, HashMap); //向下转型(将Map转为HashMap)
    var keys = newretObj.keySet();
    var iterator = keys.iterator();
    while (iterator.hasNext()) {
        var k = iterator.next();
        //打印key和value
        //console.log(k, "==>", newretObj.get(k));
        //obj[k] = newretObj.get(k);
        finnalString += newretObj.get(k);
    }
    return finnalString;
}

//java String转js数组
function StringToArray(str) {
    const bytes = [];
    for (let i = 0; i < str.length; i++) {
        const byte = str.charCodeAt(i);
        bytes.push(byte);
    }
    return bytes;
}

//将java的byte[]数组转换成js的数组
function bytesToArray(bytes) {
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


