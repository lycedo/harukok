// 육아휴직급여 계산기(tools/parental-leave-calculator.html) — 시행령 기준 구간·하한 및 결과 옆 확인 상태 검증 (실제 HTML 실행)
// 기대값의 근거: 고용보험법 시행령 제95조(일반: 1~3개월 상한 250만원, 4~6개월 200만원, 7개월~ 통상임금 80%·상한 160만원, 하한 70만원)와
// 제95조의3(6+6 특례: 1·2개월 250만원, 3개월 300만원, 4개월 350만원, 5개월 400만원, 6개월 450만원, 하한 70만원), 시행 2026.9.18. 조문으로 확인.
// 기대값은 조문에서 옮긴 값이며 사이트 코드에서 가져오지 않았다.
const path = require('path');
const fs = require('fs');
const os = require('os');
const { loadCalculator } = require('./dom-shim.js');
const HTML = path.join(__dirname, '..', 'tools', 'parental-leave-calculator.html');

let pass = 0, fail = 0;
function check(label, actual, expected) {
  const ok = actual === expected;
  console.log((ok ? 'PASS' : 'FAIL') + ' - ' + label + ' (실제: ' + actual + ', 기대: ' + expected + ')');
  ok ? pass++ : fail++;
}
function run(file, type, wage, month) {
  const doc = loadCalculator(file);
  for (const b of doc.querySelectorAll('#typeSeg button')) if (b.dataset.value === type) b.click();
  doc.getElementById('wage').value = String(wage);
  doc.getElementById('month').value = String(month);
  doc.getElementById('calcBtn').click();
  return {
    amount: Number(doc.getElementById('benefitAmount').textContent.replace(/[^0-9]/g, '')),
    status: doc.getElementById('checkStatus').innerHTML,
  };
}

console.log('=== 1. 일반 구간(제95조): 통상임금 500만원이면 상한이 그대로 지급액 ===');
[[1, 250], [3, 250], [4, 200], [6, 200], [7, 160], [12, 160]].forEach(([m, exp]) => check('일반 ' + m + '개월차', run(HTML, 'normal', 500, m).amount, exp));

console.log('\n=== 2. 6+6 특례(제95조의3): 통상임금 500만원이면 개월차별 상한 ===');
[[1, 250], [2, 250], [3, 300], [4, 350], [5, 400], [6, 450]].forEach(([m, exp]) => check('특례 ' + m + '개월차', run(HTML, 'special', 500, m).amount, exp));

console.log('\n=== 3. 하한 70만원(제95조·제95조의3): 통상임금(또는 80%)이 70만원보다 적으면 70만원 ===');
check('일반 1개월차 통상임금 60만원', run(HTML, 'normal', 60, 1).amount, 70);
check('특례 1개월차 통상임금 60만원', run(HTML, 'special', 60, 1).amount, 70);
check('일반 7개월차 통상임금 80만원(80%=64만원)', run(HTML, 'normal', 80, 7).amount, 70);
check('일반 7개월차 통상임금 100만원(80%=80만원)은 하한 이상이라 80만원', run(HTML, 'normal', 100, 7).amount, 80);

console.log('\n=== 4. 결과 옆 확인 상태: 기본 요건 미충족은 일반 구간이 아니라 급여 없음으로 안내 ===');
{
  const r = run(HTML, 'normal', 300, 2);
  check('기본 수급 요건 가정과 미충족 시 급여 없음이 결과 옆에 표시됨', r.status.includes('기본 수급 요건') && r.status.includes('급여 없음(0원)') && r.status.includes('일반 구간이 대신 적용되지 않습니다'), true);
  check('일반 구간 결과는 6+6 특례 요건 가정을 하지 않음', r.status.includes('6+6 특례 요건</strong>(같은 자녀'), false);
  const s = run(HTML, 'special', 300, 2);
  check('특례 결과에는 부모 모두 육아휴직 요건 가정이 별도로 표시됨', s.status.includes('6+6 특례 요건') && s.status.includes('부모가 모두 육아휴직'), true);
  const low = run(HTML, 'normal', 60, 1);
  check('하한 적용 시 70만원 적용과 근거 조문이 표시됨', low.status.includes('70만원') && low.status.includes('시행령 제95조'), true);
  check('1개월 미만 휴직 일할 계산(제95조 제3항)은 계산기가 하지 않는다고 표시됨', r.status.includes('제95조 제3항'), true);
}

