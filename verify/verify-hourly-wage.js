// 시급 계산기(tools/hourly-wage-calculator.html) — 월 환산 근로시간 반올림 검증
// 실행: node verify/verify-hourly-wage.js
//
// dom-shim.js로 실제 HTML의 <script>를 그대로 실행해 검증한다(로직을 베껴 테스트하지 않음).
//
// 재현 버그: 시급 10,320원, 하루 8시간, 주 5일(=주 40시간) 입력 시
//   수정 전: 2,152,339원 (4.345주를 곱한 소수점 그대로 사용)
//   공식 기준: 2,156,880원 (월 209시간 기준, 고용노동부 2026년 최저임금 보도자료)
//   https://www.moel.go.kr/news/enews/report/enewsView.do?news_seq=18144 (확인: 2026-09-18)
//   "월 환산액은 2,156,880원(월 209시간 기준)"
//
// 수정: 월 환산 근로시간(주휴시간 포함)을 소수점 이하 반올림한 정수 시간으로 쓴다.
// 주 40시간 표준 사례에서만 209시간을 대입하는 방식이 아니라, 임의의 근무시간에도
// 같은 반올림 규칙(근무시간×4.345주 → 반올림)을 일반적으로 적용한다.

const path = require('path');
const { loadCalculator } = require('./dom-shim.js');

const HTML_PATH = path.join(__dirname, '..', 'tools', 'hourly-wage-calculator.html');

let pass = 0, fail = 0;
function check(label, actual, expected) {
  const ok = actual === expected;
  console.log((ok ? 'PASS' : 'FAIL') + ' - ' + label + ' (실제: ' + actual + ', 기대: ' + expected + ')');
  ok ? pass++ : fail++;
}

function extractAmount(html) {
  const m = html.match(/result-amount">([0-9,]+)</);
  if (!m) throw new Error('결과 금액을 찾지 못함: ' + html.slice(0, 200));
  return Number(m[1].replace(/,/g, ''));
}
function extractMonthlyHours(html) {
  const m = html.match(/월 환산 근로시간<\/span><span class="amount">([0-9]+)시간/);
  if (!m) throw new Error('월 환산 근로시간을 찾지 못함: ' + html.slice(0, 300));
  return Number(m[1]);
}

function runToMonthly(hourlyWage, dailyHours, weeklyDays) {
  const doc = loadCalculator(HTML_PATH);
  doc.getElementById('hourlyWage').value = String(hourlyWage);
  doc.getElementById('dailyHours').value = String(dailyHours);
  doc.getElementById('weeklyDays').value = String(weeklyDays);
  doc.getElementById('calcBtn').click();
  return doc.getElementById('resultCard').innerHTML;
}

function runToHourly(monthlyWageMan, dailyHours, weeklyDays) {
  const doc = loadCalculator(HTML_PATH);
  const btns = doc.querySelectorAll('#modeSeg button');
  for (const b of btns) if (b.dataset.value === 'toHourly') b.click();
  doc.getElementById('monthlyWage').value = String(monthlyWageMan);
  doc.getElementById('dailyHours').value = String(dailyHours);
  doc.getElementById('weeklyDays').value = String(weeklyDays);
  doc.getElementById('calcBtn').click();
  return doc.getElementById('resultCard').innerHTML;
}

console.log('=== 1. 정방향(시급→월급) — 주 40시간 표준 사례, 사용자가 재현한 버그 ===');
{
  const html = runToMonthly(10320, 8, 5);
  check('시급 10,320원·하루 8시간·주 5일의 예상 월급이 공식 기준(2,156,880원)과 일치', extractAmount(html), 2156880);
  check('월 환산 근로시간이 고용노동부 발표 기준인 209시간과 일치', extractMonthlyHours(html), 209);
}

console.log('\n=== 2. 역방향(월급→시급) — 월급 2,156,880원을 넣으면 시급 10,320원이 나와야 함 ===');
{
  const html = runToHourly(215.688, 8, 5);
  check('월급 2,156,880원(주 40시간)을 시급으로 환산하면 10,320원', extractAmount(html), 10320);
  check('역방향 계산도 월 환산 근로시간 209시간을 씀', extractMonthlyHours(html), 209);
}

console.log('\n=== 3. 단시간 근로 — 주 40시간이 아닌 경우까지 209시간을 그대로 쓰면 안 됨 ===');
{
  // 하루 5시간·주 5일 = 주 25시간 (본문 예시와 동일 조건)
  const html = runToMonthly(10320, 5, 5);
  const hours = extractMonthlyHours(html);
  check('주 25시간(단시간) 근무는 월 환산 근로시간이 209시간이 아니어야 함(비례 반영)', hours !== 209, true);
  check('주 25시간 근무의 월 환산 근로시간은 130시간(25+5주휴=30시간×4.345≈130.4 → 반올림)', hours, 130);
  check('주 25시간 근무의 예상 월급은 1,341,600원(130시간×10,320원)', extractAmount(html), 1341600);
}

console.log('\n=== 4. 주 15시간 미만 — 주휴수당 미적용 경계 ===');
{
  // 하루 7시간·주 2일 = 주 14시간(15시간 미만이라 주휴수당 없음)
  const html = runToMonthly(10320, 7, 2);
  check('주 14시간(주휴수당 미적용)은 주 근로시간 그대로 반영', html.includes('<span>주 근로시간</span><span class="amount">14시간</span>'), true);
  check('주 14시간은 주휴시간이 0.0시간', html.includes('<span>주휴시간(주휴수당분)</span><span class="amount">0.0시간</span>'), true);
}

console.log('\n=== 5. 최저임금 경계값 — 시급이 최저임금보다 1원 낮으면 경고, 같으면 정상 배지 ===');
{
  const below = runToMonthly(10319, 8, 5);
  check('시급 10,319원(최저임금 1원 미달)은 경고 문구가 표시됨', below.includes('class="warning"'), true);
  const exact = runToMonthly(10320, 8, 5);
  check('시급 10,320원(최저임금과 정확히 동일)은 정상(ok-badge)으로 표시됨', exact.includes('class="ok-badge"'), true);
}

console.log('\n=== 6. 회귀 테스트: 반올림을 제거하면 사용자가 재현한 버그(2,152,339원)가 다시 나와야 함 ===');
{
  const fs = require('fs');
  const os = require('os');
  const original = fs.readFileSync(HTML_PATH, 'utf8');
  const broken = original.replace(
    'const monthlyHours = Math.round(totalWeeklyHours * WEEKS_PER_MONTH);',
    'const monthlyHours = totalWeeklyHours * WEEKS_PER_MONTH;'
  );
  if (broken === original) {
    console.log('FAIL - 회귀 테스트: 반올림 코드를 찾지 못해 깨뜨리지 못함');
    fail++;
  } else {
    const tmp = path.join(os.tmpdir(), 'hourly-wage-broken-rounding.html');
    fs.writeFileSync(tmp, broken, 'utf8');
    const doc = loadCalculator(tmp);
    doc.getElementById('hourlyWage').value = '10320';
    doc.getElementById('dailyHours').value = '8';
    doc.getElementById('weeklyDays').value = '5';
    doc.getElementById('calcBtn').click();
    const brokenAmount = extractAmount(doc.getElementById('resultCard').innerHTML);
    check('반올림을 제거하면 사용자가 지적한 2,152,339원으로 되돌아가야 함(테스트가 회귀를 잡아냄)', brokenAmount, 2152339);
    fs.unlinkSync(tmp);
  }
}

console.log('\n결과: ' + pass + '개 통과, ' + fail + '개 실패');
if (fail > 0) process.exit(1);
