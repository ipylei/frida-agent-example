import base64

"""
# 字母 R 替换为 N
txt = "Runoob!"
mytable = txt.maketrans("R", "N")
print(txt.translate(mytable))

# 使用字符串设置要替换的字符，一一对应
intab = "aeiou"
outtab = "12345"
trantab = str.maketrans(intab, outtab)
print(trantab)

str1 = "this is string example....wow!!!"
ret = str1.translate(trantab)
print(ret)
print(type(ret))
"""

content = "async"
base64_content_1 = "YXN5bmM="
base64_content_2 = "yxn5BMm="


std_table = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/="
table = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789+/="

# print(base64.b64encode(content.encode()).decode())

trantab = str.maketrans(table, std_table)

# 编码
# 标准
# print(base64.b64encode(content.encode()).decode())
# 非标准 (先进行标准运算得到结果，再将结果进行字符替换)
retval = base64.b64encode(content.encode()).decode()
print(retval.translate(trantab))


# 解码
# 标准
# print(base64.b64decode(base64_content_1.encode()).decode())
# 非标准 (先将字符进行替换，再进行标准运算得到结果)
# s2 = base64_content_2.translate(trantab)
# print(base64.b64decode(s2.encode()).decode())


# 注：base64库只会使用标准的编码表，要想让它使用非标准的编码表，则
