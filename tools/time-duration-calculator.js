'use strict';

function sumTimeDurations(raw) {
  if (typeof raw !== 'string' || !raw.trim()) throw new Error('더할 시간을 한 줄 이상 입력해 주세요.');
  if (raw.length > 100000) throw new Error('입력한 글은 최대 100,000자까지 처리합니다.');
  const lines = raw.split(/\r\n?|\n/).map(line => line.trim()).filter(Boolean);
  if (lines.length > 1000) throw new Error('한 번에 최대 1,000개의 시간만 더할 수 있습니다.');
  let totalSeconds = 0;
  lines.forEach((line, index) => {
    const match = line.match(/^(\d{1,10}):([0-5]\d)(?::([0-5]\d))?$/);
    if (!match) throw new Error((index + 1) + '번째 시간을 시간:분 또는 시간:분:초로 입력해 주세요. 분과 초는 00~59입니다.');
    const hours = Number(match[1]);
    if (hours > 1000000000) throw new Error('각 시간의 시 부분은 최대 10억까지 입력해 주세요.');
    totalSeconds += hours * 3600 + Number(match[2]) * 60 + Number(match[3] || 0);
    if (!Number.isSafeInteger(totalSeconds)) throw new Error('합계가 정확하게 계산할 수 있는 정수 범위를 넘었습니다. 시간을 나누어 계산해 주세요.');
  });
  return { count: lines.length, totalSeconds, totalMinutes: totalSeconds / 60,
    hours: Math.floor(totalSeconds / 3600), minutes: Math.floor(totalSeconds % 3600 / 60), seconds: totalSeconds % 60 };
}
if (typeof module !== 'undefined') module.exports = { sumTimeDurations };
if (typeof document !== 'undefined') {
  const $ = id => document.getElementById(id);
  let version = 0;
  function clear() { version++; $('result').hidden = true; $('result-text').value = ''; $('error').textContent = ''; $('copy-status').textContent = ''; }
  $('calculator').addEventListener('input', clear); $('calculator').addEventListener('change', clear);
  $('calculator').addEventListener('submit', event => {
    event.preventDefault(); clear();
    try {
      const r = sumTimeDurations($('durations').value);
      const duration = r.hours.toLocaleString('ko-KR') + '시간 ' + r.minutes + '분 ' + r.seconds + '초';
      $('result-value').textContent = duration;
      $('result-detail').textContent = r.count.toLocaleString('ko-KR') + '개 시간을 더했습니다.';
      $('result-text').value = '합계: ' + duration + '\n총 분: ' + r.totalMinutes.toLocaleString('ko-KR', { maximumFractionDigits: 6 }) + '분\n총 초: ' + r.totalSeconds.toLocaleString('ko-KR') + '초';
      $('result').hidden = false; $('result').scrollIntoView({ block: 'nearest' });
    } catch (error) { $('error').textContent = error.message; }
  });
  $('example')?.addEventListener('click', () => { $('durations').value = '1:30\n2:15:30\n0:45'; $('calculator').requestSubmit(); });
  $('copy').addEventListener('click', async () => {
    const current = version, text = $('result-text').value;
    if ($('result').hidden || !text) return;
    try { await navigator.clipboard.writeText(text); if (current === version) $('copy-status').textContent = '결과를 복사했습니다.'; }
    catch { if (current !== version) return; $('copy-status').textContent = '결과 칸의 글을 선택해 직접 복사해 주세요.'; $('result-text').focus(); $('result-text').select(); }
  });
}
