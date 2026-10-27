// 출산 예정일 계산기 — 예정일과 임신 주수의 일관성 검증 (실제 HTML 실행, 오늘 날짜 고정)
// 기준: 질병관리청 국가건강정보포털 — 총 임신 기간은 마지막 월경 첫날부터 약 280일(40주)
// https://health.kdca.go.kr/healthinfo/biz/health/gnrlzHealthInfo/gnrlzHealthInfo/gnrlzHealthInfoView.do?cntnts_sn=6301 (확인: 2026-09-19)
const path = require('path'); const fs = require('fs'); const os = require('os');
const { loadCalculator } = require('./dom-shim.js');
const HTML = path.join(__dirname, '..', 'tools', 'due-date-calculator.html');
let pass = 0, fail = 0;
function check(l, a, e) { const ok = a === e; console.log((ok ? 'PASS' : 'FAIL') + ' - ' + l + ' (실제: ' + a + ', 기대: ' + e + ')'); ok ? pass++ : fail++; }
function run(file, lmp, cycle) {
  const d = loadCalculator(file, { mockNow: '2026-09-19' });
  d.getElementById('lmp').value = lmp; d.getElementById('cycle').value = String(cycle); d.getElementById('calcBtn').click();
  const t = d.getElementById('breakdown').innerHTML.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
  return { due: d.getElementById('dueDate').textContent, week: /(\d+주 \d+일)/.exec(t)[1], dday: /D[-+]\d+/.exec(t)[0] };
}
console.log('=== 1. 28일 주기: 마지막 월경 2026-07-11 → 예정일 = +280일, 오늘(09-19)은 70일째 = 10주 0일 ===');
{ const r = run(HTML, '2026-07-11', 28); check('예정일', r.due, '2027.04.17'); check('임신 주수', r.week, '10주 0일'); check('예정일까지', r.dday, 'D-210'); }
console.log('\n=== 2. 35일 주기: 예정일이 7일 늦어지면 임신 주수도 같은 기준으로 7일 보정되어야 함(주수 + 남은 일수 = 280일) ===');
{ const r = run(HTML, '2026-07-11', 35); check('예정일(+287일)', r.due, '2027.04.24'); check('임신 주수(63일 = 9주 0일)', r.week, '9주 0일'); check('예정일까지', r.dday, 'D-217'); }
console.log('\n=== 3. 회귀: 주수 보정을 빼면 35일 주기의 임신 주수가 10주 0일로 어긋나야 함 ===');
{
  const src = fs.readFileSync(HTML, 'utf8');
  const broken = src.replace('/ 86400000) - cycleAdjust;', '/ 86400000);');
  if (broken === src) { console.log('FAIL - 깨뜨릴 코드를 찾지 못함'); fail++; }
  else { const tmp = path.join(os.tmpdir(), 'due-broken.html'); fs.writeFileSync(tmp, broken, 'utf8'); check('보정 제거 시 10주 0일(테스트가 회귀를 잡아냄)', run(tmp, '2026-07-11', 35).week, '10주 0일'); fs.unlinkSync(tmp); }
}
console.log('\n결과: ' + pass + '개 통과, ' + fail + '개 실패'); if (fail > 0) process.exit(1);
