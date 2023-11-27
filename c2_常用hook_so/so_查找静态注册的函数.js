/*


    //采用attach模式
    //1.枚举所有的so文件
    //2.枚举so文件的所有导出函数 (enumerateExports)
    //3.针对导出函数进行判断

    在so文件中查找函数，使用Java层的方法名去各个so文件中查找。
        若找不到则大概率是动态注册的，此时使用动态注册去查找。
        因为动态注册时，Java层中的函数名不一定与so文件中的函数名一致(so文件中可以随意取名、以及文件名粉碎)
*/

//注：attach模式注入
function find_normal_function() {
    Java.perform(function () {
        //let target_method_name = "stringFromJNI"; //要模糊查找的函数名
        //let target_method_name = "JNI"; //要模糊查找的函数名
        //let target_module_list = ["libnative-lib.so"]; //在哪些模块中查找

        //let target_method_name = "stringFromJNI"; //要模糊查找的函数名
        //let target_method_name = "JNI_OnLoad"; //要模糊查找的函数名
        //let target_method_name = "Create"; //要模糊查找的函数名
        //let target_module_list = ["lessontest"]; //在哪些模块中查找

        //let target_method_name = "UUIDCheckSum";
        //let target_module_list = ["native-lib"]; //在哪些模块中查找


        let target_method_name = "heracles";
        let target_module_list = ["libdusanwa.so"]; //在哪些模块中查找
        let need_filter = true; //是否需要在指定模块中查找

        //1.枚举所有的so文件
        let modules = Process.enumerateModules();
        console.log("持有模块数量", modules.length);

        //遍历模块
        for (let module of modules) {
            let module_name = module.name;
            let module_addr = module.base;

            //TODO 过滤掉不是想要查看的so模块
            if (need_filter) {
                let is_target_module = false;
                for (let target_module_name of target_module_list) {
                    if (module_name.indexOf(target_module_name) > -1) {
                        is_target_module = true;
                        break
                    }
                }
                if (!is_target_module) {
                    continue
                }
            }


            console.log("当前查找模块", module.name)
            //2.枚举每个so文件的所有导出方法
            let exports = module.enumerateExports();
            console.log("导出函数的数量", exports.length);

            //3.遍历所有导出方法
            for (let exp of exports) {
                //console.log(`==> 模块名: ${module.name}, 函数名: ${exp.name}`);

                //还可以增加过滤条件，如果没找到，则大概率是动态注册的，所以再去动态注册找
                if (exp.name.indexOf(target_method_name) > -1) {
                    let exp_addr = exp.address;
                    let offset = exp_addr - module_addr;
                    console.log(`==> 模块名: ${module_name}, 模块地址: ${module_addr}, 函数名: ${exp.name}, 函数偏移: ${offset.toString(16)}`);
                }
            }
            //var addr = Module.findExportByName("liblessontest.so", "Java_com_hexl_lessontest_MainActivity_stringFromJNI");
            //console.log("---", addr);

        }
    })
}


function main() {
    find_normal_function();
}


setImmediate(find_normal_function);