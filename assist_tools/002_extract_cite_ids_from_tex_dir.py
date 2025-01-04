'''
从tex中找所有的cite{}，读取r.txt，将不存在与r.txt的写入r0.txt，并去重

input: tex文件夹
output: 002_cite_id_from_tex.txt
'''

import os
import re
from pathlib import Path  # 引入pathlib模块

def read_file(file_path):
    """读取文件内容"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            return f.read()
    except FileNotFoundError:
        print(f"文件未找到: {file_path}")
    except PermissionError:
        print(f"没有权限读取文件: {file_path}")
    except UnicodeDecodeError:
        print(f"文件编码不是UTF-8: {file_path}")
    except Exception as e:
        print(f"读取文件时发生错误: {e}")
    return ''


def write_file(file_path, content):
    """将内容写入文件"""
    try:
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)
    except IOError as e:
        print(f"写入文件时发生错误: {e}")


def find_cite(file_path):
    """从tex文件中查找所有的cite{}引用"""
    return re.findall(r'\\cite\{(.+?)\}', read_file(file_path))

def main():
    # 初始化一个空字符串用于存储所有找到的引用
    all_cites = ''
    
    # 使用pathlib遍历指定目录下的所有.tex文件
    tex_files = Path('tex').rglob('*.tex')  # rglob递归地查找所有匹配的文件
    for file in tex_files:
        all_cites += '\n'.join(find_cite(str(file))) + '\n'
    
    # 读取参考文献列表
    references = read_file('001_cite_id.txt').splitlines()

    # 有才去重
    if len(references) != 0:
        # 处理找到的引用，替换逗号为换行符，去除空格，并分割成列表
        all_cites = all_cites.replace(',', '\n').replace(' ', '')
        all_cites_list = all_cites.split('\n')
        
        # 找出不在参考文献列表中的引用，并去重
        references = list(set(filter(lambda x: x not in references, all_cites_list)))

    # 将新的引用写入文件
    write_file('002_cite_id_from_tex.txt', '\n'.join(references))

if __name__ == '__main__':
    main()