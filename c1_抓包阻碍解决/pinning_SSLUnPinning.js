var level = 1;
//1:console.log()
//2:console.log()
//3:console.warn()
//4:console.error()


function printStack(tag = "") {
    let threadClz = Java.use("java.lang.Thread");
    let androidLogClz = Java.use("android.util.Log");
    let exceptionClz = Java.use("java.lang.Exception");

    let currentThread = threadClz.currentThread();
    let threadId = currentThread.getId();
    let threadName = currentThread.getName();
    let stackInfo = androidLogClz.getStackTraceString(exceptionClz.$new()).substring(20);

    let logContent = `${tag}--->threadId=>${threadId}, threadName=>${threadName}, stackInfo=>\n${stackInfo}`;
    console.log(logContent);

    //console.log(Java.use("android.util.Log").getStackTraceString(Java.use("java.lang.Exception").$new()))
}

//android底层
function bypass_android_builtin() {
    Java.perform(function () {
        let X509TrustManager = Java.use('javax.net.ssl.X509TrustManager');
        var TrustManager = null;
        try {
            TrustManager = Java.registerClass({
                name: 'org.wooyun.TrustManager',
                implements: [X509TrustManager],
                methods: {
                    checkClientTrusted: function (chain, authType) {
                    },
                    checkServerTrusted: function (chain, authType) {
                    },
                    getAcceptedIssuers: function () {
                        return [];
                    }
                }
            });
        } catch (e) {
            console.error("[-] error！ registerClass from X509TrustManager >>>>>>>> " + e.message);
        }

        let TrustManagers;
        if (TrustManager) {
            TrustManagers = [TrustManager.$new()];
        } else {
            TrustManagers = [];
        }
        let SSLContext = Java.use('javax.net.ssl.SSLContext');
        SSLContext.init.overload('[Ljavax.net.ssl.KeyManager;', '[Ljavax.net.ssl.TrustManager;', 'java.security.SecureRandom').implementation = function (keyManager, trustManager, secureRandom) {
            console.log('pass by self self TrustManager');
            if (level <= 1) printStack();
            return this.init.apply(this, [null, TrustManagers, null]);
        };

        //---
        try {
            let OpenSSLEngineSocketImpl = Java.use('com.android.org.conscrypt.OpenSSLEngineSocketImpl');
            OpenSSLEngineSocketImpl.verifyCertificateChain.overload('[Ljava.lang.Long;', 'java.lang.String').implementation = function (a, b) {
                console.log('[√] pass by conscrypt.OpenSSLEngineSocketImpl.verifyCertificateChain');
            };
            console.log('[+] Hooked conscrypt.OpenSSLEngineSocketImpl Conscrypt');
        } catch (e) {
            console.error('[-] error Hooked conscrypt.OpenSSLEngineSocketImpl Conscrypt  ', e.message);
        }

        //---
        try {
            let OpenSSLSocketImpl = Java.use('com.android.org.conscrypt.OpenSSLSocketImpl');
            OpenSSLSocketImpl.verifyCertificateChain.implementation = function (certRefs, authMethod) {
                console.log('[√] pass by OpenSSLSocketImpl.verifyCertificateChain');
                if (level <= 1) printStack();
            }
            console.log("[+] Hooked OpenSSLSocketImpl.verifyCertificateChain");
        } catch (e) {
            console.error('[-] error Hooked OpenSSLSocketImpl.verifyCertificateChain' + e.message);
        }

        //---
        try {
            let CertPinManager = Java.use('com.android.org.conscrypt.CertPinManager');
            CertPinManager.isChainValid.overload('java.lang.String', 'java.util.List').implementation = function (a, b) {
                console.log('[√] pass by conscrypt.CertPinManager.isChainValid: ' + a);
                return true;
            };
            console.log("[+] Hooked conscrypt.CertPinManager.isChainValid");
        } catch (e) {
            console.error('[-] error hook conscrypt.CertPinManager.isChainValid', e.message);
        }

        //---
        try {
            // Android 7+ TrustManagerImpl
            let TrustManagerImpl = Java.use("com.android.org.conscrypt.TrustManagerImpl");
            TrustManagerImpl.verifyChain.implementation = function (untrustedChain, trustAnchorChain, host, clientAuth, ocspData, tlsSctData) {
                console.log("[√] pass by conscrypt.TrustManagerImpl.verifyChain");
                if (level <= 1) printStack();
                // Skip all the logic and just return the chain again :P
                //https://www.nccgroup.trust/uk/about-us/newsroom-and-events/blogs/2017/november/bypassing-androids-network-security-configuration/
                // https://github.com/google/conscrypt/blob/c88f9f55a523f128f0e4dace76a34724bfa1e88c/platform/src/main/java/org/conscrypt/TrustManagerImpl.java#L650
                return untrustedChain;
            }
            console.log("[+] Hooked conscrypt.TrustManagerImpl.verifyChain");

        } catch (e) {
            console.error("[-] error Hooked conscrypt.TrustManagerImpl.verifyChain", e.message);
        }


        //---
        try {
            var X509TrustManagerExtensionsClass = Java.use('android.net.http.X509TrustManagerExtensions');
            var X509TrustManagerExtensionsClassCheckServerTrusted = X509TrustManagerExtensionsClass.checkServerTrusted.overload('[Ljava.security.cert.X509Certificate;', 'java.lang.String', 'java.lang.String');
            X509TrustManagerExtensionsClassCheckServerTrusted.implementation = function (certsArr, v1, v2) {
                console.log("[√] pass by http.X509TrustManagerExtensions.checkServerTrusted");
                return Java.use('java.util.Arrays$ArrayList').$new(certsArr);
            };
            console.log("[+] Hooked http.X509TrustManagerExtensions.checkServerTrusted");
        } catch (e) {
            console.error("[-] error Hooked http.X509TrustManagerExtensions.checkServerTrusted", e.message)
        }


        //----
        try {
            var NetworkSecurityTrustManagerClass = Java.use('android.security.net.config.NetworkSecurityTrustManager');
            var NetworkSecurityTrustManagerClassCheckPins = NetworkSecurityTrustManagerClass.checkPins.overload('java.util.List');
            NetworkSecurityTrustManagerClassCheckPins.implementation = function (v0) {
                //什么都不做
                console.log("[√] bypass by NetworkSecurityTrustManager.checkPins");
            };
            console.log("[+] Hooked NetworkSecurityTrustManager.checkPins");
        } catch (e) {
            console.error("[-] error Hooked NetworkSecurityTrustManager.checkPins", e.message)
        }
    })
}

