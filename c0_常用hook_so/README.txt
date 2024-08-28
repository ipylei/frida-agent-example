加载so文件流程：
    ->dlopen(里面调用CallConstructors，CallConstructors再调用init、init_array)
    ->dlsym(JNI_OnLoad)

#----------------------------------------------------------------------------------------------------

hook_init_array.js          (spwan模式注入)
hook_JNI_OnLoad.js          (spwan模式注入)

hook_RegisterNatives.js          (spwan模式注入)
hook_RegisterNatives_ArtMethod.js (spwan模式注入)

so_查找静态注册的函数.js        (attach模式注入)
    在so文件中查找函数，使用Java层的方法名去各个so文件中查找。
        若找不到则大概率是动态注册的，此时使用动态注册去查找。
        因为动态注册时，Java层中的函数名不一定与so文件中的函数名一致(so文件中可以随意取名、以及文件名粉碎)

find_init.js 寻找初始化函数
