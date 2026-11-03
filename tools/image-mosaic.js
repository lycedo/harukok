'use strict';

function validateEditFile(file) {
  if (!file || !Number.isFinite(file.size) || file.size <= 0 || file.size > 10 * 1024 * 1024) throw new Error('내용이 있는 10MB 이하 사진을 선택하세요.');
  const type = file.type || ({ jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp' }[String(file.name).split('.').pop().toLowerCase()]);
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(type)) throw new Error('JPG·PNG·WebP 사진만 사용할 수 있습니다.');
}
function editImageSize(width, height) {
  if (![width, height].every(n => Number.isSafeInteger(n) && n > 0) || width * height > 12000000) throw new Error('원본은 최대 1,200만 화소까지 사용할 수 있습니다.');
}

function mosaicRegion(width, height, x, y, areaWidth, areaHeight, block) {
  editImageSize(width, height);
  if (![x, y, areaWidth, areaHeight, block].every(Number.isInteger) || x < 0 || y < 0 || areaWidth < 1 || areaHeight < 1 || x + areaWidth > width || y + areaHeight > height) throw new Error('영역은 사진 안에 있는 0 이상 좌표와 1 이상 정수 크기로 입력하세요.');
  if (block < 2 || block > 500) throw new Error('모자이크 칸 크기는 2~500px 사이 정수로 입력하세요.');
  return { x, y, width: areaWidth, height: areaHeight, smallWidth: Math.max(1, Math.ceil(areaWidth / block)), smallHeight: Math.max(1, Math.ceil(areaHeight / block)) };
}
if (typeof module !== 'undefined') module.exports = { validateEditFile, editImageSize, mosaicRegion };

if (typeof document !== 'undefined') {
  const $ = id => document.getElementById(id);
  let source = null, sourceURL = null, resultURL = null, loadVersion = 0, resultVersion = 0;
  function clearResult() { resultVersion++; $('image-result').hidden = true; $('result-preview').removeAttribute('src'); $('download-image').removeAttribute('href'); if (resultURL) URL.revokeObjectURL(resultURL); resultURL = null; $('image-error').textContent = ''; $('image-status').textContent = ''; $('image-submit').disabled = false; }
  function clearSource() { clearResult(); source = null; $('source-preview').removeAttribute('src'); $('source-figure').hidden = true; if (sourceURL) URL.revokeObjectURL(sourceURL); sourceURL = null; $('image-controls').disabled = true; }
  function loadFile(file, version) {
    if (version !== loadVersion) return;
    try { validateEditFile(file); } catch (error) { $('image-error').textContent = error.message; return; }
    const img = new Image(), url = URL.createObjectURL(file); sourceURL = url; $('image-status').textContent = '사진을 읽는 중입니다.';
    img.onload = () => {
      if (version !== loadVersion) return;
      try { editImageSize(img.naturalWidth, img.naturalHeight); source = { img, file }; $('source-preview').src = url; $('source-figure').hidden = false; $('source-info').textContent = '원본 ' + img.naturalWidth + ' × ' + img.naturalHeight + 'px'; $('region-x').value = String(Math.floor(img.naturalWidth / 4)); $('region-y').value = String(Math.floor(img.naturalHeight / 4)); $('region-width').value = String(Math.max(1, Math.floor(img.naturalWidth / 2))); $('region-height').value = String(Math.max(1, Math.floor(img.naturalHeight / 2))); $('block-size').value = String(Math.max(2, Math.min(500, Math.round(img.naturalWidth / 30)))); $('image-controls').disabled = false; $('image-status').textContent = '설정을 고르고 사진 변환하기를 누르세요.'; }
      catch (error) { clearSource(); $('image-error').textContent = error.message; }
    };
    img.onerror = () => { if (version !== loadVersion) return; clearSource(); $('image-error').textContent = '사진을 읽지 못했습니다. 다른 파일을 선택하세요.'; };
    img.src = url;
  }
  $('image-file').addEventListener('change', () => { const version = ++loadVersion; clearSource(); const file = $('image-file').files[0]; if (file) loadFile(file, version); });
  for (const id of ["region-x","region-y","region-width","region-height","block-size"]) { $(id).addEventListener('input', clearResult); $(id).addEventListener('change', clearResult); }
  $('image-form').addEventListener('submit', event => {
    event.preventDefault(); clearResult(); if (!source) { $('image-error').textContent = '먼저 사진을 선택하세요.'; return; }
    try {
      const width = source.img.naturalWidth, height = source.img.naturalHeight;
      const canvas = document.createElement('canvas'); canvas.width = width; canvas.height = height;
      const context = canvas.getContext('2d'); if (!context) throw new Error('사진 처리를 시작할 수 없습니다.');
      context.drawImage(source.img, 0, 0);
      if (["region-x","region-y","region-width","region-height","block-size"].some(id => !$(id).value.trim())) throw new Error('영역 좌표·크기와 칸 크기를 모두 입력하세요.');
      const r = mosaicRegion(width, height, Number($('region-x').value), Number($('region-y').value), Number($('region-width').value), Number($('region-height').value), Number($('block-size').value));
      const small = document.createElement('canvas'); small.width = r.smallWidth; small.height = r.smallHeight;
      const reduced = small.getContext('2d'); if (!reduced) throw new Error('모자이크를 만들 수 없습니다.');
      reduced.imageSmoothingEnabled = true; reduced.drawImage(source.img, r.x, r.y, r.width, r.height, 0, 0, small.width, small.height);
      context.clearRect(r.x, r.y, r.width, r.height); context.imageSmoothingEnabled = false; context.drawImage(small, 0, 0, small.width, small.height, r.x, r.y, r.width, r.height);

      const version = resultVersion, filename = source.file.name;
      $('image-submit').disabled = true; $('image-status').textContent = '사진을 변환하는 중입니다.';
      canvas.toBlob(blob => {
        if (version !== resultVersion) return; $('image-submit').disabled = false;
        if (!blob || blob.type !== 'image/png') { $('image-error').textContent = '저장할 PNG를 만들지 못했습니다.'; $('image-status').textContent = ''; return; }
        resultURL = URL.createObjectURL(blob); $('result-preview').src = resultURL; $('download-image').href = resultURL;
        $('download-image').download = (String(filename).replace(/\.[^.]*$/, '').replace(/[\\/:*?"<>|\u0000-\u001f]/g, '_').slice(0, 100) || 'image') + '-mosaic.png';
        $('result-info').textContent = width + ' × ' + height + 'px · PNG · ' + (blob.size / 1024).toLocaleString('ko-KR', { maximumFractionDigits: 1 }) + 'KB';
        $('image-result').hidden = false; $('image-status').textContent = '미리보기를 확인한 뒤 저장하세요.';
      }, 'image/png');
    } catch (error) { $('image-submit').disabled = false; $('image-error').textContent = error.message; }
  });
  $('image-example').addEventListener('click', () => {
    const version = ++loadVersion; clearSource(); $('image-file').value = '';
    const canvas = document.createElement('canvas'); canvas.width = 600; canvas.height = 400;
    const c = canvas.getContext('2d'); if (!c) { $('image-error').textContent = '예시를 만들 수 없습니다.'; return; }
    c.fillStyle = '#F4F0E6'; c.fillRect(0, 0, 600, 400);
    for (let y = 0; y < 400; y += 20) for (let x = 0; x < 600; x += 20) { c.fillStyle = (x / 20 + y / 20) % 2 ? '#16233D' : '#B23A2E'; c.fillRect(x, y, 18, 18); }
    $('image-status').textContent = '예시 사진을 만드는 중입니다.';
    canvas.toBlob(blob => { if (version !== loadVersion) return; if (!blob) { $('image-error').textContent = '예시 PNG를 만들지 못했습니다.'; $('image-status').textContent = ''; return; } loadFile(new File([blob], 'harukok-example.png', { type: 'image/png' }), version); }, 'image/png');
  });
  window.addEventListener('pagehide', () => { loadVersion++; clearSource(); $('image-file').value = ''; });
}
