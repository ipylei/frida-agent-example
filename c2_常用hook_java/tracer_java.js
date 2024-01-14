//获取对象的所有信息
function inspectObject(obj) {
    Java.perform(function () {
        //const Class = Java.use("java.lang.Class");
        //const obj_class = Java.cast(obj.getClass(), Class); //this指向实例时
        //const obj_class = obj.getClass(); //this指向实例时
        //const obj_class = obj.class; //this指向类时

        //console.log("===>", obj.$super.toString());
        //console.log("===>", obj.class.getName());

        let obj_class;
        let isInstance;
        let typeName = obj.$super.toString(); //类的.$super为java.lang.Object对象，实例的.$super为当前类对象
        let className = obj.class.getName(); //获取当前类名
        //说明是一个实例
        if (typeName.indexOf(className) > -1) {
            obj_class = obj.getClass();
            isInstance = true;
            console.log("当前是一个实例");
        } else {
            obj_class = obj.class;
            isInstance = false;
            console.log("当前是一个类");
        }

        const fields = obj_class.getDeclaredFields();
        console.log("====> Fields:", fields.length);
        for (let field of fields) {
            let isStaticMethod = field.toString().indexOf("static ") > -1;
            if ((isStaticMethod && !isInstance) || isInstance) {
                let fieldName = field.toString().split(className.concat(".")).pop();
                let fieldValue = obj[fieldName].value
                console.log("==>field name, value, type=>", fieldName, fieldValue, fieldValue.$className);
            }
        }

        //const methods = obj_class.getMethods();
        // console.log("\tMethods:");
        // for (var i in methods)
        //     console.log("\t\t" + methods[i].toString());
    })
}


function testClass() {
    Java.perform(function () {
        let SimpleClass = Java.use("com.example.httpset2.SimpleClass");
        console.log("找到类了!");
        inspectObject(SimpleClass);
    })
}

function testInstance() {
    Java.perform(function () {
        Java.choose("com.example.httpset2.SimpleClass", {
            onMatch: function (instance) {
                console.log("找到实例了!");
                inspectObject(instance);
            },
            onComplete: function () {
            }
        })
    })
}