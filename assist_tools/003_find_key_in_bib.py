# 读取r7.txt文件，看其中的关键词有没有在reference.bib里出现（大小写不论），如果没有就写入到r8.txt中

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
    with open('r7.txt', 'r', encoding='utf-8') as f:
        r7 = f.read()
    with open('reference.bib', 'r', encoding='utf-8') as f:
        bib = f.read()
    r8 = ''
    for line in r7.split('\n'):
        if not re.search(line, bib, flags=re.IGNORECASE):
            # 去重
            if line in r8:
                continue
            r8 += line + '\n'
    write_file('r8.txt', r8)

if __name__ == '__main__':
    main()