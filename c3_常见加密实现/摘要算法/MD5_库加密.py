# -*- coding: utf-8 -*-

import hashlib

# a = input('输入加密的字符:')  # python3为input
a = '123456'
b = hashlib.md5(a.encode(encoding='utf-8'))
# b = hashlib.md5()
# b.update(a.encode(encoding='utf-8'))
# print('MD5加密前：' + a)
print('MD5加密后：' + b.hexdigest())

c = hashlib.md5(a.encode(encoding='utf-8')).hexdigest()
# print('MD5加密前：' + a)
print('MD5加密后：' + c)
print(b.hexdigest() == c)

# b = hashlib.md5()
b.update(a.encode(encoding='utf-8'))
d = b.hexdigest()
print(d)

# 加盐(加盐是在用户密码加密后，可以再加一个指定的字符串，再次加密，这样，用户密码被破解的概率极低了)
# def my_md5(s, salt=''):  # 加盐，盐的默认值是空
#     s = s + salt
#     news = str(s).encode()  # 先变成bytes类型才能加密
#     m = hashlib.md5(news)  # 创建md5对象
#     return m.hexdigest()  # 获取加密后的字符串
