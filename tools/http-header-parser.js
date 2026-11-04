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


function calculate(v){
 const rows=lines(required(v,'source'),1000),headers=[],byName=Object.create(null);let startLine='',ended=false;const token=/^[!#$%&'*+.^_`|~0-9A-Za-z-]+$/;for(let i=0;i<rows.length;i++){const row=rows[i];if(i===0&&(/^HTTP\/\d(?:\.\d)? \d{3}(?: [^\x00-\x1F\x7F]*)?$/.test(row)||/^[!#$%&'*+.^_`|~0-9A-Za-z-]+ \S+ HTTP\/\d(?:\.\d)?$/.test(row))){startLine=row;continue;}if(row===''){ended=true;continue;}if(ended)throw Error('빈 줄 뒤의 본문을 제외하세요.');if(/^[ \t]/.test(row))throw Error('접힌 헤더는 지원하지 않습니다.');const at=row.indexOf(':');if(at<1)throw Error('이름: 값 형식으로 넣으세요.');const name=row.slice(0,at),value=row.slice(at+1).replace(/^[ \t]+|[ \t]+$/g,'');if(!token.test(name)||/[\x00-\x08\x0A-\x1F\x7F]/.test(value))throw Error('헤더 이름이나 제어문자를 확인하세요.');headers.push({name,value});const key=name.toLowerCase();if(!Object.prototype.hasOwnProperty.call(byName,key))byName[key]=[];byName[key].push(value);}return output(JSON.stringify({startLine,headers,byName},null,2),headers.length+'개 헤더');
}
const FIELD_IDS=["source"];

if(typeof module!=='undefined')module.exports={calculate};
if(typeof document!=='undefined'){
const $=id=>document.getElementById(id);let version=0;
function clear(){version++;$('result').hidden=true;$('result-text').value='';$('result-value').textContent='';$('error').textContent='';$('copy-status').textContent='';}
$('calculator').addEventListener('input',clear);$('calculator').addEventListener('change',clear);
$('calculator').addEventListener('submit',e=>{e.preventDefault();clear();try{const v=Object.fromEntries(FIELD_IDS.map(id=>[id,$(id).value])),r=calculate(v);$('result-value').textContent=r.value;$('result-text').value=r.text;$('result').hidden=false;$('result').scrollIntoView({block:'nearest'});}catch(error){$('error').textContent=error.message||'입력값을 확인하세요.';}});
$('copy').addEventListener('click',async()=>{if($('result').hidden)return;const token=version;try{await navigator.clipboard.writeText($('result-text').value);if(token===version)$('copy-status').textContent='복사했습니다.';}catch{if(token!==version)return;$('result-text').focus();$('result-text').select();$('copy-status').textContent='결과를 선택해 복사하세요.';}});
}
