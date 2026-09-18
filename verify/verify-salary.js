// 연봉 실수령액 계산기(tools/salary-calculator.html) — 자녀세액공제 검증
// 실행: node verify/verify-salary.js
//
// dom-shim.js로 실제 HTML의 <script>를 그대로 실행해 검증한다(로직을 베껴 테스트하지 않음).
//
// 기대값의 근거: 소득세법 제59조의2(자녀세액공제) — 1명 연 25만원, 2명 연 55만원,
// 3명 이상 연 55만원 + 2명 초과 인원당 연 40만원(국가법령정보센터, 법률 제21548호
// 2026.4.21. 개정 반영본으로 확인). 이 계산기는 소득세·지방소득세(10%)를 함께 줄이므로,
// 자녀 1명 늘 때 월 절감액은 연간 공제액 × 1.1 ÷ 12로 독립 계산했다.
// 인적공제(부양가족 1인당 150만원, 소득세법 제50조)는 자녀세액공제와 별개 항목이므로,
// "부양가족 수"를 바꾼 효과가 "자녀 수"를 바꾼 효과와 독립적으로 동일하게 나타나는지도
// 확인한다(기본공제 대상 조건과 자녀세액공제 대상 조건의 분리 검증).

const path = require('path');
const fs = require('fs');
const os = require('os');
const { loadCalculator } = require('./dom-shim.js');

const HTML_PATH = path.join(__dirname, '..', 'tools', 'salary-calculator.html');

let pass = 0, fail = 0;
function check(label, actual, expected) {
  const ok = actual === expected;
  console.log((ok ? 'PASS' : 'FAIL') + ' - ' + label + ' (실제: ' + actual + ', 기대: ' + expected + ')');
  ok ? pass++ : fail++;
}
function checkClose(label, actual, expected, tolerance) {
  const ok = Math.abs(actual - expected) <= tolerance;
  console.log((ok ? 'PASS' : 'FAIL') + ' - ' + label + ' (실제: ' + actual + ', 기대: ' + expected + ' ±' + tolerance + ')');
  ok ? pass++ : fail++;
}

function monthlyTax(htmlPath, { salary, nontax, dependents, children }) {
  const doc = loadCalculator(htmlPath);
  doc.getElementById('salary').value = String(salary);
  doc.getElementById('nontax').value = String(nontax);
  doc.getElementById('dependents').value = String(dependents);
  doc.getElementById('children').value = String(children);
  doc.getElementById('calcBtn').click();
  const bd = doc.getElementById('breakdown').textContent;
  const income = Number(bd.match(/소득세-([0-9,]+)원/)[1].replace(/,/g, ''));
  const local = Number(bd.match(/지방소득세-([0-9,]+)원/)[1].replace(/,/g, ''));
  return income + local;
}

// 세율 구간 영향을 피하기 위해 소득세가 0으로 바닥나지 않을 만큼 높은 연봉(8,000만원)에서 비교한다.
// dependents(부양가족 수, 본인 포함)는 5명으로 고정한다 — 이 계산기는 "자녀 수는 부양가족 수 − 1(본인)명을
// 넘을 수 없다"는 입력 검증을 하므로, 이 파일에서 최대로 테스트하는 자녀 4명(5-1=4)까지 유효하게 하기 위함이다.
const BASE = { salary: 8000, nontax: 20, dependents: 5 };

console.log('=== 1. 자녀세액공제 금액 — 1명 25만원, 2명 55만원, 3명 95만원, 4명 135만원(연간) ===');
console.log('   근거: 소득세법 제59조의2(법률 제21548호, 2026.4.21. 개정 반영) — 1명 25만원·2명 55만원·3명 이상 55만원+40만원×초과인원');
{
  const t0 = monthlyTax(HTML_PATH, { ...BASE, children: 0 });
  const t1 = monthlyTax(HTML_PATH, { ...BASE, children: 1 });
  const t2 = monthlyTax(HTML_PATH, { ...BASE, children: 2 });
  const t3 = monthlyTax(HTML_PATH, { ...BASE, children: 3 });
  const t4 = monthlyTax(HTML_PATH, { ...BASE, children: 4 });

  // 자녀세액공제는 연간 산출세액에서 차감되고, 그 10%인 지방소득세도 함께 줄어들므로
  // 월 절감액 = 연간 공제 증가분 × 1.1 ÷ 12
  checkClose('0명→1명: 월 절감액 ≈ 25만원×1.1/12', t0 - t1, Math.round(250000 * 1.1 / 12), 5);
  checkClose('1명→2명: 월 절감액 ≈ (55-25)만원×1.1/12', t1 - t2, Math.round(300000 * 1.1 / 12), 5);
  checkClose('2명→3명: 월 절감액 ≈ 40만원×1.1/12', t2 - t3, Math.round(400000 * 1.1 / 12), 5);
  checkClose('3명→4명: 월 절감액 ≈ 40만원×1.1/12', t3 - t4, Math.round(400000 * 1.1 / 12), 5);
}

