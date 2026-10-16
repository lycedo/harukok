const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.join(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'ad-banner.js'), 'utf8');

function run(available, strip, mobile) {
  const slot = { clientWidth: available, classList: { contains: () => strip }, style: {}, parentElement: {} };
  const writes = [];
  const window = { matchMedia: query => {
    assert.ok(query.includes('max-width: 767px') && query.includes('any-pointer: coarse'));
    return { matches: mobile };
  } };
  vm.runInNewContext(source, { window, document: {
    currentScript: { parentElement: slot }, write: html => writes.push(html)
  } });
  return { slot, writes, window };
}

// Mobile and touch devices must make no vendor request, for either placement.
for (const width of [280, 320, 390, 768, 1024, 1280]) {
  for (const strip of [true, false]) {
    const { slot, writes, window } = run(width, strip, true);
    assert.equal(writes.length, 0);
    assert.equal(window.atOptions, undefined);
    assert.equal(slot.parentElement.hidden, true);
  }
}
for (const [available, expected] of [[280, 0], [319, 0], [320, 320], [467, 320], [468, 468], [720, 468]]) {
  const { slot, writes, window } = run(available, true, false);
  assert.equal(writes.length, expected ? 1 : 0);
  if (expected) {
    assert.equal(window.atOptions.width, expected);
    assert.equal(window.atOptions.height, expected === 468 ? 60 : 50);
    assert.ok(writes[0].includes(window.atOptions.key));
  } else assert.equal(slot.parentElement.hidden, true);
}
const rectangle = run(300, false, false);
assert.equal(rectangle.writes.length, 1);
assert.equal(rectangle.window.atOptions.key, '9a224ed3f9be50f7dc6b2978be88e726');
assert.equal(rectangle.window.atOptions.height, 250);

const pages = ['index.html', ...['tools', 'fun', 'guides'].flatMap(dir =>
  fs.readdirSync(path.join(root, dir)).filter(f => f.endsWith('.html')).map(f => dir + '/' + f))];
let checked = 0;
for (const page of pages) {
  const html = fs.readFileSync(path.join(root, page), 'utf8');
  assert.ok(!html.includes('bauval.org'), 'Unguarded vendor script: ' + page);
  if (!html.includes('class="ad-banner')) continue;
  const expected = page.startsWith('guides/') ? 1 : 2;
  assert.equal(html.split('src="/ad-banner.js?v=20261016-mobile-off"').length - 1, expected, page);
  assert.ok(!html.includes('src="/ad-banner.js"'), 'Old cached loader: ' + page);
  checked++;
}
assert.equal(checked, 17);
console.log('PASS - mobile/touch vendor requests blocked, desktop units preserved, all 17 ad pages guarded');
