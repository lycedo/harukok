'use strict';

function num(raw,name,min=0,max=1e12){const s=String(raw??'').trim();if(!s||s.length>100||!/^[-+]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[-+]?\d+)?$/i.test(s))throw Error(name+'에 숫자를 입력하세요.');const n=Number(s);if(!Number.isFinite(n)||n<min||n>max||(n===0&&/[1-9]/.test(s.split(/[eE]/)[0])))throw Error(name+'의 허용 범위를 확인하세요.');return n;}
function integer(raw,name,min,max){const n=num(raw,name,min,max);if(!Number.isInteger(n))throw Error(name+'은 정수로 입력하세요.');return n;}
function positive(raw,name,max=1e12){return num(raw,name,1e-9,max);}
function fmt(n){if(!Number.isFinite(n))throw Error('결과가 표시 범위를 넘었습니다.');if(n===0||Object.is(n,-0))return '0';const a=Math.abs(n);return a>=1e15||a<1e-8?n.toExponential(11).replace(/\.?0+e/,'e'):n.toLocaleString('ko-KR',{maximumSignificantDigits:12});}
function won(n){if(!Number.isFinite(n)||Math.abs(n)>Number.MAX_SAFE_INTEGER)throw Error('금액이 표시 범위를 넘었습니다.');const r=Math.round(n);return(Object.is(r,-0)?0:r).toLocaleString('ko-KR',{maximumFractionDigits:0})+'원';}
function choice(raw,allowed){if(!allowed.includes(raw))throw Error('계산 방식이나 단위를 고르세요.');return raw;}
function date(raw,name){const s=String(raw??'');if(!/^\d{4}-\d{2}-\d{2}$/.test(s))throw Error(name+'을 YYYY-MM-DD로 넣으세요.');const d=new Date(s+'T00:00:00Z');if(!Number.isFinite(d.getTime())||d.toISOString().slice(0,10)!==s||d.getUTCFullYear()<1900||d.getUTCFullYear()>2100)throw Error(name+'은 1900~2100년의 실제 날짜로 넣으세요.');return d.getTime();}
function iso(ms){const s=new Date(ms).toISOString().slice(0,10);date(s,'결과 날짜');return s;}
function clockMinutes(raw){const m=String(raw??'').match(/^([01]\d|2[0-3]):([0-5]\d)$/);if(!m)throw Error('시각을 HH:MM으로 넣으세요.');return Number(m[1])*60+Number(m[2]);}
function timeText(n){return n===1440?'24:00':String(Math.floor(n/60)).padStart(2,'0')+':'+String(n%60).padStart(2,'0');}
function duration(seconds){if(!Number.isFinite(seconds)||seconds<0||seconds>Number.MAX_SAFE_INTEGER)throw Error('시간이 표시 범위를 넘었습니다.');const n=Math.round(seconds);return String(Math.floor(n/3600)).padStart(2,'0')+':'+String(Math.floor(n%3600/60)).padStart(2,'0')+':'+String(n%60).padStart(2,'0');}
function annuity(rate,n){return rate===0?n:Math.expm1(n*Math.log1p(rate))/rate;}
function loan(principal,annual,months){const rate=annual/1200;if(rate===0)return{payment:principal/months,total:principal,interest:0};const x=months*Math.log1p(rate),denominator=-Math.expm1(-x);function logRemainder(r){if(r>=.01)return r-Math.log1p(r);let power=r*r,sum=0;for(let k=2;k<=14;k++){sum+=(k%2===0?1:-1)*power/k;power*=r;}return sum;}function expRemainder(t){if(t>=.1)return t+Math.expm1(-t);let term=t*t/2,sum=term;for(let k=3;k<=20;k++){term*=-t/k;sum+=term;}return sum;}const interest=principal*(months*logRemainder(rate)+expRemainder(x))/denominator,total=principal+interest,payment=total/months;return{payment,total,interest};}
function rational(raw){const [c,e='0']=String(raw).trim().replace(/^\+/,'').split(/[eE]/),digits=BigInt(c.replace('.',''));if(digits===0n)return[0n,1n];const scale=(c.split('.')[1]||'').length-Number(e);return scale>=0?[digits,10n**BigInt(scale)]:[digits*10n**BigInt(-scale),1n];}
function qadd(a,b){return qnorm([a[0]*b[1]+b[0]*a[1],a[1]*b[1]]);}function qsub(a,b){return qnorm([a[0]*b[1]-b[0]*a[1],a[1]*b[1]]);}function qmul(a,b){return qnorm([a[0]*b[0],a[1]*b[1]]);}function qdiv(a,b){if(b[0]===0n)throw Error('0으로 나눌 수 없습니다.');return qnorm([a[0]*b[1],a[1]*b[0]]);}function qcmp(a,b){const d=a[0]*b[1]-b[0]*a[1];return d<0n?-1:d>0n?1:0;}function qfloor(q){if(q[0]<=0n)return 0n;return q[0]/q[1];}function qceil(q){if(q[0]<=0n)return 0n;return(q[0]+q[1]-1n)/q[1];}function exactCount(n){if(n<0n||n>BigInt(Number.MAX_SAFE_INTEGER))throw Error('개수가 정확히 표시할 수 있는 범위를 넘었습니다.');return Number(n);}
function rows(raw,columns,max=1000){const s=String(raw??'').trim();if(!s||s.length>100000)throw Error('목록을 1~100,000자로 넣으세요.');const result=s.split(/\r\n?|\n/).filter(line=>line.trim()).map(line=>line.trim().split(',').map(value=>value.trim()));if(result.length>max||result.some(row=>row.length!==columns||row.some(value=>!value)))throw Error('한 줄에 쉼표로 나눈 '+columns+'개 값을 넣으세요. 최대 '+max+'행입니다.');return result;}
function amount(raw,name,max=1e12){return integer(raw,name,0,max);}
function sum(values){let s=0,c=0;for(const x of values){const t=s+x;c+=Math.abs(s)>=Math.abs(x)?(s-t)+x:(x-t)+s;s=t;}return s+c;}
function report(value,text,data={}){return {...data,value,text};}
function requiredText(raw,max=100000){const s=String(raw??'').trim();if(!s||s.length>max)throw Error('입력 길이를 확인하세요.');return s;}
function qr(raw,name,min=0,max=1e12){num(raw,name,min,max);const s=String(raw).trim(),parts=s.split(/[eE]/),scale=(parts[0].split('.')[1]||'').length-Number(parts[1]||0);if(scale>12)throw Error('소수는 실제 자릿수 기준 12자리 이내로 입력하세요.');return rational(s);}
function countQ(a,b){return exactCount(qceil(qdiv(a,b)));}
function qnumber(q){if(q[1]===0n)throw Error('0으로 나눌 수 없습니다.');let n=q[0],d=q[1];if(d<0n){n=-n;d=-d;}const negative=n<0n;if(negative)n=-n;const whole=n/d,remainder=n%d,result=Number(whole)+Number(remainder*1000000000000000000n/d)/1e18;if(!Number.isFinite(result))throw Error('결과가 표시 범위를 넘었습니다.');return negative?-result:result;}
function qround(q){let n=q[0],d=q[1];if(d<0n){n=-n;d=-d;}return n>=0n?(2n*n+d)/(2n*d):-((2n*(-n)+d-1n)/(2n*d));}
function qwon(q){const n=qround(q);if(n>BigInt(Number.MAX_SAFE_INTEGER)||n< -BigInt(Number.MAX_SAFE_INTEGER))throw Error('금액이 표시 범위를 넘었습니다.');return n.toLocaleString('ko-KR')+'원';}
function qmoney(q){let n=q[0],d=q[1];if(d<0n){n=-n;d=-d;}const negative=n<0n;if(negative)n=-n;if(n/d>BigInt(Number.MAX_SAFE_INTEGER))throw Error('금액이 표시 범위를 넘었습니다.');let fraction='',remainder=n%d;for(let j=0;j<18&&remainder;j++){remainder*=10n;fraction+=(remainder/d).toString();remainder%=d;}if(remainder)throw Error('금액 소수 표시 범위를 넘었습니다.');return(negative?'-':'')+(n/d).toLocaleString('ko-KR')+(fraction?'.'+fraction:'')+'원';}
function gcd(a,b){while(b)[a,b]=[b,a%b];return a;}
function comma(n){return n.toLocaleString('ko-KR');}
function csvn(n){return fmt(n).replace(/,/g,'');}
function safeCount(n){if(!Number.isSafeInteger(n)||n<0)throw Error('개수 범위를 줄이세요.');return n;}
function listMoney(raw,max=100){const s=requiredText(raw,20000),a=s.split(/\r\n?|\n/).filter(x=>x.trim()).map(x=>x.split(',').map(t=>t.trim()));if(a.length>max||a.some(x=>x.length!==2||!x[0]))throw Error('이름,금액을 한 줄씩 넣으세요.');return a.map(([name,value])=>({name,value:amount(value,'금액',1e12)}));}
function exposureTime(raw){const s=String(raw??'').trim();const parts=s.split('/');if(parts.length===1)return positive(s,'노출시간',1e9);if(parts.length===2)return positive(parts[0],'시간 분자',1e9)/positive(parts[1],'시간 분모',1e9);throw Error('노출시간을 초 또는 1/125처럼 입력하세요.');}
function mm(raw,name){return positive(raw,name,1e7);}

