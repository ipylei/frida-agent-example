//function printJavaStack(tag) {
//    Java.perform(function () {
//        console.log(tag + "\n" + Java.use("android.util.Log").getStackTraceString(Java.use("java.lang.Throwable").$new()));
//    });
//}


function printJavaStack(tag = "") {
    let threadClz = Java.use("java.lang.Thread");
    let androidLogClz = Java.use("android.util.Log");
    let exceptionClz = Java.use("java.lang.Exception");

    let currentThread = threadClz.currentThread();
    let threadId = currentThread.getId();
    let threadName = currentThread.getName();
    let stackInfo = androidLogClz.getStackTraceString(exceptionClz.$new()).substring(20);

    let logContent = `${tag}\n--->threadId=>${threadId}, threadName=>${threadName}, stackInfo=>\n${stackInfo}`;
    console.log(logContent);

    //console.log(Java.use("android.util.Log").getStackTraceString(Java.use("java.lang.Exception").$new()))
}


function hook_thread() {
    Java.perform(function () {
        var Thread = Java.use("java.lang.Thread");

        // 线程初始化
        //1.Thread构造函数传入一个Runnable接口
        //2.派生类(继承Thread)->覆写run方法
        Thread.init.implementation = function (arg0, arg1, arg2, arg3) {
            var res = this.init(arg0, arg1, arg2, arg3);
            var threadid = this.getId();

            var target = this.target.value;
            if (target) {
                let className = target.$className;
                //console.log("\n****** Runnable init, classname ==>", className, threadid);
                //printJavaStack("****** Runnable " + threadid);

                //(1.Thread构造函数传入一个Runnable接口)线程创建时的信息，及创建该线程时的调用栈
                let tag = `****** Runnable init, classname:${className}, NewThreadID:${threadid}`;
                printJavaStack(tag)
            } else {
                let className = this.$className;
                //console.log("\n****** The Thread classname ==>", className, threadid);
                //printJavaStack("****** The Thread " + threadid);

                //(2.派生类->继承Thread)线程创建时的信息，及创建该线程时的调用栈
                let tag = `****** Runnable |init|, classname:${className}, NewThreadID:${threadid}`;
                printJavaStack(tag)
            }

            return res;
        }

        // 线程执行
        Thread.run.implementation = function () {
            var threadid = this.getId();
            var className = this.$className;
            console.log("////// The Thread run, classname ==>", className, threadid, '\n\n\n');
            return this.run();
        }
    });
}

function main() {
    hook_thread();
}

setImmediate(main);
