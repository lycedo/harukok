// 실제 HTML 실행: 표준 209시간, 단시간 추정치, 일급 반올림과 입력 범위를 검증한다.
const path = require('path');
const { loadCalculator } = require('./dom-shim.js');
const HTML = path.join(__dirname, '..', 'tools', 'annual-leave-pay-calculator.html');
let pass = 0, fail = 0;
function check(label, actual, expected) {
  const ok = actual === expected;
  console.log((ok ? 'PASS' : 'FAIL') + ' - ' + label + ' (실제: ' + actual + ', 기대: ' + expected + ')');
  ok ? pass++ : fail++;
}
function run(man, days, dh, dd) {
  const doc = loadCalculator(HTML);
  for (const [id, value] of Object.entries({ monthlyWage: man, unusedDays: days, dailyHours: dh, weeklyDays: dd })) {
    doc.getElementById(id).value = String(value);
  }
  doc.getElementById('calcBtn').click();
  return doc;
}
function result(doc) {
  const breakdown = doc.getElementById('breakdown').innerHTML;
  return {
    total: Number(doc.getElementById('totalAmount').textContent.replace(/[^0-9]/g, '')),
    hours: Number(/월 환산시간\(주휴 포함\)<\/span><span class="amount">([\d.]+)시간/.exec(breakdown)[1]),
    status: doc.getElementById('checkStatus').innerHTML,
  };
}
const standard = result(run(300, 5, 8, 5));
check('주 40시간은 공식 표준 월 209시간', standard.hours, 209);
check('1일 114,833원으로 반올림한 뒤 5일 계산', standard.total, 574165);
check('정산 일수는 가정이며 소멸과 수당 청구권은 별개', standard.status.includes('입력 가정') && standard.status.includes('미사용수당 청구권은 별개'), true);
check('표준 일정 209시간 근거 표시', standard.status.includes('공식 확인'), true);
check('9일 정산 사례', result(run(300, 9, 8, 5)).total, 1033497);
const part = result(run(150, 5, 5, 4));
check('주 20시간 월 환산시간 표시는 104.29시간', part.hours, 104.29);
check('반올림 전 월 시간으로 구한 1일 71,918원 × 5일', part.total, 359590);
check('단시간 환산을 개별 계약 확인 결과로 표시하지 않음', part.status.includes('추정치') && part.status.includes('확인하지 않았습니다'), true);
check('단시간 잔여 연차의 시간 단위 확인 안내', part.status.includes('같은 시간 단위'), true);
const short = result(run(80, 1, 7, 2));
check('주 14시간에는 유급 주휴시간을 더하지 않음', short.hours, 60.83);
check('법정 연차 적용 한계 표시', short.status.includes('법정 연차'), true);
for (const [label, args] of [
  ['주 40시간 초과', [300, 5, 8, 6]],
  ['하루 8시간 초과', [300, 5, 9, 4]],
  ['주 7일 초과', [300, 5, 4, 8]],
]) {
  const doc = run(...args);
  check(label + ' 결과 숨김', doc.getElementById('resultCard').classList.contains('hidden'), true);
  check(label + ' 입력 안내', doc.getElementById('inputError').textContent.includes('소정근로시간'), true);
}
check('무한 월급 결과 숨김', run(Infinity, 5, 8, 5).getElementById('resultCard').classList.contains('hidden'), true);
console.log('결과: ' + pass + '개 통과, ' + fail + '개 실패');
if (fail) process.exit(1);