console.log('\n=== 2. 기본공제(부양가족)와 자녀세액공제(자녀 수)는 서로 독립적인 항목이어야 함 ===');
console.log('   근거: 인적공제는 소득세법 제50조(부양가족 1인당 150만원), 자녀세액공제는 제59조의2 — 서로 다른 조문·다른 대상 요건');
{
  // children=0일 때 dependents 3→4로 바꾼 효과와, children=1일 때 dependents 3→4로 바꾼 효과가
  // 서로 같아야 한다(두 항목이 서로 영향을 주지 않고 독립적으로 더해지는 구조인지 확인).
  // dependents는 3·4 모두 사용해, children=1(부양가족 최소 2명 필요)에서도 두 값이 유효하도록 한다.
  const a1 = monthlyTax(HTML_PATH, { ...BASE, dependents: 3, children: 0 });
  const a2 = monthlyTax(HTML_PATH, { ...BASE, dependents: 4, children: 0 });
  const b1 = monthlyTax(HTML_PATH, { ...BASE, dependents: 3, children: 1 });
  const b2 = monthlyTax(HTML_PATH, { ...BASE, dependents: 4, children: 1 });
  checkClose('부양가족 3→4명 효과가 자녀 수와 무관하게 동일', (a1 - a2) - (b1 - b2), 0, 2);
}

console.log('\n=== 3. 자녀 수가 "부양가족 수 − 1(본인)"을 넘는 모순 입력은 계산하지 않고 경고해야 함 ===');
{
  const doc = loadCalculator(HTML_PATH);
  doc.getElementById('salary').value = '3500';
  doc.getElementById('nontax').value = '20';
  doc.getElementById('dependents').value = '1';
  doc.getElementById('children').value = '4';
  doc.getElementById('calcBtn').click();
  const net = doc.getElementById('netMonthly').textContent.trim();
  const warned = doc.getElementById('breakdown').textContent.includes('자녀세액공제 대상 자녀 수');
  check('부양가족 1명·자녀 4명(모순) 입력 시 실수령액을 계산하지 않음', net, '-');
  check('모순 입력 시 경고 문구가 표시됨', warned, true);

  // 경계값: 자녀 수 = 부양가족 수 − 1 은 유효해야 한다(본인 1명 + 자녀 전원).
  const doc2 = loadCalculator(HTML_PATH);
  doc2.getElementById('salary').value = '3500';
  doc2.getElementById('nontax').value = '20';
  doc2.getElementById('dependents').value = '3';
  doc2.getElementById('children').value = '2';
  doc2.getElementById('calcBtn').click();
  const net2 = doc2.getElementById('netMonthly').textContent.trim();
  check('부양가족 3명·자녀 2명(본인+자녀 전원, 경계값)은 정상 계산됨', net2 !== '-' && net2 !== '', true);
}

console.log('\n=== 4. 회귀 테스트: 자녀세액공제를 옛 금액(1명 15만원 등)으로 되돌리면 검증이 실패해야 함 ===');
{
  const original = fs.readFileSync(HTML_PATH, 'utf8');
  const broken = original.replace(
    /function childTaxCredit\(n\)\{[\s\S]*?\n  \}/,
    "function childTaxCredit(n){\n    if (n <= 0) return 0;\n    if (n === 1) return 150000;\n    if (n === 2) return 350000;\n    return 350000 + (n - 2) * 300000;\n  }"
  );
  if (broken === original) {
    console.log('FAIL - 회귀 테스트: childTaxCredit 함수를 찾지 못해 깨뜨리지 못함');
    fail++;
  } else {
    const tmp = path.join(os.tmpdir(), 'salary-broken-childcredit.html');
    fs.writeFileSync(tmp, broken, 'utf8');
    const t0 = monthlyTax(tmp, { ...BASE, children: 0 });
    const t1 = monthlyTax(tmp, { ...BASE, children: 1 });
    const diff = t0 - t1;
    const expected = Math.round(250000 * 1.1 / 12);
    const broke = Math.abs(diff - expected) > 5;
    check('옛 금액(15만원)으로 되돌리면 25만원 기준 검증이 실패해야 함(테스트가 회귀를 잡아냄)', broke, true);
    fs.unlinkSync(tmp);
  }
}

