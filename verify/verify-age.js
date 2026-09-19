// 만 나이 계산기 — 나이 계산과 기본 기준일(한국 시간 자정~오전 9시 UTC 날짜 밀림) 검증 (실제 HTML 실행)
const path = require('path'); const fs = require('fs'); const os = require('os');
const { loadCalculator } = require('./dom-shim.js');
const HTML = path.join(__dirname, '..', 'tools', 'age-calculator.html');
let pass = 0, fail = 0;
function check(l, a, e) { const ok = a === e; console.log((ok ? 'PASS' : 'FAIL') + ' - ' + l + ' (실제: ' + a + ', 기대: ' + e + ')'); ok ? pass++ : fail++; }
function ages(file, birth, base, opts) {
  const d = loadCalculator(file, opts);
  d.getElementById('birth').value = birth; if (base) d.getElementById('baseDate').value = base;
  d.getElementById('calcBtn').click();
  const b = d.getElementById('breakdown').innerHTML;
  return { intl: d.getElementById('internationalAge').textContent, counting: /세는나이[^<]*<\/span><span class="amount">(\d+)세/.exec(b)[1], year: /연 나이[^<]*<\/span><span class="amount">(\d+)세/.exec(b)[1] };
}
console.log('=== 1. 생일 전후 (2000-09-20생) ===');
{ let r = ages(HTML, '2000-09-20', '2026-09-12'); check('생일 전: 만 25세', r.intl, '25세'); check('세는나이 27', r.counting, '27'); check('연 나이 26', r.year, '26');
  r = ages(HTML, '2000-09-20', '2026-09-20'); check('생일 당일: 만 26세(당일 0시부터)', r.intl, '26세');
  r = ages(HTML, '2000-09-20', '2026-09-19'); check('생일 전날: 만 25세', r.intl, '25세'); }
console.log('\n=== 2. 기본 기준일은 기기의 현지 날짜여야 함(UTC 날짜로 하루 밀리면 안 됨) ===');
{
  // 한국 시간 2026-09-19 08:30 = UTC 2026-09-18 23:30. 기본 기준일은 2026-09-19여야 한다.
  const src = fs.readFileSync(HTML, 'utf8');
  const RealDate = Date;
  const d = loadCalculator(HTML, { mockNow: '2026-09-19T08:30:00'.slice(0, 10) });
  // mockNow는 자정 고정이므로, 자정(현지) 기준에서도 UTC로는 전날이 되는 시간대에서만 재현된다. 로직을 직접 확인한다.
  check('기본 기준일이 현지 날짜(2026-09-19)', d.getElementById('baseDate').value, '2026-09-19');
  const broken = src.replace(/\$\('baseDate'\)\.value = today\.getFullYear\(\)[^\n]*\n/, "$('baseDate').value = today.toISOString().slice(0, 10);\n");
  if (broken === src) { console.log('FAIL - 깨뜨릴 코드를 찾지 못함'); fail++; }
  else {
    const tmp = path.join(os.tmpdir(), 'age-broken.html'); fs.writeFileSync(tmp, broken, 'utf8');
    const v = loadCalculator(tmp, { mockNow: '2026-09-19' }).getElementById('baseDate').value;
    // 한국 시간대(UTC+9) 실행 환경에서는 자정 고정 시 UTC 날짜가 전날이 되어 옛 코드가 2026-09-18을 낸다.
    const offset = new RealDate(2026, 8, 19).getTimezoneOffset();
    if (offset < 0) check('옛 코드(toISOString)로 되돌리면 UTC+ 시간대에서 하루 밀림(테스트가 회귀를 잡아냄)', v, '2026-09-18');
    else console.log('SKIP - 이 실행 환경은 UTC 이하 시간대라 회귀 재현 불가(offset ' + offset + ')');
    fs.unlinkSync(tmp);
  }
}
console.log('\n결과: ' + pass + '개 통과, ' + fail + '개 실패'); if (fail > 0) process.exit(1);
