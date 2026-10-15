const path = require('path');
const { loadCalculator } = require('./dom-shim.js');
const HTML = path.join(__dirname, '..', 'tools', 'weekly-holiday-pay-calculator.html');
let pass = 0, fail = 0;
function check(label, actual, expected) {
  const ok = actual === expected;
  console.log((ok ? 'PASS' : 'FAIL') + ' - ' + label);
  ok ? pass++ : fail++;
}
function run(hours, wage = 10320) {
  const doc = loadCalculator(HTML);
  doc.getElementById('hourlyWage').value = String(wage);
  doc.getElementById('weeklyHours').value = String(hours);
  doc.getElementById('calcBtn').click();
  return doc.getElementById('resultCard');
}
for (const [hours, expected] of [[15, 30960], [20, 41280], [40, 82560]]) {
  const html = run(hours).innerHTML;
  const actual = Number(/result-amount">([\d,]+)</.exec(html)[1].replace(/,/g, ''));
  check('주 ' + hours + '시간의 주휴수당', actual, expected);
}
check('14시간은 정규 매주 일정 가정하에 주휴 미적용', run(14).innerHTML.includes('15시간 미만'), true);
check('40시간 초과는 가산수당 누락한 주급 대신 입력 안내', run(48).innerHTML.includes('소정근로시간을 입력하세요') && !run(48).innerHTML.includes('result-amount'), true);
check('무한 시급은 결과 숨김', run(40, Infinity).classList.contains('hidden'), true);
check('0시간은 결과 숨김', run(0).classList.contains('hidden'), true);
console.log('결과: ' + pass + '개 통과, ' + fail + '개 실패');
if (fail) process.exit(1);
