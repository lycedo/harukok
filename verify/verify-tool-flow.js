const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const {FakeDocument, FakeElement} = require('./dom-shim');

for (const page of ['date-calculator', 'area-calculator']) {
  const html = fs.readFileSync(path.join(__dirname, '../tools', page + '.html'), 'utf8');
  const doc = new FakeDocument(); doc.registerFromHtml(html);
  const buttons = [...html.matchAll(/<button[^>]*data-tool-panel="([^"]+)"/g)].map(m => new FakeElement(doc, 'button', {'data-tool-panel': m[1]}));
  const chooser = {hidden: true};
  doc.querySelectorAll = selector => selector === '[data-tool-panel]' ? buttons : [];
  doc.querySelector = () => chooser;
  const panels = buttons.map(b => doc.getElementById(b.dataset.toolPanel));
  assert.equal(panels.length, 2);
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../tools/tool-flow.js'), 'utf8'), {document: doc});
  assert.equal(chooser.hidden, false);
  assert.deepEqual(panels.map(p => p.hidden), [false, true]);
  const input = doc.getElementById(page === 'date-calculator' ? 'end' : 'area-value');
  input.value = page === 'date-calculator' ? '2027-01-01' : '84';
  const enteredValue = input.value;
  buttons[1].click();
  assert.deepEqual(panels.map(p => p.hidden), [true, false]);
  assert.deepEqual(buttons.map(b => b.getAttribute('aria-pressed')), ['false', 'true']);
  buttons[0].click();
  assert.deepEqual(panels.map(p => p.hidden), [false, true]);
  assert.equal(input.value, enteredValue, 'Switching purposes keeps what the visitor entered');
}
console.log('PASS - one calculation at a time, choice state and preserved inputs');
