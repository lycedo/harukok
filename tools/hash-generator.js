'use strict';
async function generateHash(text, algorithm, cryptoEngine = globalThis.crypto) {
  if (typeof text !== 'string' || text.length > 200000) throw new Error('최대 200,000자까지 처리합니다.');
  if (!['SHA-256', 'SHA-384', 'SHA-512'].includes(algorithm)) throw new Error('해시 종류를 고르세요.');
  if (!cryptoEngine?.subtle) throw new Error('HTTPS에서 다시 열거나 최신 브라우저를 사용하세요.');
  const bytes = new TextEncoder().encode(text);
  const digest = await cryptoEngine.subtle.digest(algorithm, bytes);
  return [...new Uint8Array(digest)].map(n => n.toString(16).padStart(2, '0')).join('');
}
if (typeof module !== 'undefined') module.exports = { generateHash };

if (typeof document !== 'undefined') {
  const $ = id => document.getElementById(id); let version = 0;
  function clear() { version++; $('result').hidden = true; $('output').value = ''; $('summary').textContent = ''; $('error').textContent = ''; $('copy-status').textContent = ''; $('run').disabled = false; }
  $('converter').addEventListener('input', clear); $('converter').addEventListener('change', clear);
  async function runFromInputs() { return {text:await generateHash($('source').value,$('mode').value),summary:$('mode').value+' · UTF-8'}; }
  $('converter').addEventListener('submit', async event => { event.preventDefault(); clear(); const token = version; $('run').disabled = true; try { const r = await runFromInputs(); if (token !== version) return; $('output').value = r.text; $('summary').textContent = r.summary || ''; $('result').hidden = false; $('result').scrollIntoView({block:'nearest'}); } catch (error) { if (token === version) $('error').textContent = error.message; } finally { if (token === version) $('run').disabled = false; } });
  $('copy').addEventListener('click', async () => { if ($('result').hidden) return; const token = version; try { await navigator.clipboard.writeText($('output').value); if (token === version) $('copy-status').textContent = '복사했습니다.'; } catch { if (token !== version) return; $('output').focus(); $('output').select(); $('copy-status').textContent = '결과를 선택해 복사하세요.'; } });
}
