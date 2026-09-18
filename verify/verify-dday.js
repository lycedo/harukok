// 디데이 계산기(tools/dday-calculator.html) 검증
// 실행: node verify/verify-dday.js
//
// dom-shim.js로 실제 HTML의 <script>를 그대로 실행해 검증한다(로직을 베껴 테스트하지 않음).
// "오늘"은 Date를 고정하는 mockNow 옵션으로 재현 가능하게 만든다.
// 수능일 기대값은 교육부 보도자료로 직접 확인한 값이다(2024.8.16., 2026.8.18. 발표 등).

const path = require('path');
const fs = require('fs');
const os = require('os');
const { loadCalculator } = require('./dom-shim.js');

const HTML_PATH = path.join(__dirname, '..', 'tools', 'dday-calculator.html');

let pass = 0, fail = 0;
function check(label, actual, expected) {
  const ok = actual === expected;
  console.log((ok ? 'PASS' : 'FAIL') + ' - ' + label + ' (실제: ' + actual + ', 기대: ' + expected + ')');
  ok ? pass++ : fail++;
}

function clickQuickButtonContaining(doc, text) {
  const btns = doc.getElementById('quickButtons').children;
  const btn = btns.find(b => b.textContent.includes(text));
  if (!btn) throw new Error('버튼을 찾지 못함: ' + text);
  btn.click();
}

console.log('=== 1. 기준일 기본값이 한국 시간대에서 오늘 날짜로 정확히 채워지는지 ===');
{
  const doc = loadCalculator(HTML_PATH, { mockNow: '2026-09-18' });
  check('targetDate 기본값이 오늘(2026-09-18)', doc.getElementById('targetDate').value, '2026-09-18');
}

console.log('\n=== 2. 수능일 버튼 — 2026-09-18 기준으로는 2026-11-19(2027학년도)를 가리켜야 함 ===');
console.log('   근거: 교육부 보도자료(2024.8.16.) "2027학년도 대학수학능력시험은 2026년 11월 19일(목)에 시행됩니다"');
{
  const doc = loadCalculator(HTML_PATH, { mockNow: '2026-09-18' });
  clickQuickButtonContaining(doc, '수능');
  check('수능일 버튼 클릭 시 targetDate', doc.getElementById('targetDate').value, '2026-11-19');
}

console.log('\n=== 3. 2026년 수능이 지난 뒤(2026-11-20 기준)에는 다음 발표분(2027-11-18)을 가리켜야 함 ===');
console.log('   근거: 정책브리핑(교육부) "2028학년도 대학수학능력시험은 2027년 11월 18일(목)에 시행됩니다"');
{
  const doc = loadCalculator(HTML_PATH, { mockNow: '2026-11-20' });
  clickQuickButtonContaining(doc, '수능');
  check('2026-11-20 기준 수능일 버튼 targetDate', doc.getElementById('targetDate').value, '2027-11-18');
}

console.log('\n=== 4. 발표된 마지막 회차(2028-11-16)까지 지난 시점에는 수능일 버튼 자체가 없어야 함(날짜를 지어내지 않음) ===');
{
  const doc = loadCalculator(HTML_PATH, { mockNow: '2028-12-01' });
  const labels = doc.getElementById('quickButtons').children.map(b => b.textContent);
  check('수능일 버튼이 생성되지 않음', labels.some(l => l.includes('수능')), false);
}

console.log('\n=== 5. 디데이 계산 자체(D-DAY/D-/D+ 표기)가 실제 결과 엘리먼트에 정확히 반영되는지 ===');
{
  const doc = loadCalculator(HTML_PATH, { mockNow: '2026-09-18' });
  doc.getElementById('targetDate').value = '2026-09-28';
  doc.getElementById('calcBtn').click();
  check('10일 뒤 날짜는 D-10', doc.getElementById('ddayAmount').textContent, 'D-10');

  doc.getElementById('targetDate').value = '2026-09-18';
  doc.getElementById('calcBtn').click();
  check('오늘 날짜는 D-DAY', doc.getElementById('ddayAmount').textContent, 'D-DAY');

  doc.getElementById('targetDate').value = '2026-09-08';
  doc.getElementById('calcBtn').click();
  check('10일 전 날짜는 D+10', doc.getElementById('ddayAmount').textContent, 'D+10');
}

console.log('\n=== 6. 회귀 테스트: 실제 구현을 일부러 깨뜨리면 테스트가 실패하는지 확인 ===');
{
  const original = fs.readFileSync(HTML_PATH, 'utf8');

  // 6-1. 수능일을 다시 "11/13 고정"으로 되돌려본다(예전 버그 재현).
  const brokenSuneung = original.replace(
    "{ label: '수능일(공식 발표분)', date: nextKnownSuneung, optional: true },",
    "{ label: '올해 수능(11/13)', date: () => nextOccurrence(11, 13) },"
  );
  if (brokenSuneung === original) {
    console.log('FAIL - 회귀 테스트 6-1: 수능일 버튼 정의를 찾지 못해 깨뜨리지 못함');
    fail++;
  } else {
    const tmp = path.join(os.tmpdir(), 'dday-broken-suneung.html');
    fs.writeFileSync(tmp, brokenSuneung, 'utf8');
    const doc = loadCalculator(tmp, { mockNow: '2026-09-18' });
    clickQuickButtonContaining(doc, '수능');
    const broke = doc.getElementById('targetDate').value !== '2026-11-19';
    check('11/13 고정 로직으로 되돌리면 검증이 실패해야 함(테스트가 버그를 잡아냄)', broke, true);
    fs.unlinkSync(tmp);
  }

  // 6-2. fmt()를 다시 toISOString 기반(구 타임존 버그)으로 되돌려본다.
  const brokenFmt = original.replace(
    /function fmt\(d\)\{[\s\S]*?\n  \}/,
    "function fmt(d){ return d.toISOString().slice(0, 10); }"
  );
  if (brokenFmt === original) {
    console.log('FAIL - 회귀 테스트 6-2: fmt 함수를 찾지 못해 깨뜨리지 못함');
    fail++;
  } else {
    const tmp2 = path.join(os.tmpdir(), 'dday-broken-fmt.html');
    fs.writeFileSync(tmp2, brokenFmt, 'utf8');
    const doc2 = loadCalculator(tmp2, { mockNow: '2026-09-18' });
    const broke2 = doc2.getElementById('targetDate').value !== '2026-09-18';
    check('toISOString 기반 포맷으로 되돌리면(한국 시간대 하루 밀림) 검증이 실패해야 함', broke2, true);
    fs.unlinkSync(tmp2);
  }
}

console.log('\n결과: ' + pass + '개 통과, ' + fail + '개 실패');
if (fail > 0) process.exit(1);
