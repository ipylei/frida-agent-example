function hook_14E20() {
    var baseAddr = Module.findBaseAddress("libnative-lib.so")
    var symbols = Module.enumerateSymbolsSync("libart.so");
    symbols.forEach(function (item) {
        console.log(JSON.stringify( item))
    })
    Interceptor.attach(baseAddr.add(0x14E20), {
        onEnter: function (args) {
            console.log("Entering 0x14E20...")
            this.tid = Process.getCurrentThreadId();

            Stalker.follow(this.tid, {
                events: {
                    call: true, // CALL instructions: yes please

                    // Other events:
                    ret: false, // RET instructions
                    exec: false, // all instructions: not recommended as it's
                    //                   a lot of data
                    block: false, // block executed: coarse execution trace
                    compile: false // block compiled: useful for coverage
                },
                // onReceive(events) {
                //     var all_events = Stalker.parse(events);
                //     console.log("onReceive: ", all_events.length);
                //     all_events.forEach(function (i) {
                //         // console.log(i);
                //         try {
                //             var addr1 = i[1];
                //             var module1 = Process.getModuleByAddress(addr1);
                //             if (module1 != null && module1.name == "libnative-lib.so") {
                //                 var addr2 = i[2];
                //                 var module2 = Process.getModuleByAddress(addr2);
                //                 console.log("call: ", module1.name + "!" + addr1.sub(module1.base), module2.name + "!" + addr2.sub(module2.base))
                //             }
                //         } catch (error) {
                //             console.log("error:", error)
                //         }
                //     })
                // },
                onCallSummary(summary) {
                    // console.log(JSON.stringify(summary))
                    for (const target in summary) {
                        const number = summary[target];
                        var module = Process.findModuleByAddress(target);
                        if (module != null && module.name == "libnative-lib.so") {
                            console.log(module.name + "!" + ptr(target).sub(module.base), number);
                        }
                    }

                }
            })
        }, onLeave: function (retVal) {
            console.log("Entering 0x14E20...")
            Stalker.unfollow(this.tid)

        }
    })
}

function hook_native_function(addr) {
    Interceptor.attach(addr, {
        onEnter: function (args) {
            var module = Process.findModuleByAddress(addr);
            this.args0 = args[0];
            this.args1 = args[1];
            this.args2 = args[2];
            this.args3 = args[3];
            this.args4 = args[4];
            this.logs = []
            this.logs.push("call " + module.name + "!" + ptr(addr).sub(module.base) + "\r\n");
            this.logs.push("this.args0: " + print_arg(this.args0));
            this.logs.push("this.args1: " + print_arg(this.args1));
            this.logs.push("this.args2: " + print_arg(this.args2));
            this.logs.push("this.args3: " + print_arg(this.args3));
            this.logs.push("this.args4: " + print_arg(this.args4));
        }, onLeave: function (ret) {
            this.logs.push("this.args0: onLeave: " + print_arg(this.args0));
            this.logs.push("this.args1: onLeave: " + print_arg(this.args1));
            this.logs.push("this.args2: onLeave: " + print_arg(this.args2));
            this.logs.push("this.args3: onLeave: " + print_arg(this.args3));
            this.logs.push("this.args4: onLeave: " + print_arg(this.args4));
            this.logs.push("retValue: " + print_arg(ret));
            console.log(this.logs)
        }
    })
}

function print_arg(addr){
    var range = Process.findRangeByAddress(addr);
    if(range!=null){
        return hexdump(addr)+"\r\n";
    }else{
        return ptr(addr)+"\r\n";
    }
}


function main() {
    // hook_14E20()
    var baseAddr = Module.findBaseAddress("libnative-lib.so")
    hook_native_function(baseAddr.add(0x12c0c));
    // hook_native_function(baseAddr.add(0xf6e0));  free
    hook_native_function(baseAddr.add(0x5796c));
    hook_native_function(baseAddr.add(0x103a4));
    hook_native_function(baseAddr.add(0x13e18));
    hook_native_function(baseAddr.add(0x157fc));
    // hook_native_function(baseAddr.add(0xf670));  malloc
    hook_native_function(baseAddr.add(0x5971c));
    hook_native_function(baseAddr.add(0x59670));
    hook_native_function(baseAddr.add(0x177f8));
    hook_native_function(baseAddr.add(0x19a84));
    hook_native_function(baseAddr.add(0x57bec));
    // hook_native_function(baseAddr.add(0xf310));     new
    // hook_native_function(baseAddr.add(0xf580));      delete
    hook_native_function(baseAddr.add(0x16a94));
    // hook_native_function(baseAddr.add(0xf6a0));       memset
    hook_native_function(baseAddr.add(0xff10));
    hook_native_function(baseAddr.add(0x16514));
    hook_native_function(baseAddr.add(0x151a4));
    hook_native_function(baseAddr.add(0xfcac));
    hook_native_function(baseAddr.add(0x18024));
    // hook_native_function(baseAddr.add(0xf680));         memcpy
    hook_native_function(baseAddr.add(0x57514));
    // hook_native_function(baseAddr.add(0xf630));     strlen
    hook_native_function(baseAddr.add(0x167c0));
    hook_native_function(baseAddr.add(0x12580));
    hook_native_function(baseAddr.add(0x17ce8));
    hook_native_function(baseAddr.add(0x18540));

}

function invoke(str){
    Java.perform(function (){
        var javaString = Java.use('java.lang.String').$new(str)
        var result = Java.use("com.kanxue.algorithmbase.MainActivity").encodeFromJni_70(javaString);
        console.log("result is => ",result)
    })
}
setImmediate(main)



//call:  libnative-lib.so!0x14ebc

//sub_57514
//sub_57BEC

//dword_754BC
//0x18D8D8C



/*r*/