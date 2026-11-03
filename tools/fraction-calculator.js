'use strict';

function fractionInteger(value) {
  const text = String(value).trim();
  if (text.length > 11 || text.replace(/^[+-]/, '').length > 10) throw new Error('분자와 분모는 -10억부터 10억 사이로 입력해 주세요.');
  if (!/^[+-]?\d+$/.test(text)) throw new Error('분자와 분모는 정수로 입력해 주세요.');
  const number = BigInt(text);
  if (number < -1000000000n || number > 1000000000n) throw new Error('분자와 분모는 -10억부터 10억 사이로 입력해 주세요.');
  return number;
}
function fractionGCD(a, b) {
  a = a < 0n ? -a : a; b = b < 0n ? -b : b;
  while (b) { const next = a % b; a = b; b = next; }
  return a;
}
function calculateFractions(an, ad, bn, bd, operation) {
  const a = fractionInteger(an), b = fractionInteger(ad), c = fractionInteger(bn), d = fractionInteger(bd);
  if (b === 0n || d === 0n) throw new Error('분모는 0으로 입력할 수 없습니다.');
  let numerator, denominator;
  if (operation === 'add') { numerator = a * d + c * b; denominator = b * d; }
  else if (operation === 'subtract') { numerator = a * d - c * b; denominator = b * d; }
  else if (operation === 'multiply') { numerator = a * c; denominator = b * d; }
  else if (operation === 'divide') {
    if (c === 0n) throw new Error('0인 분수로 나눌 수 없습니다.');
    numerator = a * d; denominator = b * c;
  } else throw new Error('계산할 방법을 선택해 주세요.');
  if (denominator < 0n) { numerator = -numerator; denominator = -denominator; }
  const divisor = fractionGCD(numerator, denominator);
  numerator /= divisor; denominator /= divisor;
  const fraction = denominator === 1n ? String(numerator) : numerator + '/' + denominator;
  const absolute = numerator < 0n ? -numerator : numerator;
  const whole = absolute / denominator, remainder = absolute % denominator;
  let mixed = fraction;
  if (whole && remainder) mixed = numerator < 0n ? '-(' + whole + ' + ' + remainder + '/' + denominator + ')' : whole + ' + ' + remainder + '/' + denominator;
  return { numerator, denominator, fraction, mixed };
}
if (typeof module !== 'undefined') module.exports = { fractionInteger, fractionGCD, calculateFractions };
if (typeof document !== 'undefined') {
  const $ = id => document.getElementById(id);
  let version = 0;
  function clear() { version++; $('result').hidden = true; $('result-text').value = ''; $('error').textContent = ''; $('copy-status').textContent = ''; }
  $('calculator').addEventListener('input', clear);
  $('calculator').addEventListener('change', clear);
  $('calculator').addEventListener('submit', event => {
    event.preventDefault(); clear();
    try {
      const r = calculateFractions($('an').value, $('ad').value, $('bn').value, $('bd').value, $('operation').value);
      $('result-value').textContent = r.fraction;
      $('result-detail').textContent = r.mixed === r.fraction ? '더 약분할 수 없는 결과입니다.' : '대분수: ' + r.mixed;
      $('result-text').value = '분수 계산 결과: ' + r.fraction + (r.mixed === r.fraction ? '' : '\n대분수: ' + r.mixed);
      $('result').hidden = false; $('result').scrollIntoView({ block: 'nearest' });
    } catch (error) { $('error').textContent = error.message; }
  });
  $('example').addEventListener('click', () => { $('an').value = '1'; $('ad').value = '2'; $('bn').value = '3'; $('bd').value = '4'; $('operation').value = 'add'; $('calculator').requestSubmit(); });
  $('copy').addEventListener('click', async () => {
    const current = version, text = $('result-text').value;
    if ($('result').hidden || !text) return;
    try { await navigator.clipboard.writeText(text); if (current === version) $('copy-status').textContent = '결과를 복사했습니다.'; }
    catch { if (current !== version) return; $('copy-status').textContent = '결과 칸의 글을 선택해 직접 복사해 주세요.'; $('result-text').focus(); $('result-text').select(); }
  });
}
