const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');
const vm = require('node:vm');
const { loadCalculator } = require('./dom-shim');

function loadInputBehavior(doc, file) {
  const html = fs.readFileSync(file, 'utf8');
  const inputsHTML = html.slice(html.indexOf('id="calculator-inputs"'), html.indexOf('id="resultCard"'));
  const inputs = [...inputsHTML.matchAll(/<input[^>]*id="([^"]+)"/g)].map(m => doc.getElementById(m[1]));
  const choices = [...inputsHTML.matchAll(/<div class="seg[^"]*" id="([^"]+)"/g)].flatMap(m => doc.querySelectorAll('#' + m[1] + ' button'));
  const buttons = [...inputsHTML.matchAll(/<button[^>]*id="([^"]+)"/g)].map(m => doc.getElementById(m[1])).concat(choices);
  doc.getElementById('calculator-inputs').querySelectorAll = selector => selector === 'input' ? inputs : selector === '.seg button' ? choices : buttons;
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../tools/calculator-inputs.js'), 'utf8'), {document: doc});
}

// A missing amount must explain the error; correcting it must reveal the result.
for (const [page, field, values] of [
  ['salary', 'salary', { salary: 4000, nontax: 20, dependents: 1, children: 0 }],
  ['hourly-wage', 'hourlyWage', { hourlyWage: 10320, dailyHours: 8, weeklyDays: 5 }],
  ['weekly-holiday-pay', 'hourlyWage', { hourlyWage: 10320, weeklyHours: 20 }]
]) {
  const file = path.join(__dirname, '..', 'tools', page + '-calculator.html');
  const doc = loadCalculator(file);
  loadInputBehavior(doc, file);
  const get = id => doc.getElementById(id);
  get(field).value = '';
  get('calcBtn').click();
  assert.ok(get('inputError').textContent.trim(), page + ' explains a missing amount');
  assert.ok(get('resultCard').classList.contains('hidden'), page + ' does not show an invalid result');
  for (const [id, value] of Object.entries(values)) get(id).value = String(value);
  let resultReached = false;
  get('resultCard').scrollIntoView = () => { resultReached = true; };
  get(field).dispatchEvent({ type: 'keydown', key: 'Enter', preventDefault() {} });
  assert.equal(get('inputError').textContent, '', page + ' clears the old error');
  assert.equal(get('resultCard').classList.contains('hidden'), false, page + ' shows the result');
  assert.ok(resultReached, page + ' brings the result into view');
  get(field).value = String(Number(get(field).value) + 1);
  get(field).dispatchEvent({type: 'input'});
  assert.ok(get('resultCard').classList.contains('hidden'), page + ' hides the old amount after editing');
  if (page === 'salary') {
    get('nontax').value='0';get('nontax').dispatchEvent({type:'input'});
    assert.ok(get('salary-conditions').textContent.includes('월 비과세 0만원'));
    assert.ok(get('resultCard').classList.contains('hidden'));
    get('nontax').value='-1';get('calcBtn').click();
    assert.equal(get('salary-settings').open,true);
    assert.ok(get('inputError').textContent);
  }
}
console.log('PASS - missing-input recovery, Enter calculation and stale-result clearing');
