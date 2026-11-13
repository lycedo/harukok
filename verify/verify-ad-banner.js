const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.join(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'ad-banner-isolated.js'), 'utf8');
const wrapper = fs.readFileSync(path.join(root, 'ad-frame.html'), 'utf8');
const sandbox = 'allow-scripts allow-same-origin';
// slotClass는 실제 마크업의 클래스 이름이다. 띠·사각형·세로 띠를 구분해야 하므로 이름을 그대로 넘긴다.
function run(available, slotClass, origin = 'https://harukok.com', wide = true) {
  const slot = { clientWidth: available, classList: { contains: name => name === slotClass }, style: {}, parentElement: {}, children: [], appendChild(f) { this.children.push(f); } };
  const window = {};
  vm.runInNewContext(source, { window, matchMedia: () => ({ matches: wide }), location: new URL(origin), document: {
    currentScript: { parentElement: slot },
    createElement: tag => ({ tag, style: {}, attrs: {}, setAttribute(k,v) { this.attrs[k]=v; } }),
    write: () => assert.fail('Third-party script must not execute in the host page')
  } });
  return { slot, window, frame: slot.children[0] };
}
// 넓은 화면은 300x250 사각형, 좁은 화면은 320x50 띠, 그보다 좁으면 표시하지 않는다.
for (const [available, expected] of [[280, 0], [319, 0], [320, 320], [390, 320], [467, 320], [468, 300], [720, 300]]) {
  const { slot, frame, window } = run(available, 'ad-strip-slot');
  assert.equal(slot.children.length, expected ? 1 : 0);
  assert.equal(window.atOptions, undefined);
  if (!expected) { assert.equal(slot.parentElement.hidden, true); continue; }
  assert.equal(frame.width, expected);
  assert.equal(frame.height, expected === 300 ? 250 : 50);
  assert.equal(frame.attrs.sandbox, sandbox);
  for (const forbidden of ['allow-top-navigation', 'allow-popups', 'allow-modals', 'allow-downloads']) assert.ok(!frame.attrs.sandbox.includes(forbidden));
  assert.equal(frame.attrs.allow, "fullscreen 'none'; autoplay 'none'");
  assert.equal(slot.style.overflow, 'hidden');
}
// 세로 띠는 좁은 창에서는 아예 나오지 않고, 넓은 창에서는 자리 폭을 못 재도(0) 160x600으로 붙는다.
// 문서를 읽는 중이라 격자 칸 폭이 0으로 나오는 것이 정상이므로, 창 기준만 보고 판단해야 한다.
for (const [available, wide, expected] of [[0, false, 0], [900, false, 0], [0, true, 160], [160, true, 160], [900, true, 160]]) {
  const { slot, frame } = run(available, 'ad-rail-slot', 'https://harukok.com', wide);
  assert.equal(slot.children.length, expected ? 1 : 0);
  if (!expected) { assert.equal(slot.parentElement.hidden, true); continue; }
  assert.equal(frame.width, 160);
  assert.equal(frame.height, 600);
  assert.equal(new URL(frame.src).searchParams.get('size'), '160x600');
  assert.equal(frame.attrs.sandbox, sandbox);
  for (const forbidden of ['allow-top-navigation', 'allow-popups', 'allow-modals', 'allow-downloads']) assert.ok(!frame.attrs.sandbox.includes(forbidden));
  assert.notEqual(new URL(frame.src).origin, 'https://harukok.com', 'The ad must never share the host origin');
}
for (const origin of ['https://harukok.com', 'https://www.harukok.com', 'https://harukok.pages.dev', 'https://dev.harukok.pages.dev', 'http://127.0.0.1:8765']) {
  const { frame } = run(300, 'ad-rect-slot', origin);
  assert.equal(frame.width, 300);
  assert.equal(frame.height, 250);
  assert.equal(frame.srcdoc, undefined);
  assert.notEqual(new URL(frame.src).origin, origin, 'The ad must never share the host origin');
  assert.equal(new URL(frame.src).searchParams.get('size'), '300x250');
}
const code = wrapper.match(/<script>([\s\S]*?)<\/script>/)[1];
assert.equal(run(285,'ad-rect-slot').frame,undefined);
assert.equal(run(285,'ad-rect-slot').slot.parentElement.hidden,true);
for (const size of ['300x250', '320x50', '468x60', '160x600', 'bad', '__proto__']) {
  for (const active of [false, true]) {
    let opens = 0;
    const scripts = [];
    const window = { parent: {}, open: () => { opens++; return 'opened'; } };
    vm.runInNewContext(code, { window, URLSearchParams, location: { search: '?size=' + size }, navigator: { userActivation: { isActive: active } }, document: { createElement: () => ({}), body: { appendChild: s => scripts.push(s) } } });
    if (['bad','__proto__'].includes(size)) { assert.equal(scripts.length, 0); continue; }
    assert.equal(scripts.length, 1);
    assert.equal(scripts[0].src, 'https://bauval.org/22/' + window.atOptions.key);
    assert.equal(window.atOptions.width + 'x' + window.atOptions.height, size);
    window.open('https://example.com');
    assert.equal(opens, 0);
    assert.equal(Object.getOwnPropertyDescriptor(window, 'open').writable, false);
  }
}
const pages = ['index.html', ...['tools','fun'].flatMap(dir => fs.readdirSync(path.join(root,dir)).filter(f=>f.endsWith('.html')).map(f=>dir+'/'+f))];
const pagesWithoutBanner = new Set();
let checked=0;
for (const page of pages) {
  const html=fs.readFileSync(path.join(root,page),'utf8');
  assert.ok(!html.includes('bauval.org'), 'Direct vendor code: '+page);
  assert.ok(!html.includes('adsbygoogle.js'), 'Unrestricted auto-ad loader: '+page);
  if (pagesWithoutBanner.has(page)) {
    assert.ok(!html.includes('class="ad-banner'), 'Unexpected banner: ' + page);
    continue;
  }
  assert.ok(html.includes('class="ad-banner'), 'Missing banner: ' + page);
  // 홈만 본문 배너와 옆자리 세로 띠 두 개를 쓴다. 도구 페이지는 하나뿐이다.
  const expectedBanners = page === 'index.html' ? 2 : 1;
  assert.equal((html.match(/src="\/ad-banner-isolated\.js\?v=20261113-rail"/g)||[]).length,expectedBanners,page);
  if (page === 'index.html') assert.ok(html.includes('class="ad-rail-slot"'), 'Home must keep the side rail slot');
  else assert.ok(!html.includes('ad-rail-slot'), 'Side rail belongs to the home page only: ' + page);
  checked++;
}
assert.equal(checked, pages.length - pagesWithoutBanner.size);
console.log('PASS - banner sizes, cross-origin isolation, sandbox permissions, popup guard, unit whitelist, all ' + checked + ' integrations');
if (process.argv.includes('--fixture')) {
  fs.writeFileSync(path.join(__dirname, 'ad-sandbox-frame.html'), wrapper.replace("script.src = 'https://bauval.org/22/' + key;", "script.src = '/verify/ad-sandbox-vendor.js';"));
  fs.writeFileSync(path.join(__dirname, 'ad-sandbox-vendor.js'), `
    document.body.innerHTML='<div style="position:fixed;inset:0;background:#ecdfc6;padding:12px;box-sizing:border-box"><b>Mock banner</b><p id="status"></p><a href="http://127.0.0.1:8765/verify/ad-sandbox-click.html" target="_blank" rel="noopener">Test ordinary ad link</a></div>';
    let results=[];
    try{parent.document.body.innerHTML='ESCAPED';results.push('parent escaped')}catch(e){results.push('parent blocked')}
    try{top.location.href='http://127.0.0.1:8765/verify/ad-sandbox-escaped';results.push('navigation attempted')}catch(e){results.push('navigation blocked')}
    results.push(window.open('http://127.0.0.1:8765/verify/ad-sandbox-auto-popup')===null?'automatic popup blocked':'popup escaped');
    const child=document.createElement('iframe');document.body.appendChild(child);
    try{child.contentDocument.body.textContent='Nested banner works';results.push('nested frame works')}catch(e){results.push('nested frame failed')}
    document.getElementById('status').textContent=results.join(' / ');
  `);
  fs.writeFileSync(path.join(__dirname,'ad-sandbox-preview.html'), `<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><h1>Host page intact</h1><p>Overlay must stay inside the 300 x 250 rectangle.</p><iframe width="300" height="250" sandbox="${sandbox}" allow="fullscreen 'none'; autoplay 'none'" src="http://localhost:8765/verify/ad-sandbox-frame.html?size=300x250"></iframe><p>Content below banner remains visible.</p><button onclick="this.textContent='Host button works'">Test host button</button>`);
  fs.writeFileSync(path.join(__dirname,'ad-sandbox-click.html'), '<!doctype html><h1>Ordinary clicked link works</h1>');
}
