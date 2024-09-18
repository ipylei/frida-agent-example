function func() {
    Java.perform(function () {
        //let module = Process.findModuleByName("libnative-lib.so");
        //let module = Process.findModuleByName("liblessontest.so");
        //let module = Process.findModuleByName("libc.so");
        //let module = Process.findModuleByName("libart.so");

        //let exps = module.enumerateExports()
        //for (let exp of exps) {
        //    //console.log(exp.type, " || ", exp.name);
        //    if (exp.name.indexOf("pthread_create") > -1)
        //        console.log(exp.type, " || ", exp.name, " || ", exp.address);
        //}
        //console.log("exps.length", exps.length);


        //console.log("=================================================")
        //let symbols = module.enumerateSymbols();
        //for (let symbol of symbols) {
        //    //console.log(symbol.type, " || ", symbol.name);
        //
        //    if (symbol.name.indexOf("pthread_create") > -1) {
        //        console.log(symbol.type, " || ", symbol.name, " || ", symbol.address);
        //    }
        //}
        //console.log("symbols.length", symbols.length);


        //var libc_addr = Process.findModuleByName("libc.so").base;
        //console.log("--> libc address is " + libc_addr);
        //// 0x10 转为十进制为 16, 读取
        //console.log(libc_addr.readByteArray(0x10));
        //// readPointer(), 从此内存位置读取 NativePointer
        //console.log("pointer size", Process.pointerSize);
        //console.log("readPointer() is " + libc_addr.readPointer());
        //console.log("Memory.readPointer()" + Memory.readPointer(libc_addr.add(Process.pointerSize)));


        //var libc_addr = Process.findModuleByName("libc.so").base;
        //console.log("libc_addr : " + libc_addr);
        //// 分配四个字节的空间地址
        //const r = Memory.alloc(4);
        //// 将 libc_addr 指针写入刚申请的 r 中
        //r.writePointer(libc_addr);
        //// 读取 r 指针的数据
        //var buffer = Memory.readByteArray(r, 4);
        //console.log(buffer);


        //    // 定义一个需要写入的字节数组
        //    var arr = [0x72, 0x6F, 0x79, 0x73, 0x75, 0x65];
        ////这里申请以arr大小的内存空间
        //    var r = Memory.alloc(arr.length);
        //// 将 arr 写入 r 中
        //    r.writeByteArray(arr);
        //// Memory.writeByteArray(r, arr); 同样可以写入
        //    console.log("memory readbyteArray: ")
        //    console.log(r.readByteArray(arr.length));
        //    console.log(Memory.readByteArray(r, arr.length));


        // 开辟内存空间 存有字符串
        var r = Memory.allocUtf8String("你好,世界");
        // 读取内存中的字符串
        console.log(hexdump(r));
        console.log(r.readCString());
        // 往内存中写入新的字符串
        r.writeUtf8String("Hello,World");
        console.log(hexdump(r));
        console.log(r.readCString())
    })
}

//setImmediate(func)