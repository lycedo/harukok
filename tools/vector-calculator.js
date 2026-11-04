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

function vector(raw,name){const s=String(raw??'').trim();if(!s||s.length>500)throw Error(name+'에 성분 2개 또는 3개를 넣으세요.');const parts=tokens(s);if(![2,3].includes(parts.length))throw Error(name+'는 2차원 또는 3차원이어야 합니다.');return parts.map(x=>num(x,name,-1e9,1e9));}
function calculate(v){const a=vector(v.a,'A'),b=vector(v.b,'B');if(a.length!==b.length)throw Error('두 벡터의 차원을 같게 입력하세요.');const sum=a.map((x,i)=>x+b[i]),difference=a.map((x,i)=>x-b[i]),dot=ksum(a.map((x,i)=>x*b[i])),lengthA=Math.hypot(...a),lengthB=Math.hypot(...b),cosine=lengthA===0||lengthB===0?null:ksum(a.map((x,i)=>(x/lengthA)*(b[i]/lengthB))),angle=cosine===null?null:Math.acos(Math.min(1,Math.max(-1,cosine)))*180/Math.PI,cross=a.length===3?[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]]:null,show=xs=>'('+xs.map(fmt).join(', ')+')';return done('내적 '+fmt(dot),'A+B: '+show(sum)+'\nA−B: '+show(difference)+'\n내적: '+fmt(dot)+'\nA 길이: '+fmt(lengthA)+'\nB 길이: '+fmt(lengthB)+'\n사이각: '+(angle===null?'정의되지 않음':fmt(angle)+'°')+(cross?'\n외적 A×B: '+show(cross):''),{sum,difference,dot,lengthA,lengthB,angle,cross});}

const FIELD_IDS = ["a", "b"];

if(typeof module!=='undefined')module.exports={calculate};
if(typeof document!=='undefined'){
 const $=id=>document.getElementById(id);let version=0;
 function clear(){version++;$('result').hidden=true;$('result-text').value='';$('result-value').textContent='';$('error').textContent='';$('copy-status').textContent='';}
 $('calculator').addEventListener('input',clear);$('calculator').addEventListener('change',clear);
 $('calculator').addEventListener('submit',event=>{event.preventDefault();clear();try{const v=Object.fromEntries(FIELD_IDS.map(id=>[id,$(id).value])),r=calculate(v);$('result-value').textContent=r.value;$('result-text').value=r.text;$('result').hidden=false;$('result').scrollIntoView({block:'nearest'});}catch(e){$('error').textContent=e.message;}});
 $('copy').addEventListener('click',async()=>{if($('result').hidden)return;const token=version;try{await navigator.clipboard.writeText($('result-text').value);if(token===version)$('copy-status').textContent='복사했습니다.';}catch{if(token!==version)return;$('copy-status').textContent='결과를 선택해 복사하세요.';$('result-text').focus();$('result-text').select();}});

}
