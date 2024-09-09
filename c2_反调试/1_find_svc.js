function LogPrint(log) {
    var theDate = new Date();
    var hour = theDate.getHours();
    var minute = theDate.getMinutes();
    var second = theDate.getSeconds();
    var mSecond = theDate.getMilliseconds();

    hour < 10 ? hour = "0" + hour : hour;
    minute < 10 ? minute = "0" + minute : minute;
    second < 10 ? second = "0" + second : second;
    mSecond < 10 ? mSecond = "00" + mSecond : mSecond < 100 ? mSecond = "0" + mSecond : mSecond;
    var time = hour + ":" + minute + ":" + second + ":" + mSecond;
    var threadid = Process.getCurrentThreadId();
    console.log("[" + time + "]" + "->threadid:" + threadid + "--" + log);

}

function findSyscall(base, size) {
    var svcsyscalladdrlist = [];
    Memory.scan(base, size, "01 00 00 D4", {
        onMatch: function (matchaddr) {
            var addrinfo = DebugSymbol.fromAddress(matchaddr);
            console.warn("find a sycsyscall:" + addrinfo);
            disassemble(matchaddr.sub(4), 4);
            svcsyscalladdrlist.push(matchaddr);


        }, onComplete: function () {
            console.warn("search svc syscall over");
        }
    });
}

function findSyscallByEnumerateRange() {
    LogPrint("go into findsyscallbyenumeraterange");
    Process.enumerateRanges('r-x').forEach(function (range) {

        if (JSON.stringify(range).indexOf("libnative-lib.so") != -1) {
            console.error(JSON.stringify(range));
            findSyscall(range.base, range.size);
        }
    });
}

function disassemble(address, count) {
    for (var i = 0; i < count; i++) {
        try {
            var ins = Instruction.parse(ptr(address));
            console.log("" + ptr(address) + ": " + ins.mnemonic + " " + ins.opStr);
            //address = address.add(4);
            address = ins.next;

        } catch (e) {

        }

    }

}

function exclude() {
    var modules = Process.enumerateModules();
    modules.forEach(function (module) {
        if (module.name.indexOf('libnative-lib') < 0) {
            console.log("ignore module:" + module.name + "--base:" + module.base + "---size:" + module.size + "---end:" + module.base.add(module.size));
            Stalker.exclude(module);
        } else {
            console.log("stalker trace module:" + module.name + "--base:" + module.base + "---size:" + module.size + "---end:" + module.base.add(module.size));
        }
    });


}

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
                ptr(addr_g_ld_debug_verbosity).writeInt(2); //设置变量>1，开启日志

            } else if (name.indexOf("async_safe_format_log") >= 0 && name.indexOf('va_list') < 0) {
                // console.log("async_safe_format_log",JSON.stringify(symbols[i]));
                addr_async_safe_format_log = symbols[i].address;
            }
        }
    }

    /*
      http://aospxref.com/android-8.1.0_r81/xref/bionic/linker/linker_debug.h#77
      TRACE("[ Calling d-tor %s @ %p for '%s' ]", function_name, function, realpath);
      function();
      TRACE("[ Done calling d-tor %s @ %p for '%s' ]", function_name, function, realpath);
      
      而：
      #define TRACE(x...)          _PRINTVF(1, x)
      #define _PRINTVF(v, x...)    if (g_ld_debug_verbosity > (v)) async_safe_format_log(5-(v), "linker", x);  
      
      int async_safe_format_log(int priority, const char* tag, const char* format, ...) {}
    */

    if (addr_async_safe_format_log) {
        Interceptor.attach(addr_async_safe_format_log, {
            onEnter: function (args) {
                this.log_level = args[0];                            //日志等级
                this.tag = ptr(args[1]).readCString();               //日志tag
                this.fmt = ptr(args[2]).readCString();               //日志格式(format)

                /*
                  TRACE("[ Calling c-tor %s @ %p for '%s' ]", function_name, function, realpath);
                  function(g_argc, g_argv, g_envp);
                  TRACE("[ Done calling c-tor %s @ %p for '%s' ]", function_name, function, realpath);
                */
                if (this.fmt.indexOf("c-tor") >= 0 && this.fmt.indexOf('Done') < 0) {
                    this.function_type = ptr(args[3]).readCString(); //func_type "DT_INIT" or "DT_INIT_ARRAY"
                    this.so_path = ptr(args[5]).readCString();       //so路径

                    var strs = new Array();         //定义一数组
                    strs = this.so_path.split("/"); //字符分割
                    this.so_name = strs.pop();
                    this.func_offset = ptr(args[4]).sub(Module.findBaseAddress(this.so_name))
                    console.log("func_type:", this.function_type,
                        '\nso_name:', this.so_name,
                        '\nso_path:', this.so_path,
                        '\nfunc_offset:', this.func_offset
                    );

                    //func_type: DT_INIT
                    if (this.function_type == "DT_INIT" && this.so_name == "libnative-lib.so") {
                        var libnativelib = Process.getModuleByName("libnative-lib.so");

                        //1.内存遍历
                        //findSyscall(libnativelib.base, libnativelib.size);
                        //findSyscallByEnumerateRange();

                        //2.指令跟踪
                        var sub_7c30 = libnativelib.base.add(0x7c30);
                        console.log(hexdump(sub_7c30));
                        Interceptor.attach(sub_7c30, {
                            onEnter: function (args) {
                                console.error("go into sub_7c30");
                                this.threadid = Process.getCurrentThreadId();
                                //Stalker.trustThreshold = -1;
                                exclude();
                                Stalker.follow(this.threadid, {
                                    events: {
                                        call: false, // CALL instructions: yes please
                                        // Other events:
                                        ret: false, // RET instructions
                                        exec: false, // all instructions: not recommended as it's a lot of data
                                        block: false, // block executed: coarse execution trace
                                        compile: false // block compiled: useful for coverage
                                    },
                                    transform: function (iterator) {
                                        var instruction;
                                        var basicblockstart = false;
                                        while ((instruction = iterator.next()) !== null) {
                                            //编译轨迹：按基本块编译，但是不一定执行该基本块中的所有指令，比如跳转指令跳转到其他基本块
                                            console.log(Process.getCurrentThreadId()
                                                + "compile---addr:" + DebugSymbol.fromAddress(instruction.address)
                                                + "->" + instruction + "");

                                            //执行轨迹
                                            /* iterator.putCallout(function (context) {
                                                 var inst = Instruction.parse(context.pc).toString();
                                                 if (inst.toString().indexOf("svc")!=-1) {
                                                     var syscallnumber=context.x8;
                                                     var moduleinfo = DebugSymbol.fromAddress(context.pc).toString();
                                                     console.log(Process.getCurrentThreadId() + "---run svc sn:"+syscallnumber+"," + moduleinfo + " addr:" + context.pc + "---" + inst);
                                                 }

                                             })*/
                                            iterator.keep();

                                        }
                                    }
                                });
                            },
                            //----------
                            onLeave: function (retval) {
                                Stalker.unfollow(this.threadid);
                                Stalker.garbageCollect();
                            }
                        })
                    }

                    // hook代码在这加
                }
            },
            onLeave: function (retval) {
            }
        })
    }
}

function main() {
    //hooklibc();
    hook_constructor();
}

setImmediate(main);


/*
内存遍历如Memory.scan等          [√]
指令跟踪如Stalker/Unidbg等       [√]
内核跟踪如定制内核、内核模块等
*/