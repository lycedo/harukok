'use strict';
function convertTextCase(text, mode) {
  if (typeof text !== 'string' || !text.length || text.length > 200000) throw new Error('1~200,000자까지 입력하세요.');
  if (mode === 'upper') return text.toUpperCase();
  if (mode === 'lower') return text.toLowerCase();
  if (!['title', 'camel', 'pascal', 'snake', 'kebab'].includes(mode)) throw new Error('변환 방법을 고르세요.');
  const words = text.replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2').replace(/([a-z\d])([A-Z])/g, '$1 $2').match(/[\p{L}\p{N}]+/gu) || [];
  const lower = words.map(word => word.toLowerCase());
  const capitalize = word => word.charAt(0).toUpperCase() + word.slice(1);
  if (mode === 'snake') return lower.join('_');
  if (mode === 'kebab') return lower.join('-');
  if (mode === 'title') return lower.map(capitalize).join(' ');
  if (mode === 'pascal') return lower.map(capitalize).join('');
  return lower.map((word, i) => i ? capitalize(word) : word).join('');
}
if (typeof module !== 'undefined') module.exports = { convertTextCase };

if (typeof document !== 'undefined') {
  const $ = id => document.getElementById(id); let version = 0;
  function clear() { version++; $('result').hidden = true; $('output').value = ''; $('summary').textContent = ''; $('error').textContent = ''; $('copy-status').textContent = ''; $('run').disabled = false; }
  $('converter').addEventListener('input', clear); $('converter').addEventListener('change', clear);
  async function runFromInputs() { return {text:convertTextCase($('source').value,$('mode').value)}; }
  $('converter').addEventListener('submit', async event => { event.preventDefault(); clear(); const token = version; $('run').disabled = true; try { const r = await runFromInputs(); if (token !== version) return; $('output').value = r.text; $('summary').textContent = r.summary || ''; $('result').hidden = false; $('result').scrollIntoView({block:'nearest'}); } catch (error) { if (token === version) $('error').textContent = error.message; } finally { if (token === version) $('run').disabled = false; } });
  $('copy').addEventListener('click', async () => { if ($('result').hidden) return; const token = version; try { await navigator.clipboard.writeText($('output').value); if (token === version) $('copy-status').textContent = '복사했습니다.'; } catch { if (token !== version) return; $('output').focus(); $('output').select(); $('copy-status').textContent = '결과를 선택해 복사하세요.'; } });
}
