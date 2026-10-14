import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { runInNewContext } from 'node:vm';
import { catalogs, createMockI18n } from './helpers/i18n.mjs';
import { normalizeStorageEntries, normalizeUrl } from '../common.js';
import { t } from '../i18n.js';

assert.deepEqual(Object.keys(catalogs.en).sort(), Object.keys(catalogs.zh_CN).sort());
for (const [locale, catalog] of Object.entries(catalogs)) {
  for (const [key, entry] of Object.entries(catalog)) {
    assert.ok(entry.message, `${locale}: empty message ${key}`);
    assert.deepEqual(entry.placeholders || {}, catalogs.en[key].placeholders || {}, `${locale}: placeholder mismatch ${key}`);
    for (const match of entry.message.matchAll(/\$(\w+)\$/g)) {
      assert.ok(entry.placeholders?.[match[1].toLowerCase()], `${locale}: undefined placeholder in ${key}`);
    }
  }
}

const files = ['manifest.json', 'popup.html', 'options.html', 'i18n.js', 'popup.js', 'options.js', 'data-editor.js', 'common.js', 'background.js', 'bootstrap.js'];
for (const file of files) {
  const source = await readFile(new URL(`../${file}`, import.meta.url), 'utf8');
  const references = [
    ...source.matchAll(/(?:\bt|getMessage)\('([^']+)'/g),
    ...source.matchAll(/data-i18n(?:-[\w-]+)?="([^"]+)"/g),
    ...source.matchAll(/__MSG_(\w+)__/g)
  ];
  for (const [, key] of references) assert.ok(catalogs.en[key], `${file}: missing message ${key}`);
}

const manifest = JSON.parse(await readFile(new URL('../manifest.json', import.meta.url), 'utf8'));
const bootstrap = await readFile(new URL('../bootstrap.js', import.meta.url), 'utf8');
assert.equal(manifest.default_locale, 'en');
for (const locale of ['en', 'zh_CN']) {
  globalThis.chrome = { i18n: createMockI18n(locale) };
  assert.throws(() => normalizeUrl('ftp://example.com'), { message: t('invalidProtocol') });
  assert.throws(() => normalizeStorageEntries([{ name: '', value: 'secret' }], 'localStorage'), { message: t('storageKeyRequired', ['localStorage', 1]) });
  assert.equal(t('deleteConfirm', ['Demo $SITE$ <script>']), locale === 'en' ? 'Delete “Demo $SITE$ <script>”?' : '确定删除“Demo $SITE$ <script>”吗？');
  assert.equal(t('duplicateEntry', ['token', 'localStorage']), locale === 'en' ? '“token” is duplicated in localStorage' : 'localStorage 中的“token”重复了');
  const createElement = () => ({ children: [], append(...nodes) { this.children.push(...nodes); }, replaceChildren() { this.children = []; }, style: {} });
  const document = { documentElement: createElement(), createElement, title: '' };
  const token = '00000000-0000-0000-0000-000000000000';
  const hash = '#__session_port_bootstrap=' + token;
  runInNewContext(bootstrap, {
    location: { href: 'https://example.com/' + hash, hash },
    window: { stop() {} },
    document,
    chrome: { i18n: chrome.i18n, runtime: { sendMessage(message, callback) { callback({ ok: false, error: t('expiredLaunch') }); } } }
  });
  assert.equal(document.documentElement.lang, t('localeCode'));
  assert.equal(document.title, t('launchFailedHeading'));
  const [heading, detail] = document.documentElement.children[0].children;
  assert.equal(heading.textContent, t('launchFailedHeading'));
  assert.equal(detail.textContent, t('expiredLaunch'));
}
assert.equal(createMockI18n('en-GB').getMessage('localeCode'), 'en');
assert.equal(createMockI18n('de').getMessage('localeCode'), 'en');
console.log('localization checks passed');
