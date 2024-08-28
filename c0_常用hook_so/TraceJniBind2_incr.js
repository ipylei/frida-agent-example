(function () {
    let Color = {
        RESET: "\x1b[39;49;00m",
        Black: "0;01",
        Blue: "4;01",
        Cyan: "6;01",
        Gray: "7;11",
        "Green": "2;01",
        Purple: "5;01",
        Red: "1;01",
        Yellow: "3;01"
    };
    let LightColor = {
        RESET: "\x1b[39;49;00m",
        Black: "0;11",
        Blue: "4;11",
        Cyan: "6;11",
        Gray: "7;01",
        "Green": "2;11",
        Purple: "5;11",
        Red: "1;11",
        Yellow: "3;11"
    };
    var colorPrefix = '\x1b[3', colorSuffix = 'm'
    for (let c in Color) {
        if (c == "RESET") continue;
        console[c] = function (message) {
            console.log(colorPrefix + Color[c] + colorSuffix + message + Color.RESET);
        }
        console["Light" + c] = function (message) {
            console.log(colorPrefix + LightColor[c] + colorSuffix + message + Color.RESET);
        }
    }
})();

function readStdString(str) {
    const isTiny = (str.readU8() & 1) == 0;
    if (isTiny) {
        return str.add(1).readUtf8String();
    }
    return str.add(2 * Process.pointerSize).readPointer().readUtf8String();
}

function getArtMethodFuncName(artmethodptr) {
    var libartmodule = Process.getModuleByName("libart.so");
    var PrettyMethodaddr1 = libartmodule.getExportByName("_ZN3art9ArtMethod12PrettyMethodEPS0_b");
    var PrettyMethodaddr2 = libartmodule.getExportByName("_ZN3art9ArtMethod12PrettyMethodEb");
    //console.log("find art::ArtMethod::PrettyMethod(art::ArtMethod*, bool):" + PrettyMethodaddr1);
    //console.log("find art::ArtMethod::PrettyMethod(bool):" + PrettyMethodaddr2);
    var PrettyMethod1func = new NativeFunction(PrettyMethodaddr1, ['pointer', 'pointer', 'pointer'], ['pointer', 'bool']);
    var PrettyMethod2func = new NativeFunction(PrettyMethodaddr2, ['pointer', 'pointer', 'pointer'], ['pointer', 'bool']);
    var result = PrettyMethod2func(artmethodptr, 1);
    var stdstring = Memory.alloc(3 * Process.pointerSize);
    ptr(stdstring).writePointer(result[0]);
    ptr(stdstring).add(1 * Process.pointerSize).writePointer(result[1]);
    ptr(stdstring).add(2 * Process.pointerSize).writePointer(result[2]);
    var funcnamestring = readStdString(stdstring);
    return funcnamestring;
}

function tracefirstbind() {
//void ArtMethod::UnregisterNative()->_ZN3art9ArtMethod16UnregisterNativeEv
    console.log(Process.arch);
    // "arm"
    // "arm64"
    if (Process.arch == "arm") {
        var libartmodule = Process.getModuleByName("libart.so");
        var UnregisterNativeaddr = libartmodule.getExportByName("_ZN3art9ArtMethod16UnregisterNativeEv");
        console.log("find UnregisterNative:" + UnregisterNativeaddr);
        Interceptor.attach(UnregisterNativeaddr, {
            onEnter: function (args) {
                var artmethodptr = ptr(args[0]);
                var funcnamestring = getArtMethodFuncName(artmethodptr);
                console.log("UnregisterNative->" + funcnamestring);

            }, onLeave: function (retval) {

            }
        })
    }
    if (Process.arch == "arm64") {

    }


}

