'use strict';
function raw(v,id,max=100000){const s=String(v[id]??'');if(s.length>max)throw Error('입력 길이를 줄이세요.');return s;}
function required(v,id,max=100000){const s=raw(v,id,max);if(!s.trim())throw Error('입력칸을 채우세요.');return s;}
function integer(v,id,min,max){const s=required(v,id,100).trim();if(!/^-?\d+$/.test(s))throw Error('정수를 입력하세요.');const n=Number(s);if(!Number.isSafeInteger(n)||n<min||n>max)throw Error('정수 범위를 확인하세요.');return n;}
function choice(v,id,allowed){const s=String(v[id]??'');if(!allowed.includes(s))throw Error('선택 값을 확인하세요.');return s;}
function lines(s,max=1000){const a=s.replace(/\r\n?/g,'\n').split('\n');if(a.length>1&&a[a.length-1]==='')a.pop();if(a.length>max)throw Error('줄 수를 줄이세요.');return a;}
function output(text,value='완료'){if(text.length>1000000)throw Error('결과가 너무 큽니다. 입력을 줄이세요.');return{value,text};}
function validUnicode(s){for(let i=0;i<s.length;i++){const n=s.charCodeAt(i);if(n>=0xD800&&n<=0xDBFF){const next=s.charCodeAt(++i);if(!(next>=0xDC00&&next<=0xDFFF))throw Error('잘못된 유니코드 문자가 있습니다.');}else if(n>=0xDC00&&n<=0xDFFF)throw Error('잘못된 유니코드 문자가 있습니다.');}}
function utf8(bytes){try{return new TextDecoder('utf-8',{fatal:true,ignoreBOM:true}).decode(bytes);}catch{throw Error('올바른 UTF-8 글자가 아닙니다.');}}
function table(s){const rows=lines(s,200).map(row=>row.split('\t')),width=rows[0].length;if(width>30||rows.some(row=>row.length!==width))throw Error('최대 200행·30열이며 열 수를 맞추세요.');return rows;}
function safeURL(s){validUnicode(s);let u;try{u=new URL(s);}catch{throw Error('전체 http·https 주소를 넣으세요.');}if(!['http:','https:'].includes(u.protocol)||u.username||u.password)throw Error('계정 정보 없는 http·https 주소를 넣으세요.');return u;}


function calculate(v){const s=raw(v,'source',300000),mode=choice(v,'mode',['encode','decode']);if(mode==='encode'){validUnicode(s);if(Array.from(s).length>20000)throw Error('원문은 최대 20,000 코드 포인트입니다.');const runs=[];for(const c of s){const last=runs[runs.length-1];if(last&&last[0]===c)last[1]++;else runs.push([c,1]);}return output(JSON.stringify(runs),runs.length+'개 묶음');}let runs;try{runs=JSON.parse(s);}catch{throw Error('문자·횟수 JSON 배열을 넣으세요.');}for(const m of s.matchAll(/"(?:\\.|[^"\\])*"|(-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?)/g))if(m[1]&&!/^[1-9]\d{0,4}$/.test(m[1]))throw Error('횟수는 양의 십진 정수 리터럴로 넣으세요.');if(!Array.isArray(runs)||runs.length>20000)throw Error('문자·횟수 배열을 확인하세요.');let length=0,out='';for(const run of runs){if(!Array.isArray(run)||run.length!==2||typeof run[0]!=='string'||Array.from(run[0]).length!==1||!Number.isSafeInteger(run[1])||run[1]<1)throw Error('각 묶음은 문자 하나와 양의 정수입니다.');validUnicode(run[0]);length+=run[1];if(length>20000)throw Error('복원은 최대 20,000 코드 포인트입니다.');out+=run[0].repeat(run[1]);}return output(out,length+'코드 포인트 복원');}
const FIELD_IDS=["source","mode"];

if(typeof module!=='undefined')module.exports={calculate};
if(typeof document!=='undefined'){
const $=id=>document.getElementById(id);let version=0;
function clear(){version++;$('result').hidden=true;$('result-text').value='';$('result-value').textContent='';$('error').textContent='';$('copy-status').textContent='';}
$('calculator').addEventListener('input',clear);$('calculator').addEventListener('change',clear);
$('calculator').addEventListener('submit',e=>{e.preventDefault();clear();try{const v=Object.fromEntries(FIELD_IDS.map(id=>[id,$(id).value])),r=calculate(v);$('result-value').textContent=r.value;$('result-text').value=r.text;$('result').hidden=false;$('result').scrollIntoView({block:'nearest'});}catch(error){$('error').textContent=error.message||'입력값을 확인하세요.';}});
$('copy').addEventListener('click',async()=>{if($('result').hidden)return;const token=version;try{await navigator.clipboard.writeText($('result-text').value);if(token===version)$('copy-status').textContent='복사했습니다.';}catch{if(token!==version)return;$('result-text').focus();$('result-text').select();$('copy-status').textContent='결과를 선택해 복사하세요.';}});
}
