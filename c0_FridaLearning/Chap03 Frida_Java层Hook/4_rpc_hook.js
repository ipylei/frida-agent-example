function CallSecretFunc() {
    Java.perform(function () {
        //主动调用动态函数(实例函数)
        Java.choose('com.example.ipylei.myapplication/MainActivity', {
            onMatch: function (instance) {
                instance.secret();
                console.log("this func call success!")
            },

            onComplete: function () {
            }
        });
    })
}

function getTotalValue() {
    Java.perform(function () {
        var MainActivity = Java.use('com.example.ipylei.myapplication/MainActivity');

        //主动获取动态属性(实例属性)
        Java.choose('com.example.ipylei.myapplication/MainActivity', {
            onMatch: function (instance) {
                // instance.secret();
                //.value直接获取变量的值
                console.log("total value -", instance.total.value);
                // console.log("static total value -", MainActivity.s_total.value);

                send("hello world start...");
            },

            onComplete: function () {
                console.log('search Complete');

                send("hello world end...")
            }
        });
    })
}

// setImmediate(CallSecretFunc);
// setImmediate(getTotalValue);

// TODO 需要注意的是，导出名不可以有大写字母或者下划线。接下来在外部就可以调用这两个函数了。
rpc.exports = {
    callsecretfunc: CallSecretFunc,
    gettotalvalue: getTotalValue
}