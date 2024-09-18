/*
* Hook Android常见类
* */

function hook_SharedPreference() {
    Java.perform(function () {
        let clsEditor = Java.use("android.app.SharedPreferencesImpl$EditorImpl");
        clsEditor.putString.overload('java.lang.String', 'java.lang.String').implementation = function (arg1, arg2) {
            if (arg1 === "jma_softfingerprint") {
                console.log("[SharedPreferencesImpl] putString -> key: " + arg1 + " = " + arg2);
                printStack();
            }
            return this.putString(arg1, arg2);
            //return null;
        }
        /*
           clsEditor.putBoolean.overload('java.lang.String', 'boolean').implementation = function (arg1, arg2) {
               console.log("[SharedPreferencesImpl ] putBoolean -> key: " + arg1 + " = " + arg2);
               printStack();
               return this.putBoolean(arg1, arg2);
               //return null;
           }

           clsEditor.putInt.overload('java.lang.String', 'int').implementation = function (arg1, arg2) {
               console.log("[SharedPreferencesImpl] putInt -> key: " + arg1 + " = " + arg2);
               printStack();
               return this.putInt(arg1, arg2);
               //return null;
           }

           clsEditor.putFloat.overload('java.lang.String', 'float').implementation = function (arg1, arg2) {
               console.log("[SharedPreferencesImpl] putFloat -> key: " + arg1 + " = " + arg2);
               printStack();
               return this.putFloat(arg1, arg2);
               //return null;
           }

           clsEditor.putLong.overload('java.lang.String', 'long').implementation = function (arg1, arg2) {
               console.log("[SharedPreferencesImpl] putLong -> key: " + arg1 + " = " + arg2);
               printStack();
               return this.putLong(arg1, arg2);
               //return null;
           }
       */


        /*let clsSharedPreferences = Java.use("android.app.SharedPreferencesImpl");
        clsSharedPreferences.getString.implementation = function (arg0) {
            let ret = this.getString.apply(this, arguments);
            if (arg0 === "jma_softfingerprint") {
                console.log("getString参数为：", arguments);
                console.log("getString返回值为 ：", arguments);
                printStack();
            }
            return ret;
        }*/
    })
}