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
 const source=required(v,'source',200000);if(!/^data:/i.test(source)||/[\x00-\x20\x7F#]/.test(source)||/[^\x00-\x7F]/.test(source))throw Error('공백·조각 없이 ASCII data URI로 넣으세요.');const comma=source.indexOf(',');if(comma<0)throw Error('헤더와 본문 사이 쉼표가 필요합니다.');const header=source.slice(5,comma).split(';'),payload=source.slice(comma+1);function decodeHeader(s){try{return decodeURIComponent(s);}catch{throw Error('헤더의 퍼센트 인코딩을 확인하세요.');}}const mime=decodeHeader(header.shift())||'text/plain';if(!/^[A-Za-z0-9!#$&^_.+*-]+\/[A-Za-z0-9!#$&^_.+*-]+$/.test(mime))throw Error('MIME 타입을 확인하세요.');let charset='US-ASCII',charsetSeen=false,base64=false;for(let i=0;i<header.length;i++){const token=header[i];if(/^base64$/i.test(token)){if(base64||i!==header.length-1)throw Error(';base64는 마지막에 한 번만 넣으세요.');base64=true;continue;}const m=token.match(/^charset=(.+)$/i);if(!m||charsetSeen)throw Error('charset 매개변수 하나만 지원합니다.');charset=decodeHeader(m[1]).toUpperCase();if(!['UTF-8','US-ASCII'].includes(charset))throw Error('UTF-8 또는 US-ASCII만 지원합니다.');charsetSeen=true;}const bytes=[];for(let i=0;i<payload.length;i++){if(payload[i]==='%'){const h=payload.slice(i+1,i+3);if(!/^[0-9a-f]{2}$/i.test(h))throw Error('본문 퍼센트 인코딩을 확인하세요.');bytes.push(parseInt(h,16));i+=2;}else{if(!/^[A-Za-z0-9;/?:@&=+$,\-_.!~*'()]$/.test(payload[i]))throw Error('본문의 문자를 퍼센트 인코딩하세요.');bytes.push(payload.charCodeAt(i));}}let data=Uint8Array.from(bytes);if(base64){const s=Array.from(data,b=>String.fromCharCode(b)).join('');if(!/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(s))throw Error('표준 Base64와 = 패딩을 확인하세요.');const binary=atob(s);if(btoa(binary)!==s)throw Error('Base64 마지막 비트가 올바르지 않습니다.');data=Uint8Array.from(binary,c=>c.charCodeAt(0));}if(data.length>100000)throw Error('본문은 최대 100,000바이트입니다.');if(charset==='US-ASCII'&&data.some(b=>b>127))throw Error('비 ASCII 글자는 charset=UTF-8을 명시하세요.');return output(JSON.stringify({mime,charset,encoding:base64?'base64':'percent',bytes:data.length,text:utf8(data)},null,2),data.length+'바이트 텍스트');
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