//这是hooker添加的hook点，原JustTrustMe中没有的
function bypass_ConscryptPlatform() {
    var com_android_org_conscrypt_Platform_clz;
    try {
        com_android_org_conscrypt_Platform_clz = Java.use('com.android.org.conscrypt.Platform');
    } catch (e) {
        console.log("error find conscrypt.Platform ", e.message);
    }
    if (!com_android_org_conscrypt_Platform_clz) {
        return;
    }

    var com_android_org_conscrypt_Platform_clz_method_checkServerTrusted_9565 = undefined;
    try {
        com_android_org_conscrypt_Platform_clz_method_checkServerTrusted_9565 = com_android_org_conscrypt_Platform_clz.checkServerTrusted.overload('javax.net.ssl.X509TrustManager', '[Ljava.security.cert.X509Certificate;', 'java.lang.String', 'com.android.org.conscrypt.OpenSSLEngineImpl');
    } catch (e) {
        console.error("[-] error Hooked Platform.checkServerTrusted 1", e.message);
    } finally {
        if (com_android_org_conscrypt_Platform_clz_method_checkServerTrusted_9565) {
            com_android_org_conscrypt_Platform_clz_method_checkServerTrusted_9565.implementation = function (v0, v1, v2, v3) {
                //什么都不做
                console.log("[√] pass by Platform.checkServerTrusted 1");
            };
        }
    }

    var com_android_org_conscrypt_Platform_clz_method_checkServerTrusted_6928 = undefined;
    try {
        com_android_org_conscrypt_Platform_clz_method_checkServerTrusted_6928 = com_android_org_conscrypt_Platform_clz.checkServerTrusted.overload('javax.net.ssl.X509TrustManager', '[Ljava.security.cert.X509Certificate;', 'java.lang.String', 'com.android.org.conscrypt.OpenSSLSocketImpl');
    } catch (e) {
        console.error("[-] error Hooked Platform.checkServerTrusted 2", e.message);
    } finally {
        if (com_android_org_conscrypt_Platform_clz_method_checkServerTrusted_6928) {
            com_android_org_conscrypt_Platform_clz_method_checkServerTrusted_6928.implementation = function (v0, v1, v2, v3) {
                //什么都不做
                console.log("[√] pass by Platform.checkServerTrusted 2");
            };
        }
    }

    var com_android_org_conscrypt_Platform_clz_method_checkServerTrusted_4651 = undefined;
    try {
        com_android_org_conscrypt_Platform_clz_method_checkServerTrusted_4651 = com_android_org_conscrypt_Platform_clz.checkServerTrusted.overload('javax.net.ssl.X509TrustManager', '[Ljava.security.cert.X509Certificate;', 'java.lang.String', 'com.android.org.conscrypt.AbstractConscryptSocket');
    } catch (e) {
        console.error("[-] error Hooked Platform.checkServerTrusted 3", e.message);
    } finally {
        if (com_android_org_conscrypt_Platform_clz_method_checkServerTrusted_4651) {
            com_android_org_conscrypt_Platform_clz_method_checkServerTrusted_4651.implementation = function (v0, v1, v2, v3) {
                console.log("[√] pass by Platform.checkServerTrusted 3");
            };
        }
    }

    var com_android_org_conscrypt_Platform_clz_method_checkServerTrusted_6474 = undefined;
    try {
        com_android_org_conscrypt_Platform_clz_method_checkServerTrusted_6474 = com_android_org_conscrypt_Platform_clz.checkServerTrusted.overload('javax.net.ssl.X509TrustManager', '[Ljava.security.cert.X509Certificate;', 'java.lang.String', 'com.android.org.conscrypt.ConscryptEngine');
    } catch (e) {
        console.error("[-] error Hooked Platform.checkServerTrusted 4", e.message);
    } finally {
        if (com_android_org_conscrypt_Platform_clz_method_checkServerTrusted_6474) {
            com_android_org_conscrypt_Platform_clz_method_checkServerTrusted_6474.implementation = function (v0, v1, v2, v3) {
                console.log("[√] pass by Platform.checkServerTrusted 4");
            };
        }
    }
}


