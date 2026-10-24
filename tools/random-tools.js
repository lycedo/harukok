'use strict';
function randomIndex(max) {
  if (!Number.isInteger(max) || max<1 || max>10000) throw new Error('무작위 선택 범위를 확인해 주세요.');
  const limit=4294967296-(4294967296%max), buffer=new Uint32Array(1);
  do {crypto.getRandomValues(buffer);} while(buffer[0]>=limit);
  return buffer[0]%max;
}
function shuffled(items) {
  const result=items.slice();
  for(let i=result.length-1;i>0;i--) {const j=randomIndex(i+1);[result[i],result[j]]=[result[j],result[i]];}
  return result;
}
function parseParticipants(text) {
  if(text.length>16000) throw new Error('명단은 16,000자 이내로 입력해 주세요.');
  const names=text.split(/\r?\n/).map(n=>n.trim().normalize('NFC')).filter(Boolean);
  if(names.length<1 || names.length>200) throw new Error('참가자는 1~200명까지 한 줄에 한 명씩 입력해 주세요.');
  if(names.some(n=>n.length>60)) throw new Error('이름 또는 별명은 한 줄에 60자 이내로 입력해 주세요.');
  if(new Set(names).size!==names.length) throw new Error('같은 이름이 두 번 있습니다. 동명이인은 ‘민수 A’, ‘민수 B’처럼 구분해 주세요.');
  return names;
}
function drawNames(names,count) {
  if(!Number.isInteger(count) || count<1 || count>names.length) throw new Error('뽑을 인원은 전체 참가자 수 이하의 양의 정수로 입력해 주세요.');
  return shuffled(names).slice(0,count);
}
function splitTeams(names,count) {
  if(!Number.isInteger(count) || count<2 || count>50 || count>names.length) throw new Error('팀 수는 2~50 사이이며 참가자 수 이하여야 합니다.');
  const teams=Array.from({length:count},()=>[]);
  shuffled(names).forEach((name,index)=>teams[index%count].push(name));
  return teams;
}
if(typeof module!=='undefined') module.exports={randomIndex,shuffled,parseParticipants,drawNames,splitTeams};
if(typeof document!=='undefined' && document.getElementById('random-form')) {
  const $=id=>document.getElementById(id), isTeams=document.body.dataset.tool==='teams';
  let resultText='';
  function clearResult() {$('random-result').hidden=true;$('random-error').textContent='';$('copy-status').textContent='';resultText='';}
  $('random-form').addEventListener('input',clearResult);
  $('random-form').addEventListener('submit',event=>{
    event.preventDefault();clearResult();
    try {
      const names=parseParticipants($('participants').value), count=Number($('count').value);
      const groups=isTeams?splitTeams(names,count):[drawNames(names,count)];
      const container=$('random-output');container.replaceChildren();
      groups.forEach((group,i)=>{
        if(isTeams) {const h=document.createElement('h3');h.textContent=`${i+1}팀 · ${group.length}명`;container.appendChild(h);}
        const list=document.createElement(isTeams?'ul':'ol');
        group.forEach(name=>{const li=document.createElement('li');li.textContent=name;list.appendChild(li);});container.appendChild(list);
      });
      $('result-summary').textContent=isTeams?`${names.length}명을 ${count}팀으로 배정했습니다.`:`${names.length}명 중 ${count}명을 중복 없이 뽑았습니다.`;
      resultText=$('result-summary').textContent+'\n'+groups.map((g,i)=>(isTeams?`${i+1}팀: `:'')+g.join(', ')).join('\n');
      $('random-result').hidden=false;$('random-result').focus();
    } catch(error) {$('random-error').textContent=error.message;}
  });
  $('copy-result').addEventListener('click',async()=>{
    try {await navigator.clipboard.writeText(resultText);$('copy-status').textContent='결과를 복사했습니다.';}
    catch {$('copy-status').textContent='복사가 허용되지 않았습니다. 화면의 결과를 선택해 복사해 주세요.';}
  });
  $('sample-list').addEventListener('click',()=>{$('participants').value='봄\n여름\n가을\n겨울\n하늘\n바다\n나무';$('count').value=isTeams?'3':'2';clearResult();});
  $('clear-list').addEventListener('click',()=>{$('participants').value='';clearResult();$('participants').focus();});
}
