import base64
from Crypto.PublicKey import RSA
from Crypto.Cipher import PKCS1_v1_5
import rsa

# text = "hello"*23
text = "hello"

key_pair = RSA.generate(1024)
print(key_pair)
print('type key', type(key_pair))
print('n:', key_pair.n)
print('e:', key_pair.e)
print('d:', key_pair.d)
print("\n")

# 导出公钥
public_key = key_pair.public_key().export_key()
print('public key: ', public_key)
print('len:  ', len(public_key))

# 导出私钥
private_key = key_pair.export_key()
print('private_key: ', private_key)
print('len: ', len(private_key))
print("\n")

# with open("cer.pem", "wb") as f:
#     f.write(public_key)

# with open("cer.pem", "rb") as f:
#     content = f.read()
#     print(content)

# 1.导入公钥，生成公钥对象
pk_obj = RSA.importKey(public_key)
print('type pk_obj', type(pk_obj))
print("pk-n: ", pk_obj.n)
print("pk-e: ", pk_obj.e)
# print("pk-d: ", pk_obj.d)  # 报错，无法获取

# 2.导入私钥，生成私钥对象
sk_obj = RSA.importKey(private_key)
print('type sk_obj', type(sk_obj))
print("sk-n: ", sk_obj.n)
print("sk-e: ", sk_obj.e)
print("sk-d: ", sk_obj.d)
print("\n")

# 使用PKCS1填充
cipher = PKCS1_v1_5.new(pk_obj)
# 使用公钥加密
encrypted = cipher.encrypt(text.encode())
print("加密后: ", encrypted)
print(len(encrypted))

# 使用PKCS1填充
cipher2 = PKCS1_v1_5.new(sk_obj)
# 使用私钥解密
decrypted = cipher2.decrypt(encrypted, None).decode(encoding='utf-8')
print("解密后: ",  decrypted)
print(len(decrypted))
