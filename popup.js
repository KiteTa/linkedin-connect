const startBtn = document.getElementById('startBtn');
const statusEl = document.getElementById('status');
const logEl = document.getElementById('log');
const editor = document.getElementById('editor');

// Tab key: append placeholder content at end of editor
editor.addEventListener('keydown', (e) => {
  if (e.key !== 'Tab') return;
  e.preventDefault();

  const placeholder = editor.getAttribute('placeholder');
  const parts = placeholder.split(/(\{name\}|\{title\})/);
  const frag = document.createDocumentFragment();

  parts.forEach(part => {
    if (part === '{name}' || part === '{title}') {
      const variable = part.slice(1, -1);
      const chip = document.createElement('span');
      chip.className = 'var-chip';
      chip.dataset.var = variable;
      chip.contentEditable = 'false';
      chip.textContent = variable === 'name' ? 'Name' : 'Title';
      frag.appendChild(chip);
    } else if (part) {
      frag.appendChild(document.createTextNode(part));
    }
  });

  editor.appendChild(frag);

  // Move cursor to end
  const range = document.createRange();
  range.selectNodeContents(editor);
  range.collapse(false);
  const sel = window.getSelection();
  sel.removeAllRanges();
  sel.addRange(range);
});

// Insert a var-chip at the current cursor position inside #editor
document.querySelectorAll('.var-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const variable = btn.dataset.var;
    const label = variable === 'name' ? 'Name' : 'Title';

    const chip = document.createElement('span');
    chip.className = 'var-chip';
    chip.dataset.var = variable;
    chip.contentEditable = 'false';
    chip.textContent = label;

    editor.focus();
    const selection = window.getSelection();
    if (selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      // Only insert if the cursor is inside #editor
      if (editor.contains(range.commonAncestorContainer)) {
        range.deleteContents();
        range.insertNode(chip);
        range.setStartAfter(chip);
        range.collapse(true);
        selection.removeAllRanges();
        selection.addRange(range);
        return;
      }
    }
    editor.appendChild(chip);
  });
});

// Serialize #editor back to a plain string with {name} / {title} tokens
function getMessage() {
  let message = '';
  editor.childNodes.forEach(node => {
    if (node.nodeType === Node.TEXT_NODE) {
      message += node.textContent;
    } else if (node.classList?.contains('var-chip')) {
      message += '{' + node.dataset.var + '}';
    }
  });
  return message;
}

function addLog(text) {
  logEl.style.display = 'block';
  const line = document.createElement('div');
  line.textContent = text;
  logEl.appendChild(line);
  logEl.scrollTop = logEl.scrollHeight;
}

startBtn.addEventListener('click', () => {
  const msg = getMessage().trim();
  if (!msg) {
    statusEl.textContent = '⚠️ 请先输入消息';
    return;
  }

  statusEl.textContent = '🔍 处理第一个人...';

  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    chrome.tabs.sendMessage(
      tabs[0].id,
      { action: 'connectOne', message: msg },
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
