import base64

from Crypto.Cipher import AES
from Crypto.Util.Padding import pad, unpad

# key = 'u9J7AT8bC/nicT0='.encode("utf8")
# iv = "6di50aH901duea7d".encode()
# mode = AES.MODE_CBC

key = "r*Dj&Xs-{4%Tc!w/".encode("utf8")
iv = "0102030405060708".encode()
mode = AES.MODE_CBC


# 对密文进行解密
def aes_decrypt(encrypted_str: str):
    encrypt_content = base64.b64decode(encrypted_str)
    cipher = AES.new(key, mode, iv=iv)  # 生成AES对象
    decrypted_bytes = cipher.decrypt(encrypt_content)
    decrypted_content_bytes = unpad(decrypted_bytes, AES.block_size)
    return decrypted_content_bytes.decode('raw_unicode_escape').strip()


def aes_encrypt(content: str):
    cipher = AES.new(key, AES.MODE_CBC, iv)  # 生成AES对象
    encrypted = cipher.encrypt(pad(content.encode('utf-8'), AES.block_size))
    encoded_encrypted = base64.b64encode(encrypted).decode('utf-8')
    return encoded_encrypted


if __name__ == '__main__':
    # encrypted_content = "l5bTrnxptUY5Iil+WiCcgUWfywjVp90Quus4HVVpKI2+uNtcnoZcw5Uq1LqSwIlRUTxJ5ofWCUEQcCd1GDSwrJPugrd7OPjaRE6x+qnDD5M="
    encrypted_content = "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"
    print("密文:", encrypted_content)
    print(len(encrypted_content))

    # 解密
    decrypted_content = aes_decrypt(encrypted_content)
    print("解密:", decrypted_content)
    print(len(decrypted_content))

    # 加密
    mingwen = '{"deviceInfo":{"timestamp":1697906312,"fpVersion":"6.8.0","platform":"android","ssid":"","bssid":"","rssi":-35,"link_speed":-1,"gateway":0,"netmask":0,"ip_add":"","wifiable":1,"dns2":"","dns1":"","bluetoothAddress":"","bluetoothName":"","netOperator":"","cellId":-1,"wifiList":"[]","local_ip":"192.168.137.88","networkType":"wifi","w_m_a":"40:4e:36:b1:63:16","sm":"","timeZone":"Asia\\/Shanghai","language":"zh","package_name":"com.jingdong.app.mall","appName":"京东","client_version":98704,"versionName":"11.6.4","sig_hash":1048155532,"resolution":"2392*1440","dpi":560,"p_model":"Pixel XL","p_brand":"google","p_device":"marlin","p_manuf":"Google","p_name":"marlin","p_cpuabi":"arm64-v8a","hardware":"marlin","sdk_version":27,"system_version":"8.1.0","romSize":114604,"imei":"","serialno":"","android_id":"c738d63541a96b8d","mac":"40:4e:36:b1:63:16","realResolution":"2560*1440","fingerprints":"google\\/marlin\\/marlin:8.1.0\\/OPM1.171019.012\\/4470837:user\\/release-keys","romSurplus":"0.961","fontScale":"1.0","userAgent":"","fontListMd5":"e73efe6fba669366c5b09c47a95defa8","wallpaper":"","appListMd5":"","appListPart":"","fingerprintFromJni":"google\\/marlin\\/marlin:8.1.0\\/OPM1.171019.012\\/4470837:user\\/release-keys","modelFromJni":"Pixel XL","permission":"00000111","emulator":{},"brightness":82,"brightnessMode":1,"oaid":"","dk":"{\\"code\\":\\"0000000\\",\\"des\\":\\"\\"}","hook":{},"root":1,"firstApp1":"","firstApp2":"","appList":"","fingerprintCustom":"google\\/marlin\\/marlin:8.1.0\\/OPM1.171019.012\\/4470837:user\\/release-keys","mediaDrmProp":"NDA0RTM2QjE2MzE2AAAAAAAAAAAAAAAAAAAAAAAAAAA=\\n","dnStat":"Access: 2023-09-22 10:18:04.710067473,Access: 1970-12-12 02:55:53.100000009,Access: 2023-10-18 18:14:33.093086786,Access: 2023-09-22 10:20:31.930082139","commonId":"1158E29368F287BDC8B6743441A7193F852ADAAB75"},"localEid":"eidAfc4541226dl5445e322f1a7ddac615b47a9422de60c66cf8b7e1BbKunoGTabUfSuIq1VkcfnlyWF3+p\\/f8kH5OUEcz8Hox2dhNOrw9S7KwNzkc"}'
    miwen = aes_encrypt(mingwen)
    print("密文:", miwen)
    print(len(miwen))
