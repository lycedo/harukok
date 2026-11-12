'use strict';
// 통합 도구의 기능 선택: 첫 기능은 이 페이지 자체, 나머지는 /tools/embed/의 기존 도구를 같은 자리에 보여 준다.
(() => {
  const picker = document.getElementById('tool-modes');
  const frame = document.getElementById('tool-mode-frame');
  if (!picker || !frame) return;
  const main = picker.parentElement;
  const select = picker.querySelector('select');
  const buttons = [...picker.querySelectorAll('button[data-mode]')];
  const modes = select ? [...select.options].map(option => option.value) : buttons.map(button => button.dataset.mode);
  const own = modes[0];
  const ownParts = [...main.children].filter(el => !el.matches('h1, #tool-modes, #tool-mode-frame, .ad-banner, nav.related'));
  let observer = null, mutations = null;

  function fit() {
    try {
      const body = frame.contentDocument && frame.contentDocument.body;
      if (body) frame.style.height = Math.ceil(body.getBoundingClientRect().height) + 8 + 'px';
    } catch { /* 같은 출처가 아니면 기본 높이를 유지한다 */ }
  }
  frame.addEventListener('load', () => {
    if (observer) observer.disconnect();
    if (mutations) mutations.disconnect();
    let body = null;
    try { body = frame.contentDocument && frame.contentDocument.body; } catch { return; }
    if (!body) return;
    fit();
    if (typeof ResizeObserver === 'function') {
      observer = new ResizeObserver(fit);
      observer.observe(body);
    }
    // 결과가 나타나 내용이 길어지면 화면을 다시 그리기 전에도 바로 높이를 맞춘다.
    mutations = new MutationObserver(fit);
    mutations.observe(body, { childList: true, subtree: true, attributes: true, attributeFilter: ['hidden', 'open', 'class', 'style'] });
  });

  function show(mode, record) {
    if (!modes.includes(mode)) mode = own;
    const embedded = mode !== own;
    for (const el of ownParts) el.classList.toggle('mode-off', embedded);
    frame.hidden = !embedded;
    if (embedded) {
      const src = '/tools/embed/' + mode;
      if (frame.getAttribute('src') !== src) {
        frame.style.height = '';
        frame.setAttribute('src', src);
      }
    }
    for (const button of buttons) button.setAttribute('aria-pressed', String(button.dataset.mode === mode));
    if (select) select.value = mode;
    if (record) history.replaceState(null, '', embedded ? '?mode=' + encodeURIComponent(mode) : location.pathname);
  }

  for (const button of buttons) button.addEventListener('click', () => show(button.dataset.mode, true));
  if (select) select.addEventListener('change', () => show(select.value, true));
  show(new URLSearchParams(location.search).get('mode') || own, false);
})();
