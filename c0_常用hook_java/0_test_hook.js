function test() {
    Java.perform(function () {
        //let MainActivityCls = Java.use("com.example.ndktools.MainActivity");
        //console.log(MainActivityCls);
        //MainActivityCls.stringFromJNI.implementation = function () {
        //    console.log("hello", Date.now() / 1000);
        //    return this.stringFromJNI();
        //}

        console.log("hello world");

        let MainActivity = Java.use("com.example.ndkdemo.MainActivity");
        MainActivity["stringFromJNI"].implementation = function () {
            console.log(">>>>>>>>>>>>>>>>>>>>>>>>>>>>>>");
            console.log(`MainActivity.stringFromJNI is called`, Date.now() / 1000);
            let result = this["stringFromJNI"]();
            console.log(`MainActivity.stringFromJNI result=${result}`);
            console.log("<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<");
            return result;
        };
    })
}

function main() {
    //test();
}


setImmediate(main)