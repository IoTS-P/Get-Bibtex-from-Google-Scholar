// ==UserScript==
// @name         选择文本并自动获取BibTex到剪切板
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  在网页左下角生成一个按钮，从dblp中获取选定文本的BibTeX并复制到剪贴板
// @author       shandianchengzi
// @match        *://*/*
// @grant        GM_xmlhttpRequest
// @grant        GM_setClipboard
// @grant        GM_registerMenuCommand
// @grant        GM_getValue
// @grant        GM_setValue
// @license      GPL-3.0
// ==/UserScript==

// Toast function for displaying messages
function Toast(msg, duration) {
  duration = isNaN(duration) ? 3000 : duration;
  var m = document.createElement('div');
  m.innerHTML = msg;
  m.style.fontFamily = 'siyuan';
  m.style.maxWidth = '60%';
  m.style.minWidth = '150px';
  m.style.padding = '0 14px';
  m.style.height = 'auto';
  m.style.color = 'rgb(255, 255, 255)';
  m.style.lineHeight = '1.5';
  m.style.textAlign = 'center';
  m.style.borderRadius = '4px';
  m.style.position = 'fixed';
  m.style.top = '50%';
  m.style.left = '50%';
  m.style.transform = 'translate(-50%, -50%)';
  m.style.zIndex = '999999';
  m.style.background = 'rgba(0, 0, 0, 0.7)';
  m.style.fontSize = '16px';
  document.body.appendChild(m);
  setTimeout(function() {
      m.style.transition = 'opacity 0.5s ease-in';
      m.style.opacity = '0';
      setTimeout(function() {
          document.body.removeChild(m);
      }, 500);
  }, duration);
}

var headers = {
  "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9",
  "Accept-Encoding": "gzip, deflate",
  "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8,en-GB;q=0.7,en-US;q=0.6",
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/100.0.4896.75 Safari/537.36 Edg/100.0.1185.36",
  'Referer': 'https://dblp.org/'
};

(function() {
  'use strict';

  var lang=navigator.appName=="Netscape"?navigator.language:navigator.userLanguage;
  var lang_hint={};
  switch (lang){
    case "zh-CN":
    case "zh-SG":
      lang_hint={
        error_no_text_selected:"没有选中文本！",
        error_bibtex_not_found:"未找到BibTeX！",
        error_fetching_bibtex_search:"获取BibTeX所在页面时出错，您的搜索链接是 ",
        error_fetching_bibtex:"获取BibTeX时出错，您的bibUrl是 ",
        success_bibtex_copied:"BibTeX已复制到剪贴板！",
        show_button:"显示/隐藏按钮",
      };
      break;
    case "zh":
    case "zh-TW":
    case "zh-HK":
      lang_hint={
        error_no_text_selected:"沒有選中文本！",
        error_bibtex_not_found:"未找到BibTeX！",
        error_fetching_bibtex_search:"獲取BibTeX所在頁面時出錯，您的搜索鏈接是 ",
        error_fetching_bibtex:"獲取BibTeX時出錯，您的bibUrl是 ",
        success_bibtex_copied:"BibTeX已復制到剪貼板！",
        show_button:"顯示/隱藏按鈕",
      };
      break;
    default:
      lang_hint={
        error_no_text_selected:"No text selected!",
        error_bibtex_not_found:"BibTeX not found!",
        error_fetching_bibtex_search:"Error fetching BibTeX, your search query is ",
        error_fetching_bibtex:"Error fetching BibTeX, your bibUrl is ",
        success_bibtex_copied:"BibTeX copied to clipboard!",
        show_button:"Show/Hide Button",
      };
      break;
  }


  // Create a button in the bottom-left corner
  const button = document.createElement('button');
  button.innerText = 'Get BibTeX';
  button.style.position = 'fixed';
  button.style.bottom = '10px';
  button.style.left = '10px';
  button.style.zIndex = '9999';
  button.style.padding = '10px';
  button.style.backgroundColor = '#007BFF';
  button.style.color = 'white';
  button.style.border = 'none';
  button.style.borderRadius = '5px';
  button.style.cursor = 'pointer';
  document.body.appendChild(button);

  // Show/hide button based on user preference
  if (GM_getValue('showButton', true)) {
      button.style.display = 'block';
  } else {
      button.style.display = 'none';
  }

  // Helper function to fetch BibTeX from DBLP
  function fetchBibTeX(query, callback) {
    const searchUrl = `https://dblp.org/search?q=${encodeURIComponent(query)}`;

    GM_xmlhttpRequest({
        method: 'GET',
        url: searchUrl,
        headers: headers,
        onload: function(response) {
            const parser = new DOMParser();
            const doc = parser.parseFromString(response.responseText, 'text/html');
            const bibLink = doc.querySelector('a[href*="?view=bibtex"]');
            if (!bibLink) {
                Toast(lang_hint.error_bibtex_not_found);
                callback(null);
                return;
            }

            const bibUrl = bibLink.href.replace('.html?view=bibtex', '.bib');
            GM_xmlhttpRequest({
                method: 'GET',
                url: bibUrl,
                headers: headers,
                onload: function(bibResponse) {
                    callback(bibResponse.responseText);
                },
                onerror: function() {
                    Toast(lang_hint.error_fetching_bibtex + bibUrl);
                    callback(null);
                }
            });
        },
        onerror: function() {
            Toast(lang_hint.error_fetching_bibtex_search + searchUrl);
            callback(null);
        }
    });
  }

  // Event listener for button click
  button.addEventListener('click', async () => {
      const selection = window.getSelection().toString().trim();
      if (!selection) {
          Toast(lang_hint.error_no_text_selected);
          return;
      }

      fetchBibTeX(selection, (bibtex) => {
          if (bibtex) {
              GM_setClipboard(bibtex);
              Toast(lang_hint.success_bibtex_copied + bibtex);
          }
      });
  });

  GM_registerMenuCommand(lang_hint.show_button, function() {
      button.style.display = button.style.display === 'none' ? 'block' : 'none';
      GM_setValue('showButton', button.style.display === 'block');
  });
})();
