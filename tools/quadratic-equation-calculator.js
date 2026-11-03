'use strict';
function equationNumber(raw) {
  if ((typeof raw !== 'string' && typeof raw !== 'number') || !String(raw).trim()) throw new Error('a·b·c를 모두 입력해 주세요. 0도 입력할 수 있습니다.');
  const text = String(raw).trim();
  if (text.length > 100 || !/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i.test(text)) throw new Error('계수는 숫자로 입력해 주세요.');
  const value = Number(text);
  if (!Number.isFinite(value) || Math.abs(value) > 1e9) throw new Error('각 계수는 -10억부터 10억 사이의 유한한 값이어야 합니다.');
  if (value === 0 && /[1-9]/.test(text.split(/[eE]/)[0])) throw new Error('계수가 너무 작아 정확하게 읽을 수 없습니다. 크기를 조절해 주세요.');
  return value;
}
function solveQuadratic(aRaw, bRaw, cRaw) {
  const [a, b, c] = [aRaw, bRaw, cRaw].map(equationNumber);
  if (a === 0) {
    if (b === 0) return { kind: c === 0 ? 'all' : 'none', roots: [], discriminant: null };
    const root = -c / b;
    if (!Number.isFinite(root) || (root === 0 && c !== 0)) throw new Error('계수의 크기 차이가 너무 큽니다. 같은 비율로 계수를 조절해 주세요.');
    return { kind: 'linear', roots: [Object.is(root, -0) ? 0 : root], discriminant: null };
  }
  const square = b * b, product = 4 * a * c;
  if ((b !== 0 && square === 0) || (c !== 0 && product === 0)) throw new Error('계수가 너무 작아 판별식을 계산할 수 없습니다. 같은 비율로 계수를 키워 주세요.');
  const discriminant = square - product;
  if (discriminant < 0) return { kind: 'complex', roots: [], discriminant };
  if (discriminant === 0) {
    const root = -b / (2 * a);
    if (!Number.isFinite(root) || (root === 0 && b !== 0)) throw new Error('계수의 크기 차이가 너무 큽니다.');
    return { kind: 'repeated', roots: [Object.is(root, -0) ? 0 : root], discriminant };
  }
  const q = -0.5 * (b + (b >= 0 ? 1 : -1) * Math.sqrt(discriminant));
  const roots = [q / a, c / q].map(root => Object.is(root, -0) ? 0 : root).sort((x, y) => x - y);
  if (!roots.every(Number.isFinite) || (c !== 0 && roots.some(root => root === 0))) throw new Error('계수의 크기 차이가 너무 큽니다. 같은 비율로 계수를 조절해 주세요.');
  return { kind: 'quadratic', roots, discriminant };
}
function formatEquationNumber(value) { return value.toLocaleString('ko-KR', { maximumSignificantDigits: 12 }); }
function equationResultText(result) {
  if (result.kind === 'all') return '모든 실수가 해입니다. (0 = 0)';
  if (result.kind === 'none') return '해가 없습니다. (0이 아닌 상수 = 0)';
  if (result.kind === 'complex') return '실수 범위의 해가 없습니다. 복소수 해는 이 도구에서 표시하지 않습니다.\n판별식 D = ' + formatEquationNumber(result.discriminant);
  return (result.kind === 'linear' ? '일차방정식: ' : result.kind === 'repeated' ? '중근: ' : '두 실근: ') + result.roots.map(root => 'x = ' + formatEquationNumber(root)).join(', ') + (result.discriminant === null ? '' : '\n판별식 D = ' + formatEquationNumber(result.discriminant));
}
if (typeof module !== 'undefined') module.exports = { equationNumber, solveQuadratic, formatEquationNumber, equationResultText };
if (typeof document !== 'undefined') {
  const $ = id => document.getElementById(id); let version = 0;
  function clear() { version++; $('result').hidden = true; $('result-text').value = ''; $('error').textContent = ''; $('copy-status').textContent = ''; }
  $('calculator').addEventListener('input', clear); $('calculator').addEventListener('change', clear);
  $('calculator').addEventListener('submit', event => { event.preventDefault(); clear(); try {
    const r = solveQuadratic($('a').value, $('b').value, $('c').value), text = equationResultText(r);
    $('result-value').textContent = text.split('\n')[0]; $('result-detail').textContent = text.split('\n')[1] || '';
    $('result-text').value = text; $('result').hidden = false; $('result').scrollIntoView({ block: 'nearest' });
  } catch (error) { $('error').textContent = error.message; } });
  $('example').addEventListener('click', () => { $('a').value = '1'; $('b').value = '-3'; $('c').value = '2'; $('calculator').requestSubmit(); });
  $('copy').addEventListener('click', async () => { const current = version; if ($('result').hidden) return;
    try { await navigator.clipboard.writeText($('result-text').value); if (current === version) $('copy-status').textContent = '결과를 복사했습니다.'; }
    catch { if (current !== version) return; $('copy-status').textContent = '결과 칸에서 글을 선택해 직접 복사해 주세요.'; $('result-text').focus(); $('result-text').select(); }
  });
}
