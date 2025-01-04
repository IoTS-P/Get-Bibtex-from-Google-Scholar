# 从tex中找所有的包含cite{}的一整行，写入r5.txt, 生成json文件

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
    r5 = ''
    # 读取r.txt作为key
    r = read_file('r.txt')
    r = r.split('\n')
    r.remove("")
    res = {}
    for key in r:
        res[key] = []
    for root, dirs, files in os.walk('tex'):
        for file in files:
            content = read_file(os.path.join(root, file))
            # 筛选出所有cite{}内的内容作为key，整行作为list value
            for line in content.split('\n'):
                for key in r:
                    if key in line:
                        res[key].append(line)
    # 记录一下长度到dict里面
    for key in res:
        res[key].append(len(res[key]))
    # 按照长度排序输出(升序)
    res = dict(sorted(res.items(), key=lambda x: x[1][-1], reverse=False))
    # 写入json文件
    with open('r5.json', 'w', encoding='utf-8') as f:
        json.dump(res, f, ensure_ascii=False, indent=4)

if __name__ == '__main__':
    main()