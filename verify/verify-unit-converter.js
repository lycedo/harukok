// 단위 변환기 — 국제 정의값 기준 검증 (실제 HTML 실행). 기대값은 정의값(1마일=1609.344m, 1lb=453.59237g 등)에서 직접 계산.
const path = require('path'); const fs = require('fs'); const os = require('os');
const { loadCalculator } = require('./dom-shim.js');
const HTML = path.join(__dirname, '..', 'tools', 'unit-converter.html');
let pass = 0, fail = 0;
function check(l, a, e) { const ok = Math.abs(a - e) < 1e-9; console.log((ok ? 'PASS' : 'FAIL') + ' - ' + l + ' (실제: ' + a + ', 기대: ' + e + ')'); ok ? pass++ : fail++; }
function conv(file, cat, from, to, v) {
  const d = loadCalculator(file);
  for (const b of d.querySelectorAll('#categorySeg button')) if (b.dataset.value === cat) b.click();
  const fu = d.getElementById('fromUnit'), tu = d.getElementById('toUnit');
  fu.value = from; tu.value = to; d.getElementById('fromValue').value = String(v);
  (fu._listeners.change || fu._listeners.input || []).forEach(f => f({})); (d.getElementById('fromValue')._listeners.input || []).forEach(f => f({}));
  return Number(d.getElementById('toValue').value);
}
console.log('=== 국제 정의값 기준 변환 ===');
check('100마일 → 160,934.4m', conv(HTML, 'length', '마일(mile)', '미터(m)', 100), 160934.4);
check('1파운드 → 453.5924g', conv(HTML, 'weight', '파운드(lb)', '그램(g)', 1), 453.5924);
check('10온스 → 283.4952g', conv(HTML, 'weight', '온스(oz)', '그램(g)', 10), 283.4952);
check('10갤런 → 37.8541L', conv(HTML, 'volume', '갤런(US gal)', '리터(L)', 10), 37.8541);
check('100제곱피트 → 9.2903㎡', conv(HTML, 'area', '제곱피트(ft²)', '제곱미터(㎡)', 100), 9.2903);
check('30평 → 99.1736㎡ (30×400/121)', conv(HTML, 'area', '평', '제곱미터(㎡)', 30), 99.1736);
console.log('\n결과: ' + pass + '개 통과, ' + fail + '개 실패'); if (fail > 0) process.exit(1);
