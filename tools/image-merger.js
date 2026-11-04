'use strict';
function validateMergeFiles(files) {
  if (!Array.isArray(files) || files.length < 2 || files.length > 6) throw new Error('사진을 2장부터 6장까지 선택하세요.');
  let total = 0;
  for (const file of files) {
    if (!file || !Number.isFinite(file.size) || file.size <= 0 || file.size > 10 * 1024 * 1024) throw new Error('각 사진은 내용이 있는 10MB 이하 파일이어야 합니다.');
    const type = file.type || ({ jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp' }[String(file.name).split('.').pop().toLowerCase()]);
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(type)) throw new Error('JPG·PNG·WebP 사진만 사용할 수 있습니다.');
    total += file.size;
  }
  if (total > 30 * 1024 * 1024) throw new Error('선택한 사진의 전체 용량은 30MB 이하여야 합니다.');
}
function mergeLayout(dimensions, mode, cellSize) {
  if (!Array.isArray(dimensions) || dimensions.length < 2 || dimensions.length > 6) throw new Error('사진은 2~6장이 필요합니다.');
  for (const d of dimensions) if (!d || ![d.width, d.height].every(n => Number.isSafeInteger(n) && n > 0) || d.width * d.height > 12000000) throw new Error('각 원본은 최대 1,200만 화소까지 사용할 수 있습니다.');
  if (!['horizontal', 'vertical', 'grid'].includes(mode)) throw new Error('사진 배치를 선택하세요.');
  if (!Number.isInteger(cellSize) || cellSize < 100 || cellSize > 2000) throw new Error('한 칸 크기는 100~2000 사이 정수로 입력하세요.');
  const cols = mode === 'horizontal' ? dimensions.length : mode === 'vertical' ? 1 : 2;
  const rows = Math.ceil(dimensions.length / cols), rawWidth = cols * cellSize, rawHeight = rows * cellSize;
  const scale = Math.min(1, Math.sqrt(12000000 / (rawWidth * rawHeight)));
  const width = Math.max(1, Math.floor(rawWidth * scale)), height = Math.max(1, Math.floor(rawHeight * scale));
  const cw = width / cols, ch = height / rows;
  const tiles = dimensions.map((d, i) => { const fit = Math.min(cw / d.width, ch / d.height), w = d.width * fit, h = d.height * fit; return { x: (i % cols) * cw + (cw - w) / 2, y: Math.floor(i / cols) * ch + (ch - h) / 2, width: w, height: h }; });
  return { width, height, scaled: scale < 1, tiles };
}
if (typeof module !== 'undefined') module.exports = { validateMergeFiles, mergeLayout };
if (typeof document !== 'undefined') {
  const $ = id => document.getElementById(id);
  let sources = [], sourceURLs = [], resultURL = null, loadVersion = 0, resultVersion = 0;
  function clearResult() { resultVersion++; $('result').hidden = true; $('result-preview').removeAttribute('src'); $('download').removeAttribute('href'); if (resultURL) URL.revokeObjectURL(resultURL); resultURL = null; $('error').textContent = ''; $('status').textContent = ''; $('merge-submit').disabled = false; }
  function clearSources() { clearResult(); sources = []; for (const url of sourceURLs) URL.revokeObjectURL(url); sourceURLs = []; $('merge-controls').disabled = true; $('source-info').textContent = ''; }
  async function loadFiles(files, version) {
    if (version !== loadVersion) return;
    try {
      validateMergeFiles(files); $('status').textContent = '사진을 읽는 중입니다.';
      const images = await Promise.all(files.map(file => new Promise((resolve, reject) => {
        const img = new Image(), url = URL.createObjectURL(file); sourceURLs.push(url);
        img.onload = () => resolve({ img, file }); img.onerror = () => reject(new Error('읽지 못한 사진이 있습니다. 다른 파일을 선택하세요.')); img.src = url;
      })));
      if (version !== loadVersion) return;
      mergeLayout(images.map(s => ({ width: s.img.naturalWidth, height: s.img.naturalHeight })), 'grid', 600);
      sources = images; $('merge-controls').disabled = false;
      $('source-info').textContent = files.length + '장 선택: ' + files.map(f => f.name).join(', ');
      $('status').textContent = '배치와 칸 크기를 고른 뒤 사진 합치기를 누르세요.';
    } catch (error) { if (version !== loadVersion) return; clearSources(); $('error').textContent = error.message; }
  }
  $('merge-files').addEventListener('change', () => { const version = ++loadVersion; clearSources(); const files = Array.from($('merge-files').files); if (files.length) loadFiles(files, version); });
  for (const id of ['merge-mode', 'cell-size']) { $(id).addEventListener('input', clearResult); $(id).addEventListener('change', clearResult); }
  $('merge-form').addEventListener('submit', event => {
    event.preventDefault(); clearResult();
    if (sources.length < 2) { $('error').textContent = '먼저 사진을 2장 이상 선택하세요.'; return; }
    try {
      if (!$('cell-size').value.trim()) throw new Error('한 칸 크기를 입력하세요.');
      const layout = mergeLayout(sources.map(s => ({ width: s.img.naturalWidth, height: s.img.naturalHeight })), $('merge-mode').value, Number($('cell-size').value));
      const canvas = document.createElement('canvas'); canvas.width = layout.width; canvas.height = layout.height;
      const context = canvas.getContext('2d'); if (!context) throw new Error('이 브라우저에서 사진 처리를 시작할 수 없습니다.');
      sources.forEach((s, i) => { const t = layout.tiles[i]; context.drawImage(s.img, t.x, t.y, t.width, t.height); });
      const version = resultVersion; $('merge-submit').disabled = true; $('status').textContent = '사진을 합치는 중입니다.';
      canvas.toBlob(blob => {
        if (version !== resultVersion) return; $('merge-submit').disabled = false;
        if (!blob || blob.type !== 'image/png') { $('error').textContent = '저장할 PNG를 만들지 못했습니다. 칸 크기를 줄여 다시 시도하세요.'; $('status').textContent = ''; return; }
        resultURL = URL.createObjectURL(blob); $('result-preview').src = resultURL; $('download').href = resultURL; $('download').download = 'harukok-merged.png';
        $('result-info').textContent = `${layout.width} × ${layout.height}px · PNG` + (layout.scaled ? ' · 1,200만 화소 이하로 자동 축소했습니다.' : ''); $('result').hidden = false; $('status').textContent = '미리보기를 확인한 뒤 저장하세요.';
      }, 'image/png');
    } catch (error) { $('merge-submit').disabled = false; $('error').textContent = error.message; }
  });
  $('merge-example')?.addEventListener('click', () => {
    const version = ++loadVersion; clearSources(); $('merge-files').value = ''; $('status').textContent = '예시 사진을 만드는 중입니다.';
    Promise.all([0, 1].map(index => new Promise((resolve, reject) => { const canvas = document.createElement('canvas'); canvas.width = index ? 240 : 360; canvas.height = index ? 360 : 240; const c = canvas.getContext('2d'); if (!c) { reject(new Error('예시를 만들 수 없습니다.')); return; } c.fillStyle = index ? '#B23A2E' : '#16233D'; c.fillRect(0, 0, canvas.width, canvas.height); c.fillStyle = '#FFFDF8'; c.fillRect(25, 25, 90, 70); canvas.toBlob(blob => blob ? resolve(new File([blob], 'example-' + (index + 1) + '.png', { type: 'image/png' })) : reject(new Error('예시 PNG를 만들지 못했습니다.')), 'image/png'); }))).then(files => loadFiles(files, version)).catch(error => { if (version === loadVersion) { $('error').textContent = error.message; $('status').textContent = ''; } });
  });
  window.addEventListener('pagehide', () => { loadVersion++; clearSources(); $('merge-files').value = ''; });
}