function bypass_okhttp() {
    Java.perform(function () {
        //---
        try {
            let OkHttpClient = Java.use("com.squareup.okhttp.OkHttpClient");
            OkHttpClient.setCertificatePinner.implementation = function (certificatePinner) {
                console.log("[√] pass by okhttp.OkHttpClient.setCertificatePinner");
                if (level <= 1) printStack();
                return this;
            };
            let CertificatePinner = Java.use("com.squareup.okhttp.CertificatePinner");
            CertificatePinner.check.overload('java.lang.String', '[Ljava.security.cert.Certificate;').implementation = function (p0, p1) {
                console.log("[√] pass by okhttp.CertificatePinner.check 1");
                if (level <= 1) printStack();
                return;
            };
            CertificatePinner.check.overload('java.lang.String', 'java.util.List').implementation = function (p0, p1) {
                console.log("[√] pass by okhttp.CertificatePinner.check 2");
                if (level <= 1) printStack();
                return;
            };
            console.log("[+] Hooked android okhttp.OkHttpClient; okhttp.CertificatePinner");
        } catch (e) {
            console.error("[-] error Hooked okhttp.OkHttpClient; okhttp.CertificatePinner: " + e.message);
        }

        //---
        try {
            // Bypass Squareup OkHostnameVerifier {1}
            var Squareup_OkHostnameVerifier_Activity_1 = Java.use('com.squareup.okhttp.internal.tls.OkHostnameVerifier');
            Squareup_OkHostnameVerifier_Activity_1.verify.overload('java.lang.String', 'java.security.cert.X509Certificate').implementation = function (a, b) {
                console.log('[√] pass by Squareup OkHostnameVerifier {1}: ' + a);
                return true;
            };
        } catch (e) {
            console.error('[-] error Hooked OkHostnameVerifier.verify 1:', e.message);
        }

        //---
        try {
            // Bypass Squareup OkHostnameVerifier {2}
            var Squareup_OkHostnameVerifier_Activity_2 = Java.use('com.squareup.okhttp.internal.tls.OkHostnameVerifier');
            Squareup_OkHostnameVerifier_Activity_2.verify.overload('java.lang.String', 'javax.net.ssl.SSLSession').implementation = function (a, b) {
                console.log('[√] pass by Squareup OkHostnameVerifier {2}: ' + a);
                return true;
            };
        } catch (e) {
            console.error('[-] error Hooked OkHostnameVerifier.verify 2:', e.message);
        }


    })
}

