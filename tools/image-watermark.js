'use strict';

function validateEditFile(file) {
  if (!file || !Number.isFinite(file.size) || file.size <= 0 || file.size > 10 * 1024 * 1024) throw new Error('내용이 있는 10MB 이하 사진을 선택하세요.');
  const type = file.type || ({ jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp' }[String(file.name).split('.').pop().toLowerCase()]);
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(type)) throw new Error('JPG·PNG·WebP 사진만 사용할 수 있습니다.');
}
function editImageSize(width, height) {
  if (![width, height].every(n => Number.isSafeInteger(n) && n > 0) || width * height > 12000000) throw new Error('원본은 최대 1,200만 화소까지 사용할 수 있습니다.');
}

function watermarkSettings(width, height, text, percent, opacity, color) {
  editImageSize(width, height);
  if (typeof text !== 'string' || !text.trim() || text.length > 120 || Array.from(text).length > 60 || /[\r\n]/.test(text)) throw new Error('워터마크 글자를 한 줄로 1~60자 입력하세요.');
  if (!Number.isFinite(percent) || percent < 0.5 || percent > 20) throw new Error('글자 크기는 사진 가로의 0.5~20%로 입력하세요.');
  if (!Number.isFinite(opacity) || opacity < 1 || opacity > 100) throw new Error('불투명도는 1~100 사이로 입력하세요.');
  if (!['#000000', '#FFFFFF'].includes(color)) throw new Error('검정 또는 흰색 글자를 선택하세요.');
  return { text, fontSize: Math.max(1, Math.round(width * percent / 100)), opacity: opacity / 100, color };
}
function watermarkPlacement(width, height, textWidth, fontSize, position) {
  editImageSize(width, height);
  if (!['top-left', 'top-right', 'bottom-left', 'bottom-right', 'center'].includes(position)) throw new Error('글자를 놓을 위치를 선택하세요.');
  const margin = Math.max(1, Math.round(Math.min(width, height) * 0.03)), lineHeight = fontSize * 1.2;
  if (!Number.isFinite(textWidth) || textWidth <= 0 || textWidth > width - 2 * margin || lineHeight > height - 2 * margin) throw new Error('글자가 사진 밖으로 나갑니다. 글자를 줄이거나 글자 크기를 낮추세요.');
  return { x: position === 'center' ? (width - textWidth) / 2 : position.endsWith('right') ? width - margin - textWidth : margin,
    y: position === 'center' ? (height - lineHeight) / 2 : position.startsWith('bottom') ? height - margin - lineHeight : margin };
}
if (typeof module !== 'undefined') module.exports = { validateEditFile, editImageSize, watermarkSettings, watermarkPlacement };

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
      try { editImageSize(img.naturalWidth, img.naturalHeight); source = { img, file }; $('source-preview').src = url; $('source-figure').hidden = false; $('source-info').textContent = '원본 ' + img.naturalWidth + ' × ' + img.naturalHeight + 'px';  $('image-controls').disabled = false; $('image-status').textContent = '설정을 고르고 사진 변환하기를 누르세요.'; }
      catch (error) { clearSource(); $('image-error').textContent = error.message; }
    };
    img.onerror = () => { if (version !== loadVersion) return; clearSource(); $('image-error').textContent = '사진을 읽지 못했습니다. 다른 파일을 선택하세요.'; };
    img.src = url;
  }
  $('image-file').addEventListener('change', () => { const version = ++loadVersion; clearSource(); const file = $('image-file').files[0]; if (file) loadFile(file, version); });
  for (const id of ["watermark-text","font-percent","opacity","text-color","text-position"]) { $(id).addEventListener('input', clearResult); $(id).addEventListener('change', clearResult); }
  $('image-form').addEventListener('submit', event => {
    event.preventDefault(); clearResult(); if (!source) { $('image-error').textContent = '먼저 사진을 선택하세요.'; return; }
    try {
      const width = source.img.naturalWidth, height = source.img.naturalHeight;
      const canvas = document.createElement('canvas'); canvas.width = width; canvas.height = height;
      const context = canvas.getContext('2d'); if (!context) throw new Error('사진 처리를 시작할 수 없습니다.');
      context.drawImage(source.img, 0, 0);
      if (['font-percent', 'opacity'].some(id => !$(id).value.trim())) throw new Error('글자 크기와 불투명도를 입력하세요.');
      const settings = watermarkSettings(width, height, $('watermark-text').value, Number($('font-percent').value), Number($('opacity').value), $('text-color').value);
      context.font = '700 ' + settings.fontSize + 'px sans-serif'; context.textBaseline = 'top';
      const position = watermarkPlacement(width, height, context.measureText(settings.text).width, settings.fontSize, $('text-position').value);
      context.globalAlpha = settings.opacity; context.fillStyle = settings.color; context.fillText(settings.text, position.x, position.y);

      const version = resultVersion, filename = source.file.name;
      $('image-submit').disabled = true; $('image-status').textContent = '사진을 변환하는 중입니다.';
      canvas.toBlob(blob => {
        if (version !== resultVersion) return; $('image-submit').disabled = false;
        if (!blob || blob.type !== 'image/png') { $('image-error').textContent = '저장할 PNG를 만들지 못했습니다.'; $('image-status').textContent = ''; return; }
        resultURL = URL.createObjectURL(blob); $('result-preview').src = resultURL; $('download-image').href = resultURL;
        $('download-image').download = (String(filename).replace(/\.[^.]*$/, '').replace(/[\\/:*?"<>|\u0000-\u001f]/g, '_').slice(0, 100) || 'image') + '-watermark.png';
        $('result-info').textContent = width + ' × ' + height + 'px · PNG · ' + (blob.size / 1024).toLocaleString('ko-KR', { maximumFractionDigits: 1 }) + 'KB';
        $('image-result').hidden = false; $('image-status').textContent = '미리보기를 확인한 뒤 저장하세요.';
      }, 'image/png');
    } catch (error) { $('image-submit').disabled = false; $('image-error').textContent = error.message; }
  });
  $('image-example')?.addEventListener('click', () => {
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
