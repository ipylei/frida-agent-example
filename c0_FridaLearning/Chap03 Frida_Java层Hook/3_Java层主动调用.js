/*TODO 这里的动态函数主动调用，是对已经存在的实例调用其实例方法，
    过程是：首先去搜索到实例，然后再调用其方法。
    ----
    实际上还有一种主动调用：找到相关类，利用构造函数创建一个实例，然后调用其方法。 实际上这才是Frida hook或rpc使用的更多的。
*/

function main() {
    console.log("Script loaded successfully");
    Java.perform(function () {
        console.log("Inside java perform function");

        //1.静态函数主动调用
        var MainActivity = Java.use("com.example.ipylei.myapplication/MainActivity");
        MainActivity.staticSecret();
        // var res = MainActivity.staticSecret();
        // console.log("获取到静态方法返回值=>", typeof res, res)

        //2.动态函数主动调用，还是只调用一次
        //TODO 1.动态方法secret需要先通过Java.choose这个API从内存中获取相应类的实例对象，然后才能通过这个实例对象去调用动态的secret()函数。
        //TODO 2.当然，也可以使用$new()或者通过反射新建一个对象，然后像静态函数主动调用那样使用对象调用其方法。
        //.choose()获取示例对象
        Java.choose("com.example.ipylei.myapplication/MainActivity", {
            onMatch: function (instance) {
                console.log("instance found", instance);
                //实例调用被hook的方法
                // instance.secret();

                //获取返回值
                var res = instance.secret();
                console.log("获取到实例方法返回值=>", typeof res, res)
            },

            onComplete: function () {
                console.log("search Complete");
            }
        })
    })
}


setImmediate(main)