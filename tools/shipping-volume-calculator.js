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


function calculate(v){const volume=positive(v.width,'가로',10000)*positive(v.length,'세로',10000)*positive(v.height,'높이',10000),count=integer(v.count,'박스 개수',1,10000),div=positive(v.divisor,'나눗값',1e9);return{value:fmt(volume*count/1e6)+'CBM',text:'전체 부피: '+fmt(volume*count/1e6)+'CBM\n박스당 부피: '+fmt(volume/1e6)+'CBM\n전체 부피무게: '+fmt(volume*count/div)+'kg\n박스당 부피무게: '+fmt(volume/div)+'kg\n적용 나눗값: '+fmt(div)+'cm³/kg'};}
if(typeof module!=='undefined')module.exports={calculate};

if(typeof document!=='undefined'){
const $=id=>document.getElementById(id);let version=0;
function clear(){version++;$('result').hidden=true;$('result-text').value='';$('result-value').textContent='';$('error').textContent='';$('copy-status').textContent='';}
$('calculator').addEventListener('input',clear);$('calculator').addEventListener('change',clear);
$('calculator').addEventListener('submit',event=>{event.preventDefault();clear();try{const values=Object.fromEntries(["width","length","height","count","divisor"].map(id=>[id,$(id).value])),r=calculate(values);$('result-value').textContent=r.value;$('result-text').value=r.text;$('result').hidden=false;$('result').scrollIntoView({block:'nearest'});}catch(error){$('error').textContent=error.message;}});
$('copy').addEventListener('click',async()=>{if($('result').hidden)return;const token=version;try{await navigator.clipboard.writeText($('result-text').value);if(token===version)$('copy-status').textContent='복사했습니다.';}catch{if(token!==version)return;$('copy-status').textContent='결과를 선택해 복사하세요.';$('result-text').focus();$('result-text').select();}});
}
