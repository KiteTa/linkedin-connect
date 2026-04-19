console.log('content.js loaded on LinkedIn!');

// 找所有 Connect 按钮
function findConnectButtons() {
  const allButtons = document.querySelectorAll('button');

  const connectButtons = [];
  allButtons.forEach((btn) => {
    const text = btn.innerText.trim();
    if (text === 'Connect') {
      connectButtons.push(btn);
    }
  });

  return connectButtons;
}

// 监听来自 popup.js 的消息
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'scan') {
    const buttons = findConnectButtons();
    console.log('找到按钮数量：', buttons.length);
    sendResponse({ count: buttons.length });
  }
});
