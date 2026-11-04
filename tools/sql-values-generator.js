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

function sqlString(s){validUnicode(s);if(s.includes('\0'))throw Error('SQL 문자열에 NUL을 넣을 수 없습니다.');return "E'"+s.replace(/\\/g,'\\\\').replace(/'/g,"''").replace(/[\x01-\x1F\x7F]/g,c=>'\\x'+c.charCodeAt(0).toString(16).padStart(2,'0'))+"'";}
function sqlIdentifier(s){validUnicode(s);if(!s.length||/[\x00-\x1F\x7F]/.test(s)||new TextEncoder().encode(s).length>63)throw Error('이름은 제어문자 없이 1~63바이트로 넣으세요.');return '"'+s.replace(/"/g,'""')+'"';}
function calculate(v){
 const name=required(v,'name',1000).trim().split('.');if(name.length>2||name.some(x=>!x.length))throw Error('테이블 또는 스키마.테이블로 넣으세요.');const rows=table(required(v,'source'));if(rows.length<2)throw Error('열 이름과 데이터 한 행 이상을 넣으세요.');const columns=rows[0];if(new Set(columns).size!==columns.length)throw Error('열 이름을 중복 없이 넣으세요.');const names=columns.map(sqlIdentifier),values=rows.slice(1).map(row=>'  ('+row.map(sqlString).join(', ')+')');return output('INSERT INTO '+name.map(sqlIdentifier).join('.')+' ('+names.join(', ')+')\nVALUES\n'+values.join(',\n')+';',values.length+'행 INSERT');
}
const FIELD_IDS=["name","source"];

if(typeof module!=='undefined')module.exports={calculate};
if(typeof document!=='undefined'){
const $=id=>document.getElementById(id);let version=0;
function clear(){version++;$('result').hidden=true;$('result-text').value='';$('result-value').textContent='';$('error').textContent='';$('copy-status').textContent='';}
$('calculator').addEventListener('input',clear);$('calculator').addEventListener('change',clear);
$('calculator').addEventListener('submit',e=>{e.preventDefault();clear();try{const v=Object.fromEntries(FIELD_IDS.map(id=>[id,$(id).value])),r=calculate(v);$('result-value').textContent=r.value;$('result-text').value=r.text;$('result').hidden=false;$('result').scrollIntoView({block:'nearest'});}catch(error){$('error').textContent=error.message||'입력값을 확인하세요.';}});
$('copy').addEventListener('click',async()=>{if($('result').hidden)return;const token=version;try{await navigator.clipboard.writeText($('result-text').value);if(token===version)$('copy-status').textContent='복사했습니다.';}catch{if(token!==version)return;$('result-text').focus();$('result-text').select();$('copy-status').textContent='결과를 선택해 복사하세요.';}});
}
