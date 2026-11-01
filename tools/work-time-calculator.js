'use strict';
function clockMinutes(value) {
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(value)) throw new Error('출퇴근 시각을 모두 입력해 주세요.');
  const [h,m]=value.split(':').map(Number); return h*60+m;
}
function workMinutes(start,end,rest,nextDay) {
  const span=clockMinutes(end)-clockMinutes(start)+(nextDay?1440:0);
  if (span<0) throw new Error('퇴근이 출근보다 이릅니다. 다음 날 퇴근인지 확인해 주세요.');
  if (span>1440) throw new Error('24시간을 넘는 근무는 날짜별로 나누어 계산해 주세요.');
  if (!Number.isInteger(rest)||rest<0||rest>span) throw new Error('휴게시간은 전체 경과시간 이내의 0 이상 정수로 입력해 주세요.');
  return {span,minutes:span-rest};
}
if(typeof module!=='undefined')module.exports={clockMinutes,workMinutes};
if(typeof document!=='undefined'){
 const $=id=>document.getElementById(id);
 function clear(){ $('result').hidden=true;$('error').textContent=''; }
 $('calculator').addEventListener('input',clear);$('calculator').addEventListener('change',clear);
 $('calculator').addEventListener('submit',e=>{
  e.preventDefault();clear();try{
   if($('break-minutes').value.trim()==='')throw new Error('휴게시간이 없으면 0을 입력해 주세요.');
   const r=workMinutes($('start').value,$('end').value,Number($('break-minutes').value),$('next-day').checked);
   $('result-value').textContent=Math.floor(r.minutes/60)+'시간 '+r.minutes%60+'분';
   $('result-detail').textContent='총 '+r.minutes+'분 · 소수 시간 '+(r.minutes/60).toLocaleString('ko-KR',{maximumFractionDigits:4})+'시간 · 휴게 전 '+r.span+'분';
   $('result').hidden=false;
  }catch(error){$('error').textContent=error.message;}
 });
}
