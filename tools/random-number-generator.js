'use strict';
function secureRandom32() {
  if (typeof crypto === 'undefined' || typeof crypto.getRandomValues !== 'function') throw new Error('이 브라우저에서 안전한 난수를 만들 수 없습니다. 최신 브라우저를 사용해 주세요.');
  return crypto.getRandomValues(new Uint32Array(1))[0];
}
function randomIndexBelow(range, random32 = secureRandom32) {
  if (!Number.isSafeInteger(range) || range < 1 || range > 4294967296) throw new Error('추첨 범위를 확인해 주세요.');
  const limit = Math.floor(4294967296 / range) * range;
  for (;;) {
    const value = random32();
    if (!Number.isInteger(value) || value < 0 || value > 4294967295) throw new Error('난수 생성 결과를 확인할 수 없습니다.');
    if (value < limit) return value % range;
  }
}
function randomInputInteger(raw, label) {
  if ((typeof raw !== 'string' && typeof raw !== 'number') || !/^[+-]?\d{1,10}$/.test(String(raw).trim())) throw new Error(label + '은 정수로 입력해 주세요.');
  const value = Number(raw);
  if (!Number.isSafeInteger(value) || Math.abs(value) > 1e9) throw new Error(label + '은 -10억부터 10억 사이로 입력해 주세요.');
  return value;
}
function drawRandomNumbers(minRaw, maxRaw, countRaw, allowDuplicates = false, random32 = secureRandom32) {
  const min = randomInputInteger(minRaw, '최솟값'), max = randomInputInteger(maxRaw, '최댓값'), count = randomInputInteger(countRaw, '개수');
  if (min > max) throw new Error('최솟값은 최댓값보다 클 수 없습니다.');
  if (count < 1 || count > 1000) throw new Error('뽑을 개수는 1부터 1,000 사이로 입력해 주세요.');
  if (typeof allowDuplicates !== 'boolean') throw new Error('중복 허용 여부를 확인해 주세요.');
  const range = max - min + 1;
  if (!allowDuplicates && count > range) throw new Error('중복 없이 뽑을 수 있는 숫자가 부족합니다. 범위를 넓히거나 개수를 줄이세요.');
  const values = [], swaps = new Map();
  for (let index = 0; index < count; index++) {
    if (allowDuplicates) { values.push(min + randomIndexBelow(range, random32)); continue; }
    const remaining = range - index, chosen = randomIndexBelow(remaining, random32), last = remaining - 1;
    values.push(min + (swaps.get(chosen) ?? chosen));
    swaps.set(chosen, swaps.get(last) ?? last); swaps.delete(last);
  }
  return values;
}
if (typeof module !== 'undefined') module.exports = { secureRandom32, randomIndexBelow, randomInputInteger, drawRandomNumbers };
if (typeof document !== 'undefined') {
  const $ = id => document.getElementById(id); let version = 0;
  function clear() { version++; $('result').hidden = true; $('result-text').value = ''; $('error').textContent = ''; $('copy-status').textContent = ''; }
  $('calculator').addEventListener('input', clear); $('calculator').addEventListener('change', clear);
  $('calculator').addEventListener('submit', event => { event.preventDefault(); clear(); try {
    const values = drawRandomNumbers($('min').value, $('max').value, $('count').value, $('duplicates').checked);
    $('result-value').textContent = values.length + '개 추첨 완료'; $('result-detail').textContent = '순서대로 뽑은 숫자입니다. 입력한 양 끝값도 범위에 포함합니다.';
    $('result-text').value = values.join(', '); $('result').hidden = false; $('result').scrollIntoView({ block: 'nearest' });
  } catch (error) { $('error').textContent = error.message; } });
  $('example').addEventListener('click', () => { $('min').value = '1'; $('max').value = '100'; $('count').value = '5'; $('duplicates').checked = false; $('calculator').requestSubmit(); });
  $('copy').addEventListener('click', async () => { const current = version; if ($('result').hidden) return;
    try { await navigator.clipboard.writeText($('result-text').value); if (current === version) $('copy-status').textContent = '결과를 복사했습니다.'; }
    catch { if (current !== version) return; $('copy-status').textContent = '결과 칸에서 글을 선택해 직접 복사해 주세요.'; $('result-text').focus(); $('result-text').select(); }
  });
}
