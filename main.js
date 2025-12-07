// ==UserScript==
// @name         选择文本并自动获取BibTex到剪切板
// @namespace    http://tampermonkey.net/
// @version      1.2
// @description  在网页左下角生成一个按钮，从dblp中获取选定文本的BibTeX并复制到剪贴板。支持批量获取，支持从剪贴板读取，支持随时下载。
// @author       shandianchengzi
// @match        *://*/*
// @grant        GM_xmlhttpRequest
// @grant        GM_setClipboard
// @grant        GM_registerMenuCommand
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_addStyle
// @license      GPL-3.0
// ==/UserScript==

// Inject Custom CSS
const css = `
#dblp-batch-overlay {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background-color: rgba(0, 0, 0, 0.5); /* 50% transparency as requested */
    color: white;
    padding: 25px;
    border-radius: 10px;
    z-index: 100000;
    text-align: center;
    min-width: 320px;
    max-width: 80%;
    backdrop-filter: blur(5px);
    box-shadow: 0 4px 15px rgba(0,0,0,0.3);
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
    display: none;
}

#dblp-batch-title {
    font-size: 18px;
    font-weight: bold;
    margin-bottom: 15px;
    color: #fff;
}

#dblp-batch-current {
    font-size: 14px;
    margin-bottom: 20px;
    color: #eee;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 400px;
    margin-left: auto;
    margin-right: auto;
}

.dblp-btn {
    border: none;
    border-radius: 20px;
    padding: 8px 20px;
    cursor: pointer;
    font-weight: bold;
    transition: all 0.2s;
    margin: 5px;
    outline: none;
}

#dblp-btn-download {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    box-shadow: 0 4px 6px rgba(0,0,0,0.2);
}

#dblp-btn-download:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 12px rgba(0,0,0,0.3);
}

#dblp-btn-download:active {
    transform: translateY(0);
}

#dblp-btn-close {
    background: rgba(255, 255, 255, 0.2);
    color: white;
    border: 1px solid rgba(255,255,255,0.4);
}

#dblp-btn-close:hover {
    background: rgba(255, 255, 255, 0.3);
}

/* Confirm Modal */
#dblp-confirm-modal {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: white;
    color: #333;
    padding: 20px;
    border-radius: 8px;
    z-index: 100001;
    box-shadow: 0 10px 25px rgba(0,0,0,0.5);
    text-align: center;
    max-width: 400px;
    display: none;
}
#dblp-confirm-text {
    background: #f5f5f5;
    padding: 10px;
    margin: 10px 0;
    border-radius: 4px;
    font-family: monospace;
    text-align: left;
    max-height: 100px;
    overflow-y: auto;
    font-size: 12px;
}
`;

if (typeof GM_addStyle !== 'undefined') {
    GM_addStyle(css);
} else {
    const styleNode = document.createElement('style');
    styleNode.innerHTML = css;
    document.head.appendChild(styleNode);
}

