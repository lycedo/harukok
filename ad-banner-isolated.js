// Third-party code stays in a fixed-size, cross-origin sandbox, never the page.
(() => {
  const slot = document.currentScript.parentElement;
  const rail = slot.classList.contains('ad-rail-slot');
  const strip = slot.classList.contains('ad-strip-slot');
  const availableWidth = slot.clientWidth;
  // 세로 띠는 격자의 둘째 칸에 있어, 문서를 읽는 중인 이 시점에는 폭이 아직 0으로 나온다.
  // 그래서 자리를 재는 대신 CSS가 이 자리를 보여 주는 기준(1320px)을 그대로 본다.
  const fits = rail
    ? matchMedia('(min-width:1320px)').matches
    : availableWidth >= (strip ? 320 : 300);
  if (!fits) {
    slot.parentElement.hidden = true;
    return;
  }

  // 세로 띠는 넓은 화면의 옆자리 전용이고, 그 밖에는 넓으면 사각형·좁으면 가로 띠를 쓴다.
  const desktop = availableWidth >= 468;
  const width = rail ? 160 : !strip || desktop ? 300 : 320;
  const height = rail ? 600 : !strip || desktop ? 250 : 50;
  slot.style.width = width + 'px';
  slot.style.minHeight = height + 'px';
  slot.style.height = height + 'px';
  slot.style.overflow = 'hidden';

  const frame = document.createElement('iframe');
  frame.title = '광고';
  frame.width = width;
  frame.height = height;
  frame.style.cssText = 'display:block;border:0;max-width:100%;';
  // A distinct origin lets the vendor populate its own child frames without
  // access to our page. Never use srcdoc or a same-origin URL with these flags.
  // No popup or top-navigation permissions, including in nested vendor frames.
  frame.setAttribute('sandbox', 'allow-scripts allow-same-origin');
  frame.setAttribute('allow', "fullscreen 'none'; autoplay 'none'");
  frame.setAttribute('referrerpolicy', 'strict-origin-when-cross-origin');
  const local = ['localhost', '127.0.0.1'].includes(location.hostname);
  const adOrigin = local ? 'https://dev.harukok.pages.dev' :
    location.hostname.endsWith('.pages.dev') ? 'https://harukok.com' : 'https://harukok.pages.dev';
  if (adOrigin === location.origin) return;
  frame.src = adOrigin + '/ad-frame.html?size=' + width + 'x' + height;
  slot.appendChild(frame);
})();
