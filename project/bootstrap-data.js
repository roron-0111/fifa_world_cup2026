(() => {
  try {
    if (window.__WC26_BOOTSTRAP__) return;
    const xhr = new XMLHttpRequest();
    xhr.open('GET', './players.generated.json', false);
    xhr.send(null);
    if (xhr.status >= 200 && xhr.status < 300 && xhr.responseText) {
      window.__WC26_BOOTSTRAP__ = JSON.parse(xhr.responseText);
    }
  } catch (error) {
    console.warn('bootstrap-data failed to load', error);
  }
})();
