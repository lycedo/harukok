'use strict';
const CROP_RATIOS={'1:1':1,'4:3':4/3,'3:4':3/4,'16:9':16/9,'9:16':9/16};
function validateCropFile(file) {
  if (!file || !Number.isFinite(file.size) || file.size<=0) throw new Error('내용이 있는 이미지 파일을 선택해 주세요.');
  if (file.size>10*1024*1024) throw new Error('파일은 최대 10MB까지 사용할 수 있습니다.');
  const type=file.type || ({jpg:'image/jpeg',jpeg:'image/jpeg',png:'image/png',webp:'image/webp'}[String(file.name).split('.').pop().toLowerCase()]);
  if (!['image/jpeg','image/png','image/webp'].includes(type)) throw new Error('JPG, PNG, WebP 파일만 사용할 수 있습니다.');
}
function cropRectangle(width,height,ratio,positionX=50,positionY=50) {
  if (![width,height].every(n=>Number.isSafeInteger(n)&&n>0) || width*height>12000000) throw new Error('이미지는 최대 1,200만 화소까지만 사용할 수 있습니다.');
  if (![positionX,positionY].every(n=>Number.isFinite(n)&&n>=0&&n<=100)) throw new Error('가로·세로 위치는 0~100 사이여야 합니다.');
  if (ratio!=='original' && !Object.hasOwn(CROP_RATIOS,ratio)) throw new Error('자르기 비율을 선택해 주세요.');
  let cropWidth=width,cropHeight=height;
  if (ratio!=='original') {
    if (width/height>CROP_RATIOS[ratio]) cropWidth=Math.max(1,Math.round(height*CROP_RATIOS[ratio]));
    else cropHeight=Math.max(1,Math.round(width/CROP_RATIOS[ratio]));
  }
  return {x:Math.round((width-cropWidth)*positionX/100),y:Math.round((height-cropHeight)*positionY/100),width:cropWidth,height:cropHeight};
}
function cropDownloadName(name,width,height,type) {
  const stem=String(name).replace(/\.[^.]*$/,'').replace(/[\\/:*?"<>|\u0000-\u001f]/g,'_').slice(0,100)||'image';
  return `${stem}-crop-${width}x${height}.${type==='image/jpeg'?'jpg':'png'}`;
}
if (typeof module!=='undefined') module.exports={cropRectangle,validateCropFile,cropDownloadName};
if (typeof document!=='undefined') {
  const $=id=>document.getElementById(id);
  let source=null,sourceURL=null,outputURL=null,loadVersion=0,outputVersion=0;
  function clearResult() {
    outputVersion++; $('download-image').removeAttribute('href');
    if (outputURL) URL.revokeObjectURL(outputURL);
    outputURL=null; $('image-result').hidden=true; $('image-error').textContent=''; $('crop-submit').disabled=false;
  }
  function clearSource() {
    clearResult(); source=null; $('original-preview').removeAttribute('src');
    if (sourceURL) URL.revokeObjectURL(sourceURL);
    sourceURL=null; $('image-controls').disabled=true; $('image-previews').hidden=true;
    $('crop-preview').width=1; $('crop-preview').height=1;
  }
  function rectangle() { return cropRectangle(source.img.naturalWidth,source.img.naturalHeight,$('crop-ratio').value,Number($('position-x').value),Number($('position-y').value)); }
  function drawCrop(canvas,rect,preview=false) {
    const scale=preview?Math.min(1,800/Math.max(rect.width,rect.height)):1;
    canvas.width=Math.max(1,Math.round(rect.width*scale)); canvas.height=Math.max(1,Math.round(rect.height*scale));
    const context=canvas.getContext('2d');
    if (!context) throw new Error('이 브라우저에서 이미지 처리를 시작할 수 없습니다.');
    if ($('output-format').value==='image/jpeg') { context.fillStyle='#fff'; context.fillRect(0,0,canvas.width,canvas.height); }
    context.drawImage(source.img,rect.x,rect.y,rect.width,rect.height,0,0,canvas.width,canvas.height);
  }
  function renderPreview() {
    clearResult(); if (!source) return;
    try {
      const rect=rectangle();
      if (!['image/png','image/jpeg'].includes($('output-format').value)) throw new Error('PNG 또는 JPG 형식을 선택해 주세요.');
      drawCrop($('crop-preview'),rect,true);
      $('position-x').disabled=rect.width===source.img.naturalWidth; $('position-y').disabled=rect.height===source.img.naturalHeight;
      $('position-x-value').textContent=$('position-x').disabled?'가로 전체 사용':$('position-x').value+'%';
      $('position-y-value').textContent=$('position-y').disabled?'세로 전체 사용':$('position-y').value+'%';
      $('crop-info').textContent=`저장 크기 ${rect.width} × ${rect.height}px · 원본 왼쪽에서 ${rect.x}px, 위에서 ${rect.y}px`;
      $('image-status').textContent='미리보기를 확인한 뒤 저장 파일 만들기를 눌러 주세요.';
    } catch(error) { $('image-error').textContent=error.message; $('crop-submit').disabled=true; $('image-status').textContent=''; }
  }
  function readImage(file,version) {
    if (version!==loadVersion) return;
    try { validateCropFile(file); } catch(error) { $('image-error').textContent=error.message; $('image-status').textContent='다른 이미지를 선택해 주세요.'; return; }
    const img=new Image(),url=URL.createObjectURL(file); sourceURL=url;
    img.onload=()=>{
      if (version!==loadVersion) return;
      try {
        cropRectangle(img.naturalWidth,img.naturalHeight,'original'); source={img,file};
        $('position-x').value='50'; $('position-y').value='50'; $('original-preview').src=url;
        $('original-info').textContent=`${img.naturalWidth} × ${img.naturalHeight}px · ${file.size.toLocaleString('ko-KR')}바이트`;
        $('image-controls').disabled=false; $('image-previews').hidden=false; renderPreview();
      } catch(error) { clearSource(); $('image-error').textContent=error.message; $('image-status').textContent='더 작은 이미지를 선택해 주세요.'; }
    };
    img.onerror=()=>{if(version!==loadVersion)return;clearSource();$('image-error').textContent='이미지를 읽을 수 없습니다. 지원 형식인지, 파일이 손상되지 않았는지 확인해 주세요.';$('image-status').textContent='';};
    img.src=url;
  }
  $('image-file').addEventListener('change',()=>{
    const version=++loadVersion; clearSource(); const file=$('image-file').files[0];
    $('image-status').textContent=file?'이미지를 읽는 중입니다.':'이미지를 선택해 주세요.'; if(file)readImage(file,version);
  });
  ['crop-ratio','position-x','position-y','output-format'].forEach(id=>$(id).addEventListener('input',renderPreview));
  $('crop-form').addEventListener('submit',event=>{
    event.preventDefault(); clearResult(); if(!source){$('image-error').textContent='먼저 이미지를 선택해 주세요.';return;}
    try {
      const rect=rectangle(),type=$('output-format').value;
      if(!['image/png','image/jpeg'].includes(type))throw new Error('PNG 또는 JPG 형식을 선택해 주세요.');
      const canvas=document.createElement('canvas'); drawCrop(canvas,rect);
      const version=outputVersion,file=source.file;
      $('crop-submit').disabled=true; $('image-status').textContent='저장할 파일을 만드는 중입니다.';
      canvas.toBlob(blob=>{
        if(version!==outputVersion)return;
        $('crop-submit').disabled=false;
        if(!blob||blob.type!==type){$('image-error').textContent='파일을 만들지 못했습니다. 다른 형식이나 이미지로 다시 시도해 주세요.';$('image-status').textContent='';return;}
        outputURL=URL.createObjectURL(blob); $('download-image').href=outputURL; $('download-image').download=cropDownloadName(file.name,rect.width,rect.height,type);
        $('result-info').textContent=`${rect.width} × ${rect.height}px · ${type==='image/jpeg'?'JPG':'PNG'} · ${blob.size.toLocaleString('ko-KR')}바이트`;
        $('image-result').hidden=false; $('image-status').textContent='파일이 준비되었습니다. 다운로드 버튼으로 저장하세요.';
      },type,0.92);
    } catch(error) { $('image-error').textContent=error.message; $('crop-submit').disabled=false; $('image-status').textContent=''; }
  });
  $('demo-image').addEventListener('click',()=>{
    const version=++loadVersion; clearSource(); $('image-file').value=''; $('image-status').textContent='예시 이미지를 만드는 중입니다.';
    const canvas=document.createElement('canvas'); canvas.width=1200;canvas.height=800;const context=canvas.getContext('2d');
    if(!context){$('image-error').textContent='이 브라우저는 이미지 처리를 지원하지 않습니다.';$('image-status').textContent='';return;}
    context.fillStyle='#ece8dc';context.fillRect(0,0,1200,800);
    context.fillStyle='#16233d';context.fillRect(80,120,420,560);context.fillStyle='#b23a2e';context.fillRect(700,240,420,440);
    context.fillStyle='#fff';context.font='bold 60px sans-serif';context.fillText('LEFT',170,420);context.fillText('RIGHT',790,490);
    context.fillStyle='#16233d';context.font='32px sans-serif';context.fillText('HARUKOK / 1200 x 800',370,740);
    canvas.toBlob(blob=>{
      if(version!==loadVersion)return;
      if(!blob){$('image-error').textContent='예시를 만들지 못했습니다. 내 파일을 선택해 주세요.';$('image-status').textContent='';return;}
      readImage(new File([blob],'harukok-crop-sample.png',{type:'image/png'}),version);
    },'image/png');
  });
  window.addEventListener('pagehide',()=>{loadVersion++;clearSource();});
}
