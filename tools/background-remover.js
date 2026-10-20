'use strict';
function removeWhitePixels(pixels,width,height,tolerance,edgeOnly=true) {
  if(!Number.isInteger(width)||!Number.isInteger(height)||width<1||height<1||width*height>2560000||pixels.length!==width*height*4) throw new Error('처리할 이미지 크기를 확인해 주세요.');
  if(!Number.isInteger(tolerance)||tolerance<0||tolerance>100) throw new Error('흰색 범위는 0~100 사이로 선택해 주세요.');
  const count=width*height;
  const matches=i=>pixels[i*4+3]===0||(pixels[i*4]>=255-tolerance&&pixels[i*4+1]>=255-tolerance&&pixels[i*4+2]>=255-tolerance);
  let removed=0;
  const clear=i=>{if(pixels[i*4+3]>0) {pixels[i*4+3]=0;removed++;}};
  if(!edgeOnly) {for(let i=0;i<count;i++) if(matches(i)) clear(i);return removed;}
  const visited=new Uint8Array(count),queue=new Uint32Array(count);let head=0,tail=0;
  const visit=i=>{if(!visited[i]) {visited[i]=1;if(matches(i)) queue[tail++]=i;}};
  for(let x=0;x<width;x++){visit(x);visit((height-1)*width+x);}
  for(let y=0;y<height;y++){visit(y*width);visit(y*width+width-1);}
  while(head<tail) {
    const i=queue[head++],x=i%width;clear(i);
    if(x>0) visit(i-1);if(x<width-1) visit(i+1);
    if(i>=width) visit(i-width);if(i<count-width) visit(i+width);
  }
  return removed;
}
function backgroundSize(width,height) {
  if(!Number.isInteger(width)||!Number.isInteger(height)||width<1||height<1||width*height>12000000) throw new Error('원본 이미지는 1,200만 화소 이하로 선택해 주세요.');
  const scale=Math.min(1,1600/Math.max(width,height));
  return {width:Math.max(1,Math.round(width*scale)),height:Math.max(1,Math.round(height*scale))};
}
if(typeof module!=='undefined') module.exports={removeWhitePixels,backgroundSize};
if(typeof document!=='undefined') {
  const $=id=>document.getElementById(id);
  let source=null,revision=0,outputUrl='',baseName='image';
  function invalidate() {
    revision++;
    if(outputUrl) URL.revokeObjectURL(outputUrl);
    outputUrl='';
    $('download').removeAttribute('href');$('result').hidden=true;
    $('bg-error').textContent='';$('bg-status').textContent='';
    $('process').disabled=!source;
  }
  function useSource(canvas,originalWidth,originalHeight,name) {
    source=canvas;baseName=name;invalidate();
    const before=$('before');before.width=canvas.width;before.height=canvas.height;
    before.getContext('2d').drawImage(canvas,0,0);$('source-view').hidden=false;
    $('source-info').textContent=`원본 ${originalWidth} × ${originalHeight}px → 작업 크기 ${canvas.width} × ${canvas.height}px`+(originalWidth!==canvas.width||originalHeight!==canvas.height?' · 모바일 처리 속도를 위해 긴 변을 1,600px로 줄였습니다.':' · 원본 크기 유지');
  }
  $('image-file').addEventListener('change',async()=>{
    source=null;invalidate();$('source-view').hidden=true;
    const file=$('image-file').files[0];if(!file) return;
    const ticket=revision;let url='';
    try {
      if(!['image/jpeg','image/png','image/webp'].includes(file.type)) throw new Error('JPG, PNG, WebP 이미지 파일을 선택해 주세요.');
      if(file.size>10*1024*1024) throw new Error('파일은 10MB 이하로 선택해 주세요.');
      $('bg-status').textContent='이미지를 읽고 있습니다.';
      url=URL.createObjectURL(file);const img=new Image();img.src=url;await img.decode();
      if(ticket!==revision) return;
      const size=backgroundSize(img.naturalWidth,img.naturalHeight),canvas=document.createElement('canvas');
      canvas.width=size.width;canvas.height=size.height;
      canvas.getContext('2d').drawImage(img,0,0,size.width,size.height);
      useSource(canvas,img.naturalWidth,img.naturalHeight,file.name.replace(/\.[^.]+$/,''));
    } catch(error) {
      if(ticket===revision) {$('bg-error').textContent=error.name==='EncodingError'?'이미지를 읽을 수 없습니다. 다른 JPG·PNG·WebP 파일을 선택해 주세요.':error.message;$('bg-status').textContent='';}
    } finally {if(url) URL.revokeObjectURL(url);}
  });
  $('sample-image').addEventListener('click',()=>{
    const canvas=document.createElement('canvas');canvas.width=480;canvas.height=300;
    const ctx=canvas.getContext('2d');ctx.fillStyle='#fff';ctx.fillRect(0,0,480,300);
    ctx.fillStyle='#16233d';ctx.fillRect(45,45,170,210);ctx.fillStyle='#fff';ctx.fillRect(65,65,130,170);
    ctx.fillStyle='#b23a2e';ctx.beginPath();ctx.arc(330,150,65,0,Math.PI*2);ctx.fill();
    $('image-file').value='';useSource(canvas,480,300,'harukok-example');
  });
  $('tolerance').addEventListener('input',()=>{$('tolerance-value').textContent=$('tolerance').value;invalidate();});
  $('edge-only').addEventListener('change',invalidate);
  $('process').addEventListener('click',async()=>{
    if(!source) return;
    invalidate();const ticket=revision,canvas=source,tolerance=Number($('tolerance').value),edgeOnly=$('edge-only').checked;
    $('process').disabled=true;$('bg-status').textContent='배경을 지우고 있습니다.';
    try {
      await new Promise(resolve=>setTimeout(resolve,0));
      if(ticket!==revision) return;
      const output=document.createElement('canvas');output.width=canvas.width;output.height=canvas.height;
      const ctx=output.getContext('2d');ctx.drawImage(canvas,0,0);
      const data=ctx.getImageData(0,0,output.width,output.height);
      const removed=removeWhitePixels(data.data,output.width,output.height,tolerance,edgeOnly);
      ctx.putImageData(data,0,0);
      const blob=await new Promise(resolve=>output.toBlob(resolve,'image/png'));
      if(ticket!==revision) return;
      if(!blob) throw new Error('PNG 파일을 만들 수 없습니다. 더 작은 이미지로 다시 시도해 주세요.');
      outputUrl=URL.createObjectURL(blob);$('after').src=outputUrl;
      $('download').href=outputUrl;$('download').download=baseName+'-transparent.png';
      $('result-info').textContent=`${output.width} × ${output.height}px · PNG ${(blob.size/1024).toFixed(1)}KB · ${removed.toLocaleString('ko-KR')}개 픽셀을 투명하게 바꿨습니다.`;
      $('bg-status').textContent=removed?'완료했습니다. 체크무늬 부분이 투명한 영역입니다.':'지울 수 있는 흰색을 찾지 못했습니다. 흰색 범위를 늘리거나 제거 방식을 바꿔보세요.';
      $('result').hidden=false;
    } catch(error) {if(ticket===revision) {$('bg-error').textContent=error.message;$('bg-status').textContent='';}}
    finally {if(ticket===revision) $('process').disabled=false;}
  });
  $('clear-image').addEventListener('click',()=>{source=null;$('image-file').value='';invalidate();$('source-view').hidden=true;$('before').width=1;$('before').height=1;$('after').removeAttribute('src');});
  window.addEventListener('pagehide',()=>{if(outputUrl) URL.revokeObjectURL(outputUrl);});
  window.addEventListener('pageshow',event=>{if(event.persisted) invalidate();});
}
