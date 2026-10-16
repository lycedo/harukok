// Keep this script parser-blocking: each vendor script must read its own options.
(() => {
  const slot = document.currentScript.parentElement;
  // Hiding an iframe is not enough: do not execute third-party ad code on mobile.
  if (window.matchMedia('(max-width: 767px), (any-pointer: coarse)').matches) {
    slot.parentElement.hidden = true;
    return;
  }
  const strip = slot.classList.contains('ad-strip-slot');
  const availableWidth = slot.clientWidth;
  if (strip && availableWidth < 320) {
    slot.parentElement.hidden = true;
    return;
  }

  const desktop = availableWidth >= 468;
  const key = !strip ? '9a224ed3f9be50f7dc6b2978be88e726' : desktop
    ? '67f80acb076e583798c7200553e3ff1d'
    : '8638d9c4926952e027a455d5690c215a';
  const width = !strip ? 300 : desktop ? 468 : 320;
  const height = !strip ? 250 : desktop ? 60 : 50;
  slot.style.width = width + 'px';
  slot.style.minHeight = height + 'px';
  window.atOptions = { key, format: 'iframe', height, width, params: {} };
  document.write('<script src="https://bauval.org/22/' + key + '"><\/script>');
})();
