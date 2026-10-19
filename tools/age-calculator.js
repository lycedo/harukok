'use strict';
function calendarDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new Error('생년월일과 기준일을 모두 입력해 주세요.');
  const [y,m,d] = value.split('-').map(Number);
  const date = new Date(Date.UTC(y,m-1,d));
  if (y<1900 || y>2100 || date.toISOString().slice(0,10)!==value) throw new Error('1900~2100년 사이의 실제 달력 날짜를 입력해 주세요.');
  return date;
}
function calculateAge(birthValue, referenceValue) {
  const birth = calendarDate(birthValue), reference = calendarDate(referenceValue);
  if (birth>reference) throw new Error('기준일은 생년월일과 같거나 뒤여야 합니다.');
  const year = reference.getUTCFullYear(), yearAge = year-birth.getUTCFullYear();
  // 2월 29일의 비윤년 기념일은 3월 1일로 표시한다. 법적 기한 계산용이 아니다.
  let anniversary = new Date(Date.UTC(year,birth.getUTCMonth(),birth.getUTCDate()));
  const age = yearAge-(reference<anniversary?1:0);
  if (anniversary<reference) anniversary = new Date(Date.UTC(year+1,birth.getUTCMonth(),birth.getUTCDate()));
  return {age,yearAge,countingAge:yearAge+1,days:Math.round((reference-birth)/86400000),nextBirthday:anniversary.toISOString().slice(0,10),untilBirthday:Math.round((anniversary-reference)/86400000)};
}
if (typeof module!=='undefined') module.exports = {calendarDate,calculateAge};
if (typeof document!=='undefined') {
  const $ = id=>document.getElementById(id), today=new Date();
  $('reference').value=[today.getFullYear(),String(today.getMonth()+1).padStart(2,'0'),String(today.getDate()).padStart(2,'0')].join('-');
  $('age-form').addEventListener('input',()=>{$('age-result').hidden=true;$('age-error').textContent='';});
  $('age-form').addEventListener('submit',event=>{
    event.preventDefault(); $('age-result').hidden=true; $('age-error').textContent='';
    try {
      const r=calculateAge($('birth').value,$('reference').value);
      $('age-value').textContent=`만 ${r.age}세`;
      $('age-types').textContent=`연 나이 ${r.yearAge}세 · 세는나이 ${r.countingAge}세`;
      $('birthday').textContent=r.untilBirthday===0?'기준일이 생일입니다.':`다음 생일 ${r.nextBirthday} · 기준일부터 ${r.untilBirthday}일 남음`;
      $('lived-days').textContent=`태어난 날을 0일로 세면 ${r.days.toLocaleString('ko-KR')}일이 지났습니다.`;
      $('age-result').hidden=false;
    } catch(error) {$('age-error').textContent=error.message;}
  });
  $('age-example').addEventListener('click',()=>{$('birth').value='2000-10-20';$('reference').value='2026-10-19';$('age-form').requestSubmit();});
}