//okhttp3
function bypass_okhttp3() {
    Java.perform(function () {
        //----
        try {
            let CertificatePinner = Java.use('okhttp3.CertificatePinner');
            CertificatePinner.check.overload('java.lang.String', 'java.util.List').implementation = function () {
                console.log("[√] pass by okhttp3.CertificatePinner.check 1")
                if (level <= 1) printStack();
            }
            CertificatePinner.check.overload('java.lang.String', '[Ljava.security.cert.Certificate;').implementation = function (a, b) {
                console.log('[√] pass by okhttp3.CertificatePinner.check 2:' + a);
                return;
            };
            /*CertificatePinner.check.overload('java.lang.String', 'java.security.cert.Certificate').implementation = function (a, b) {
                console.log('[+] Bypassing OkHTTPv3 {3}: ' + a);
                return;
            };
            CertificatePinner['check$okhttp'].implementation = function (a, b) {
                console.log('[+] Bypassing OkHTTPv3 {4}: ' + a);
            };*/
            console.log("[+] Hooked okhttp3.CertificatePinner");
        } catch (e) {
            console.error("[-] error Hooked okhttp3.CertificatePinner" + e.message);
        }

        //----
        try {
            var OkHostnameVerifierClz = Java.use('okhttp3.internal.tls.OkHostnameVerifier');
            var OkHostnameVerifierClzVerify_5791 = OkHostnameVerifierClz.verify.overload('java.lang.String', 'javax.net.ssl.SSLSession');
            OkHostnameVerifierClzVerify_5791.implementation = function (v0, v1) {
                console.log("[√] pass by okhttp3 OkHostnameVerifier.verify 1");
                return true;
            };
            var OkHostnameVerifierVerify_8978 = OkHostnameVerifierClz.verify.overload('java.lang.String', 'java.security.cert.X509Certificate');
            OkHostnameVerifierVerify_8978.implementation = function (v0, v1) {
                console.log("[√] pass by okhttp3 OkHostnameVerifier.verify 2");
                return true;
            };
        } catch (e) {
            console.error("[-] error hooked okhttp3 OkHostnameVerifier", e.message);
        }

    })
}

//appcelerator Titanium
function bypass_appcelerator() {
    Java.perform(function () {
        try {
            let PinningTrustManager = Java.use('appcelerator.https.PinningTrustManager');
            PinningTrustManager.checkServerTrusted.implementation = function () {
                if (level <= 2) console.log('[√] pass by PinningTrustManager.checkServerTrusted');
                if (level <= 1) printStack();
            }
            console.log("[+] Hooked appcelerator");
        } catch (e) {
            console.error("[-] appcelerator not found ", e.message)
        }
    })
}


