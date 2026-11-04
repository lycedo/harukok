'use strict';
function integerGCD(a, b) { while (b) { const next = a % b; a = b; b = next; } return a; }
function calculateGCDLCM(raw) {
  if (typeof raw !== 'string' || !raw.trim()) throw new Error('양의 정수를 한 개 이상 입력해 주세요.');
  if (raw.length > 2000) throw new Error('입력은 최대 2,000자까지 처리합니다.');
  const tokens = raw.trim().split(/[\s,]+/).filter(Boolean);
  if (!tokens.length) throw new Error('양의 정수를 한 개 이상 입력해 주세요.');
  if (tokens.length > 50) throw new Error('숫자는 최대 50개까지 입력해 주세요.');
  const values = tokens.map((text, index) => {
    if (!/^\d{1,10}$/.test(text)) throw new Error((index + 1) + '번째 수를 1부터 10억 사이의 정수로 입력해 주세요.');
    const value = BigInt(text);
    if (value < 1n || value > 1000000000n) throw new Error((index + 1) + '번째 수를 1부터 10억 사이의 정수로 입력해 주세요.');
    return value;
  });
  let gcd = values[0], lcm = values[0];
  for (const value of values.slice(1)) {
    gcd = integerGCD(gcd, value); lcm = lcm / integerGCD(lcm, value) * value;
    if (lcm.toString().length > 500) throw new Error('최소공배수는 500자리 이내까지만 표시합니다. 숫자를 나누어 계산해 주세요.');
  }
  return { gcd: gcd.toString(), lcm: lcm.toString(), count: values.length };
}
if (typeof module !== 'undefined') module.exports = { integerGCD, calculateGCDLCM };
if (typeof document !== 'undefined') {
  const $ = id => document.getElementById(id); let version = 0;
  function clear() { version++; $('result').hidden = true; $('result-text').value = ''; $('error').textContent = ''; $('copy-status').textContent = ''; }
  $('calculator').addEventListener('input', clear); $('calculator').addEventListener('change', clear);
  $('calculator').addEventListener('submit', event => { event.preventDefault(); clear(); try {
    const r = calculateGCDLCM($('numbers').value); $('result-value').textContent = '최대공약수 ' + r.gcd;
    $('result-detail').textContent = r.count + '개 숫자의 공통 약수와 배수를 계산했습니다.';
    $('result-text').value = '최대공약수: ' + r.gcd + '\n최소공배수: ' + r.lcm + '\n입력 개수: ' + r.count;
    $('result').hidden = false; $('result').scrollIntoView({ block: 'nearest' });
  } catch (error) { $('error').textContent = error.message; } });
  $('example')?.addEventListener('click', () => { $('numbers').value = '12, 18, 30'; $('calculator').requestSubmit(); });
  $('copy').addEventListener('click', async () => { const current = version; if ($('result').hidden) return;
    try { await navigator.clipboard.writeText($('result-text').value); if (current === version) $('copy-status').textContent = '결과를 복사했습니다.'; }
    catch { if (current !== version) return; $('copy-status').textContent = '결과 칸에서 글을 선택해 직접 복사해 주세요.'; $('result-text').focus(); $('result-text').select(); }
  });
}
