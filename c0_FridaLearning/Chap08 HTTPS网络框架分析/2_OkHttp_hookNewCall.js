function main() {

    Java.perform(function () {
        var OkHttpClient = Java.use("okhttp3.OkHttpClient")
        //hook 发送的请求内容
        //hook newCall方法，打印出参数(request对象)
        OkHttpClient.newCall.implementation = function (request) {
            var result = this.newCall(request)
            console.log(request.toString())
            return result
        };

    });
}

setImmediate(main)