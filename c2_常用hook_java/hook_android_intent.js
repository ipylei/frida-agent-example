//printStack


function hook_android_intent() {
    Java.perform(function () {
        let Activity = Java.use("xxxx");
        Activity.startActivity.overload("android.content.Intent").implementation = function (p1) {
            console.log(">>>", p1);
            printStack();
            console.log(decodeURIComponent(p1.toUri(256)));
            this.startActivity(p1);
        };

        Activity.startActivity.overload("android.content.Intent", "android.os.Bundle").implementation = function (p1, p2) {
            console.log("---", p1);
            printStack();
            console.log(decodeURIComponent(p1.toUri(256)));
            this.startActivity(p1, p2);
        };

        Activity.startService.overload("android.content.Intent").implementation = function (p1) {
            console.log("===", p1);
            printStack();
            console.log(decodeURIComponent(p1.toUri(256)));
            this.startService(p1);
        };
    })
}