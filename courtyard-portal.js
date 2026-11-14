(() => {
  'use strict';
  const entry = document.querySelector('#gnomonEntry');
  const viewport = document.querySelector('#scrollViewport');
  if (!entry || !viewport) return;
  const key = 'guanshi-courtyard-return-v1';
  const terms = ['立春','雨水','惊蛰','春分','清明','谷雨','立夏','小满','芒种','夏至','小暑','大暑','立秋','处暑','白露','秋分','寒露','霜降','立冬','小雪','大雪','冬至','小寒','大寒'];
  entry.addEventListener('click', event => {
    const term = Math.max(0, terms.indexOf(document.querySelector('#currentTerm')?.textContent));
    entry.href = `courtyard.html?term=${term}`;
    if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    try {
      sessionStorage.setItem(key, JSON.stringify({ time: Date.now(), progress: viewport.scrollLeft / Math.max(1, viewport.scrollWidth - viewport.clientWidth), pageY: window.scrollY }));
    } catch { /* Navigation remains usable if storage is disabled. */ }
  });
  function restore() {
    if (window.location.hash !== '#gnomonEntry') return;
    let saved;
    try { saved = JSON.parse(sessionStorage.getItem(key) || 'null'); } catch { return; }
    if (!saved || Date.now() - saved.time > 30 * 60 * 1000 || !Number.isFinite(saved.progress)) return;
    const apply = () => {
      viewport.scrollTo({ left: Math.min(1, Math.max(0, saved.progress)) * Math.max(0, viewport.scrollWidth - viewport.clientWidth), behavior: 'instant' });
      window.scrollTo({ top: Math.max(0, saved.pageY || 0), behavior: 'instant' });
      entry.focus({ preventScroll: true });
    };
    requestAnimationFrame(() => requestAnimationFrame(apply));
  }
  window.addEventListener('pageshow', restore);
  restore();
})();
