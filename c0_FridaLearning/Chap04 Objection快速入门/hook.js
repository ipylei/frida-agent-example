// 在4.4.1小节中，我们确认了Arith类的函数sub(java.lang.String, java.lang.String)是最终计算器减法的真实执行函数。接下来是对这个减法的进一步利用。
// 在进一步实现利用前，需要优先确保整个代码的正确性。这里采取最终实现和Objection一样的Hook结果的目标来确保整个代码的正确性，初步的Frida脚本代码如代码清单4-6所示。


// hook方法
function main() {
    Java.perform(function () {
        var Arith = Java.use('com.example.junior.util.Arith');
        Arith.sub.overload('java.lang.String', 'java.lang.String').implementation = function (str, str2){
            var result = this.sub(str, "123");

            // var JavaString = Java.use('java.lang.String');
            // var result = this.sub(str, JavaString.$new('456'));
            //===>或者
            // var result = this.sub(str, Java.use('java.lang.String').$new('456'));

            console.log('str. str2, result =>', str, str2, result);

            //打印Java调用栈，下面其实就是将Android开发中获取调用栈的函数Log.getStackTraceString(Throwable e)翻译为JavaScript代码而已
            console.log(Java.use('android.util.Log').getStackTraceString(Java.use("java.lang.Throwable").$new()));
            return result;
        }
    })
}

setImmediate(main)
