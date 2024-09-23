var PrettyMethodfunc = null;
var DumpString = null;
var DumpHex = null;
var addrGetDexFile = null;
var funcGetDexFile = null;
var addrGetObsoleteDexCache = null;

function readStdString(str) {
    const isTiny = (str.readU8() & 1) == 0;
    if (isTiny) {
        return str.add(1).readUtf8String();
    }
    return str.add(2 * Process.pointerSize).readPointer().readUtf8String();
}

function callprettymethod(artmethodptr) {
    if (PrettyMethodfunc == null) {
        var libartmodule = Process.getModuleByName("libart.so");
        /*        libartmodule.enumerateSymbols().forEach(function (symbol) {
                    if (symbol.name.indexOf("PrettyMethod") != -1) {
                        console.log(JSON.stringify(symbol));
                    }
                })*/
        var PrettyMethodaddr = libartmodule.getExportByName("_ZN3art9ArtMethod12PrettyMethodEb");
        PrettyMethodfunc = new NativeFunction(PrettyMethodaddr, ["pointer", "pointer", "pointer"], ["pointer", "pointer"]);
        //console.log("PrettyMethodfunc->" + PrettyMethodfunc);
    }
    var result = PrettyMethodfunc(artmethodptr, ptr(1));
    var stdstring = Memory.alloc(3 * Process.pointerSize);
    ptr(stdstring).writePointer(result[0]);
    ptr(stdstring).add(1 * Process.pointerSize).writePointer(result[1]);
    ptr(stdstring).add(2 * Process.pointerSize).writePointer(result[2]);
    var funcnamestring = readStdString(stdstring);
    return funcnamestring;
}

function getDetailOfInstruction(dexfile, instruction) {
    //[*]
    var DumpStringresult = DumpString(instruction, dexfile);
    var stdstring = Memory.alloc(3 * Process.pointerSize);
    ptr(stdstring).writePointer(DumpStringresult[0]);
    ptr(stdstring).add(1 * Process.pointerSize).writePointer(DumpStringresult[1]);
    ptr(stdstring).add(2 * Process.pointerSize).writePointer(DumpStringresult[2]);
    var DumpStringStr = readStdString(stdstring);

    //[*]
    var DumpHexresult = DumpHex(instruction, 100);
    ptr(stdstring).writePointer(DumpHexresult[0]);
    ptr(stdstring).add(1 * Process.pointerSize).writePointer(DumpHexresult[1]);
    ptr(stdstring).add(2 * Process.pointerSize).writePointer(DumpHexresult[2]);
    var DumpHexStr = readStdString(stdstring);
    //删除多余的空格
    DumpHexStr = DumpHexStr.replace(/ /g, "");

    //将0x替换掉，然后获取当前指令所占的字节数，如0x1070 0x0d50 0x0000 = 12/2 =6 字节
    var instrucsionsize = DumpHexStr.replace(/0x/g, "").length / 2;
    let prefix = instrucsionsize + "," + DumpHexStr;
    return prefix.padEnd(30, " ") + "|" + DumpStringStr;
    //console.log("dumpstringresult:" + DumpHexStr + "," + DumpStringStr);
}

function init() {
    console.log("go into init," + "Process.arch:" + Process.arch);
    var module_libext = null;
    if (Process.arch === "arm64") {
        module_libext = Module.load("/data/app/fart64.so");
    } else if (Process.arch === "arm") {
        module_libext = Module.load("/data/app/fart.so");
    }
    if (module_libext != null) {
        addrGetDexFile = module_libext.findExportByName("GetDexFile8");
        funcGetDexFile = new NativeFunction(addrGetDexFile, "pointer", ["pointer", "pointer"]);
        console.log("init addrGetDexFile: ", addrGetDexFile);
        console.log("init funcGetDexFile: ", funcGetDexFile);
    }

    var symbols = Module.enumerateSymbolsSync("libart.so");
    for (var i = 0; i < symbols.length; i++) {
        var symbol = symbols[i];
        //_ZN3art9ArtMethod19GetObsoleteDexCacheEv
        if (symbol.name.indexOf("ArtMethod") >= 0 && symbol.name.indexOf("GetObsoleteDexCache") >= 0) {
            addrGetObsoleteDexCache = symbol.address;
            console.log("init addrGetObsoleteDexCache: ", addrGetObsoleteDexCache);
            break;
        }
    }
}

function disassemble(address, count) {
    for (var i = 0; i < count; i++) {
        var ins = Instruction.parse(ptr(address));
        console.log("" + ptr(address) + ": " + ins.mnemonic + " " + ins.opStr);
        address = ins.next;
    }

}

