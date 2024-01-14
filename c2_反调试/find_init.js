function printStack(tag = "") {
    let threadClz = Java.use("java.lang.Thread");
    let androidLogClz = Java.use("android.util.Log");
    let exceptionClz = Java.use("java.lang.Exception");

    let currentThread = threadClz.currentThread();
    let threadId = currentThread.getId();
    let threadName = currentThread.getName();
    let stackInfo = androidLogClz.getStackTraceString(exceptionClz.$new()).substring(20);

    let logContent = `${tag}\n--->threadId=>${threadId}, threadName=>${threadName}, stackInfo=>\n${stackInfo}`;
    console.log(logContent);

    //console.log(Java.use("android.util.Log").getStackTraceString(Java.use("java.lang.Exception").$new()))
}

function hookClass(clsName) {
    try {
        let targetClass = Java.use(clsName);

        //利用反射，得到类下面的所有方法
        let methodsArray = [];
        let methods = targetClass.class.getDeclaredMethods();
        //遍历所有方法
        for (let method of methods) {
            let methodName = method.getName();
            if (methodsArray.includes(methodName)) {
                console.log("此方法已hook，本次跳过!");
                continue
            }
            console.log(methodName);
            //获得该方法的所有重载
            let overloads = targetClass[methodName].overloads;
            //遍历重载，并hook重载 TODO(有点疑问，已经利用反射已经获取到方法的重载了哎)
            for (let overload of overloads) {
                let prot = '(';
                let tmpArray = [];
                // overload.argumentTypes获取该方法的参数类型
                for (let i = 0; i < overload.argumentTypes.length; i++) {
                    // prot += overload.argumentTypes[i].className + ',';
                    tmpArray.push(overload.argumentTypes[i].className);
                }
                prot += tmpArray.join(", ");
                prot += ')';
                let fullMethodName = clsName + '.' + methodName;

                //hook该重载方法
                //overload为单个重载方法，是一个整体。比如代表：EE.d.overload("java.lang.String");
                //TODO 所以在里面的this为EE类或者EE类的实例
                overload.implementation = function () {
                    // console.log("this:", this);

                    //1.打印完整方法名
                    //拼接类名.方法名(参数1, 参数2, ...)
                    console.log(">===========================")
                    let fullNameWithParams = fullMethodName + prot;
                    console.log(fullNameWithParams);

                    //2.打印方法参数
                    let paramsArray = [];
                    for (let i = 0; i < arguments.length; i++) {
                        // console.log(`argument:${i} -> `,  JSON.stringify(arguments[i]))
                        paramsArray.push(JSON.stringify(arguments[i]));
                    }
                    let fullNameWithArguments = fullMethodName + '(' + paramsArray.join(", ") + ')';
                    console.log(`Arguments: ${fullNameWithArguments}`);

                    //3.打印调用栈
                    //printStack();


                    //4.打印返回值
                    try {
                        let ret = this[methodName].apply(this, arguments);
                        //console.log('========> Return Value: ', fullNameWithParams, JSON.stringify(ret));
                        return ret;
                    } catch (e) {
                        console.log("报错啦");
                        console.log(e.message);
                    }
                    console.log("<===========================\n")
                }
            }

        }
        console.log("===================================\n\n");

    } catch (error) {
        console.log("hookClass报错", error.message);

        // if (error.message.includes("ClassNotFoundException")) {
        //     console.log(" not find target class, trying next loader");
        // } else {
        //     console.log(error.message);
        // }
    }
}


