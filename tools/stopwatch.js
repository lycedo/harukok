'use strict';

function num(raw,name,min=0,max=1e12){const s=String(raw??'').trim();if(!s||s.length>100||!/^\+?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i.test(s))throw Error(name+'에 숫자를 입력하세요.');const n=Number(s);if(!Number.isFinite(n)||n<min||n>max||(n===0&&/[1-9]/.test(s.split(/[eE]/)[0])))throw Error(name+'의 허용 범위를 확인하세요.');return n;}
function positive(raw,name,max=1e12){const n=num(raw,name,0,max);if(n<1e-9)throw Error(name+'은 0.000000001 이상이어야 합니다.');return n;}
function integer(raw,name,min=0,max=1e12){const n=num(raw,name,min,max);if(!Number.isInteger(n))throw Error(name+'은 정수로 입력하세요.');return n;}
function fmt(n){if(!Number.isFinite(n))throw Error('결과가 표시 범위를 넘었습니다.');return Number(n).toLocaleString('ko-KR',{maximumSignificantDigits:12});}
function ceilSafe(n){const r=Math.round(n);return Math.abs(n-r)<=8*Number.EPSILON*Math.max(1,Math.abs(n))?r:Math.ceil(n);}
function floorSafe(n){const r=Math.round(n);return Math.abs(n-r)<=8*Number.EPSILON*Math.max(1,Math.abs(n))?r:Math.floor(n);}
function clock(total,tenth=false){const n=Math.max(0,Math.floor(total)),s=n%60,m=Math.floor(n/60)%60,h=Math.floor(n/3600);return [h,m,s].map(x=>String(x).padStart(2,'0')).join(':')+(tenth?'.'+Math.floor((Math.max(0,total)*10)%10):'');}
function parseDate(raw,name){const s=String(raw??'');if(!/^\d{4}-\d{2}-\d{2}$/.test(s))throw Error(name+'을 YYYY-MM-DD로 입력하세요.');const d=new Date(s+'T00:00:00Z');if(!Number.isFinite(d.getTime())||d.toISOString().slice(0,10)!==s||d.getUTCFullYear()<1900||d.getUTCFullYear()>2100)throw Error(name+'은 1900~2100년의 실제 날짜로 입력하세요.');return d;}
function secureIndex(max){if(!Number.isSafeInteger(max)||max<1||max>4294967296)throw Error('추첨 범위가 올바르지 않습니다.');if(!globalThis.crypto?.getRandomValues)throw Error('이 브라우저는 안전한 난수 생성을 지원하지 않습니다.');const limit=Math.floor(4294967296/max)*max,b=new Uint32Array(1);do{crypto.getRandomValues(b);}while(b[0]>=limit);return b[0]%max;}


function createState(now){return{elapsedMs:0,startedAt:now,running:true};}
function elapsed(state,now){return state.elapsedMs+(state.running?Math.max(0,now-state.startedAt):0);}
function pauseState(state,now){return{elapsedMs:elapsed(state,now),startedAt:now,running:false};}
function resumeState(state,now){return{...state,startedAt:now,running:true};}

function calculate(){return{value:clock(0,true),text:'경과 시간: '+clock(0,true)};}
if(typeof module!=='undefined')module.exports={calculate,createState,elapsed,pauseState,resumeState};

if(typeof document!=='undefined'){
const $=id=>document.getElementById(id);let state=null,timer=null,version=0;
function stopInterval(){if(timer!==null){clearInterval(timer);timer=null;}}
function draw(){if(!state)return;const now=Date.now(),ms=elapsed(state,now),display=clock(ms/1000,true);$('result-value').textContent=display;$('result-text').value='경과 시간: '+display;}
function clear(){version++;stopInterval();state=null;$('result').hidden=true;$('result-text').value='';$('result-value').textContent='';$('error').textContent='';$('copy-status').textContent='';$('timer-status').textContent='';}
$('calculator').addEventListener('input',clear);$('calculator').addEventListener('change',clear);
$('calculator').addEventListener('submit',event=>{event.preventDefault();clear();try{const r=calculate(Object.fromEntries([].map(id=>[id,$(id).value])));state=createState(Date.now());$('result').hidden=false;$('pause').textContent='일시정지';$('pause').disabled=false;$('timer-status').textContent='측정을 시작했습니다.';draw();timer=setInterval(draw,100);$('result').scrollIntoView({block:'nearest'});}catch(error){$('error').textContent=error.message;}});
$('pause').addEventListener('click',()=>{if(!state)return;version++;const now=Date.now();if(state.running){state=pauseState(state,now);stopInterval();$('pause').textContent='다시 시작';$('timer-status').textContent='일시정지했습니다.';}else{state=resumeState(state,now);$('pause').textContent='일시정지';$('timer-status').textContent='다시 시작했습니다.';timer=setInterval(draw,100);}draw();});
$('reset').addEventListener('click',()=>{clear();$('timer-status').textContent='초기화했습니다.';$('start').focus();});
document.addEventListener('visibilitychange',draw);
window.addEventListener('pagehide',stopInterval);
window.addEventListener('pageshow',()=>{draw();if(state?.running&&timer===null)timer=setInterval(draw,100);});
$('copy').addEventListener('click',async()=>{if($('result').hidden)return;const token=version,text=$('result-text').value;try{await navigator.clipboard.writeText(text);if(token===version)$('copy-status').textContent='현재 표시 시간을 복사했습니다.';}catch{if(token!==version)return;$('copy-status').textContent='결과를 선택해 복사하세요.';$('result-text').focus();$('result-text').select();}});
}
