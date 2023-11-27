function hookFile() {
    Java.perform(function () {
        //SSLpinning helper 帮助定位证书绑定的关键代码
        Java.use("java.io.File").$init.overload('java.io.File', 'java.lang.String').implementation = function (file, cert) {
            var result = this.$init(file, cert)
            var stack = Java.use("android.util.Log").getStackTraceString(Java.use("java.lang.Throwable").$new());
            // TODO 注意：这里file.getPath()进行"cacert"检查，而不是检查app内部路径，就注定了无法处理证书绑定固定的情况!
            if (file.getPath().indexOf("cacert") >= 0 && stack.indexOf("X509TrustManagerExtensions.checkServerTrusted") >= 0) {
                console.log("SSLpinning position locator => " + file.getPath() + " " + cert);
                console.log(stack);
            }
            return result;
        }

        /*
        Java.use("java.io.File").$init.overload('java.io.File', 'java.lang.String').implementation = function (file, cert) {
            var result = this.$init(file, cert);
            if (((file.getPath().indexOf("/data/user") > -1) || (file.getPath().indexOf("/data/data") > -1))) {
                var stack = Java.use("android.util.Log").getStackTraceString(Java.use("java.lang.Throwable").$new());
                if (cert.indexOf("cacert") >= 0 || file.getPath().indexOf("cacert") >= 0 || stack.indexOf("X509TrustManagerExtensions.checkServerTrusted") >= 0) {
                    console.log("find ", "SSLpinning position locator => " + file.getPath() + " " + cert);
                    console.log(stack);
                } else if ((cert.indexOf(".") > -1) && (cert.indexOf(".xml") === -1) && (cert.indexOf(".db") === -1)) {
                    if (cert.split(".").length < 3) {
                        console.log("find file1 = ", file.getPath() + "/" + cert);
                    }
                }
            }
            return result;
        }

        Java.use("java.io.File").$init.overload('java.lang.String').implementation = function (cert) {
            var result = this.$init(cert);
            //console.log("2--File path: ", cert);
            if (((cert.indexOf("/data/user") > -1) || (cert.indexOf("/data/data") > -1))) {
                var stack = Java.use("android.util.Log").getStackTraceString(Java.use("java.lang.Throwable").$new());
                if (cert.indexOf("cacert") >= 0 || stack.indexOf("X509TrustManagerExtensions.checkServerTrusted") >= 0) {
                    console.log("find ", "SSLpinning position locator => " + cert);
                    console.log(stack);
                } else if ((cert.indexOf(".") > -1) && (cert.indexOf(".xml") === -1) && (cert.indexOf(".db") === -1)) {
                    if (cert.split(".").length < 3) {
                        console.log("find file2 = ", file.getPath() + "/" + cert);
                    }
                }
            }
            return result;
        }
        */
    })
}