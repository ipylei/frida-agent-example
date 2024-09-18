//扫描内存中的可执行段，对所有svc系统调用处进行hook
/*
*
* */

function getSocketDetail() {

}

function hook_addr(addr) {
    Interceptor.attach(addr, {
        onEnter: function (args) {
            this.args0 = this.context.r0;
            this.args1 = this.context.r1;
            this.args2 = this.context.r2;
            this.syscallnum = this.context.r7.toInt32();  //获取系统调用号
            //sendto的系统调用号是290
            if (this.syscallnum == 290) {
                console.log("sendto ---------------------------------- start");
                console.log("this is a __NR_sendto!");
                //参数1是socket id, 参数2是缓冲区，参数3是缓冲区大小
                console.log("sendto: ", getSocketDetail(this.args0.toInt32(),));
                console.log(hexdump(this.args1, this.args2.toInt32()))
                console.log("sendto ---------------------------------- end");
            }
        },
        onLeave: function (retval) {
            this.recvsize = this.context.r0;
            console.log(" --> ", Process.getCurrentThreadId());
            if (this.syscallnum == 292) {
                console.log(" NR_recvfrom onLeave ---------------------------------start");

                console.log(" NR_recvfrom onLeave ---------------------------------end");
            }
        }
    })
}

function disassemble(addr, count) {
    for (var i = 0; i < count; i++) {
        try {
            //对机器码进行反汇编，得到汇编指令
            let ins = Instruction.parse(addr);
            if (ins.toString() == "svc #0") {
                var moduleinfo = DebugSymbol.fromAddress(addr);
                if (moduleinfo.toString().indexOf("libnative-lib.so") >= 0) {
                    console.log("addr: ", addr, "moduleinfo:", moduleinfo, "---dis: ", ins);
                    hook_addr(addr);
                }
            }
            addr = ins.next;
        } catch (e) {
            console.log("disassemble error!", e);
        }
    }
}

//扫描可执行段
function findSyscall(range) {
    //svc 0 = 000000EF
    Memory.scanSync(range.base, range.size, "00 00 00 ef").forEach(function (match) {
        console.log("find syscall: ", JSON.stringify(range), '-----------------------start');
        //查找地址/名称的调试信息并将其作为对象返回
        let moduleinfo = DebugSymbol.fromAddress(match.address);
        console.log("module info: ", moduleinfo.toString());
        console.log(JSON.stringify(match));
        if (moduleinfo.toString().indexOf("libnative-lib.so") >= 0) {
            //进行反汇编
            disassemble(match.address, 5);
        }
        console.log("find syscall: ", JSON.stringify(range), '-----------------------end');

    })
}

//枚举所有的可执行段
function enumerateRanges() {
    Process.enumerateRanges("--x").forEach(function (range) {
        console.log(JSON.stringify(range));
        findSyscall(range);
    })
}