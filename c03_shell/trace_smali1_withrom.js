function TraceFunction() {
    var libcmodule = Process.getModuleByName("libc.so");
    var strstraddr = libcmodule.getExportByName("strstr");
    Interceptor.attach(strstraddr, {
        onEnter: function (args) {
            //strstr(funcname,"EnableTraceExecution")
            this.arg0 = ptr(args[0]).readCString();
            this.arg1 = ptr(args[1]).readCString();

            if (this.arg1 == "TraceExecutionDetail") {
                console.warn(this.arg0);
            }

        }, onLeave: function (retval) {
            if (this.arg1 == "EnableTraceExecution") {
                if(this.arg0.indexOf("com.xgtl.aggregate.activities.SplashActivity")!=-1){
                    console.log("go into "+this.arg0);
                    retval.replace(0x1);
                }
                //console.warn(this.arg0 + " enter " + this.arg1);
            }
        }
    })
}

function main() {
    TraceFunction();
}

setImmediate(main)

/*
* 注：frida配合rom使用，trace并打印单条smali指令 (29)
* */