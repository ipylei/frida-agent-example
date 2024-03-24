import os
import time

import requests
from Crypto.Cipher import AES

from proxy_2 import AEScryptor

os.environ['no_proxy'] = '*'

# 2022/10/25 添加的白名单(192.168.50.126, 192.168.50.224)
# tmp_ip = "47.94.22.225"

# tmp_ip = "222.209.157.254"
# tmp_ip = "171.221.146.98"
# tmp_ip = "171.221.149.59"

# tmp_ip = "47.94.22.225"  # product
tmp_ip = "118.114.58.155"  # home
# tmp_ip = "218.88.68.101"  # company

mode = 1

# 用户账号
user_account = "18600345770"
# 用户ID
user_id = "67NOOPHQ8FO"
# 用户登录密码:
pwd = "pw93304843"
# 用户签名密钥
secret_key = "rq63fl28db8hp9kq"

# no = "20220602405281356674"  # 套餐编号
# no_key = "cpaekb1ph9m0lo"  # 套餐提取密钥

no = "20221125179635675067"
no_key = "jtfoul4237c4bv"

# 1.添加白名单 # 响应：{"code": xxx,"data":xxx,"status":200,"message":"xxxx"} 其中code为数字“0”表示操作成功
data = f"{pwd}:{no_key}:{int(time.time() * 1000) / 1000}"
# data = f"{pwd}:{no_key}:{1666859315.166}"
add_url = "https://service.ipzan.com/whiteList-add"

key = secret_key.encode()
aes = AEScryptor(key, AES.MODE_ECB, paddingMode="PKCS7Padding", characterSet='utf-8')
sign = aes.encryptFromString(data).toHexStr()
print("--->", sign)

add_params = {
    "no": no,  # 套餐购买编号
    "sign": sign,
    # "登录密码:套餐提取密钥:linux时间戳"
    "ip": tmp_ip
}
if mode == 1:
    response = requests.get(url=add_url, params=add_params).text
    print(response)

# 2.删除白名单 # 响应：{"code": xxx,"data":xxx,"status":200,"message":"xxxx"} 其中code为数字“0”表示操作成功
del_url = "https://service.ipzan.com/whiteList-del"
del_params = {
    "ip": tmp_ip,
    "userId": user_id,  # 用户id
    "no": no  # 套餐购买编号
}
if mode == 2:
    del_response = requests.get(url=del_url, params=del_params).text
    print(del_response)

# 3.白名单列表
# url = f"https://service.ipzan.com/whiteList-get?no=20220602405281356674&userId=67NOOPHQ8FO"
# https://service.ipzan.com/whiteList-get?no=20221125179635675067&userId=67NOOPHQ8FO
