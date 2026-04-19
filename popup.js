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
  statusEl.textContent = 'Work Start...';
  addLog('按钮被点击了，消息是：' + msg);
  addLog('（content.js 还没连接，下一步做）');
});
