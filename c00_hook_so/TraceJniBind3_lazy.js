function getHandle(object) {
    var handle = null;
    try {
        handle = object.$handle;
    } catch (e) {
    }

    if (handle == null) {
        try {
            handle = object.$h;
        } catch (e) {
        }

    }
    if (handle == null) {
        try {
            handle = object.handle;
        } catch (e) {
        }
    }

    return handle;
}

function Log(content) {
    var pid = Process.getCurrentThreadId();
    console.log("[" + pid + "]->" + content);
}

function readStdString(str) {
    const isTiny = (str.readU8() & 1) == 0;
    if (isTiny) {
        return str.add(1).readUtf8String();
    }
    return str.add(2 * Process.pointerSize).readPointer().readUtf8String();
}

function getnameofArtMethod(artmethod) {
    var libartmodule = Process.getModuleByName("libart.so");
    var PrettyMethodaddr = null;
    var RegisterNativeaddr = null;
    libartmodule.enumerateExports().forEach(function (symbol) {
        if (symbol.name.indexOf("PrettyMethod") != -1 && symbol.name.indexOf("ArtMethod") != -1 && symbol.name.indexOf("art") != -1) {
            PrettyMethodaddr = symbol.address;
        }
        if (symbol.name.indexOf("RegisterNativeMethod") == -1 && symbol.name.indexOf("ArtMethod") != -1 && symbol.name.indexOf("RegisterNative") != -1) {
            RegisterNativeaddr = symbol.address;
        }
    });
    var PrettyMethodfunc = new NativeFunction(PrettyMethodaddr, ["pointer", "pointer", "pointer"], ["pointer", "int"]);
    var result = PrettyMethodfunc(artmethod, 1);
    var stdstring = Memory.alloc(3 * Process.pointerSize);
    ptr(stdstring).writePointer(result[0]);
    ptr(stdstring).add(1 * Process.pointerSize).writePointer(result[1]);
    ptr(stdstring).add(2 * Process.pointerSize).writePointer(result[2]);
    var funcnamestring = readStdString(stdstring);
    return funcnamestring;
    //console.log(artmethod+"--funcname:"+funcnamestring);
    //var addrinfo = DebugSymbol.fromAddress(ptr(this.JniFuncaddr));
}

function traceJniBind3_lazy() {
    Java.perform(function () {
        var haclass = Java.use("com.ekassir.mirpay.app.ha");
        console.log(haclass);
        haclass.i.overloads.forEach(function (overload) {
            var artmethod = getHandle(overload);
            var funcname = getnameofArtMethod(ptr(artmethod)); //绑定的函数名
            //console.log(artmethod,funcname);
            var addr = ptr(artmethod).add(24).readPointer();  //绑定的JNI机器码入口地址(24 or 32)
            //console.log(hexdump(ptr(artmethod)))
            var addrdetail = DebugSymbol.fromAddress(addr);
            console.log(funcname + ",addr:" + addr + ",detail:" + addrdetail);

        })
    })

}

function getMyJniBindAddr() {
    Java.perform(function () {
        var thisclass = Java.use("com.hanbingle.vmpprotect.MainActivity");
        thisclass.compute.overloads.forEach(function (overload) {
            var artmethod = getHandle(overload);
            var funcname = getnameofArtMethod(ptr(artmethod));
            //console.log(artmethod,funcname);
            var addr = ptr(artmethod).add(24).readPointer();
            //console.log(hexdump(ptr(artmethod)))
            var addrdetail = DebugSymbol.fromAddress(addr);
            console.log(funcname + ",addr:" + addr + ",detail:" + addrdetail);
        })
    })

}

function main() {
    traceJniBind3_lazy();
}

setImmediate(main);


/*针对于某些APP不使用env->RegisterNatives()等接口进行动态注册，而是直接设置偏移的情况。
可以等APP运行一段时间后，从内存中找到ArtMethod对应JNI机器码入口。
*/