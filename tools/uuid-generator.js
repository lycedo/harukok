'use strict';
function generateUUIDs(count, secureCrypto = globalThis.crypto) {
  if (!Number.isInteger(count) || count < 1 || count > 100) throw new Error('만들 개수를 1~100 사이의 정수로 입력하세요.');
  if (!secureCrypto || typeof secureCrypto.getRandomValues !== 'function') throw new Error('이 브라우저에서 안전한 난수를 만들 수 없습니다. 최신 브라우저의 HTTPS 화면에서 사용하세요.');
  const ids = new Set(); let attempts = 0;
  while (ids.size < count) {
    if (++attempts > count * 10) throw new Error('난수 생성 결과가 반복됩니다. 브라우저를 확인한 뒤 다시 시도하세요.');
    const bytes = new Uint8Array(16); secureCrypto.getRandomValues(bytes); bytes[6] = (bytes[6] & 15) | 64; bytes[8] = (bytes[8] & 63) | 128;
    const hex = [...bytes].map(byte => byte.toString(16).padStart(2, '0')).join('');
    ids.add(`${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`);
  }
  return [...ids];
}
if (typeof module !== 'undefined') module.exports = { generateUUIDs };
if (typeof document !== 'undefined') {
  const $ = id => document.getElementById(id); let version = 0;
  function clear() { version++; $('result').hidden = true; $('output').value = ''; $('error').textContent = ''; $('copy-status').textContent = ''; }
  $('converter').addEventListener('input', clear); $('converter').addEventListener('change', clear);
  $('converter').addEventListener('submit', event => { event.preventDefault(); clear(); try { if (!$('count').value.trim()) throw new Error('만들 개수를 입력하세요.'); const ids = generateUUIDs(Number($('count').value)); $('output').value = ids.join('\n'); $('summary').textContent = `UUID v4 ${ids.length}개를 만들었습니다.`; $('result').hidden = false; $('result').scrollIntoView({ block: 'nearest' }); } catch (error) { $('error').textContent = error.message; } });
  $('example')?.addEventListener('click', () => { $('count').value = '3'; $('converter').requestSubmit(); });
  $('copy').addEventListener('click', async () => { if ($('result').hidden) return; const token = version; try { await navigator.clipboard.writeText($('output').value); if (token === version) $('copy-status').textContent = 'UUID 목록을 복사했습니다.'; } catch { if (token !== version) return; $('output').focus(); $('output').select(); $('copy-status').textContent = '결과 칸의 글을 선택해 직접 복사하세요.'; } });
}
