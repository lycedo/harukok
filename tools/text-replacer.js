'use strict';
function replaceLiteralText(text, search, replacement, caseSensitive = true) {
  if (typeof text !== 'string' || text.length > 200000 || typeof search !== 'string' || !search.length || search.length > 2000 || typeof replacement !== 'string' || replacement.length > 10000) throw new Error('원문 200,000자·찾을 글 1~2,000자·바꿀 글 10,000자 이내로 입력하세요.');
  const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), pattern = new RegExp(escaped, caseSensitive ? 'g' : 'gi');
  let count = 0; for (const _ of text.matchAll(pattern)) count++;
  if (text.length + count * (replacement.length - search.length) > 2000000) throw new Error('변환 결과가 2,000,000자를 넘습니다. 나누어 처리하세요.');
  return { text: text.replace(pattern, () => replacement), count };
}
if (typeof module !== 'undefined') module.exports = { replaceLiteralText };

if (typeof document !== 'undefined') {
  const $ = id => document.getElementById(id); let version = 0;
  function clear() { version++; $('result').hidden = true; $('output').value = ''; $('summary').textContent = ''; $('error').textContent = ''; $('copy-status').textContent = ''; $('run').disabled = false; }
  $('converter').addEventListener('input', clear); $('converter').addEventListener('change', clear);
  async function runFromInputs() { const r=replaceLiteralText($('source').value,$('search').value,$('replacement').value,$('case-sensitive').checked);return {text:r.text,summary:r.count+'곳 바꿈'}; }
  $('converter').addEventListener('submit', async event => { event.preventDefault(); clear(); const token = version; $('run').disabled = true; try { const r = await runFromInputs(); if (token !== version) return; $('output').value = r.text; $('summary').textContent = r.summary || ''; $('result').hidden = false; $('result').scrollIntoView({block:'nearest'}); } catch (error) { if (token === version) $('error').textContent = error.message; } finally { if (token === version) $('run').disabled = false; } });
  $('copy').addEventListener('click', async () => { if ($('result').hidden) return; const token = version; try { await navigator.clipboard.writeText($('output').value); if (token === version) $('copy-status').textContent = '복사했습니다.'; } catch { if (token !== version) return; $('output').focus(); $('output').select(); $('copy-status').textContent = '결과를 선택해 복사하세요.'; } });
}
