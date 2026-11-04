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
 const frequency=num(v.frequency,'주파수',20,20000),seconds=num(v.seconds,'길이',.1,10),level=num(v.level,'출력 레벨',0,20),sampleRate=48000,frames=Math.round(seconds*sampleRate),bytes=new Uint8Array(44+frames*2),view=new DataView(bytes.buffer),ascii=(offset,text)=>{for(let i=0;i<text.length;i++)bytes[offset+i]=text.charCodeAt(i);};ascii(0,'RIFF');view.setUint32(4,bytes.length-8,true);ascii(8,'WAVE');ascii(12,'fmt ');view.setUint32(16,16,true);view.setUint16(20,1,true);view.setUint16(22,1,true);view.setUint32(24,sampleRate,true);view.setUint32(28,sampleRate*2,true);view.setUint16(32,2,true);view.setUint16(34,16,true);ascii(36,'data');view.setUint32(40,frames*2,true);const fade=Math.min(Math.round(sampleRate*.01),Math.floor(frames/2));for(let i=0;i<frames;i++){const envelope=Math.min(1,i/fade,(frames-1-i)/fade),sample=Math.round(Math.sin(2*Math.PI*frequency*i/sampleRate)*level/100*32767*envelope);view.setInt16(44+i*2,sample,true);}return{value:fmt(frequency)+'Hz WAV 생성',text:'주파수: '+fmt(frequency)+'Hz\n길이: '+fmt(frames/sampleRate)+'초\n출력 레벨: '+fmt(level)+'%\n형식: 48kHz · 16비트 · 모노 PCM\n파일 크기: '+fmt(bytes.length)+'바이트',wav:bytes,frequency,frames,sampleRate};
}
if(typeof module!=='undefined')module.exports={calculate};

if(typeof document!=='undefined'){
 const $=id=>document.getElementById(id);let version=0;let audioUrl=null,lastWav=null;
 function revoke(){if(audioUrl){URL.revokeObjectURL(audioUrl);audioUrl=null;}$('tone-audio').pause();$('tone-audio').removeAttribute('src');$('tone-audio').load();$('tone-download').removeAttribute('href');}
 function attach(){if(!lastWav)return;audioUrl=URL.createObjectURL(new Blob([lastWav.wav],{type:'audio/wav'}));$('tone-audio').src=audioUrl;$('tone-audio').load();$('tone-download').href=audioUrl;$('tone-download').download='harukok-tone-'+lastWav.frequency+'hz.wav';}
 window.addEventListener('pagehide',revoke);window.addEventListener('pageshow',()=>{if(lastWav&&!$('result').hidden&&!audioUrl)attach();});

 function clear(){version++;$('result').hidden=true;$('result-text').value='';$('result-value').textContent='';$('error').textContent='';$('copy-status').textContent='';revoke();lastWav=null;}
 $('calculator').addEventListener('input',()=>{clear();});$('calculator').addEventListener('change',clear);
 $('calculator').addEventListener('submit',event=>{event.preventDefault();clear();try{const values=Object.fromEntries(["frequency","seconds","level"].map(id=>[id,$(id).value])),r=calculate(values);$('result-value').textContent=r.value;$('result-text').value=r.text;lastWav=r;attach();$('result').hidden=false;$('result').scrollIntoView({block:'nearest'});}catch(error){$('error').textContent=error.message;}});
 $('copy').addEventListener('click',async()=>{if($('result').hidden)return;const token=version;try{await navigator.clipboard.writeText($('result-text').value);if(token===version)$('copy-status').textContent='복사했습니다.';}catch{if(token!==version)return;$('copy-status').textContent='결과를 선택해 복사하세요.';$('result-text').focus();$('result-text').select();}});

}
