/*
    // hook 检测frida 的方法，
    // 这里是已经确定哪个函数在检测frida特征的情况下，现在想阻止启动线程去检测？
*/

function hook_frida_check() {
    // var exports = Process.findModuleByName("libnative-lib.so").enumerateExports(); 导出
    // var imports = Process.findModuleByName("libnative-lib.so").enumerateImports(); 导入
    // var symbols = Process.findModuleByName("libnative-lib.so").enumerateSymbols(); 符号

    var pthread_create_addr = null;
    var symbols = Process.getModuleByName("libc.so").enumerateSymbols();
    for (var i = 0; i < symbols.length; i++) {
        var symbol = symbols[i];
        if (symbol.name === "pthread_create") {
            pthread_create_addr = symbol.address;
            console.log("pthread_create name is ->", symbol.name);
            console.log("pthread_create address is ->", pthread_create_addr);
        }
    }

    //Java.perform(function () {
    // 定义方法 之后主动调用的时候使用
    var pthread_create = new NativeFunction(pthread_create_addr, 'int', ['pointer', 'pointer', 'pointer', 'pointer'])
    Interceptor.replace(pthread_create_addr, new NativeCallback(function (a0, a1, a2, a3) {
        console.log("a0,a1,a2,a3 ->", a0, a1, a2, a3);

        var result = null;
        var detect_frida_loop = Module.findExportByName("libnative-lib.so", "_Z17detect_frida_loopPv");
        if (String(a2) === String(detect_frida_loop)) {
            result = 0;
            console.log("阻止frida反调试启动");
        } else {
            result = pthread_create(a0, a1, a2, a3);
            console.log("正常启动");
        }
        return result;
    }, 'int', ['pointer', 'pointer', 'pointer', 'pointer']));
    //})
}


setImmediate(hook_frida_check)