//typed by hanbingle
var savepath = "/sdcard/"

function savedexfile(dexfileptr) {
    try {
        var dexfilebegin = ptr(dexfileptr).add(Process.pointerSize * 1).readPointer();
        var dexfilesize = ptr(dexfileptr).add(Process.pointerSize * 2).readU32();
        var dex = new File(savepath + "_" + dexfilesize + ".dex", "a");
        if (dex != null) {
            var content = ptr(dexfilebegin).readByteArray(dexfilesize);
            dex.write(content);
            dex.flush();
            dex.close();
            console.warn("[dumpdex]" + savepath + "_" + dexfilesize + ".dex");
        }

    } catch (e) {
    }
}

function dumpDexBymCookie() {
    Java.perform(function () {
        var DexFileClass = Java.use("dalvik.system.DexFile");
        Java.choose("dalvik.system.DexFile", {
            onMatch: function (dexfile) {
                var mCookie = dexfile.mCookie.value;
                /*var classlist = DexFileClass.getClassNameList(mCookie);
                classlist.forEach(function (classname) {
                    console.log(dexfile.mFileName.value + "->" + classname);
                })*/
                console.log(mCookie.$className);
                var Array = Java.use("java.lang.reflect.Array");
                var size = Array.getLength(mCookie);
                var i = 0;
                for (i = 0; i < size; i++) {
                    console.log(i + "->" + Array.getLong(mCookie, i));
                    var longvalue = Array.getLong(mCookie, i);
                    var dexfileptr = ptr(longvalue + "");
                    savedexfile(dexfileptr);
                }

            }, onComplete: function () {
                console.warn("search DexFile over!");
            }
        })
    })
}