console.log('\n=== 5. 근로소득공제 상한(2,000만원) — 총급여 4억원 사례 ===');
console.log('   근거: 국세청 "근로소득금액" 안내 페이지 — "근로소득공제금액은... 공제한도 2,000만원"');
console.log('   https://nts.go.kr/nts/cm/cntnts/cntntsView.do?cntntsId=7871&mi=6435 (확인: 2026-09-18)');
console.log('   상한 없이 계산식만 적용하면 총급여 4억원의 근로소득공제 = 1,475만원+(4억-1억)×2% = 2,075만원인데,');
console.log('   실제로는 2,000만원을 넘을 수 없다. 상한 경계는 1,475만원+(gross-1억)×2%=2,000만원 → gross=3억6,250만원.');
console.log('   이 계산기의 breakdown에는 "근로소득공제" 값이 직접 나오지 않으므로, 공식 근거로 독립적으로');
console.log('   다시 구현한 계산기(사이트 코드를 복사한 것이 아님)와 실제 HTML의 월 실수령액을 대조한다.');
{
  // 독립 계산기 — nts.go.kr에서 확인한 공식 그대로 새로 작성(사이트 코드 복사 아님).
  // 소득세 누진세율표(6~45%, 8단계)는 이번에 별도로 재확인하지 않고 기존 표를 그대로 가져다 썼다
  // (오래전부터 바뀌지 않은 표라고 알려져 있으나, 이번 세션에서 공식 원문으로 재대조하지는 않았다).
  const REF_TAX_BRACKETS = [
    { limit: 14000000, rate: 0.06, deduction: 0 },
    { limit: 50000000, rate: 0.15, deduction: 1260000 },
    { limit: 88000000, rate: 0.24, deduction: 5760000 },
    { limit: 150000000, rate: 0.35, deduction: 15440000 },
    { limit: 300000000, rate: 0.38, deduction: 19940000 },
    { limit: 500000000, rate: 0.40, deduction: 25940000 },
    { limit: 1000000000, rate: 0.42, deduction: 35940000 },
    { limit: Infinity, rate: 0.45, deduction: 65940000 },
  ];
  function refProgressiveTax(base) {
    if (base <= 0) return 0;
    const b = REF_TAX_BRACKETS.find(x => base <= x.limit);
    return Math.max(base * b.rate - b.deduction, 0);
  }
  function refEarnedIncomeDeduction(gross) {
    let d;
    if (gross <= 5000000) d = gross * 0.7;
    else if (gross <= 15000000) d = 3500000 + (gross - 5000000) * 0.4;
    else if (gross <= 45000000) d = 7500000 + (gross - 15000000) * 0.15;
    else if (gross <= 100000000) d = 12000000 + (gross - 45000000) * 0.05;
    else d = 14750000 + (gross - 100000000) * 0.02;
    return Math.min(d, 20000000); // nts.go.kr 확인 상한
  }
  function refLaborCredit(calculatedTax, gross) {
    let credit = calculatedTax <= 1300000 ? calculatedTax * 0.55 : 715000 + (calculatedTax - 1300000) * 0.3;
    let limit;
    if (gross <= 33000000) limit = 740000;
    else if (gross <= 70000000) limit = Math.max(740000 - (gross - 33000000) * 0.008, 660000);
    else if (gross <= 120000000) limit = Math.max(660000 - (gross - 70000000) * 0.5, 500000);
    else limit = Math.max(500000 - (gross - 120000000) * 0.5, 200000);
    return Math.min(credit, limit);
  }
  function refChildCredit(n) {
    if (n <= 0) return 0;
    if (n === 1) return 250000;
    if (n === 2) return 550000;
    return 550000 + (n - 2) * 400000;
  }
  function refMonthlyNet(salaryMan, nontaxMan, dependents, children) {
    const annual = salaryMan * 10000, nonTaxAnnual = nontaxMan * 10000 * 12;
    const gross = Math.max(annual - nonTaxAnnual, 0), mtg = gross / 12;
    const pensionBase = Math.min(Math.max(mtg, 410000), 6590000);
    const pension = pensionBase * 0.0475, health = mtg * 0.03595, ltc = health * 0.1314, emp = mtg * 0.009;
    const monthlyIns = pension + health + ltc + emp, annualIns = monthlyIns * 12;
    const ded = refEarnedIncomeDeduction(gross), eia = Math.max(gross - ded, 0);
    const pd = dependents * 1500000, taxBase = Math.max(eia - pd - annualIns, 0);
    const ct = refProgressiveTax(taxBase), lc = refLaborCredit(ct, gross), cc = refChildCredit(children), sc = 130000;
    const decided = Math.max(ct - lc - cc - sc, 0), local = decided * 0.1, annualIncomeTax = decided + local;
    const monthlyTax = annualIncomeTax / 12;
    const monthlyGross = annual / 12;
    return monthlyGross - (monthlyIns + monthlyTax);
  }

  function actualMonthlyNet(salaryMan, nontaxMan, dependents, children) {
    const doc = loadCalculator(HTML_PATH);
    doc.getElementById('salary').value = String(salaryMan);
    doc.getElementById('nontax').value = String(nontaxMan);
    doc.getElementById('dependents').value = String(dependents);
    doc.getElementById('children').value = String(children);
    doc.getElementById('calcBtn').click();
    return Number(doc.getElementById('netMonthly').textContent.replace(/[^0-9]/g, ''));
  }

  // 4억원(상한을 한참 넘는 사례), 3억6,250만원(상한 경계), 3억6천만원(상한 아래)
  for (const salaryMan of [40000, 36250, 36000]) {
    const actual = actualMonthlyNet(salaryMan, 0, 1, 0);
    const expected = Math.round(refMonthlyNet(salaryMan, 0, 1, 0));
    checkClose('연봉 ' + salaryMan + '만원의 월 실수령액이 독립 계산과 일치', actual, expected, 1);
    if (salaryMan === 40000) global.__actualMonthlyNetFor40000 = actual;
  }
}

