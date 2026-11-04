'use strict';
function countWordFrequency(text, caseSensitive = false) {
  if (typeof text !== 'string' || !text.trim() || text.length > 200000) throw new Error('1~200,000자까지 입력하세요.');
  const words = text.normalize('NFC').match(/[\p{L}\p{N}]+(?:['’][\p{L}\p{N}]+)*/gu) || [];
  if (!words.length) throw new Error('셀 단어가 없습니다.');
  const map = new Map();
  for (const raw of words) { const word = caseSensitive ? raw : raw.toLowerCase(); map.set(word, (map.get(word) || 0) + 1); }
  const entries = [...map].map(([word, count]) => ({ word, count })).sort((a,b) => b.count-a.count);
  return { total: words.length, unique: entries.length, entries: entries.slice(0,1000) };
}
if (typeof module !== 'undefined') module.exports = { countWordFrequency };

if (typeof document !== 'undefined') {
  const $ = id => document.getElementById(id); let version = 0;
  function clear() { version++; $('result').hidden = true; $('output').value = ''; $('summary').textContent = ''; $('error').textContent = ''; $('copy-status').textContent = ''; $('run').disabled = false; }
  $('converter').addEventListener('input', clear); $('converter').addEventListener('change', clear);
  async function runFromInputs() { const r=countWordFrequency($('source').value,$('case-sensitive').checked);return {text:r.entries.map(e=>e.word+'\t'+e.count).join('\n'),summary:'총 '+r.total+'개 · '+r.unique+'종류'}; }
  $('converter').addEventListener('submit', async event => { event.preventDefault(); clear(); const token = version; $('run').disabled = true; try { const r = await runFromInputs(); if (token !== version) return; $('output').value = r.text; $('summary').textContent = r.summary || ''; $('result').hidden = false; $('result').scrollIntoView({block:'nearest'}); } catch (error) { if (token === version) $('error').textContent = error.message; } finally { if (token === version) $('run').disabled = false; } });
  $('copy').addEventListener('click', async () => { if ($('result').hidden) return; const token = version; try { await navigator.clipboard.writeText($('output').value); if (token === version) $('copy-status').textContent = '복사했습니다.'; } catch { if (token !== version) return; $('output').focus(); $('output').select(); $('copy-status').textContent = '결과를 선택해 복사하세요.'; } });
}
