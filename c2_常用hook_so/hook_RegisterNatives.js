function find_RegisterNatives(params) {
    let symbols = Module.enumerateSymbolsSync("libart.so");
    let addrRegisterNatives = null;
    for (let i = 0; i < symbols.length; i++) {
        let symbol = symbols[i];

        //_ZN3art3JNI15RegisterNativesEP7_JNIEnvP7_jclassPK15JNINativeMethodi
        if (symbol.name.indexOf("art") >= 0 &&
            symbol.name.indexOf("JNI") >= 0 &&
            symbol.name.indexOf("RegisterNatives") >= 0 &&
            symbol.name.indexOf("CheckJNI") < 0) {
            addrRegisterNatives = symbol.address;
            console.log("====> RegisterNatives is at ", symbol.address, symbol.name);
            hook_RegisterNatives(addrRegisterNatives)
        }
    }

}

function hook_RegisterNatives(addrRegisterNatives) {
    if (addrRegisterNatives != null) {
        Interceptor.attach(addrRegisterNatives, {
            onEnter: function (args) {
                console.log("[RegisterNatives] method_count:", args[3]);
                let java_class = args[1];
                let class_name = Java.vm.tryGetEnv().getClassName(java_class);
                let methods_ptr = ptr(args[2]);
                let method_count = parseInt(args[3]);
                for (let i = 0; i < method_count; i++) {
                    let name_ptr = Memory.readPointer(methods_ptr.add(i * Process.pointerSize * 3));
                    let sig_ptr = Memory.readPointer(methods_ptr.add(i * Process.pointerSize * 3 + Process.pointerSize));
                    let fnPtr_ptr = Memory.readPointer(methods_ptr.add(i * Process.pointerSize * 3 + Process.pointerSize * 2));

                    let name = Memory.readCString(name_ptr);
                    let sig = Memory.readCString(sig_ptr);
                    let symbol = DebugSymbol.fromAddress(fnPtr_ptr);
                    //0x7cbcd56114 liblessontest.so!_Z8onCreateP7_JNIEnvP8_jobjectS2_

                    let module_name = /\w+.so/.exec(symbol.toString())[0];
                    console.log("================?", module_name);
                    let module_addr = Module.findBaseAddress(module_name);
                    // console.log("[RegisterNatives] java_class:", class_name, "name:", name, "sig:", sig, "fnPtr:", fnPtr_ptr,  " fnOffset:", symbol, " callee:", DebugSymbol.fromAddress(this.returnAddress));
                    // console.log(`----->[RegisterNatives] 类名=> ${class_name}", 方法名=> ${name}, 方法签名=> ${sig}, 内存地址=>${fnPtr_ptr}, 所在模块信息=> ${symbol}, 调用者=> ${DebugSymbol.fromAddress(this.returnAddress)}`);

                    console.log(`----->[RegisterNatives] 类名=> ${class_name}", 方法名=> ${name}, 方法签名=> ${sig}, 所在模块名=> ${module_name}, offset=> ${fnPtr_ptr.sub(module_addr)}`);
                }
            }
        });
    }
}

setImmediate(find_RegisterNatives);
