/*
    抓包常见阻碍，及解决方法

    其他分析工具：
        find_url.js   ===> 根据url打印调用栈
*/


vpn检测：
    hook_vpn.js


c校验s：
    (*) pinning_DroidSSLUnpinning.js  # https://github.com/WooyunDota/DroidSSLUnpinning
    (*) pinning_multi_unpinning.js
    (*) pinning_just_trust_me_frida.js    【来自hooker项目】
    (*) 修改HTTPS(find_url.js)
            原理：frida hook将HTTPS修改为HTTP躲过证书验证，再使用charles建立映射规则将HTTP改回为https。

    okhttp：
        pinning_hook_okhttp3.js(推荐度一般) TODO (不必配合抓包工具，单纯hook查看内容，然后进行调用栈分析)
    okhttp混淆：
        pinning_just_trust_me_okhttp_hook_finder.js 【来自hooker项目】  (radar.dex)(找到混淆的类后，再使用pinning_hook_okhttp3.js)
        OkHttpLogger-Frida (https://github.com/siyujie/OkHttpLogger-Frida)

    TODO 以上还不行的话就Hook File函数，因为客户端一定会加载证书，由此一定会定位到证书绑定的代码位置。


s校验c：
    (*) cert_tracer_keystore.js
    (*) cert_keystore_dump.js    【来自hooker项目】
    (*) r0capture中keystore相关  (https://github.com/r0ysue/r0capture)
    (*) hook_android_Cert


hook原生系统底层：TODO (不必配合抓包工具，单纯hook查看内容，然后进行调用栈分析)
    all_in_one.js


其他情况：
    (*)webview
        hook java层无效， hook tcp_udp有效

    (*)自定义ssl类库解决方案：
        *)若是flutter框架，则hook_flutter.js
        *)其他则：枚举类、枚举so符号、hook验证


网络框架要存在协议模式切换的机制
    iptables -A INPUT -s ***.**.***.181 -j DROP #屏蔽
    iptables -D INPUT -s ***.**.***.181 -j DROP #解除屏蔽


# ----------------------------------------------------------------------------------------------------------------------
# ----------------------------------------------------------------------------------------------------------------------
拓展了解[防御篇]：小菜花：https://bbs.pediy.com/user-home-844301.htm
    底层直接调用库函数：sendto/recvfrom函数                                         (all_in_one.js能hook到)
        使用库函数syscall + sendto/recvfrom调用号                                 (hook 库函数syscall)
           自实现内联汇编sendto/recvfrom(即,使用汇编实现这2个库函数)                   (内存扫描+inline hook)、(ptrace[seccomp过滤] + PTRACE_SYSCALL)
           自实现内联汇编syscall + sendto/recvfrom调用号(即,使用汇编实现库函数syscall)

[-]
[+]

【抓包阻碍大致解决流程】：
vpn检测：hook_vpn.js
    c校验s：
      github项目：pinning_DroidSSLUnpinning.js、pinning_multi_unpinning.js、pinning_just_trust_me_frida.js
      综合：pinning_SSLUnPinning.js
      暴力：pinning_SSLUnPinning2.js
      通用：pinning_hook_File.js

      (针对)：okhttp：pinning_hook_okhttp3.js(推荐度一般)
      (针对)：okhttp混淆：pinning_just_trust_me_okhttp_hook_finder.js、OkHttpLogger-Frida
      (备用)：单步调试frida：https://bbs.kanxue.com/thread-265160.htm
           cert_20201128capture.js【通过hook不让进程被kill从而过掉校验服务端证书，缺点:正常kill进程的逻辑也失效了。】


    s校验c： [r0capture中keystore相关]：cert_saveClientCer.js、cert_saveClientCer2.js、cert_savePrivateKey.js
                              [其他]：cert_hook_android_Cert、cert_keystore_dump.js、cert_tracer_keystore.js
        原生系统底层：lesson7_all_in_one.js
            其他情况：( 针对于拓展了解[防御篇] )：
                hook syscall
                内存扫描+inline hook
                ptrace(seccomp过滤) + PTRACE_SYSCALL
                源码级内核模块开发


【抓包经验】：
    若开启wifi代理抓包根本没数据而APP又是正常的，则大概率不走代理。
    若开启VPN抓包APP就无响应，关掉VPN又正常，则大概率是VPN检测。(过程：还未发包、请求还未建立就已经结束了)
    若开启VPN抓包charles很多红叉(unknown)，则大概率是客户端校验服务端证书。 (需要使用frida等过掉) (过程：证书交换)
        如果常用脚本都定位不到校验位置，还可以尝试如下方法：
            方案一:
                1.在内存中枚举出所有类，(必要时看User-Agent是否使用某个框架)
                2.然后找到含"HTTP"相关字符串的类，确定其框架，然后继续找hook点，因为怎样都会用到系统底层框架，所以一定可行。
                3.若没有明显特征则全部hook上，然后看哪些被调用后，打出调用栈继续往上找

            方案二：
                hook File相关函数，因为总会打开证书文件
    若开始VPN抓包charles显示no SSL certificate was sent等字样，则大概率是服务端校验客户端。 (过程：证书交换)