function call() {
    Java.perform(function () {

        /*
        let NBridge = Java.use('com.meituan.android.common.mtguard.NBridge');
        var JString = Java.use('java.lang.String');
        var jinteger = Java.use("java.lang.Integer");
        var param_str = JString.$new("POST /mtapi/v8/channel/rcmdboard __reqTraceID=276c9977-5799-4c65-a673-38daa289a6bd&app=0&category_code=910&ci=1&f=android&msid=6ac246a1664949ebb0a4f2714a58851fa1605466697158066131668311899492&navigate_type=910&net_stat=0&partner=4&platform=4&poilist_mt_cityid=1&poilist_wm_cityid=110100&preload=0&push_token=dpshebefd64035e6c9fb9ebcee40f06c8383atpu&rank_list_id=2b95d20e8bfa44e2bdf46f00abc97770&req_time=668312542236&userid=-1&utm_campaign=AgroupBgroupC0E0Ghomepage_category1_394__a1__c-1024&utm_content=47c9b7a49ea898b1&utm_medium=android&utm_source=xiaomiyuzhuang2&utm_term=1100090405&uuid=00000000000006AC246A1664949EBB0A4F2714A58851FA160546669715806613&version=11.9.405&version_name=11.9.405&waimai_sign=VbaaJwqV9JEALc9Nv%2FH4egKOC1TvEuUDSZU65rRIJZYlv3FNRvx%2B50qAZN63z9psxr5d%2FUGNhj1S%0AlYkIOBCM1QDGdOXqXa8FPDFAGfSjRDlild4pPFGDifbSyQI%2F8k50NM2QAgMK2phcdvA%2B8PCv0n6%0APR5qvRIuaNCALrtie38%3D%0A&wm_actual_latitude=40240957&wm_actual_longitude=116176188&wm_appversion=11.9.405&wm_ctype=mtandroid&wm_did=47c9b7a49ea898b1&wm_dtype=MIX%202S&wm_dversion=29_10&wm_latitude=40240957&wm_longitude=116176188&wm_mac=02%3A00%3A00%3A00%3A00%3A00&wm_seq=55&wm_uuid=00000000000006AC246A1664949EBB0A4F2714A58851FA160546669715806613&wm_visitid=0c7fb83-2377-42fa-833b-e2b2be98e7ce")
        var mode = jinteger.valueOf(2);
        var objectArray = Java.array('java.lang.Object', ['9b69f861-e054-4bc4-9daf-d36ae205ed3e', param_str.getBytes(), mode]);
        var ret = NBridge.main(203, objectArray)
        console.log("call result:" + ret.toString())
        */

        let currentApplication = Java.use("android.app.ActivityThread").currentApplication();
        let context = currentApplication.getApplicationContext();
        let LoadDoor = Java.use("com.jd.sec.utils.LoadDoor");
        let val = LoadDoor["checkSum"](context);
        console.log("val", val);
        let val2 = LoadDoor["getEid"](context);
        console.log("val2", val2);
    })
}

function call_mtgsig() {
    Java.perform(function () {
        let NBridge = Java.use('com.meituan.android.common.mtguard.NBridge');
        var JString = Java.use('java.lang.String');
        var jinteger = Java.use("java.lang.Integer");
        var param_str = JString.$new("POST /mtapi/v8/channel/rcmdboard __reqTraceID=276c9977-5799-4c65-a673-38daa289a6bd&app=0&category_code=910&ci=1&f=android&msid=6ac246a1664949ebb0a4f2714a58851fa1605466697158066131668311899492&navigate_type=910&net_stat=0&partner=4&platform=4&poilist_mt_cityid=1&poilist_wm_cityid=110100&preload=0&push_token=dpshebefd64035e6c9fb9ebcee40f06c8383atpu&rank_list_id=2b95d20e8bfa44e2bdf46f00abc97770&req_time=668312542236&userid=-1&utm_campaign=AgroupBgroupC0E0Ghomepage_category1_394__a1__c-1024&utm_content=47c9b7a49ea898b1&utm_medium=android&utm_source=xiaomiyuzhuang2&utm_term=1100090405&uuid=00000000000006AC246A1664949EBB0A4F2714A58851FA160546669715806613&version=11.9.405&version_name=11.9.405&waimai_sign=VbaaJwqV9JEALc9Nv%2FH4egKOC1TvEuUDSZU65rRIJZYlv3FNRvx%2B50qAZN63z9psxr5d%2FUGNhj1S%0AlYkIOBCM1QDGdOXqXa8FPDFAGfSjRDlild4pPFGDifbSyQI%2F8k50NM2QAgMK2phcdvA%2B8PCv0n6%0APR5qvRIuaNCALrtie38%3D%0A&wm_actual_latitude=40240957&wm_actual_longitude=116176188&wm_appversion=11.9.405&wm_ctype=mtandroid&wm_did=47c9b7a49ea898b1&wm_dtype=MIX%202S&wm_dversion=29_10&wm_latitude=40240957&wm_longitude=116176188&wm_mac=02%3A00%3A00%3A00%3A00%3A00&wm_seq=55&wm_uuid=00000000000006AC246A1664949EBB0A4F2714A58851FA160546669715806613&wm_visitid=0c7fb83-2377-42fa-833b-e2b2be98e7ce")
        var mode = jinteger.valueOf(2);
        var objectArray = Java.array('java.lang.Object', ['9b69f861-e054-4bc4-9daf-d36ae205ed3e', param_str.getBytes(), mode]);
        var ret = NBridge.main(203, objectArray)
        console.log("call result:" + ret.toString())
    })
}


