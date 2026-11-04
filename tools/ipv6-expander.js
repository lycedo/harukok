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

function ip4(s){const a=String(s).split('.');if(a.length!==4||a.some(x=>!/^(?:0|[1-9]\d{0,2})$/.test(x)||Number(x)>255))throw Error('0~255의 IPv4 네 칸을 넣으세요.');return a.reduce((n,x)=>n*256+Number(x),0);}
function calculate(v){let s=required(v,'source',100).trim();if(s.includes('.')){const at=s.lastIndexOf(':'),n=ip4(s.slice(at+1));if(at<0)throw Error('IPv6 주소를 넣으세요.');s=s.slice(0,at+1)+Math.floor(n/65536).toString(16)+':'+(n%65536).toString(16);}if(/[^0-9a-f:]/i.test(s)||s.split('::').length>2)throw Error('IPv6 구분자를 확인하세요.');const compressed=s.includes('::'),parts=s.split('::'),left=parts[0]?parts[0].split(':'):[],right=parts[1]?parts[1].split(':'):[];let a;if(compressed){if(left.length+right.length>=8)throw Error('::는 한 블록 이상을 줄여야 합니다.');a=[...left,...Array(8-left.length-right.length).fill('0'),...right];}else a=left;if(a.length!==8||a.some(x=>!/^[0-9a-f]{1,4}$/i.test(x)))throw Error('IPv6 블록을 확인하세요.');const words=a.map(x=>parseInt(x,16)),expanded=words.map(x=>x.toString(16).padStart(4,'0')).join(':');let start=-1,length=0;for(let i=0;i<8;){if(words[i]!==0){i++;continue;}let j=i;while(j<8&&words[j]===0)j++;if(j-i>=2&&j-i>length){start=i;length=j-i;}i=j;}const hex=words.map(x=>x.toString(16)),short=start<0?hex.join(':'):hex.slice(0,start).join(':')+'::'+hex.slice(start+length).join(':');return output('펼친 주소: '+expanded+'\n16진수 압축: '+short,'IPv6 형식 확인');}
const FIELD_IDS=["source"];

if(typeof module!=='undefined')module.exports={calculate};
if(typeof document!=='undefined'){
const $=id=>document.getElementById(id);let version=0;
function clear(){version++;$('result').hidden=true;$('result-text').value='';$('result-value').textContent='';$('error').textContent='';$('copy-status').textContent='';}
$('calculator').addEventListener('input',clear);$('calculator').addEventListener('change',clear);
$('calculator').addEventListener('submit',e=>{e.preventDefault();clear();try{const v=Object.fromEntries(FIELD_IDS.map(id=>[id,$(id).value])),r=calculate(v);$('result-value').textContent=r.value;$('result-text').value=r.text;$('result').hidden=false;$('result').scrollIntoView({block:'nearest'});}catch(error){$('error').textContent=error.message||'입력값을 확인하세요.';}});
$('copy').addEventListener('click',async()=>{if($('result').hidden)return;const token=version;try{await navigator.clipboard.writeText($('result-text').value);if(token===version)$('copy-status').textContent='복사했습니다.';}catch{if(token!==version)return;$('result-text').focus();$('result-text').select();$('copy-status').textContent='결과를 선택해 복사하세요.';}});
}
