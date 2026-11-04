'use strict';
function checkScalarText(text) {
  for (const char of text) { const n = char.codePointAt(0); if (n >= 0xd800 && n <= 0xdfff) throw new Error('짝이 없는 유니코드 서로게이트가 있습니다.'); }
  return text;
}
function convertUnicode(text, mode) {
  if (typeof text !== 'string' || !text.length || text.length > 100000) throw new Error('1~100,000자까지 입력하세요.');
  if (mode === 'to-codepoints' || mode === 'to-escape') {
    checkScalarText(text);
    return [...text].map(char => { const hex = char.codePointAt(0).toString(16).toUpperCase(); return mode === 'to-codepoints' ? 'U+' + hex.padStart(4, '0') : hex.length > 4 ? '\\u{' + hex + '}' : '\\u' + hex.padStart(4, '0'); }).join(mode === 'to-codepoints' ? ' ' : '');
  }
  if (mode === 'from-codepoints') {
    const tokens = text.trim().split(/\s+/);
    return tokens.map(token => { if (!/^U\+[\da-f]{1,6}$/i.test(token)) throw new Error('U+D558처럼 공백으로 나눈 코드를 넣으세요.'); const n = Number.parseInt(token.slice(2), 16); if (n > 0x10ffff || (n >= 0xd800 && n <= 0xdfff)) throw new Error('유니코드 스칼라 범위를 확인하세요.'); return String.fromCodePoint(n); }).join('');
  }
  if (mode !== 'from-escape') throw new Error('변환 방향을 고르세요.');
  let result = '', pos = 0;
  while (pos < text.length) {
    const m = /^\\u(?:\{([\da-fA-F]{1,6})\}|([\da-fA-F]{4}))/.exec(text.slice(pos));
    if (!m) throw new Error('\\uD558 또는 \\u{1F600} 형식만 이어서 입력하세요.');
    const n = Number.parseInt(m[1] || m[2], 16);
    if (n > 0x10ffff || (m[1] && n >= 0xd800 && n <= 0xdfff)) throw new Error('유니코드 범위를 확인하세요.');
    result += m[1] ? String.fromCodePoint(n) : String.fromCharCode(n); pos += m[0].length;
  }
  return checkScalarText(result);
}
if (typeof module !== 'undefined') module.exports = { convertUnicode };

if (typeof document !== 'undefined') {
  const $ = id => document.getElementById(id); let version = 0;
  function clear() { version++; $('result').hidden = true; $('output').value = ''; $('summary').textContent = ''; $('error').textContent = ''; $('copy-status').textContent = ''; $('run').disabled = false; }
  $('converter').addEventListener('input', clear); $('converter').addEventListener('change', clear);
  function updatePlaceholder() { $('source').placeholder = ({ 'to-codepoints': '하루😀', 'to-escape': '하루😀', 'from-codepoints': 'U+D558 U+B8E8 U+1F600', 'from-escape': '\\uD558\\uB8E8\\u{1F600}' })[$('mode').value] || '하루😀'; }
  $('mode').addEventListener('change', updatePlaceholder); updatePlaceholder();
  async function runFromInputs() { return {text:convertUnicode($('source').value,$('mode').value)}; }
  $('converter').addEventListener('submit', async event => { event.preventDefault(); clear(); const token = version; $('run').disabled = true; try { const r = await runFromInputs(); if (token !== version) return; $('output').value = r.text; $('summary').textContent = r.summary || ''; $('result').hidden = false; $('result').scrollIntoView({block:'nearest'}); } catch (error) { if (token === version) $('error').textContent = error.message; } finally { if (token === version) $('run').disabled = false; } });
  $('copy').addEventListener('click', async () => { if ($('result').hidden) return; const token = version; try { await navigator.clipboard.writeText($('output').value); if (token === version) $('copy-status').textContent = '복사했습니다.'; } catch { if (token !== version) return; $('output').focus(); $('output').select(); $('copy-status').textContent = '결과를 선택해 복사하세요.'; } });
}
