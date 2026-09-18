// 퇴직금 계산기(tools/severance-pay-calculator.html) 검증
// 실행: node verify/verify-severance.js
//
// dom-shim.js로 실제 HTML 파일의 <script>를 그대로 읽어 실행하고, 입력값을 채운 뒤
// 계산 버튼을 눌러 실제로 표시되는 결과를 확인한다(로직을 별도 함수로 베껴 테스트하지 않음).
// 기대값은 계산기 코드를 복사한 것이 아니라 아래처럼 독립적으로 손으로 계산했다.
//   - 월말 케이스: 민법 제160조 제3항("최종의 월에 해당일이 없는 때에는 그 월의 말일로
//     기간이 만료한다")에 따라 2026-05-31의 3개월 전은 2026-02-28(2월 말일)이어야 한다.
//   - 1년 지급요건: 재직일수가 아니라 입사일로부터 만 1년이 되는 날(응당일)에 도달했는지로
//     판정해야 하며, 윤년이 낀 구간에서는 재직일수 365일로도 응당일에 못 미칠 수 있다.

const path = require('path');
const { loadCalculator } = require('./dom-shim.js');

const HTML_PATH = path.join(__dirname, '..', 'tools', 'severance-pay-calculator.html');

let pass = 0, fail = 0;
function check(label, actual, expected) {
  const ok = actual === expected;
  console.log((ok ? 'PASS' : 'FAIL') + ' - ' + label + ' (실제: ' + actual + ', 기대: ' + expected + ')');
  ok ? pass++ : fail++;
}

function run(join, leave, wage3m) {
  const doc = loadCalculator(HTML_PATH);
  doc.getElementById('joinDate').value = join;
  doc.getElementById('leaveDate').value = leave;
  doc.getElementById('wage3m').value = String(wage3m);
  doc.getElementById('calcBtn').click();
  return {
    amountText: doc.getElementById('severanceAmount').textContent.trim(),
    breakdownText: doc.getElementById('breakdown').textContent.trim(),
    hidden: doc.getElementById('resultCard').classList.contains('hidden'),
  };
}

console.log('=== 1. 사용자가 재현한 버그: 2024-01-01 입사 / 2024-12-31 퇴사 (윤년, 재직일수 365일) ===');
console.log('   독립 계산: 2024년은 윤년이라 입사일로부터 만 1년째 되는 날은 2025-01-01. 퇴사일이 그 하루 전이므로 1년 미만 → 0원이어야 함.');
{
  const r = run('2024-01-01', '2024-12-31', 900);
  check('결과 금액은 0원(지급요건 미충족)', r.amountText, '0원');
  check('경고 문구에 "1년 미만" 포함', r.breakdownText.includes('1년 미만'), true);
}

console.log('\n=== 2. 같은 입사일, 퇴사일을 하루 늦춰 2025-01-01(응당일 도달) ===');
console.log('   독립 계산: 재직일수 366일(2024 윤년), 3개월 산정기간은 2024-10-01~2025-01-01=92일,');
console.log('   1일 평균임금 = 900만/92 ≈ 97,826.09, 퇴직금 = 97,826.09×30×(366/365) ≈ 2,942,822.7원');
{
  const r = run('2024-01-01', '2025-01-01', 900);
  check('지급요건 충족 시 0원이 아니어야 함', r.amountText !== '0원', true);
  const amount = Number(r.amountText.replace(/[^0-9]/g, ''));
  const expected = (9000000 / 92) * 30 * (366 / 365);
  check('퇴직금 금액이 독립 계산과 일치(반올림 오차 1원 이내)', Math.abs(amount - Math.round(expected)) <= 1, true);
}

console.log('\n=== 3. 정확히 365일이지만 평년(윤년 아님)인 경우는 1년 이상이어야 함 ===');
console.log('   독립 계산: 2025-01-10 입사 → 2025년은 평년이므로 만 1년째 되는 날은 2026-01-10. 퇴사일이 그날이면 도달 → 1년 이상.');
{
  const r = run('2025-01-10', '2026-01-10', 900);
  check('평년 365일 경과 시 지급요건 충족', r.amountText !== '0원', true);
}

console.log('\n=== 4. 364일(명백히 1년 미만)인 경우는 항상 0원 ===');
{
  const r = run('2025-01-10', '2026-01-09', 900);
  check('364일이면 0원', r.amountText, '0원');
}

