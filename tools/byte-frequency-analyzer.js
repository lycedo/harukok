'use strict';
function raw(v,id,max=100000){const s=String(v[id]??'');if(s.length>max)throw Error('입력 길이를 줄이세요.');validUnicode(s);return s;}
function required(v,id,max=100000){const s=raw(v,id,max);if(!s.trim())throw Error('입력칸을 채우세요.');return s;}
function integer(v,id,min,max){const s=required(v,id,100).trim();if(!/^-?\d+$/.test(s))throw Error('정수를 입력하세요.');const n=Number(s);if(!Number.isSafeInteger(n)||n<min||n>max)throw Error('정수 범위를 확인하세요.');return n;}
function choice(v,id,allowed){const s=String(v[id]??'');if(!allowed.includes(s))throw Error('선택 값을 확인하세요.');return s;}
function lines(s,max=1000){const a=s.replace(/\r\n?/g,'\n').split('\n');if(a.length>1&&a[a.length-1]==='')a.pop();if(a.length>max)throw Error('줄 수를 줄이세요.');return a;}
function output(text,value='완료'){if(text.length>1000000)throw Error('결과가 너무 큽니다. 입력을 줄이세요.');return{value,text};}
function validUnicode(s){for(let i=0;i<s.length;i++){const n=s.charCodeAt(i);if(n>=0xD800&&n<=0xDBFF){const next=s.charCodeAt(++i);if(!(next>=0xDC00&&next<=0xDFFF))throw Error('잘못된 유니코드 문자가 있습니다.');}else if(n>=0xDC00&&n<=0xDFFF)throw Error('잘못된 유니코드 문자가 있습니다.');}}
function utf8(bytes){try{return new TextDecoder('utf-8',{fatal:true,ignoreBOM:true}).decode(bytes);}catch{throw Error('올바른 UTF-8 글자가 아닙니다.');}}
function table(s){const rows=lines(s,200).map(row=>row.split('\t')),width=rows[0].length;if(width>30||rows.some(row=>row.length!==width))throw Error('최대 200행·30열이며 열 수를 맞추세요.');return rows;}
function safeURL(s){validUnicode(s);let u;try{u=new URL(s);}catch{throw Error('전체 http·https 주소를 넣으세요.');}if(!['http:','https:'].includes(u.protocol)||u.username||u.password)throw Error('계정 정보 없는 http·https 주소를 넣으세요.');return u;}

