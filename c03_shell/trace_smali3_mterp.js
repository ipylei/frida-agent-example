function readStdString(str) {
    const isTiny = (str.readU8() & 1) == 0;
    if (isTiny) {
        return str.add(1).readUtf8String();
    }
    return str.add(2 * Process.pointerSize).readPointer().readUtf8String();
}

//将PrettyMethod()的结果打印出来
function getArtMethodName(artMethodPtr) {
    let result = PrettyMethodfunc(artMethodPtr, 1);
    let stdString = Memory.alloc(3 * Process.pointerSize);
    stdString.writePointer(result[0]);
    stdString.add(1 * Process.pointerSize).writePointer(result[1]);
    stdString.add(2 * Process.pointerSize).writePointer(result[2]);
    return readStdString(stdString);
}

function disassemble(addr, count) {
    for (var i = 0; i < count; i++) {
        try {
            //对机器码进行反汇编，得到汇编指令
            let ins = Instruction.parse(addr);
            //反汇编结果
            console.log(ptr(addr), ":", ins.mnemonic, ins.opStr);
            addr = ins.next;
        } catch (e) {
            console.log("disassemble error!", e);
        }
    }
}

let PrettyMethodfunc;

function hook_mterp() {
    let libart = Process.getModuleByName("libart.so");

    //找打PrettyMethod()，用于打印ArtMethod
    let PrettyMethodaddr = null;
    let exp_exports = libart.enumerateExports();
    for (let symbol of exp_exports) {
        if (symbol.name.indexOf("PrettyMethod") != -1 && symbol.name.indexOf("ArtMethod") != -1 && symbol.name.indexOf("art") != -1) {
            //Log("find PrettyMethod:" + JSON.stringify(symbol));
            PrettyMethodaddr = symbol.address;
            break;
        }
    }
    PrettyMethodfunc = new NativeFunction(PrettyMethodaddr, ["pointer", "pointer", "pointer"], ["pointer", "int"]);

    //TODO 其实这里就相当于插桩了，只是不知道调用方是谁，还需要实现，但可以在OnLeave中标志结束
    //直接Hook Execute更好，这样就只hook了一个地方，只是Execute是inline函数
    //打印下面引擎入口函数，当前执行的Java方法(ArtMethod)名称    【注意：加上容易卡死】
    //extern "C" bool ExecuteMterpImpl(Thread* self, const DexFile::CodeItem* code_item, ShadowFrame* shadow_frame, JValue* result_register);
    //libart.enumerateSymbols().forEach(function (symbol) {
    //    if (symbol.name.indexOf("ExecuteMterpImpl") != -1) {
    //        Interceptor.attach(symbol.address, {
    //            onEnter: function (args) {
    //                let shadowFrame_ptr = args[2];
    //                let artMethodPtr = shadowFrame_ptr.add(Process.pointerSize).readPointer();
    //                let funcName = getArtMethodName(artMethodPtr);
    //                console.log("[" + Process.getCurrentThreadId() + "] ExecuteMterpImpl", funcName);
    //            },
    //            onLeave: function (retval) {
    //
    //            }
    //        })
    //    }
    //})

    //取smali指令的地方
    let pattern = "FF C0 07 E2 8C F3 88 E0";
    Memory.scan(libart.base, libart.size, pattern, {
        onMatch: function (match) {
            //console.log("get-> ", match)
            //console.log(hexdump(match, {length: 128}));

            let addr = match;
            //disassemble(addr, 5); //thumb指令还是需要+1

            //hook上
            Interceptor.attach(addr, {
                onEnter: function (args) {
                    //打印寄存器
                    //console.log("[" + Process.getCurrentThreadId() + "]", JSON.stringify(this.context));
                    //(02:08:30) r7是opcode

                    //.text:003EAC38 90 FF FF FA                 BLX             MterpSetUpHotnessCountdown
                    //.text:003EAC3C 00 A0 A0 E1                 MOV             R10, R0
                    //.text:003EAC40 B0 70 D4 E1                 LDRH            R7, [R4]
                    //.text:003EAC44 FF C0 07 E2                 AND             R12, R7, #0xFF
                    //.text:003EAC48 8C F3 88 E0                 ADD             PC, R8, R12,LSL#7
                    console.log(this.context.r7);
                },
                onLeave: function (retval) {

                }
            })


        },
        onComplete: function () {
            console.log("scan over")
        },
        onError: function (reason) {
            console.log("scan error! ", reason)
        }
    })


}

function main() {
    hook_mterp();
}

setImmediate(main)


/* frida hook汇编实现的解释器其取smali指令的地方，打印取出的opCode (参考Fart课时31)
* */