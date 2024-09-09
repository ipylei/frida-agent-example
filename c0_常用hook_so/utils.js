function readStdString(str) {
    const isTiny = (str.readU8() & 1) == 0;
    if (isTiny) {
        return str.add(1).readUtf8String();
    }
    return str.add(2 * Process.pointerSize).readPointer().readUtf8String();
}


var PrettyMethodfunc;

function init() {
    let libart = Process.getModuleByName("libart.so");

    //找打PrettyMethod()，用于打印ArtMethod
    let PrettyMethodaddr = null;
    let exp_exports = libart.enumerateExports();
    for (let symbol of exp_exports) {
        if (symbol.name.indexOf("PrettyMethod") != -1 && symbol.name.indexOf("ArtMethod") != -1 && symbol.name.indexOf("art") != -1) {
            Log("find PrettyMethod:" + JSON.stringify(symbol));
            PrettyMethodaddr = symbol.address;
            break;
        }
    }
    PrettyMethodfunc = new NativeFunction(PrettyMethodaddr, ["pointer", "pointer", "pointer"], ["pointer", "int"]);
}


//将PrettyMethod()的结果打印出来，方法1
function getArtMethodName(artMethodPtr) {
    let result = PrettyMethodfunc(artMethodPtr, 1);
    let stdString = Memory.alloc(3 * Process.pointerSize);
    stdString.writePointer(result[0]);
    stdString.add(1 * Process.pointerSize).writePointer(result[1]);
    stdString.add(2 * Process.pointerSize).writePointer(result[2]);
    return readStdString(stdString);
}


//将PrettyMethod()的结果打印出来，方法2
function getArtMethodName_ByOther(artMethodPtr) {
    //首先定义为如下
    //PrettyMethodfunc = new NativeFunction(PrettyMethodaddr, "pointer", ["pointer", "pointer", "pointer"]);

    let strPtr = Memory.alloc(64);
    PrettyMethodfunc(strPtr, artMethodPtr, ptr(1));
    return readStdString(strPtr);
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
