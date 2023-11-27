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