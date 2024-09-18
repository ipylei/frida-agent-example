function uuid(len, radix) {
    var chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'.split('');
    var uuid = [], i;
    radix = radix || chars.length;

    if (len) {
        // Compact form
        for (i = 0; i < len; i++) uuid[i] = chars[0 | Math.random() * radix];
    } else {
        // rfc4122, version 4 form
        var r;
        // rfc4122 requires these characters
        uuid[8] = uuid[13] = uuid[18] = uuid[23] = '-';
        uuid[14] = '4';

        // Fill in random data. At i==19 set the high bits of clock sequence as
        // per rfc4122, sec. 4.1.5
        for (i = 0; i < 36; i++) {
            if (!uuid[i]) {
                r = 0 | Math.random() * 16;
                uuid[i] = chars[(i == 19) ? (r & 0x3) | 0x8 : r];
            }
        }
    }
    return uuid.join('');
}


function storeP12(pri, p7, p12Path, p12Password) {
    var X509Certificate = Java.use("java.security.cert.X509Certificate")
    var p7X509 = Java.cast(p7, X509Certificate);
    var chain = Java.array("java.security.cert.X509Certificate", [p7X509])
    var ks = Java.use("java.security.KeyStore").getInstance("PKCS12", "BC");
    ks.load(null, null);
    ks.setKeyEntry("client", pri, Java.use('java.lang.String').$new(p12Password).toCharArray(), chain);
    try {
        var out = Java.use("java.io.FileOutputStream").$new(p12Path);
        ks.store(out, Java.use('java.lang.String').$new(p12Password).toCharArray())
    } catch (exp) {
        console.log(exp)
    }
}


//hook KeyStore
function hookKeyStore() {
    Java.perform(function () {
        var ByteString = Java.use("com.android.okhttp.okio.ByteString");
        var myArray = new Array(1024);
        for (var i = 0; i < myArray.length; i++) {
            myArray[i] = 0x0;
        }
        var buffer = Java.array('byte', myArray);
        var StringClass = Java.use("java.lang.String");


        var KeyStore = Java.use("java.security.KeyStore");
        //hook


        //hook KeyStore.load()
        KeyStore.load.overload('java.security.KeyStore$LoadStoreParameter').implementation = function (arg0) {
            console.log(Java.use("android.util.Log").getStackTraceString(Java.use("java.lang.Throwable").$new()));
            console.log("KeyStore.load1:", arg0);
            this.load(arg0);
        };
        KeyStore.load.overload('java.io.InputStream', '[C').implementation = function (arg0, arg1) {
            console.log(Java.use("android.util.Log").getStackTraceString(Java.use("java.lang.Throwable").$new()));
            console.log("KeyStore.load2:", arg0, arg1 ? StringClass.$new(arg1) : null);
            if (arg0) {
                var file = Java.use("java.io.File").$new("/sdcard/Download/" + String(arg0) + ".p12");
                var out = Java.use("java.io.FileOutputStream").$new(file);
                var r;
                while ((r = arg0.read(buffer)) > 0) {
                    out.write(buffer, 0, r)
                }
                console.log("save success!")
                out.close()
            }
            this.load(arg0, arg1);
        };

        console.log("hook_KeyStore_load...");

        // android.content.res.AssetManager$AssetInputStream@9b10ad6 bxMAFPL9gc@ntKTqmV@A
        // android.content.res.AssetManager$AssetInputStream@41ce8f6 }%2R+\OSsjpP!w%X
        // android.content.res.AssetManager$AssetInputStream@54858e6 cods.org.cn

    });
}


//hook PrivateKeyEntry
function hookPrivateKeyEntry() {
    Java.perform(function () {
        console.log("Begin!");

        //hook构造函数
        Java.use("java.security.KeyStore$PrivateKeyEntry").$init.overload('java.security.PrivateKey', '[Ljava.security.cert.Certificate;').implementation = function (p, c) {
            console.log("Inside java.security.KeyStore$PrivateKeyEntry is => ", this.toString())
            // console.log("Inside java.security.KeyStore$PrivateKeyEntry.getPrivateKey() is => ",this.getPrivateKey().toString())
            storeP12(this.getPrivateKey(), this.getCertificate(), '/data/local/tmp/' + uuid(10, 16) + '.p12', 'ipylei');
            return this.$init(p, c);
        }
        Java.use("java.security.KeyStore$PrivateKeyEntry").$init.overload('java.security.PrivateKey', '[Ljava.security.cert.Certificate;', 'java.util.Set').implementation = function (p, c, s) {
            console.log("Inside java.security.KeyStore$PrivateKeyEntry is => ", this.toString())
            // console.log("Inside java.security.KeyStore$PrivateKeyEntry.getPrivateKey() is => ",this.getPrivateKey().toString())
            storeP12(this.getPrivateKey(), this.getCertificate(), '/data/local/tmp/' + uuid(10, 16) + '.p12', 'ipylei');
            return this.$init(p, c, s);
        }

        //hook KeyStore$PrivateKeyEntry.getPrivateKey
        Java.use("java.security.KeyStore$PrivateKeyEntry").getPrivateKey.implementation = function () {
            console.log("Calling java.security.KeyStore$PrivateKeyEntry.getPrivateKey method ")
            var result = this.getPrivateKey();
            var packageName = Java.use("android.app.ActivityThread").currentApplication().getApplicationContext().getPackageName();
            console.log("toString result is => ", result.toString())
            storeP12(this.getPrivateKey(), this.getCertificate(), '/data/local/tmp/' + packageName + '-' + uuid(10, 16) + '.p12', 'hello');
            return result;
        }
        //hook KeyStore$PrivateKeyEntry.getCertificateChain
        Java.use("java.security.KeyStore$PrivateKeyEntry").getCertificateChain.implementation = function () {
            console.log("Calling java.security.KeyStore$PrivateKeyEntry.getCertificateChain method ")
            var result = this.getCertificateChain();
            var packageName = Java.use("android.app.ActivityThread").currentApplication().getApplicationContext().getPackageName();
            storeP12(this.getPrivateKey(), this.getCertificate(), '/data/local/tmp/' + packageName + '-' + uuid(10, 16) + '.p12', 'hello');
            return result;
        }
    })
}


function hookFile() {
    Java.perform(function () {
        //SSLpinning helper 帮助定位证书绑定的关键代码
        Java.use("java.io.File").$init.overload('java.io.File', 'java.lang.String').implementation = function (file, cert) {
            var result = this.$init(file, cert);
            //   console.log("1--File path: ", cert);
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
    })
}


function main() {
    hookKeyStore();
    hookPrivateKeyEntry();
    //hookFile();

}

setImmediate(main)