function traceotherbind() {
//void ArtMethod::UnregisterNative()->_ZN3art9ArtMethod16UnregisterNativeEv
    console.log(Process.arch);
    // "arm"
    // "arm64"
    if (Process.arch == "arm") {
        var libartmodule = Process.getModuleByName("libart.so");

        //var FindCodeForNativeMethodaddr = libartmodule.getExportByName("_ZN3art9JavaVMExt23FindCodeForNativeMethodEPNS_9ArtMethodE");
        //console.log("find FindCodeForNativeMethodaddr:" + FindCodeForNativeMethodaddr);

        //静态注册：FindNativeMethodInternal
        libartmodule.enumerateSymbols().forEach(function (symbol) {
            if (symbol.name.indexOf("FindNativeMethodInternal") != -1) {
                console.log("find FindNativeMethodInternal->" + JSON.stringify(symbol));
                Interceptor.attach(symbol.address, {
                    onEnter: function (args) {
                        /*void* FindNativeMethodInternal(Thread* self,
                                 void* declaring_class_loader_allocator,
                                 const char* shorty,
                                 const std::string& jni_short_name,
                                 const std::string& jni_long_name)*/
                        var jni_short_name_stdstring = args[4];
                        var jni_long_name_stdstring = args[5];
                        this.jni_short_name_str = readStdString(jni_short_name_stdstring);
                        this.jni_long_name_str = readStdString(jni_long_name_stdstring);
                        //console.log(this.jni_short_name_str+"---"+this.jni_long_name_str);
                    }, onLeave: function (retval) {
                        var funcaddr = ptr(retval);
                        var funcdetail = DebugSymbol.fromAddress(funcaddr);
                        console.Blue("[FindNativeMethodInternal]->" + this.jni_short_name_str + "---" + this.jni_long_name_str + "---" + funcaddr + ",==>" + funcdetail);

                    }
                });
            }

        })


        //动态注册的jni函数：env->RegisterNatives()
        //_ZN3art3JNI15RegisterNativesEP7_JNIEnvP7_jclassPK15JNINativeMethodi
        libartmodule.enumerateSymbols().forEach(function (symbol) {
            if (symbol.name.indexOf("RegisterNatives") != -1 && symbol.name.indexOf("CheckJNI") == -1) {
                console.log("find RegisterNatives->" + JSON.stringify(symbol));
                Interceptor.attach(symbol.address, {
                    onEnter: function (args) {
                        /*RegisterNatives(JNIEnv* env,
                                          jclass java_class,
                                          const JNINativeMethod* methods,
                                          jint method_count)*/
                        var method_count = args[3];
                        var methodsptr = args[2];
                        console.Yellow("[Jni->RegisterNatives]methodcount:" + method_count);
                        for (var i = 0; i < method_count; i++) {
                            /*typedef struct {
                                const char* name;
                                const char* signature;
                                void*       fnPtr;
                            } JNINativeMethod;*/
                            var name = ptr(methodsptr).add(i * 3 * Process.pointerSize).add(0).readPointer().readCString();
                            var signature = ptr(methodsptr).add(i * 3 * Process.pointerSize).add(1 * Process.pointerSize).readPointer().readCString();
                            var fnPtr = ptr(methodsptr).add(i * 3 * Process.pointerSize).add(2 * Process.pointerSize).readPointer();
                            var funcdetail = DebugSymbol.fromAddress(fnPtr);
                            console.Red("[Jni->RegisterNatives sss]name:" + name + ",sig:" + signature + ",fnPtr:" + fnPtr + ",==>" + funcdetail);
                        }

                    }, onLeave: function (retval) {

                    }
                })

            }
        })

        //ArtMethod::RegisterNative
        var RegisterNativeaddr = libartmodule.getExportByName("_ZN3art9ArtMethod14RegisterNativeEPKvb");
        Interceptor.attach(RegisterNativeaddr, {
            onEnter: function (args) {
                var artmethodptr = args[0];
                var bindaddr = args[1];
                var funcnaame = getArtMethodFuncName(ptr(artmethodptr));
                var funcdetail = DebugSymbol.fromAddress(bindaddr);
                console.log('[RegisterNative]' + funcnaame + ",addr:" + bindaddr + ",==>" + funcdetail);

            }, onLeave: function (retval) {

            }
        });


    }
    if (Process.arch == "arm64") {

    }


}

function tracejnibind() {
    //tracefirstbind();
    traceotherbind();
}

function main() {
    tracejnibind();
}

setImmediate(main);

/*
相比于TraceJniBind1.js，虽然没有hook libc中的dlsym

但hook了静态注册：
    静态注册：FindNativeMethodInternal
    动态注册：env->RegisterNatives()
    动态+静态：ArtMethod::RegisterNative
*/