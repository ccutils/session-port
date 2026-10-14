import { normalizeUrl, originPattern, scriptIdForUrl, SITES_KEY } from './common.js';
import { createDataEditor } from './data-editor.js';

const elements = {
  list: document.querySelector('#options-list'),
  count: document.querySelector('#options-count'),
  form: document.querySelector('#site-form'),
  name: document.querySelector('#site-name'),
  url: document.querySelector('#site-url'),
  status: document.querySelector('#form-status'),
  title: document.querySelector('#editor-title'),
  kicker: document.querySelector('#editor-kicker'),
  delete: document.querySelector('#delete-site')
};

let sites = [];
let selectedId = null;
const dataEditor = createDataEditor();

const stored = await chrome.storage.local.get(SITES_KEY);
sites = Array.isArray(stored[SITES_KEY]) ? stored[SITES_KEY] : [];
renderList();
selectSite(sites[0]?.id || null);

document.querySelector('#new-site').addEventListener('click', () => selectSite(null));
elements.form.addEventListener('submit', saveSite);
elements.delete.addEventListener('click', deleteSite);

function selectSite(id) {
  selectedId = id;
  const site = sites.find((item) => item.id === id);
  elements.form.reset();
  elements.status.textContent = '';
  elements.status.classList.remove('success');
  elements.title.textContent = site ? '编辑站点' : '添加站点';
  elements.kicker.textContent = site ? 'EDIT SITE' : 'NEW SITE';
  elements.delete.hidden = !site;
  if (site) {
    elements.name.value = site.name;
    elements.url.value = site.url;
  }
  dataEditor.load(site);
  renderList();
}

function renderList() {
  elements.list.replaceChildren();
  elements.count.textContent = String(sites.length);
  for (const site of sites) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'sidebar-site' + (selectedId === site.id ? ' selected' : '');
    const monogram = document.createElement('span');
    monogram.className = 'sidebar-monogram';
    monogram.textContent = site.name?.trim().charAt(0).toUpperCase() || 'S';
    const text = document.createElement('span');
    const title = document.createElement('strong');
    title.textContent = site.name;
    const subtitle = document.createElement('small');
    try { subtitle.textContent = new URL(site.url).host; } catch { subtitle.textContent = site.url; }
    text.append(title, subtitle);
    button.append(monogram, text);
    button.addEventListener('click', () => selectSite(site.id));
    elements.list.append(button);
  }
}

async function saveSite(event) {
  event.preventDefault();
  elements.status.classList.remove('success');
  try {
    const name = elements.name.value.trim();
    if (!name) throw new Error('请填写站点名称');
    const url = normalizeUrl(elements.url.value);
    const { cookies, localStorage, sessionStorage } = dataEditor.read(url);

    const previous = sites.find((item) => item.id === selectedId);
    const site = { id: selectedId || crypto.randomUUID(), name, url, cookies, localStorage, sessionStorage };
    const index = sites.findIndex((item) => item.id === selectedId);
    const updated = [...sites];
    if (index < 0) updated.push(site);
    else updated[index] = site;
    await chrome.storage.local.set({ [SITES_KEY]: updated });
    sites = updated;
    if (previous && new URL(previous.url).origin !== new URL(url).origin) {
      try { await releaseUnusedOrigin(previous.url); } catch (error) { console.warn(error); }
    }
    selectedId = site.id;
    renderList();
    elements.title.textContent = '编辑站点';
    elements.kicker.textContent = 'EDIT SITE';
    elements.delete.hidden = false;
    elements.status.textContent = '已保存。点击浏览器工具栏图标即可打开。';
    elements.status.classList.add('success');
  } catch (error) {
    elements.status.textContent = error.message;
  }
}

async function deleteSite() {
  const site = sites.find((item) => item.id === selectedId);
  if (!site || !confirm(`确定删除“${site.name}”吗？`)) return;
  try {
    sites = sites.filter((item) => item.id !== selectedId);
    await chrome.storage.local.set({ [SITES_KEY]: sites });
    try { await releaseUnusedOrigin(site.url); } catch (error) { console.warn(error); }
    selectSite(sites[0]?.id || null);
    elements.status.textContent = '站点已删除';
    elements.status.classList.add('success');
  } catch (error) {
    elements.status.textContent = error.message;
    elements.status.classList.remove('success');
  }
}

async function releaseUnusedOrigin(url) {
  const origin = new URL(url).origin;
  if (sites.some((item) => new URL(item.url).origin === origin)) return;
  const id = scriptIdForUrl(url);
  const scripts = await chrome.scripting.getRegisteredContentScripts({ ids: [id] });
  if (scripts.length) await chrome.scripting.unregisterContentScripts({ ids: [id] });
  await chrome.permissions.remove({ origins: [originPattern(url)] });
}
