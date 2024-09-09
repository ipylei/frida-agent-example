var libnativelibmodule = null;

function excludebymodulename(modulename) {
    Process.enumerateModules().forEach(function (module) {
        if (module.name != modulename) {
            console.warn("exclude->" + JSON.stringify(module));
            Stalker.exclude(module);
        }
    })
}

function hooklib() {
    var module = Process.getModuleByName("libnative-lib.so");
    libnativelibmodule = module;
    var base = module.base;
    var size = module.size;
    var sub_25904_addr = base.add(0x25904);
    Interceptor.attach(sub_25904_addr, {
        onEnter: function (args) {
            this.thread = Process.getCurrentThreadId();
            console.log(Process.getCurrentThreadId() + "---" + "go into sub_25904");
            Stalker.trustThreshold = 0;
            excludebymodulename("libnative-lib.so");
            Stalker.follow(this.thread, {
                events: {
                    call: false, // CALL instructions: yes please
                    ret: false, // RET instructions
                    exec: false, // all instructions: not recommended as it's a lot of data
                    block: false, // block executed: coarse execution trace
                    compile: false // block compiled: useful for coverage
                },
                transform: function (iterator) {
                    var instruction = iterator.next();
                    var startAddress = instruction.address;
                    var isModuleCode = startAddress.compare(libnativelibmodule.base) >= 0 && startAddress.compare(libnativelibmodule.base.add(libnativelibmodule.size)) === -1;

                    do {
                        console.log("[" + Process.getCurrentThreadId() + "]---compile: ---offset:" + DebugSymbol.fromAddress(instruction.address) + instruction.toString());

                        if (isModuleCode) {
                            iterator.putCallout(function (context) {
                                var inst = Instruction.parse(context.pc).toString();
                                var newmoduleinfo = DebugSymbol.fromAddress(context.pc).toString();
                                console.log("[" + Process.getCurrentThreadId() + "]---run: ---offset:" + ptr(context.pc).sub(libnativelibmodule.base) + "moduleinfo:" + newmoduleinfo + " addr:" + context.pc + "---" + inst + "---before:" + JSON.stringify(context));
                            })
                        }

                        iterator.keep();

                        if (isModuleCode) {
                            iterator.putCallout(function (context) {
                                var inst = Instruction.parse(context.pc).toString();
                                var newmoduleinfo = DebugSymbol.fromAddress(context.pc).toString();
                                console.log("[" + Process.getCurrentThreadId() + "]---run: ---offset:" + ptr(context.pc).sub(libnativelibmodule.base) + "moduleinfo:" + newmoduleinfo + " addr:" + context.pc + "---" + inst + "---after:" + JSON.stringify(context));
                            })
                        }
                    } while ((instruction = iterator.next()) !== null);
                }
            })
        }, onLeave: function (retval) {
            Stalker.unfollow(this.thread);
            Stalker.garbageCollect();
            console.log(Process.getCurrentThreadId() + "---" + "leave sub_25904_addr");
        }
    });
}

function main() {
    hooklib();
}

setImmediate(main);


/*by 寒冰*/