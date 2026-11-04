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
 const rows=table(required(v,'source')),align=choice(v,'align',['left','right','center']),header=choice(v,'header',['yes','no']);function width(s){let n=0;for(const c of s){const p=c.codePointAt(0);if(p<32||p===127)throw Error('셀 안 제어문자를 제외하세요.');if(/\p{Mark}/u.test(c)||p===0x200D||p>=0xFE00&&p<=0xFE0F)continue;const wide=p>=0x1100&&(p<=0x115F||p===0x2329||p===0x232A||p>=0x2E80&&p<=0xA4CF&&p!==0x303F||p>=0xAC00&&p<=0xD7A3||p>=0xF900&&p<=0xFAFF||p>=0xFE10&&p<=0xFE19||p>=0xFE30&&p<=0xFE6F||p>=0xFF00&&p<=0xFF60||p>=0xFFE0&&p<=0xFFE6||p>=0x1F300&&p<=0x1FAFF||p>=0x20000&&p<=0x3FFFD);n+=wide?2:1;}return n;}const sizes=rows[0].map((_,c)=>Math.max(...rows.map(row=>width(row[c]))));if((sizes.reduce((a,b)=>a+b,0)+sizes.length*3)*(rows.length+1)>900000)throw Error('정렬할 표의 크기를 줄이세요.');const pad=(s,n)=>{const gap=n-width(s);if(align==='right')return' '.repeat(gap)+s;if(align==='center'){const left=Math.floor(gap/2);return' '.repeat(left)+s+' '.repeat(gap-left);}return s+' '.repeat(gap);};const out=rows.map(row=>row.map((s,c)=>pad(s,sizes[c])).join(' | '));if(header==='yes')out.splice(1,0,sizes.map(n=>'-'.repeat(n)).join('-+-'));return output(out.join('\n'),rows.length+'행 '+sizes.length+'열');
}
const FIELD_IDS=["source","align","header"];

if(typeof module!=='undefined')module.exports={calculate};
if(typeof document!=='undefined'){
const $=id=>document.getElementById(id);let version=0;
function clear(){version++;$('result').hidden=true;$('result-text').value='';$('result-value').textContent='';$('error').textContent='';$('copy-status').textContent='';}
$('calculator').addEventListener('input',clear);$('calculator').addEventListener('change',clear);
$('calculator').addEventListener('submit',e=>{e.preventDefault();clear();try{const v=Object.fromEntries(FIELD_IDS.map(id=>[id,$(id).value])),r=calculate(v);$('result-value').textContent=r.value;$('result-text').value=r.text;$('result').hidden=false;$('result').scrollIntoView({block:'nearest'});}catch(error){$('error').textContent=error.message||'입력값을 확인하세요.';}});
$('copy').addEventListener('click',async()=>{if($('result').hidden)return;const token=version;try{await navigator.clipboard.writeText($('result-text').value);if(token===version)$('copy-status').textContent='복사했습니다.';}catch{if(token!==version)return;$('result-text').focus();$('result-text').select();$('copy-status').textContent='결과를 선택해 복사하세요.';}});
}
