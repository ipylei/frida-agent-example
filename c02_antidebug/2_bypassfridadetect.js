//sdcard/maps  cp /proc/5748/maps /sdcard
//sdcard/status cp /proc/5748/task/5748/status /sdcard
function LogPrint(log) {
    var theDate = new Date();
    var hour = theDate.getHours();
    var minute = theDate.getMinutes();
    var second = theDate.getSeconds();
    var mSecond = theDate.getMilliseconds();

    hour < 10 ? hour = "0" + hour : hour;
    minute < 10 ? minute = "0" + minute : minute;
    second < 10 ? second = "0" + second : second;
    mSecond < 10 ? mSecond = "00" + mSecond : mSecond < 100 ? mSecond = "0" + mSecond : mSecond;
    var time = hour + ":" + minute + ":" + second + ":" + mSecond;
    var threadid = Process.getCurrentThreadId();
    console.log("[" + time + "]" + "->threadid:" + threadid + "--" + log);

}

//用于绕过frida检测
function hooklibc() {
    //hook readlink
    Interceptor.attach(Module.findExportByName(null, "readlink"), {
            onEnter: function (args) {
                this.aaa = args[0];
                this.bbb = args[1];
                this.ccc = args[2];
            }, onLeave: function (retval) {
                var s2str = this.bbb.readCString();
                if (s2str.indexOf("/data/local/tmp/re.frida.server/linjector") != -1) {
                    //修改返回值，重定向到其他文件；同时记得修改函数return返回值：len("/system/framework/boot.art") = 26
                    this.bbb.writeUtf8String("/system/framework/boot.art");
                    retval.replace(0x1A);
                }
                console.log('\nreadlink(' + 's1="' + this.aaa.readCString() + '"' + ', s2="' + this.bbb.readCString() + '"' + ', s3="' + this.ccc + '"' + ')');
            }
        }
    );
    
    // hook open
    var libcmodule = Process.getModuleByName("libc.so");
    var openaddr = libcmodule.getExportByName("open");
    Interceptor.attach(openaddr, {
        onEnter: function (args) {
            var filepath = ptr(args[0]).readCString();
            LogPrint("open:" + filepath);

            if (filepath.indexOf("/maps") != -1) {
                try {
                    //重定向maps文件到/sdcard
                    //ptr(args[0]).writeUtf8String("/sdcard/ooxx/maps");
                    ptr(args[0]).writeUtf8String("/sdcard/maps");
                    LogPrint("reditect to file /sdcard/maps");
                } catch (e) {

                }

            }
            if (filepath.indexOf("/su") != -1) {
                try {
                    ptr(args[0]).writeUtf8String("/xxx/su")
                } catch (e) {

                }

            }
            if (filepath.indexOf("/status") != -1) {
                //ptr(args[0]).writeUtf8String("/ooxx");
                ptr(args[0]).writeUtf8String("/sdcard/status");
            }
            //LogPrint("open replace:" + ptr(args[0]).readCString());

        }, onLeave: function (retval) {
            //LogPrint("open return:" + retval);
        }
    });
}

function main() {
    //bypass frida detection
    hooklibc();
}

setImmediate(main);

/* rom定制内核快速定位到反调试处，然后使用frida绕过。
* */
