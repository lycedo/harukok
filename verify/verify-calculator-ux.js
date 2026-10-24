const assert = require('node:assert/strict');
const path = require('node:path');
const { loadCalculator } = require('./dom-shim');

// A missing amount must explain the error; correcting it must reveal the result.
for (const [page, field, values] of [
  ['salary', 'salary', { salary: 4000, nontax: 20, dependents: 1, children: 0 }],
  ['hourly-wage', 'hourlyWage', { hourlyWage: 10320, dailyHours: 8, weeklyDays: 5 }],
  ['weekly-holiday-pay', 'hourlyWage', { hourlyWage: 10320, weeklyHours: 20 }]
]) {
  const doc = loadCalculator(path.join(__dirname, '..', 'tools', page + '-calculator.html'));
  const get = id => doc.getElementById(id);
  get(field).value = '';
  get('calcBtn').click();
  assert.ok(get('inputError').textContent.trim(), page + ' explains a missing amount');
  assert.ok(get('resultCard').classList.contains('hidden'), page + ' does not show an invalid result');
  for (const [id, value] of Object.entries(values)) get(id).value = String(value);
  let resultReached = false;
  get('resultCard').scrollIntoView = () => { resultReached = true; };
  if (page === 'salary') get(field).dispatchEvent({ type: 'keydown', key: 'Enter' });
  else get('calcBtn').click();
  assert.equal(get('inputError').textContent, '', page + ' clears the old error');
  assert.equal(get('resultCard').classList.contains('hidden'), false, page + ' shows the result');
  assert.ok(resultReached, page + ' brings the result into view');
  if (page === 'salary') {
    get('nontax').value='0';get('nontax').dispatchEvent({type:'input'});
    assert.ok(get('salary-conditions').textContent.includes('월 비과세 0만원'));
    assert.ok(get('resultCard').classList.contains('hidden'));
    get('nontax').value='-1';get('calcBtn').click();
    assert.equal(get('salary-settings').open,true);
    assert.ok(get('inputError').textContent);
  }
}
console.log('PASS - missing-input recovery and visible results, including Enter on salary');
