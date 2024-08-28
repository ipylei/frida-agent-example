function LogPrint() {
    console.log(Process.getCurrentThreadId(), "->", ...arguments)
}


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

//将PrettyMethod()的结果打印出来，方法2
function getArtMethodName_ByOther(artMethodPtr) {
    //首先定义为如下
    //PrettyMethodfunc = new NativeFunction(PrettyMethodaddr, "pointer", ["pointer", "pointer", "pointer"]);

    let strPtr = Memory.alloc(64);
    PrettyMethodfunc(strPtr, artMethodPtr, ptr(1));
    return readStdString(strPtr);
}


let PrettyMethodfunc;

function hook_libart() {
    let libart = Process.findModuleByName("libart.so");

    let PrettyMethodaddr = null;
    let exp_exports = libart.enumerateExports();
    PrettyMethodfunc = new NativeFunction(PrettyMethodaddr, ["pointer", "pointer", "pointer"], ["pointer", "int"]);
    for (let symbol of exp_exports) {
        if (symbol.name.indexOf("PrettyMethod") != -1 && symbol.name.indexOf("ArtMethod") != -1 && symbol.name.indexOf("art") != -1) {
            //Log("find PrettyMethod:" + JSON.stringify(symbol));
            PrettyMethodaddr = symbol.address;
            break;
        }
    }

    libart.enumerateSymbols().forEach(function (symbol) {
        //console.log(JSON.stringify(symbol));

        if (symbol.name.indexOf("InvokeWithArgArray") != -1) {
            Interceptor.attach(symbol.address, {
                onEnter: function (args) {
                    let artMethodPtr = args[1];
                    //this.artMethodPtr = artMethodPtr;
                    this.artMethodName = getArtMethodName(artMethodPtr);
                    LogPrint("enter==>", this.artMethodName);
                },
                onLeave: function (retval) {
                    LogPrint("leave<==", this.artMethodName);
                }
            })
        }
    })
}


function hook_java() {
    Java.perform(function () {
        let MainActivity = Java.use("com.xxx.MainActivity");
        MainActivity.onCreate.implementation = function (bundle) {
            console.log("call begin!");
            hook_libart();
            let result = this.onCreate(bundle);
            console.log("called over!");

            return result;
        }
    })
}


function main() {

}

