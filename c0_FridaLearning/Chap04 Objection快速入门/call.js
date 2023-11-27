// 主动调用方法
function callSub() {
    Java.perform(function () {
        var Arith = Java.use('com.example.junior.util.Arith');
        var JavaString = Java.use('java.lang.String');
        var result = Arith.sub(JavaString.$new('123'), JavaString.$new('111'))
        console.log("123 - 111 =", result)
    })
}