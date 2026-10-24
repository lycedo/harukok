'use strict';
function validateResizeFile(file) {
  if (!file || !Number.isFinite(file.size) || file.size <= 0) throw new Error('내용이 있는 이미지 파일을 선택해 주세요.');
  if (file.size > 10 * 1024 * 1024) throw new Error('파일 크기는 10MB 이하여야 합니다.');
  const type = file.type || ({jpg:'image/jpeg',jpeg:'image/jpeg',png:'image/png',webp:'image/webp'}[String(file.name).split('.').pop().toLowerCase()]);
  if (!['image/jpeg','image/png','image/webp'].includes(type)) throw new Error('JPG, PNG, WebP 파일만 사용할 수 있습니다.');
}
function resizeDimensions(width,height,targetWidth) {
  if (![width,height].every(n=>Number.isSafeInteger(n) && n>0) || width*height>12000000) throw new Error('원본은 최대 1,200만 화소까지만 사용할 수 있습니다.');
  if (!Number.isInteger(targetWidth) || targetWidth<1 || targetWidth>width) throw new Error('가로 크기는 1부터 원본 가로 크기 사이의 정수로 입력해 주세요.');
  return {width:targetWidth,height:Math.max(1,Math.round(height*targetWidth/width))};
}
function imageSizeComparison(before,after) {
  const change = (after-before)/before*100;
  return {change, label:after<before?'감소':after>before?'증가':'변화 없음'};
}
function imageDownloadName(name,width,height,type) {
  const stem=String(name).replace(/\.[^.]*$/,'').replace(/[\\/:*?"<>|\u0000-\u001f]/g,'_').slice(0,100) || 'image';
  return `${stem}-${width}x${height}.${({'image/jpeg':'jpg','image/png':'png','image/webp':'webp'})[type]}`;
}
if (typeof module !== 'undefined') module.exports={validateResizeFile,resizeDimensions,imageSizeComparison,imageDownloadName};
if (typeof document !== 'undefined') {
  const $=id=>document.getElementById(id);
  let source=null, sourceURL=null, outputURL=null, loadVersion=0, outputVersion=0;
  const bytes=n=>`${n.toLocaleString('ko-KR')}바이트 (${(n/1024).toLocaleString('ko-KR',{maximumFractionDigits:1})}KB)`;
  function clearResult() {
    outputVersion++;
    $('result-preview').removeAttribute('src'); $('download-image').removeAttribute('href');
    if (outputURL) URL.revokeObjectURL(outputURL);
    outputURL=null; $('image-result').hidden=true; $('result-preview-wrap').hidden=true;
    $('image-error').textContent=''; $('resize-submit').disabled=false;
  }
  function clearSource() {
    clearResult(); source=null;
    $('original-preview').removeAttribute('src');
    if (sourceURL) URL.revokeObjectURL(sourceURL);
    sourceURL=null; $('image-controls').disabled=true; $('image-previews').hidden=true;
  }
  function updateQuality() {
    const png=$('output-format').value==='image/png';
    $('image-quality').disabled=png;
    $('setting-summary').textContent=`${$('output-format').value.split('/')[1].toUpperCase()} · 가로 ${$('target-width').value}px`+(png?'':` · 품질 ${$('image-quality').value}%`);
  }
  function readImage(file,version) {
    if (version!==loadVersion) return;
    try { validateResizeFile(file); } catch(error) { $('image-error').textContent=error.message; $('image-status').textContent='다른 이미지를 선택해 주세요.'; return; }
    const url=URL.createObjectURL(file), img=new Image();
    sourceURL=url;
    img.onload=()=>{
      if (version!==loadVersion) return;
      try {
        resizeDimensions(img.naturalWidth,img.naturalHeight,img.naturalWidth);
        source={img,file};
        $('original-preview').src=url; $('original-info').textContent=`${img.naturalWidth} × ${img.naturalHeight}px · ${bytes(file.size)}`;
        $('target-width').value=String(Math.min(1280,img.naturalWidth)); $('target-width').max=String(img.naturalWidth);
        $('size-note').textContent=`원본 ${img.naturalWidth} × ${img.naturalHeight}px. 세로 크기는 비율에 맞춰 계산합니다.`;
        $('image-controls').disabled=false; $('image-previews').hidden=false; updateQuality();
        $('image-status').textContent='사진 크기·용량 줄이기를 누르세요. 설정은 그대로 사용해도 됩니다.';
      } catch(error) { clearSource(); $('image-error').textContent=error.message; $('image-status').textContent='더 작은 이미지를 선택해 주세요.'; }
    };
    img.onerror=()=>{
      if (version!==loadVersion) return;
      clearSource(); $('image-error').textContent='이 파일을 이미지로 읽을 수 없습니다. 파일이 손상되지 않았는지 확인해 주세요.'; $('image-status').textContent='';
    };
    img.src=url;
  }
  $('image-file').addEventListener('change',()=>{
    const version=++loadVersion; clearSource();
    const file=$('image-file').files[0];
    $('image-status').textContent=file?'이미지를 읽는 중입니다.':'이미지를 선택해 주세요.';
    if (file) readImage(file,version);
  });
  ['target-width','output-format','image-quality'].forEach(id=>$(id).addEventListener('input',()=>{
    clearResult(); updateQuality();
    if (source) $('image-status').textContent='설정이 바뀌었습니다. 다시 변환해 주세요.';
  }));
  $('resize-form').addEventListener('submit',event=>{
    event.preventDefault(); clearResult();
    if (!source) { $('image-error').textContent='먼저 이미지를 선택해 주세요.'; return; }
    try {
      const {width,height}=resizeDimensions(source.img.naturalWidth,source.img.naturalHeight,Number($('target-width').value));
      const type=$('output-format').value,quality=Number($('image-quality').value);
      if (!['image/jpeg','image/png','image/webp'].includes(type)) throw new Error('저장할 파일 형식을 선택해 주세요.');
      if (type!=='image/png' && (!Number.isInteger(quality) || quality<20 || quality>100)) throw new Error('저장 품질은 20~100 사이의 정수로 입력해 주세요.');
      const canvas=document.createElement('canvas'); canvas.width=width; canvas.height=height;
      const context=canvas.getContext('2d');
      if (!context) throw new Error('이 브라우저에서 이미지 처리를 시작할 수 없습니다.');
      if (type==='image/jpeg') { context.fillStyle='#fff'; context.fillRect(0,0,width,height); }
      context.drawImage(source.img,0,0,width,height);
      const version=outputVersion, file=source.file;
      $('resize-submit').disabled=true; $('image-status').textContent='이미지를 변환하는 중입니다.';
      canvas.toBlob(blob=>{
        if (version!==outputVersion) return;
        $('resize-submit').disabled=false;
        if (!blob || blob.type!==type) {
          $('image-error').textContent='이 형식으로 저장하지 못했습니다. 다른 형식이나 더 작은 크기로 다시 시도해 주세요.'; $('image-status').textContent=''; return;
        }
        outputURL=URL.createObjectURL(blob); $('result-preview').src=outputURL;
        const comparison=imageSizeComparison(file.size,blob.size);
        $('result-info').textContent=`${width} × ${height}px · ${type.split('/')[1].toUpperCase()} · ${bytes(blob.size)}`;
        $('size-comparison').textContent=`원본 ${bytes(file.size)} → 결과 ${bytes(blob.size)} · ${Math.abs(comparison.change).toLocaleString('ko-KR',{maximumFractionDigits:1})}% ${comparison.label}`;
        $('download-image').href=outputURL; $('download-image').download=imageDownloadName(file.name,width,height,type);
        $('image-result').hidden=false; $('result-preview-wrap').hidden=false; $('image-status').textContent='완료! 아래 저장하기 버튼을 눌러 사진을 받으세요.';
        $('image-result').scrollIntoView({block:'nearest'});
      },type,quality/100);
    } catch(error) { $('resize-settings').open=true; $('resize-submit').disabled=false; $('image-error').textContent=error.message; $('image-status').textContent=''; }
  });
  $('demo-image').addEventListener('click',()=>{
    const version=++loadVersion; clearSource(); $('image-file').value=''; $('image-status').textContent='예시 이미지를 만드는 중입니다.';
    const canvas=document.createElement('canvas'); canvas.width=1200; canvas.height=800;
    const context=canvas.getContext('2d');
    if (!context) { $('image-error').textContent='이 브라우저는 이미지 처리를 지원하지 않습니다.'; $('image-status').textContent=''; return; }
    context.fillStyle='#ece8dc'; context.fillRect(0,0,1200,800);
    context.fillStyle='#16233d'; context.fillRect(100,100,1000,600);
    context.fillStyle='#fff'; context.font='bold 90px sans-serif'; context.fillText('HARUKOK',170,330);
    context.font='40px sans-serif'; context.fillText('1200 x 800 / Sample image',170,430);
    context.fillStyle='#b23a2e'; context.beginPath(); context.arc(900,590,65,0,Math.PI*2); context.fill();
    canvas.toBlob(blob=>{
      if (version!==loadVersion) return;
      if (!blob) { $('image-error').textContent='예시를 만들지 못했습니다. 내 이미지를 선택해 주세요.'; $('image-status').textContent=''; return; }
      readImage(new File([blob],'harukok-sample.png',{type:'image/png'}),version);
    },'image/png');
  });
  window.addEventListener('pagehide',()=>{loadVersion++;clearSource();});
}
