/*
* 为了进一步将这个Hook方案推广到其他所有使用okhttp框架的App上，
* 我们需要将这部分代码翻译成JavaScript代码，
* 或者直接将这部分代码编译为DEX再通过Frida将DEX注入其他应用中。
*
* 这里我们使用第二种方式。不用怀疑，Frida已经提供了这样的功能，
* 可以通过如下API将DEX加载到内存中，从而使用DEX中的方法和类。（需要注意的是，无法加载JAR包。）
*
* Java.openClassFile(dexPath).load();
* */


/*
* 其实就是利用okhttpClient的第二种创建模式，将自定义的LoggingInterceptor添加到原有的Interceptor链条中。
* */
function hook_okhttp3() {
    // 1. frida Hook java层的代码必须包裹在Java.perform中，Java.perform会将Hook Java相关API准备就绪。
    Java.perform(function () {

        Java.openClassFile("/data/local/tmp/okhttp3logging.dex").load();

        // var MyInterceptor = Java.use("com.r0ysue.okhttp3demo.LoggingInterceptor");
        var MyInterceptor = Java.use("com.example.ipylei.okhttp3demo.LoggingInterceptor");
        var MyInterceptorObj = MyInterceptor.$new();

        //TODO 因为Builder是OkHttpClient的一个内部类，所以Builder类生成的.class文件中会包含$
        var Builder = Java.use("okhttp3.OkHttpClient$Builder");
        console.log(Builder);
        //TODO hook build方法？ 该hook无论是实例方法、还是静态方法调用都会被hook到。
        //TODO 甚至还可以打印出调用栈！
        /*所以，针对于每一个使用.build()创建的okhttpClient都会被hook到!*/
        Builder.build.implementation = function () {
            this.networkInterceptors().add(MyInterceptorObj);
            return this.build();
        };
        console.log("hook_okhttp3...");
    });
}
function main() {
    hook_okhttp3();
}


setImmediate(main)

