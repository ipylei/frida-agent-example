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
    return  readStdString(stdString);
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

function hook_libart() {
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
        if (symbol.name.indexOf("ExecuteSwitchImpl") != -1) {
            Interceptor.attach(symbol.address, {
                onEnter: function (args) {
                    let shadowFrame_ptr = args[3];
                    let artMethodPtr = shadowFrame_ptr.add(Process.pointerSize).readPointer();
                    let funcName = getArtMethodName(artMethodPtr);
                    console.log("[" + Process.getCurrentThreadId() + "]ExecuteSwitchImpl", funcName);
                },
                onLeave: function (retval) {

                }
            })
        }
    })

    //取smali指令的地方
    //var loadopcodeoffset = libart.base.add(0x2301AC + 1);
    //console.log(hexdump(loadopcodeoffset.sub(1))); //sub回去再查看，是汇编指令
    //disassemble(loadopcodeoffset, 5);              //进行反汇编
    //Interceptor.attach(loadopcodeoffset, {});      //进行hook

    //模板函数的4个实例取smali指令都hook上
    let addr_list = [0x2241b0 + 1, 0x2050f0 + 1, 0x216c16 + 1, 0x231e86 + 1];
    addr_list.forEach(function (addr) {
        Interceptor.attach(libart.base.add(addr), {
            onEnter: function (args) {
                //打印寄存器
                console.log("[" + Process.getCurrentThreadId() + "]", JSON.stringify(this.context));
                //打印寄存器内容(ptr)指向的内存(smali指令码)。 这里是c++取出smali指令码的(偏移)地址存放到寄存器中(01:14:10)
                console.log(hexdump(this.context.r11, {length: 16}));
            },
            onLeave: function (retval) {

            }
        })
    })


}

function main() {

}

setImmediate(main)