// Third-party code stays in a fixed-size, cross-origin sandbox, never the page.
(() => {
  const slot = document.currentScript.parentElement;
  const strip = slot.classList.contains('ad-strip-slot');
  const availableWidth = slot.clientWidth;
  if (availableWidth < (strip ? 320 : 300)) {
    slot.parentElement.hidden = true;
    return;
  }

  // 넓은 화면에서는 가로 띠 대신 사각형을 쓴다(같은 자리, 더 나은 단가).
  const desktop = availableWidth >= 468;
  const width = !strip || desktop ? 300 : 320;
  const height = !strip || desktop ? 250 : 50;
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
