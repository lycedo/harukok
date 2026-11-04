'use strict';
function makeMarkdownTable(text, alignment = 'left') {
  if (typeof text !== 'string' || !text.trim() || text.length > 100000) throw new Error('표를 100,000자 이내로 붙여 넣으세요.');
  if (!['left', 'center', 'right'].includes(alignment)) throw new Error('정렬 방법을 고르세요.');
  const rows = text.replace(/\r\n?/g, '\n').replace(/\n$/, '').split('\n').map(row => row.split('\t'));
  const columns = rows[0].length;
  if (rows.length > 200 || columns > 30 || rows.some(row => row.length !== columns)) throw new Error('최대 200행·30열이며 모든 행의 열 수를 맞추세요.');
  const escape = value => value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/[\\`*_\[\]{}()#+.!|~\-]/g, '\\$&').trim();
  const line = row => '| ' + row.map(escape).join(' | ') + ' |';
  const separator = alignment === 'left' ? ':---' : alignment === 'right' ? '---:' : ':---:';
  return [line(rows[0]), '| ' + Array(columns).fill(separator).join(' | ') + ' |', ...rows.slice(1).map(line)].join('\n');
}
if (typeof module !== 'undefined') module.exports = { makeMarkdownTable };

if (typeof document !== 'undefined') {
  const $ = id => document.getElementById(id); let version = 0;
  function clear() { version++; $('result').hidden = true; $('output').value = ''; $('summary').textContent = ''; $('error').textContent = ''; $('copy-status').textContent = ''; $('run').disabled = false; }
  $('converter').addEventListener('input', clear); $('converter').addEventListener('change', clear);
  async function runFromInputs() { return {text:makeMarkdownTable($('source').value,$('mode').value)}; }
  $('converter').addEventListener('submit', async event => { event.preventDefault(); clear(); const token = version; $('run').disabled = true; try { const r = await runFromInputs(); if (token !== version) return; $('output').value = r.text; $('summary').textContent = r.summary || ''; $('result').hidden = false; $('result').scrollIntoView({block:'nearest'}); } catch (error) { if (token === version) $('error').textContent = error.message; } finally { if (token === version) $('run').disabled = false; } });
  $('copy').addEventListener('click', async () => { if ($('result').hidden) return; const token = version; try { await navigator.clipboard.writeText($('output').value); if (token === version) $('copy-status').textContent = '복사했습니다.'; } catch { if (token !== version) return; $('output').focus(); $('output').select(); $('copy-status').textContent = '결과를 선택해 복사하세요.'; } });
}
