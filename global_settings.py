# 这里记录所有用户配置
proxy_related = {
  "enable": False,
  "proxy_url": "http://127.0.0.1",
  "proxy_port": "10809",
}

searchWay = ["google_scholar", "dblp"]  # 搜索方式，可选"dblp"或"google_scholar"

headers = {"Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9",
           "Accept-Encoding": "gzip, deflate",
           "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8,en-GB;q=0.7,en-US;q=0.6",
           "Referer": "",
           "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/100.0.4896.75 Safari/537.36 Edg/100.0.1185.36"
}
headers['Cookie']="" # your cookie

# 基础配置，一般不需要修改
searchUrlBases = {
  "dblp": {
    "bibtex_route": [
      {
        "url": "https://dblp.org/search?q=@@",
        "dom": '//a[contains(@href, "?view=bibtex")]',
        "keyword_regex": { ".html?view=bibtex": ".bib" },
        "need_cookie": False,
      },
    ],
  },
  "google_scholar": {
    "bibtex_route": [
      {
        "url": "https://scholar.google.com/scholar?q=@@/&output=cite",
        "dom": "//a[@class='gs_citi']",
        "keyword_regex": {},
        "need_cookie": True,
      }
    ],
  },
}