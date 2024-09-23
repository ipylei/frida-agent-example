function call_1CFF0(input_str) {
    var base_hello_jni = Module.findBaseAddress("libhello-jni.so");
    var sub_1CFF0 = new NativeFunction(base_hello_jni.add(0x1CFF0), "int", ["pointer", "int", "pointer"]);
    // var input_str = "0123456789abcdef";

    var arg0 = Memory.allocUtf8String(input_str);
    var arg1 = input_str.length;
    var arg2 = Memory.alloc(arg1);
    sub_1CFF0(arg0, arg1, arg2);

}

function get_diff_regs(context, pre_regs) {
    var diff_regs = {};
    // console.log(Object.keys(JSON.parse(JSON.stringify(context))));
    for (const [reg_name, reg_value] of Object.entries(JSON.parse(JSON.stringify(context)))) {
        if (reg_name != "pc" && pre_regs[reg_name] !== reg_value) {
            pre_regs[reg_name] = reg_value;
            diff_regs[reg_name] = reg_value;
        }
    }
    return diff_regs;
}

function StalkerTrace() {
    var base_hello_jni = Module.findBaseAddress("libhello-jni.so");
    var sub_1CFF0 = base_hello_jni.add(0x1CFF0);
    console.log(sub_1CFF0);
    var module_hello_jni = Process.findModuleByName("libhello-jni.so");

    var module_start = module_hello_jni.base;
    var module_end = module_hello_jni.base + module_hello_jni.size;
    var pre_regs = {}

    Interceptor.attach(sub_1CFF0, {
        onEnter: function (args) {
            this.arg0 = args[0];
            this.arg1 = args[1];
            this.arg2 = args[2];
            this.tid = Process.getCurrentThreadId();

            Stalker.follow(this.tid, {
                events: {
                    call: false, // CALL instructions: yes please

                    // Other events:
                    ret: false, // RET instructions
                    exec: true, // all instructions: not recommended as it's
                    //                   a lot of data
                    block: false, // block executed: coarse execution trace
                    compile: false // block compiled: useful for coverage
                },

                // onCallSummary(summary) {
                //     console.log("onCallSummary:", Object.entries(summary));
                // },

                //TODO 可以批量hook；也可以处理IDA-JUMPOUT
                /*onReceive(events) {
                    //console.log(Stalker.parse(events))
                    //var all_events = Object.entries(Stalker.parse(events));
                    //for (const [index, event] of all_events) {
                    //    if (event.indexOf("exec") >= 0) {
                    //        var address = event.toString().split(",")
                    //        var addr1 = address[1];
                    //        var module1 = Process.findModuleByAddress(addr1);
                    //        if (module) {
                    //            console.log("onReceive:", module1.name + "!" + ptr(addr1).sub(module1.base), Instruction.parse(ptr(addr1)));
                    //        }
                    //    }
                    //}
                    var all_events = Stalker.parse(events);
                    console.log("onReceive: ", all_events.length);
                    for (var i = 0; i < all_events.length; i++) {
                        var event = all_events[i];
                        var type = event[0];
                        if (type.indexOf("call") >= 0) {
                            var addr1 = event[1];
                            var addr2 = event[2];
                            var module1 = Process.findModuleByAddress(addr1);
                            if (module1 && module1.name.indexOf("libnative-lib.so") > -1) {
                                var module2 = Process.findModuleByAddress(addr2);
                                console.log("call:", module1.name + "!@" + addr1.sub(module1.base), module2.name + "!@" + addr2.sub(module1.base));
                            }
                        }
                    }
                },
                */

                /*trace 指令*/
                transform(iterator) {
                    let instruction = iterator.next();
                    do {
                        const startAddress = instruction.address;
                        const is_module_code = startAddress.compare(module_start) >= 0 && startAddress.compare(module_end) === -1;
                        if (is_module_code) {
                            // console.log(startAddress, instruction);
                            iterator.putCallout(function (context) {
                                var pc = context.pc;
                                var module = Process.findModuleByAddress(pc);
                                if (module) {
                                    var diff_regs = get_diff_regs(context, pre_regs);
                                    console.log(module.name + "!" + ptr(pc).sub(module.base), Instruction.parse(ptr(pc)), JSON.stringify(diff_regs));
                                }
                            });
                        }
                        iterator.keep();
                    } while ((instruction = iterator.next()) !== null);
                }
            });

        }, onLeave: function (retval) {
            Stalker.unfollow(this.tid);
            Stalker.garbageCollect();
            console.log("sub_1CFF0:", hexdump(this.arg0, {length: parseInt(this.arg1)}),
                "\r\n", hexdump(this.arg2, {length: parseInt(this.arg1)}))
        }
    })
}


setImmediate(StalkerTrace);

/*y*/