
'use strict';
function num(raw,name='값',min=-1e100,max=1e100){const s=String(raw??'').trim();if(!s||s.length>150||!/^[-+]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[-+]?\d+)?$/i.test(s))throw Error(name+'에 숫자를 입력하세요.');const n=Number(s);if(!Number.isFinite(n)||n<min||n>max||(n===0&&/[1-9]/.test(s.split(/[eE]/)[0])))throw Error(name+'의 범위를 확인하세요.');return n;}
function pos(raw,name='값',max=1e100){const n=num(raw,name,0,max);if(!n)throw Error(name+'은 0보다 커야 합니다.');return n;}
function integer(raw,name='값',min=-1e9,max=1e9){const n=num(raw,name,min,max);if(!Number.isSafeInteger(n))throw Error(name+'은 범위 안의 정수로 넣으세요.');return n;}
function choice(raw,allowed){if(!allowed.includes(raw))throw Error('선택 값을 확인하세요.');return raw;}
function list(raw,min=1,max=2000){const s=String(raw??'').trim();if(!s||s.length>100000)throw Error('숫자 목록을 넣으세요.');const a=s.split(/[\s,;]+/).map(x=>num(x,'목록 값'));if(a.length<min||a.length>max)throw Error('목록 개수를 확인하세요('+min+'~'+max+'개).');return a;}
function safe(n,nonzero=false){if(!Number.isFinite(n)||(nonzero&&n===0))throw Error('결과가 너무 크거나 작아 표시할 수 없습니다.');return Object.is(n,-0)?0:n;}
function fmt(n){n=safe(n);if(!n)return'0';const a=Math.abs(n);return a>=1e15||a<1e-8?n.toExponential(11).replace(/\.?0+e/,'e'):n.toLocaleString('ko-KR',{maximumSignificantDigits:12});}
function done(label,n,text,data={}){safe(n);return{value:label+' '+fmt(n),text:label+': '+fmt(n)+(text?'\n'+text:''),data:{result:n,...data}};}
function sum(a){let total=0,c=0;for(const x of a){const t=total+x;c+=Math.abs(total)>=Math.abs(x)?(total-t)+x:(x-t)+total;total=t;}return safe(total+c);}
function mean(a){return sum(a.map(x=>x/a.length));}
function variance(a,sample=false){if(sample&&a.length<2)throw Error('표본은 두 값 이상 필요합니다.');const m=mean(a);return safe(sum(a.map(x=>(x-m)**2))/(a.length-(sample?1:0)),a.some(x=>x!==m));}
function table(raw,cols=2,max=1000){const s=String(raw??'').trim();if(!s||s.length>100000)throw Error('표를 넣으세요.');const rows=s.split(/\r?\n/).filter(x=>x.trim()).map(x=>x.trim().split(/[\s,;]+/).map(y=>num(y,'표 값')));if(rows.length>max||rows.some(r=>r.length!==cols))throw Error('한 줄에 '+cols+'개 값을 넣으세요.');return rows;}


function calculate(v){const R=pos(v.major),r=pos(v.minor);if(R<=r)throw Error('R은 r보다 커야 합니다.');const volume=2*Math.PI**2*R*r*r,surface=4*Math.PI**2*R*r;return done('부피',volume,'겉넓이: '+fmt(surface),{volume,surface});}
const FIELD_IDS=["major","minor"];

if(typeof module!=='undefined')module.exports={calculate};
if(typeof document!=='undefined'){const $=id=>document.getElementById(id);let version=0;function clear(){version++;$('result').hidden=true;$('result-text').value='';$('result-value').textContent='';$('error').textContent='';$('copy-status').textContent='';}$('calculator').addEventListener('input',clear);$('calculator').addEventListener('change',clear);$('calculator').addEventListener('submit',event=>{event.preventDefault();clear();try{const v=Object.fromEntries(FIELD_IDS.map(id=>[id,$(id).value])),r=calculate(v);$('result-value').textContent=r.value;$('result-text').value=r.text;$('result').hidden=false;$('result').scrollIntoView({block:'nearest'});}catch(e){$('error').textContent=e.message||'입력값을 확인하세요.';}});$('copy').addEventListener('click',async()=>{if($('result').hidden)return;const token=version;try{await navigator.clipboard.writeText($('result-text').value);if(token===version)$('copy-status').textContent='복사했습니다.';}catch{if(token!==version)return;$('result-text').focus();$('result-text').select();$('copy-status').textContent='결과를 선택해 복사하세요.';}});}