console.log('\n=== 5. 월말 3개월 산정기간(민법 제160조 제3항 — 말일 고정) ===');
console.log('   독립 계산: 2026-05-31의 3개월 전은 2026-02-28(2026년은 평년, 2월 28일까지). 산정기간 일수 = 92일.');
{
  // 재직일수를 충분히 크게 잡아 지급요건 분기에 걸리지 않게 한다.
  const r = run('2020-01-01', '2026-05-31', 900);
  check('평균임금 산정기간이 92일로 표시됨(월말 밀림 버그 없음)', r.breakdownText.includes('92일'), true);
  const amount = Number(r.amountText.replace(/[^0-9]/g, ''));
  const tenureDays = Math.round((new Date(2026, 4, 31) - new Date(2020, 0, 1)) / 86400000);
  const expected = (9000000 / 92) * 30 * (tenureDays / 365);
  check('금액도 92일 기준 독립 계산과 일치(반올림 오차 1원 이내)', Math.abs(amount - Math.round(expected)) <= 1, true);
}

console.log('\n=== 6. 2024-02-29(윤년) 입사자의 응당일 경계 — 애매한 하루는 "판정 보류"여야 함 ===');
console.log('   민법 제160조 제3항(최종의 월에 해당일이 없으면 그 달 말일로 만료)만 보면 만료일은 2025-02-28.');
console.log('   그러나 제159조(기간은 말일의 "종료"로 만료)를 함께 적용하면 만료 시점은 2025-02-28이 끝나는');
console.log('   순간(=2025-03-01 0시)이 되어, 이 계산기의 "퇴사일(마지막 근무일 다음날)" 값으로 정리하면');
console.log('   2025-02-28과 2025-03-01 중 어느 쪽이 "정확히 1년"인지 조문만으로는 결론이 갈린다.');
console.log('   이를 직접 다룬 대법원 판례·고용노동부 행정해석 원문을 확인하지 못했으므로, 이 계산기는');
console.log('   퇴사일이 정확히 그 2025-02-28인 경우 지급액을 확정하지 않고 "판정 보류"를 표시해야 한다.');
console.log('   (2025-02-27 이전은 두 해석 모두에서 1년 미만, 2025-03-01 이후는 두 해석 모두에서 1년');
console.log('   이상이므로 이 두 지점은 모호하지 않다 — 애매한 지점은 2025-02-28 단 하루뿐이다.)');
{
  const before = run('2024-02-29', '2025-02-27', 900); // 어느 해석으로도 명백히 1년 미만
  const boundary = run('2024-02-29', '2025-02-28', 900); // 해석에 따라 결론이 갈리는 유일한 날
  const after = run('2024-02-29', '2025-03-01', 900); // 어느 해석으로도 명백히 1년 이상

  check('2025-02-27 퇴사(명백히 1년 미만)는 0원', before.amountText, '0원');
  check('2025-02-27 퇴사는 "1년 미만" 경고를 보여줌', before.breakdownText.includes('1년 미만'), true);

  check('2025-02-28 퇴사(해석이 갈리는 경계)는 금액을 확정하지 않고 "판정 보류"를 표시', boundary.amountText, '판정 보류');
  check('판정 보류 사유(대법원 판례·행정해석 미확인)가 안내됨', boundary.breakdownText.includes('행정해석'), true);
  check('판정 보류 상태에서는 금액에 숫자가 없음(지급액을 임의로 정하지 않음)', /\d/.test(boundary.amountText), false);

  check('2025-03-01 퇴사(명백히 1년 이상)는 정상 계산됨(0원도 판정 보류도 아님)', after.amountText !== '0원' && after.amountText !== '판정 보류', true);
}