function hook_call_mtso() {
    Java.perform(function () {
        Java.use("com.meituan.android.common.mtguard.NBridge").main.implementation = function (arg1, arg2) {
            console.log("call com/meituan/android/common/mtguard/NBridge, main(I[Ljava/lang/Object;)[Ljava/lang/Object;");
            call_mtgsig();
            return this.main(arg1, arg2);
        }

        Java.use("com.meituan.android.common.mtguard.NBridge$SIUACollector").getHWProperty.implementation = function () {
            console.log("com/meituan/android/common/mtguard/NBridge$SIUACollector, getHWProperty()Ljava/lang/String;");
            call_mtgsig();
            return this.getHWProperty();
        }

        Java.use("com.meituan.android.common.mtguard.NBridge$SIUACollector").getEnvironmentInfo.implementation = function () {
            console.log("com/meituan/android/common/mtguard/NBridge$SIUACollector, getEnvironmentInfo()Ljava/lang/String;");
            call_mtgsig();
            return this.getEnvironmentInfo();
        }

        Java.use("com.meituan.android.common.mtguard.NBridge$SIUACollector").getEnvironmentInfoExtra.implementation = function () {
            console.log("com/meituan/android/common/mtguard/NBridge$SIUACollector, getEnvironmentInfoExtra()Ljava/lang/String;");
            call_mtgsig();
            return this.getEnvironmentInfoExtra();
        }

        Java.use("com.meituan.android.common.mtguard.NBridge$SIUACollector").getHWStatus.implementation = function () {
            console.log("com/meituan/android/common/mtguard/NBridge$SIUACollector, getHWStatus()Ljava/lang/String;");
            call_mtgsig();
            return this.getHWStatus();
        }

        Java.use("com.meituan.android.common.mtguard.NBridge$SIUACollector").getHWEquipmentInfo.implementation = function () {
            console.log("com/meituan/android/common/mtguard/NBridge$SIUACollector, getHWEquipmentInfo()Ljava/lang/String;");
            call_mtgsig();
            return this.getHWEquipmentInfo();
        }

        Java.use("com.meituan.android.common.mtguard.NBridge$SIUACollector").getUserAction.implementation = function () {
            console.log("com/meituan/android/common/mtguard/NBridge$SIUACollector, getUserAction()Ljava/lang/String;");
            call_mtgsig();
            return this.getUserAction();
        }

        Java.use("com.meituan.android.common.mtguard.NBridge$SIUACollector").getPlatformInfo.implementation = function () {
            console.log("com/meituan/android/common/mtguard/NBridge$SIUACollector, getPlatformInfo()Ljava/lang/String;");
            call_mtgsig();
            return this.getPlatformInfo();
        }

        Java.use("com.meituan.android.common.mtguard.NBridge$SIUACollector").getLocationInfo.implementation = function () {
            console.log("com/meituan/android/common/mtguard/NBridge$SIUACollector, getLocationInfo()Ljava/lang/String;");
            call_mtgsig();
            return this.getLocationInfo();
        }

        Java.use("com.meituan.android.common.mtguard.NBridge$SIUACollector").startCollection.implementation = function () {
            console.log("com/meituan/android/common/mtguard/NBridge$SIUACollector, startCollection()Ljava/lang/String;");
            call_mtgsig();
            return this.startCollection();
        }

        Java.use("com.meituan.android.common.mtguard.NBridge$SIUACollector").getExternalEquipmentInfo.implementation = function () {
            console.log("com/meituan/android/common/mtguard/NBridge$SIUACollector, getExternalEquipmentInfo()Ljava/lang/String;");
            call_mtgsig();
            return this.getExternalEquipmentInfo();
        }
    })
}


