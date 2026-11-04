'use strict';
function gradientHex(value) { let h = String(value).trim().replace(/^#/, ''); if (!/^(?:[\da-f]{3}|[\da-f]{6})$/i.test(h)) throw new Error('색상은 #RGB 또는 #RRGGBB로 입력하세요.'); if (h.length === 3) h = h.split('').map(c => c + c).join(''); return '#' + h.toUpperCase(); }
function makeGradient(first, second, angle) {
  if (typeof angle === 'string' && !angle.trim()) throw new Error('각도를 입력하세요.');
  const degrees = Number(angle); if (!Number.isFinite(degrees) || degrees < 0 || degrees > 360) throw new Error('각도는 0부터 360 사이로 입력하세요.');
  const a = gradientHex(first), b = gradientHex(second);
  return { first: a, second: b, angle: degrees, value: `linear-gradient(${degrees}deg, ${a} 0%, ${b} 100%)`, css: `background: linear-gradient(${degrees}deg, ${a} 0%, ${b} 100%);` };
}
if (typeof module !== 'undefined') module.exports = { gradientHex, makeGradient };
if (typeof document !== 'undefined') {
  const $ = id => document.getElementById(id); let version = 0;
  function clear() { version++; $('result').hidden = true; $('result-text').value = ''; $('error').textContent = ''; $('copy-status').textContent = ''; }
  $('calculator').addEventListener('input', clear); $('calculator').addEventListener('change', clear);
  $('calculator').addEventListener('submit', event => { event.preventDefault(); clear(); try { const r = makeGradient($('first-color').value, $('second-color').value, $('angle').value); $('gradient-preview').style.background = r.value; $('result-text').value = r.css; $('result').hidden = false; $('result').scrollIntoView({ block: 'nearest' }); } catch (error) { $('error').textContent = error.message; } });
  $('example')?.addEventListener('click', () => { $('first-color').value = '#16233D'; $('second-color').value = '#B23A2E'; $('angle').value = '90'; $('calculator').requestSubmit(); });
  $('copy').addEventListener('click', async () => { const token = version; if ($('result').hidden) return; try { await navigator.clipboard.writeText($('result-text').value); if (token === version) $('copy-status').textContent = 'CSS 코드를 복사했습니다.'; } catch { if (token !== version) return; $('copy-status').textContent = '결과 칸에서 CSS를 선택해 직접 복사하세요.'; $('result-text').focus(); $('result-text').select(); } });
}
