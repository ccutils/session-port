export function t(key, substitutions = []) {
  return chrome.i18n.getMessage(key, substitutions.map(String));
}

export function localizePage(root = document) {
  document.documentElement.lang = t('localeCode');
  for (const element of root.querySelectorAll('[data-i18n]')) {
    element.textContent = t(element.dataset.i18n);
  }
  for (const attribute of ['placeholder', 'aria-label', 'alt']) {
    for (const element of root.querySelectorAll(`[data-i18n-${attribute}]`)) {
      element.setAttribute(attribute, t(element.getAttribute(`data-i18n-${attribute}`)));
    }
  }
}
