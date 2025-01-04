import os
# cwd pwd
os.chdir(os.path.dirname(os.path.abspath(__file__)))

# 取出所有title并写入到一个新文件中r4.txt
import bibtexparser

def read_file(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        return f.read()

def write_file(file_path, content):
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)

def main():
    # 读取并解析 BibTeX 文件
    with open('reference_check.bib', 'r', encoding='utf-8') as f:
        bib = bibtexparser.load(f)
    
    r4 = ''
    for entry in bib.entries:
        r4 += entry.get('title', '') + '\n'
    write_file('r4.txt', r4)

if __name__ == '__main__':
    main()