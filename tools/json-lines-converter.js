'use strict';
function raw(v,id,max=100000){const s=String(v[id]??'');if(s.length>max)throw Error('입력 길이를 줄이세요.');return s;}
function required(v,id,max=100000){const s=raw(v,id,max);if(!s.trim())throw Error('입력칸을 채우세요.');return s;}
function choice(v,id,allowed){const s=String(v[id]??'');if(!allowed.includes(s))throw Error('선택 값을 확인하세요.');return s;}
function lines(s,max=1000){const a=s.replace(/\r\n?/g,'\n').split('\n');if(a.length>1&&a[a.length-1]==='')a.pop();if(a.length>max)throw Error('줄 수를 줄이세요.');return a;}
function output(text,value='완료'){if(text.length>1000000)throw Error('결과가 너무 큽니다. 입력을 줄이세요.');return{value,text};}
function validUnicode(s){for(let i=0;i<s.length;i++){const n=s.charCodeAt(i);if(n>=0xD800&&n<=0xDBFF){const next=s.charCodeAt(++i);if(!(next>=0xDC00&&next<=0xDFFF))throw Error('잘못된 유니코드 문자가 있습니다.');}else if(n>=0xDC00&&n<=0xDFFF)throw Error('잘못된 유니코드 문자가 있습니다.');}}
function utf8(bytes){try{return new TextDecoder('utf-8',{fatal:true,ignoreBOM:true}).decode(bytes);}catch{throw Error('올바른 UTF-8 글자가 아닙니다.');}}
function table(s){const rows=lines(s,200).map(row=>row.split('\t')),width=rows[0].length;if(width>30||rows.some(row=>row.length!==width))throw Error('최대 200행·30열이며 열 수를 맞추세요.');return rows;}
function safeURL(s){validUnicode(s);let u;try{u=new URL(s);}catch{throw Error('전체 http·https 주소를 넣으세요.');}if(!['http:','https:'].includes(u.protocol)||u.username||u.password)throw Error('계정 정보 없는 http·https 주소를 넣으세요.');return u;}

function parseJSON(source){
 try{JSON.parse(source);}catch{throw Error('JSON 문법을 확인하세요.');}
 const tokens=[...source.matchAll(/"(?:\\.|[^"\\])*"|[{}\[\],:]|[^\s{}\[\],:]+/g)].map(m=>({text:m[0],start:m.index,end:m.index+m[0].length}));let index=0,count=0;
 function value(depth){if(depth>32||++count>20000)throw Error('JSON 크기나 중첩을 줄이세요.');const first=tokens[index++],token=first.text;if(token==='{'){const properties=[],keys=new Set();if(tokens[index].text==='}'){const last=tokens[index++];return{kind:'object',properties,start:first.start,end:last.end};}for(;;){const key=JSON.parse(tokens[index++].text);if(keys.has(key))throw Error('중복 JSON 키가 있습니다.');keys.add(key);index++;const node=value(depth+1);properties.push({key,node});if(tokens[index++].text==='}')break;}return{kind:'object',properties,start:first.start,end:tokens[index-1].end};}if(token==='['){const items=[];if(tokens[index].text===']'){const last=tokens[index++];return{kind:'array',items,start:first.start,end:last.end};}for(;;){items.push(value(depth+1));if(tokens[index++].text===']')break;}return{kind:'array',items,start:first.start,end:tokens[index-1].end};}return{kind:token[0]==='"'?'string':token==='null'?'null':token==='true'||token==='false'?'boolean':'number',token,start:first.start,end:first.end};}
 return value(0);
}
function compactJSON(s){return s.replace(/"(?:\\.|[^"\\])*"|[ \t\r\n]+/g,t=>t[0]==='"'?t:'');}
function calculate(v){
 const source=raw(v,'source'),mode=choice(v,'mode',['toArray','toLines']),empty=choice(v,'empty',['reject','skip']);if(mode==='toLines'){const ast=parseJSON(source);if(ast.kind!=='array')throw Error('JSON 배열을 넣으세요.');if(ast.items.length>1000)throw Error('최대 1,000항목입니다.');const rows=ast.items.map(node=>compactJSON(source.slice(node.start,node.end)));return output(rows.length?rows.join('\n')+'\n':'',rows.length+'개 항목');}let rows=source===''?[]:source.split('\n');if(rows.length&&rows[rows.length-1]==='')rows.pop();const items=[];for(let i=0;i<rows.length;i++){const row=rows[i];if(/^[ \t\r]*$/.test(row)){if(empty==='skip')continue;throw Error((i+1)+'번째 빈 줄을 확인하세요.');}try{parseJSON(row);}catch(error){throw Error((i+1)+'번째 줄: '+error.message);}items.push(compactJSON(row));if(items.length>1000)throw Error('최대 1,000항목입니다.');}return output(items.length?'[\n  '+items.join(',\n  ')+'\n]':'[]',items.length+'개 항목');
}
const FIELD_IDS=["source","mode","empty"];

if(typeof module!=='undefined')module.exports={calculate};
if(typeof document!=='undefined'){
const $=id=>document.getElementById(id);let version=0;
function clear(){version++;$('result').hidden=true;$('result-text').value='';$('result-value').textContent='';$('error').textContent='';$('copy-status').textContent='';}
$('calculator').addEventListener('input',clear);$('calculator').addEventListener('change',clear);
$('calculator').addEventListener('submit',e=>{e.preventDefault();clear();try{const v=Object.fromEntries(FIELD_IDS.map(id=>[id,$(id).value])),r=calculate(v);$('result-value').textContent=r.value;$('result-text').value=r.text;$('result').hidden=false;$('result').scrollIntoView({block:'nearest'});}catch(error){$('error').textContent=error.message||'입력값을 확인하세요.';}});
$('copy').addEventListener('click',async()=>{if($('result').hidden)return;const token=version;try{await navigator.clipboard.writeText($('result-text').value);if(token===version)$('copy-status').textContent='복사했습니다.';}catch{if(token!==version)return;$('result-text').focus();$('result-text').select();$('copy-status').textContent='결과를 선택해 복사하세요.';}});
}