//JSSE
function bypass_JSSE() {
    Java.perform(function () {
        try {
            let HttpsURLConnection = Java.use("javax.net.ssl.HttpsURLConnection");
            HttpsURLConnection.setSSLSocketFactory.implementation = function (SSLSocketFactory) {
                console.log("[√] pass by HttpsURLConnection.setSSLSocketFactory");
                if (level <= 1) printStack();
                return null;
            };
            HttpsURLConnection.setDefaultHostnameVerifier.implementation = function (hostnameVerifier) {
                console.log("[√] pass by HttpsURLConnection.setDefaultHostnameVerifier");
                if (level <= 1) printStack();
                return null;
            };
            HttpsURLConnection.setHostnameVerifier.implementation = function (hostnameVerifier) {
                console.log("[√] pass by HttpsURLConnection.setHostnameVerifier");
                if (level <= 1) printStack();
                return null;
            };
            console.log("[+] Hooked JSSE");
        } catch (e) {
            console.error("[-] error Hooked JSSE " + e.message);
        }
    })
}

//Xutils3x
function bypass_Xutils3x() {
    Java.perform(function () {
        /*var TrustHostnameVerifier;
        try {
            TrustHostnameVerifier = Java.registerClass({
                name: 'org.wooyun.TrustHostnameVerifier',
                implements: [HostnameVerifier],
                method: {
                    verify: function (hostname, session) {
                        return true;
                    }
                }
            });

        } catch (e) {
            //java.lang.ClassNotFoundException: Didn't find class "org.wooyun.TrustHostnameVerifier"
            console.error("registerClass from hostnameVerifier >>>>>>>> " + e.message);
        }*/

        try {
            let RequestParams = Java.use('org.xutils.http.RequestParams');
            RequestParams.setSslSocketFactory.implementation = function (sslSocketFactory) {
                console.log("[√] pass by RequestParams.setSslSocketFactory");
                if (level <= 1) printStack();
                return null;
            }
            RequestParams.setHostnameVerifier.implementation = function (hostnameVerifier) {
                //hostnameVerifier = TrustHostnameVerifier.$new();
                console.log("[√] pass by RequestParams.setHostnameVerifier");
                if (level <= 1) printStack();
                return null;
            }
            console.log("[+] Hooked Xutils3x");

        } catch (e) {
            console.error("[-] error Hooked Xutils " + e.message);
        }


    })
}


//httpclientandroidlib
function bypass_httpclientandroidlib() {
    Java.perform(function () {
        try {
            var AbstractVerifier = Java.use("ch.boye.httpclientandroidlib.conn.ssl.AbstractVerifier");
            AbstractVerifier.verify.overload('java.lang.String', '[Ljava.lang.String', '[Ljava.lang.String', 'boolean').implementation = function () {
                console.log("[√] pass by ssl.AbstractVerifier.verify");
                if (level <= 1) printStack();
                return null;
            }
            console.log("[+] Hooked httpclientandroidlib");
        } catch (e) {
            console.error("[-] error Hooked httpclientandroidlib", e.message);
        }
    })
}

//TrustKit
function bypass_TrustKit() {
    Java.perform(function () {
        try {
            let OkHostnameVerifier = Java.use("com.datatheorem.android.trustkit.pinning.OkHostnameVerifier");
            OkHostnameVerifier.verify.overload('java.lang.String', 'javax.net.ssl.SSLSession').implementation = function (str) {
                console.log('[√] pass by Trustkit.verify1: ' + str);
                if (level <= 1) printStack();
                return true;
            };
            OkHostnameVerifier.verify.overload('java.lang.String', 'java.security.cert.X509Certificate').implementation = function (str) {
                console.log('[√] pass by Trustkit.verify2: ' + str);
                if (level <= 1) printStack();
                return true;
            };
            console.log("[+] Hooked TrustKit");
        } catch (e) {
            console.error('[-] error Hooked TrustKit', e.message)
        }

        //----
        try {
            var PinningTrustManager = Java.use('com.datatheorem.android.trustkit.pinning.PinningTrustManager');
            PinningTrustManager.checkServerTrusted.implementation = function () {
                console.log("[√] pass by PinningTrustManager.checkServerTrusted");
            };
            console.log('[+] Hooked Trustkit PinningTrustManager');
        } catch (e) {
            console.error('[-] error Hooked Trustkit PinningTrustManager', e.message);
        }
    })
}


