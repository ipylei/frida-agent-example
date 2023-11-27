function  main(){
    console.log("Script loaded successfully");
    Java.perform(function () {
        console.log("Inside java perform function");
        var MainActivity = Java.use("com.example.ipylei.demo02/MainActivity");
        console.log("Java.Use.Successfully!");

        //Hook重载函数
        MainActivity.fun.overload('int', 'int').implementation = function (x, y){
           console.log("x => ", x, " y=> ", y);
            var ret_value = this.fun(2, 5);
            return ret_value;
        }

        MainActivity.fun.overload('java.lang.String').implementation = function (str){
           console.log("str", str);
            var ret_value = this.fun("Hello world 方法已被成功hook!");
            return ret_value;
        }
    })
}


setImmediate(main)



