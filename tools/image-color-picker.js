'use strict';
function validateColorFile(file){
 if(!file||!Number.isFinite(file.size)||file.size<=0||file.size>10*1024*1024)throw new Error('내용이 있는 10MB 이하의 사진을 선택해 주세요.');
 const type=file.type||({jpg:'image/jpeg',jpeg:'image/jpeg',png:'image/png',webp:'image/webp'}[String(file.name).split('.').pop().toLowerCase()]);
 if(!['image/jpeg','image/png','image/webp'].includes(type))throw new Error('JPG·PNG·WebP 사진만 사용할 수 있습니다.');
}
function colorHex(rgb){return '#'+Array.from(rgb).slice(0,3).map(n=>n.toString(16).padStart(2,'0')).join('').toUpperCase();}
function pixelPosition(x,y,width,height){
 if(![x,y,width,height].every(Number.isInteger)||width<1||height<1||width*height>12000000||x<0||y<0||x>=width||y>=height)throw new Error('사진 범위 안의 정수 픽셀 위치를 입력해 주세요. 원본은 최대 1,200만 화소입니다.');
 return {x,y};
}
if(typeof module!=='undefined')module.exports={validateColorFile,colorHex,pixelPosition};
if(typeof document!=='undefined'){
 const $=id=>document.getElementById(id),canvas=$('image-canvas'),ctx=canvas.getContext('2d',{willReadFrequently:true,colorSpace:'srgb'});
 let version=0,copyVersion=0,hex='';
 function clearColor(){copyVersion++;hex='';$('result').hidden=true;$('copy-status').textContent='';$('error').textContent='';}
 function reset(){version++;clearColor();$('picker').hidden=true;$('status').textContent='';canvas.width=canvas.height=1;return version;}
 function ready(){
  $('picker').hidden=false;$('pixel-x').value='0';$('pixel-y').value='0';$('pixel-x').max=String(canvas.width-1);$('pixel-y').max=String(canvas.height-1);
  $('status').textContent=canvas.width+' × '+canvas.height+'px · 사진에서 원하는 색을 누르세요.';
 }
 function pick(x,y){
  clearColor();try{
   pixelPosition(x,y,canvas.width,canvas.height);const data=ctx.getImageData(x,y,1,1).data;
   if(data[3]===0)throw new Error('완전히 투명한 픽셀입니다. 다른 위치를 선택해 주세요.');
   hex=colorHex(data);$('pixel-x').value=String(x);$('pixel-y').value=String(y);$('result-value').textContent=hex;
   $('swatch').style.backgroundColor=hex;$('result-detail').textContent='RGB('+Array.from(data).slice(0,3).join(', ')+') · 불투명도 '+(data[3]/255*100).toFixed(1)+'% · 위치 '+x+', '+y;
   $('copy').disabled=false;$('result').hidden=false;
  }catch(error){$('error').textContent=error.message;}
 }
 $('image-file').addEventListener('change',()=>{
  const current=reset(),file=$('image-file').files[0];if(!file)return;
  try{validateColorFile(file);}catch(error){$('error').textContent=error.message;return;}
  const url=URL.createObjectURL(file),img=new Image();$('status').textContent='사진을 읽고 있어요.';
  img.onload=()=>{URL.revokeObjectURL(url);if(current!==version)return;try{
   pixelPosition(0,0,img.naturalWidth,img.naturalHeight);canvas.width=img.naturalWidth;canvas.height=img.naturalHeight;ctx.drawImage(img,0,0);ready();
  }catch(error){reset();$('error').textContent=error.message;}};
  img.onerror=()=>{URL.revokeObjectURL(url);if(current!==version)return;reset();$('error').textContent='사진을 읽지 못했어요. 다른 JPG·PNG·WebP 파일을 선택해 주세요.';};img.src=url;
 });
 $('sample').addEventListener('click',()=>{reset();$('image-file').value='';canvas.width=600;canvas.height=300;['#B23A2E','#16233D','#F0AD3D'].forEach((c,i)=>{ctx.fillStyle=c;ctx.fillRect(i*200,0,200,300);});ready();});
 canvas.addEventListener('click',e=>{const r=canvas.getBoundingClientRect();pick(Math.min(canvas.width-1,Math.floor((e.clientX-r.left)*canvas.width/r.width)),Math.min(canvas.height-1,Math.floor((e.clientY-r.top)*canvas.height/r.height)));});
 $('coordinates').addEventListener('input',clearColor);
 $('coordinates').addEventListener('submit',e=>{e.preventDefault();if($('pixel-x').value.trim()===''||$('pixel-y').value.trim()===''){clearColor();$('error').textContent='두 좌표를 모두 입력해 주세요.';return;}pick(Number($('pixel-x').value),Number($('pixel-y').value));});
 $('copy').addEventListener('click',async()=>{if(!hex||$('result').hidden)return;const value=hex,current=++copyVersion;$('copy').disabled=true;try{await navigator.clipboard.writeText(value);if(current===copyVersion)$('copy-status').textContent='HEX 코드를 복사했어요.';}catch(_){if(current===copyVersion)$('copy-status').textContent='복사하지 못했어요. 위 HEX 코드를 직접 선택해 복사해 주세요.';}finally{if(current===copyVersion)$('copy').disabled=false;}});
}
