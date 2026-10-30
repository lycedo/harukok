const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert');
const html = fs.readFileSync(path.join(__dirname, '../fun/lotto-generator.html'), 'utf8');
const source = html.slice(html.indexOf('  function saveCardAsImage('), html.indexOf('  function copyText('));
async function test(mode) {
  const children = new Set(), downloads = [], revoked = [], alerts = [], timers = [];
  const ball = {style: {}};
  const clone = {style: {}, querySelectorAll: () => [ball], remove() { children.delete(this); }};
  const blob = {type: 'image/png'};
  const context = {
    $: () => ({cloneNode: () => clone}),
    document: {
      body: {appendChild: e => children.add(e), removeChild: e => { assert(children.has(e)); children.delete(e); }},
      createElement: () => ({click() { assert(children.has(this), 'Download link must be attached'); downloads.push({name: this.download, href: this.href}); }, remove() {children.delete(this);}})
    },
    URL: {createObjectURL: b => {assert.equal(b, blob); return 'blob:test';}, revokeObjectURL: u => revoked.push(u)},
    setTimeout: fn => timers.push(fn), alert: text => alerts.push(text),
    html2canvas: () => mode === 'render-error' ? Promise.reject(new Error('Render failure')) : Promise.resolve({toBlob(callback, type) {assert.equal(type, 'image/png'); callback(mode === 'empty' ? null : blob);}})
  };
  vm.runInNewContext(source, context);
  context.saveCardAsImage('shareCard', '하루콕-번호메모.png');
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(ball.style.animation, 'none', 'Saved balls must not restart animation');
  assert.equal(children.size, 0, 'Temporary elements removed on success and failure');
  if (mode === 'ok') {
    assert.deepEqual(downloads, [{name: '하루콕-번호메모.png', href: 'blob:test'}]);
    assert.equal(alerts.length, 0);
    assert.equal(revoked.length, 0, 'Keep URL alive for download');
    timers.forEach(fn => fn());
    assert.deepEqual(revoked, ['blob:test']);
  } else {
    assert.equal(downloads.length, 0); assert.equal(alerts.length, 1);
  }
}
(async () => { for (const mode of ['ok', 'empty', 'render-error']) await test(mode); console.log('PASS - lotto PNG download, attached link, delayed URL cleanup, render/blob failure'); })().catch(error => {console.error(error); process.exitCode = 1;});
