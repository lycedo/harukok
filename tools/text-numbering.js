'use strict';
function raw(v,id,max=100000){const s=String(v[id]??'');if(s.length>max)throw Error('입력 길이를 줄이세요.');return s;}
function required(v,id,max=100000){const s=raw(v,id,max);if(!s.trim())throw Error('입력칸을 채우세요.');return s;}
function choice(v,id,allowed){const s=String(v[id]??'');if(!allowed.includes(s))throw Error('선택 값을 확인하세요.');return s;}
function numeric(v,id,min,max,integer=false){const s=required(v,id,80).trim();if(!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(s))throw Error('숫자를 입력하세요.');const n=Number(s);if(!Number.isFinite(n)||n<min||n>max||(integer&&!Number.isInteger(n)))throw Error('숫자 범위를 확인하세요.');return n;}
function lines(s,max=10000,terminal=true){const a=s.replace(/\r\n?/g,'\n').split('\n');if(terminal&&a.length>1&&a[a.length-1]==='')a.pop();if(a.length>max)throw Error('줄 수를 줄이세요.');return a;}
function decimalKey(s){const m=s.match(/^(-?)(\d+)(?:\.(\d+))?(?:[eE]([+-]?\d+))?$/);if(!m)return'';let digits=(m[2]+(m[3]||'')).replace(/^0+/,''),exponent=Number(m[4]||0)-(m[3]||'').length;if(!digits)return'0';const zeros=(digits.match(/0+$/)||[''])[0].length;if(zeros){digits=digits.slice(0,-zeros);exponent+=zeros;}return m[1]+digits+'e'+exponent;}
function json(v,id){let value;try{const source=required(v,id);for(const m of source.matchAll(/"(?:\\[\s\S]|[^"\\])*"|(-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?)/g)){if(m[1]&&decimalKey(m[1])!==decimalKey(String(Number(m[1]))))throw Error('precision');}value=JSON.parse(source,(_,x)=>{if(typeof x==='number'&&(!Number.isFinite(x)||(Number.isInteger(x)&&!Number.isSafeInteger(x))))throw Error('number');return x;});const frames=[];for(const m of source.matchAll(/"(?:\\[\s\S]|[^"\\])*"|[{}[\],:]/g)){const t=m[0],f=frames[frames.length-1];if(t==='{')frames.push({object:true,keys:new Set(),key:true});else if(t==='[')frames.push({object:false});else if(t==='}'||t===']')frames.pop();else if(t===','&&f?.object)f.key=true;else if(t.startsWith('"')&&f?.object&&f.key){const k=JSON.parse(t);if(f.keys.has(k))throw Error('duplicate');f.keys.add(k);f.key=false;}}}catch{throw Error('JSON 문법·중복 키를 확인하세요. 큰 정수·정밀한 소수는 문자열로 넣으세요.');}let stack=[[value,0]],nodes=0;while(stack.length){const [x,d]=stack.pop();if(++nodes>10000||d>40)throw Error('JSON 크기나 중첩을 줄이세요.');if(x&&typeof x==='object')for(const k of Object.keys(x))stack.push([x[k],d+1]);}return value;}
function pointer(s){return String(s).replace(/~/g,'~0').replace(/\//g,'~1');}
function output(text,label='완료'){if(text.length>1000000)throw Error('결과가 너무 큽니다. 입력을 줄이세요.');return{value:label,text};}
function compact(n){return String(Number(n.toFixed(8)));}

function calculate(v){
 const s=raw(v,'source'),start=numeric(v,'start',0,1e9,true),step=numeric(v,'step',1,100000,true),separator=raw(v,'separator',50),empty=choice(v,'empty',['skip','include']);if(/[\r\n]/.test(separator))throw Error('구분 글자에는 줄바꿈을 넣지 마세요.');let next=start,count=0;const normalized=s.replace(/\r\n?/g,'\n'),terminal=normalized.endsWith('\n');const rows=lines(normalized).map(x=>{if(!x&&empty==='skip')return x;const r=next+separator+x;next+=step;count++;return r;});return output(rows.join('\n')+(terminal?'\n':''),count+'개 번호');
 }
const FIELD_IDS=["source","start","step","separator","empty"];

if(typeof module!=='undefined')module.exports={calculate};
if(typeof document!=='undefined'){
const $=id=>document.getElementById(id);let version=0;
function clear(){version++;$('result').hidden=true;$('result-text').value='';$('result-value').textContent='';$('error').textContent='';$('copy-status').textContent='';}
$('calculator').addEventListener('input',clear);$('calculator').addEventListener('change',clear);
$('calculator').addEventListener('submit',e=>{e.preventDefault();clear();try{const v=Object.fromEntries(FIELD_IDS.map(id=>[id,$(id).value])),r=calculate(v);$('result-value').textContent=r.value;$('result-text').value=r.text;$('result').hidden=false;$('result').scrollIntoView({block:'nearest'});}catch(err){$('error').textContent=err.message||'입력값을 확인하세요.';}});
$('copy').addEventListener('click',async()=>{if($('result').hidden)return;const current=version;try{await navigator.clipboard.writeText($('result-text').value);if(current===version)$('copy-status').textContent='복사했습니다.';}catch{if(current!==version)return;$('copy-status').textContent='결과를 선택해 복사하세요.';$('result-text').focus();$('result-text').select();}});
}
