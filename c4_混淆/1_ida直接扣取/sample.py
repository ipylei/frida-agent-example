import ctypes

# 加载静态库
mylib = ctypes.cdll.LoadLibrary('./libcheck.dll')

"""
# 定义函数参数类型和返回类型
mylib.add.argtypes = (ctypes.c_int, ctypes.c_int)
mylib.add.restype = ctypes.c_int

# 调用函数
result = mylib.add(1, 2)
print(result)
"""


"""
# 定义函数参数类型和返回类型
mylib.uuid_checksum.argtypes = (ctypes.c_void_p, ctypes.c_int)
mylib.uuid_checksum.restype = ctypes.c_char_p
# 调用函数
arg1 = "fAUEDBFl0vVfqcfUC29NZSebqyguUUrm1uO1"
arg2 = len(arg1)
ret = mylib.uuid_checksum(arg1, arg2)

print(ctypes.cast(ret, ctypes.c_char_p).value.decode('utf-8'))
# """


# """
mylib.uuid_checksum.argtypes = (ctypes.POINTER(ctypes.c_ubyte), ctypes.c_int)
mylib.uuid_checksum.restype = ctypes.c_char_p

# 准备参数
arg1 = "fAUEDBFl0vVfqcfUC29NZSebqyguUUrm1uO1".encode('utf-8')  # 转换为字节串
arg2 = len(arg1)
print(arg2)

# ctypes.c_ubyte * len(arg1)：创建一个 ctypes 数组类型来保存字节数据。
# (ctypes.c_ubyte * len(arg1))(*arg1)：将字节串传递给 ctypes 数组。
arg1_buffer = (ctypes.c_ubyte * len(arg1))(*arg1)

# arg1_buffer = ctypes.create_string_buffer(arg1)

# 调用函数
result = mylib.uuid_checksum(arg1_buffer, arg2)

# 处理结果
print(ctypes.cast(result, ctypes.c_char_p).value.decode('utf-8'))
# print(result)
# """
