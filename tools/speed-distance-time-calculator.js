'use strict';
function motionPositive(raw) {
  if ((typeof raw !== 'string' && typeof raw !== 'number') || !String(raw).trim()) throw new Error('알고 있는 두 값을 모두 입력해 주세요.');
  const text = String(raw).trim(), value = Number(text);
  if (text.length > 100 || !/^[+]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i.test(text) || !Number.isFinite(value) || value <= 0 || value > 1e9) throw new Error('입력값은 0보다 크고 10억 이하인 숫자여야 합니다.');
  return value;
}
function calculateMotion(mode, raw, units) {
  if (!['speed', 'distance', 'time'].includes(mode)) throw new Error('구할 값을 선택해 주세요.');
  const distanceFactors = { m: 1, km: 1000 }, timeFactors = { s: 1, min: 60, h: 3600 }, speedFactors = { ms: 1, kmh: 1 / 3.6 };
  if (!raw || !units || !Object.hasOwn(distanceFactors, units.distance) || !Object.hasOwn(timeFactors, units.time) || !Object.hasOwn(speedFactors, units.speed)) throw new Error('각 값의 단위를 선택해 주세요.');
  let distance = mode === 'distance' ? null : motionPositive(raw.distance) * distanceFactors[units.distance];
  let time = mode === 'time' ? null : motionPositive(raw.time) * timeFactors[units.time];
  let speed = mode === 'speed' ? null : motionPositive(raw.speed) * speedFactors[units.speed];
  if (mode === 'speed') speed = distance / time;
  else if (mode === 'distance') distance = speed * time;
  else time = distance / speed;
  if (![distance, time, speed].every(value => Number.isFinite(value) && value > 0)) throw new Error('값의 크기 차이가 너무 큽니다. 단위나 숫자를 조절해 주세요.');
  return { distanceMetres: distance, timeSeconds: time, speedMetresPerSecond: speed };
}
function formatMotion(value) { return value.toLocaleString('ko-KR', { maximumSignificantDigits: 12 }); }
if (typeof module !== 'undefined') module.exports = { motionPositive, calculateMotion, formatMotion };
if (typeof document !== 'undefined') {
  const $ = id => document.getElementById(id); let version = 0;
  function clear() { version++; $('result').hidden = true; $('result-text').value = ''; $('error').textContent = ''; $('copy-status').textContent = ''; }
  function mode() { clear(); for (const name of ['distance', 'time', 'speed']) $(name + '-field').hidden = $('find').value === name; }
  $('find').addEventListener('change', mode); $('calculator').addEventListener('input', clear); $('calculator').addEventListener('change', clear);
  $('calculator').addEventListener('submit', event => { event.preventDefault(); clear(); try {
    const r = calculateMotion($('find').value, { distance: $('distance').value, time: $('time').value, speed: $('speed').value }, { distance: $('distance-unit').value, time: $('time-unit').value, speed: $('speed-unit').value });
    const lines = ['속력: ' + formatMotion(r.speedMetresPerSecond * 3.6) + 'km/h (' + formatMotion(r.speedMetresPerSecond) + 'm/s)', '거리: ' + formatMotion(r.distanceMetres / 1000) + 'km (' + formatMotion(r.distanceMetres) + 'm)', '시간: ' + formatMotion(r.timeSeconds / 3600) + '시간 (' + formatMotion(r.timeSeconds / 60) + '분, ' + formatMotion(r.timeSeconds) + '초)'];
    $('result-value').textContent = lines[{ speed: 0, distance: 1, time: 2 }[$('find').value]];
    $('result-detail').textContent = '일정한 속력으로 이동한다는 가정의 계산입니다.'; $('result-text').value = lines.join('\n');
    $('result').hidden = false; $('result').scrollIntoView({ block: 'nearest' });
  } catch (error) { $('error').textContent = error.message; } });
  $('example')?.addEventListener('click', () => { $('find').value = 'speed'; mode(); $('distance').value = '120'; $('distance-unit').value = 'km'; $('time').value = '2'; $('time-unit').value = 'h'; $('speed-unit').value = 'kmh'; $('calculator').requestSubmit(); });
  $('copy').addEventListener('click', async () => { const current = version; if ($('result').hidden) return;
    try { await navigator.clipboard.writeText($('result-text').value); if (current === version) $('copy-status').textContent = '결과를 복사했습니다.'; }
    catch { if (current !== version) return; $('copy-status').textContent = '결과 칸에서 글을 선택해 직접 복사해 주세요.'; $('result-text').focus(); $('result-text').select(); }
  }); mode();
}
