'use strict';
function contrastHex(value) {
  let hex = String(value).trim().replace(/^#/, '');
  if (!/^(?:[0-9a-f]{3}|[0-9a-f]{6})$/i.test(hex)) throw new Error('색상은 #RGB 또는 #RRGGBB 형식으로 입력하세요.');
  if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
  return '#' + hex.toUpperCase();
}
function relativeLuminance(hex) {
  const rgb = contrastHex(hex).slice(1).match(/../g).map(c => parseInt(c, 16) / 255);
  const linear = rgb.map(v => v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
  return linear[0] * 0.2126 + linear[1] * 0.7152 + linear[2] * 0.0722;
}
function checkContrast(foreground, background) {
  const foregroundHex = contrastHex(foreground), backgroundHex = contrastHex(background);
  const a = relativeLuminance(foregroundHex), b = relativeLuminance(backgroundHex);
  const ratio = (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
  return { foreground: foregroundHex, background: backgroundHex, ratio,
    normalAA: ratio >= 4.5, largeAA: ratio >= 3, normalAAA: ratio >= 7, largeAAA: ratio >= 4.5 };
}
if (typeof module !== 'undefined') module.exports = { contrastHex, relativeLuminance, checkContrast };
if (typeof document !== 'undefined') {
  const $ = id => document.getElementById(id); let version = 0;
  function clear() { version++; $('result').hidden = true; $('result-text').value = ''; $('error').textContent = ''; $('copy-status').textContent = ''; }
  $('calculator').addEventListener('input', clear); $('calculator').addEventListener('change', clear);
  $('calculator').addEventListener('submit', event => {
    event.preventDefault(); clear();
    try {
      const r = checkContrast($('foreground').value, $('background').value), verdict = v => v ? '통과' : '미달';
      $('result-value').textContent = r.ratio.toFixed(2) + ':1';
      $('result-text').value = `대비 ${r.ratio.toFixed(2)}:1\n일반 글자 AA: ${verdict(r.normalAA)} / AAA: ${verdict(r.normalAAA)}\n큰 글자 AA: ${verdict(r.largeAA)} / AAA: ${verdict(r.largeAAA)}`;
      $('contrast-preview').style.color = r.foreground; $('contrast-preview').style.backgroundColor = r.background;
      $('result').hidden = false; $('result').scrollIntoView({ block: 'nearest' });
    } catch (error) { $('error').textContent = error.message; }
  });
  $('example')?.addEventListener('click', () => { $('foreground').value = '#16233D'; $('background').value = '#F4F0E6'; $('calculator').requestSubmit(); });
  $('copy').addEventListener('click', async () => { const token = version; if ($('result').hidden) return; try { await navigator.clipboard.writeText($('result-text').value); if (token === version) $('copy-status').textContent = '결과를 복사했습니다.'; } catch { if (token !== version) return; $('copy-status').textContent = '결과 칸에서 글을 선택해 직접 복사하세요.'; $('result-text').focus(); $('result-text').select(); } });
}
