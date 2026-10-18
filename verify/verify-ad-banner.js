const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.join(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'ad-banner-isolated.js'), 'utf8');
const wrapper = fs.readFileSync(path.join(root, 'ad-frame.html'), 'utf8');
const sandbox = 'allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox';
function run(available, strip, origin = 'https://harukok.com') {
  const slot = { clientWidth: available, classList: { contains: () => strip }, style: {}, parentElement: {}, children: [], appendChild(f) { this.children.push(f); } };
  const window = {};
  vm.runInNewContext(source, { window, location: new URL(origin), document: {
    currentScript: { parentElement: slot },
    createElement: tag => ({ tag, style: {}, attrs: {}, setAttribute(k,v) { this.attrs[k]=v; } }),
    write: () => assert.fail('Third-party script must not execute in the host page')
  } });
  return { slot, window, frame: slot.children[0] };
}
for (const [available, expected] of [[280, 0], [319, 0], [320, 320], [390, 320], [467, 320], [468, 468], [720, 468]]) {
  const { slot, frame, window } = run(available, true);
  assert.equal(slot.children.length, expected ? 1 : 0);
  assert.equal(window.atOptions, undefined);
  if (!expected) { assert.equal(slot.parentElement.hidden, true); continue; }
  assert.equal(frame.width, expected);
  assert.equal(frame.height, expected === 468 ? 60 : 50);
  assert.equal(frame.attrs.sandbox, sandbox);
  for (const forbidden of ['allow-top-navigation', 'allow-modals', 'allow-downloads']) assert.ok(!frame.attrs.sandbox.includes(forbidden));
  assert.equal(frame.attrs.allow, "fullscreen 'none'; autoplay 'none'");
  assert.equal(slot.style.overflow, 'hidden');
}
for (const origin of ['https://harukok.com', 'https://www.harukok.com', 'https://harukok.pages.dev', 'https://dev.harukok.pages.dev', 'http://127.0.0.1:8765']) {
  const { frame } = run(300, false, origin);
  assert.equal(frame.width, 300);
  assert.equal(frame.height, 250);
  assert.equal(frame.srcdoc, undefined);
  assert.notEqual(new URL(frame.src).origin, origin, 'The ad must never share the host origin');
  assert.equal(new URL(frame.src).searchParams.get('size'), '300x250');
}
const code = wrapper.match(/<script>([\s\S]*?)<\/script>/)[1];
assert.equal(run(285,false).frame,undefined);
assert.equal(run(285,false).slot.parentElement.hidden,true);
for (const size of ['300x250', '320x50', '468x60', 'bad', '__proto__']) {
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
    assert.equal(opens, active ? 1 : 0);
    assert.equal(Object.getOwnPropertyDescriptor(window, 'open').writable, false);
  }
}
const pages = ['index.html', ...['tools','fun','guides'].flatMap(dir => fs.readdirSync(path.join(root,dir)).filter(f=>f.endsWith('.html')).map(f=>dir+'/'+f))];
let checked=0;
for (const page of pages) {
  const html=fs.readFileSync(path.join(root,page),'utf8');
  assert.ok(!html.includes('bauval.org'), 'Direct vendor code: '+page);
  if (!html.includes('class="ad-banner')) continue;
  assert.equal((html.match(/src="\/ad-banner-isolated\.js\?v=20261018-(?:isolated|tools)"/g)||[]).length,page.startsWith('guides/')?1:2,page);
  checked++;
}
assert.equal(checked,20);
console.log('PASS - banner sizes, cross-origin isolation, sandbox permissions, popup guard, unit whitelist, all 20 integrations');
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
