# 读取r5.json文件，去掉最后一个元素，然后检测是否所有的value都有&符号，如果有，就写入r6.json

import os
import re
import json

def read_file(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        return f.read()
    
def write_file(file_path, content):
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)

def main():
    r5 = json.loads(read_file('r5.json'))
    r6 = {}
    for key, item in r5.items():
        item.pop()
        for line in item:
            if '&' not in line:
                break
        else:
            r6[key] = item
    with open('r6.json', 'w', encoding='utf-8') as f:
        json.dump(r6, f, ensure_ascii=False, indent=4)

if __name__ == '__main__':
    main()