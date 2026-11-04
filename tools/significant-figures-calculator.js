'use strict';
function num(raw, name, min=-1e12, max=1e12) {
 const s=String(raw??'').trim();
 if(!s||s.length>100||!/^[-+]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[-+]?\d+)?$/i.test(s))throw Error(name+'에 숫자를 입력하세요.');
 const n=Number(s);if(!Number.isFinite(n)||n<min||n>max||(n===0&&/[1-9]/.test(s.split(/[eE]/)[0])))throw Error(name+'의 범위를 확인하세요.');return n;
}
function positive(raw,name,min=1e-12,max=1e12){return num(raw,name,min,max);}
function integer(raw,name,min,max){const n=num(raw,name,min,max);if(!Number.isInteger(n))throw Error(name+'은 정수로 입력하세요.');return n;}
function choice(raw,allowed){if(!allowed.includes(raw))throw Error('계산 방법을 확인하세요.');return raw;}
function fmt(n){if(!Number.isFinite(n))throw Error('표시할 수 없는 크기의 결과입니다.');if(Object.is(n,-0)||n===0)return '0';const a=Math.abs(n);return a>=1e15||a<1e-8?n.toExponential(11).replace(/\.?0+e/,'e'):n.toLocaleString('ko-KR',{maximumSignificantDigits:12});}
function done(value,text,data={}){return {value,text,data};}
function pairRows(raw,names,max=1000){const s=String(raw??'').trim();if(!s||s.length>100000)throw Error('입력은 1~100,000자로 넣으세요.');const rows=s.split(/\r?\n|;/).filter(x=>x.trim());if(rows.length>max)throw Error('최대 '+max+'행까지 입력하세요.');return rows.map((row,index)=>{const p=tokens(row);if(p.length!==2)throw Error((index+1)+'행에 숫자 두 개를 넣으세요.');return p.map((x,i)=>num(x,names[i],-1e9,1e9));});}
function ksum(values){let sum=0,c=0;for(const x of values){const y=x-c,t=sum+y;c=(t-sum)-y;sum=t;}return sum;}
function tokens(raw){const s=raw.trim();if(/^,|,$|,\s*,/.test(s))throw Error('빈 숫자 칸을 확인하세요.');return s.split(/[,\s]+/);}
function term(n,symbol,first=false){if(n===0)return '';return (n<0?'−':first?'':'+')+(Math.abs(n)===1&&symbol?'':fmt(Math.abs(n)))+symbol;}

function decimal(raw,maxExponent=1000){const s=String(raw??'').trim();if(!s||s.length>2000)throw Error('숫자를 2,000자 이내로 넣으세요.');const m=s.match(/^([+-]?)(?:(\d+)(?:\.(\d*))?|\.(\d+))(?:e([+-]?\d{1,5}))?$/i);if(!m)throw Error('올바른 십진수를 넣으세요.');const exp=Number(m[5]||0);if(Math.abs(exp)>maxExponent)throw Error('지수 범위를 확인하세요.');const whole=m[2]||'',fraction=m[3]??m[4]??'',all=whole+fraction,leading=(all.match(/^0*/)||[''])[0].length,digits=all.slice(leading)||'0';return {negative:m[1]==='-',digits,exponent:whole.length+exp-leading-1,scale:fraction.length-exp};}

function calculate(v){const p=decimal(v.source),n=integer(v.digits,'유효숫자',1,15);let digits=p.digits.slice(0,n).padEnd(n,'0'),exponent=p.exponent;if(p.digits==='0'){digits='0'.repeat(n);exponent=0;}else if(p.digits.length>n&&p.digits[n]>='5'){digits=(BigInt(digits)+1n).toString();if(digits.length>n){digits=digits.slice(0,n);exponent++;}}const point=exponent+1,sign=p.negative&&p.digits!=='0'?'-':'';let plain;if(p.digits==='0')plain=n===1?'0':'0.'+'0'.repeat(n-1);else if(point<=0)plain='0.'+'0'.repeat(-point)+digits;else if(point>=n)plain=digits+'0'.repeat(point-n);else plain=digits.slice(0,point)+'.'+digits.slice(point);plain=sign+plain;const mantissa=digits[0]+(n>1?'.'+digits.slice(1):''),scientific=sign+mantissa+' × 10^'+exponent;return done(scientific,'십진수: '+plain+'\n과학적 표기: '+scientific+'\n유효숫자: '+n,{plain,scientific,digits:n});}

const FIELD_IDS = ["source", "digits"];

if(typeof module!=='undefined')module.exports={calculate};
if(typeof document!=='undefined'){
 const $=id=>document.getElementById(id);let version=0;
 function clear(){version++;$('result').hidden=true;$('result-text').value='';$('result-value').textContent='';$('error').textContent='';$('copy-status').textContent='';}
 $('calculator').addEventListener('input',clear);$('calculator').addEventListener('change',clear);
 $('calculator').addEventListener('submit',event=>{event.preventDefault();clear();try{const v=Object.fromEntries(FIELD_IDS.map(id=>[id,$(id).value])),r=calculate(v);$('result-value').textContent=r.value;$('result-text').value=r.text;$('result').hidden=false;$('result').scrollIntoView({block:'nearest'});}catch(e){$('error').textContent=e.message;}});
 $('copy').addEventListener('click',async()=>{if($('result').hidden)return;const token=version;try{await navigator.clipboard.writeText($('result-text').value);if(token===version)$('copy-status').textContent='복사했습니다.';}catch{if(token!==version)return;$('copy-status').textContent='결과를 선택해 복사하세요.';$('result-text').focus();$('result-text').select();}});

}
