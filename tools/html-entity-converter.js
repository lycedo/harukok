'use strict';
function convertHtmlEntities(text, mode) {
  if (typeof text !== 'string' || !text.length || text.length > 200000) throw new Error('1~200,000자까지 입력하세요.');
  const entities = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
  if (mode === 'encode') return text.replace(/[&<>"']/g, char => entities[char]);
  if (mode !== 'decode') throw new Error('변환 방향을 고르세요.');
  const names = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'" };
  return text.replace(/&(#(?:[xX][\da-fA-F]+|\d+)|amp|lt|gt|quot|apos);/g, (_, entity) => {
    if (entity[0] !== '#') return names[entity];
    const n = /^[xX]/.test(entity.slice(1)) ? Number.parseInt(entity.slice(2), 16) : Number(entity.slice(1));
    if (!Number.isInteger(n) || n < 0 || n > 0x10ffff || (n >= 0xd800 && n <= 0xdfff)) throw new Error('숫자 엔티티의 유니코드 값이 올바르지 않습니다.');
    return String.fromCodePoint(n);
  });
}
if (typeof module !== 'undefined') module.exports = { convertHtmlEntities };

if (typeof document !== 'undefined') {
  const $ = id => document.getElementById(id); let version = 0;
  function clear() { version++; $('result').hidden = true; $('output').value = ''; $('summary').textContent = ''; $('error').textContent = ''; $('copy-status').textContent = ''; $('run').disabled = false; }
  $('converter').addEventListener('input', clear); $('converter').addEventListener('change', clear);
  function updatePlaceholder() { $('source').placeholder = $('mode').value === 'decode' ? '&lt;p&gt;하루콕 &amp; 예시&lt;/p&gt;' : '<p>하루콕 & 예시</p>'; }
  $('mode').addEventListener('change', updatePlaceholder); updatePlaceholder();
  async function runFromInputs() { return {text:convertHtmlEntities($('source').value,$('mode').value)}; }
  $('converter').addEventListener('submit', async event => { event.preventDefault(); clear(); const token = version; $('run').disabled = true; try { const r = await runFromInputs(); if (token !== version) return; $('output').value = r.text; $('summary').textContent = r.summary || ''; $('result').hidden = false; $('result').scrollIntoView({block:'nearest'}); } catch (error) { if (token === version) $('error').textContent = error.message; } finally { if (token === version) $('run').disabled = false; } });
  $('copy').addEventListener('click', async () => { if ($('result').hidden) return; const token = version; try { await navigator.clipboard.writeText($('output').value); if (token === version) $('copy-status').textContent = '복사했습니다.'; } catch { if (token !== version) return; $('output').focus(); $('output').select(); $('copy-status').textContent = '결과를 선택해 복사하세요.'; } });
}
