'''
该脚本用于从BibTeX文件中提取所有的引用ID，并将这些ID保存到一个文本文件中。

input: BibTeX文件
output: 001_cite_id.txt

主要功能包括：
1. 读取并解析BibTeX文件。
2. 从解析后的BibTeX数据中提取所有的引用ID。
3. 将提取到的引用ID保存到一个指定的文本文件中。

使用方法：
1. 修改脚本中的bibtex_file和output_file变量，指定BibTeX文件和输出文件的位置。
2. 运行脚本，它将自动完成上述功能。
'''

import bibtexparser
from pathlib import Path

def read_bibtex(file_path):
    """
    读取并解析 BibTeX 文件。
    
    :param file_path: BibTeX 文件的路径
    :return: 解析后的 BibTeX 数据
    """
    with open(file_path, 'r', encoding='utf-8') as file:
        return bibtexparser.load(file)

def extract_cite_ids(bib_data):
    """
    从 BibTeX 数据中提取所有的 cite ID。
    
    :param bib_data: 解析后的 BibTeX 数据
    :return: 包含所有 cite ID 的字符串，每个 ID 占一行
    """
    return '\n'.join(entry['ID'] for entry in bib_data.entries)

def save_to_file(content, output_path):
    """
    将内容保存到指定文件。
    
    :param content: 要保存的内容
    :param output_path: 输出文件的路径
    """
    with open(output_path, 'w', encoding='utf-8') as file:
        file.write(content)

def main(bibtex_path, output_path):
    """
    主函数，读取 BibTeX 文件，提取 cite ID 并保存到文件。
    
    :param bibtex_path: BibTeX 文件的路径
    :param output_path: 输出文件的路径
    """
    bib_data = read_bibtex(bibtex_path)
    cite_ids = extract_cite_ids(bib_data)
    save_to_file(cite_ids, output_path)

if __name__ == '__main__':
    # 用户可以通过修改这里的路径来指定 BibTeX 文件和输出文件的位置
    bibtex_file = Path('reference.bib')
    output_file = Path('001_cite_id.txt')
    main(bibtex_file, output_file)