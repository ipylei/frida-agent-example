//写入内容到(手机)指定目录
//var path = "/data/data/com.roysue.d0so2/cache/"+module.name+".txt"
//riteSomething(path,"type: "+exports[j].type+" function name :"+exports[j].name+" address : "+exports[j].address+" offset => 0x"+(exports[j].address - module[i].address)+"\n")
function writeSomething(path, contents) {
    var fopen_addr = Module.findExportByName("libc.so", "fopen");
    var fputs_addr = Module.findExportByName("libc.so", "fputs");
    var fclose_addr = Module.findExportByName("libc.so", "fclose");

    //console.log("fopen=>",fopen_addr,"  fputs=>",fputs_addr,"  fclose=>",fclose_addr);

    var fopen = new NativeFunction(fopen_addr, "pointer", ["pointer", "pointer"])
    var fputs = new NativeFunction(fputs_addr, "int", ["pointer", "pointer"])
    var fclose = new NativeFunction(fclose_addr, "int", ["pointer"])

    //console.log(path,contents)

    var fileName = Memory.allocUtf8String(path);
    var mode = Memory.allocUtf8String("a+");

    var fp = fopen(fileName, mode);

    var contentHello = Memory.allocUtf8String(contents);
    var ret = fputs(contentHello, fp)

    fclose(fp);
}

//hook Native函数
function attach(name, address) {
    console.log("attaching ", name);
    Interceptor.attach(address, {
        onEnter: function (args) {
            console.log("Entering => ", name)
            // console.log("args[0] => ",args[0].readCString() )
            // console.log("args[1] => ",args[1].readCString())
            // console.log( hexdump(args[1]))

            console.log("args[2] => ", args[2])
            // console.log('R0YSUE called from:\n' +
            // Thread.backtrace(this.context, Backtracer.ACCURATE)
            // .map(DebugSymbol.fromAddress).join('\n') + '\n');

        }, onLeave: function (retval) {
            console.log("exit => ", name)
            // console.log("retval is => ",retval.readCString())
        }
    })

}

//列出所有的导出函数，并hook
function traceNativeExport() {

    var modules = Process.enumerateModules();
    for (var i = 0; i < modules.length; i++) {
        var module = modules[i];

        if (module.name.indexOf("libc.so") < 0) {
            continue;
        }

        var exports = module.enumerateExports();
        for (var j = 0; j < exports.length; j++) {
            //console.log("module name is =>",module.name," symbol name is =>",exports[j].name)
            //var path = "/sdcard/Download/so/"+module.name+".txt"
            // var path = "/data/data/com.roysue.d0so2/cache/"+module.name+".txt"
            // writeSomething(path,"type: "+exports[j].type+" function name :"+exports[j].name+" address : "+exports[j].address+" offset => 0x"+ ( exports[j].address.sub(modules[i].base) )+"\n")
            // if(exports[j].name.indexOf("strto")>=0)continue;
            // if(exports[j].name.indexOf("strco")>=0)continue;
            // if(exports[j].name.indexOf("_l")>=0)continue;
            // if(exports[j].name.indexOf("pthread")>=0)continue;


            // if(exports[j].name.indexOf("socket")>=0){
            //     attach(exports[j].name,exports[j].address);
            // }
            if (exports[j].name.indexOf("pthread_create") >= 0) {
                attach(exports[j].name, exports[j].address);
            }
            // if(exports[j].name.indexOf("read")>=0){
            //     attach(exports[j].name,exports[j].address);
            // }
            // if(exports[j].name.indexOf("write")>=0){
            //     attach(exports[j].name,exports[j].address);
            // }
            // if(exports[j].name.indexOf("send")>=0){
            //     attach(exports[j].name,exports[j].address);
            // }
            // if(exports[j].name.indexOf("recv")>=0){
            //     attach(exports[j].name,exports[j].address);
            // }

        }
    }
}

//列出所有的符号函数，并hook
function traceNativeSymbol() {
    var modules = Process.enumerateModules();

    // console.log(JSON.stringify(modules))

    for (var i = 0; i < modules.length; i++) {
        var module = modules[i];
        // console.log(JSON.stringify(modules))

        // if(module.name.indexOf("linker64")<0){
        //     continue;
        // }

        var exports = module.enumerateSymbols();
        // console.log(JSON.stringify(exports))
        for (var j = 0; j < exports.length; j++) {

            // console.log("module name is =>",module.name," symbol name is =>",exports[j].name)
            var path = "/data/data/com.roysue.d0so2/cache/" + module.name + "Symbol.txt"
            writeSomething(path, "type: " + exports[j].type + " function name :" + exports[j].name + " address : " + exports[j].address + " offset => 0x" + (exports[j].address.sub(modules[i].base)) + "\n")
        }
    }
}


//枚举所有模块、及其导出函数、符号
function frida_enumerate() {
    //遍历所有模块
    let modules = Process.enumerateModules();
    for (let module of modules) {
        let module_name = module.name;
        let module_address = module.base;

        //列出该模块所有导出函数
        let exports = module.enumerateExports();
        for (let exp of exports) {
            let exp_name = exp.name;

            //TODO 1.找到目标函数名
            if (exp_name.indexOf(func_name) > -1) {
                console.log("\n===> 找到目标函数", module_name, exp_name);
                //获取目标函数名地址
                let exp_addr = exp.address;
                /*


                   ...


                * */
            }
        }

        //列出该模块所有符号
        let symbols = module.enumerateSymbols();
        for (let symbol of symbols) {
            let symbol_name = symbol.name;
            let symbol_address = symbol.address;
            /*
            *
            *
            * ...
            *
            *
            * */
        }
    }
}


/* 【***】 JNI => C++
*
*
* */
//将jsstring转为char *; jstring => char * => str
Java.vm.getEnv().getStringUtfChars(retval, null).readCString()


function main() {
    console.log("Entering main")
    traceNativeExport();
    // traceNativeSymbol();

}

setImmediate(main)
