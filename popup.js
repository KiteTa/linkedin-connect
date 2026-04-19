const startBtn = document.getElementById('startBtn');
const statusEl = document.getElementById('status');
const logEl = document.getElementById('log');
const msgEl = document.getElementById('connectMsg');

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
    statusEl.textContent = '⚠️ 请先输入消息';
    return;
  }

  statusEl.textContent = '🔍 处理第一个人...';

  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    chrome.tabs.sendMessage(
      tabs[0].id,
      {
        action: 'connectOne',
        message: msg,
      },
      (response) => {
        if (chrome.runtime.lastError) {
          statusEl.textContent = '❌ 请刷新 LinkedIn 页面';
          return;
        }

        if (response.success) {
          statusEl.textContent = '✅ 成功发送第一个';
          addLog('✓ 发送成功');
        } else {
          statusEl.textContent = '❌ 失败：' + response.reason;
          addLog('✗ 失败：' + response.reason);
        }
      },
    );
  });
});
