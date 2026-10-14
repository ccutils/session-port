import { normalizeCookieEntries, normalizeStorageEntries } from './common.js';
import { t } from './i18n.js';

const types = ['cookies', 'localStorage', 'sessionStorage'];
const cookieFields = [
  ['name', 'cookieName', 'text', 'session_id'],
  ['value', 'cookieValue', 'textarea', 'abc123'],
  ['domain', 'cookieDomain', 'text', ''],
  ['path', 'cookiePath', 'text', '/'],
  ['expirationDate', 'cookieExpiration', 'datetime-local', ''],
  ['httpOnly', 'httpOnly', 'checkbox', '']
];
const storageFields = [['name', 'keyLabel', 'text', 'token'], ['value', 'storageValueLabel', 'textarea', 'abc123']];

export function createDataEditor() {
  const tabs = [...document.querySelectorAll('.data-tab')];
  for (const tab of tabs) {
    tab.addEventListener('click', () => activate(tab.dataset.editor));
    tab.addEventListener('keydown', (event) => {
      if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
      event.preventDefault();
      const index = tabs.indexOf(tab);
      const next = event.key === 'Home' ? 0 : event.key === 'End' ? tabs.length - 1
        : (index + (event.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length;
      activate(tabs[next].dataset.editor);
      tabs[next].focus();
    });
  }
  document.querySelectorAll('[data-add]').forEach((button) => {
    button.addEventListener('click', () => addRow(button.dataset.add, {}, true));
  });

  function activate(type) {
    for (const tab of tabs) {
      const selected = tab.dataset.editor === type;
      tab.setAttribute('aria-selected', String(selected));
      tab.tabIndex = selected ? 0 : -1;
      document.querySelector(`#panel-${tab.dataset.editor}`).hidden = !selected;
    }
  }

  function updateCount(type) {
    const rows = [...document.querySelector(`#${type}-rows`).children];
    const count = rows.filter((row) => [...row.querySelectorAll('[data-field]')].some((input) => {
      if (input.dataset.field === 'path') return input.value && input.value !== '/';
      return input.type === 'checkbox' ? input.checked : Boolean(input.value);
    })).length;
    document.querySelector(`#tab-${type} .tab-count`).textContent = String(count);
  }

  function addRow(type, entry = {}, focus = false) {
    const row = document.createElement('tr');
    const fields = type === 'cookies' ? cookieFields : storageFields;
    for (const [key, label, inputType, placeholder] of fields) {
      const cell = document.createElement('td');
      const input = document.createElement(inputType === 'textarea' ? 'textarea' : 'input');
      input.dataset.field = key;
      input.setAttribute('aria-label', t(label));
      input.autocomplete = 'off';
      if (inputType === 'textarea') {
        input.rows = 1;
        input.spellcheck = false;
      } else {
        input.type = inputType;
      }
      if (inputType === 'checkbox') input.checked = Boolean(entry[key]);
      else if (inputType === 'datetime-local') {
        input.step = '1';
        if (Number.isFinite(entry[key])) {
          const date = new Date(entry[key] * 1000);
          if (!Number.isNaN(date.getTime())) {
            const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
            input.value = local.toISOString().slice(0, 19);
          }
        }
      } else input.value = entry[key] ?? (key === 'path' ? '/' : '');
      if (placeholder) input.placeholder = placeholder;
      if (key === 'domain') input.placeholder = t('domainPlaceholder');
      input.addEventListener('input', () => updateCount(type));
      cell.append(input);
      row.append(cell);
    }
    const actions = document.createElement('td');
    const remove = document.createElement('button');
    remove.type = 'button';
    remove.className = 'remove-row';
    remove.textContent = '×';
    remove.setAttribute('aria-label', t('deleteRow'));
    remove.addEventListener('click', () => {
      row.remove();
      const body = document.querySelector(`#${type}-rows`);
      if (!body.children.length) addRow(type);
      updateCount(type);
    });
    actions.append(remove);
    row.append(actions);
    document.querySelector(`#${type}-rows`).append(row);
    updateCount(type);
    if (focus) row.querySelector('input').focus();
  }

  function readRows(type) {
    return [...document.querySelector(`#${type}-rows`).children].map((row) => {
      const entry = {};
      for (const input of row.querySelectorAll('[data-field]')) {
        const key = input.dataset.field;
        if (input.type === 'checkbox') entry[key] = input.checked;
        else if (input.type === 'datetime-local') {
          if (input.validity.badInput) throw new Error(t('incompleteExpiration'));
          if (input.value) entry[key] = new Date(input.value).getTime() / 1000;
        } else entry[key] = input.value;
      }
      return entry;
    });
  }

  return {
    load(site = {}) {
      for (const type of types) {
        document.querySelector(`#${type}-rows`).replaceChildren();
        const entries = site[type] || [];
        if (!entries.length) addRow(type);
        else for (const entry of entries) addRow(type, entry);
      }
      activate('cookies');
    },
    read(url) {
      const data = {};
      for (const type of types) {
        try {
          data[type] = type === 'cookies' ? normalizeCookieEntries(readRows(type), url)
            : normalizeStorageEntries(readRows(type), type);
        } catch (error) {
          activate(type);
          throw error;
        }
      }
      return data;
    }
  };
}
