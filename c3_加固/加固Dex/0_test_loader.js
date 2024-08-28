function getclassload() {
    var activityobj = Java.use("android.app.ActivityThread").currentActivityThread();
    var mInitialApplication = activityobj.mInitialApplication.value;
    var mLoadedApk = mInitialApplication.mLoadedApk.value;
    var mClassLoader = mLoadedApk.mClassLoader.value;
    return mClassLoader;

}

function func() {
    Java.perform(function () {
        //console.log(Java.classFactory.loader);
        try {
            //let Cls = Java.use("com.cebbank.yaoyao.startup.GuideActivity");
            let Cls = Java.use("com.secneo.apkwrapper.AW");

            Cls.attachBaseContext.implementation = function (arg) {
                //-----
                console.log(Java.classFactory.loader);
                //console.log(Java.classFactory.loader.$className);

                let retval = this.attachBaseContext(arg);
                console.log("控制权移交结束");

                //不用手动切换loader!
                //var loader = getclassload();
                //Java.classFactory.loader=loader;

                //-----
                console.log(Java.classFactory.loader);
                //console.log(Java.classFactory.loader.$className);

                let Cls2 = Java.use("com.cebbank.yaoyao.startup.GuideActivity");
                console.log(Cls2);
                return retval;
            }

            console.log(Cls);
        } catch (e) {
            console.log(e);
        }

    })
}

function main() {
    func();

}

setImmediate(main);


/*结论是不用手动切换loader:
    Java.classFactory.loader=this;
* */