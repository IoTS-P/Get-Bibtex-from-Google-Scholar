# -------------- Basic Settings --------------
from global_settings import *

import os

# Set working directory
os.chdir(os.path.dirname(os.path.abspath(__file__)))

# Set proxy if enabled
def set_proxy(proxy_url, proxy_port):
    os.environ['http_proxy'] = f'{proxy_url}:{proxy_port}'
    os.environ['https_proxy'] = f'{proxy_url}:{proxy_port}'

if proxy_related['enable']:
    set_proxy(proxy_related['proxy_url'], proxy_related['proxy_port'])

# ------------------- Main -------------------

import requests
from lxml import etree

params={
  "hl": "zh-CN",
  "as_sdt": "0,5",
  "q": "Challenges in firmware re-hosting, emulation, and analysis",
  "btnG": ""
}
params2={
  "q": "info:pjS_Ia9di18J:scholar.google.com/",
  "output": "cite",
  "scirp": "0",
  "hl": "zh-CN",
}

# Get data function
def get_data(q, source="google_scholar"):
    if source not in searchUrlBases:
        print(f"Source {source} is not supported.")
        return None
    
    # 暂时只支持单页面跳转的检索模式, 也就是只有一个bibtex_route
    source_settings = searchUrlBases[source]["bibtex_route"][0]
    url = source_settings["url"]
    search_url = url.replace("@@", q)
    need_cookie = source_settings["need_cookie"]
    headers['Referer'] = search_url.split('?')[0]
    
    if need_cookie and headers['Cookie'] == "":
        print("No Cookie for %s! Please visit this page %s to get your cookie. Now will remove this source from searchWay." % (source, url.replace("@@", "1")))
        to_delete.append(source)
        return None

    # get the first article id
    res = requests.get(search_url, headers=headers)
    content = res.text
    html = etree.HTML(content)
    dom_xpath = source_settings["dom"]
    elements =  html.xpath(dom_xpath)
    if elements == []:
      print(f"{q} not found in {source}.")
      return None
    # 获得第一个文章的bibtex链接
    bibtex_link = elements[0].attrib['href']
    # 将".html?view=bibtex"替换为".bib"
    if "keyword_regex" in source_settings:
        for old, new in source_settings["keyword_regex"].items():
            bibtex_link = bibtex_link.replace(old, new)
    # get bibtex result
    res = requests.get(bibtex_link, headers=headers)
    return res.text

to_delete = []
# remove done
with open('./done.txt', 'r', encoding='utf-8') as fd:
  with open('./words.txt', 'r', encoding='utf-8') as f:
    done_list = fd.readlines()
    q_list = f.readlines()
    after = list(set(q_list)-set(done_list))
    after.sort(key = q_list.index)
    q_list = after

with open('./words.txt', 'w', encoding='utf-8') as f:
  f.writelines(q_list)
  
# find
for q in q_list:
  if q == '\n':
    continue
  with open('./done.txt', 'a', encoding='utf-8') as fd:
    with open('./result_bibtex.txt', 'a', encoding='utf-8') as fw:
      with open('./result_cite.txt', 'a', encoding='utf-8') as fc:
          for search_way in searchWay:
            result = get_data(q, search_way)
            if result != None:
              fw.write(result+'\n')
              fc.write(q.split(']')[0].strip()+'\t\cite{'+result.split('\n')[0].split('{')[1][:-1]+'}\n')
              fd.write(q)
          if to_delete != []:
              for source in to_delete:
                  searchWay.remove(source)
              to_delete = []