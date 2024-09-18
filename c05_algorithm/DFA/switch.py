import re
str = "47f4e9aac5c7572927d88455d64bd64b"
result = re.findall(".{2}",str)
for item in result:
    print(item)