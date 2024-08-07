//注：spwan模式注入
function find_hook_function() {
    //let func_name = "android_dlopen_ext";
    let func_name = "dlsym";

    var target_func_addr;
    var target_func_name;

    //遍历所有模块
    let modules = Process.enumerateModules();
    for (let module of modules) {
        let module_name = module.name;

        //获取所有导出函数
        let exports = module.enumerateExports();
        for (let exp of exports) {
            let exp_name = exp.name;
            //TODO 1.找到目标函数名
            if (exp_name.indexOf(func_name) > -1) {
                //获取目标函数名地址 (dlopen or dlsym)
                target_func_addr = exp.address;
                target_func_name = exp_name;
                console.log("\n===> 找到目标函数", module_name, exp_name);
                break;
            }
        }
    }

    if (target_func_addr) {
        Interceptor.attach(target_func_addr, {
            onEnter: function (args) {
                //如果是dlopen函数，则获取打开的so文件路径
                if (target_func_name.indexOf("dlopen") > -1) {
                    this.path = ptr(args[0]).readCString();
                    if (this.path.endsWith(".so")) {
                        this.path_file = /[^/]+\.so$/.exec(this.path)[0]; //这个正则有点问题，若不是.so结尾则不能匹配
                    }
                }
                //如果是dlsym函数，则获取加载的函数名
                else if (target_func_name.indexOf("dlsym") > -1) {
                    this.func_name = ptr(args[1]).readCString();
                } else {
                    console.log("!!!!!!!!!!!!!!! other function, please check your code.");
                }

                console.log("[before hook]:  arg[0] =", this.path, ", arg[1] =", this.func_name);
                console.log(`[before hook]:  arg[0] = ${this.path}, arg[1] = ${this.func_name}, this.path_file = ${this.path_file}`);

                /*
                   TODO 注意：
                    dlopen时，此时还不能hook app自身的so模块中的函数，要等dlopen后才能hook！(即在onLeave里面可以hook)
                    dlsym时，可以hook某些函数，比如:JNI_OnLoad，因为已经存在了，dlsym是去寻找该函数。
               */

                /* dlopen hook测试，此时frida是找不到的，当然也就不能hook，要在onLeave里面才能hook
                  if (this.path_file) {
                      let path_module = Process.findModuleByName(this.path_file);
                      console.log("\t===>path_module", path_module);
                      if (path_module) {
                          let eps = path_module.enumerateExports();
                          console.log("\t===>导出的函数名个数", eps.length);
                      }
                  }
                */

                /* dlsym hook测试，此时frida是能找到的，当前也就能hook了
                if (this.func_name == "JNI_OnLoad") {
                    let exp = Module.findExportByName("liblessontest.so", "JNI_OnLoad");
                    if (exp) {
                        console.log("\t√ 找到了JNI_OnLoad函数", exp, module_name);
                    } else {
                        console.log("\t× 没有找到JNI_OnLoad函数", exp, module_name);
                    }
                }*/

            },

            onLeave: function (retval) {
               //... ...
            }
        })
    }


}

function main() {
    find_hook_function()
}

setImmediate(main);