//1.hook目标方法
function hook_target_func() {
    Java.perform(function () {
        let NBridge = Java.use("com.meituan.android.common.mtguard.NBridge");
        NBridge["main"].implementation = function (i, objArr) {
            console.log('main is called' + ', ' + 'i: ' + i + ', ' + 'objArr: ' + objArr);
            let ret = this.main(i, objArr);
            console.log('main ret value is ' + ret);
            return ret;
        };
    })
}

//2.主动调用目标方法(spwan hook直接调用是不行的，因为此时类都还没加载呢)
function call_target_func() {
    Java.perform(function () {
        /*let NBridge = Java.use('com.meituan.android.common.mtguard.NBridge');
        var JString = Java.use('java.lang.String');
        var jinteger = Java.use("java.lang.Integer");
        var param_str = JString.$new("POST /mtapi/v8/channel/rcmdboard __reqTraceID=276c9977-5799-4c65-a673-38daa289a6bd&app=0&category_code=910&ci=1&f=android&msid=6ac246a1664949ebb0a4f2714a58851fa1605466697158066131668311899492&navigate_type=910&net_stat=0&partner=4&platform=4&poilist_mt_cityid=1&poilist_wm_cityid=110100&preload=0&push_token=dpshebefd64035e6c9fb9ebcee40f06c8383atpu&rank_list_id=2b95d20e8bfa44e2bdf46f00abc97770&req_time=668312542236&userid=-1&utm_campaign=AgroupBgroupC0E0Ghomepage_category1_394__a1__c-1024&utm_content=47c9b7a49ea898b1&utm_medium=android&utm_source=xiaomiyuzhuang2&utm_term=1100090405&uuid=00000000000006AC246A1664949EBB0A4F2714A58851FA160546669715806613&version=11.9.405&version_name=11.9.405&waimai_sign=VbaaJwqV9JEALc9Nv%2FH4egKOC1TvEuUDSZU65rRIJZYlv3FNRvx%2B50qAZN63z9psxr5d%2FUGNhj1S%0AlYkIOBCM1QDGdOXqXa8FPDFAGfSjRDlild4pPFGDifbSyQI%2F8k50NM2QAgMK2phcdvA%2B8PCv0n6%0APR5qvRIuaNCALrtie38%3D%0A&wm_actual_latitude=40240957&wm_actual_longitude=116176188&wm_appversion=11.9.405&wm_ctype=mtandroid&wm_did=47c9b7a49ea898b1&wm_dtype=MIX%202S&wm_dversion=29_10&wm_latitude=40240957&wm_longitude=116176188&wm_mac=02%3A00%3A00%3A00%3A00%3A00&wm_seq=55&wm_uuid=00000000000006AC246A1664949EBB0A4F2714A58851FA160546669715806613&wm_visitid=0c7fb83-2377-42fa-833b-e2b2be98e7ce")
        var mode = jinteger.valueOf(2);
        var objectArray = Java.array('java.lang.Object', ['9b69f861-e054-4bc4-9daf-d36ae205ed3e', param_str.getBytes(), mode]);
        var ret = NBridge.main(203, objectArray)
        console.log("call result:" + ret.toString())*/


        let currentApplication = Java.use("android.app.ActivityThread").currentApplication();
        let context = currentApplication.getApplicationContext();

        let LoadDoor = Java.use("com.jd.sec.utils.LoadDoor");
        let val = LoadDoor["checkSum"](context);
        console.log("val", val);

        let val2 = LoadDoor["getEid"](context);
        console.log("val2", val2);

    })
}