//Cronet
function bypass_Cronet() {
    Java.perform(function () {
        try {
            //cronet pinner hook
            //weibo don't invoke
            var netBuilder = Java.use("org.chromium.net.CronetEngine$Builder");
            //https://developer.android.com/guide/topics/connectivity/cronet/reference/org/chromium/net/CronetEngine.Builder.html#enablePublicKeyPinningBypassForLocalTrustAnchors(boolean)
            netBuilder.enablePublicKeyPinningBypassForLocalTrustAnchors.implementation = function (arg) {
                console.log("[√] pass by netBuilder.enablePublicKeyPinningBypassForLocalTrustAnchors anchors=" + arg);
                if (level <= 1) printStack();
                //true to enable the bypass, false to disable.
                var ret = netBuilder.enablePublicKeyPinningBypassForLocalTrustAnchors.call(this, true);
                return ret;
            };
            netBuilder.addPublicKeyPins.implementation = function (hostName, pinsSha256, includeSubdomains, expirationDate) {
                console.log("pass by netBuilder.addPublicKeyPins hostName= " + hostName);
                if (level <= 1) printStack();
                return this;
            };
            console.log("[+] Hooked cronet");

        } catch (e) {
            console.error('[-] error Hooked Cronet ', e.message);
        }
    })
}


//OpenSSLSocketImpl Apache Harmony
function bypass_apacheHarmony() {
    Java.perform(function () {
        try {
            var OpenSSLSocketImpl_Harmony = Java.use('org.apache.harmony.xnet.provider.jsse.OpenSSLSocketImpl');
            OpenSSLSocketImpl_Harmony.verifyCertificateChain.implementation = function (asn1DerEncodedCertificateChain, authMethod) {
                console.log('[√] pass by jsse.OpenSSLSocketImpl.verifyCertificateChain');
            };
        } catch (e) {
            console.error('[-] error Hooked jsse.OpenSSLSocketImpl.verifyCertificateChain', e.message);
        }
    })
}


// Apache Cordova WebViewClient
function bypass_apacheCordova() {
    Java.perform(function () {
        try {
            var CordovaWebViewClient_Activity = Java.use('org.apache.cordova.CordovaWebViewClient');
            CordovaWebViewClient_Activity.onReceivedSslError.overload('android.webkit.WebView', 'android.webkit.SslErrorHandler', 'android.net.http.SslError').implementation = function (obj1, obj2, obj3) {
                console.log('[√] pass by Apache Cordova WebViewClient');
                obj3.proceed();
            };
        } catch (e) {
            console.error('[-] error hooked Apache Cordova WebViewClient', e.message);
        }
    })
}


//PhoneGap sslCertificateChecker (https://github.com/EddyVerbruggen/SSLCertificateChecker-PhoneGap-Plugin)
function bypass_PhoneGap() {
    Java.perform(function () {
        try {
            var phonegap_Activity = Java.use('nl.xservices.plugins.sslCertificateChecker');
            phonegap_Activity.execute.overload('java.lang.String', 'org.json.JSONArray', 'org.apache.cordova.CallbackContext').implementation = function (a, b, c) {
                console.log('[√] pass by PhoneGap sslCertificateChecker: ' + a);
                return true;
            };
        } catch (e) {
            console.error('[-] error Hooked PhoneGap sslCertificateChecker: ', e.message);
        }
    })
}


