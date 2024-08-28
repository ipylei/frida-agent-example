function dump() {
    //let file = new File("/data/data/com.example.ndktools/1.so", "wr");
    let file = new File("/data/data/com.example.ndktools/1.so", "a+");
    //file.write(ptr(0xd12d5000).readByteArray(0x18000));
    file.write(ptr(0xd12ee000).readByteArray(0x3000));
    file.flush();
    file.close();

}


function dump_so(so_name, dir) {
    let module = Process.getModuleByName(so_name);
    console.log("[name]:", module.name);
    console.log("[base]:", module.base);
    console.log("[size]:", module.size);
    console.log("[path]:", module.path);

    let size = module.size;
    let file_path = dir + "/" + module.name + "_" + module.base + "_" + size + ".so";
    let file = new File(file_path, "wb");
    if (file) {
        Memory.protect(ptr(module.base), size, "rwx");
        file.write(ptr(module.base).readByteArray(size));
        file.flush();
        file.close();
        console.log("[dump:]", file_path);
    }
}

//dump_so("frida-agent-64.so", "/sdcard")


//function dump_so2(so_name, dir, end) {
//    let module = Process.getModuleByName(so_name);
//    console.log("[name]:", module.name);
//    console.log("[base]:", module.base);
//    console.log("[size]:", module.size);
//    console.log("[path]:", module.path);
//
//    let size = module.size;
//    let file_path = dir + "/" + module.name + "_" + module.base + "_" + size + ".so";
//    let file = new File(file_path, "wb");
//    if(file){
//        Memory.protect(ptr(module.base), size, "rwx");
//        file.write(ptr(module.base).readByteArray(size));
//        file.flush();
//        file.close();
//        console.log("[dump:]", file_path);
//    }
//}
//dump_so("frida-agent-64.so", "/sdcard", 0x770c3a000)


function dump_so3(so_name) {
    Java.perform(function () {
        var currentApplication = Java.use("android.app.ActivityThread").currentApplication();
        var dir = currentApplication.getApplicationContext().getFilesDir().getPath();
        var libso = Process.getModuleByName(so_name);
        console.log("[name]:", libso.name);
        console.log("[base]:", libso.base);
        console.log("[size]:", ptr(libso.size));
        console.log("[path]:", libso.path);
        var file_path = dir + "/" + libso.name + "_" + libso.base + "_" + ptr(libso.size) + ".so";
        var file_handle = new File(file_path, "wb");
        if (file_handle && file_handle != null) {
            Memory.protect(ptr(libso.base), libso.size, 'rwx');
            var libso_buffer = ptr(libso.base).readByteArray(libso.size);
            file_handle.write(libso_buffer);
            file_handle.flush();
            file_handle.close();
            console.log("[dump]:", file_path);
        }
    });
}