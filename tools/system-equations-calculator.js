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

function exactSystem(raw){const entries=raw.map(value=>{const m=String(value).trim().match(/^([+-]?)(?:(\d+)(?:\.(\d*))?|\.(\d+))(?:e([+-]?\d+))?$/i),fraction=m[3]??m[4]??'';let coefficient=BigInt((m[1]==='-'?'-':'')+((m[2]||'')+fraction||'0'));if(coefficient===0n)return{coefficient:0n,scale:0};let scale=fraction.length-Number(m[5]||0);if(Math.abs(scale)>1000)throw Error('계수의 소수 자릿수가 너무 큽니다.');if(scale<0){coefficient*=10n**BigInt(-scale);scale=0;}return{coefficient,scale};}),scale=Math.max(...entries.map(x=>x.scale)),[a,b,c,d,e,f]=entries.map(x=>x.coefficient*10n**BigInt(scale-x.scale));return{det:a*e-b*d,dx:c*e-b*f,dy:a*f-c*d};}
function calculate(v){const names=['a','b','c','d','e','f'],values=names.map(name=>num(v[name],name,-1e6,1e6));let[a,b,c,d,e,f]=values;const s1=Math.max(Math.abs(a),Math.abs(b)),s2=Math.max(Math.abs(d),Math.abs(e)),exact=exactSystem(names.map(name=>v[name]));let kind;
if((s1===0&&c!==0)||(s2===0&&f!==0))kind='none';else if(exact.det===0n)kind=exact.dx===0n&&exact.dy===0n?'infinite':'none';
if(!kind){a/=s1;b/=s1;c/=s1;d/=s2;e/=s2;f/=s2;if(!Number.isFinite(c)||!Number.isFinite(f)||Math.max(Math.abs(c),Math.abs(f))>1e300)throw Error('계수 크기 차이가 너무 커 계산할 수 없습니다.');const det=a*e-b*d,dx=c*e-b*f,dy=a*f-c*d;if(det===0||Math.abs(det)<=1e-12*(Math.abs(a*e)+Math.abs(b*d)))throw Error('두 식의 계수가 너무 비슷해 안정적으로 계산할 수 없습니다.');const x=dx/det,y=dy/det;return done('x = '+fmt(x)+', y = '+fmt(y),'x = '+fmt(x)+'\ny = '+fmt(y)+'\n식: ax+by=c, dx+ey=f',{x,y});}
const text=kind==='none'?'해가 없습니다.':'해가 무수히 많습니다.';return done(text,text,{kind});}

const FIELD_IDS = ["a", "b", "c", "d", "e", "f"];

if(typeof module!=='undefined')module.exports={calculate};
if(typeof document!=='undefined'){
 const $=id=>document.getElementById(id);let version=0;
 function clear(){version++;$('result').hidden=true;$('result-text').value='';$('result-value').textContent='';$('error').textContent='';$('copy-status').textContent='';}
 $('calculator').addEventListener('input',clear);$('calculator').addEventListener('change',clear);
 $('calculator').addEventListener('submit',event=>{event.preventDefault();clear();try{const v=Object.fromEntries(FIELD_IDS.map(id=>[id,$(id).value])),r=calculate(v);$('result-value').textContent=r.value;$('result-text').value=r.text;$('result').hidden=false;$('result').scrollIntoView({block:'nearest'});}catch(e){$('error').textContent=e.message;}});
 $('copy').addEventListener('click',async()=>{if($('result').hidden)return;const token=version;try{await navigator.clipboard.writeText($('result-text').value);if(token===version)$('copy-status').textContent='복사했습니다.';}catch{if(token!==version)return;$('copy-status').textContent='결과를 선택해 복사하세요.';$('result-text').focus();$('result-text').select();}});

}
