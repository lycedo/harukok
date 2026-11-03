'use strict';
const MAX_URL_TEXT_LENGTH = 200000;
function transformUrlText(raw, mode = 'encode') {
  if (typeof raw !== 'string' || !raw.length) throw new Error('변환할 글을 입력해 주세요.');
  if (raw.length > MAX_URL_TEXT_LENGTH) throw new Error('최대 200,000자까지 변환할 수 있습니다. 글을 나누어 넣어 주세요.');
  if (!['encode', 'decode'].includes(mode)) throw new Error('인코딩 또는 디코딩을 선택해 주세요.');
  for (let index = 0; index < raw.length; index++) {
    const unit = raw.charCodeAt(index);
    if (unit >= 0xD800 && unit <= 0xDBFF) {
      const next = raw.charCodeAt(index + 1);
      if (!(next >= 0xDC00 && next <= 0xDFFF)) throw new Error('완전하지 않은 문자가 있습니다. 이모지나 특수문자를 다시 붙여 넣어 주세요.');
      index++;
    } else if (unit >= 0xDC00 && unit <= 0xDFFF) throw new Error('완전하지 않은 문자가 있습니다. 이모지나 특수문자를 다시 붙여 넣어 주세요.');
  }
  try { return mode === 'encode' ? encodeURIComponent(raw) : decodeURIComponent(raw); }
  catch {
    throw new Error(mode === 'encode' ? '완전하지 않은 문자가 있습니다. 이모지나 특수문자를 다시 붙여 넣어 주세요.' : '올바르지 않은 % 표기 또는 문자 인코딩입니다. % 뒤의 두 자리와 UTF-8 문자열을 확인해 주세요.');
  }
}
if (typeof module !== 'undefined') module.exports = { transformUrlText, MAX_URL_TEXT_LENGTH };
if (typeof document !== 'undefined') {
  const $ = id => document.getElementById(id);
  let version = 0;
  function clearResult() {
    version++; $('url-result').hidden = true; $('url-output').value = ''; $('url-error').textContent = '';
    $('url-summary').textContent = ''; $('copy-status').textContent = ''; $('copy-result').disabled = true;
  }
  $('url-form').addEventListener('input', clearResult); $('url-form').addEventListener('change', clearResult);
  $('url-form').addEventListener('submit', event => {
    event.preventDefault(); clearResult();
    try {
      $('url-output').value = transformUrlText($('url-input').value, $('url-mode').value);
      $('url-summary').textContent = $('url-mode').value === 'encode' ? 'URL에 넣을 값으로 인코딩했습니다.' : '퍼센트로 표시된 글을 디코딩했습니다.';
      $('url-result').hidden = false; $('copy-result').disabled = false; $('url-result').scrollIntoView({ block: 'nearest' });
    } catch (error) { $('url-error').textContent = error.message; }
  });
  $('example-text').addEventListener('click', () => { $('url-input').value = '하루콕 & 메모'; $('url-mode').value = 'encode'; $('url-form').requestSubmit(); });
  $('copy-result').addEventListener('click', async () => {
    const token = version, text = $('url-output').value;
    if ($('url-result').hidden) return;
    try { await navigator.clipboard.writeText(text); if (token === version) $('copy-status').textContent = '변환한 글을 복사했습니다.'; }
    catch { if (token !== version) return; $('url-output').focus(); $('url-output').select(); $('copy-status').textContent = '자동 복사를 사용할 수 없습니다. 결과 칸에서 직접 복사해 주세요.'; }
  });
  clearResult();
}
