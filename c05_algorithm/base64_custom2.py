import base64

# 自定义的 Base64 编码表
CUSTOM_BASE64_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_'


# 编码函数
def custom_base64_encode(data):
    # 使用标准 Base64 编码
    standard_base64_encoded = base64.b64encode(data).decode('utf-8')

    # 替换字符以匹配自定义编码表
    return standard_base64_encoded.replace('+', '-').replace('/', '_')


# 解码函数
def custom_base64_decode(encoded_str):
    # 替换字符回到标准 Base64 编码表
    standard_base64_str = encoded_str.replace('-', '+').replace('_', '/')

    # 进行解码
    return base64.b64decode(standard_base64_str)


# 测试编码和解码
original_data = b'Hello World!'
encoded = custom_base64_encode(original_data)
print(f'Encoded: {encoded}')

decoded = custom_base64_decode(encoded)
print(f'Decoded: {decoded.decode("utf-8")}')