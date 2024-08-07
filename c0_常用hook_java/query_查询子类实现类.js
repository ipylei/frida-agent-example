//遍历内存中所有的类，筛选出类：该类的父类是目标类
function search_sub_class(target_class, package_name = "") {
    var all_target_class = new Set();
    Java.enumerateLoadedClasses({
        onComplete: function () {
        },

        onMatch: function (name, owner) {
            if (package_name && name.indexOf(package_name) < 0) {
                return;
            }
            var valid_class_list = [];
            try {
                var currentCls = Java.use(name);
                var parentClass;
                var parentClassName;
                while (true) {
                    // 遍历类实现的接口
                    let class_name = currentCls.$className;
                    valid_class_list.push(class_name);

                    // 继续去父类找
                    parentClass = currentCls.$super;
                    parentClassName = parentClass.$className;
                    if (parentClassName.indexOf(target_class) > -1) {
                        valid_class_list.push(parentClassName);
                        for (let valid_class of valid_class_list) {
                            all_target_class.add(valid_class);
                        }
                        break;
                    }
                    if (parentClassName === "java.lang.Object") {
                        break;
                    }

                    //进入下一轮循环
                    currentCls = parentClass;
                }
            } catch (e) {
                // console.error(e.message);
            }

        }
    });

    console.log("结束, 结果如下 =======>");
    for (let item of all_target_class.values()) {
        console.log(item);
    }

}

//遍历内存中所有的类，过滤出实现目标接口的类
function search_implementation_class(target_interface, package_name = "") {
    var all_target_class = new Set();
    Java.enumerateLoadedClasses({
        onComplete: function () {
        },

        onMatch: function (name, owner) {
            if (package_name && name.indexOf(package_name) < 0) {
                return;
            }
            var valid_class_list = [];
            try {
                var currentCls = Java.use(name);
                var parentClass;
                var status = false;
                while (true) {
                    // 遍历类实现的接口
                    let class_name = currentCls.$className;
                    valid_class_list.push(class_name);

                    let interfaceList = currentCls.class.getInterfaces();
                    for (let s_interface of interfaceList) {
                        var interface_name = s_interface.toString();
                        if (interface_name.indexOf(target_interface) > -1) {
                            console.log(`找到目标接口的实现类, 接口名:${interface_name}, 类名:${class_name}`);
                            status = true;
                            break;
                        }
                    }
                    // 继续去父类找
                    parentClass = currentCls.$super;
                    if (parentClass.$className === "java.lang.Object") {
                        if (status) {
                            for (let valid_class of valid_class_list) {
                                all_target_class.add(valid_class);
                            }
                        }
                        break;
                    }

                    //进入下一轮循环
                    currentCls = parentClass;
                }
            } catch (e) {
                // console.error(e.message);
            }

        }
    });

    console.log("结束, 结果如下 =======>");
    for (let item of all_target_class.values()) {
        console.log(item);
    }

}


function main() {
    search_sub_class("OpenSSLSocketImpl");
    search_implementation_class("X509TrustManager");
}

// setImmediate(hook2)