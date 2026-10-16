const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.join(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'ad-banner.js'), 'utf8');

for (const [available, expected] of [[280, 0], [319, 0], [320, 320], [390, 320], [467, 320], [468, 468], [720, 468]]) {
  const slot = { clientWidth: available, style: {}, parentElement: {} };
  const writes = [];
  const window = {};
  vm.runInNewContext(source, {
    window,
    document: { currentScript: { parentElement: slot }, write: html => writes.push(html) }
  });
  assert.equal(writes.length, expected ? 1 : 0);
  if (expected) {
    assert.equal(window.atOptions.width, expected);
    assert.equal(window.atOptions.height, expected === 468 ? 60 : 50);
    assert.equal(slot.style.width, expected + 'px');
    assert.ok(writes[0].includes(window.atOptions.key));
    assert.ok(writes[0].endsWith('</script>'));
  } else {
    assert.equal(slot.parentElement.hidden, true);
    assert.equal(window.atOptions, undefined);
  }
}

const pages = ['index.html', ...['tools', 'fun'].flatMap(dir =>
  fs.readdirSync(path.join(root, dir)).filter(f => f.endsWith('.html')).map(f => dir + '/' + f))];
for (const page of pages) {
  const html = fs.readFileSync(path.join(root, page), 'utf8');
  assert.equal((html.match(/<script src="\/ad-banner.js"><\/script>/g) || []).length, 1, page);
  assert.equal((html.match(/src="https:\/\/bauval.org\/22\/9a224ed3f9be50f7dc6b2978be88e726"/g) || []).length, 1, page);
  assert.ok(html.indexOf('/ad-banner.js') < html.indexOf("'key' : '9a224ed3f9be50f7dc6b2978be88e726'"), page);
}
console.log('PASS - banner sizes, single vendor request, narrow screens, and ' + pages.length + ' page integrations');
