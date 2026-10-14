import { t } from './i18n.js';

export const SITES_KEY = "sites";
export const BOOTSTRAP_HASH = "#__session_port_bootstrap=";

export function normalizeUrl(value) {
  const raw = String(value || "").trim();
  let url;
  try {
    url = new URL(raw);
  } catch {
    throw new Error(t('invalidUrl'));
  }
  if (!['http:', 'https:'].includes(url.protocol)) {
    throw new Error(t('invalidProtocol'));
  }
  if (url.username || url.password) {
    throw new Error(t('urlCredentials'));
  }
  return url.href;
}

export function originPattern(value) {
  const url = new URL(normalizeUrl(value));
  return `${url.origin}/*`;
}

export function scriptIdForUrl(value) {
  const origin = new URL(normalizeUrl(value)).origin;
  return `origin-${btoa(origin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')}`;
}

export function parsePairs(text, label) {
  const pairs = [];
  const names = new Set();
  String(text || "").split(/\r?\n/).forEach((line, index) => {
    if (!line.trim()) return;
    const equals = line.indexOf('=');
    if (equals < 1) {
      throw new Error(t('pairSyntax', [label, index + 1]));
    }
    const name = line.slice(0, equals).trim();
    const value = line.slice(equals + 1);
    if (!name || /[\r\n]/.test(name)) {
      throw new Error(t('invalidPairName', [label, index + 1]));
    }
    if (names.has(name)) {
      throw new Error(t('duplicateEntry', [name, label]));
    }
    names.add(name);
    pairs.push({ name, value });
  });
  return pairs;
}

export function formatPairs(pairs) {
  return (Array.isArray(pairs) ? pairs : [])
    .map(({ name, value }) => `${name}=${value}`)
    .join('\n');
}

export function isValidCookieName(name) {
  return /^[!#$%&'*+.^_`|~0-9A-Za-z-]+$/.test(name);
}

export function normalizeStorageEntries(rows, label) {
  const entries = [];
  const names = new Set();
  for (const [index, row] of rows.entries()) {
    const name = String(row.name || '').trim();
    const value = String(row.value ?? '');
    if (!name && !value) continue;
    if (!name) throw new Error(t('storageKeyRequired', [label, index + 1]));
    if (names.has(name)) throw new Error(t('duplicateEntry', [name, label]));
    names.add(name);
    entries.push({ name, value });
  }
  return entries;
}

export function normalizeCookieEntries(rows, siteUrl) {
  const host = new URL(normalizeUrl(siteUrl)).hostname;
  const entries = [];
  const identities = new Set();
  for (const [index, row] of rows.entries()) {
    const name = String(row.name || '').trim();
    const value = String(row.value ?? '');
    let domain = String(row.domain || '').trim().toLowerCase();
    const path = String(row.path || '/').trim() || '/';
    const httpOnly = Boolean(row.httpOnly);
    const expirationDate = row.expirationDate;
    if (!name && !value && !domain && path === '/' && !httpOnly && expirationDate == null) continue;
    if (!isValidCookieName(name)) throw new Error(t('cookieNameInvalid', [index + 1]));
    if (domain) {
      const bareDomain = domain.replace(/^\./, '');
      if (!bareDomain || /[\s/:?#@*]/.test(bareDomain)) throw new Error(t('cookieDomainInvalid', [name]));
      let normalizedDomain;
      try { normalizedDomain = new URL(`http://${bareDomain}`).hostname; }
      catch { throw new Error(t('cookieDomainInvalid', [name])); }
      if (host !== normalizedDomain && !host.endsWith('.' + normalizedDomain)) {
        throw new Error(t('cookieDomainHost', [name, host]));
      }
      domain = domain.startsWith('.') ? '.' + normalizedDomain : normalizedDomain;
    }
    if (!path.startsWith('/')) throw new Error(t('cookiePathInvalid', [name]));
    if (expirationDate != null && !Number.isFinite(expirationDate)) throw new Error(t('cookieExpiryInvalid', [name]));
    const identity = JSON.stringify([name, domain || host, path]);
    if (identities.has(identity)) throw new Error(t('cookieDuplicate', [name]));
    identities.add(identity);
    const entry = { name, value, domain, path, httpOnly };
    if (expirationDate != null) entry.expirationDate = expirationDate;
    entries.push(entry);
  }
  return entries;
}

export function cookieDetails(cookie, siteUrl) {
  const details = {
    url: siteUrl,
    name: cookie.name,
    value: cookie.value,
    path: cookie.path || '/',
    secure: new URL(siteUrl).protocol === 'https:',
    httpOnly: Boolean(cookie.httpOnly)
  };
  if (cookie.domain) details.domain = cookie.domain;
  if (cookie.expirationDate != null) details.expirationDate = cookie.expirationDate;
  return details;
}
