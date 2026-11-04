'use strict';
const MAX_INPUT=1e50,MIN_INPUT=1e-50,R_GAS=8.31446261815324,AVOGADRO=6.02214076e23,PLANCK=6.62607015e-34,LIGHT=299792458,E_CHARGE=1.602176634e-19,GRAVITY=6.67430e-11,COULOMB=8.9875517862e9;
function num(raw,name,minimum=0,maximum=MAX_INPUT){const s=String(raw??'').trim();if(!s||s.length>100||!/^[-+]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[-+]?\d+)?$/i.test(s))throw Error(name+'에 숫자를 입력하세요.');const n=Number(s);if(!Number.isFinite(n)||n<minimum||n>maximum||(n!==0&&Math.abs(n)<MIN_INPUT)||(n===0&&/[1-9]/.test(s.split(/[eE]/)[0])))throw Error(name+'의 입력 범위를 확인하세요(0 또는 절댓값 10⁻⁵⁰~10⁵⁰).');return n;}
function pos(raw,name){const n=num(raw,name);if(n===0)throw Error(name+'은 0보다 커야 합니다.');return n;}
function signed(raw,name){return num(raw,name,-MAX_INPUT,MAX_INPUT);}
function integer(raw,name,min,max){const n=num(raw,name,min,max);if(!Number.isInteger(n))throw Error(name+'은 정수로 입력하세요.');return n;}
function choice(raw,allowed){if(!allowed.includes(raw))throw Error('계산 방법이나 단위를 확인하세요.');return raw;}
function safe(n,nonzero=false){if(!Number.isFinite(n)||(nonzero&&n===0))throw Error('결과가 너무 크거나 작아 표시할 수 없습니다.');return Object.is(n,-0)?0:n;}
function fmt(n){n=safe(n);if(n===0)return '0';const a=Math.abs(n);return a>=1e15||a<1e-8?n.toExponential(11).replace(/\.?0+e/,'e'):n.toLocaleString('ko-KR',{maximumSignificantDigits:12});}
function done(value,text,data={}){return{value,text,data};}
function missing(v,ids){const blank=ids.filter(id=>!String(v[id]??'').trim());if(blank.length!==1)throw Error('구할 값 한 칸만 비우세요.');return blank[0];}

function calculate(v){const initial=num(v.initial,'초기량'),halfLife=pos(v.halfLife,'반감기'),time=num(v.time,'경과 시간'),periods=time/halfLife,logFraction=-Math.LN2*periods,fraction=Math.exp(logFraction),remaining=initial===0?0:time===0?initial:safe(Math.exp(Math.log(initial)+logFraction),true),lost=initial===0?0:safe(-initial*Math.expm1(logFraction),time!==0);let percent=fmt(fraction*100);if(fraction===0&&initial!==0){const logPercent=logFraction+Math.log(100),exponent=Math.floor(logPercent/Math.LN10);percent=fmt(Math.exp(logPercent-exponent*Math.LN10))+'e'+exponent;}return done('남은 양 '+fmt(remaining),'남은 양: '+fmt(remaining)+'\n감소량: '+fmt(lost)+'\n남은 비율: '+percent+'%\n경과 반감기 수: '+fmt(periods),{remaining,lost,fraction,periods});}

const FIELD_IDS = ["initial", "halfLife", "time"];

if(typeof module!=='undefined')module.exports={calculate};
if(typeof document!=='undefined'){
 const $=id=>document.getElementById(id);let version=0;
 function clear(){version++;$('result').hidden=true;$('result-text').value='';$('result-value').textContent='';$('error').textContent='';$('copy-status').textContent='';}
 $('calculator').addEventListener('input',clear);$('calculator').addEventListener('change',clear);
 $('calculator').addEventListener('submit',event=>{event.preventDefault();clear();try{const v=Object.fromEntries(FIELD_IDS.map(id=>[id,$(id).value])),r=calculate(v);$('result-value').textContent=r.value;$('result-text').value=r.text;$('result').hidden=false;$('result').scrollIntoView({block:'nearest'});}catch(e){$('error').textContent=e.message;}});
 $('copy').addEventListener('click',async()=>{if($('result').hidden)return;const token=version;try{await navigator.clipboard.writeText($('result-text').value);if(token===version)$('copy-status').textContent='복사했습니다.';}catch{if(token!==version)return;$('copy-status').textContent='결과를 선택해 복사하세요.';$('result-text').focus();$('result-text').select();}});

}
