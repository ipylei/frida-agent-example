function hook_wb_aes_ecb() {
    var base = Module.findBaseAddress("libcryptoDD.so")
    console.log("base => ", base)
    Interceptor.attach(base.add(0x17BD5), {
        onEnter: function (args) {
            var inPtr = ptr(args[0]);
            this.in_len = args[1].toUInt32();
            this.outPtr = ptr(args[2]);
            console.log("inData => ", hexdump(inPtr), {
                length: this.in_len
            })
            console.log("mode => ", args[3].toInt32())
        },
        onLeave: function (retval) {
            console.log("outData => ", hexdump(this.outPtr), {
                length: this.in_len
            })
        }
    })
}

function hook_coff() {
    var base = Module.findBaseAddress("libcryptoDD.so");
    Interceptor.attach(base.add(0x15321), {
        onEnter: function (args) {
            console.log("Enter coff ...")
        },
        onLeave: function (retval) {
        }
    })
}

function hook_xlc() {
    var base = Module.findBaseAddress("libcryptoDD.so")
    Interceptor.attach(base.add(0x14F99), {
        onEnter: function (args) {
            console.log("Enter xlc ...")
        },
        onLeave: function (retval) {
        }
    })
}

function randomNum(minNum, maxNum) {
    if (arguments.length === 1) {
        return parseInt(Math.random() * minNum + 1, 10);
    } else if (arguments.length === 2) {
        return parseInt(Math.random() * (maxNum - minNum + 1) + minNum, 10);
    } else {
        return 0;
    }
}

function hexToBytes(hex) {
    for (var bytes = [], c = 0; c < hex.length; c += 2)
        bytes.push(parseInt(hex.substr(c, 2), 16));
    return bytes;
}

function bufferToHex(buffer) {
    return [...new Uint8Array(buffer)]
        .map(b => b.toString(16).padStart(2, "0"))
        .join("");
}

function call_wb_aes_ecb() {
    var base = Module.findBaseAddress("libcryptoDD.so")
    var func_addr = base.add(0x17BD5)
    var wbaes_native_func = new NativeFunction(func_addr, "int", ["pointer", "int", "pointer", "int"])
    var inDataPtr = Memory.alloc(0x10)
    var inDataArray = hexToBytes("30313233343536373839616263646566")
    Memory.writeByteArray(inDataPtr, inDataArray)
    var outDataPtr = Memory.alloc(0x10)
    wbaes_native_func(inDataPtr, 0x10, outDataPtr, 0)
    var out = Memory.readByteArray(outDataPtr, 0x10)
    console.log("out => ", bufferToHex(out))
    // console.log(hexdump(outDataPtr,{length:0x10}))
}

function hook_shift_row() {
    var base = Module.findBaseAddress("libcryptoDD.so")
    var count = 0
    Interceptor.attach(base.add(0x14F99), {
        onEnter: function (args) {
            count += 1
            // console.log("count => ", count)
            if (count % 9 === 0) {
                // args[0].writeS8(0x0)
                args[0].add(randomNum(0, 15)).writeS8(randomNum(0, 0xff))
            }
        },
        onLeave: function (retval) {
        }
    })
}

//DFA攻击
function crack_wb_get_exp() {
    hook_shift_row()
    for (var i = 0; i < 200; i++) {
        call_wb_aes_ecb()
    }
}

function main() {
    Java.perform(function () {
        // hook_coff()   //确认是否走这个分支
        // hook_xlc()    //确认是否走这个分支
        
        // hook_wb_aes_ecb()
        // hook_shift_row()  //hook 循环左移
        // call_wb_aes_ecb() //主动调用加密函数
        crack_wb_get_exp() //DFA攻击
    })
}

setImmediate(main)
