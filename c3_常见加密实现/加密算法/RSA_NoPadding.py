import base64
from Crypto.PublicKey import RSA
from Crypto.Cipher import PKCS1_v1_5
import rsa
import rsa.common
import rsa.transform
import rsa.core


def zfillStrToBin(content):
    """填充明文"""
    b_content = bytes(content.encode())
    fill_length = 128 - len(b_content)
    for i in range(fill_length):
        b_content += b'\0'
    # print(len(b_content))
    return b_content


# text = "hello"*23
text = "hello"
key_pair = RSA.generate(1024)
public_key = key_pair.public_key().export_key()
private_key = key_pair.export_key()

# 导入公钥，生成公钥对象
pk_obj = RSA.importKey(public_key)
# 导入公钥，生成公钥对象
sk_obj = RSA.importKey(private_key)

"""
# -----------------有公钥后就可以加密了----------------------------
"""
# 获取密钥长度(单位：字节数)
k_len = rsa.common.byte_size(pk_obj.n)  # n是一个非常大的整数
print("获取密钥的长度:", k_len)

# 填充后的明文
msg = zfillStrToBin(text)
print("填充后的明文:", msg)
print("\n")

# 处理明文
_b = rsa.transform.bytes2int(msg)
print("_b:", _b)
print("\n")
# 得到密文
encrypted_int = rsa.core.encrypt_int(_b, pk_obj.e, pk_obj.n)
encrypted_text = rsa.transform.int2bytes(encrypted_int, k_len)
print("encrypted_text:", encrypted_text)
print("len result:", len(encrypted_text))
print("\n")

# 解密密文
decrypted_int = rsa.core.decrypt_int(encrypted_int, sk_obj.d, sk_obj.n)
# decrypted_text = rsa.transform.int2bytes(decrypted_int, k_len)
# print(decrypted_text.decode('big-endian'))
