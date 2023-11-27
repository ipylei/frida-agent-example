// 规模化主动调用
function callSub(a, b) {
    Java.perform(function () {
        var Arith = Java.use('com.example.junior.util.Arith');
        var JavaString = Java.use('java.lang.String');
        var result = Arith.sub(JavaString.$new(a), JavaString.$new(b))
        // console.log(`${a}-${b}=${result}`)
        send(`${a}-${b}=${result}`)
    })
}


rpc.exports = {
    sub: callSub
}