import { BOOTSTRAP_HASH, cookieDetails, normalizeCookieEntries, normalizeUrl, originPattern, scriptIdForUrl, SITES_KEY } from './common.js';
import { t } from './i18n.js';

const LAUNCH_KEY = 'launch:';

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.type === 'launch-site') {
    launchSite(message.siteId).then(
      () => sendResponse({ ok: true }),
      (error) => sendResponse({ ok: false, error: error.message })
    );
    return true;
  }

  if (message?.type === 'consume-launch') {
    consumeLaunch(message.token, sender).then(
      (payload) => sendResponse({ ok: true, payload }),
      (error) => sendResponse({ ok: false, error: error.message })
    );
    return true;
  }
});

async function launchSite(siteId) {
  const { [SITES_KEY]: sites = [] } = await chrome.storage.local.get(SITES_KEY);
  const site = sites.find((item) => item.id === siteId);
  if (!site) throw new Error(t('siteMissing'));

  const url = normalizeUrl(site.url);
  const pattern = originPattern(url);
  if (!(await chrome.permissions.contains({ origins: [pattern] }))) {
    throw new Error(t('permissionMissing'));
  }

  await ensureBootstrapScript(url, pattern);

  for (const cookie of normalizeCookieEntries(site.cookies || [], url)) {
    const result = await chrome.cookies.set(cookieDetails(cookie, url));
    if (!result) throw new Error(t('cookieWriteFailed', [cookie.name]));
  }

  const token = crypto.randomUUID();
  const key = LAUNCH_KEY + token;
  await chrome.storage.session.set({
    [key]: {
      url,
      origin: new URL(url).origin,
      localStorage: site.localStorage || [],
      sessionStorage: site.sessionStorage || [],
      createdAt: Date.now()
    }
  });

  // A fragment carries only a random token. The actual values never enter the URL.
  const bootstrapUrl = url.split('#')[0] + BOOTSTRAP_HASH + token;
  try {
    await chrome.tabs.create({ url: bootstrapUrl, active: true });
  } catch (error) {
    await chrome.storage.session.remove(key);
    throw error;
  }
}

async function ensureBootstrapScript(url, pattern) {
  const id = scriptIdForUrl(url);
  const current = await chrome.scripting.getRegisteredContentScripts({ ids: [id] });
  if (current.length && current[0].matches?.[0] === pattern) return;
  if (current.length) await chrome.scripting.unregisterContentScripts({ ids: [id] });
  await chrome.scripting.registerContentScripts([{
    id,
    matches: [pattern],
    js: ['bootstrap.js'],
    runAt: 'document_start',
    persistAcrossSessions: true
  }]);
}

async function consumeLaunch(token, sender) {
  if (!sender.tab || sender.frameId !== 0 || !/^[a-f0-9-]{36}$/.test(token || '')) {
    throw new Error(t('invalidLaunch'));
  }
  const key = LAUNCH_KEY + token;
  const record = (await chrome.storage.session.get(key))[key];
  if (!record || Date.now() - record.createdAt > 120_000) {
    throw new Error(t('expiredLaunch'));
  }
  if (new URL(sender.url).origin !== record.origin || !sender.url.endsWith(BOOTSTRAP_HASH + token)) {
    throw new Error(t('launchMismatch'));
  }
  await chrome.storage.session.remove(key);
  return record;
}
