import time

import requests
import urllib3

urllib3.disable_warnings()
import re
import subprocess

session = requests.Session()
headers = {
    'Accept': 'application/json, text/javascript, */*; q=0.01',
    'User-Agent': 'yuanrenxue.project',
    'Origin': 'https://match.yuanrenxue.com',
    'Referer': 'https://match.yuanrenxue.com',
    'Accept-Encoding': 'gzip, deflate, br',
    'Accept-Language': 'zh-CN,zh;q=0.9',
}

proxies = {
    'http': 'http://127.0.0.1:8888',
    'https': 'http://127.0.0.1:8888'
}

#  获取cookie
response = session.get('https://match.yuanrenxue.com/match/13', headers=headers, verify=False,
                       proxies=None, cookies={'sessionid': 'v49rtg7a39so1gok9oetrdoovi1y44sg'})
js_code = 'document={};location={};' + re.search('<script>(.*)</script>', response.text).group(
    1) + ';console.log(document.cookie)'
result = subprocess.check_output(['node', '-e', js_code])
_cookie = re.match('yuanrenxue_cookie=(.*);path=', result.decode()).group(1)

set_cookie = response.headers['Set-Cookie']
print(set_cookie)

cookies = {
    'sessionid': 'v49rtg7a39so1gok9oetrdoovi1y44sg',
    "yuanrenxue_cookie": _cookie
}
# headers["Cookie"] = set_cookie
# headers["Cookie"] = "sessionid=v49rtg7a39so1gok9oetrdoovi1y44sg"
print(headers)
for i in range(1, 6):
    params = {
        'page': i
    }
    response = requests.get('https://match.yuanrenxue.com/api/match/13', headers=headers, cookies=cookies, verify=False,
                            proxies=None, params=params)
    print("=>", response.text)
    time.sleep(1)

    response2 = requests.get('https://match.yuanrenxue.com/api/match/13', headers=headers, cookies=cookies, verify=False,
                            proxies=None, params=params)
    print("====>", response2.text)
