(() => {
  const marker = '#__session_port_bootstrap=';
  const position = location.href.indexOf(marker);
  if (position < 0 || location.hash !== marker + location.href.slice(position + marker.length)) return;

  const token = location.href.slice(position + marker.length);
  if (!/^[a-f0-9-]{36}$/.test(token)) return;

  // Stop the first response before the site's scripts run. Storage is written
  // synchronously after the launch payload arrives, then the real URL opens.
  window.stop();

  chrome.runtime.sendMessage({ type: 'consume-launch', token }, (response) => {
    if (chrome.runtime.lastError || !response?.ok) {
      showError(response?.error || '无法取得启动信息，请从扩展重新打开站点');
      return;
    }

    try {
      for (const { name, value } of response.payload.localStorage) {
        localStorage.setItem(name, value);
      }
      for (const { name, value } of response.payload.sessionStorage) {
        sessionStorage.setItem(name, value);
      }
      location.replace(response.payload.url);
    } catch (error) {
      showError(`网页存储写入失败：${error.message}`);
    }
  });

  function showError(message) {
    // The original response has been stopped, so keep failures visible.
    if (!document.documentElement) document.append(document.createElement('html'));
    document.documentElement.replaceChildren();
    const body = document.createElement('body');
    body.style.cssText = 'font:16px system-ui,sans-serif;padding:32px;line-height:1.6';
    const heading = document.createElement('h1');
    heading.textContent = '站点启动失败';
    const detail = document.createElement('p');
    detail.textContent = message;
    body.append(heading, detail);
    document.documentElement.append(body);
  }
})();
