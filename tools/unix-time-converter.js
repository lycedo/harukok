'use strict';
function timeZoneOffset(zone) { if (zone === 'UTC') return 0; if (zone === 'KST') return 9 * 3600000; throw new Error('UTC 또는 고정 UTC+09:00을 선택하세요.'); }
function parseUnixValue(raw, unit) {
  const text = String(raw).trim();
  if (text.length > 20 || !(unit === 's' ? /^[+-]?\d+(?:\.\d{1,3})?$/ : unit === 'ms' ? /^[+-]?\d+$/ : /a^/).test(text)) throw new Error('초는 소수점 3자리까지, 밀리초는 정수로 입력하세요.');
  const negative = text.startsWith('-'), [whole, fraction = ''] = text.replace(/^[+-]/, '').split('.');
  const number = (BigInt(whole) * (unit === 's' ? 1000n : 1n) + (unit === 's' ? BigInt(fraction.padEnd(3, '0')) : 0n)) * (negative ? -1n : 1n);
  if (number < -8640000000000000n || number > 8640000000000000n) throw new Error('변환할 수 있는 날짜 범위를 넘었습니다.'); return Number(number);
}
function unixSeconds(ms) { const value = BigInt(ms), absolute = value < 0n ? -value : value; const fraction = (absolute % 1000n).toString().padStart(3, '0').replace(/0+$/, ''); return (value < 0n ? '-' : '') + absolute / 1000n + (fraction ? '.' + fraction : ''); }
function convertUnixTime(raw, mode, unit, zone) {
  const offset = timeZoneOffset(zone); let ms;
  if (mode === 'unix-to-date') ms = parseUnixValue(raw, unit);
  else if (mode === 'date-to-unix') {
    const match = String(raw).trim().match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2})(?:\.(\d{1,3}))?)?$/);
    if (!match) throw new Error('날짜는 2026-11-03T09:00:00처럼 입력하세요. 밀리초는 .123까지 가능합니다.');
    const [, year, month, day, hour, minute, second = '00', fraction = ''] = match;
    const normalized = `${year}-${month}-${day}T${hour}:${minute}:${second}.${fraction.padEnd(3, '0')}`;
    ms = Date.parse(normalized + (zone === 'KST' ? '+09:00' : 'Z'));
    if (!Number.isFinite(ms) || new Date(ms + offset).toISOString().slice(0, 23) !== normalized) throw new Error('실제로 있는 날짜와 00~23시·00~59분·00~59초를 입력하세요.');
  } else throw new Error('변환 방향을 선택하세요.');
  const date = new Date(ms + offset);
  if (!Number.isFinite(date.getTime()) || date.getUTCFullYear() < 1900 || date.getUTCFullYear() > 2100) throw new Error('선택한 시간대 기준 1900~2100년만 지원합니다.');
  return { milliseconds: String(ms), seconds: unixSeconds(ms), local: date.toISOString().slice(0, 23) + (zone === 'KST' ? '+09:00' : 'Z'), utc: new Date(ms).toISOString(), zone };
}
if (typeof module !== 'undefined') module.exports = { parseUnixValue, convertUnixTime, unixSeconds };
if (typeof document !== 'undefined') {
  const $ = id => document.getElementById(id); let version = 0;
  function clear() { version++; $('result').hidden = true; $('output').value = ''; $('error').textContent = ''; $('copy-status').textContent = ''; }
  function modeChanged() { clear(); $('source-label').textContent = $('mode').value === 'unix-to-date' ? 'Unix 타임스탬프' : '날짜와 시각'; $('source').placeholder = $('mode').value === 'unix-to-date' ? '예: 1700000000' : '예: 2026-11-03T09:00:00'; }
  $('converter').addEventListener('input', clear); $('converter').addEventListener('change', clear); $('mode').addEventListener('change', modeChanged);
  $('converter').addEventListener('submit', event => { event.preventDefault(); clear(); try { const r = convertUnixTime($('source').value, $('mode').value, $('unit').value, $('zone').value); $('output').value = `선택 시간대: ${r.local}\nUTC: ${r.utc}\nUnix 초: ${r.seconds}\nUnix 밀리초: ${r.milliseconds}`; $('result').hidden = false; $('result').scrollIntoView({ block: 'nearest' }); } catch (error) { $('error').textContent = error.message; } });
  $('example')?.addEventListener('click', () => { $('mode').value = 'unix-to-date'; $('source').value = '1700000000'; $('unit').value = 's'; $('zone').value = 'KST'; modeChanged(); $('converter').requestSubmit(); });
  $('copy').addEventListener('click', async () => { if ($('result').hidden) return; const token = version; try { await navigator.clipboard.writeText($('output').value); if (token === version) $('copy-status').textContent = '변환 결과를 복사했습니다.'; } catch { if (token !== version) return; $('output').focus(); $('output').select(); $('copy-status').textContent = '결과 칸의 글을 선택해 직접 복사하세요.'; } });
}
