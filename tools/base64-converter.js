'use strict';
const MAX_BASE64_TEXT = 200000;
function validUnicode(text) {
  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i);
    if (code >= 0xD800 && code <= 0xDBFF) {
      const next = text.charCodeAt(++i);
      if (!(next >= 0xDC00 && next <= 0xDFFF)) throw new Error('잘린 이모지나 문자가 있습니다. 원문을 다시 붙여 넣으세요.');
    } else if (code >= 0xDC00 && code <= 0xDFFF) throw new Error('잘린 이모지나 문자가 있습니다. 원문을 다시 붙여 넣으세요.');
  }
}
function transformBase64(raw, mode) {
  if (typeof raw !== 'string' || !raw.length) throw new Error('변환할 글을 입력하세요.');
  if (raw.length > MAX_BASE64_TEXT) throw new Error('최대 200,000자까지 변환할 수 있습니다. 글을 나누어 넣으세요.');
  if (mode === 'encode') {
    validUnicode(raw); let binary = '';
    for (const byte of new TextEncoder().encode(raw)) binary += String.fromCharCode(byte);
    return btoa(binary);
  }
  if (mode !== 'decode') throw new Error('인코딩 또는 디코딩을 선택하세요.');
  const text = raw.replace(/[\t\r\n ]/g, '');
  if (!text.length || !/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(text)) throw new Error('올바른 표준 Base64를 입력하세요. 필요한 끝의 =도 포함해야 합니다.');
  const binary = atob(text);
  if (btoa(binary) !== text) throw new Error('끝부분이 올바르지 않은 Base64입니다. 원문을 확인하세요.');
  try { return new TextDecoder('utf-8', { fatal: true, ignoreBOM: true }).decode(Uint8Array.from(binary, char => char.charCodeAt(0))); }
  catch { throw new Error('Base64는 읽었지만 UTF-8 글자가 아닙니다. 파일 데이터나 다른 문자 인코딩은 지원하지 않습니다.'); }
}
if (typeof module !== 'undefined') module.exports = { transformBase64, validUnicode, MAX_BASE64_TEXT };
if (typeof document !== 'undefined') {
  const $ = id => document.getElementById(id); let version = 0;
  function clear() { version++; $('result').hidden = true; $('output').value = ''; $('error').textContent = ''; $('copy-status').textContent = ''; }
  $('converter').addEventListener('input', clear); $('converter').addEventListener('change', clear);
  $('converter').addEventListener('submit', event => { event.preventDefault(); clear(); try { $('output').value = transformBase64($('source').value, $('mode').value); $('result').hidden = false; $('result').scrollIntoView({ block: 'nearest' }); } catch (error) { $('error').textContent = error.message; } });
  $('example').addEventListener('click', () => { $('source').value = '하루콕 😀'; $('mode').value = 'encode'; $('converter').requestSubmit(); });
  $('copy').addEventListener('click', async () => { if ($('result').hidden) return; const token = version; try { await navigator.clipboard.writeText($('output').value); if (token === version) $('copy-status').textContent = '변환 결과를 복사했습니다.'; } catch { if (token !== version) return; $('output').focus(); $('output').select(); $('copy-status').textContent = '결과 칸의 글을 선택해 직접 복사하세요.'; } });
}
