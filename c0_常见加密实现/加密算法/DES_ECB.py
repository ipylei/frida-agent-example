from Crypto.Cipher import DES  # # pip install pycryptodome
import codecs
import sys


def des_encrypt(key, plaintext):
    key = key.encode('utf-8')
    plaintext = plaintext.encode('utf-8')
    # 填充明文
    length = 8 - (len(plaintext) % 8)
    plaintext += bytes([length]) * length
    # 初始化加密器
    cipher = DES.new(key, DES.MODE_ECB)
    # 加密
    ciphertext = cipher.encrypt(plaintext)
    return ciphertext


def des_decrypt(key, ciphertext):
    key = key.encode('utf-8')
    # 初始化解密器
    cipher = DES.new(key, DES.MODE_ECB)
    # 解密
    plaintext = cipher.decrypt(ciphertext)
    # 去除填充
    plaintext = plaintext[:-plaintext[-1]]
    return plaintext.decode('utf-8')


def m(bArr):
    if bArr is None:
        return ""
    cArr = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'A', 'B', 'C', 'D', 'E', 'F']
    length = len(bArr)
    if length <= 0:
        return ""
    cArr2 = [0] * (length << 1)
    i = 0
    for i2 in range(length):
        i3 = i + 1
        cArr2[i] = cArr[(bArr[i2] >> 4) & 15]
        i = i3 + 1
        cArr2[i3] = cArr[bArr[i2] & 15]
    return ''.join([str(item) for item in cArr2])


def encrypt(plainText, key):
    secretKey = key.encode('utf-8')
    cipher = DES.new(secretKey, DES.MODE_ECB)
    return cipher.encrypt(plainText.encode('utf-8'))


# # 测试
# key = 'abcdefgh'
# plaintext = 'hello world!'

key = 'shihuo01'
plaintext = 'c97b6d788e49a8ad'  # pixel
# plaintext = 'c97b6d788e49a8aa'
# plaintext = 'c97b6d777e49a8mm'

ciphertext = des_encrypt(key, plaintext)
print('加密结果：', ciphertext)
print(len(list(ciphertext)))
print(list(ciphertext))

# ret = encrypt(plaintext, key)
bytes_python = list(des_encrypt(key, plaintext))
print(bytes_python)

# 大于128的转换成有符号[0~256) -> [-128, 128)
bytes_java = [(b - 255 - 1) if b >= 128 else b for b in bytes_python]
print(bytes_java)

# ml = [-48, 86, -73, -36, -58, -74, 72, -3, 71, 77, 32, 35, 25, -116, 60, -92, 13, 39, 81, -9, -101, -115, -96, -86]
# nl = [-48, 86, -73, -36, -58, -74, 72, -3, 3, 36, -124, -65, -59, 116, -58, 81, 13, 39, 81, -9, -101, -115, -96, -86]
sh_dv_sign = m(bytes_java).lower()
print(sh_dv_sign)

# [208, 86, 183, 220, 198, 182, 72, 253, 3, 36, 132, 191, 197, 116, 198, 81]

