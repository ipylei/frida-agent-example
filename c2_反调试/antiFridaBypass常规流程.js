function hook_dlopen(soName = '') {
    Interceptor.attach(Module.findExportByName(null, "android_dlopen_ext"),
        {
            onEnter: function (args) {
                var pathptr = args[0];
                if (pathptr !== undefined && pathptr != null) {
                    var path = ptr(pathptr).readCString();
                    if (path.indexOf(soName) >= 0) {
                        this.is_can_hook = true;
                        //hook_init(); //hook init
                    }
                }
            },
            onLeave: function (retval) {
                if (this.is_can_hook) {
                    hook_JNI_OnLoad();   //先hook JNI_OnLoad()确定是否是在JNI_OnLoad()之前就退出了。
                }
            }
        }
    );
}

//hook JNI_OnLoad
/*1:根据导出符号表；2:根据偏移；3:根据dlsym(OnLeave)，然后对其地址进行判断后进行hook*/
function hook_JNI_OnLoad() {
    let module = Process.findModuleByName("libmsaoaidsec.so")
    Interceptor.attach(module.base.add(0xC6DC + 1), {
        onEnter(args) {
            console.log("call JNI_OnLoad")
        }
    })
}

//hook init函数，可以在init函数执行之前进行hook检查；也可以进行bypass();
function hook_init() {
    let secmodule = null
    Interceptor.attach(Module.findExportByName(null, "__system_property_get"),
        {
            // _system_property_get("ro.build.version.sdk", v1);
            onEnter: function (args) {
                secmodule = Process.findModuleByName("libmsaoaidsec.so")
                var name = args[0];
                if (name !== undefined && name != null) {
                    name = ptr(name).readCString();
                    if (name.indexOf("ro.build.version.sdk") >= 0) {
                        // 这是.init_proc刚开始执行的地方，是一个比较早的时机点
                        // do something

                        //hook_pthread_create();  //注：其实可以直接开局就hook，然后再慢慢筛选的
                        bypass();                 //直接把线程函数nop掉了，也可以在hook_pthread_create()替换函数逻辑
                    }
                }
            }
        }
    );
}

//hook pthread_create()，打印子线程执行函数的地址
function hook_pthread_create() {
    console.log("libmsaoaidsec.so --- " + Process.findModuleByName("libmsaoaidsec.so").base);

    let addr = Module.findExportByName("libc.so", "pthread_create");
    Interceptor.attach(addr, {
        onEnter(args) {
            let func_addr = args[2];
            console.log("The thread function address is " + func_addr, DebugSymbol.fromAddress(func_addr));
        }
    })
}

function nop(addr) {
    //替换该地址处4个字节！
    Memory.patchCode(ptr(addr), 4, code => {
        const cw = new ThumbWriter(code, {pc: ptr(addr)});
        cw.putNop();  //写入2字节
        cw.putNop();  //写入2字节
        cw.flush();
    });


    //如果addr是函数地址的话，下面这种方式也可以，只不过上面nop相当于patch，粒度是指令级别
    /*Interceptor.replace(addr, new NativeCallback(function () {
        return 0;
    }));*/
}

function bypass() {
    let module = Process.findModuleByName("libmsaoaidsec.so")
    nop(module.base.add(0x10AE4));
    nop(module.base.add(0x113F8));
}

setImmediate(hook_dlopen, "libmsaoaidsec.so")


//参考：https://blog.csdn.net/weixin_56039202/article/details/130441119