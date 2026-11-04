'use strict';
const WORKDAY_MS = 86400000;
function workdayDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new Error('날짜는 YYYY-MM-DD 형식으로 입력하세요.');
  const [y, m, d] = value.split('-').map(Number), time = Date.UTC(y, m - 1, d);
  if (y < 1900 || y > 2100 || new Date(time).toISOString().slice(0, 10) !== value) throw new Error('1900~2100년 사이의 실제 날짜를 입력하세요.');
  return time;
}
function calculateBusinessDays({ mode, start, end, count, skipSaturday = true, skipSunday = true, holidays = '' }) {
  const begin = workdayDate(start);
  if (typeof holidays !== 'string' || holidays.length > 6000) throw new Error('제외 날짜는 최대 366개, 6,000자 이내로 입력하세요.');
  const dates = holidays.split(/[\s,]+/).filter(Boolean);
  if (dates.length > 366) throw new Error('제외 날짜는 최대 366개까지 입력하세요.');
  const excluded = new Set(dates.map(workdayDate));
  const isWorking = time => !excluded.has(time) && !(skipSaturday && new Date(time).getUTCDay() === 6) && !(skipSunday && new Date(time).getUTCDay() === 0);
  const last = Date.UTC(2100, 11, 31);
  let finish, workdays = 0;
  if (mode === 'add') {
    const n = typeof count === 'string' && !count.trim() ? NaN : Number(count);
    if (!Number.isSafeInteger(n) || n < 0 || n > 20000) throw new Error('더할 영업일은 0부터 20,000 사이의 정수로 입력하세요.');
    finish = begin;
    while (workdays < n) { finish += WORKDAY_MS; if (finish > last) throw new Error('결과가 2100년을 넘습니다. 시작일이나 일수를 조정하세요.'); if (isWorking(finish)) workdays++; }
  } else if (mode === 'between') {
    finish = workdayDate(end);
    if (finish < begin) throw new Error('끝 날짜는 시작 날짜와 같거나 이후여야 합니다.');
    for (let day = begin + WORKDAY_MS; day <= finish; day += WORKDAY_MS) if (isWorking(day)) workdays++;
  } else throw new Error('계산 종류를 선택하세요.');
  return { date: new Date(finish).toISOString().slice(0, 10), workdays, calendarDays: (finish - begin) / WORKDAY_MS, excludedDates: excluded.size };
}
if (typeof module !== 'undefined') module.exports = { workdayDate, calculateBusinessDays };
if (typeof document !== 'undefined') {
  const $ = id => document.getElementById(id); let version = 0;
  function clear() { version++; $('result').hidden = true; $('result-output').value = ''; $('error').textContent = ''; $('copy-status').textContent = ''; }
  function setMode() { clear(); $('add-fields').hidden = $('workday-mode').value !== 'add'; $('between-fields').hidden = $('workday-mode').value !== 'between'; }
  $('workday-form').addEventListener('input', clear); $('workday-form').addEventListener('change', clear); $('workday-mode').addEventListener('change', setMode);
  $('workday-form').addEventListener('submit', event => {
    event.preventDefault(); clear();
    try {
      const r = calculateBusinessDays({ mode: $('workday-mode').value, start: $('start-date').value, end: $('end-date').value, count: $('day-count').value, skipSaturday: $('skip-saturday').checked, skipSunday: $('skip-sunday').checked, holidays: $('holidays').value });
      $('result-value').textContent = $('workday-mode').value === 'add' ? r.date : r.workdays.toLocaleString('ko-KR') + '영업일';
      $('result-output').value = '시작일: ' + $('start-date').value + '\n끝 날짜: ' + r.date + '\n영업일: ' + r.workdays.toLocaleString('ko-KR') + '일\n달력상 차이: ' + r.calendarDays.toLocaleString('ko-KR') + '일\n시작일 제외 · 끝 날짜 포함 · 직접 입력한 제외 날짜 ' + r.excludedDates + '개';
      $('result').hidden = false; $('result').scrollIntoView({ block: 'nearest' });
    } catch (error) { $('error').textContent = error.message; }
  });
  $('workday-example')?.addEventListener('click', () => { $('workday-mode').value = 'add'; setMode(); $('start-date').value = '2026-11-02'; $('day-count').value = '5'; $('holidays').value = ''; $('skip-saturday').checked = true; $('skip-sunday').checked = true; $('workday-form').requestSubmit(); });
  $('copy-result').addEventListener('click', async () => {
    if ($('result').hidden) return; const current = version;
    try { await navigator.clipboard.writeText($('result-output').value); if (current === version) $('copy-status').textContent = '계산 결과를 복사했습니다.'; }
    catch { if (current !== version) return; $('copy-status').textContent = '결과 칸을 선택해 직접 복사하세요.'; $('result-output').focus(); $('result-output').select(); }
  }); setMode();
}