function trace_smali0_mterp_DumpString() {
    var libartmodule = Process.getModuleByName("libart.so");
    var DumpStringaddr = null;
    var DumpHexaddr = null;
    var LoadMethodaddr = null;
    // libartmodule.getExportByName("_ZNK3art11Instruction10DumpStringEPKNS_7DexFileE");
    libartmodule.enumerateSymbols().forEach(function (symbol) {
        if (symbol.name.indexOf("Instruction") != -1 && symbol.name.indexOf("DumpString") != -1) {
            DumpStringaddr = symbol.address;
        }
        //if (symbol.name.indexOf("Instruction") != -1 && symbol.name.indexOf("DumpHex") != -1 && symbol.name.indexOf("DumpHexLE") == -1) {
        if (symbol.name.indexOf("Instruction") != -1 && symbol.name.indexOf("DumpHexLE") != -1) {
            DumpHexaddr = symbol.address;
        }
        if (symbol.name.indexOf("LoadMethod") != -1 && symbol.name.indexOf("ClassLinker") != -1) {
            LoadMethodaddr = symbol.address;
        }
    })

    console.log("DumpStringaddr->" + DumpStringaddr);
    console.log("DumpHexaddr->" + DumpHexaddr);

    //new NativeFunction(address, returnType, argTypes[, abi])
    //std::string Instruction::DumpString(const DexFile* file) const
    DumpString = new NativeFunction(DumpStringaddr, ["pointer", "pointer", "pointer"], ['pointer', 'pointer']);
    console.log("DumpString:" + DumpString);

    //std::string DumpHex(size_t code_units) const;
    DumpHex = new NativeFunction(DumpHexaddr, ["pointer", "pointer", "pointer"], ['pointer', 'int']);
    console.log("DumpString:" + DumpHex);

    /* Interceptor.attach(LoadMethodaddr, {
         onEnter: function (args) {
             //void ClassLinker::LoadMethod(Thread* self,
             // 3143                               const DexFile& dex_file,
             // 3144                               const ClassDataItemIterator& it,
             // 3145                               Handle<mirror::Class> klass,
             // 3146                               ArtMethod* dst)
             //Android7
             this.dexfileptr = args[2];
             this.artmethodptr = args[5];
         }, onLeave: function (retval) {
             var dex_code_item_offset_ = ptr(this.artmethodptr).add(8).readU32();
             var begin_ = ptr(this.dexfileptr).add(Process.pointerSize * 1).readPointer();
             if (dex_code_item_offset_ > 0) {
                 var funcname = callprettymethod(this.artmethodptr);
                 
                 //过滤函数
                 if (funcname.indexOf("MainActivity") != -1) {
                     console.log("[LoadMethod]funcname:" + funcname);
                     
                     var codeitemrealaddr = ptr(begin_).add(dex_code_item_offset_);
                     var firstinstruction = codeitemrealaddr.add(16);
                     var firstresult = getDetailOfInstruction(this.dexfileptr, firstinstruction);
                     //var secondresult=getDetailOfInstruction(this.dexfileptr, firstinstruction);
                     console.log("dumpstringresult:" + firstresult);

                 }
             }

         }
     })*/

    libartmodule.enumerateSymbols().forEach(function (symbol) {
        if (symbol.name.indexOf("ExecuteMterpImpl") != -1) {
            console.log(JSON.stringify(symbol));
            //41extern "C" bool ExecuteMterpImpl(Thread* self, const DexFile::CodeItem* code_item,
            // 42                                 ShadowFrame* shadow_frame, JValue* result_register)
            Interceptor.attach(symbol.address, {
                onEnter: function (args) {
                    //Android 7.1.2
                    var shadow_frameptr = args[2];
                    //根据shadow_frame获取ArtMethod
                    //console.log(hexdump(shadow_frameptr));
                    var artmethodptr = ptr(shadow_frameptr).add(Process.pointerSize).readPointer();
                    var funcname = callprettymethod(artmethodptr);
                    if (funcname.indexOf("MainActivity") != -1) {
                        //根据ArtMethod获取DexFile
                        var dexfile = funcGetDexFile(artmethodptr, ptr(addrGetObsoleteDexCache));
                        var dex_code_item_offset_ = ptr(artmethodptr).add(8).readU32();
                        var begin_ = ptr(dexfile).add(Process.pointerSize * 1).readPointer();
                        var codeitemrealaddr = ptr(begin_).add(dex_code_item_offset_);
                        var firstinstruction = codeitemrealaddr.add(16);

                        //[*] 打印当前方法的第1条指令
                        /*
                        var firstresult = getDetailOfInstruction(dexfile, firstinstruction);
                        //var dex_method_index_ = ptr(artmethodptr).add(12).readU32();
                        console.log("[" + Process.getCurrentThreadId() + "]ExecuteMterpImpl => " + funcname);
                        console.log(firstresult);
                        let ins_size = parseInt(firstresult.split(",")[0]);
                        console.log("ins_size ", ins_size);
                        */

                        //console.log(hexdump(firstinstruction, {length: 128}))

                        //打印当前方法的所有指令(不包括try-catch)
                        //获取当前方法指令总条数
                        let insns_size = codeitemrealaddr.add(12).readU32(); //uint
                        let total_count = insns_size * 2;
                        console.log("total count ", total_count);
                        var count = 0
                        var next_instruction = firstinstruction;
                        while (count < total_count) {
                            let retval = getDetailOfInstruction(dexfile, next_instruction);
                            console.log(retval, "=====", next_instruction);
                            let ins_size = parseInt(retval.split(",")[0]);
                            next_instruction = next_instruction.add(ins_size); //向后移动
                            count += ins_size;
                        }

                    }
                },

                onLeave: function (retval) {

                }
            })
        }
    });
}


function main() {
    init();
    trace_smali0_mterp_DumpString();
}

setImmediate(main);

/*使用frida主动调用Instruction中的api，打印进入解释器时，正在执行的方法(ArtMethod)相关信息  (36)
* */