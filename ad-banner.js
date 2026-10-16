// Keep this script parser-blocking: the vendor reads atOptions while its script
// is parsed, before the existing lower banner sets its own options.
(() => {
  const slot = document.currentScript.parentElement;
  const availableWidth = slot.clientWidth;
  if (availableWidth < 320) {
    slot.parentElement.hidden = true;
    return;
  }

  const desktop = availableWidth >= 468;
  const key = desktop
    ? '67f80acb076e583798c7200553e3ff1d'
    : '8638d9c4926952e027a455d5690c215a';
  const width = desktop ? 468 : 320;
  const height = desktop ? 60 : 50;
  slot.style.width = width + 'px';
  slot.style.minHeight = height + 'px';
  window.atOptions = { key, format: 'iframe', height, width, params: {} };
  document.write('<script src="https://bauval.org/22/' + key + '"><\/script>');
})();
