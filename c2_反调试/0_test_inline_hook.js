//function call() {
//    Java.perform(function () {
//        let MainActivity = Java.use("com.example.ndktools.MainActivity");
//        MainActivity.stringFromJNI();
//    });
//}


function hook() {
    //let mode = Process.findModuleByName("libnative-lib.so");
    //let target_addr = mode.base.add(0x8E30 + 1);

    var func_addr = Module.findExportByName("libnative-lib.so", '_Z3addii');
    console.log("---->", func_addr);

    //Interceptor.attach(target_addr, {
    //    onEnter: function () {
    //        console.log("enter >>>>");
    //    },
    //    onLeave: function (retval) {
    //        console.log("leave");
    //    }
    //})

    var old_func = new NativeFunction(func_addr, "int", ['int', 'int']);
    Interceptor.replace(func_addr, new NativeCallback(function (arg1, arg2) {
        let value = old_func(10, 20);
        console.log("进入===================>");
        return value;
    }, 'int', ['int', 'int']));

}


setImmediate(hook);