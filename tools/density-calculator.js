'use strict';
const MAX_INPUT=1e100,MIN_INPUT=1e-100;
function num(raw,name,minimum=0,maximum=MAX_INPUT){const s=String(raw??'').trim();if(!s||s.length>100||!/^[-+]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[-+]?\d+)?$/i.test(s))throw Error(name+'에 숫자를 입력하세요.');const n=Number(s);if(!Number.isFinite(n)||n<minimum||n>maximum||(n!==0&&Math.abs(n)<MIN_INPUT)||(n===0&&/[1-9]/.test(s.split(/[eE]/)[0])))throw Error(name+'는 범위 안의 수로 입력하세요(0 또는 절댓값 10⁻¹⁰⁰~10¹⁰⁰).');return n;}
function pos(raw,name){const n=num(raw,name);if(n===0)throw Error(name+'은 0보다 커야 합니다.');return n;}
function integer(raw,name,min,max){const n=num(raw,name,min,max);if(!Number.isInteger(n))throw Error(name+'은 정수로 입력하세요.');return n;}
function choice(raw,allowed){if(!allowed.includes(raw))throw Error('단위나 계산 방법을 확인하세요.');return raw;}
function safe(n,positive=false){if(!Number.isFinite(n)||(positive&&n<=0))throw Error('결과가 너무 크거나 작아 표시할 수 없습니다.');return Object.is(n,-0)?0:n;}
function fmt(n){n=safe(n);if(n===0)return '0';const a=Math.abs(n);return a>=1e15||a<1e-8?n.toExponential(11).replace(/\.?0+e/,'e'):n.toLocaleString('ko-KR',{maximumSignificantDigits:12});}
function done(value,text,data={}){return {value,text,data};}
function missing(v,ids){const blank=ids.filter(id=>!String(v[id]??'').trim());if(blank.length!==1)throw Error('구할 값 한 칸만 비우고 나머지 두 칸을 채우세요.');return blank[0];}
function ksum(xs){let sum=0,c=0;for(const x of xs){const y=x-c,t=sum+y;c=(t-sum)-y;sum=t;}return safe(sum);}
function ohms(r){return r>=1e6?fmt(r/1e6)+'MΩ':r>=1e3?fmt(r/1e3)+'kΩ':fmt(r)+'Ω';}

function calculate(v){const system=choice(v.system,['si','cgs']),id=missing(v,['mass','volume','density']);let mass=id==='mass'?null:pos(v.mass,'질량'),volume=id==='volume'?null:pos(v.volume,'부피'),density=id==='density'?null:pos(v.density,'밀도');if(id==='mass')mass=safe(density*volume,true);else if(id==='volume')volume=safe(mass/density,true);else density=safe(mass/volume,true);const units=system==='si'?{mass:'kg',volume:'m³',density:'kg/m³'}:{mass:'g',volume:'cm³',density:'g/cm³'},values={mass,volume,density},labels={mass:'질량',volume:'부피',density:'밀도'},densitySI=system==='si'?density:density*1000;return done(labels[id]+' '+fmt(values[id])+units[id],'질량: '+fmt(mass)+units.mass+'\n부피: '+fmt(volume)+units.volume+'\n밀도: '+fmt(density)+units.density+(system==='cgs'?'\nSI 밀도: '+fmt(densitySI)+'kg/m³':''),{mass:system==='si'?mass:mass/1000,volume:system==='si'?volume:volume*1e-6,density:densitySI});}

const FIELD_IDS = ["system", "mass", "volume", "density"];

if(typeof module!=='undefined')module.exports={calculate};
if(typeof document!=='undefined'){
 const $=id=>document.getElementById(id);let version=0;
 function clear(){version++;$('result').hidden=true;$('result-text').value='';$('result-value').textContent='';$('error').textContent='';$('copy-status').textContent='';}
 $('calculator').addEventListener('input',clear);$('calculator').addEventListener('change',clear);
 $('calculator').addEventListener('submit',event=>{event.preventDefault();clear();try{const v=Object.fromEntries(FIELD_IDS.map(id=>[id,$(id).value])),r=calculate(v);$('result-value').textContent=r.value;$('result-text').value=r.text;$('result').hidden=false;$('result').scrollIntoView({block:'nearest'});}catch(e){$('error').textContent=e.message;}});
 $('copy').addEventListener('click',async()=>{if($('result').hidden)return;const token=version;try{await navigator.clipboard.writeText($('result-text').value);if(token===version)$('copy-status').textContent='복사했습니다.';}catch{if(token!==version)return;$('copy-status').textContent='결과를 선택해 복사하세요.';$('result-text').focus();$('result-text').select();}});

function updateFields(){const si=$('system').value==='si';document.querySelector('label[for="mass"]').textContent=si?'질량(kg)':'질량(g)';document.querySelector('label[for="volume"]').textContent=si?'부피(m³)':'부피(cm³)';document.querySelector('label[for="density"]').textContent=si?'밀도(kg/m³)':'밀도(g/cm³)';}$('system').addEventListener('change',updateFields);updateFields();

}
