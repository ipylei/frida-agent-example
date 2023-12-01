/*
VPN抓包还是能被检测到(检测网卡)，但可以使用hook过掉。
*/

function hook_vpn() {
    Java.perform(function () {
        
        var String = Java.use("java.lang.String");
        var NetworkInterface = Java.use("java.net.NetworkInterface");
        NetworkInterface.getName.implementation = function () {
            var result = this.getName();
            //console.log("find getName：", result);
            if (result && (result.indexOf("ppp0") > -1 || result.indexOf("tun0") > -1)) {
                console.log("find getName：", result);
                result = String.$new("rmnet_data0");
            }
            return result;
        }


        //情况一
        var ConnectivityManager = Java.use("android.net.ConnectivityManager");
        ConnectivityManager.getNetworkCapabilities.implementation = function (arg) {
            var result = this.getNetworkCapabilities(arg);
            console.log("find getNetworkCapabilities：", result);
            return null;
        }

        //情况二 (2选1)
        Java.use("android.net.NetworkCapabilities").hasTransport.implementation = function (v) {
            console.log(v)
            var res = this.hasTransport(v)
            console.log("res hasTransport ==> ", res)
            return false;
        }

    })
}

setImmediate(hook_vpn);