// Toast function
function Toast(msg, duration) {
  duration = isNaN(duration) ? 3000 : duration;
  var m = document.createElement('div');
  m.innerHTML = msg;
  m.style.cssText = "font-family: 'siyuan'; max-width: 60%; min-width: 150px; padding: 0 14px; height: auto; color: rgb(255, 255, 255); line-height: 1.5; text-align: center; border-radius: 4px; position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); z-index: 999999; background: rgba(0, 0, 0, 0.7); font-size: 16px;";
  document.body.appendChild(m);
  setTimeout(function() {
      m.style.transition = 'opacity 0.5s ease-in';
      m.style.opacity = '0';
      setTimeout(function() {
          if(m.parentNode) document.body.removeChild(m);
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
  var lang_hint = {
    error_no_text: "没有选中文本且剪贴板为空！",
    clipboard_confirm: "未选中文本。是否使用剪贴板内容？",
    clipboard_read_err: "无法读取剪贴板，请手动选择文本。",
    fetching_one: "正在获取...",
    done_copy: "已完成并复制！",
    batch_title: (cur, total) => `批量提取中: ${cur} / ${total}`,
    batch_done_title: "批量提取完成",
    download_btn: "下载当前结果 (.bib)",
    close_btn: "关闭",
    current_prefix: "正在搜索: ",
    default_btn: "Get BibTeX"
  };

  // Adjust language strings... (omitted detailed switch for brevity, using defaults mixed with CN logic above as requested)
  // Re-implementing basic language switch for robust support
  if (!lang.startsWith('zh')) {
      lang_hint = {
          error_no_text: "No text selected and clipboard is empty!",
          clipboard_confirm: "No text selected. Use clipboard content?",
          clipboard_read_err: "Cannot read clipboard.",
          fetching_one: "Fetching...",
          done_copy: "Done & Copied!",
          batch_title: (cur, total) => `Processing: ${cur} / ${total}`,
          batch_done_title: "Batch Complete",
          download_btn: "Download Results (.bib)",
          close_btn: "Close",
          current_prefix: "Searching: ",
          default_btn: "Get BibTeX"
      };
  }


  // --- UI Elements Creation ---

  // 1. Trigger Button
  const button = document.createElement('button');
  button.innerText = lang_hint.default_btn;
  button.style.cssText = "position: fixed; bottom: 10px; left: 10px; z-index: 9999; padding: 10px; background-color: #007BFF; color: white; border: none; border-radius: 5px; cursor: pointer; white-space: pre; text-align: center;";
  document.body.appendChild(button);

  // 2. Batch Overlay
  const overlay = document.createElement('div');
  overlay.id = 'dblp-batch-overlay';
  overlay.innerHTML = `
      <div id="dblp-batch-title"></div>
      <div id="dblp-batch-current"></div>
      <button id="dblp-btn-download" class="dblp-btn">${lang_hint.download_btn}</button>
      <button id="dblp-btn-close" class="dblp-btn" style="display:none">${lang_hint.close_btn}</button>
  `;
  document.body.appendChild(overlay);

  // 3. Confirm Modal
  const confirmModal = document.createElement('div');
  confirmModal.id = 'dblp-confirm-modal';
  confirmModal.innerHTML = `
      <div style="font-weight:bold; margin-bottom:10px;">${lang_hint.clipboard_confirm}</div>
      <div id="dblp-confirm-text"></div>
      <div style="display:flex; justify-content:center; gap:10px;">
          <button id="dblp-confirm-yes" class="dblp-btn" style="background:#28a745; color:white;">Yes</button>
          <button id="dblp-confirm-no" class="dblp-btn" style="background:#dc3545; color:white;">No</button>
      </div>
  `;
  document.body.appendChild(confirmModal);

  // --- Logic Variables ---
  let batchResults = [];
  let isBatchProcessing = false;

  // --- Helper Functions ---

  function downloadContent(content, filename) {
      const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename || 'dblp_bibtex_results.bib';
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
  }

  function fetchBibTeX(query, silent, callback) {
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
                if(!silent) Toast("BibTeX Not Found");
                callback("None");
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
                    if(!silent) Toast("Error fetching bib file");
                    callback("None");
                }
            });
        },
        onerror: function() {
            if(!silent) Toast("Error searching DBLP");
            callback("None");
        }
    });
  }

  // --- Event Handlers ---

  const titleEl = document.getElementById('dblp-batch-title');
  const currentEl = document.getElementById('dblp-batch-current');
  const downloadBtn = document.getElementById('dblp-btn-download');
  const closeBtn = document.getElementById('dblp-btn-close');

  downloadBtn.onclick = () => {
      const content = batchResults.filter(r => r !== null).map(r => r === "None" ? "% Failed to fetch item" : r).join('\n\n');
      downloadContent(content);
  };

  closeBtn.onclick = () => {
      overlay.style.display = 'none';
  };

  // Clipboard Confirm Logic
  function askClipboard(text) {
      return new Promise((resolve) => {
          document.getElementById('dblp-confirm-text').innerText = text.length > 200 ? text.substring(0, 200) + '...' : text;
          confirmModal.style.display = 'block';
          
          document.getElementById('dblp-confirm-yes').onclick = () => {
              confirmModal.style.display = 'none';
              resolve(true);
          };
          document.getElementById('dblp-confirm-no').onclick = () => {
              confirmModal.style.display = 'none';
              resolve(false);
          };
      });
  }

  button.addEventListener('click', async () => {
      if (isBatchProcessing) {
          Toast("正在批量处理中，请使用中间面板控制");
          return;
      }

      let selection = window.getSelection().toString().trim();
      
      // Fallback to clipboard
      if (!selection) {
          try {
              const clipText = await navigator.clipboard.readText();
              if (clipText && clipText.trim()) {
                  const useClip = await askClipboard(clipText.trim());
                  if (useClip) {
                      selection = clipText.trim();
                  } else {
                      return;
                  }
              } else {
                  Toast(lang_hint.error_no_text);
                  return;
              }
          } catch (e) {
              Toast(lang_hint.clipboard_read_err);
              return;
          }
      }

      if (!selection) return;

      const lines = selection.split(/[\r\n]+/).map(s => s.trim()).filter(s => s);

      if (lines.length === 0) return;

      if (lines.length === 1) {
          // Single Mode
          Toast(lang_hint.fetching_one, 1000);
          fetchBibTeX(lines[0], false, (res) => {
              if (res && res !== "None") {
                  GM_setClipboard(res);
                  Toast(lang_hint.done_copy);
              } else {
                  Toast("Failed: " + lines[0]);
              }
          });
      } else {
          // Batch Mode
          isBatchProcessing = true;
          batchResults = new Array(lines.length).fill(null);
          let completedCount = 0;

          // Init UI
          overlay.style.display = 'block';
          closeBtn.style.display = 'none';
          downloadBtn.style.display = 'inline-block';
          downloadBtn.innerText = lang_hint.download_btn;
          
          titleEl.innerText = lang_hint.batch_title(0, lines.length);
          currentEl.innerText = "Initializing...";

          // Process Loop
          // We use a recursive function or async loop to allow UI updates for "Current Item"
          // But to be fast, we can run them with small delays.
          
          lines.forEach((line, index) => {
              setTimeout(() => {
                  // Update UI to show what we are starting now
                  if (isBatchProcessing) {
                      currentEl.innerText = lang_hint.current_prefix + line;
                  }

                  fetchBibTeX(line, true, (result) => {
                      // Save result
                      batchResults[index] = result === "None" ? `% Failed to fetch: ${line}` : result;
                      completedCount++;

                      // Update Progress
                      if (isBatchProcessing) {
                          titleEl.innerText = lang_hint.batch_title(completedCount, lines.length);
                      }

                      // Finished?
                      if (completedCount === lines.length) {
                          isBatchProcessing = false;
                          titleEl.innerText = lang_hint.batch_done_title;
                          currentEl.innerText = "";
                          closeBtn.style.display = 'inline-block';
                          downloadBtn.innerText = "下载全部结果";
                          
                          // Auto Copy
                          const finalContent = batchResults.join('\n\n');
                          GM_setClipboard(finalContent);
                          Toast(lang_hint.done_copy);
                      }
                  });
              }, index * 800); // 800ms stagger to be polite to DBLP and let user see the "Current" text
          });
      }
  });

  // Toggle button visibility menu
  GM_registerMenuCommand(lang === "zh-CN" ? "显示/隐藏按钮" : "Show/Hide Button", function() {
      button.style.display = button.style.display === 'none' ? 'block' : 'none';
      GM_setValue('showButton', button.style.display === 'block');
  });

  if (!GM_getValue('showButton', true)) {
      button.style.display = 'none';
  }

})();