//IBM MobileFirst
function bypass_MobileFirst() {
    Java.perform(function () {
        try {
            // Bypass IBM MobileFirst {1}
            var WLClient_Activity_1 = Java.use('com.worklight.wlclient.api.WLClient');
            WLClient_Activity_1.getInstance().pinTrustedCertificatePublicKey.overload('java.lang.String').implementation = function (cert) {
                console.log('[√] pass by IBM MobileFirst pinTrustedCertificatePublicKey {1}: ' + cert);
                return;
            };
        } catch (e) {
            console.error('[-] error Hooked IBM MobileFirst pinTrustedCertificatePublicKey 1', e.message);
        }
        try {
            // Bypass IBM MobileFirst {2}
            var WLClient_Activity_2 = Java.use('com.worklight.wlclient.api.WLClient');
            WLClient_Activity_2.getInstance().pinTrustedCertificatePublicKey.overload('[Ljava.lang.String;').implementation = function (cert) {
                console.log('[+] pass by IBM MobileFirst pinTrustedCertificatePublicKey {2}: ' + cert);
                return;
            };
        } catch (e) {
            console.error('[-] error Hooked IBM MobileFirst pinTrustedCertificatePublicKey 2', e.message);
        }
    })
}

//IBM WorkLight
function bypass_WorkLight() {
    Java.perform(function () {
        try {
            // Bypass IBM WorkLight {1}
            var worklight_Activity_1 = Java.use('com.worklight.wlclient.certificatepinning.HostNameVerifierWithCertificatePinning');
            worklight_Activity_1.verify.overload('java.lang.String', 'javax.net.ssl.SSLSocket').implementation = function (a, b) {
                console.log('[√] pass by IBM WorkLight HostNameVerifierWithCertificatePinning {1}: ' + a);
                return;
            };
        } catch (e) {
            console.error('[-] error Hooked IBM WorkLight HostNameVerifierWithCertificatePinning {1}', e.message);
        }
        try {
            // Bypass IBM WorkLight {2}
            var worklight_Activity_2 = Java.use('com.worklight.wlclient.certificatepinning.HostNameVerifierWithCertificatePinning');
            worklight_Activity_2.verify.overload('java.lang.String', 'java.security.cert.X509Certificate').implementation = function (a, b) {
                console.log('[√] pass by IBM WorkLight HostNameVerifierWithCertificatePinning {2}: ' + a);
                return;
            };
        } catch (e) {
            console.error('[-] error Hooked IBM WorkLight HostNameVerifierWithCertificatePinning {2}', e.message);
        }
        try {
            // Bypass IBM WorkLight {3}
            var worklight_Activity_3 = Java.use('com.worklight.wlclient.certificatepinning.HostNameVerifierWithCertificatePinning');
            worklight_Activity_3.verify.overload('java.lang.String', '[Ljava.lang.String;', '[Ljava.lang.String;').implementation = function (a, b) {
                console.log('[√] pass by IBM WorkLight HostNameVerifierWithCertificatePinning {3}: ' + a);
                return;
            };
        } catch (e) {
            console.error('[-] error Hooked IBM WorkLight HostNameVerifierWithCertificatePinning {3}', e.message);
        }
        try {
            // Bypass IBM WorkLight {4}
            var worklight_Activity_4 = Java.use('com.worklight.wlclient.certificatepinning.HostNameVerifierWithCertificatePinning');
            worklight_Activity_4.verify.overload('java.lang.String', 'javax.net.ssl.SSLSession').implementation = function (a, b) {
                console.log('[√] pass by IBM WorkLight HostNameVerifierWithCertificatePinning {4}: ' + a);
                return true;
            };
        } catch (e) {
            console.error('[-] error Hooked IBM WorkLight HostNameVerifierWithCertificatePinning {4}', e.message);
        }
    })
}