//3.检测是否有初始化函数(spawn)
// 在dlopen加载目标so时, hook上JNI_OnLoad的onLeave处进行验证, 若报错或返回结果不对则表明有初始化函数；否则，则大概率无初始化函数(有例外:如京东)
function check_init_exist() {
    var android_dlopen_ext = Module.findExportByName(null, "android_dlopen_ext");
    if (android_dlopen_ext != null) {
        Interceptor.attach(android_dlopen_ext, {
            onEnter: function (args) {
                this.hook = false;
                var soName = args[0].readCString();
                //console.log("--->", soName);

                //if (soName.indexOf("libmtguard.so") !== -1) {
                if (soName.indexOf("libSecurity.so") !== -1) {
                    this.hook = true;
                }
            },
            onLeave: function (retval) {
                if (this.hook) {
                    console.log("======target so========");
                    var jniOnload = Module.findExportByName("libSecurity.so", "JNI_OnLoad");
                    Interceptor.attach(jniOnload, {
                        onEnter: function (args) {
                            console.log("Enter Mtguard JNI OnLoad");
                        },
                        onLeave: function (retval) {
                            console.log("After Mtguard JNI OnLoad");
                            call_mtgsig();
                        }
                    });
                }
            }
        });
    }

}

//setImmediate(check_init_exist)

//4.定位初始化函数(spawn)
// 在dlopen加载目标so时, hook上JNI_OnLoad的onLeave处hook目标类所有方法，并在被hook的方法中前/后调用目标方法，看从哪里开始不报错
function find_init_func() {
    var android_dlopen_ext = Module.findExportByName(null, "android_dlopen_ext");
    if (android_dlopen_ext != null) {
        Interceptor.attach(android_dlopen_ext, {
            onEnter: function (args) {
                this.hook = false;
                var soName = args[0].readCString();
                if (soName.indexOf("libmtguard.so") !== -1) {
                    this.hook = true;
                }
            },
            onLeave: function (retval) {
                if (this.hook) {
                    var jniOnload = Module.findExportByName("libmtguard.so", "JNI_OnLoad");

                    Interceptor.attach(jniOnload, {
                        onEnter: function (args) {
                            console.log("Enter Mtguard JNI OnLoad");
                        },
                        onLeave: function (retval) {
                            console.log("After Mtguard JNI OnLoad");
                            hook_call_mtso();
                        }
                    });
                }
            }
        });
    }
}

//setImmediate(find_init_func)

//方法一：hook目标类(spwan模式，查看哪个函数先调用，则大概率是初始化函数)
function hook_target_class() {
    Java.perform(function () {
        //hookClass('com.meituan.android.common.mtguard.NBridge');
        hookClass('com.jd.sec.utils.LoadDoor');
    })
}
setImmediate(hook_target_class)

/*
*
* 找到初始化函数的流程：

方法一：spawn hook 整个类，看在目标方法之前调用了哪些函数，观察执行流，然后一个个排查？
方法二：spawn hook So中所有动静态Native函数，观察执行流，然后一个个排查？
*
方法三：
    1.Hook目标函数，得到参数和返回值
    2.attach 主动调用目标函数
    3.检测是否有初始化函数
        spwan主动调用目标方法？ 错，应该是dlopen加载so后，执行JNI_Onload后主动调用，如果报错或者返回结果不对，说明有初始化函数；否则，则大概率无初始化函数(有例外:如京东)
    4.定位初始化函数
        dlopen加载so后，执行JNI_Onload后hook目标类所有方法，对所有目标类Java函数hook，然后在每个函数执行前(后)都先执行目标函数，进行排查。

总结：
    方法一、二的缺点都太明显：
        1.有时也许很早就执行了；有时会在目标函数执行前执行。
        2.无法像方法三一样精细度颗粒到某个方法，只是对比猜测。
        3.而且同一个方法也可以传入不同参数!
    但用来对比验证还是可以的.
* */

// frida -U -f com.sankuai.meituan -l find_init.js --no-pause

// frida -UF -l find_init.js
// frida -U -f com.jingdong.app.mall -l find_init.js --no-pause
// frida -U 京东 -l hook_cookie2.js
// frida -U 京东 -l hook_version.js
