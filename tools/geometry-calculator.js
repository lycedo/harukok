'use strict';
function geometryLength(raw) {
  if ((typeof raw !== 'string' && typeof raw !== 'number') || !String(raw).trim()) throw new Error('필요한 길이를 모두 입력해 주세요.');
  const text = String(raw).trim(), value = Number(text);
  if (text.length > 100 || !/^[+]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i.test(text) || !Number.isFinite(value) || value <= 0 || value > 1e9) throw new Error('길이는 0보다 크고 10억 이하인 숫자로 입력해 주세요.');
  return value;
}
function calculateGeometry(shape, raw, unit = 'cm') {
  if (!['cm', 'm'].includes(unit)) throw new Error('cm 또는 m 단위를 선택해 주세요.');
  if (!Array.isArray(raw)) throw new Error('필요한 길이를 입력해 주세요.');
  let area, perimeter, formula;
  if (shape === 'circle') {
    const radius = geometryLength(raw[0]); area = Math.PI * radius * radius; perimeter = 2 * Math.PI * radius;
    formula = '넓이 = π × 반지름², 둘레 = 2 × π × 반지름';
  } else if (shape === 'rectangle') {
    const [width, height] = [raw[0], raw[1]].map(geometryLength); area = width * height; perimeter = 2 * (width + height);
    formula = '넓이 = 가로 × 세로, 둘레 = 2 × (가로 + 세로)';
  } else if (shape === 'triangle') {
    const [a, b, c] = [raw[0], raw[1], raw[2]].map(geometryLength).sort((x, y) => y - x);
    if (!(c > a - b)) throw new Error('작은 두 변의 길이 합은 가장 긴 변보다 커야 삼각형이 됩니다.');
    area = Math.sqrt((a + (b + c)) * (c - (a - b)) * (c + (a - b)) * (a + (b - c))) / 4;
    perimeter = a + b + c; formula = '넓이 = √(s(s−a)(s−b)(s−c)), s = 둘레 ÷ 2';
  } else throw new Error('도형을 선택해 주세요.');
  if (![area, perimeter].every(value => Number.isFinite(value) && value > 0)) throw new Error('표시하기 어려운 크기입니다. 길이의 단위나 값을 조절해 주세요.');
  return { area, perimeter, unit, formula };
}
function formatGeometry(value) { return value.toLocaleString('ko-KR', { maximumSignificantDigits: 12 }); }
if (typeof module !== 'undefined') module.exports = { geometryLength, calculateGeometry, formatGeometry };
if (typeof document !== 'undefined') {
  const $ = id => document.getElementById(id); let version = 0;
  function clear() { version++; $('result').hidden = true; $('result-text').value = ''; $('error').textContent = ''; $('copy-status').textContent = ''; }
  function mode() { clear(); const shape = $('shape').value; for (const name of ['circle', 'rectangle', 'triangle']) $(name + '-fields').hidden = shape !== name; }
  $('shape').addEventListener('change', mode); $('calculator').addEventListener('input', clear); $('calculator').addEventListener('change', clear);
  $('calculator').addEventListener('submit', event => { event.preventDefault(); clear(); try {
    const shape = $('shape').value, ids = shape === 'circle' ? ['radius'] : shape === 'rectangle' ? ['width', 'height'] : ['side-a', 'side-b', 'side-c'];
    const r = calculateGeometry(shape, ids.map(id => $(id).value), $('unit').value);
    $('result-value').textContent = '넓이 ' + formatGeometry(r.area) + r.unit + '²';
    $('result-detail').textContent = '둘레 ' + formatGeometry(r.perimeter) + r.unit;
    $('result-text').value = $('result-value').textContent + '\n' + $('result-detail').textContent + '\n' + r.formula;
    $('result').hidden = false; $('result').scrollIntoView({ block: 'nearest' });
  } catch (error) { $('error').textContent = error.message; } });
  $('example').addEventListener('click', () => { $('shape').value = 'triangle'; mode(); $('side-a').value = '3'; $('side-b').value = '4'; $('side-c').value = '5'; $('unit').value = 'cm'; $('calculator').requestSubmit(); });
  $('copy').addEventListener('click', async () => { const current = version; if ($('result').hidden) return;
    try { await navigator.clipboard.writeText($('result-text').value); if (current === version) $('copy-status').textContent = '결과를 복사했습니다.'; }
    catch { if (current !== version) return; $('copy-status').textContent = '결과 칸에서 글을 선택해 직접 복사해 주세요.'; $('result-text').focus(); $('result-text').select(); }
  }); mode();
}