console.log('\n=== 7. 회귀 테스트: 실제 구현을 일부러 깨뜨리면 테스트가 실패하는지 확인 ===');
{
  const fs = require('fs');
  const os = require('os');
  const original = fs.readFileSync(HTML_PATH, 'utf8');

  // 7-1. 월말 클램프 로직을 일부러 예전 버그 있는 setMonth 방식으로 되돌려본다.
  const brokenClamp = original.replace(
    /function subtractMonthsClamped\(date, months\)\{[\s\S]*?\n  \}/,
    "function subtractMonthsClamped(date, months){\n    const d = new Date(date);\n    d.setMonth(d.getMonth() - months);\n    return d;\n  }"
  );
  if (brokenClamp === original) {
    console.log('FAIL - 회귀 테스트 7-1: subtractMonthsClamped 함수를 찾지 못해 깨뜨리지 못함');
    fail++;
  } else {
    const tmp1 = path.join(os.tmpdir(), 'severance-broken-clamp.html');
    fs.writeFileSync(tmp1, brokenClamp, 'utf8');
    const doc = loadCalculator(tmp1);
    doc.getElementById('joinDate').value = '2020-01-01';
    doc.getElementById('leaveDate').value = '2026-05-31';
    doc.getElementById('wage3m').value = '900';
    doc.getElementById('calcBtn').click();
    const broke = !doc.getElementById('breakdown').textContent.includes('92일');
    check('월말 클램프를 되돌리면(구 버그 재현) 92일 검증이 실패해야 함(테스트가 버그를 잡아냄)', broke, true);
    fs.unlinkSync(tmp1);
  }

  // 7-2. 1년 지급요건 판정을 일부러 옛 "365일" 방식으로 되돌려본다.
  const brokenEligibility = original.replace(
    'const eligible = hasOneYearOrMore(joinDate, leaveDate);',
    'const eligible = tenureDays >= 365;'
  );
  if (brokenEligibility === original) {
    console.log('FAIL - 회귀 테스트 7-2: eligible 판정 라인을 찾지 못해 깨뜨리지 못함');
    fail++;
  } else {
    const tmp2 = path.join(os.tmpdir(), 'severance-broken-eligibility.html');
    fs.writeFileSync(tmp2, brokenEligibility, 'utf8');
    const doc2 = loadCalculator(tmp2);
    doc2.getElementById('joinDate').value = '2024-01-01';
    doc2.getElementById('leaveDate').value = '2024-12-31';
    doc2.getElementById('wage3m').value = '900';
    doc2.getElementById('calcBtn').click();
    const broke2 = doc2.getElementById('severanceAmount').textContent.trim() !== '0원';
    check('1년 판정을 365일 방식으로 되돌리면 사용자가 재현한 버그가 다시 나타나야 함(테스트가 버그를 잡아냄)', broke2, true);
    fs.unlinkSync(tmp2);
  }

  // 7-3. isAmbiguousLeapBoundary 자체를 무력화(항상 false)해본다 — 이 함수가 없으면
  // 2025-02-28 입력이 (조문 해석이 갈리는데도) hasOneYearOrMore로 넘어가 단정적인
  // 숫자를 내놓게 된다. "판정 보류"가 실제로 이 함수에 의해 지켜지는지 확인한다.
  const brokenAmbiguous = original.replace(
    'if (isAmbiguousLeapBoundary(joinDate, leaveDate)){',
    'if (false && isAmbiguousLeapBoundary(joinDate, leaveDate)){'
  );
  if (brokenAmbiguous === original) {
    console.log('FAIL - 회귀 테스트 7-3: isAmbiguousLeapBoundary 호출부를 찾지 못해 깨뜨리지 못함');
    fail++;
  } else {
    const tmp3 = path.join(os.tmpdir(), 'severance-broken-ambiguous.html');
    fs.writeFileSync(tmp3, brokenAmbiguous, 'utf8');
    const doc3 = loadCalculator(tmp3);
    doc3.getElementById('joinDate').value = '2024-02-29';
    doc3.getElementById('leaveDate').value = '2025-02-28';
    doc3.getElementById('wage3m').value = '900';
    doc3.getElementById('calcBtn').click();
    // 판정 보류 분기를 막으면, 애매한 날짜인데도 "판정 보류"가 아니라 단정적인 결과(0원 또는
    // 구체적 금액)가 나와야 한다 — 즉 '판정 보류' 문구가 사라져야 회귀가 재현된 것이다.
    const broke3 = doc3.getElementById('severanceAmount').textContent.trim() !== '판정 보류';
    check('판정 보류 분기를 제거하면 애매한 날짜에도 단정적인 결과가 나와야 함(테스트가 회귀를 잡아냄)', broke3, true);
    fs.unlinkSync(tmp3);
  }
}

console.log('\n결과: ' + pass + '개 통과, ' + fail + '개 실패');
if (fail > 0) process.exit(1);
