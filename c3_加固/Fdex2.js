//typed by hanbingle
function check() {
    Java.perform(function () {
        //java.lang.Class.getDex
        //com.android.dex.Dex.getBytes
        //Java.classFactory.loader->PathClassloader实例的封装
        /*        var Class = Java.use("java.lang.Class");
                console.log(Class);
                var getDex = Class.getDex.overloads;
                if (getDex != null) {
                    console.log(getDex);
                }
                var Dex = Java.use("com.android.dex.Dex");
                var getBytes = Dex.getBytes.overloads;
                if (getBytes != null) {
                    console.log(getBytes);
                }*/
        Java.enumerateClassLoadersSync().forEach(function (loader) {
            try {
                var Class = loader.loadClass("java.lang.Class");
                var methods = Class.getDeclaredMethods();
                methods.forEach(function (method) {
                    //console.log(method.getName());
                    var methodname = method.getName();
                    if (methodname == "getDex") {
                        console.log("find getDex->" + method);
                    }
                    //if(method.getName())
                })
            } catch (e) {

            }
            try {
                var Dex = loader.loadClass("com.android.dex.Dex");
                var methods = Dex.getDeclaredMethods();
                methods.forEach(function (method) {
                    var methodname = method.getName();
                    if (methodname == "getBytes") {
                        console.log("find getBytes->" + method);
                    }
                })
            } catch (e) {

            }
        })

    })
}

function savedex(dexbytes, dexpath) {
    Java.perform(function () {
        var File = Java.use("java.io.File");
        var FileOutPutStream = Java.use("java.io.FileOutputStream");
        var fileobj = File.$new(dexpath);
        var fileoutputstreamobj = FileOutPutStream.$new(fileobj);
        fileoutputstreamobj.write(dexbytes);
        fileoutputstreamobj.close();
        console.warn("[dumpdex]" + dexpath);
    })
}

function fdex2(classname) {
    Java.perform(function () {
        Java.enumerateClassLoadersSync().forEach(function (loader) {
            try {
                var ThisClass = loader.loadClass(classname);
                var dexobj = ThisClass.getDex();
                var dexbytearray = dexobj.getBytes();
                var savedexpath = "/sdcard/" + classname + ".dex";
                savedex(dexbytearray, savedexpath);
            } catch (e) {

            }
        })
    })
}

function main() {
    Java.perform(function () {
        var StubAPP = Java.use("com.stub.StubApp");
        StubAPP.attachBaseContext.implementation = function (arg0) {
            console.log("StubAPP.attachBaseContext called!");
            var result = this.attachBaseContext(arg0);
            console.log("StubAPP.attachBaseContext called over!");
            fdex2("com.touchtv.module_live.view.activity.SearchHotTVColumnActivity");
            return result;
        }
        /*        StubAPP.onCreate.implementation = function () {
                    var result = this.onCreate();
                    console.log("StubAPP.onCreate called over!");
                    fdex2("com.touchtv.module_news.view.activity.VideoBigActivity");
                    return result;
                }*/
    })
}

//setImmediate(main);