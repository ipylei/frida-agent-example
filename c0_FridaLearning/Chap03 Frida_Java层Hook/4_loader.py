# -*- coding: utf-8 -*-

import frida, sys


def on_message(message, data):
    print(message, data)
    if message['type'] == 'send':
        print("ddddddddddddd, [*] {0}".format(message['payload']))
    else:
        print("输出dddddddddddd:", message)


# 若frida是通过USB进行监听，相当于frida -U
# 缺点：即使有多个手机，但由于电脑接口的数量限制，所以无法大量部署。


# manager = frida.get_device_manager()
# device = frida.get_remote_device()  # 不知名的用法

device = frida.get_usb_device(timeout=3)  # 获取到USB设备句柄

# 若frida是通过网络模式进行监听，如：./frida-server -l 0.0.0.0:1337
# 优点：有多个手机，每个手机都开启frida，然后每个python进程连接一个手机即可。
# device = frida.get_device_manager().add_remote_device("192.168.50.129:1337")


# 挂载进程(或者说找到进程名)
process = device.attach("com.example.ipylei.myapplication")

"""
# attach模式
# 挂载进程(或者说找到进程名)
# process = device.attach("com.jingdong.app.mall")

# spawn模式
pid = device.spawn(['com.jingdong.app.mall'])  # 启动一个进程，返回进程id，此时进程处于阻塞状态。
process = device.attach(pid) # 在进程还处于阻塞状态时，附加(挂载)到目标进程中。
script.load()
time.sleep(2)
device.resume(pid) # 由于此时进程还处于阻塞状态，通过该命令让应用恢复执行。 
time.sleep(10)


TODO 所以这个.resume()执行时机还是比较重要：
1.在script.load()之后执行 ===> 先.load()将脚本注入到进程中，然后.resume()恢复执行  (晚点恢复执行，能hook更多，比如证书加载等)
2.在device.attach(pid)之后执行 ===> 先.resume()恢复执行，然后.load()将脚本注入到进程中  (早点恢复执行，有些比较隐蔽的就hook不到了)
"""

with open('4_rpc_hook.js', encoding='utf-8') as f:
    jscode = f.read()

# 加载js代码，返回一个对象。
script = process.create_script(jscode)

# 注册消息对应的函数, 每当js想要输出时都会经过这里指定的on_message进行
# (rpc_hook.js中的console.log()直接在屏幕上能看到)
script.on('message', on_message)

# 【*】调用load方法注入脚本 => (将js代码推送至APP内存中?)
script.load()

# device.resume(pid) # 可以在这里恢复启动

command = ""
while True:
    command = input("\nEnter command:\n  1:Exit\n  2:Call secret function\n  3:Get Total Value\n choice:")
    if command == "1":
        break
    elif command == "2":  # 在这里调用
        script.exports.callsecretfunc()
    elif command == "3":
        script.exports.gettotalvalue()
