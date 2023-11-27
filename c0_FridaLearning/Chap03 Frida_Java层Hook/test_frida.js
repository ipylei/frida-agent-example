function hook() {
    Java.perform(function () {
        let ParentClass = Java.use("com.example.c6l02requestdemo.ParentClass");
        let SubClass = Java.use("com.example.c6l02requestdemo.SubClass");

        //1.子类继承父类的方法时，无论是hook父类还是子类的该方法都有效，同时hook时只有子类有效!
        //ParentClass["sayHi"].implementation = function (arg) {
        //    console.log("ParentClass", arg);
        //    return this.sayHi(arg);
        //}

        /*
        SubClass["sayHi"].implementation = function (arg) {
            console.log("SubClass", arg);
            return this.sayHi(arg);
        }*/

        //2.hook一个类的所有方法
        /*
        let methodsArray = [];
        let methods = ParentClass.class.getDeclaredMethods();
        for (let method of methods) {
            let methodName = method.getName();
            if (methodsArray.includes(methodName)) {
                console.log("此方法已hook，本次跳过!");
                continue
            }
            methodsArray.push(methodName);
            let args = method.getParameterTypes();
            console.log("<---", methodName, args);

            let overloads = ParentClass[methodName].overloads;
            for (let overload of overloads) {
                //console.log("===", overload.argumentTypes.length);
                overload.implementation = function () {
                    console.log(arguments.length);
                    return this[methodName].apply(this, arguments);
                }
            }
        }
         */
        console.log(SubClass);

        let a1 = SubClass.class;
        console.log("a1", a1);
        console.log(ParentClass === a1);

        let a2 = Java.classFactory.loader.loadClass("com.example.c6l02requestdemo.SubClass");
        console.log("a2", a2);


        Java.choose("com.example.c6l02requestdemo.SubClass", {
            onMatch: function (instance) {
                console.log("找到了实例");
                let a3 = instance.getClass();
                console.log("a3", a3);

                var jclazz = Java.use("java.lang.Class");
                let a4 = jclazz.getClass.call(instance);  //等价于实例.getClass();
                console.log("a4", a4);

                console.log("a1==a2", a1 === a2);  //false
                console.log("a1==a3", a1 === a3);  //false
                console.log("a1==a4", a1 === a4);  //false

                console.log("a2==a3", a2 === a3);  //false
                console.log("a2==a4", a2 === a4);  //false

                console.log("a3==a4", a3 === a4);  //false

                //TODO 所以frida还是有点不可信，这几个本来全为true的

            },

            onComplete: function () {
            }
        })


    })
}

//setImmediate(hook)

