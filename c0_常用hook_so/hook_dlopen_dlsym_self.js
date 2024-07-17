function hook_function(func_name, func_addr) {
    console.log("hook function", func_name, func_addr);

    Interceptor.attach(func_addr, {
        onEnter: function (args) {

        },
        onLeave: function (retval) {
        }
    })
}

//注：spwan模式注入
function find_function() {
    Java.perform(function () {
        //let func_name = "android_dlopen_ext";
        let func_name = "dlsym";

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
                    console.log("\n===> 找到目标函数", module_name, exp_name);
                    //获取目标函数名地址
                    let exp_addr = exp.address;

                    //TODO 2.hook目标函数(如dlopen, dlsym)
                    Interceptor.attach(exp_addr, {
                        onEnter: function (args) {
                            //如果是dlopen函数，则获取打开的so文件路径
                            if (exp_name.indexOf("dlopen") > -1) {
                                this.path = ptr(args[0]).readCString();
                                if (this.path.endsWith(".so")) {
                                    this.path_file = /[^/]+\.so$/.exec(this.path)[0]; //这个正则有点问题，若不是.so结尾则不能匹配
                                }
                            }
                            //如果是dlsym函数，则获取加载的函数名
                            else if (exp_name.indexOf("dlsym") > -1) {
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
                            if (Process.findModuleByAddress(retval)) {
                                let m_module = Process.findModuleByAddress(retval);
                                let m_module_name = m_module.name;
                                console.log(`\t==>1被hook的函数:${exp_name}, dlsym->:${this.func_name}, 对应的模块:${m_module_name}`)
                            }
                            else if (this.path_file && Process.findModuleByName(this.path_file)) {
                                let path_module = Process.findModuleByName(this.path_file);
                                let path_module_name = path_module.name;
                                console.log(`\t==>2被hook的函数:${exp_name}, dlopen->:${this.path}, 对应的模块:${path_module_name}, other->${this.path_file}`);

                                /*
                                //获取所有导出函数，遍历并获取其地址，就可以在dlopen打开后立马hook，前面frida找不到的情况这里就可以解决了
                                let path_exports = path_module.enumerateExports();
                                //let eps = path_module.enumerateSymbols();
                                console.log("\t-->导出函数个数", path_exports.length);
                                for (let p_exp of path_exports) {
                                    console.log("\t---->", p_exp.name);
                                    if (p_exp.name.indexOf("xxxx") > -1) {
                                        hook_function(p_exp.name, p_exp.address)
                                    }
                                }
                                */
                            }
                            //hook dlopen，且加载的不是so文件的情况
                            else {
                                console.log(`\t==>3被hook的函数:${exp_name}, dlopen->:${this.path}, 返回值:${retval}`);
                            }
                        }
                    })
                }
            }
        }

    })
}


setImmediate(find_function);