function result(n,unit,label,more=[],data={}){const value=fmt(n)+unit;return report(value,label+': '+value+(more.length?'\n'+more.join('\n'):''),{result:n,...data});}
function checked(n){if(!Number.isFinite(n))throw Error('결과가 표시 범위를 넘었습니다.');return Object.is(n,-0)?0:n;}
function qnorm(q){let [n,d]=q;if(d===0n)throw Error('0으로 나눌 수 없습니다.');if(d<0n){n=-n;d=-d;}if(!n)return[0n,1n];let a=n<0n?-n:n,b=d;while(b)[a,b]=[b,a%b];return[n/a,d/a];}
function numbers(raw,min=1,max=1000){const s=requiredText(raw);const a=s.split(/[\s,;]+/).map(v=>num(v,'목록 값',-1e12,1e12));if(a.length<min||a.length>max)throw Error('목록 개수를 확인하세요.');return a;}
function datedFlows(raw){const a=rows(raw,2,500).map(([d,x])=>({date:date(d,'현금흐름 날짜'),amount:num(x,'현금흐름',-1e12,1e12)})).sort((a,b)=>a.date-b.date);if(a.length<2)throw Error('두 현금흐름 이상 넣으세요.');const first=a[0].date;return a.map(x=>({...x,years:(x.date-first)/86400000/365}));}
function xnpv(flows,rate){const log=Math.log1p(rate);return checked(sum(flows.map(x=>x.amount*Math.exp(-x.years*log))));}
function bisectMonotone(fn,low,high){let a=fn(low),b=fn(high);if(!Number.isFinite(a)||!Number.isFinite(b)||a*b>0)throw Error('두 경계 사이에 해가 없습니다. 범위를 바꾸세요.');if(a===0)return low;if(b===0)return high;for(let j=0;j<180;j++){const mid=low+(high-low)/2,c=fn(mid);if(c===0)return mid;if((c>0)===(a>0)){low=mid;a=c;}else high=mid;}return low+(high-low)/2;}
function bondStreams(v){const face=positive(v.face,'액면가',1e12),coupon=num(v.coupon,'표면금리',0,100)/100,frequency=integer(v.frequency,'연 지급 횟수',1,12),periods=integer(v.periods,'남은 지급 횟수',1,1200);return{face,coupon,frequency,periods,payment:face*coupon/frequency};}
function bondPV(b,y){if(y<=-b.frequency)throw Error('할인율 범위를 확인하세요.');const log=Math.log1p(y/b.frequency);return checked(sum(Array.from({length:b.periods},(_,j)=>(b.payment+(j===b.periods-1?b.face:0))*Math.exp(-(j+1)*log))));}
function ratio(n,d,label,percent=false){if(d===0)throw Error('분모가 0일 수 없습니다.');return result(n/d*(percent?100:1),percent?'%':'배',label,[],{numerator:n,denominator:d});}
function qpositive(raw,name,max=1e12){positive(raw,name,max);return qr(raw,name,0,max);}
function exactCeilProduct(raws,divisor='1'){const q=raws.reduce((q,r)=>qmul(q,qr(r,'값')), [1n,1n]);return countQ(q,qr(divisor,'나눌 값'));}
function dateParts(raw){const n=date(raw,'날짜'),d=new Date(n);return{ms:n,y:d.getUTCFullYear(),m:d.getUTCMonth()+1,day:d.getUTCDate(),weekday:d.getUTCDay()};}
function makeDate(y,m,d){if(!Number.isInteger(y)||y<1900||y>2100)throw Error('연도는 1900~2100입니다.');return iso(Date.UTC(y,m-1,d));}
function monthDays(y,m){return new Date(Date.UTC(y,m,0)).getUTCDate();}
function monthShift(ms,months,anchor){
 const d=new Date(ms),total=d.getUTCFullYear()*12+d.getUTCMonth()+months,y=Math.floor(total/12),m=total%12+1;
 const day=Math.min(anchor??d.getUTCDate(),monthDays(y,m));
 return date(makeDate(y,m,day),'날짜');
}
function minute(raw,name='시각'){return clockMinutes(raw);}
function intervalRows(raw){return rows(raw,2,200).map(([a,b])=>{const start=minute(a),end=b==='24:00'?1440:minute(b);if(end<=start)throw Error('끝 시각은 시작보다 뒤여야 합니다.');return[start,end];});}
function mergeIntervals(a){const s=a.map(x=>x.slice()).sort((x,y)=>x[0]-y[0]),out=[];for(const x of s){const tail=out.at(-1);if(tail&&x[0]<=tail[1])tail[1]=Math.max(tail[1],x[1]);else out.push(x);}return out;}
function checkedDate(ms){iso(ms);return ms;}
function minuteClock(n){const day=Math.floor(n/1440),value=((n%1440)+1440)%1440;return(day?'+'+day+'일 ':'')+timeText(value);}
function listNames(raw,min=2,max=64){const a=requiredText(raw,10000).split(/\r?\n/).map(s=>s.trim());if(a.length<min||a.length>max||a.some(s=>!s)||new Set(a).size!==a.length)throw Error('중복 없는 이름을 한 줄씩 넣으세요.');return a;}
function piArea(shape,a,b){choice(shape,['rectangle','circle']);return shape==='circle'?Math.PI*a*a/4:a*b;}
function gridCount(length,piece,gap){if(qcmp(piece,length)>0)return 0;return exactCount(qfloor(qdiv(qadd(length,gap),qadd(piece,gap))));}
function qfmt(q){return fmt(qnumber(q));}
function dayDiff(start,end){return (date(end,'끝 날짜')-date(start,'시작 날짜'))/86400000;}
function noteMidi(raw){const m=String(raw).trim().match(/^([A-Ga-g])([#b]?)(-1|[0-9])$/);if(!m)throw Error('음표는 C4·F#3처럼 넣으세요.');const pc={C:0,D:2,E:4,F:5,G:7,A:9,B:11}[m[1].toUpperCase()]+(m[2]==='#'?1:m[2]==='b'?-1:0),n=(Number(m[3])+1)*12+pc;if(n<0||n>127)throw Error('MIDI 음표 0~127 범위입니다.');return n;}
function midiNote(n){if(!Number.isInteger(n)||n<0||n>127)throw Error('결과 음표가 MIDI 범위를 넘었습니다.');return['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'][n%12]+(Math.floor(n/12)-1);}
function semitone(raw){return num(raw,'반음',-96,96);}
function dbGain(db){return checked(10**(db/20));}
function pitchFrequency(n,a4=440){return a4*2**((n-69)/12);}
function gcf(a,b){while(b)[a,b]=[b,a%b];return a;}
function lcm(a,b){return a/gcf(a,b)*b;}
function excludedDates(raw){const s=String(raw??'').trim();if(!s)return new Set();const a=s.split(/[\s,]+/);if(a.length>1000)throw Error('제외 날짜는 최대 1,000개입니다.');return new Set(a.map(x=>date(x,'제외 날짜')));}
function weekdays(raw){const a=String(raw??'').trim().split(/[\s,]+/).map(x=>integer(x,'요일',1,7));if(!a.length||new Set(a).size!==a.length)throw Error('요일은 1(월)~7(일)을 중복 없이 넣으세요.');return a;}
function subtractIntervals(available,busy){let free=mergeIntervals(available);for(const [b,e]of mergeIntervals(busy)){const next=[];for(const [x,y]of free){if(e<=x||b>=y)next.push([x,y]);else{if(b>x)next.push([x,b]);if(e<y)next.push([e,y]);}}free=next;}return free;}
function timecodeFrames(raw,fps){const m=String(raw).trim().match(/^(\d{1,9}):([0-5]\d):([0-5]\d):(\d{2,3})$/);if(!m||Number(m[4])>=fps)throw Error('HH:MM:SS:FF 타임코드와 FPS 범위를 확인하세요.');const n=((Number(m[1])*60+Number(m[2]))*60+Number(m[3]))*fps+Number(m[4]);if(!Number.isSafeInteger(n)||n>1e12)throw Error('타임코드 길이를 줄이세요.');return n;}
function allocateWon(total,weights){if(!Number.isSafeInteger(total)||total<0)throw Error('배분 금액 범위를 확인하세요.');const sumQ=weights.reduce(qadd,[0n,1n]);if(sumQ[0]<=0n){if(total===0)return weights.map(()=>0);throw Error('배분 기준 합계가 양수여야 합니다.');}const shares=weights.map((w,index)=>{if(w[0]<0n)throw Error('배분 기준은 음수일 수 없습니다.');const q=qdiv(qmul([BigInt(total),1n],w),sumQ),floor=qfloor(q);return{index,floor:Number(floor),remainder:qsub(q,[floor,1n])};}),left=total-sum(shares.map(x=>x.floor));const ranked=shares.slice().sort((a,b)=>-qcmp(a.remainder,b.remainder)||a.index-b.index);for(let j=0;j<left;j++)ranked[j].floor++;return shares.map(x=>x.floor);}
function csvTable(headers,a){const cell=x=>'"'+String(x).replace(/"/g,'""')+'"';return[headers,...a].map(row=>row.map(cell).join(',')).join('\n');}

function calculate(v){const w=integer(v.width,'기준 가로',1,100000),h=integer(v.height,'기준 세로',1,100000),fps=positive(v.fps,'기준 FPS',1000),base=positive(v.bitrate,'비트레이트',1e9),exponent=num(v.exponent,'지수',0,2),ladder=rows(v.targets,3,100).map(([x,y,f])=>{const width=integer(x,'목표 가로',1,100000),height=integer(y,'목표 세로',1,100000),rate=positive(f,'목표 FPS',1000),ratio=(width/w)*(height/h)*(rate/fps),kbps=Math.max(1,Math.round(base*ratio**exponent));return{width,height,fps:rate,kbps};});return report(ladder.length+'단계','가로,세로,FPS,kbps\n'+ladder.map(x=>[x.width,x.height,csvn(x.fps),csvn(x.kbps)].join(',')).join('\n'),{ladder});}
if(typeof module!=='undefined')module.exports={calculate};
if(typeof document!=='undefined'){const $=id=>document.getElementById(id);let version=0;function clear(){version++;$('result').hidden=true;$('result-text').value='';$('result-value').textContent='';$('error').textContent='';$('copy-status').textContent='';}$('calculator').addEventListener('input',clear);$('calculator').addEventListener('change',clear);$('calculator').addEventListener('submit',event=>{event.preventDefault();clear();try{const values=Object.fromEntries(["width","height","fps","bitrate","exponent","targets"].map(id=>[id,$(id).value])),r=calculate(values);$('result-value').textContent=r.value;$('result-text').value=r.text;$('result').hidden=false;$('result').scrollIntoView({block:'nearest'});}catch(error){$('error').textContent=error.message;}});$('copy').addEventListener('click',async()=>{if($('result').hidden)return;const token=version;try{await navigator.clipboard.writeText($('result-text').value);if(token===version)$('copy-status').textContent='복사했습니다.';}catch{if(token!==version)return;$('copy-status').textContent='결과를 선택해 복사하세요.';$('result-text').focus();$('result-text').select();}});}
