frida使用文章：https://blog.51cto.com/csnd/5956777
roysue(安全客)：https://www.anquanke.com/member.html?memberId=131652

hook_android_encrypt.js：hook Android中自带的加密函数
hook_android_intent.js：hook Android Intent类
hook_android_SharedPreference.js：hook Android文件相关类
hook_android_Bitmap.js：hook Android图片相关
hook_android_onClick.js：hook Android 点击事件

query_查询某接口的实现类.js
hook_class.js：hook一个类的所有方法
hook_thead.js ===> hook java线程
hook_non_ascii_func.js：hook不可打印的方法

hook_okhttp3_chains.js：hook okhttp3打印出拦截器

print_打印行号.js
print_msg.js
bypass_绕过root检测.js

let currentApplication = Java.use("android.app.ActivityThread").currentApplication();
let context = currentApplication.getApplicationContext();
