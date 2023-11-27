function main() {
    Java.perform(function () {
        var URL = Java.use('java.net.URL')

        //hook URL构造方法 (java.net.URL.$init)
        //hook url
        URL.$init.overload('java.lang.String').implementation = function (urlstr) {
            console.log('url => ', urlstr)
            var result = this.$init(urlstr)
            return result
        }

        //hook URL的openConnection方法(实例调用)
        //hook 客户端构建
        URL.openConnection.overload().implementation = function () {
            var result = this.openConnection()
            //TODO 打印出openConnection()函数的返回值的类名
            //有些实例是通过接口或抽象类引用的，只能通过真正的class才能找到对应的实例
            console.log('openConnection() returnType =>', result.$className)
            return result
        }

        //hook setRequestProperty
        // 设置请求头
        var HttpURLConnectionImpl = Java.use('com.android.okhttp.internal.huc.HttpURLConnectionImpl')
        HttpURLConnectionImpl.setRequestProperty.implementation = function (key, value) {
            var result = this.setRequestProperty(key, value)
            console.log('setRequestProperty => ', key, ':', value)
            return result
        }
    })
}

setImmediate(main)