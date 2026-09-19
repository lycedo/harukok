// 실업급여 계산기 — 소정급여일수 표 검증 (실제 HTML 실행)
// 근거: 고용보험법 별표1 / 찾기쉬운 생활법령정보 "구직급여 수급일수"
// https://easylaw.go.kr/CSP/CnpClsMain.laf?popMenu=ov&csmSeq=722&ccfNo=2&cciNo=3&cnpClsNo=1 (확인: 2026-09-19)
// 기대값은 공식 표에서 옮긴 값이며 사이트 코드에서 가져오지 않았다.
const path = require('path');
const fs = require('fs');
const os = require('os');
const { loadCalculator } = require('./dom-shim.js');
const HTML = path.join(__dirname, '..', 'tools', 'unemployment-benefit-calculator.html');

let pass = 0, fail = 0;
function check(label, actual, expected) {
  const ok = actual === expected;
  console.log((ok ? 'PASS' : 'FAIL') + ' - ' + label + ' (실제: ' + actual + ', 기대: ' + expected + ')');
  ok ? pass++ : fail++;
}
function days(file, age, tenure) {
  const doc = loadCalculator(file);
  for (const b of doc.querySelectorAll('#ageSeg button')) if (b.dataset.value === age) b.click();
  for (const b of doc.querySelectorAll('#tenureSeg button')) if (b.dataset.value === tenure) b.click();
  doc.getElementById('wage3m').value = '300';
  doc.getElementById('calcBtn').click();
  const m = doc.getElementById('breakdown').innerHTML.match(/소정급여일수<\/span><span class="amount">(\d+)일/);
  return m ? Number(m[1]) : null;
}

const TABLE = {
  under50: { '1': 120, '3': 150, '5': 180, '10': 210, '99': 240 },
  over50:  { '1': 120, '3': 180, '5': 210, '10': 240, '99': 270 },
};
console.log('=== 1. 소정급여일수 표 전체(연령 2 × 가입기간 5) ===');
for (const age of Object.keys(TABLE))
  for (const t of Object.keys(TABLE[age]))
    check(age + ' / 가입기간 구분 ' + t, days(HTML, age, t), TABLE[age][t]);

console.log('\n=== 2. 회귀: 50세 이상 1~3년을 옛 값(150일)으로 되돌리면 검증이 실패해야 함 ===');
{
  const src = fs.readFileSync(HTML, 'utf8');
  const broken = src.replace('over50:  { 1: 120, 3: 180, 5: 210,', 'over50:  { 1: 120, 3: 150, 5: 180,');
  if (broken === src) { console.log('FAIL - 깨뜨릴 코드를 찾지 못함'); fail++; }
  else {
    const tmp = path.join(os.tmpdir(), 'unemp-broken.html');
    fs.writeFileSync(tmp, broken, 'utf8');
    check('옛 값으로 되돌리면 50세 이상 1~3년이 150일로 나옴(테스트가 회귀를 잡아냄)', days(tmp, 'over50', '3'), 150);
    fs.unlinkSync(tmp);
  }
}
console.log('\n=== 3. 1일 평균임금 = 3개월 임금 총액 ÷ 그 기간의 실제 일수 (월급÷30 근사가 아님) ===');
{
  // 기대값은 손계산: 월 340만원 → 3개월 1,020만원. 92일: 110,870원 × 60% = 66,522원(상·하한 사이).
  // 월급÷30 방식이면 113,333원 × 60% = 68,000원이라 값이 달라진다. 89일이면 68,764원 → 상한 68,100원.
  function daily(file, man, days) {
    const doc = loadCalculator(file);
    doc.getElementById('wage3m').value = String(man);
    doc.getElementById('days3m').value = String(days);
    doc.getElementById('calcBtn').click();
    const m = doc.getElementById('breakdown').innerHTML.match(/구직급여일액<\/span><span class="amount">([0-9,]+)원/);
    return Number(m[1].replace(/,/g, ''));
  }
  check('월 340만원·92일 → 66,522원(월급÷30 방식이면 68,000원)', daily(HTML, 340, 92), 66522);
  check('월 340만원·89일 → 상한 68,100원 적용', daily(HTML, 340, 89), 68100);
  check('월 200만원·92일 → 하한 66,048원 적용', daily(HTML, 200, 92), 66048);
}
console.log('\n=== 4. 표시된 일액 × 일수 = 총액 (화면 숫자가 서로 맞아야 함) ===');
{
  const doc = loadCalculator(HTML);
  for (const b of doc.querySelectorAll('#ageSeg button')) if (b.dataset.value === 'over50') b.click();
  for (const b of doc.querySelectorAll('#tenureSeg button')) if (b.dataset.value === '5') b.click();
  doc.getElementById('wage3m').value = '340'; doc.getElementById('days3m').value = '92'; doc.getElementById('calcBtn').click();
  const t = doc.getElementById('breakdown').innerHTML;
  const day = Number(/구직급여일액<\/span><span class="amount">([0-9,]+)원/.exec(t)[1].replace(/,/g, ''));
  const days = Number(/소정급여일수<\/span><span class="amount">(\d+)일/.exec(t)[1]);
  const total = Number(doc.getElementById('totalAmount').textContent.replace(/[^0-9]/g, ''));
  check('표시된 일액 × 일수 = 총액', total, day * days);
  check('총액 13,969,620원(66,522 × 210)', total, 13969620);
}
console.log('\n결과: ' + pass + '개 통과, ' + fail + '개 실패');
if (fail > 0) process.exit(1);
