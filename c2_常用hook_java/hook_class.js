/*
* Hook一个类的所有方法
* */


const color = {};
color.black = "\x1b[30m";
color.red = "\x1b[31m";
color.green = "\x1b[32m";
color.yellow = "\x1b[33m";
color.blue = "\x1b[34m";
color.magenta = "\x1b[35m";
color.cyan = "\x1b[36m";
color.white = "\x1b[37m";

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


function findClass() {
    Java.perform(function () {
        Java.enumerateLoadedClasses({
            onMatch: function (name, handle) {
                if (name.indexOf("com.jd.security.jdguard.core") != -1) {
                    console.log(name);
                    //console.log(name, handle);
                    //// 利用反射 获取类中的所有方法
                    //var TargetClass = Java.use(name);
                    //// return Method Object List
                    //var methodsList = TargetClass.class.getDeclaredMethods();
                    //for (var i = 0; i < methodsList.length; i++) {
                    //    // Method Objection getName()
                    //    console.log(methodsList[i].getName());
                    //}
                }
            },

            onComplete: function () {
                console.log("complete!!!")
            }
        })
    })
}

function dumpClass(clsName) {
    let targetClass = Java.use(clsName);

    //利用反射，得到类下面的所有方法
    let methodsArray = [];
    let methods = targetClass.class.getDeclaredMethods();
    //遍历所有方法
    for (let method of methods) {
        let methodName = method.getName();
        if (methodsArray.includes(methodName)) {
            console.log("此方法已dump，本次跳过!");
            continue
        }
        console.log(methodName);
    }
}


