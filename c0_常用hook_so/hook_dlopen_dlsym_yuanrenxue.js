function find_function() {
    Java.perform(function () {

        //hook dlopen
        var func_name = "android_dlopen_ext";

        //hook dlsym, 查看加载了哪些函数(如Jni_Onload、静态函数等)
        // var func_name = "dlsym";

        var func_address;
        var final_func_name;
        var modules = Process.enumerateModules();
        for (var i = 0; i < modules.length; i++) {
            var module = modules[i];
            var module_name = module.name;

            var exports = module.enumerateExports();
            for (var j = 0; j < exports.length; j++) {
                var export_name = exports[j].name;
                //找到目标so文件基址，找到了才能hook，没找到不hook!s
                if (export_name.indexOf(func_name) > -1) {
                    console.log("\n >>> 找到可疑函数", module_name, export_name);
                    if (func_name == export_name) {
                        final_func_name = export_name;
                        func_address = exports[j].address;
                        break;
                    }
                }
            }
        }

        if (func_address) {
            console.log(">>>> 找到的最终函数", final_func_name, func_address);
            //hook dlopen：查看加载的模块
            //hook dlsym：查看加载的函数名，及其所在模块
            Interceptor.attach(func_address, {
                onEnter: function (args) {
                    if (func_name.indexOf("dlopen") > -1) {
                        //dlopen打开so文件
                        this.path = ptr(args[0]).readCString();
                    } else if (func_name.indexOf("dlsym") > -1) {
                        // dlsym会加载Jni_Onload函数
                        this.func_name = ptr(args[1]).readCString();
                    } else {
                        console.log("!!!!!!!!!!!!!!! other function, please check your code.");
                    }
                    console.log("[before hook]: ", "arg[0] =", this.path, ", arg[1] =", this.func_name);
                },

                onLeave: function (retval) {
                    if (Process.findModuleByAddress(retval)) {
                        console.log("==> after hook dlsym : ", Process.findModuleByAddress(retval).name, "-->", this.func_name);
                    }
                    else {
                        console.log("===> after hook dlopen : ", this.path, "-->", this.func_name);
                    }
                }
            });
        }
    });
}


setImmediate(find_function)