/*
    hook_pthread：
        这里是未确定哪个函数在检测frida，但大概知道是在启用线程去检测(甚至有可能不只一个线程在检测)
        所以把模块、函数地址、函数偏移地址 全部打印出来，在哪里停止/崩溃，就在哪里过滤掉。
*/

function replaceKill() {
    var kill_addr = Module.findExportByName("libc.so", "kill");
    // var kill = new NativeFunction(kill_addr,"int",['int','int']);
    Interceptor.replace(kill_addr, new NativeCallback(function (arg0, arg1) {
        console.log("kill arg0=> ", arg0)
        console.log("kill arg1=> ", arg1)

    }, "int", ['int', 'int']))
}

function hook_strstr() {
    var pfn_strstr = Module.findExportByName("libc.so", "strstr");
    Interceptor.attach(pfn_strstr, {
        onEnter: function (args) {
            var str1 = Memory.readCString(args[0]);
            var str2 = Memory.readCString(args[1]);
            if (str2.indexOf("SigBlk") !== -1 ||
                str2.indexOf("gdbus") !== -1 ||
                str2.indexOf("frida") !== -1 ||
                str2.indexOf("gum-js-loop") !== -1 ||
                str2.indexOf("gmain") !== -1 ||
                str2.indexOf("linjector") !== -1
            ) {
                //console.log("str1:%s - str2:%s\n", str1, str2);
                console.log("----------------------------");
                console.log("str1 ==> ", str1);
                console.log("str2 ==> ", str2);
                console.log("----------------------------\n");

                this.hook = true;
            }
        },
        onLeave: function (retval) {
            if (this.hook) {
                retval.replace(0x0);
            }
        }
    });
}

function hook_pthread() {

    var pthread_create_addr = Module.findExportByName(null, 'pthread_create');
    console.log("pthread_create_addr,", pthread_create_addr);

    var pthread_create = new NativeFunction(pthread_create_addr, "int", ["pointer", "pointer", "pointer", "pointer"]);

    Interceptor.replace(pthread_create_addr, new NativeCallback(function (parg0, parg1, parg2, parg3) {
        var so_name = Process.findModuleByAddress(parg2).name;
        var so_path = Process.findModuleByAddress(parg2).path;
        var so_base = Module.getBaseAddress(so_name);

        //下标为2的参数 - 所在so文件的基地址
        var offset = parg2 - so_base;
        //将hook到的所有so文件名、偏移全打印出来
        console.log(`hooked -----> so_name:${so_name},  offset:${offset},  parg2:${parg2}, path:${so_path}`);

        var PC = 0;
        // 注意一：这里根据实际情况更改
        if (so_name.indexOf("libJDMobileSec.so") > -1 || (so_name.indexOf("libmsaoaidsec.so") > -1)) {
            if (so_name === "libart.so" && offset === 2512957) {
                console.log(`√√√ anti bypass ${so_name}=>${offset}`);
                PC = 0;
            } else {
                PC = pthread_create(parg0, parg1, parg2, parg3);
            }
        } else {
            PC = pthread_create(parg0, parg1, parg2, parg3);
        }

        //正常逻辑
        //PC = pthread_create(parg0, parg1, parg2, parg3);
        return PC;
    }, "int", ["pointer", "pointer", "pointer", "pointer"]))

}

function main() {
    //hook_strstr();
    hook_pthread();
}

setImmediate(main);


/*
    1.直接不让检测线程启动：          Interceptor.replace(pthread_create, new NativeCallback(){ if(arg[2]=="libxxx.so"){return 0;}});
    2.直接将目标方法替换为空：        Interceptor.replace(func_addr, new NativeCallback());
    3.检测逻辑直接nop掉：            blx func -> nop
 */