'use strict';
function aspectRatio(width, height, axis, target) {
  if (![width, height, target].every(value => Number.isSafeInteger(value) && value > 0 && value <= 100000)) throw new Error('크기는 1부터 100,000 사이의 정수로 입력해 주세요.');
  if (!['width', 'height'].includes(axis)) throw new Error('기준 크기를 선택해 주세요.');
  let a = width, b = height;
  while (b) { const next = a % b; a = b; b = next; }
  const exact = axis === 'width' ? target * height / width : target * width / height;
  const rounded = Math.max(1, Math.round(exact));
  return { ratio: `${width / a}:${height / a}`, width: axis === 'width' ? target : rounded,
    height: axis === 'height' ? target : rounded, rounded: exact !== rounded, exact };
}
if (typeof module !== 'undefined') module.exports = { aspectRatio };
if (typeof document !== 'undefined') {
  const $ = id => document.getElementById(id);
  let version = 0;
  function clear() { version++; $('ratio-result').hidden = true; $('ratio-output').value = ''; $('ratio-error').textContent = ''; $('copy-status').textContent = ''; }
  $('ratio-form').addEventListener('input', clear);
  $('ratio-form').addEventListener('change', clear);
  $('ratio-form').addEventListener('submit', event => {
    event.preventDefault(); clear();
    try {
      if (['source-width', 'source-height', 'target-size'].some(id => !$(id).value.trim())) throw new Error('가로·세로와 바꿀 크기를 모두 입력해 주세요.');
      const result = aspectRatio(Number($('source-width').value), Number($('source-height').value), $('target-axis').value, Number($('target-size').value));
      $('ratio-value').textContent = result.ratio;
      $('ratio-output').value = `${result.ratio} · ${result.width} × ${result.height}px`;
      $('rounding-note').textContent = result.rounded ? '나머지 크기는 가장 가까운 정수로 반올림했습니다. 계산값이 1px 미만이면 1px로 표시하므로 원래 비율과 조금 다를 수 있습니다.' : '정수 픽셀 크기로 원래 비율이 유지됩니다.';
      $('ratio-result').hidden = false;
    } catch (error) { $('ratio-error').textContent = error.message; }
  });
  $('ratio-example').addEventListener('click', () => { $('source-width').value = '1920'; $('source-height').value = '1080'; $('target-axis').value = 'width'; $('target-size').value = '1280'; $('ratio-form').requestSubmit(); });
  $('copy-ratio').addEventListener('click', async () => {
    if ($('ratio-result').hidden) return;
    const current = version;
    try { await navigator.clipboard.writeText($('ratio-output').value); if (version === current) $('copy-status').textContent = '결과를 복사했습니다.'; }
    catch { if (version !== current) return; $('copy-status').textContent = '결과 칸의 글을 선택해 직접 복사해 주세요.'; $('ratio-output').focus(); $('ratio-output').select(); }
  });
}