console.log('\n=== 6. 회귀 테스트: 모순 입력 검증 자체를 제거하면 실패해야 함 ===');
{
  const original = fs.readFileSync(HTML_PATH, 'utf8');
  const broken = original.replace(
    /    if \(children > dependents - 1\)\{\r?\n      renderInvalidFamily\(dependents, children\);\r?\n      return;\r?\n    \}\r?\n\r?\n/,
    ''
  );
  if (broken === original) {
    console.log('FAIL - 회귀 테스트: 모순 입력 검증 코드를 찾지 못해 깨뜨리지 못함');
    fail++;
  } else {
    const tmp = path.join(os.tmpdir(), 'salary-broken-validation.html');
    fs.writeFileSync(tmp, broken, 'utf8');
    const doc = loadCalculator(tmp);
    doc.getElementById('salary').value = '3500';
    doc.getElementById('nontax').value = '20';
    doc.getElementById('dependents').value = '1';
    doc.getElementById('children').value = '4';
    doc.getElementById('calcBtn').click();
    const net = doc.getElementById('netMonthly').textContent.trim();
    const broke = net !== '-';
    check('검증 코드를 제거하면 모순 입력에도 금액이 나와야 함(테스트가 회귀를 잡아냄)', broke, true);
    fs.unlinkSync(tmp);
  }
}

console.log('\n=== 7. 회귀 테스트: 근로소득공제 상한을 제거하면 4억원 사례 검증이 실패해야 함 ===');
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
    const tmp = path.join(os.tmpdir(), 'salary-broken-cap.html');
    fs.writeFileSync(tmp, broken, 'utf8');
    const doc = loadCalculator(tmp);
    doc.getElementById('salary').value = '40000';
    doc.getElementById('nontax').value = '0';
    doc.getElementById('dependents').value = '1';
    doc.getElementById('children').value = '0';
    doc.getElementById('calcBtn').click();
    const brokenNet = Number(doc.getElementById('netMonthly').textContent.replace(/[^0-9]/g, ''));
    check('상한을 제거하면 4억원 사례 결과가 원래(상한 적용) 결과와 달라짐(테스트가 회귀를 잡아냄)', brokenNet !== global.__actualMonthlyNetFor40000, true);
    fs.unlinkSync(tmp);
  }
}

console.log('\n결과: ' + pass + '개 통과, ' + fail + '개 실패');
if (fail > 0) process.exit(1);
