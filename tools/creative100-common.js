'use strict';
var Creative100 = (() => {
  const PIXELS = 12000000;
  function number(value, min, max, label, integer = false) {
    if (typeof value === 'string' && !value.trim()) throw new Error(label + '을 입력하세요.');
    const n = Number(value);
    if (!Number.isFinite(n) || n < min || n > max || (integer && !Number.isInteger(n))) throw new Error(label + ': ' + min + '~' + max + (integer ? ' 정수' : '') + '를 입력하세요.');
    return n;
  }
  function hex(value) {
    let s = String(value).trim();
    if (!/^#(?:[a-f\d]{3}|[a-f\d]{6})$/i.test(s)) throw new Error('색상은 #RGB 또는 #RRGGBB로 입력하세요.');
    if (s.length === 4) s = '#' + [...s.slice(1)].map(c => c + c).join('');
    return s.toUpperCase();
  }
  function dimensions(width, height, maxPixels = PIXELS) {
    if (![width, height].every(n => Number.isSafeInteger(n) && n > 0 && n <= 16384) || width * height > maxPixels) throw new Error('사진 크기는 최대 ' + (maxPixels / 1000000) + '백만 화소, 한 변 16,384px입니다.');
    return { width, height };
  }
  function fileType(file, maxBytes = 10 * 1024 * 1024, svg = false) {
    if (!file || !Number.isFinite(file.size) || file.size <= 0 || file.size > maxBytes) throw new Error('내용이 있는 ' + (maxBytes / 1024 / 1024) + 'MB 이하 파일을 선택하세요.');
    const extension = String(file.name).split('.').pop().toLowerCase();
    const type = file.type || ({ jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp', svg: 'image/svg+xml' }[extension]);
    if (!(svg ? type === 'image/svg+xml' && extension === 'svg' : ['image/jpeg', 'image/png', 'image/webp'].includes(type))) throw new Error(svg ? 'SVG 파일만 선택하세요.' : 'JPG·PNG·WebP 사진만 선택하세요.');
    return type;
  }
  function copyButton(textId, buttonId, statusId, current) {
    const text = document.getElementById(textId), button = document.getElementById(buttonId), status = document.getElementById(statusId);
    button.addEventListener('click', async () => {
      const value = text.value, token = current();
      if (!value) return;
      try { if (!navigator.clipboard || !navigator.clipboard.writeText) throw new Error('unavailable'); await navigator.clipboard.writeText(value); if (token === current()) status.textContent = '복사했습니다.'; }
      catch (_) { if (token !== current()) return; text.focus(); text.select(); status.textContent = '복사할 글을 선택했습니다. 직접 복사하세요.'; }
    });
  }
  function textTool(ids, calculate) {
    const $ = id => document.getElementById(id); let version = 0;
    const clear = () => { version++; $('result').hidden = true; $('result-text').value = ''; $('error').textContent = ''; $('copy-status').textContent = ''; };
    for (const id of ids) { $(id).addEventListener('input', clear); $(id).addEventListener('change', clear); }
    $('calculator').addEventListener('submit', event => { event.preventDefault(); clear(); try { const values = Object.fromEntries(ids.map(id => [id, $(id).value])); const result = calculate(values, $); $('result-text').value = result.text; $('result-value').textContent = result.summary; $('result').hidden = false; } catch (error) { $('error').textContent = error.message; } });
    copyButton('result-text', 'copy', 'copy-status', () => version);
    window.addEventListener('pagehide', clear);
  }
  function imageTool(config) {
    const $ = id => document.getElementById(id);
    let source = null, sourceURL = null, resultURL = null, loadingImage = null, loadVersion = 0, resultVersion = 0;
    const clearResult = () => { resultVersion++; $('image-result').hidden = true; $('result-preview').removeAttribute('src'); $('download-image').removeAttribute('href'); if ($('result-text')) $('result-text').value = ''; if ($('copy-status')) $('copy-status').textContent = ''; if (resultURL) URL.revokeObjectURL(resultURL); resultURL = null; $('image-error').textContent = ''; $('image-status').textContent = ''; $('image-submit').disabled = false; };
    const clearSource = () => { clearResult(); source = null; if (loadingImage) { loadingImage.src = ''; loadingImage = null; } $('source-preview').removeAttribute('src'); $('source-figure').hidden = true; if (sourceURL) URL.revokeObjectURL(sourceURL); sourceURL = null; $('image-controls').disabled = true; };
    $('image-file').addEventListener('change', async () => {
      const version = ++loadVersion; clearSource(); const file = $('image-file').files[0]; if (!file) return;
      try {
        const mime = fileType(file, config.maxBytes, config.svg); $('image-status').textContent = '파일을 읽는 중입니다.';
        const prepared = config.prepare ? await config.prepare(file) : file;
        if (version !== loadVersion) return;
        const img = new Image(), url = URL.createObjectURL(prepared); sourceURL = url; loadingImage = img;
        if (typeof img.decode === 'function') { img.src = url; await img.decode(); }
        else { if (config.svg) throw new Error('이 브라우저는 SVG 변환을 지원하지 않습니다.'); await new Promise((resolve, reject) => { img.onload = resolve; img.onerror = () => reject(new Error('사진을 읽지 못했습니다.')); img.src = url; }); }
        if (version !== loadVersion) return;
        dimensions(img.naturalWidth, img.naturalHeight, config.maxPixels); loadingImage = null;
        source = { img, file, mime, width: img.naturalWidth, height: img.naturalHeight };
        $('source-preview').src = url; $('source-figure').hidden = false; $('source-info').textContent = source.width + ' × ' + source.height + 'px'; $('image-controls').disabled = false; $('image-status').textContent = '';
      } catch (error) { if (version !== loadVersion) return; clearSource(); $('image-error').textContent = error.message || '파일을 읽지 못했습니다.'; }
    });
    for (const id of config.ids || []) { $(id).addEventListener('input', clearResult); $(id).addEventListener('change', clearResult); }
    $('image-form').addEventListener('submit', async event => {
      event.preventDefault(); clearResult(); if (!source) { $('image-error').textContent = '먼저 파일을 선택하세요.'; return; }
      const version = resultVersion, item = source;
      try {
        $('image-submit').disabled = true; $('image-status').textContent = '변환하는 중입니다.';
        const values = Object.fromEntries((config.ids || []).map(id => [id, $(id).value]));
        const output = await config.render(item, values);
        if (version !== resultVersion) return;
        if (output.text !== undefined) {
          $('result-text').value = output.text; $('result-info').textContent = output.info; $('download-image').hidden = true; $('result-preview').hidden = true;
        } else {
          dimensions(output.canvas.width, output.canvas.height);
          const blob = await new Promise(resolve => output.canvas.toBlob(resolve, 'image/png'));
          if (version !== resultVersion) return;
          if (!blob || blob.type !== 'image/png') throw new Error('PNG를 만들지 못했습니다. 다시 시도하세요.');
          resultURL = URL.createObjectURL(blob); $('result-preview').src = resultURL; $('download-image').href = resultURL;
          const base = String(item.file.name).replace(/\.[^.]*$/, '').replace(/[\\/:*?"<>|\u0000-\u001f]/g, '_').slice(0, 80) || 'image';
          $('download-image').download = base + '-' + config.suffix + '.png';
          $('result-info').textContent = output.canvas.width + ' × ' + output.canvas.height + 'px · PNG' + (output.info ? ' · ' + output.info : '');
        }
        $('image-result').hidden = false; $('image-status').textContent = ''; $('image-submit').disabled = false;
      } catch (error) { if (version !== resultVersion) return; $('image-submit').disabled = false; $('image-status').textContent = ''; $('image-error').textContent = error.message || '변환하지 못했습니다.'; }
    });
    if (config.text) copyButton('result-text', 'copy', 'copy-status', () => resultVersion);
    window.addEventListener('pagehide', () => { loadVersion++; clearSource(); $('image-file').value = ''; });
  }
  function canvas(width, height) { dimensions(width, height); const canvas = document.createElement('canvas'); canvas.width = width; canvas.height = height; const context = canvas.getContext('2d'); if (!context) throw new Error('사진 처리를 시작할 수 없습니다.'); return { canvas, context }; }
  return { number, hex, dimensions, fileType, textTool, imageTool, canvas };
})();
if (typeof module !== 'undefined') module.exports = Creative100;