//hook一个class下的所有方法，注意：并没有hook构造方法
function hookClass(clsName) {
    //1:打印方法调用； 2:打印函数参数、返回值；3:打印调用栈

    let mode = 1;
    try {
        let targetClass = Java.use(clsName);

        //利用反射，得到类下面的所有方法
        let methodsArray = [];
        let methods = targetClass.class.getDeclaredMethods();
        //构造函数有问题，因为获取到的是 类名(参数1, ...)，然而hook应该是.$init
        //let constructors = targetClass.class.getDeclaredConstructors();
        //methods.concat(constructors);

        let targetMethods = ["$init"];

        //遍历所有方法，去重(因为这里会列出重载的方法，而下面.overloads又会再一次列出重载方法)
        for (let method of methods) {
            let methodName = method.getName();
            if (targetMethods.includes(methodName)) {
                console.log("此方法已在hook列表中!");
                continue
            }
            targetMethods.push(methodName);
        }

        //对去重后的方法进行hook
        for (let methodName of targetMethods) {
            //获得该方法的所有重载
            let overloads = targetClass[methodName].overloads;
            //遍历重载，并hook重载
            for (let overload of overloads) {
                let paramName = '(';
                let tmpArray = [];
                // overload.argumentTypes获取该方法的参数类型
                for (let i = 0; i < overload.argumentTypes.length; i++) {
                    // prot += overload.argumentTypes[i].className + ',';
                    tmpArray.push(overload.argumentTypes[i].className);
                }
                paramName += tmpArray.join(", ");
                paramName += ')';
                let fullMethodName = clsName + '.' + methodName;
                let returnTypeName = overload.returnType.className;
                let fullNameWithParams = `${color.red}${returnTypeName} ${color.blue}${fullMethodName}${paramName}`;
                console.log(fullNameWithParams);

                //hook该重载方法
                //overload为单个重载方法，是一个整体。比如代表：EE.d.overload("java.lang.String");
                //TODO 所以在里面的this为EE类或者EE类的实例
                overload.implementation = function () {
                    // console.log("this:", this);

                    //1.打印完整方法名(即方法参数，形参)
                    //拼接类名.方法名(参数1, 参数2, ...)
                    //let fullNameWithParams = fullMethodName + paramName;
                    console.log("Called", fullNameWithParams);

                    //2.打印方法参数(实参)
                    let paramsArray = [];
                    for (let i = 0; i < arguments.length; i++) {
                        // console.log(`argument:${i} -> `,  JSON.stringify(arguments[i]))
                        paramsArray.push(JSON.stringify(arguments[i]));
                    }
                    if (mode >= 2) {
                        let fullNameWithArguments = fullMethodName + '(' + paramsArray.join(", ") + ')';
                        console.log(`Arguments: ${fullNameWithArguments}`);
                    }

                    //3.打印调用栈
                    if (mode >= 3) {
                        printStack();
                    }

                    //4.打印返回值
                    try {
                        let ret = this[methodName].apply(this, arguments);
                        if (mode >= 2) {
                            console.log('========> Return Value: ', fullNameWithParams, JSON.stringify(ret));
                        }
                        return ret;
                    } catch (e) {
                        console.log("报错啦");
                        console.log(e.message);
                    }
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

//切换loader hook class
function hookClassWithLoader(clsName) {
    let count = 0
    Java.enumerateClassLoaders({
        onMatch: function (loader) {
            //方法0:(x-不是很好用)不用切换loader，直接加载类：loader.loadClass("com.google.gson.Gson");

            count++;
            console.log("\n\n");
            console.log(`current loader_${count}: ${loader}`)

            //方法一：直接切换classLoader, 然后hook
            //Java.classFactory.loader = loader;
            //hookClass(targetClsName);

            //方法二：先findClass, 若不报错才再切换loader, 然后hook
            try {
                if (loader.findClass(clsName)) {
                    console.log(`classloader findClass success, current loader: ${loader}`);

                    //切换classLoader
                    Java.classFactory.loader = loader;
                    //然后hook
                    hookClass(clsName);
                }
            } catch (e) {
                console.log("classloader findClass error", e.message);
            }

        },

        onComplete: function () {
        }
    })
}

//hook某class下的指定方法(包含其重载)
function hookClassMethod(clsName, methodName) {
    try {
        let targetClass = Java.use(clsName);

        //遍历所有方法
        console.log(methodName);

        //获得该方法的所有重载
        let overloads = targetClass[methodName].overloads;
        //遍历重载，并hook重载
        for (let overload of overloads) {
            let paramName = '(';
            let tmpArray = [];
            // overload.argumentTypes获取该方法的参数类型
            for (let i = 0; i < overload.argumentTypes.length; i++) {
                // prot += overload.argumentTypes[i].className + ',';
                tmpArray.push(overload.argumentTypes[i].className);
            }
            paramName += tmpArray.join(", ");
            paramName += ')';
            let fullMethodName = clsName + '.' + methodName;
            let fullNameWithParams = `${color.red}${returnTypeName} ${color.blue}${fullMethodName}${paramName}`;
            console.log(fullNameWithParams);

            //hook该重载方法
            //TODO overload为单个重载方法，是一个整体。比如代表：EE.d.overload("java.lang.String"); 所以在里面的this为EE类或者EE类的实例
            overload.implementation = function () {
                // console.log("this:", this);

                //1.打印完整方法名
                //拼接类名.方法名(参数1, 参数2, ...)
                console.log("Called", fullNameWithParams);

                //2.打印方法参数
                let paramsArray = [];
                for (let i = 0; i < arguments.length; i++) {
                    // console.log(`argument:${i} -> `,  JSON.stringify(arguments[i]))
                    paramsArray.push(JSON.stringify(arguments[i]));
                }
                let fullNameWithArguments = fullMethodName + '(' + paramsArray.join(", ") + ')';
                console.log(`Arguments: ${fullNameWithArguments}`);

                //3.打印调用栈
                printStack();


                //4.打印返回值
                try {
                    let ret = this[methodName].apply(this, arguments);
                    console.log('========> Return Value: ', fullNameWithParams, JSON.stringify(ret));
                    return ret;
                } catch (e) {
                    console.log("报错啦");
                    console.log(e.message);
                }
            }
        }

        console.log("===================================\n\n");

    } catch (error) {
        console.log("hookClassMethod报错", error.message);

        // if (error.message.includes("ClassNotFoundException")) {
        //     console.log(" not find target class, trying next loader");
        // } else {
        //     console.log(error.message);
        // }
    }
}


function main() {
    Java.perform(function () {
        // let className = 'com.xbiao.utils.net.NetContent';
        //let className = 'com.xbiao.utils.AESedeUtil';
        let className = 'com.hexl.lessontest.logic.People';
        let methodName = "";


        //hookClass(className);   //当前loader下：hook class下的所有方法
        //hookClassMethod(className, methodName); //当前loader下: hook class下的指定方法
    })
}


setImmediate(main)
