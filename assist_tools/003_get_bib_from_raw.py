# 读取r0.txt，在reference_raw.bib中找到对应的cite key，将这个bib写到reference_check.bib中

import bibtexparser

def read_file(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        return f.read()
    
def write_file(file_path, content):
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)

def main():
    r0 = read_file('r0.txt')
    r0 = r0.split('\n')
    # 读取并解析 BibTeX 文件
    with open('reference_raw.bib', 'r', encoding='utf-8') as f:
        bib = bibtexparser.load(f)

    new_bib = []
    for entry in bib.entries:
        if entry['ID'] in r0:
            new_bib.append(entry)
    # new_bit 去重
    new_bib = [dict(t) for t in {tuple(d.items()) for d in new_bib}]
    bib.entries = new_bib
    # 写入新的 BibTeX 文件
    with open('reference_check.bib', 'w', encoding='utf-8') as f:
        bibtexparser.dump(bib, f)


if __name__ == '__main__':
    main()