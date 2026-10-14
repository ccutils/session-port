import { originPattern, SITES_KEY } from './common.js';

const list = document.querySelector('#site-list');
const status = document.querySelector('#popup-status');
const count = document.querySelector('#site-count');

document.querySelector('#open-options').addEventListener('click', () => chrome.runtime.openOptionsPage());
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'local' && changes[SITES_KEY]) render(changes[SITES_KEY].newValue || []);
});

const { [SITES_KEY]: sites = [] } = await chrome.storage.local.get(SITES_KEY);
render(sites);

function render(sites) {
  list.replaceChildren();
  count.textContent = String(sites.length);
  if (!sites.length) {
    const empty = document.createElement('div');
    empty.className = 'empty-state';
    empty.innerHTML = '<span class="empty-symbol" aria-hidden="true">＋</span><strong>还没有站点</strong><span>从下方入口添加第一个站点</span>';
    list.append(empty);
    return;
  }

  for (const site of sites) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'site-button';
    const badge = document.createElement('span');
    badge.className = 'site-badge';
    badge.textContent = site.name?.trim().charAt(0).toUpperCase() || 'S';
    const copy = document.createElement('span');
    copy.className = 'site-copy';
    const name = document.createElement('strong');
    name.textContent = site.name;
    const host = document.createElement('small');
    try { host.textContent = new URL(site.url).host; } catch { host.textContent = site.url; }
    copy.append(name, host);
    const arrow = document.createElement('span');
    arrow.className = 'site-arrow';
    arrow.textContent = '↗';
    button.append(badge, copy, arrow);
    button.addEventListener('click', () => openSite(site, button));
    list.append(button);
  }
}

async function openSite(site, button) {
  if (button.disabled) return;
  status.textContent = '';
  button.disabled = true;
  try {
    // Keep this call in the click flow: permission prompts require a user gesture.
    const granted = await chrome.permissions.request({ origins: [originPattern(site.url)] });
    if (!granted) throw new Error('未获得站点访问权限，无法写入数据');
    status.textContent = `正在打开 ${site.name}…`;
    const result = await chrome.runtime.sendMessage({ type: 'launch-site', siteId: site.id });
    if (!result?.ok) throw new Error(result?.error || '打开站点失败');
    window.close();
  } catch (error) {
    status.textContent = error.message;
    button.disabled = false;
  }
}
