加载so文件流程：
    ->dlopen(里面调用CallConstructors，CallConstructors再调用init、init_array)
    ->dlsym(JNI_OnLoad)

#----------------------------------------------------------------------------------------------------
# 文件打开监控、静态注册监控
hook_dlopen_dlsym_self.js   (spwan模式注入)
hook_dlopen_dlsym_yuanrenxue.js (spwan模式注入)
    用途：
        hook dlopen：用于查看加载了哪些so文件，且可以在加载后立马进行hook。【onLeave里面hook】(但不能hook init、init_array)
        hook dlsym：在加载so文件后，调用JNI_OnLoad时可以注入hook。 【onEnter、onLeave都可以】

hook_init_array.js          (spwan模式注入)
hook_init_array_copy.js     (spwan模式注入)
hook_JNI_OnLoad.js          (spwan模式注入)

hook_RegisterNatives.js     (spwan模式注入)
so_查找动态注册的函数.js        (spwan模式注入)
so_查找静态注册的函数.js        (attach模式注入)
    在so文件中查找函数，使用Java层的方法名去各个so文件中查找。
        若找不到则大概率是动态注册的，此时使用动态注册去查找。
        因为动态注册时，Java层中的函数名不一定与so文件中的函数名一致(so文件中可以随意取名、以及文件名粉碎)


find_init.js 寻找初始化函数


# TODO native层分析流程：
查找目标函数(在哪个so文件中)：
    若目标函数是静态注册：
        1、使用ida反编译查找(缺点：需要一个个反编译so文件，手动查看)
        2、so_查找静态注册的函数.js(缺点：时机较晚)
        3、hook_dlopen_dlsym_self.js -> dlsym(若没找到目标函数，则尝试手动触发，让目标函数执行一次。)
                    原理：Java层运行到某个native方法时，若没有对应的(动态绑定的)native方法，则尝试建立并使用(静态绑定的)native方法？
    若目标函数是动态注册：
        so_查找动态注册的函数.js or hook_RegisterNatives.js

    hook目标函数：
        attach hook(随便写就行Interceptor.attach)
        spwan hook(在app刚加载时就hook -> hook_dlopen_dlsym_self.js)
            hook JNI_OnLoad(hook_JNI_OnLoad.js)
                hook_init、hook_init_array(hook_init_array.js)
