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

function matrix(raw,name){const s=String(raw??'').trim();if(!s||s.length>2000)throw Error(name+'를 2×2 또는 3×3으로 입력하세요.');const source=s.split(/\r?\n|;/).filter(r=>r.trim()).map(r=>tokens(r)),rows=source.map(r=>r.map(x=>num(x,name,-1e6,1e6)));if(![2,3].includes(rows.length)||rows.some(r=>r.length!==rows.length))throw Error(name+'는 2×2 또는 3×3 정사각행렬이어야 합니다.');Object.defineProperty(rows,'source',{value:source});return rows;}
function decimalToken(raw){const m=raw.match(/^([+-]?)(?:(\d+)(?:\.(\d*))?|\.(\d+))(?:e([+-]?\d+))?$/i),digits=(m[2]||'')+(m[3]??m[4]??'');let coefficient=BigInt((m[1]==='-'?'-':'')+(digits||'0'));if(coefficient===0n)return{coefficient:0n,scale:0};let scale=(m[3]??m[4]??'').length-Number(m[5]||0);if(Math.abs(scale)>1000)throw Error('행렬 원소의 소수 자릿수가 너무 큽니다.');if(scale<0){coefficient*=10n**BigInt(-scale);scale=0;}return{coefficient,scale};}
function det(a){const entries=(a.source||a.map(row=>row.map(String))).map(row=>row.map(decimalToken)),scale=Math.max(...entries.flat().map(x=>x.scale)),m=entries.map(row=>row.map(x=>x.coefficient*10n**BigInt(scale-x.scale)));const exact=m.length===2?m[0][0]*m[1][1]-m[0][1]*m[1][0]:m[0][0]*(m[1][1]*m[2][2]-m[1][2]*m[2][1])-m[0][1]*(m[1][0]*m[2][2]-m[1][2]*m[2][0])+m[0][2]*(m[1][0]*m[2][1]-m[1][1]*m[2][0]);const result=Number(exact.toString()+'e-'+scale*m.length);if(!Number.isFinite(result)||(result===0&&exact!==0n))throw Error('행렬식이 너무 작아 표시할 수 없습니다.');return result;}
function inverse(a){const n=a.length,scale=Math.max(...a.flat().map(Math.abs));if(scale===0||det(a)===0)throw Error('역행렬이 없는 행렬입니다.');const m=a.map((r,i)=>[...r.map(x=>x/scale),...Array.from({length:n},(_,j)=>i===j?1:0)]);for(let j=0;j<n;j++){let pivot=j;for(let i=j+1;i<n;i++)if(Math.abs(m[i][j])>Math.abs(m[pivot][j]))pivot=i;if(Math.abs(m[pivot][j])<1e-12)throw Error('역행렬이 없거나 오차가 큰 행렬입니다.');[m[j],m[pivot]]=[m[pivot],m[j]];const p=m[j][j];m[j]=m[j].map(x=>x/p);for(let i=0;i<n;i++){if(i===j)continue;const q=m[i][j];m[i]=m[i].map((x,k)=>x-q*m[j][k]);}}const result=m.map(r=>r.slice(n).map(x=>x/scale)),norm=x=>Math.max(...x.map(row=>ksum(row.map(Math.abs))));if(!result.flat().every(Number.isFinite)||norm(a)*norm(result)>1e10)throw Error('역행렬 오차가 커 안정적으로 표시할 수 없습니다.');for(let i=0;i<n;i++)for(let j=0;j<n;j++){const cell=ksum(a[i].map((x,k)=>x*result[k][j]));if(Math.abs(cell-(i===j?1:0))>1e-7)throw Error('역행렬 오차가 커 안정적으로 표시할 수 없습니다.');}return result;}
function calculate(v){const mode=choice(v.mode,['multiply','add','subtract','determinant','inverse']),a=matrix(v.a,'A'),n=a.length;if(mode==='determinant'){const d=det(a);return done('행렬식 '+fmt(d),'det(A) = '+fmt(d),{determinant:d});}let r;if(mode==='inverse')r=inverse(a);else{const b=matrix(v.b,'B');if(b.length!==n)throw Error('A와 B의 크기를 같게 입력하세요.');r=a.map((row,i)=>row.map((x,j)=>mode==='add'?x+b[i][j]:mode==='subtract'?x-b[i][j]:ksum(row.map((q,k)=>q*b[k][j]))));}return done(n+'×'+n+' 행렬',r.map(row=>row.map(fmt).join('\t')).join('\n'),{matrix:r});}

const FIELD_IDS = ["mode", "a", "b"];

if(typeof module!=='undefined')module.exports={calculate};
if(typeof document!=='undefined'){
 const $=id=>document.getElementById(id);let version=0;
 function clear(){version++;$('result').hidden=true;$('result-text').value='';$('result-value').textContent='';$('error').textContent='';$('copy-status').textContent='';}
 $('calculator').addEventListener('input',clear);$('calculator').addEventListener('change',clear);
 $('calculator').addEventListener('submit',event=>{event.preventDefault();clear();try{const v=Object.fromEntries(FIELD_IDS.map(id=>[id,$(id).value])),r=calculate(v);$('result-value').textContent=r.value;$('result-text').value=r.text;$('result').hidden=false;$('result').scrollIntoView({block:'nearest'});}catch(e){$('error').textContent=e.message;}});
 $('copy').addEventListener('click',async()=>{if($('result').hidden)return;const token=version;try{await navigator.clipboard.writeText($('result-text').value);if(token===version)$('copy-status').textContent='복사했습니다.';}catch{if(token!==version)return;$('copy-status').textContent='결과를 선택해 복사하세요.';$('result-text').focus();$('result-text').select();}});

function updateFields(){const unary=['determinant','inverse'].includes($('mode').value);$('b-field').hidden=unary;}$('mode').addEventListener('change',updateFields);updateFields();

}
