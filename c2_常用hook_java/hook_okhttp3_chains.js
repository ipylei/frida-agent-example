function hook_chains() {
    Java.perform(function () {
        var a8 = Java.use('cn.shihuo.modulelib.utils.f1.a$a');
        a8.intercept.implementation = function (chain) {
            //利用反射拿到类
            //var jclazz = chain.getClass(); //获取Class实例，这里会报错
            var jclazz = Java.use("java.lang.Class");
            var c = jclazz.getClass.call(chain); //获取Class实例
            var f = c.getDeclaredField("interceptors"); //获取所有拦截器
            f.setAccessible(true);
            var value = f.get(chain);
            console.log("==============>", value, "\n");

            var request = chain.request();
            var urlString = request.url().toString();
            console.log("加密前的url", urlString, "\n");

            //var f7772c = this._c.value;
            //console.log("---", f7772c.$className);


            var response = chain.proceed(request); //不加密
            //var response = this["intercept"](chain); //加密
            return response;
        };
    })
}