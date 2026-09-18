// 연말정산 예상세액 계산기(tools/year-end-tax-calculator.html) — 근로소득공제 상한 검증
// 실행: node verify/verify-year-end-tax.js
//
// dom-shim.js로 실제 HTML의 <script>를 그대로 실행해 검증한다(로직을 베껴 테스트하지 않음).
// 이 파일은 salary-calculator.html과 근로소득공제 계산식을 공유하지만, 같은 코드를 쓴다는
// 이유로 검증을 생략하지 않고 이 파일도 똑같이 실제 HTML을 열어 별도로 확인한다.
//
// 근거: 국세청 "근로소득금액" 안내 페이지 — "근로소득공제금액은... 공제한도 2,000만원"
// https://nts.go.kr/nts/cm/cntnts/cntntsView.do?cntntsId=7871&mi=6435 (확인: 2026-09-18)
// 이 페이지의 구간별 공제율표(500만↓70%, 500~1,500만 40%, 1,500~4,500만 15%,
// 4,500만~1억 5%, 1억 초과 2%)도 이 계산기의 tier와 문구 그대로 일치함을 확인했다.

const path = require('path');
const fs = require('fs');
const os = require('os');
const { loadCalculator } = require('./dom-shim.js');

const HTML_PATH = path.join(__dirname, '..', 'tools', 'year-end-tax-calculator.html');

let pass = 0, fail = 0;
function check(label, actual, expected) {
  const ok = actual === expected;
  console.log((ok ? 'PASS' : 'FAIL') + ' - ' + label + ' (실제: ' + actual + ', 기대: ' + expected + ')');
  ok ? pass++ : fail++;
}

function deductionFor(grossMan) {
  const doc = loadCalculator(HTML_PATH);
  doc.getElementById('grossPay').value = String(grossMan);
  doc.getElementById('dependents').value = '1';
  doc.getElementById('calcBtn').click();
  const html = doc.getElementById('resultCard').innerHTML;
  const m = html.match(/근로소득공제<\/span><span class="amount">([0-9,]+)원/);
  if (!m) throw new Error('근로소득공제 값을 찾지 못함: ' + html.slice(0, 200));
  return Number(m[1].replace(/,/g, ''));
}

console.log('=== 1. 총급여 4억원 — 상한 없이 계산하면 2,075만원이 나오던 사례 ===');
console.log('   독립 계산(상한 미적용 시): 1,475만원 + (4억-1억)×2% = 2,075만원 — 실제로는 2,000만원을 넘을 수 없음');
{
  const d = deductionFor(40000);
  check('총급여 4억원의 근로소득공제는 2,000만원(상한)', d, 20000000);
}

console.log('\n=== 2. 상한 경계값 — 총급여 3억6,250만원 (상한에 정확히 도달) ===');
console.log('   독립 계산: 1,475만원 + (36,250만-10,000만)×2% = 1,475만원 + 525만원 = 2,000만원(경계)');
{
  const d = deductionFor(36250);
  check('총급여 3억6,250만원의 근로소득공제는 정확히 2,000만원(경계)', d, 20000000);
}

console.log('\n=== 3. 상한 바로 아래 — 총급여 3억6,000만원 (상한 미도달, 공식대로 계산) ===');
console.log('   독립 계산: 1,475만원 + (36,000만-10,000만)×2% = 1,475만원 + 520만원 = 1,995만원');
{
  const d = deductionFor(36000);
  check('총급여 3억6,000만원의 근로소득공제는 1,995만원(공식 그대로, 상한 미적용)', d, 19950000);
}

console.log('\n=== 4. 상한과 무관한 낮은 구간은 기존 공식 그대로 계산됨(회귀 없음 확인) ===');
console.log('   독립 계산: 총급여 3,380만원 → 750만원 + (3,380만-1,500만)×15% = 1,032만원 (국세청 예시와 동일)');
{
  const d = deductionFor(3380);
  check('총급여 3,380만원의 근로소득공제는 1,032만원(국세청 공식 예시와 일치)', d, 10320000);
}

console.log('\n=== 5. 회귀 테스트: 근로소득공제 상한을 제거하면 4억원 사례 검증이 실패해야 함 ===');
{
  const original = fs.readFileSync(HTML_PATH, 'utf8');
  const broken = original.replace(
    'return Math.min(deduction, 20000000);',
    'return deduction;'
  );
  if (broken === original) {
    console.log('FAIL - 회귀 테스트: 상한 적용 코드를 찾지 못해 깨뜨리지 못함');
    fail++;
  } else {
    const tmp = path.join(os.tmpdir(), 'year-end-tax-broken-cap.html');
    fs.writeFileSync(tmp, broken, 'utf8');
    const doc = loadCalculator(tmp);
    doc.getElementById('grossPay').value = '40000';
    doc.getElementById('dependents').value = '1';
    doc.getElementById('calcBtn').click();
    const html = doc.getElementById('resultCard').innerHTML;
    const m = html.match(/근로소득공제<\/span><span class="amount">([0-9,]+)원/);
    const brokenDeduction = Number(m[1].replace(/,/g, ''));
    const broke = brokenDeduction === 20750000;
    check('상한을 제거하면 4억원 사례가 사용자가 지적한 2,075만원으로 되돌아가야 함(테스트가 회귀를 잡아냄)', broke, true);
    fs.unlinkSync(tmp);
  }
}

console.log('\n결과: ' + pass + '개 통과, ' + fail + '개 실패');
if (fail > 0) process.exit(1);
