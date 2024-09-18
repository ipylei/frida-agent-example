function print_arg(addr) {
    //try {
    //    return hexdump(addr) + "\r\n";
    //} catch (error) {
    //    return ptr(addr) + "\r\n";
    //}


    var range = Process.findRangeByAddress(addr);
    if (range != null) {
        return hexdump(addr) + "\r\n";
    } else {
        return ptr(addr) + "\r\n";
    }
}

function hook_native_addr(addr, idb_addr) {
    var base_hello_jni = Module.findBaseAddress("libjdbitmapkit.so");

    Interceptor.attach(addr, {
        onEnter: function (args) {
            this.arg0 = args[0];
            this.arg1 = args[1];
            this.arg2 = args[2];
            this.arg3 = args[3];
            this.lr = this.context.lr;

            //console.log("\r\n========================== >>>onEnter>>> ==========================");
            //console.log("[[[ ptr:" + ptr(addr) + " " + " ida_offset:" + ptr(idb_addr) + " LR:" + ptr(this.lr).sub(base_hello_jni) + " ]]]")
            //console.log("this.arg0=", this.arg0, "this.arg1=", this.arg1, "this.arg2=", this.arg2, "this.arg3=", this.arg3);
            //console.log("this.arg0:\r\n", print_arg(this.arg0));
            //console.log("this.arg1:\r\n", print_arg(this.arg1));
            //console.log("this.arg2:\r\n", print_arg(this.arg2));
            //console.log("this.arg3:\r\n", print_arg(this.arg3));
            //console.log("retval:\r\n", print_arg(retval));
            //console.log("========================== <<<onEnter<<< ==========================\r\n");
        }, onLeave: function (retval) {
            console.log("\r\n========================== >>>onLeave>>> ==========================");
            console.log("[[[ ptr:" + ptr(addr) + " " + " ida_offset:" + ptr(idb_addr) + " LR:" + ptr(this.lr).sub(base_hello_jni) + " ]]]")
            console.log("this.arg0=", this.arg0, "this.arg1=", this.arg1, "this.arg2=", this.arg2, "this.arg3=", this.arg3);
            console.log("this.arg0:\r\n", print_arg(this.arg0));
            console.log("this.arg1:\r\n", print_arg(this.arg1));
            console.log("this.arg2:\r\n", print_arg(this.arg2));
            console.log("this.arg3:\r\n", print_arg(this.arg3));
            console.log("retval:\r\n", print_arg(retval));
            console.log("========================== <<<onLeave<<< ==========================\r\n");
        }
    })
}


function hook_native_function(addr) {
    Interceptor.attach(addr, {
        onEnter: function (args) {
            var module = Process.findModuleByAddress(addr);
            this.args0 = args[0];
            this.args1 = args[1];
            this.args2 = args[2];
            this.args3 = args[3];
            this.args4 = args[4];
            this.logs = []
            this.logs.push("call " + module.name + "!" + ptr(addr).sub(module.base) + "\r\n");
            this.logs.push("this.args0: " + print_arg(this.args0));
            this.logs.push("this.args1: " + print_arg(this.args1));
            this.logs.push("this.args2: " + print_arg(this.args2));
            this.logs.push("this.args3: " + print_arg(this.args3));
            this.logs.push("this.args4: " + print_arg(this.args4));
        }, onLeave: function (ret) {
            this.logs.push("this.args0: onLeave: " + print_arg(this.args0));
            this.logs.push("this.args1: onLeave: " + print_arg(this.args1));
            this.logs.push("this.args2: onLeave: " + print_arg(this.args2));
            this.logs.push("this.args3: onLeave: " + print_arg(this.args3));
            this.logs.push("this.args4: onLeave: " + print_arg(this.args4));
            this.logs.push("retValue: " + print_arg(ret));
            console.log(this.logs)
        }
    })
}


function hook_native() {
    var base_hello_jni = Module.findBaseAddress("libhello-jni.so");
    // console.log(hexdump(base_hello_jni.add(0x3E070)));
    var sub_13558 = base_hello_jni.add(0x13558);
    // Interceptor.attach(sub_13558, {
    //     onEnter: function (args) {
    //         this.arg0 = args[0];
    //         this.arg1 = args[1];
    //         this.arg2 = args[2];
    //     }, onLeave: function (retval) {
    //         console.log("sub_13558:", hexdump(this.arg0), "\r\n",
    //             hexdump(this.arg1, { length: parseInt(this.arg2) }));
    //     }
    // })

    // hook_native_addr(base_hello_jni.add(0x12D70), 0x12D70);
    // hook_native_addr(base_hello_jni.add(0x13558), 0x13558);
    // hook_native_addr(base_hello_jni.add(0x162B8), 0x162B8);
    // hook_native_addr(base_hello_jni.add(0x130F0), 0x130F0);
    hook_native_addr(base_hello_jni.add(0x15F1C), 0x15F1C);
    // hook_native_addr(base_hello_jni.add(0x158AC), 0x158AC);

    Interceptor.attach(base_hello_jni.add(0x154D4), {
        onEnter: function (args) {
            this.arg0 = args[0];
            this.arg1 = args[1];
            this.arg2 = args[2];
        }, onLeave: function (retval) {
            console.log("\r\n========================== >>>onLeave>>> ==========================");
            console.log("[[[ 0x154D4 ]]]");
            console.log(hexdump(this.arg1, {length: parseInt(this.arg2)}));
            console.log("========================== <<<onLeave<<< ==========================\r\n");
        }
    })

}

function hook_java() {
    Java.perform(function () {
        var HelloJni = Java.use("com.example.hellojni.HelloJni");
        HelloJni.sign2.implementation = function (str, str2) {
            var result = this.sign2("0123456789abcde", "fedcba9876543210");
            console.log("Java sign2 result:", result);
            return result;
        }
    })
}

function main() {
    hook_java();

    hook_native();
}

setImmediate(main);


/* 批量hook Native层函数
*
* */