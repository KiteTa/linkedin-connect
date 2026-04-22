console.log('content.js loaded on LinkedIn!');

// 穿透 Shadow DOM 查找元素
function qs(selector) {
  // 先找普通 DOM
  const el = document.querySelector(selector);
  if (el) return el;

  // 再找 Shadow DOM
  const host = document.querySelector('#interop-outlet');
  return host?.shadowRoot?.querySelector(selector) || null;
}

function waitFor(selector, timeout = 5000) {
  return new Promise((resolve, reject) => {
    const el = qs(selector);
    if (el) return resolve(el);

    // 同时监听普通 DOM 和 Shadow DOM
    const targets = [document.body];
    const host = document.querySelector('#interop-outlet');
    if (host?.shadowRoot) targets.push(host.shadowRoot);

    const observers = targets.map((target) => {
      const observer = new MutationObserver(() => {
        const el = qs(selector);
        if (el) {
          observers.forEach((o) => o.disconnect());
          resolve(el);
        }
      });
      observer.observe(target, { childList: true, subtree: true });
      return observer;
    });

    setTimeout(() => {
      observers.forEach((o) => o.disconnect());
      reject(new Error(`Timeout: ${selector} 没有出现`));
    }, timeout);
  });
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function findPeopleFromCompanyPage() {
  const people = [];
  document.querySelectorAll('button').forEach((btn) => {
    if (btn.innerText.trim() !== 'Connect') return;
    const card = btn.closest('li') || btn.closest('section') || btn.closest('.artdeco-card');
    if (!card) return;
    const name = card.querySelector('.artdeco-entity-lockup__title')?.innerText.trim() || 'Unknown';
    const title = card.querySelector('.artdeco-entity-lockup__subtitle')?.innerText.trim() || '';
    people.push({ button: btn, name, title });
  });
  return people;
}

function findPeopleFromSearchPage() {
  const people = [];
  document.querySelectorAll('a[aria-label*="to connect"]').forEach((link) => {
    const ariaLabel = link.getAttribute('aria-label');
    const name = ariaLabel.replace('Invite ', '').replace(' to connect', '').trim();
    const card = link.closest('li') || link.closest('[data-view-name]');
    const title = card?.querySelector('.entity-result__primary-subtitle')?.innerText.trim() || '';
    people.push({ button: link, name, title });
  });
  return people;
}

function findPeople() {
  const fromCompany = findPeopleFromCompanyPage();
  if (fromCompany.length > 0) return fromCompany;

  const fromSearch = findPeopleFromSearchPage();
  if (fromSearch.length > 0) return fromSearch;

  return [];
}

async function connectOne(person, messageTemplate) {
  // 把 {name} 替换成真实名字的 first name
  const firstName = person.name !== 'Unknown' ? person.name.split(' ')[0] : '';
  const title = person.title || '';
  const message = messageTemplate
    .replace('{name}', firstName)
    .replace('{title}', title);

  try {
    person.button.click();
    console.log('点击 Connect 按钮');

    await waitFor('.artdeco-modal.send-invite');
    console.log('Modal 出现了');
    await sleep(500);

    const addNoteBtn = qs('button[aria-label="Add a note"]');
    if (!addNoteBtn) {
      console.log('没有找到 Add a note');
      const closeBtn = qs('button[aria-label="Dismiss"]');
      if (closeBtn) closeBtn.click();
      return { success: false, reason: '没有 Add a note 按钮' };
    }

    addNoteBtn.click();
    console.log('点了 Add a note');
    await sleep(500);

    const textarea = await waitFor('textarea[name="message"]');
    textarea.focus();
    textarea.value = message;
    textarea.dispatchEvent(new Event('input', { bubbles: true }));
    console.log('填入消息：', message);
    await sleep(500);

    const sendBtn = qs('button[aria-label="Send invitation"]');
    if (!sendBtn) {
      return { success: false, reason: '没有 Send 按钮' };
    }

    sendBtn.click();
    console.log('点了 Send！');
    await sleep(500);

    return { success: true };
  } catch (err) {
    console.error('出错了：', err.message);
    const closeBtn = qs('button[aria-label="Dismiss"]');
    if (closeBtn) closeBtn.click();
    return { success: false, reason: err.message };
  }
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'scan') {
    const people = findPeople();
    console.log('找到人数：', people.length);
    sendResponse({ count: people.length });
  }

  if (message.action === 'connectOne') {
    const people = findPeople();
    if (people.length === 0) {
      sendResponse({ success: false, reason: '没有找到按钮' });
      return;
    }
    connectOne(people[0], message.message).then((result) => {
      sendResponse(result);
    });
    return true;
  }
});
