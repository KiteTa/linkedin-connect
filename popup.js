const startBtn = document.getElementById('startBtn');
const statusEl = document.getElementById('status');
const logEl = document.getElementById('log');
const msgEl = document.getElementById('connectMsg');

// add log
function addLog(text) {
  logEl.style.display = 'block';
  const line = document.createElement('div');
  line.textContent = text;
  logEl.appendChild(line);
  logEl.scrollTop = logEl.scrollHeight;
}

startBtn.addEventListener('click', () => {
  const msg = msgEl.value.trim();
  if (!msg) {
    statusEl.textContent = '!Please first input some message';
    return;
  }
  statusEl.textContent = 'Going through the page...';
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    chrome.tabs.sendMessage(tabs[0].id, { action: 'scan' }, (response) => {
      if (chrome.runtime.lastError) {
        statusEl.textContent = '错误：请刷新 LinkedIn 页面';
        addLog('无法连接到页面，请刷新后重试');
        return;
      }
      statusEl.textContent = `找到 ${response.count} 个 Connect 按钮`;
      addLog(`扫描完成，找到 ${response.count} 个按钮`);
    });
  });
});
