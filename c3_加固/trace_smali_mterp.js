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

    //打印下面4个解释器引擎入口函数，当前执行的Java方法(ArtMethod)名称
    //当然直接Hook Execute更好，这样就只hook了一个地方
    libart.enumerateSymbols().forEach(function (symbol) {
        if (symbol.name.indexOf("ExecuteMterpImpl") != -1) {
            Interceptor.attach(symbol.address, {
                onEnter: function (args) {
                    let shadowFrame_ptr = args[2];
                    let artMethodPtr = shadowFrame_ptr.add(Process.pointerSize).readPointer();
                    let funcName = getArtMethodName(artMethodPtr);
                    console.log("[" + Process.getCurrentThreadId() + "] ExecuteMterpImpl", funcName);
                },
                onLeave: function (retval) {

                }
            })
        }
    })

    //取smali指令的地方
    let pattern = "FF C0 07 E2 8C F3 88 E0";
    Memory.scan(libart.base, libart.size, pattern, {
        onMatch: function (match) {
            console.log("get-> ", match)
            console.log(hexdump(match));

            let addr = match.add(0x1)
            disassemble(addr, 5); //thumb指令还是需要+1

            //hook上
            Interceptor.attach(addr, {
                onEnter: function (args) {
                    //打印寄存器
                    console.log("[" + Process.getCurrentThreadId() + "]", JSON.stringify(this.context));
                    //打印寄存器的内容(smali指令码)。 这里是汇编取出操作码存放到寄存器 (02:08:30)
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

}

setImmediate(main)