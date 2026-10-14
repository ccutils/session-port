import { readFileSync } from 'node:fs';

export const catalogs = Object.fromEntries(['en', 'zh_CN'].map((locale) => [
  locale,
  JSON.parse(readFileSync(new URL(`../../_locales/${locale}/messages.json`, import.meta.url), 'utf8'))
]));

export function createMockI18n(locale = 'en') {
  const code = locale.replace('-', '_');
  const messages = catalogs[code] || catalogs[code.split('_')[0]] || catalogs.en;
  return {
    getMessage(key, substitutions = []) {
      const entry = messages[key] || catalogs.en[key];
      if (!entry) return '';
      const values = Array.isArray(substitutions) ? substitutions : [substitutions];
      return entry.message.replace(/\$(\w+)\$/g, (_, name) => {
        const placeholder = entry.placeholders?.[name.toLowerCase()];
        if (!placeholder) throw new Error(`Unknown placeholder ${name} in ${key}`);
        return placeholder.content.replace(/\$(\d+)/g, (_, index) => String(values[Number(index) - 1] ?? ''));
      });
    }
  };
}
