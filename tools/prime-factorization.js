'use strict';
function factorInteger(raw) {
  if (typeof raw !== 'string' && typeof raw !== 'number') throw new Error('1부터 1조 사이의 정수를 입력해 주세요.');
  const text = String(raw).trim();
  if (!/^\d{1,13}$/.test(text)) throw new Error('1부터 1조 사이의 정수를 입력해 주세요.');
  const value = BigInt(text);
  if (value < 1n || value > 1000000000000n) throw new Error('1부터 1조 사이의 정수를 입력해 주세요.');
  return value;
}
function primeFactorization(raw) {
  const value = factorInteger(raw), factors = []; let remainder = value;
  for (let factor = 2n; factor * factor <= remainder; factor = factor === 2n ? 3n : factor + 2n) {
    let exponent = 0;
    while (remainder % factor === 0n) { remainder /= factor; exponent++; }
    if (exponent) factors.push({ prime: factor, exponent });
  }
  if (remainder > 1n) factors.push({ prime: remainder, exponent: 1 });
  let divisors = [1n];
  for (const factor of factors) {
    const existing = divisors.slice(); let power = 1n;
    for (let exponent = 1; exponent <= factor.exponent; exponent++) {
      power *= factor.prime; divisors.push(...existing.map(divisor => divisor * power));
      if (divisors.length > 10000) throw new Error('약수 목록은 최대 10,000개까지만 표시합니다.');
    }
  }
  divisors.sort((a, b) => a < b ? -1 : a > b ? 1 : 0);
  return { value: value.toString(), factors: factors.map(f => ({ prime: f.prime.toString(), exponent: f.exponent })),
    expression: factors.length ? factors.map(f => f.prime + (f.exponent > 1 ? '^' + f.exponent : '')).join(' × ') : '1은 소인수가 없습니다.',
    divisors: divisors.map(String), divisorCount: divisors.length, isPrime: factors.length === 1 && factors[0].exponent === 1 };
}
if (typeof module !== 'undefined') module.exports = { factorInteger, primeFactorization };
if (typeof document !== 'undefined') {
  const $ = id => document.getElementById(id); let version = 0;
  function clear() { version++; $('result').hidden = true; $('result-text').value = ''; $('error').textContent = ''; $('copy-status').textContent = ''; }
  $('calculator').addEventListener('input', clear); $('calculator').addEventListener('change', clear);
  $('calculator').addEventListener('submit', event => { event.preventDefault(); clear(); try {
    const r = primeFactorization($('number').value); $('result-value').textContent = r.expression;
    $('result-detail').textContent = '양의 약수 ' + r.divisorCount + '개' + (r.isPrime ? ' · 소수입니다.' : r.value === '1' ? ' · 1은 소수가 아닙니다.' : ' · 합성수입니다.');
    $('result-text').value = r.value + '의 소인수분해: ' + r.expression + '\n약수 ' + r.divisorCount + '개: ' + r.divisors.join(', ');
    $('result').hidden = false; $('result').scrollIntoView({ block: 'nearest' });
  } catch (error) { $('error').textContent = error.message; } });
  $('example')?.addEventListener('click', () => { $('number').value = '360'; $('calculator').requestSubmit(); });
  $('copy').addEventListener('click', async () => { const current = version; if ($('result').hidden) return;
    try { await navigator.clipboard.writeText($('result-text').value); if (current === version) $('copy-status').textContent = '결과를 복사했습니다.'; }
    catch { if (current !== version) return; $('copy-status').textContent = '결과 칸에서 글을 선택해 직접 복사해 주세요.'; $('result-text').focus(); $('result-text').select(); }
  });
}
