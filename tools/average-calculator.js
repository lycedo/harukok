'use strict';

function parseAverageNumbers(raw) {
  if (typeof raw !== 'string' || !raw.trim()) throw new Error('계산할 숫자를 한 개 이상 입력해 주세요.');
  if (raw.length > 100000) throw new Error('한 번에 최대 100,000자까지 입력할 수 있습니다.');
  const tokens = raw.trim().split(/[\s,]+/).filter(Boolean);
  if (tokens.length > 10000) throw new Error('숫자는 최대 10,000개까지 입력해 주세요.');
  return tokens.map((token, index) => {
    if (!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i.test(token)) throw new Error((index + 1) + '번째 항목을 숫자로 입력해 주세요.');
    const value = Number(token);
    if (!Number.isFinite(value) || Math.abs(value) > 1e12) throw new Error('각 숫자는 -1조부터 1조 사이의 유한한 값이어야 합니다.');
    return value;
  });
}
function calculateAverage(raw) {
  const numbers = parseAverageNumbers(raw);
  let sum = 0, compensation = 0;
  for (const number of numbers) {
    const next = sum + number;
    compensation += Math.abs(sum) >= Math.abs(number) ? (sum - next) + number : (number - next) + sum;
    sum = next;
  }
  sum += compensation;
  const sorted = numbers.slice().sort((a, b) => a - b), middle = Math.floor(sorted.length / 2);
  return { count: numbers.length, sum, average: sum / numbers.length,
    median: sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2,
    minimum: sorted[0], maximum: sorted[sorted.length - 1] };
}
function formatAverageNumber(value) {
  const rounded = Number(value.toFixed(6));
  return (Object.is(rounded, -0) ? 0 : rounded).toLocaleString('ko-KR', { maximumFractionDigits: 6 });
}
if (typeof module !== 'undefined') module.exports = { parseAverageNumbers, calculateAverage, formatAverageNumber };
if (typeof document !== 'undefined') {
  const $ = id => document.getElementById(id);
  let version = 0;
  function clear() { version++; $('result').hidden = true; $('result-text').value = ''; $('error').textContent = ''; $('copy-status').textContent = ''; }
  $('calculator').addEventListener('input', clear); $('calculator').addEventListener('change', clear);
  $('calculator').addEventListener('submit', event => {
    event.preventDefault(); clear();
    try {
      const r = calculateAverage($('numbers').value), f = formatAverageNumber;
      const text = '평균: ' + f(r.average) + '\n중앙값: ' + f(r.median) + '\n합계: ' + f(r.sum) + '\n최솟값: ' + f(r.minimum) + '\n최댓값: ' + f(r.maximum) + '\n개수: ' + r.count;
      $('result-value').textContent = '평균 ' + f(r.average);
      $('result-detail').textContent = '총 ' + r.count.toLocaleString('ko-KR') + '개 · 중앙값 ' + f(r.median);
      $('result-text').value = text; $('result').hidden = false; $('result').scrollIntoView({ block: 'nearest' });
    } catch (error) { $('error').textContent = error.message; }
  });
  $('example')?.addEventListener('click', () => { $('numbers').value = '10, 20, 20, 30, 100'; $('calculator').requestSubmit(); });
  $('copy').addEventListener('click', async () => {
    const current = version, text = $('result-text').value;
    if ($('result').hidden || !text) return;
    try { await navigator.clipboard.writeText(text); if (current === version) $('copy-status').textContent = '결과를 복사했습니다.'; }
    catch { if (current !== version) return; $('copy-status').textContent = '결과 칸의 글을 선택해 직접 복사해 주세요.'; $('result-text').focus(); $('result-text').select(); }
  });
}
