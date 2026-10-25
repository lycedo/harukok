'use strict';
const DAY = 86400000;
function parseDay(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new Error('날짜를 빠짐없이 입력해 주세요.');
  const [year,month,day] = value.split('-').map(Number);
  const time = Date.UTC(year,month-1,day), date = new Date(time);
  if (year < 1900 || year > 2100 || date.getUTCFullYear() !== year || date.getUTCMonth() !== month-1 || date.getUTCDate() !== day) throw new Error('1900년부터 2100년 사이의 올바른 날짜를 입력해 주세요.');
  return time;
}
function daysBetween(start,end,inclusive=false) {
  const signed = (parseDay(end)-parseDay(start))/DAY;
  return {signed,days:Math.abs(signed)+(inclusive?1:0)};
}
function addDays(start,days,nth=false) {
  if (!Number.isInteger(days) || Math.abs(days)>36525 || (nth && days<1)) throw new Error(nth?'몇 일째인지는 1~36,525 사이의 정수로 입력해 주세요.':'일수는 -36,525~36,525 사이의 정수로 입력해 주세요.');
  const date = new Date(parseDay(start)+(days-(nth?1:0))*DAY);
  const result = date.toISOString().slice(0,10);
  parseDay(result);
  return result;
}
if (typeof module !== 'undefined') module.exports = {parseDay,daysBetween,addDays};
if (typeof document !== 'undefined') {
  const $ = id => document.getElementById(id);
  const today = new Date();
  const localDay = [today.getFullYear(),String(today.getMonth()+1).padStart(2,'0'),String(today.getDate()).padStart(2,'0')].join('-');
  $('start').value = localDay; $('end').value = addDays(localDay,30); $('base').value = localDay;
  const format = date => new Intl.DateTimeFormat('ko-KR',{dateStyle:'full',timeZone:'UTC'}).format(new Date(parseDay(date)));
  for (const prefix of ['difference','offset']) {
    $(prefix+'-form').addEventListener('input',() => {$(prefix+'-result').hidden=true; $(prefix+'-error').textContent='';});
  }
  $('difference-form').addEventListener('submit',event => {
    event.preventDefault(); $('difference-error').textContent=''; $('difference-result').hidden=true;
    try {
      const {signed,days} = daysBetween($('start').value,$('end').value,$('inclusive').checked);
      $('difference-value').textContent = days.toLocaleString('ko-KR')+'일';
      $('dday').textContent = signed===0?'D-Day · 두 날짜가 같습니다.':signed>0?`D-${signed} · 기준일부터 목표일까지 ${signed}일 남음`:`D+${-signed} · 목표일로부터 기준일까지 ${-signed}일 지남`;
      $('difference-detail').textContent = $('inclusive').checked ? '양 끝 날짜를 모두 포함한 날짜 수입니다. D-Day 표기는 날짜 차이 기준으로 유지됩니다.' : '기준일은 0일로 세었습니다. ' + Math.floor(days/7)+'주 '+days%7+'일 차이입니다.';
      $('difference-result').hidden=false; $('difference-result').scrollIntoView({block:'nearest'});
    } catch (error) { $('difference-error').textContent=error.message; }
  });
  function updateCountMode() {
    const mode=$('count-mode').value; $('days').min=mode==='nth'?'1':'0';
    $('days-hint').textContent=mode==='before'?'예: 7일 전은 7을 입력하세요.':mode==='nth'?'시작한 날이 1일째입니다. 예: 100일 기념일은 100.':'예: 100일 뒤는 100을 입력하세요.';
  }
  $('count-mode').addEventListener('change',updateCountMode);
  $('offset-form').addEventListener('submit',event => {
    event.preventDefault(); $('offset-error').textContent=''; $('offset-result').hidden=true;
    try {
      if ($('days').value.trim()==='') throw new Error('계산할 일수를 입력해 주세요.');
      const nth = $('count-mode').value==='nth', entered = Number($('days').value);
      if (!Number.isInteger(entered) || entered<0) throw new Error('일수는 0 이상의 정수로 입력해 주세요. 이전 날짜는 며칠 전을 선택하세요.');
      const days=$('count-mode').value==='before'?-entered:entered;
      const date = addDays($('base').value,days,nth);
      $('offset-value').textContent = date;
      $('offset-detail').textContent = format(date)+' · '+(nth?`시작일을 1일째로 센 ${days}일째`:`기준일부터 ${Math.abs(days)}일 ${days<0?'전':'후'}`);
      $('offset-result').hidden=false; $('offset-result').scrollIntoView({block:'nearest'});
    } catch (error) { $('offset-error').textContent=error.message; }
  });
  $('example-date').addEventListener('click',() => {
    $('base').value='2026-10-18'; $('days').value='100'; $('count-mode').value='nth'; updateCountMode(); $('offset-form').requestSubmit();
  });
}
