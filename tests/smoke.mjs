import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { runInNewContext } from 'node:vm';
import { cookieDetails, normalizeCookieEntries, normalizeStorageEntries, parsePairs, normalizeUrl, scriptIdForUrl } from '../common.js';

assert.deepEqual(parsePairs('token=a=b\nempty=', '测试'), [
  { name: 'token', value: 'a=b' },
  { name: 'empty', value: '' }
]);
assert.throws(() => parsePairs('broken', '测试'), /名称=值/);
assert.throws(() => normalizeUrl('javascript:alert(1)'), /仅支持/);

const legacyCookie = normalizeCookieEntries([{ name: 'sid', value: 'abc' }], 'https://example.com/')[0];
assert.deepEqual(cookieDetails(legacyCookie, 'https://example.com/'), {
  url: 'https://example.com/', name: 'sid', value: 'abc', path: '/', secure: true, httpOnly: false
});
assert.deepEqual(normalizeStorageEntries([{ name: '', value: '' }, { name: 'token', value: 'a=b\nnext' }], 'localStorage'), [{ name: 'token', value: 'a=b\nnext' }]);
assert.throws(() => normalizeStorageEntries([{ name: '', value: 'abc' }], 'localStorage'), /填写 Key/);
assert.throws(() => normalizeCookieEntries([{ name: 'sid', domain: 'other.com' }], 'https://example.com/'), /父域/);
assert.throws(() => normalizeCookieEntries([{ name: 'sid', path: 'bad' }], 'https://example.com/'), /路径/);
assert.equal(normalizeCookieEntries([{ name: 'sid', path: '/' }, { name: 'sid', path: '/app' }], 'https://example.com/').length, 2);

const site = {
  id: 'test-site',
  name: '测试',
  url: 'https://example.com/dashboard#home',
  cookies: [{ name: 'sid', value: 'abc', domain: '.example.com', path: '/dashboard', expirationDate: 2_000_000_000, httpOnly: true }],
  localStorage: [{ name: 'theme', value: 'dark' }],
  sessionStorage: [{ name: 'view', value: 'home' }]
};
const session = new Map();
const registrations = new Map();
const events = [];
let messageHandler;
let tabUrl;

globalThis.chrome = {
  runtime: { onMessage: { addListener(handler) { messageHandler = handler; } } },
  storage: {
    local: { async get() { return { sites: [site] }; } },
    session: {
      async set(items) { for (const [key, value] of Object.entries(items)) session.set(key, value); },
      async get(key) { return { [key]: session.get(key) }; },
      async remove(key) { session.delete(key); }
    }
  },
  permissions: { async contains() { return true; } },
  scripting: {
    async getRegisteredContentScripts({ ids }) { return ids.filter((id) => registrations.has(id)).map((id) => registrations.get(id)); },
    async registerContentScripts(scripts) { for (const script of scripts) registrations.set(script.id, script); },
    async unregisterContentScripts({ ids }) { for (const id of ids) registrations.delete(id); }
  },
  cookies: {
    async set(details) {
      events.push('cookie');
      assert.deepEqual(details, {
        url: site.url, name: 'sid', value: 'abc', domain: '.example.com', path: '/dashboard',
        expirationDate: 2_000_000_000, httpOnly: true, secure: true
      });
      return details;
    }
  },
  tabs: {
    async create({ url }) { events.push('tab'); tabUrl = url; return { id: 1 }; }
  }
};

await import('../background.js');

function send(message, sender = {}) {
  return new Promise((resolve) => {
    assert.equal(messageHandler(message, sender, resolve), true);
  });
}

assert.deepEqual(await send({ type: 'launch-site', siteId: site.id }), { ok: true });
assert.deepEqual(events, ['cookie', 'tab']);
assert.equal(registrations.size, 1);
assert.ok(registrations.has(scriptIdForUrl(site.url)));
assert.equal(registrations.values().next().value.runAt, 'document_start');
const token = tabUrl.split('#__session_port_bootstrap=')[1];
assert.match(token, /^[a-f0-9-]{36}$/);
const reply = await send({ type: 'consume-launch', token }, { tab: { id: 1 }, frameId: 0, url: tabUrl });
assert.equal(reply.ok, true);
assert.equal(reply.payload.url, site.url);
assert.deepEqual(reply.payload.localStorage, site.localStorage);
assert.deepEqual(reply.payload.sessionStorage, site.sessionStorage);
assert.equal(session.size, 0);
assert.equal((await send({ type: 'consume-launch', token }, { tab: { id: 1 }, frameId: 0, url: tabUrl })).ok, false);

const bootstrapEvents = [];
const marker = '#__session_port_bootstrap=';
const bootstrapContext = {
  location: {
    href: tabUrl,
    hash: marker + token,
    replace(url) { bootstrapEvents.push(['navigate', url]); }
  },
  window: { stop() { bootstrapEvents.push(['stop']); } },
  chrome: {
    runtime: {
      lastError: null,
      sendMessage(message, callback) {
        bootstrapEvents.push(['message', message.token]);
        callback({ ok: true, payload: reply.payload });
      }
    }
  },
  localStorage: { setItem(name, value) { bootstrapEvents.push(['local', name, value]); } },
  sessionStorage: { setItem(name, value) { bootstrapEvents.push(['session', name, value]); } }
};
runInNewContext(await readFile(new URL('../bootstrap.js', import.meta.url), 'utf8'), bootstrapContext);
assert.deepEqual(bootstrapEvents, [
  ['stop'], ['message', token], ['local', 'theme', 'dark'],
  ['session', 'view', 'home'], ['navigate', site.url]
]);

console.log('smoke checks passed');