function numeric(v,id,min,max){const s=required(v,id,100).trim();if(!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i.test(s))throw Error('숫자를 입력하세요.');const n=Number(s);if(!Number.isFinite(n)||n===0&&/[1-9]/.test(s.split(/e/i)[0])||n<min||n>max)throw Error('숫자 범위를 확인하세요.');return n;}
function escHTML(s){return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');}
function plain(s,max=2000){s=String(s);if(s.length>max||/[\x00-\x1f\x7f]/.test(s))throw Error('줄바꿈 없는 짧은 글을 넣으세요.');return s;}
function decimal(s){s=String(s).trim();const m=s.match(/^([+-]?)(\d+)(?:\.(\d{1,12}))?$/);if(!m||m[2].length>30)throw Error('정수 30자리·소수 12자리 이내의 숫자를 넣으세요.');return [BigInt((m[1]==='-'?'-':'')+m[2]+(m[3]||'')),(m[3]||'').length];}
function decString(q){const neg=q[0]<0n,n=String(neg?-q[0]:q[0]).padStart(q[1]+1,'0');const s=q[1]?n.slice(0,-q[1])+'.'+n.slice(-q[1]):n;return(neg?'-':'')+s.replace(/(\.\d*?)0+$/,'$1').replace(/\.$/,'');}
function decAdd(a,b){const d=Math.max(a[1],b[1]);return[a[0]*10n**BigInt(d-a[1])+b[0]*10n**BigInt(d-b[1]),d];}
function decCompare(a,b){const c=decAdd(a,[-b[0],b[1]])[0];return c<0n?-1:c>0n?1:0;}
function csv(s,separator=','){s=String(s).replace(/^\uFEFF/,'');if(!s||s.length>100000)throw Error('CSV는 1~100,000자로 넣으세요.');const rows=[];let row=[],cell='',quoted=false,closed=false,start=true;function pushCell(){row.push(cell);if(row.length>50)throw Error('열은 최대 50개입니다.');cell='';closed=false;start=true;}function pushRow(){pushCell();rows.push(row);row=[];if(rows.length>1000)throw Error('머리글 포함 최대 1,000행입니다.');}for(let i=0;i<s.length;i++){const ch=s[i];if(quoted){if(ch==='"'){if(s[i+1]==='"'){cell+='"';i++;}else{quoted=false;closed=true;}}else cell+=ch;continue;}if(ch===separator){pushCell();continue;}if(ch==='\r'||ch==='\n'){if(ch==='\r'&&s[i+1]==='\n')i++;pushRow();continue;}if(closed)throw Error('닫는 따옴표 뒤의 구분자를 확인하세요.');if(ch==='"'){if(!start)throw Error('셀 전체를 따옴표로 감싸세요.');quoted=true;start=false;}else{cell+=ch;start=false;}}if(quoted)throw Error('닫히지 않은 따옴표가 있습니다.');if(row.length||cell.length||!start||!/[\r\n]$/.test(s))pushRow();const h=rows[0];if(!h||h.some(x=>!x.trim())||new Set(h).size!==h.length||rows.some(r=>r.length!==h.length))throw Error('첫 행은 중복 없는 열 이름이며 모든 행의 열 수를 맞추세요.');return rows;}
function csvText(rows,separator=','){return rows.map(row=>row.map(x=>{const s=String(x);return s.includes(separator)||/["\r\n]/.test(s)?'"'+s.replace(/"/g,'""')+'"':s;}).join(separator)).join('\r\n');}
function column(rows,name){const i=rows[0].indexOf(String(name));if(i<0)throw Error('열 이름을 확인하세요.');return i;}
function columnList(rows,source){const names=lines(source,50);if(names.some(s=>!s)||new Set(names).size!==names.length)throw Error('열 이름을 한 줄에 하나씩 중복 없이 넣으세요.');return names.map(name=>column(rows,name));}
function decimalKey(s){const m=s.match(/^(-?)(\d+)(?:\.(\d+))?(?:[eE]([+-]?\d+))?$/);if(!m)return'';let digits=(m[2]+(m[3]||'')).replace(/^0+/,''),exponent=Number(m[4]||0)-(m[3]||'').length;if(!digits)return'0';const zeros=(digits.match(/0+$/)||[''])[0].length;if(zeros){digits=digits.slice(0,-zeros);exponent+=zeros;}return m[1]+digits+'e'+exponent;}
function json(v,id){let value;try{const source=required(v,id);for(const m of source.matchAll(/"(?:\\[\s\S]|[^"\\])*"|(-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?)/g)){if(m[1]&&decimalKey(m[1])!==decimalKey(String(Number(m[1]))))throw Error('precision');}value=JSON.parse(source,(_,x)=>{if(typeof x==='number'&&(!Number.isFinite(x)||(Number.isInteger(x)&&!Number.isSafeInteger(x))))throw Error('number');return x;});const frames=[];for(const m of source.matchAll(/"(?:\\[\s\S]|[^"\\])*"|[{}[\],:]/g)){const t=m[0],f=frames[frames.length-1];if(t==='{')frames.push({object:true,keys:new Set(),key:true});else if(t==='[')frames.push({object:false});else if(t==='}'||t===']')frames.pop();else if(t===','&&f?.object)f.key=true;else if(t.startsWith('"')&&f?.object&&f.key){const k=JSON.parse(t);if(f.keys.has(k))throw Error('duplicate');f.keys.add(k);f.key=false;}}}catch{throw Error('JSON 문법·중복 키를 확인하세요. 큰 정수·정밀한 소수는 문자열로 넣으세요.');}const stack=[[value,0]];let nodes=0;while(stack.length){const[x,d]=stack.pop();if(++nodes>10000||d>40)throw Error('JSON 크기나 중첩을 줄이세요.');if(x&&typeof x==='object')for(const k of Object.keys(x))stack.push([x[k],d+1]);}return value;}
function object(x){if(!x||typeof x!=='object'||Array.isArray(x))throw Error('JSON 객체를 넣으세요.');return x;}
function array(x){if(!Array.isArray(x)||x.length>2000)throw Error('최대 2,000개 JSON 배열을 넣으세요.');return x;}
function own(x,k){return x!==null&&typeof x==='object'&&Object.prototype.hasOwnProperty.call(x,k);}
function setOwn(x,k,v){Object.defineProperty(x,k,{value:v,writable:true,enumerable:true,configurable:true});}
function ptrTokens(s){if(typeof s!=='string'||s.length>2000||s!==''&&!s.startsWith('/')||/~(?![01])/.test(s))throw Error('JSON Pointer 경로를 확인하세요.');return s===''?[]:s.slice(1).split('/').map(x=>x.replace(/~1/g,'/').replace(/~0/g,'~'));}
function atPath(x,tokens){for(const k of tokens){if(Array.isArray(x)&&!/^(0|[1-9]\d*)$/.test(k)||!own(x,k))throw Error('경로가 없습니다.');x=x[k];}return x;}
function clone(x){return JSON.parse(JSON.stringify(x));}
function equalJSON(a,b){if(a===b)return true;if(typeof a!==typeof b||!a||!b||typeof a!=='object'||Array.isArray(a)!==Array.isArray(b))return false;const ak=Object.keys(a),bk=Object.keys(b);return ak.length===bk.length&&ak.every(k=>own(b,k)&&equalJSON(a[k],b[k]));}
function safeHref(s){const u=safeURL(s);return u.href;}
function hexBytes(s){s=String(s).replace(/\s/g,'');if(s.length%2||!/^(?:[0-9a-f]{2})*$/i.test(s)||s.length>200000)throw Error('최대 100,000바이트의 16진수를 넣으세요.');return Uint8Array.from(s.match(/../g)||[],x=>parseInt(x,16));}


function calculate(v){const s=raw(v,'source'),bytes=choice(v,'mode',['hex','text'])==='hex'?hexBytes(s):new TextEncoder().encode(s);if(!bytes.length)throw Error('한 바이트 이상 넣으세요.');const counts=Array(256).fill(0);for(const n of bytes)counts[n]++;let entropy=0;const out=[];counts.forEach((n,i)=>{if(n){const p=n/bytes.length;entropy-=p*Math.log2(p);out.push(i.toString(16).padStart(2,'0').toUpperCase()+'\t'+n+'\t'+(p*100).toFixed(4)+'%');}});return output('바이트: '+bytes.length+'\n엔트로피: '+entropy.toFixed(6)+' bit/byte\nHEX\t개수\t비율\n'+out.join('\n'),out.length+'종');}
const FIELD_IDS=["source","mode"];

if(typeof module!=='undefined')module.exports={calculate};
if(typeof document!=='undefined'){
const $=id=>document.getElementById(id);let version=0;
function clear(){version++;$('result').hidden=true;$('result-text').value='';$('result-value').textContent='';$('error').textContent='';$('copy-status').textContent='';}
$('calculator').addEventListener('input',clear);$('calculator').addEventListener('change',clear);
$('calculator').addEventListener('submit',e=>{e.preventDefault();clear();try{const v=Object.fromEntries(FIELD_IDS.map(id=>[id,$(id).value])),r=calculate(v);$('result-value').textContent=r.value;$('result-text').value=r.text;$('result').hidden=false;$('result').scrollIntoView({block:'nearest'});}catch(error){$('error').textContent=error.message||'입력값을 확인하세요.';}});
$('copy').addEventListener('click',async()=>{if($('result').hidden)return;const token=version;try{await navigator.clipboard.writeText($('result-text').value);if(token===version)$('copy-status').textContent='복사했습니다.';}catch{if(token!==version)return;$('result-text').focus();$('result-text').select();$('copy-status').textContent='결과를 선택해 복사하세요.';}});
}
