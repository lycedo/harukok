'use strict';
function decimalKey(raw) {
  const value = raw.trim();
  if (!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(value) || value.length > 200) throw new Error('숫자 정렬은 한 줄에 정수·소수 하나씩 넣으세요. 지수·쉼표는 빼세요.');
  const negative = value[0] === '-', parts = value.replace(/^[+-]/, '').split('.');
  const integer = (parts[0] || '0').replace(/^0+(?=\d)/, ''), fraction = (parts[1] || '').replace(/0+$/, '');
  return { negative: negative && !(integer === '0' && !fraction), integer, fraction };
}
function compareDecimals(a,b) {
  if (a.negative !== b.negative) return a.negative ? -1 : 1;
  let comparison = a.integer.length - b.integer.length;
  if (!comparison) comparison = a.integer < b.integer ? -1 : a.integer > b.integer ? 1 : 0;
  if (!comparison) { const length = Math.max(a.fraction.length,b.fraction.length), x = a.fraction.padEnd(length,'0'), y = b.fraction.padEnd(length,'0'); comparison = x < y ? -1 : x > y ? 1 : 0; }
  return a.negative ? -comparison : comparison;
}
function sortTextLines(text, mode = 'text', direction = 'asc') {
  if (typeof text !== 'string' || !text.length || text.length > 200000) throw new Error('1~200,000자까지 입력하세요.');
  if (!['text','number'].includes(mode) || !['asc','desc'].includes(direction)) throw new Error('정렬 방법을 고르세요.');
  const lines = text.replace(/\r\n?/g,'\n').split('\n');
  if (lines.length > 10000) throw new Error('최대 10,000줄까지 지원합니다.');
  const collator = new Intl.Collator('ko', {sensitivity:'variant',numeric:false}), sign = direction === 'asc' ? 1 : -1;
  return lines.map((line,index) => ({line,index,key: mode === 'number' ? decimalKey(line) : null})).sort((a,b) => sign * (mode === 'number' ? compareDecimals(a.key,b.key) : collator.compare(a.line,b.line)) || a.index-b.index).map(row=>row.line).join('\n');
}
if (typeof module !== 'undefined') module.exports = { sortTextLines, decimalKey, compareDecimals };

if (typeof document !== 'undefined') {
  const $ = id => document.getElementById(id); let version = 0;
  function clear() { version++; $('result').hidden = true; $('output').value = ''; $('summary').textContent = ''; $('error').textContent = ''; $('copy-status').textContent = ''; $('run').disabled = false; }
  $('converter').addEventListener('input', clear); $('converter').addEventListener('change', clear);
  async function runFromInputs() { return {text:sortTextLines($('source').value,$('mode').value,$('direction').value)}; }
  $('converter').addEventListener('submit', async event => { event.preventDefault(); clear(); const token = version; $('run').disabled = true; try { const r = await runFromInputs(); if (token !== version) return; $('output').value = r.text; $('summary').textContent = r.summary || ''; $('result').hidden = false; $('result').scrollIntoView({block:'nearest'}); } catch (error) { if (token === version) $('error').textContent = error.message; } finally { if (token === version) $('run').disabled = false; } });
  $('copy').addEventListener('click', async () => { if ($('result').hidden) return; const token = version; try { await navigator.clipboard.writeText($('output').value); if (token === version) $('copy-status').textContent = '복사했습니다.'; } catch { if (token !== version) return; $('output').focus(); $('output').select(); $('copy-status').textContent = '결과를 선택해 복사하세요.'; } });
}
