function searchInterface() {
    Java.perform(function () {
            Java.enumerateLoadedClasses({
                onComplete: function () {
                },

                onMatch: function (name, handle) {
                    //TODO 按包名过滤类
                    let packageName = "com.hexl.lessontest.logic";
                    if (name.indexOf(packageName) > -1) {
                        // TODO 目标接口
                        var targetInterface = "com.hexl.lessontest.logic.IAnima";
                        if (targetInterface === name) {
                            return;
                        }
                        console.log("find class");
                        var targetClass = Java.use(name);
                        console.log("当前类: ", name);


                        var superClassName;
                        //向上递归遍历类实现的接口、其父类实现的接口
                        while (1) {
                            // if (targetClassName.indexOf(packageName) > -1) {
                            //     //找到其他包、或者说其他应用里面去了
                            //     break
                            // }

                            //遍历类实现的接口
                            var interfaceList = targetClass.class.getInterfaces();
                            if (interfaceList.length > 0) {
                                for (var i in interfaceList) {
                                    var interString = interfaceList[i].toString();
                                    //如果该接口包含目标接口，则打印出来
                                    if (interString.indexOf(targetInterface) > -1) {
                                        console.log("\t目标接口: ", interString); //
                                        break;
                                    }
                                }
                            }

                            //继续去找父类
                            superClassName = targetClass.$super.$className;
                            console.log("\t父类: ", superClassName) // 打印类名
                            if (superClassName === "java.lang.Object") {
                                break;
                            }

                            //下一轮循环
                            targetClass = targetClass.$super;
                        }
                    }
                }
            })
        }
    )
}

setImmediate(searchInterface)