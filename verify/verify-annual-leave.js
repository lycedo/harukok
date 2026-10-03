// 연차수당 계산기 — 근무시간 입력 반영 검증 (실제 HTML 실행)
// 월 소정근로시간 = round((주 소정근로시간 + 주휴시간) × 4.345), 주 40시간이면 209시간(고용노동부 2026 최저임금 보도자료 기준).
const path = require('path'); const fs = require('fs'); const os = require('os');
const { loadCalculator } = require('./dom-shim.js');
const HTML = path.join(__dirname, '..', 'tools', 'annual-leave-pay-calculator.html');
let pass = 0, fail = 0;
function check(l, a, e) { const ok = a === e; console.log((ok ? 'PASS' : 'FAIL') + ' - ' + l + ' (실제: ' + a + ', 기대: ' + e + ')'); ok ? pass++ : fail++; }
function run(file, man, days, dh, dd) {
  const c = loadCalculator(file);
  c.getElementById('monthlyWage').value = String(man); c.getElementById('unusedDays').value = String(days);
  c.getElementById('dailyHours').value = String(dh); c.getElementById('weeklyDays').value = String(dd);
  c.getElementById('calcBtn').click();
  const b = c.getElementById('breakdown').innerHTML;
  return { total: Number(c.getElementById('totalAmount').textContent.replace(/[^0-9]/g, '')), hours: Number(/월 환산시간\(주휴 포함\)<\/span><span class="amount">(\d+)시간/.exec(b)[1]) };
}
console.log('=== 1. 주 40시간: 월 300만원, 5일 → 209시간, 시급 14,354원, 1일 114,833원, 총 574,165원(114,833원 × 5일) ===');
{ const r = run(HTML, 300, 5, 8, 5); check('월 소정근로시간', r.hours, 209); check('총 연차수당(114,833원 × 5일)', r.total, 574165); }
console.log('\n=== 2. 단시간(하루 5시간·주 4일=20시간): 209시간을 그대로 쓰면 안 됨 ===');
{ const r = run(HTML, 150, 5, 5, 4); check('월 소정근로시간(20+4주휴=24h×4.345≈104)', r.hours, 104); check('1일 통상임금 72,115원×5일', r.total, 360575); }
console.log('\n=== 3. 회귀: 209시간 고정으로 되돌리면 단시간 사례 검증이 실패해야 함 ===');
{
  const src = fs.readFileSync(HTML, 'utf8');
  const broken = src.replace('const monthlyHours = Math.round((weeklyHours + holidayHours) * WEEKS_PER_MONTH);', 'const monthlyHours = 209;');
  if (broken === src) { console.log('FAIL - 깨뜨릴 코드를 찾지 못함'); fail++; }
  else { const t = path.join(os.tmpdir(), 'al-broken.html'); fs.writeFileSync(t, broken, 'utf8'); check('209시간 고정 시 단시간 사례가 104시간이 아니게 됨(테스트가 회귀를 잡아냄)', run(t, 150, 5, 5, 4).hours === 104, false); fs.unlinkSync(t); }
}
console.log('\n=== 4. 결과 옆 확인 상태: 소멸 연차 일괄 제외 가정 없음, 근무형태별 공식 확인/미확인 구분 ===');
{
  function status(man, days, dh, dd) {
    const c = loadCalculator(HTML);
    c.getElementById('monthlyWage').value = String(man); c.getElementById('unusedDays').value = String(days);
    c.getElementById('dailyHours').value = String(dh); c.getElementById('weeklyDays').value = String(dd);
    c.getElementById('calcBtn').click();
    return c.getElementById('checkStatus').innerHTML;
  }
  const std = status(300, 9, 8, 5);
  check('정산 대상 일수는 입력 가정이며 소멸과 수당 청구권이 별개임을 결과 옆에 표시', std.includes('입력 가정') && std.includes('미사용수당 청구권은 별개'), true);
  check('주 40시간이면 209시간이 공식 확인으로 표시됨', std.includes('공식 확인') && !std.includes('미확인'), true);
  const part = status(150, 5, 5, 4);
  check('주 40시간이 아니면 월 환산시간이 미확인으로 표시됨', part.includes('미확인'), true);
}
console.log('\n결과: ' + pass + '개 통과, ' + fail + '개 실패'); if (fail > 0) process.exit(1);