//Worklight Androidgap WLCertificatePinningPlugin
function bypass_WorkLightAndroidGap() {
    Java.perform(function () {
        try {
            var androidgap_WLCertificatePinningPlugin_Activity = Java.use('com.worklight.androidgap.plugin.WLCertificatePinningPlugin');
            androidgap_WLCertificatePinningPlugin_Activity.execute.overload('java.lang.String', 'org.json.JSONArray', 'org.apache.cordova.CallbackContext').implementation = function (a, b, c) {
                console.log('[√] pass by Worklight Androidgap WLCertificatePinningPlugin: ' + a);
                return true;
            };
        } catch (e) {
            console.error('[-] error Hooked Worklight Androidgap WLCertificatePinningPlugin', e.message);
        }
    })
}

//CWAC-Netsecurity (unofficial back-port pinner for Android<4.2) CertPinManager
function bypass_NetSecurity() {
    Java.perform(function () {
        try {
            var cwac_CertPinManager_Activity = Java.use('com.commonsware.cwac.netsecurity.conscrypt.CertPinManager');
            cwac_CertPinManager_Activity.isChainValid.overload('java.lang.String', 'java.util.List').implementation = function (a, b) {
                console.log('[√] pass by CWAC-Netsecurity CertPinManager: ' + a);
                return true;
            };
        } catch (e) {
            console.error('[-] error Hooked CertPinManager.isChainValid', e.message);
        }
    })
}

//Netty FingerprintTrustManagerFactory
function bypass_Netty() {
    Java.perform(function () {
        try {
            var netty_FingerprintTrustManagerFactory = Java.use('io.netty.handler.ssl.util.FingerprintTrustManagerFactory');
            //NOTE: sometimes this below implementation could be useful
            //var netty_FingerprintTrustManagerFactory = Java.use('org.jboss.netty.handler.ssl.util.FingerprintTrustManagerFactory');
            netty_FingerprintTrustManagerFactory.checkTrusted.implementation = function (type, chain) {
                console.log('[√] pass by Netty FingerprintTrustManagerFactory');
            };
        } catch (e) {
            console.error('[-] error Hooked Netty FingerprintTrustManagerFactory', e.message);
        }
    })
}


//WebView
function bypass_webview() {
    Java.perform(function () {
        try {
            let WebViewClient = Java.use("android.webkit.WebViewClient");
            WebViewClient.onReceivedSslError.implementation = function (webView, sslErrorHandler, sslError) {
                console.log("pass by WebViewClient.onReceivedSslError");
                if (level <= 1) printStack();
                //执行proceed方法
                sslErrorHandler.proceed();
                return;
            };
            WebViewClient.onReceivedError.overload('android.webkit.WebView', 'int', 'java.lang.String', 'java.lang.String').implementation = function (a, b, c, d) {
                console.log("pass by WebViewClient.onReceivedError 1");
                if (level <= 1) printStack();
                return;
            };
            WebViewClient.onReceivedError.overload('android.webkit.WebView', 'android.webkit.WebResourceRequest', 'android.webkit.WebResourceError').implementation = function () {
                console.log("pass by WebViewClient.onReceivedError 2");
                if (level <= 1) printStack();
                return;
            };
            console.log("[+] hooked webview");
        } catch (e) {
            console.error("[-] error Hooked webview" + e.message);
        }

    })
}

function ssl_un_pinning() {
    // 这两个常驻
    bypass_android_builtin();
    bypass_ConscryptPlatform();
    bypass_okhttp();

    bypass_okhttp3();
    bypass_appcelerator();
    bypass_JSSE();
    bypass_Xutils3x();
    bypass_httpclientandroidlib();
    bypass_TrustKit();
    bypass_Cronet();

    bypass_apacheHarmony();
    bypass_apacheCordova();

    bypass_PhoneGap();
    bypass_MobileFirst();
    bypass_WorkLight();
    bypass_WorkLightAndroidGap();
    bypass_NetSecurity();
    bypass_Netty();

    bypass_webview();

}

setImmediate(ssl_un_pinning)
