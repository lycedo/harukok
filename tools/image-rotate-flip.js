'use strict';
function validateRotateFile(file) {
  if (!file || !Number.isFinite(file.size) || file.size <= 0) throw new Error('내용이 있는 사진 파일을 선택해 주세요.');
  if (file.size > 10 * 1024 * 1024) throw new Error('파일 크기는 10MB 이하여야 합니다.');
  const type = file.type || ({ jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp' }[String(file.name).split('.').pop().toLowerCase()]);
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(type)) throw new Error('JPG·PNG·WebP 사진을 선택해 주세요.');
}
function rotationTransform(width, height, degrees, flipX = false, flipY = false) {
  if (![width, height].every(value => Number.isSafeInteger(value) && value > 0) || width * height > 12000000) throw new Error('원본은 최대 1,200만 화소까지만 사용할 수 있습니다.');
  if (![0, 90, 180, 270].includes(degrees)) throw new Error('회전 방향을 선택해 주세요.');
  const quarter = degrees / 90;
  const cos = [1, 0, -1, 0][quarter], sin = [0, 1, 0, -1][quarter];
  const outputWidth = quarter % 2 ? height : width, outputHeight = quarter % 2 ? width : height;
  const sx = flipX ? -1 : 1, sy = flipY ? -1 : 1;
  const a = sx * cos, b = sy * sin, c = -sx * sin, d = sy * cos;
  const e = outputWidth / 2 - a * width / 2 - c * height / 2;
  const f = outputHeight / 2 - b * width / 2 - d * height / 2;
  return { width: outputWidth, height: outputHeight, matrix: [a, b, c, d, e, f].map(value => value === 0 ? 0 : value) };
}
function rotatedFileName(name) {
  const stem = String(name).replace(/\.[^.]*$/, '').replace(/[\\/:*?"<>|\u0000-\u001f]/g, '_').slice(0, 100) || 'image';
  return stem + '-rotated.png';
}
if (typeof module !== 'undefined') module.exports = { validateRotateFile, rotationTransform, rotatedFileName };
if (typeof document !== 'undefined') {
  const $ = id => document.getElementById(id);
  let source = null, sourceURL = null, resultURL = null, loadVersion = 0, resultVersion = 0;
  function clearResult() {
    resultVersion++;
    $('rotate-result').hidden = true;
    $('rotate-preview').removeAttribute('src');
    $('download-rotated').removeAttribute('href');
    if (resultURL) URL.revokeObjectURL(resultURL);
    resultURL = null;
    $('rotate-submit').disabled = false;
    $('rotate-error').textContent = '';
    $('rotate-status').textContent = '';
  }
  function clearSource() {
    clearResult(); source = null;
    $('source-preview').removeAttribute('src'); $('source-figure').hidden = true;
    if (sourceURL) URL.revokeObjectURL(sourceURL);
    sourceURL = null;
    $('rotate-controls').disabled = true;
  }
  function loadFile(file, version) {
    if (version !== loadVersion) return;
    try { validateRotateFile(file); } catch (error) { $('rotate-error').textContent = error.message; return; }
    const img = new Image(), url = URL.createObjectURL(file);
    sourceURL = url;
    $('rotate-status').textContent = '사진을 읽는 중입니다.';
    img.onload = () => {
      if (version !== loadVersion) return;
      try {
        rotationTransform(img.naturalWidth, img.naturalHeight, 0);
        source = { img, file };
        $('source-preview').src = url; $('source-figure').hidden = false;
        $('source-info').textContent = `원본 ${img.naturalWidth.toLocaleString('ko-KR')} × ${img.naturalHeight.toLocaleString('ko-KR')}px`;
        $('rotate-controls').disabled = false;
        $('rotate-status').textContent = '회전과 뒤집기를 고르고 사진 변환하기를 누르세요.';
      } catch (error) { clearSource(); $('rotate-error').textContent = error.message; }
    };
    img.onerror = () => { if (version !== loadVersion) return; clearSource(); $('rotate-error').textContent = '사진을 읽지 못했습니다. 다른 JPG·PNG·WebP 파일을 선택해 주세요.'; };
    img.src = url;
  }
  $('rotate-file').addEventListener('change', () => {
    const version = ++loadVersion; clearSource();
    const file = $('rotate-file').files[0];
    if (file) loadFile(file, version);
  });
  for (const id of ['rotation', 'flip-horizontal', 'flip-vertical']) {
    $(id).addEventListener('change', () => { clearResult(); if (source) $('rotate-status').textContent = '설정이 바뀌었습니다. 사진 변환하기를 다시 누르세요.'; });
  }
  $('rotate-form').addEventListener('submit', event => {
    event.preventDefault(); clearResult();
    if (!source) { $('rotate-error').textContent = '먼저 사진을 선택해 주세요.'; return; }
    try {
      const { width, height, matrix } = rotationTransform(source.img.naturalWidth, source.img.naturalHeight, Number($('rotation').value), $('flip-horizontal').checked, $('flip-vertical').checked);
      const canvas = document.createElement('canvas'); canvas.width = width; canvas.height = height;
      const context = canvas.getContext('2d');
      if (!context) throw new Error('이 브라우저에서 사진 처리를 시작할 수 없습니다.');
      context.setTransform(...matrix); context.drawImage(source.img, 0, 0);
      const version = resultVersion, file = source.file;
      $('rotate-submit').disabled = true; $('rotate-status').textContent = '사진을 변환하는 중입니다.';
      canvas.toBlob(blob => {
        if (version !== resultVersion) return;
        $('rotate-submit').disabled = false;
        if (!blob || blob.type !== 'image/png') { $('rotate-error').textContent = '사진 저장 파일을 만들지 못했습니다. 다시 시도해 주세요.'; $('rotate-status').textContent = ''; return; }
        resultURL = URL.createObjectURL(blob);
        $('rotate-preview').src = resultURL;
        $('rotate-info').textContent = `${width.toLocaleString('ko-KR')} × ${height.toLocaleString('ko-KR')}px · PNG · ${(blob.size / 1024).toLocaleString('ko-KR', { maximumFractionDigits: 1 })}KB`;
        $('download-rotated').href = resultURL; $('download-rotated').download = rotatedFileName(file.name);
        $('rotate-result').hidden = false;
        $('rotate-status').textContent = '완료했습니다. 결과를 확인하고 저장하세요.';
      }, 'image/png');
    } catch (error) { $('rotate-submit').disabled = false; $('rotate-error').textContent = error.message; $('rotate-status').textContent = ''; }
  });
  $('rotate-example').addEventListener('click', () => {
    const version = ++loadVersion; clearSource(); $('rotate-file').value = '';
    const canvas = document.createElement('canvas'); canvas.width = 360; canvas.height = 240;
    const context = canvas.getContext('2d');
    if (!context) { $('rotate-error').textContent = '이 브라우저에서 예시 사진을 만들지 못했습니다.'; return; }
    context.fillStyle = '#F4F0E6'; context.fillRect(0, 0, 360, 240);
    context.fillStyle = '#16233D'; context.fillRect(20, 20, 120, 120);
    context.fillStyle = '#B23A2E'; context.fillRect(220, 160, 120, 60);
    context.fillStyle = '#16233D'; context.font = '24px sans-serif'; context.fillText('TOP LEFT', 20, 180);
    $('rotate-status').textContent = '예시 사진을 만드는 중입니다.';
    canvas.toBlob(blob => {
      if (version !== loadVersion) return;
      if (!blob) { $('rotate-error').textContent = '예시 사진을 만들지 못했습니다.'; $('rotate-status').textContent = ''; return; }
      loadFile(new File([blob], 'harukok-example.png', { type: 'image/png' }), version);
    }, 'image/png');
  });
  window.addEventListener('pagehide', () => { loadVersion++; clearSource(); $('rotate-file').value = ''; });
}
