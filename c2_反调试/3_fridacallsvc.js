function getpid() {
    //get pid syscall
    // .text:000000000001BCD0                             EXPORT syscall
    // .text:000000000001BCD0             syscall                                 ; CODE XREF: .syscall+C↑j
    // .text:000000000001BCD0                                                     ; DATA XREF: LOAD:00000000000058A8↑o ...
    // .text:000000000001BCD0             ; __unwind {
    // .text:000000000001BCD0 E8 03 00 AA                 MOV             X8, X0
    // .text:000000000001BCD4 E0 03 01 AA                 MOV             X0, X1
    // .text:000000000001BCD8 E1 03 02 AA                 MOV             X1, X2
    // .text:000000000001BCDC E2 03 03 AA                 MOV             X2, X3
    // .text:000000000001BCE0 E3 03 04 AA                 MOV             X3, X4
    // .text:000000000001BCE4 E4 03 05 AA                 MOV             X4, X5
    // .text:000000000001BCE8 E5 03 06 AA                 MOV             X5, X6
    // .text:000000000001BCEC 01 00 00 D4                 SVC             0
    // .text:000000000001BCFC C0 03 5F D6                 RET
    // .text:000000000001BCFC             ; } // starts at 1BCD0
    // .text:000000000001BCFC             ; End of function syscall
    var mysyscalladddr = Memory.alloc(128);
    ptr(mysyscalladddr).writeByteArray([0xE8, 0x03, 0x00, 0xAA,
        0xE0, 0x03, 0x01, 0xAA,
        0xE1, 0x03, 0x02, 0xAA,
        0xE2, 0x03, 0x03, 0xAA,
        0xE3, 0x03, 0x04, 0xAA,
        0xE4, 0x03, 0x05, 0xAA,
        0xE5, 0x03, 0x06, 0xAA,
        0x01, 0x00, 0x00, 0xD4,
        0xC0, 0x03, 0x5F, 0xD6]);
    Memory.protect(mysyscalladddr, 128, "rwx");
    var mysyscallfunc = new NativeFunction(mysyscalladddr, 'int', ['int', 'pointer', 'pointer', 'pointer', 'pointer', 'pointer', 'pointer', 'pointer']);

    // 172: getpid()
    var pid = mysyscallfunc(172, ptr(0x0), ptr(0x0), ptr(0x0), ptr(0x0), ptr(0x0), ptr(0x0), ptr(0x0));
    console.warn("pid->" + pid);
    return pid;
}

function main() {
    getpid();
}
setImmediate(main);

/*frida自实现syscall，直接传入系统调用号即可调用
* */