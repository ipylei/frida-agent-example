//java层打印调用栈 -> 将信息组合起来，然后统一打印
/*
function newMethodBeat(text, executor) {
    var threadClz = Java.use("java.lang.Thread");
    var androidLogClz = Java.use("android.util.Log");
    var exceptionClz = Java.use("java.lang.Exception");
    var currentThread = threadClz.currentThread();
    var beat = new Object();
    beat.invokeId = Math.random().toString(36).slice(-8);
    beat.executor = executor;
    beat.threadId = currentThread.getId();
    beat.threadName = currentThread.getName();
    beat.text = text;
    beat.startTime = new Date().getTime();
    beat.stackInfo = androidLogClz.getStackTraceString(exceptionClz.$new()).substring(20);
    return beat;
};
function printBeat(beat) {
    let str = ("------------startFlag:" + beat.invokeId + ",objectHash:" + beat.executor + ",thread(id:" + beat.threadId + ",name:" + beat.threadName + "),timestamp:" + beat.startTime + "---------------\n");
    str += beat.text + "\n";
    str += beat.stackInfo;
    str += ("------------endFlag:" + beat.invokeId + ",usedtime:" + (new Date().getTime() - beat.startTime) + "---------------\n");
    console.log(str);
};*/


//打印java byte[](以16进制)
function printJava() {
    let result;
    let ByteString = Java.use("com.android.okhttp.okio.ByteString");
    ByteString.of(result).hex()
}


function jhexdump(array) {
    var ptr = Memory.alloc(array.length); //API手动开辟的内存区域
    for (var i = 0; i < array.length; ++i)
        Memory.writeS8(ptr.add(i), array[i]);
    //console.log(hexdump(ptr, { offset: off, length: len, header: false, ansi: false }));
    console.log(hexdump(ptr, {offset: 0, length: array.length, header: false, ansi: false}));
}




var isLite = false;
var ByPassTracerPid = function () {
    var fgetsPtr = Module.findExportByName("libc.so", "fgets");
    var fgets = new NativeFunction(fgetsPtr, 'pointer', ['pointer', 'int', 'pointer']);
    Interceptor.replace(fgetsPtr, new NativeCallback(function (buffer, size, fp) {
        var retval = fgets(buffer, size, fp);
        var bufstr = Memory.readUtf8String(buffer);
        if (bufstr.indexOf("TracerPid:") > -1) {
            Memory.writeUtf8String(buffer, "TracerPid:\t0");
            console.log("tracerpid replaced: " + Memory.readUtf8String(buffer));
        }
        return retval;
    }, 'pointer', ['pointer', 'int', 'pointer']));
};
// setImmediate(ByPassTracerPid);

(function () {
    let Color = {
        RESET: "\x1b[39;49;00m",
        Black: "0;01",
        Blue: "4;01",
        Cyan: "6;01",
        Gray: "7;11",
        Green: "2;01",
        Purple: "5;01",
        Red: "1;01",
        Yellow: "3;01"
    };
    let LightColor = {
        RESET: "\x1b[39;49;00m",
        Black: "0;11",
        Blue: "4;11",
        Cyan: "6;11",
        Gray: "7;01",
        Green: "2;11",
        Purple: "5;11",
        Red: "1;11",
        Yellow: "3;11"
    };
    var colorPrefix = '\x1b[3';
    var colorSuffix = 'm';

    for (let c in Color) {
        if (c == "RESET") continue;
        console[c] = function () {
            var message = [...arguments].join(" ");
            console.log(colorPrefix + Color[c] + colorSuffix + message + Color.RESET);
        }
        console["Light" + c] = function () {
            var message = [...arguments].join(" ");
            console.log(colorPrefix + LightColor[c] + colorSuffix + message + Color.RESET);
        }
    }
})();


console.Black("Black,", "hello wolrd");
console.Blue("Blue", "hello wolrd");
console.Cyan("Cyan", "hello wolrd");
console.Gray("Gray", "hello wolrd");
console.Green("Green", "hello wolrd");
console.Purple("Purple", "hello wolrd");
console.Red("Red", "hello wolrd");
console.Yellow("Yellow", "hello wolrd");
console.LightYellow("Yellow", "hello wolrd");