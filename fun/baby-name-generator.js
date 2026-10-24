'use strict';
// 뜻풀이가 아니라 부모가 이름에 담아볼 수 있는 바람을 직접 작성한 추천 목록이다.
const babyNames=[
  ['봄이','spring','새로운 시작처럼 반가운 만남을 기다리는 마음'],['새봄','spring','가족에게 찾아온 새로운 봄을 기억하는 이름'],['꽃봄','spring','꽃 피는 계절처럼 환하게 자라길 바라는 마음'],['새싹','spring','작은 시작을 소중하게 돌보고 싶은 마음'],['봄빛','spring','포근한 햇살처럼 따뜻한 마음을 담은 이름'],['초록','spring','잎이 자라듯 건강하게 자라길 바라는 마음'],['산들','spring','봄바람처럼 부드럽게 부를 수 있는 이름'],['몽글','spring','처음 만난 설렘이 몽글몽글 피어나는 느낌'],
  ['여름','summer','함께 맞이할 여름을 기억하고 싶은 마음'],['바다','summer','넓은 바다처럼 많은 경험을 만나길 바라는 마음'],['파랑','summer','맑은 하늘과 바다를 떠올리는 이름'],['햇살','summer','환한 햇살처럼 주변을 밝히길 바라는 마음'],['수박','summer','여름의 달콤한 기억을 담은 친근한 이름'],['윤슬','summer','물 위의 반짝임을 떠올리며 고른 이름'],['해님','summer','매일 반갑게 만나고 싶은 마음'],['여울','summer','시원하게 흐르는 물소리를 떠올리는 이름'],
  ['가을','autumn','차분한 가을의 분위기를 담은 이름'],['열매','autumn','함께 기다린 결실을 소중히 여기는 마음'],['밤톨','autumn','작고 단단한 밤톨처럼 옹골차길 바라는 마음'],['도토리','autumn','작은 존재에 담긴 큰 가능성을 응원하는 이름'],['단풍','autumn','자신만의 빛깔을 지니길 바라는 마음'],['보리','autumn','소박하고 든든한 느낌으로 부르는 이름'],['달이','autumn','보름달처럼 포근한 인상을 담은 이름'],['토실','autumn','잘 먹고 편안하게 자라길 바라는 마음'],
  ['겨울','winter','맑고 고요한 겨울을 기억하는 이름'],['눈송','winter','눈송이처럼 특별한 만남을 기다리는 마음'],['온유','winter','다정하고 부드러운 분위기로 고른 이름'],['포근','winter','안아주고 싶은 따뜻한 마음'],['솜이','winter','솜처럼 부드러운 느낌의 이름'],['별이','winter','겨울밤의 별처럼 반가운 존재라는 마음'],['호빵','winter','추운 날의 따뜻함을 담은 친근한 이름'],['동글','winter','둥글고 편안한 느낌으로 부르는 이름']
].map(([name,season,wish])=>({name,season,wish}));
function recommendNames(season) {
  if(!['all','spring','summer','autumn','winter'].includes(season)) throw new Error('추천할 계절을 선택해 주세요.');
  return shuffled(babyNames.filter(item=>season==='all'||item.season===season)).slice(0,6);
}
if(typeof module!=='undefined') module.exports={babyNames};
if(typeof document!=='undefined') {
  const $=id=>document.getElementById(id), selected=new Set();
  function refreshSelected() {
    $('saved-section').hidden=selected.size===0;
    $('saved-names').textContent=selected.size?Array.from(selected).join(' · '):'추천 결과에서 마음에 드는 이름을 골라 보세요.';
    $('copy-names').disabled=selected.size===0;$('saved-status').textContent='';
  }
  $('baby-form').addEventListener('submit',event=>{
    event.preventDefault();$('baby-error').textContent='';
    try {
      const names=recommendNames($('season').value), list=$('name-list');list.replaceChildren();
      names.forEach(item=>{
        const li=document.createElement('li'), h=document.createElement('h3'), p=document.createElement('p'), button=document.createElement('button');
        h.textContent=item.name;p.textContent=item.wish;button.type='button';button.className='secondary';
        const refresh=()=>{button.textContent=selected.has(item.name)?'후보에서 빼기':'후보에 담기';button.setAttribute('aria-pressed',String(selected.has(item.name)));button.setAttribute('aria-label',item.name+' '+button.textContent);};refresh();
        button.addEventListener('click',()=>{if(selected.has(item.name)) selected.delete(item.name);else selected.add(item.name);refresh();refreshSelected();});
        li.append(h,p,button);list.appendChild(li);
      });$('baby-result').hidden=false;
    } catch(error) {$('baby-error').textContent=error.message;}
  });
  $('season').addEventListener('change',()=>{$('baby-result').hidden=true;});
  $('copy-names').addEventListener('click',async()=>{try{await navigator.clipboard.writeText(Array.from(selected).join(', '));$('saved-status').textContent='고른 태명을 복사했습니다.';}catch{$('saved-status').textContent='복사가 허용되지 않았습니다. 후보 이름을 선택해 복사해 주세요.';}});
  $('clear-names').addEventListener('click',()=>{selected.clear();refreshSelected();$('baby-result').hidden=true;});
}