console.log('\n=== 4-2. 자격 요약 문구가 계산기·가이드에서 일관됨(대상 누락 방지, 자격 판정 아님) ===');
{
  const calc = fs.readFileSync(HTML, 'utf8');
  const guide = fs.readFileSync(path.join(__dirname, '..', 'guides', 'parental-leave-monthly-comparison.html'), 'utf8');
  const r = run(HTML, 'normal', 300, 2);
  check('결과 옆 안내에 8세 이하 또는 초등학교 2학년 이하와 임신 중 육아휴직이 함께 표시됨', r.status.includes('만 8세 이하 또는 초등학교 2학년 이하') && r.status.includes('임신 중 육아휴직'), true);
  check('결과 옆 안내에 자격을 판정하지 않는다는 문구가 있음', r.status.includes('자격을 판정하지 않으며'), true);
  check('계산기 본문에 현행 임신 관련 대상(임신 중 여성 근로자, 임신 중 배우자를 돌보는 남성 근로자)이 요약돼 있음', calc.includes('임신 중인 여성 근로자') && calc.includes('임신 중 배우자를 돌보려는 남성 근로자'), true);
  check('가이드 표에도 같은 대상 문구가 있음', guide.includes('만 8세 이하 또는 초등학교 2학년 이하') && guide.includes('임신 중 배우자를 돌보려는 남성 근로자'), true);
  check('옛 요약("8세 이하(초등학교 2학년 이하)")이 남아 있지 않음', calc.includes('8세 이하(초등학교 2학년 이하)') || guide.includes('8세 이하(초등학교 2학년 이하)'), false);
  check('하한액을 공식 원문 미검증으로 안내하는 문구가 남아 있지 않음', /검증하지 못했|미검증|확인하지 못한 부분/.test(calc), false);
  check('결과 옆 기본 요건에도 주 단위 육아휴직 7일 이상 예외가 반영됨(30일 이상만 남아 있지 않음)', r.status.includes('30일 이상(방학·휴원 등으로 쓰는 주 단위 육아휴직은 7일 이상)'), true);
  check('상단·FAQ·가이드에도 같은 7일 예외가 있음', (calc.match(/주 단위 육아휴직은 7일 이상/g) || []).length >= 4 && guide.includes('주 단위 육아휴직은 7일 이상'), true);
  check('결과 옆에 한 달 전체 휴직 기준이며 7일·14일 등 부분월을 직접 계산하지 않는다고 명시됨', r.status.includes('한 달 전체 휴직 기준이며, 7일·14일 등 부분월 급여를 직접 계산하지 않습니다'), true);
  check('법령 출처 링크가 시행일(2026.9.18.) 지정 버전으로 연결됨', ['고용보험법/(20260918,21473,20260317)/제70조', '고용보험법시행령/(20260918,36588,20260818)/제95조"', '고용보험법시행령/(20260918,36588,20260818)/제95조의3', '(20260918,21476,20260317)/제19조'].every(u => calc.includes(u) && guide.includes(u)), true);
  check('시행일 없는 법령 링크가 남아 있지 않음', /law\.go\.kr\/법령\/[^"(]*\/제\d+조/.test(calc + guide), false);
  check('하한 근거로 시행령 제95조·제95조의3이 본문에 명시됨', calc.includes('제95조 제1항(일반 구간)') && calc.includes('제95조의3 제1항'), true);
}

console.log('\n=== 5. 회귀: 하한을 제거하면 60만원 사례가 70만원이 아니게 되어 검증이 실패해야 함 ===');
{
  const src = fs.readFileSync(HTML, 'utf8');
  const broken = src.replace('const FLOOR = 70;', 'const FLOOR = 0;');
  if (broken === src) { console.log('FAIL - 깨뜨릴 코드를 찾지 못함'); fail++; }
  else {
    const t = path.join(os.tmpdir(), 'pl-broken.html');
    fs.writeFileSync(t, broken, 'utf8');
    check('하한 제거 시 60만원 사례가 70만원이 아니게 됨(테스트가 회귀를 잡아냄)', run(t, 'normal', 60, 1).amount === 70, false);
    fs.unlinkSync(t);
  }
}

console.log('\n결과: ' + pass + '개 통과, ' + fail + '개 실패');
if (fail > 0) process.exit(1);
