'use strict';
function convertNumberBase(raw, fromBase) {
  if (![2, 8, 10, 16].includes(fromBase)) throw new Error('2·8·10·16진수 중 입력 기준을 선택하세요.');
  if (typeof raw !== 'string') throw new Error('정수를 입력하세요.');
  let text = raw.trim(); if (!text.length || text.length > 260) throw new Error('숫자 부분을 1~256자리로 입력하세요.');
  const negative = text.startsWith('-'); text = text.replace(/^[+-]/, '');
  const prefix = { 2: '0b', 8: '0o', 16: '0x' }[fromBase]; if (prefix && text.slice(0, 2).toLowerCase() === prefix) text = text.slice(2);
  if (!text.length || text.length > 256 || ![...text].every(char => /^[\da-f]$/i.test(char) && parseInt(char, 16) < fromBase)) throw new Error('선택한 진수에 맞는 숫자를 최대 256자리로 입력하세요. 소수는 지원하지 않습니다.');
  const number = BigInt((fromBase === 10 ? '' : { 2: '0b', 8: '0o', 16: '0x' }[fromBase]) + text) * (negative ? -1n : 1n);
  return { binary: number.toString(2), octal: number.toString(8), decimal: number.toString(10), hexadecimal: number.toString(16).toUpperCase() };
}
if (typeof module !== 'undefined') module.exports = { convertNumberBase };
if (typeof document !== 'undefined') {
  const $ = id => document.getElementById(id); let version = 0;
  function clear() { version++; $('result').hidden = true; $('output').value = ''; $('error').textContent = ''; $('copy-status').textContent = ''; }
  $('converter').addEventListener('input', clear); $('converter').addEventListener('change', clear);
  $('converter').addEventListener('submit', event => { event.preventDefault(); clear(); try { const r = convertNumberBase($('source').value, Number($('base').value)); $('output').value = `2진수: ${r.binary}\n8진수: ${r.octal}\n10진수: ${r.decimal}\n16진수: ${r.hexadecimal}`; $('result').hidden = false; $('result').scrollIntoView({ block: 'nearest' }); } catch (error) { $('error').textContent = error.message; } });
  $('example')?.addEventListener('click', () => { $('source').value = '255'; $('base').value = '10'; $('converter').requestSubmit(); });
  $('copy').addEventListener('click', async () => { if ($('result').hidden) return; const token = version; try { await navigator.clipboard.writeText($('output').value); if (token === version) $('copy-status').textContent = '진수별 결과를 복사했습니다.'; } catch { if (token !== version) return; $('output').focus(); $('output').select(); $('copy-status').textContent = '결과 칸의 글을 선택해 직접 복사하세요.'; } });
}
