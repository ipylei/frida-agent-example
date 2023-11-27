function main() {
    console.log("Script loaded successfully");
    //调用Frida的API函数Java.perform()将脚本的内容注入到Java运行库
    //这个API的参数是一个匿名函数，函数内容是监控和修改Java函数逻辑的主体内容
    //注意，这里的Java.perform()函数非常重要，任何对App中Java层的操作都必须包裹在这个函数中
    Java.perform(function () {
        console.log("Inside java perform function");
        //参数是hook函数所在的类名
        //这个函数的返回值动态地为相应Java类获取一个JavaScript Wrapper，可以通俗地理解为一个JavaScript对象。
        var MainActivity = Java.use('com.example.ipylei.myapplication/MainActivity');
        //定位类成功!
        console.log("Java.Use.Successfully!");

        //在获取到对应的JavaScript对象后，通过“.”符号连接fun这个对应的函数名，
        //然后加上implementation关键词表示实现MainActivity对象的fun()函数
        //TODO 注意:implementation只是一个关键字！并不是属性，所以也不会影响里面this对象的指向。
        //TODO 不仅能hook实例方法，还能hook静态方法!
        //1.hook实例方法
        MainActivity.fun.overload('int', 'int').implementation = function (x, y) {
            // 与下面等价。只是不是重载函数时可以省略罢了。
            // MainActivity.fun.overload('int', 'int').implementation = function (x, y){
            console.log("x => ", x, " y=> ", y);

            /*TODO 注意this指向，既可以指向类，也可以指向对象! */
            // 通过this.fun()函数再次调用原函数，并把参数传递给这个fun()函数，简而言之，就是重新执行原函数的内容。
            var ret_value = this.fun(10, 30);

            console.log(this == MainActivity);  //TODO false
            return ret_value;

            // 在Hook一个函数时，还有一个地方需要注意，那就是最好不要修改被Hook的函数的返回值类型，
            // 否则可能会引起程序崩溃等问题，比如直接通过调用原函数将原函数的返回值返回。
        }

        //2.hook 静态方法
        MainActivity.func.implementation = function (data) {
            // 与下面等价。只是不是重载函数时可以省略罢了。
            // MainActivity.fun.overload('int', 'int').implementation = function (x, y){
            console.log("data:=>", data);
            //this指向Java.use()返回的MainActivity对象!
            // 通过this.fun()函数再次调用原函数，并把参数传递给这个fun()函数，简而言之，就是重新执行原函数的内容。
            var ret_value = this.func(new Date().toTimeString() + "===>Hooked! " + data);

            console.log(this == MainActivity); //TODO true
            return ret_value;

            // 在Hook一个函数时，还有一个地方需要注意，那就是最好不要修改被Hook的函数的返回值类型，
            // 否则可能会引起程序崩溃等问题，比如直接通过调用原函数将原函数的返回值返回。
        }


        // 3.hook 反射调用
        /*

        public class Person {
            public String name = "ipylei->Person";
            public String sayHi(){
                // return "Hi, how are you!";
                return this.name;
            }
        }

        public class Student extends Person {
            public String name = "ipylei->Student";
        }

         Student s = new Student();
         Method m = s.getClass().getMethod("sayHi");
         m.setAccessible(true);
         String result = (String) m.invoke(s);
        */
        let Student = Java.use('com.example.ipylei.myapplication.Student');
        Student.sayHi.implementation = function () {
            return "反射调用依然被hook!!!";
        }
    })

}

// 表示当Frida注入App后立即执行main()函数
// 这个函数和setTimeout()函数类似，都是用于指定要执行的函数，不同的是setTimeout可以用于指定Frida注入App多长时间后执行函数，往往用于延时注入。
// 如果传递的第二个参数为0或者压根没有第二个参数，就和setImmediate()函数的作用一样，比如在代码清单3-1中，setTimeout()函数就相当于setImmediate()函数。
setImmediate(main)