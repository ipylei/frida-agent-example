//获取context
function getContext() {
    let currentApplication = Java.use("android.app.ActivityThread").currentApplication();
    return currentApplication.getApplicationContext();
}

//分割输出
function printSeparator(mode = "start", num = 50) {
    if (mode === "start") {
        console.log(">>>" + "-".repeat(num));
    } else if (mode === "end") {
        console.log("<<<" + "-".repeat(num) + '\n');
    }
}

//获取对象的所有信息
function dump_obj(obj) {
    Java.perform(function () {
        const Class = Java.use("java.lang.Class");
        const obj_class = Java.cast(obj.getClass(), Class);
        const fields = obj_class.getDeclaredFields();
        const methods = obj_class.getMethods();
        console.log("Inspecting " + obj.getClass().toString());
        console.log("\tFields:");
        for (var i in fields) {
            // console.log("\t\t" + fields[i].toString());
            var className = obj_class.toString().trim().split(" ")[1];
            // console.log("className is => ",className);
            var fieldName = fields[i].toString().split(className.concat(".")).pop();
            console.log(fieldName + " => ", obj[fieldName].value);
        }
        // console.log("\tMethods:");
        // for (var i in methods)
        //     console.log("\t\t" + methods[i].toString());
    })
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

//so层打印调用栈
console.log('RegisterNatives called from:\n' + Thread.backtrace(this.context, Backtracer.ACCURATE).map(DebugSymbol.fromAddress).join('\n') + '\n');


/* 【***】 打印Java层内建数据类型
*
* */

//打印java byte[]数据(以16进制输出)
function printByteHex() {
    var ByteString = Java.use("com.android.okhttp.okio.ByteString");
    console.log('contents: => ', ByteString.of(bytearray1).hex())
}

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

//java byte[]以hexdump格式输出。 即：将java byte[] 转换成c++的指针类型。并且hexdump打印结果
function print_bytes(bytes, size) {
    var buf = Memory.alloc(bytes.length);
    Memory.writeByteArray(buf, byte_to_ArrayBuffer(bytes));
    console.log(hexdump(buf, {offset: 0, length: size, header: false, ansi: true}));
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

//将java的数组转换成js的数组
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


