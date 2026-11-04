'use strict';

function num(raw,name,min=0,max=1e12){const s=String(raw??'').trim();if(!s||s.length>100||!/^[-+]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[-+]?\d+)?$/i.test(s))throw Error(name+'에 숫자를 입력하세요.');const n=Number(s);if(!Number.isFinite(n)||n<min||n>max||(n===0&&/[1-9]/.test(s.split(/[eE]/)[0])))throw Error(name+'의 허용 범위를 확인하세요.');return n;}
function integer(raw,name,min,max){const n=num(raw,name,min,max);if(!Number.isInteger(n))throw Error(name+'은 정수로 입력하세요.');return n;}
function positive(raw,name,max=1e12){return num(raw,name,1e-9,max);}
function fmt(n){if(!Number.isFinite(n))throw Error('결과가 표시 범위를 넘었습니다.');return n.toLocaleString('ko-KR',{maximumSignificantDigits:12});}
function money(n){if(!Number.isSafeInteger(n))throw Error('원 단위 금액이 정확히 표시할 수 있는 범위를 넘었습니다.');return n.toLocaleString('ko-KR',{maximumFractionDigits:0});}
function ceilSafe(n){const r=Math.round(n);return r!==0&&Math.abs(n-r)<=8*Number.EPSILON*Math.max(1,Math.abs(n))?r:Math.ceil(n);}
function parseDate(raw,name){const s=String(raw??'');if(!/^\d{4}-\d{2}-\d{2}$/.test(s))throw Error(name+'을 YYYY-MM-DD로 입력하세요.');const d=new Date(s+'T00:00:00Z');if(!Number.isFinite(d.getTime())||d.toISOString().slice(0,10)!==s||d.getUTCFullYear()<1900||d.getUTCFullYear()>2100)throw Error(name+'은 1900~2100년의 실제 날짜로 입력하세요.');return d.getTime();}
function namedRows(raw,max=100){const text=String(raw??'').trim();if(!text||text.length>20000)throw Error('목록을 1~20,000자로 입력하세요.');const lines=text.split(/\r\n?|\n/).filter(s=>s.trim());if(lines.length>max)throw Error('최대 '+max+'행까지 입력하세요.');const seen=new Set();return lines.map((line,index)=>{const fields=line.split(/\t|,/);if(fields.length!==2)throw Error((index+1)+'행은 이름,값 형식으로 입력하세요.');const name=fields[0].trim().normalize('NFC');if(!name||Array.from(name).length>30||seen.has(name))throw Error('이름은 중복 없이 1~30자로 입력하세요.');seen.add(name);return{name,raw:fields[1].trim()};});}

function calculate(v){
 const source=String(v.intervals??'').trim();if(!source||source.length>10000)throw Error('간격을 한 개 이상 넣거나 박자를 두 번 이상 누르세요.');const parts=source.split(/[\s,;]+/);if(parts.length>100)throw Error('입력 간격은 최대 100개입니다.');const intervals=parts.map(s=>num(s,'간격',50,6000)),mean=intervals.reduce((a,n)=>a+n,0)/intervals.length,bpm=60000/mean;return{value:fmt(bpm)+'BPM',text:'평균 BPM: '+fmt(bpm)+'\n평균 간격: '+fmt(mean)+'ms\n측정 간격 수: '+intervals.length+'개',bpm,mean,count:intervals.length};
}
if(typeof module!=='undefined')module.exports={calculate};

if(typeof document!=='undefined'){
 const $=id=>document.getElementById(id);let version=0;let lastTap=null,samples=[],writing=false;
 function resetTaps(){lastTap=null;samples=[];}
 window.addEventListener('pagehide',resetTaps);

 function clear(){version++;$('result').hidden=true;$('result-text').value='';$('result-value').textContent='';$('error').textContent='';$('copy-status').textContent='';}
 $('calculator').addEventListener('input',()=>{clear();if(!writing){resetTaps();$('tap-status').textContent='입력한 간격으로 계산합니다.';}});$('calculator').addEventListener('change',clear);
 $('calculator').addEventListener('submit',event=>{event.preventDefault();clear();try{const values=Object.fromEntries(["intervals"].map(id=>[id,$(id).value])),r=calculate(values);$('result-value').textContent=r.value;$('result-text').value=r.text;$('result').hidden=false;$('result').scrollIntoView({block:'nearest'});}catch(error){$('error').textContent=error.message;}});
 $('copy').addEventListener('click',async()=>{if($('result').hidden)return;const token=version;try{await navigator.clipboard.writeText($('result-text').value);if(token===version)$('copy-status').textContent='복사했습니다.';}catch{if(token!==version)return;$('copy-status').textContent='결과를 선택해 복사하세요.';$('result-text').focus();$('result-text').select();}});
 $('tap').addEventListener('click',()=>{const now=performance.now();if(lastTap===null||now-lastTap>6000){resetTaps();lastTap=now;clear();$('tap-status').textContent='첫 박자입니다. 한 번 더 누르세요.';return;}const interval=now-lastTap;if(interval<50){$('tap-status').textContent='50ms 이상 간격으로 누르세요.';return;}lastTap=now;samples.push(interval);if(samples.length>32)samples.shift();writing=true;$('intervals').value=samples.map(n=>String(Math.round(n*1000)/1000)).join(String.fromCharCode(10));writing=false;$('calculator').requestSubmit();$('tap-status').textContent=samples.length+'개 간격을 측정했습니다.';});
 $('tap-reset').addEventListener('click',()=>{resetTaps();clear();$('intervals').value='';$('tap-status').textContent='탭 측정을 초기화했습니다.';$('tap').focus();});
}
