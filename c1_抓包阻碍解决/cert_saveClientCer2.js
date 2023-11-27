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


setImmediate(function () {
    Java.perform(function () {
        console.log("Begin!")
        Java.use("java.security.KeyStore$PrivateKeyEntry").$init.overload('java.security.PrivateKey', '[Ljava.security.cert.Certificate;').implementation = function (p, c) {
            console.log("Inside java.security.KeyStore$PrivateKeyEntry is => ", this.toString())
            // console.log("Inside java.security.KeyStore$PrivateKeyEntry.getPrivateKey() is => ",this.getPrivateKey().toString())
            storeP12(this.getPrivateKey(), this.getCertificate(), '/data/local/tmp/soul' + uuid(10, 16) + '.p12', 'ipylei');
            return this.$init(p, c);
        }
        Java.use("java.security.KeyStore$PrivateKeyEntry").$init.overload('java.security.PrivateKey', '[Ljava.security.cert.Certificate;', 'java.util.Set').implementation = function (p, c, s) {
            console.log("Inside java.security.KeyStore$PrivateKeyEntry is => ", this.toString())
            // console.log("Inside java.security.KeyStore$PrivateKeyEntry.getPrivateKey() is => ",this.getPrivateKey().toString())
            storeP12(this.getPrivateKey(), this.getCertificate(), '/data/local/tmp/soul' + uuid(10, 16) + '.p12', 'ipylei');
            return this.$init(p, c, s);
        }
    })
})