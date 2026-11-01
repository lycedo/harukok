'use strict';
function mixingAmounts(total,ratios){
 if(!Number.isFinite(total)||total<0.001||total>1e6)throw new Error('총량은 0.001부터 1,000,000 사이로 입력해 주세요.');
 if(!Array.isArray(ratios)||ratios.length!==3||!ratios.every(n=>Number.isFinite(n)&&n>=0&&n<=1e6))throw new Error('각 비율은 0부터 1,000,000 사이로 입력해 주세요.');
 const sum=ratios.reduce((a,b)=>a+b,0);if(!sum)throw new Error('비율 중 하나 이상은 0보다 커야 합니다.');
 return ratios.map(r=>({amount:total*(r/sum),percent:100*(r/sum)}));
}
if(typeof module!=='undefined')module.exports={mixingAmounts};
if(typeof document!=='undefined'){
 const $=id=>document.getElementById(id),fmt=n=>n.toLocaleString('ko-KR',{maximumFractionDigits:3});
 function clear(){ $('result').hidden=true;$('amounts').textContent='';$('error').textContent=''; }
 $('calculator').addEventListener('input',clear);$('calculator').addEventListener('change',clear);
 $('calculator').addEventListener('submit',e=>{
  e.preventDefault();clear();try{
   const ids=['total','ratio-a','ratio-b','ratio-c'];if(ids.some(id=>$(id).value.trim()===''))throw new Error('모든 칸을 입력해 주세요. 사용하지 않는 비율은 0을 입력하세요.');
   const total=Number($('total').value),unit=$('unit').value;
   if(!['g','mL'].includes(unit))throw new Error('단위를 선택해 주세요.');
   const values=mixingAmounts(total,ids.slice(1).map(id=>Number($(id).value)));
   $('result-value').textContent='총 '+fmt(total)+' '+unit;$('result-detail').textContent='재료별 필요한 양';
   values.forEach((r,i)=>{const li=document.createElement('li');li.textContent='재료 '+['A','B','C'][i]+': '+fmt(r.amount)+' '+unit+' ('+fmt(r.percent)+'%)';$('amounts').appendChild(li);});
   $('result').hidden=false;
  }catch(error){$('error').textContent=error.message;}
 });
}
