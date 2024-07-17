function hook_constructor() {
    if (Process.pointerSize == 4) {
        var linker = Process.findModuleByName("linker");
    } else {
        var linker = Process.findModuleByName("linker64");
    }

    var addr_call_function = null;
    var addr_g_ld_debug_verbosity = null;
    var addr_async_safe_format_log = null;
    if (linker) {
        //console.log("found linker");
        var symbols = linker.enumerateSymbols();
        for (var i = 0; i < symbols.length; i++) {
            var name = symbols[i].name;
            if (name.indexOf("call_function") >= 0) {
                addr_call_function = symbols[i].address;
                // console.log("call_function",JSON.stringify(symbols[i]));
            } else if (name.indexOf("g_ld_debug_verbosity") >= 0) {
                addr_g_ld_debug_verbosity = symbols[i].address;
                ptr(addr_g_ld_debug_verbosity).writeInt(2);
            } else if (name.indexOf("async_safe_format_log") >= 0 && name.indexOf('va_list') < 0) {
                // console.log("async_safe_format_log",JSON.stringify(symbols[i]));
                addr_async_safe_format_log = symbols[i].address;

            }

        }
    }
    /* 这里JNI_OnLoad函数还未加载
    console.log("----------------------------------------------------------------------------");
        let exp = Module.findExportByName("liblessontest.so", "JNI_OnLoad");
        if (exp) {
            console.log("√ 找到了JNI_OnLoad函数", exp);
        } else {
            console.log("× 没有找到JNI_OnLoad函数", exp);
        }
    */


    if (addr_async_safe_format_log) {
        Interceptor.attach(addr_async_safe_format_log, {
            onEnter: function (args) {
                this.log_level = args[0];
                this.tag = ptr(args[1]).readCString()
                this.fmt = ptr(args[2]).readCString()
                if (this.fmt.indexOf("c-tor") >= 0 && this.fmt.indexOf('Done') < 0) {
                    this.function_type = ptr(args[3]).readCString(); // func_type
                    this.so_path = ptr(args[5]).readCString();

                    //var strs = new Array(); //定义一数组
                    var strs //定义一数组
                    strs = this.so_path.split("/"); //字符分割
                    this.so_name = strs.pop();
                    this.func_offset = ptr(args[4]).sub(Module.findBaseAddress(this.so_name))
                    console.log("\nfunc_type:", this.function_type,
                        '\nfunc_offset:', this.func_offset,
                        '\nso_name:', this.so_name,
                        '\nso_path:', this.so_path
                    );
                    console.log("==============================================");

                    // -------------- hook代码在这加 --------------------

                    /* 这里JNI_OnLoad函数已经加载
                    let exp = Module.findExportByName(this.so_name, "JNI_OnLoad");
                    let exp = Module.findExportByName("liblessontest.so", "JNI_OnLoad");
                    if (exp) {
                        console.log("√ 找到了JNI_OnLoad函数", exp);
                    }
                    else{
                        console.log("× 没有找到JNI_OnLoad函数", exp);
                    }*/

                }
            },
            onLeave: function (retval) {
            }
        })
    }
}


function main() {
    hook_constructor();
}

setImmediate(main);
