/*
Interceptor.attach(addr, {
    /!*addr 为Hook函数的地址*!/
    onEnter(args){

    },
    onLeave(retval){

    }
})*/

//第一个参数是模块名或null, 第二个参数是目标函数的导出符号名
//如果第一个参数为null，那么API函数在执行时会在内存加载的所有模块中搜索导出符号名，否则会在指定模块中搜索相应的导出符号
//区别：
// 以get开头的函数无法寻找到相应导出符号名时会抛出一个异常，
// 以find开头的函数无法寻找到相应导出符号名时会直接返回一个null值。
// Module.getExportByName()
// Module.findExportByName()

// JNI函数在Frida中的表示方式:
//https://github.com/frida/frida-java-bridge/blob/master/lib/env.js#L366
function hook_native() {
    var addr = Module.getExportByName("libnative-lib.so", "Java_com_example_ipylei_r0so_MainActivity_stringFromJNI");
    Interceptor.attach(addr, {
        onEnter: function (args) {
            console.log("JNIenv pointer => ", args[0]);
            console.log("jobj pointer =>", args[1]);
        },
        onLeave: function (retval) {
            //Java.vm.getEnv()获取当前线程的JNIEnv结构
            //JNI函数在Frida中的表示方式见: https://github.com/frida/frida-java-bridge/blob/master/lib/env.js#L366
            console.log("retval is =>", Java.vm.getEnv().getStringUtfChars(retval, null).readCString());
            console.log("===============");

        }
    })
}


function hook_native3() {
    var libnative_addr = Module.findBaseAddress('libnative-lib.so');
    console.log("libnative_addr is => ", libnative_addr);
    var stringfromJNI3 = libnative_addr.add(0x72dc);
    console.log("stringfromJNI3 address is =>", stringfromJNI3);

    Interceptor.attach(stringfromJNI3, {
        onEnter: function (args) {

            console.log("jnienv pointer =>", args[0])
            console.log("jobj pointer =>", args[1])
            // console.log("jstring pointer=>",Java.vm.getEnv().getStringUtfChars(args[2], null).readCString() )

        }, onLeave: function (retval) {
            // Java.vm.getEnv() 获取当前线程的JNIEnv结构
            console.log("retval is =>", Java.vm.getEnv().getStringUtfChars(retval, null).readCString())
            console.log("=================")
        }
    })
}

function main() {
    // hook_native()
    hook_native3()
}


//获取模块基地址
// Module.getBaseAddress(name)
// Module.findBaseAddress(name)


setImmediate(main)