// Third-party code stays in a fixed-size, cross-origin sandbox, never the page.
(() => {
  const slot = document.currentScript.parentElement;
  const strip = slot.classList.contains('ad-strip-slot');
  const availableWidth = slot.clientWidth;
  if (availableWidth < (strip ? 320 : 300)) {
    slot.parentElement.hidden = true;
    return;
  }

  const desktop = availableWidth >= 468;
  const width = !strip ? 300 : desktop ? 468 : 320;
  const height = !strip ? 250 : desktop ? 60 : 50;
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
  // Popups preserve ordinary clicked ad links; browser activation checks still apply.
  frame.setAttribute('sandbox', 'allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox');
  frame.setAttribute('allow', "fullscreen 'none'; autoplay 'none'");
  frame.setAttribute('referrerpolicy', 'strict-origin-when-cross-origin');
  const local = ['localhost', '127.0.0.1'].includes(location.hostname);
  const adOrigin = local ? 'https://dev.harukok.pages.dev' :
    location.hostname.endsWith('.pages.dev') ? 'https://harukok.com' : 'https://harukok.pages.dev';
  if (adOrigin === location.origin) return;
  frame.src = adOrigin + '/ad-frame.html?size=' + width + 'x' + height;
  slot.appendChild(frame);
})();
