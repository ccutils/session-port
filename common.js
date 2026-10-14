export const SITES_KEY = "sites";
export const BOOTSTRAP_HASH = "#__session_port_bootstrap=";

export function normalizeUrl(value) {
  const raw = String(value || "").trim();
  let url;
  try {
    url = new URL(raw);
  } catch {
    throw new Error("请输入完整 URL，例如 https://example.com/dashboard");
  }
  if (!['http:', 'https:'].includes(url.protocol)) {
    throw new Error("站点 URL 仅支持 http 或 https");
  }
  if (url.username || url.password) {
    throw new Error("请不要在站点 URL 中填写用户名或密码");
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
      throw new Error(`${label} 第 ${index + 1} 行应为 名称=值`);
    }
    const name = line.slice(0, equals).trim();
    const value = line.slice(equals + 1);
    if (!name || /[\r\n]/.test(name)) {
      throw new Error(`${label} 第 ${index + 1} 行的名称无效`);
    }
    if (names.has(name)) {
      throw new Error(`${label} 中的“${name}”重复了`);
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
    if (!name) throw new Error(`${label} 第 ${index + 1} 行请填写 Key`);
    if (names.has(name)) throw new Error(`${label} 中的“${name}”重复了`);
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
    if (!isValidCookieName(name)) throw new Error(`Cookie 第 ${index + 1} 行请填写有效的名称`);
    if (domain) {
      const bareDomain = domain.replace(/^\./, '');
      if (!bareDomain || /[\s/:?#@*]/.test(bareDomain)) throw new Error(`Cookie“${name}”的域无效，请填写主机名`);
      let normalizedDomain;
      try { normalizedDomain = new URL(`http://${bareDomain}`).hostname; }
      catch { throw new Error(`Cookie“${name}”的域无效`); }
      if (host !== normalizedDomain && !host.endsWith('.' + normalizedDomain)) {
        throw new Error(`Cookie“${name}”的域必须为 ${host} 或其父域`);
      }
      domain = domain.startsWith('.') ? '.' + normalizedDomain : normalizedDomain;
    }
    if (!path.startsWith('/')) throw new Error(`Cookie“${name}”的路径必须以 / 开头`);
    if (expirationDate != null && !Number.isFinite(expirationDate)) throw new Error(`Cookie“${name}”的过期时间无效`);
    const identity = JSON.stringify([name, domain || host, path]);
    if (identities.has(identity)) throw new Error(`Cookie“${name}”在相同域和路径下重复了`);
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
