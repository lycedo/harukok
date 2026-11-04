'use strict';

function num(raw,name,min=0,max=1e12){const s=String(raw??'').trim();if(!s||s.length>100||!/^[-+]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[-+]?\d+)?$/i.test(s))throw Error(name+'에 숫자를 입력하세요.');const n=Number(s);if(!Number.isFinite(n)||n<min||n>max||(n===0&&/[1-9]/.test(s.split(/[eE]/)[0])))throw Error(name+'의 허용 범위를 확인하세요.');return n;}
function integer(raw,name,min,max){const n=num(raw,name,min,max);if(!Number.isInteger(n))throw Error(name+'은 정수로 입력하세요.');return n;}
function positive(raw,name,max=1e12){return num(raw,name,1e-9,max);}
function fmt(n){if(!Number.isFinite(n))throw Error('결과가 표시 범위를 넘었습니다.');return n.toLocaleString('ko-KR',{maximumSignificantDigits:12});}
function money(n){if(!Number.isSafeInteger(n))throw Error('원 단위 금액이 정확히 표시할 수 있는 범위를 넘었습니다.');return n.toLocaleString('ko-KR',{maximumFractionDigits:0});}
function ceilSafe(n){const r=Math.round(n);return r!==0&&Math.abs(n-r)<=8*Number.EPSILON*Math.max(1,Math.abs(n))?r:Math.ceil(n);}
function parseDate(raw,name){const s=String(raw??'');if(!/^\d{4}-\d{2}-\d{2}$/.test(s))throw Error(name+'을 YYYY-MM-DD로 입력하세요.');const d=new Date(s+'T00:00:00Z');if(!Number.isFinite(d.getTime())||d.toISOString().slice(0,10)!==s||d.getUTCFullYear()<1900||d.getUTCFullYear()>2100)throw Error(name+'은 1900~2100년의 실제 날짜로 입력하세요.');return d.getTime();}
function namedRows(raw,max=100){const text=String(raw??'').trim();if(!text||text.length>20000)throw Error('목록을 1~20,000자로 입력하세요.');const lines=text.split(/\r\n?|\n/).filter(s=>s.trim());if(lines.length>max)throw Error('최대 '+max+'행까지 입력하세요.');const seen=new Set();return lines.map((line,index)=>{const fields=line.split(/\t|,/);if(fields.length!==2)throw Error((index+1)+'행은 이름,값 형식으로 입력하세요.');const name=fields[0].trim().normalize('NFC');if(!name||Array.from(name).length>30||seen.has(name))throw Error('이름은 중복 없이 1~30자로 입력하세요.');seen.add(name);return{name,raw:fields[1].trim()};});}

function calculate(v){
 const rows=namedRows(v.expenses),people=rows.map(row=>({name:row.name,spent:integer(row.raw,row.name+' 지출',0,1e12)}));if(people.length<2)throw Error('두 명 이상 입력하세요.');const total=people.reduce((a,p)=>a+p.spent,0),base=Math.floor(total/people.length),extra=total%people.length;people.forEach((p,i)=>{p.share=base+(i<extra?1:0);p.balance=p.spent-p.share;});const creditors=people.filter(p=>p.balance>0).map(p=>({name:p.name,left:p.balance})),debtors=people.filter(p=>p.balance<0).map(p=>({name:p.name,left:-p.balance})),transfers=[];let a=0,b=0;while(a<debtors.length&&b<creditors.length){const amount=Math.min(debtors[a].left,creditors[b].left);transfers.push({from:debtors[a].name,to:creditors[b].name,amount});debtors[a].left-=amount;creditors[b].left-=amount;if(debtors[a].left===0)a++;if(creditors[b].left===0)b++;}return{value:'정산 이체 '+transfers.length+'건',text:'총 지출: '+money(total)+'원\n'+people.map(p=>p.name+' 부담: '+money(p.share)+'원').join('\n')+'\n\n'+(transfers.length?transfers.map(t=>t.from+' → '+t.to+': '+money(t.amount)+'원').join('\n'):'추가 이체 없음'),people,transfers,total};
}
if(typeof module!=='undefined')module.exports={calculate};

if(typeof document!=='undefined'){
 const $=id=>document.getElementById(id);let version=0;
 function clear(){version++;$('result').hidden=true;$('result-text').value='';$('result-value').textContent='';$('error').textContent='';$('copy-status').textContent='';}
 $('calculator').addEventListener('input',()=>{clear();});$('calculator').addEventListener('change',clear);
 $('calculator').addEventListener('submit',event=>{event.preventDefault();clear();try{const values=Object.fromEntries(["expenses"].map(id=>[id,$(id).value])),r=calculate(values);$('result-value').textContent=r.value;$('result-text').value=r.text;$('result').hidden=false;$('result').scrollIntoView({block:'nearest'});}catch(error){$('error').textContent=error.message;}});
 $('copy').addEventListener('click',async()=>{if($('result').hidden)return;const token=version;try{await navigator.clipboard.writeText($('result-text').value);if(token===version)$('copy-status').textContent='복사했습니다.';}catch{if(token!==version)return;$('copy-status').textContent='결과를 선택해 복사하세요.';$('result-text').focus();$('result-text').select();}});

}
