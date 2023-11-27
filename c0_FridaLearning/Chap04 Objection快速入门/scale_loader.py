# -*- coding: utf-8 -*-

import frida, sys


def on_message(message, data):
    if message['type'] == 'send':
        print("=====>, [*] {0}".format(message['payload']))
    else:
        print("输出:", message)


# 相当于frida -U
device = frida.get_usb_device(timeout=3)  # 获取到USB设备句柄

# device = frida.get_device_manager().add_remote_device("10.0.2.15:8099")

# 挂载进程(或者说找到进程名)
process = device.attach("com.example.junior")

with open('scale_call.js', encoding='utf-8') as f:
    jscode = f.read()

# 加载js代码
script = process.create_script(jscode)

# 注册消息对应的函数， 每当js想要输出时都会经过这里指定的on_message进行
# (rpc_hook.js中的console.log()直接在屏幕上能看到)
script.on('message', on_message)

# 【*】调用load方法注入脚本
script.load()

for i in range(20, 30):
    for j in range(0, 10):
        script.exports.sub(str(i), str(j))
