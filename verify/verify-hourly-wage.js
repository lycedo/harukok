// 실제 HTML 실행: 공식 주40시간 기준과 그 외 일정의 추정 산식을 구분한다.
const path = require('path');
const { loadCalculator } = require('./dom-shim.js');
const HTML = path.join(__dirname, '..', 'tools', 'hourly-wage-calculator.html');
let pass = 0, fail = 0;
function check(label, actual, expected) {
  const ok = actual === expected;
  console.log((ok ? 'PASS' : 'FAIL') + ' - ' + label + ' (실제: ' + actual + ', 기대: ' + expected + ')');
  ok ? pass++ : fail++;
}
function run(wage, dh, dd, mode = 'toMonthly') {
  const doc = loadCalculator(HTML);
  for (const b of doc.querySelectorAll('#modeSeg button')) if (b.dataset.value === mode) b.click();
  doc.getElementById(mode === 'toMonthly' ? 'hourlyWage' : 'monthlyWage').value = String(wage);
  doc.getElementById('dailyHours').value = String(dh);
  doc.getElementById('weeklyDays').value = String(dd);
  doc.getElementById('calcBtn').click();
  return doc.getElementById('resultCard');
}
function amount(card) { return Number(/result-amount">([0-9,]+)</.exec(card.innerHTML)[1].replace(/,/g, '')); }
function hours(card) { return Number(/월 환산 근로시간<\/span><span class="amount">([\d.]+)시간/.exec(card.innerHTML)[1]); }
check('2026년 공식 월 환산액: 10,320원 × 209시간', amount(run(10320, 8, 5)), 2156880);
check('주 40시간은 월 209시간', hours(run(10320, 8, 5)), 209);
check('공식 월급을 역환산하면 최저시급', amount(run(215.688, 8, 5, 'toHourly')), 10320);
check('명세서 작업표 220만원 환산 시급', amount(run(220, 8, 5, 'toHourly')), 10526);
const part = run(10320, 5, 5);
check('주 25시간 표시용 월 시간', hours(part), 130.36);
check('130시간으로 정수 반올림하지 않은 월급', amount(part), 1345286);
check('비표준 일정의 추정·미확인 범위 표시', part.innerHTML.includes('추정치') && part.innerHTML.includes('확인하지 않았습니다'), true);
check('주 14시간의 표시용 월 시간', hours(run(10320, 7, 2)), 60.83);
check('주 14시간에는 주휴 미적용', run(10320, 7, 2).innerHTML.includes('0.0시간'), true);
check('주 15시간은 주휴 3시간 추가', run(10320, 3, 5).innerHTML.includes('3.0시간'), true);
check('최저시급 1원 아래 경고', run(10319, 8, 5).innerHTML.includes('class="warning"'), true);
check('최저시급 정확히 같으면 비교 배지', run(10320, 8, 5).innerHTML.includes('class="ok-badge"'), true);
for (const [dh, dd] of [[8, 6], [9, 4], [4, 8]]) {
  const card = run(10320, dh, dd);
  check('지원 범위 밖 일정 ' + dh + '시간×' + dd + '일은 금액 대신 안내', card.innerHTML.includes('소정근로시간을 입력하세요') && !card.innerHTML.includes('result-amount'), true);
}
check('무한 시급은 금액을 표시하지 않음', run(Infinity, 8, 5).classList.contains('hidden'), true);
console.log('결과: ' + pass + '개 통과, ' + fail + '개 실패');
if (fail) process.exit(1);
