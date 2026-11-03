'use strict';
const A_PAPER_SIZES = Object.freeze({ A0: [841, 1189], A1: [594, 841], A2: [420, 594], A3: [297, 420], A4: [210, 297], A5: [148, 210], A6: [105, 148] });
function paperSize(name, dpi, orientation) {
  if (!Object.hasOwn(A_PAPER_SIZES, name)) throw new Error('A0부터 A6 중 용지를 선택하세요.');
  const resolution = Number(dpi); if (!Number.isInteger(resolution) || resolution < 72 || resolution > 1200) throw new Error('해상도는 72~1200 사이의 정수로 입력하세요.');
  if (!['portrait', 'landscape'].includes(orientation)) throw new Error('세로 또는 가로 방향을 고르세요.');
  const size = A_PAPER_SIZES[name], width = size[orientation === 'portrait' ? 0 : 1], height = size[orientation === 'portrait' ? 1 : 0];
  return { width, height, dpi: resolution, pixelWidth: Math.round(width / 25.4 * resolution), pixelHeight: Math.round(height / 25.4 * resolution), inchWidth: width / 25.4, inchHeight: height / 25.4 };
}
if (typeof module !== 'undefined') module.exports = { A_PAPER_SIZES, paperSize };
if (typeof document !== 'undefined') {
  const $ = id => document.getElementById(id); let version = 0;
  function clear() { version++; $('result').hidden = true; $('result-text').value = ''; $('error').textContent = ''; $('copy-status').textContent = ''; }
  $('calculator').addEventListener('input', clear); $('calculator').addEventListener('change', clear);
  $('calculator').addEventListener('submit', event => { event.preventDefault(); clear(); try { const r = paperSize($('paper').value, $('dpi').value, $('orientation').value), fmt = n => n.toLocaleString('ko-KR', { maximumFractionDigits: 4 }); $('result-value').textContent = `${r.pixelWidth.toLocaleString('ko-KR')} × ${r.pixelHeight.toLocaleString('ko-KR')}px`; $('result-text').value = `${$('paper').value} · ${r.dpi} DPI\n${r.width} × ${r.height}mm\n${fmt(r.width / 10)} × ${fmt(r.height / 10)}cm\n${fmt(r.inchWidth)} × ${fmt(r.inchHeight)}in\n${r.pixelWidth} × ${r.pixelHeight}px`; $('result').hidden = false; $('result').scrollIntoView({ block: 'nearest' }); } catch (error) { $('error').textContent = error.message; } });
  $('example').addEventListener('click', () => { $('paper').value = 'A4'; $('dpi').value = '300'; $('orientation').value = 'portrait'; $('calculator').requestSubmit(); });
  $('copy').addEventListener('click', async () => { const token = version; if ($('result').hidden) return; try { await navigator.clipboard.writeText($('result-text').value); if (token === version) $('copy-status').textContent = '용지 크기를 복사했습니다.'; } catch { if (token !== version) return; $('copy-status').textContent = '결과 칸에서 글을 선택해 직접 복사하세요.'; $('result-text').focus(); $('result-text').select(); } });
}
