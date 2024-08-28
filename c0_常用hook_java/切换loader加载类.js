function hookFridaActivity5() {

    let current_loader = Java.ClassFactory.loader;
    console.log("切换classloader => ", current_loader);

    let loaders = Java.enumerateClassLoadersSync();
    for (let loader of loaders) {
        try {
            if (!loader.findClass("com.example.androiddemo.Dynamic.DynamicCheck")) {
                continue;
            }
            console.log("找到目标类");


            /*console.log("切换classloader => ", loader);
            Java.classFactory.loader = loader;
            let DynamicCheck = Java.use("com.example.androiddemo.Dynamic.DynamicCheck");
            console.log(DynamicCheck);
            DynamicCheck.check.implementation = function () {
                return true;
            }
             //切换回去
             Java.classFactory.loader = current_loader;
            */


            let Java2 = Java.ClassFactory.get(loader);
            let DynamicCheck = Java2.use("com.example.androiddemo.Dynamic.DynamicCheck");
            DynamicCheck.check.implementation = function () {
                return true;
            }

        } catch (e) {
            console.log("hookFridaActivity5 error=>", e);
        }
    }
}
