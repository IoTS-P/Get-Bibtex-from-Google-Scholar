import requests
from lxml import etree
headers = {"Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9",
           "Accept-Encoding": "gzip, deflate",
           "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8,en-GB;q=0.7,en-US;q=0.6",
           "Referer": "https://scholar.google.com/scholar",
           "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/100.0.4896.75 Safari/537.36 Edg/100.0.1185.36"
}
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

headers['Cookie']="" # your cookie
url='https://scholar.google.com/scholar?'

def getData(q):
  params["q"]=q
  # get the first article id
  res = requests.get(url, params=params, headers=headers)
  content = res.text
  html = etree.HTML(content)
  first_div =  html.xpath('//*[@id="gs_res_ccl_mid"]/div[1]')
  if first_div == []:
    print(f"{q} not found.")
    return None
  data_cid = first_div[0].attrib['data-cid']
  # get the Bibtex of article
  params2["q"]=f"info:{data_cid}:scholar.google.com/"
  res = requests.get(url, params=params2, headers=headers)
  content = res.text
  html = etree.HTML(content)
  bibtex_element =  html.xpath('//*[@id="gs_citi"]/a[1]')
  if bibtex_element == []:
    print(f"{q} not found.")
    return None
  bibtex_link = bibtex_element[0].attrib['href']
  # get bibtex result
  res = requests.get(bibtex_link, headers=headers)
  return res.text
  
if headers['Cookie'] == "":
  print("No Cookie!!! Please visit this page 'https://scholar.google.com/scholar?hl=zh-CN&as_sdt=0%2C5&q=1&btnG=' to get your cookie.")
  exit(0)

to_delete = []
# remove done
with open('./done.txt', 'r') as fd:
  with open('./words.txt', 'r') as f:
    done_list = fd.readlines()
    q_list = f.readlines()
    after = list(set(q_list)-set(done_list))
    after.sort(key = q_list.index)
    q_list = after

with open('./words.txt', 'w') as f:
  f.writelines(q_list)
  
# find
for q in q_list:
  if q == '\n':
    continue
  with open('./done.txt', 'a') as fd:
    with open('./result_bibtex.txt', 'a') as fw:
      with open('./result_cite.txt', 'a') as fc:
          result = getData(q)
          if result != None:
            fw.write(result+'\n')
            fc.write(q.split(']')[0]+']\t\cite{'+result.split('\n')[0].split('{')[1][:-1]+'}\n')
            fd.write(q)
          elif 'OL]' not in q:
            print("Error!!! Please visit this page 'https://scholar.google.com/scholar?hl=zh-CN&as_sdt=0%2C5&q=1&btnG=' to pass Robot Captcha, and then reset your cookie.")
            break