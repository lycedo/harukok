'use strict';
const MAX_JSON_LENGTH = 200000;
const MAX_JSON_DEPTH = 100;
const MAX_JSON_OUTPUT = 2000000;
function formatJsonText(raw, mode = '2') {
  if (typeof raw !== 'string' || !raw.trim()) throw new Error('정리할 JSON을 입력해 주세요.');
  if (raw.length > MAX_JSON_LENGTH) throw new Error('최대 200,000자까지 처리할 수 있습니다. JSON을 나누어 넣어 주세요.');
  if (!['2', '4', 'compact'].includes(mode)) throw new Error('들여쓰기 2칸·4칸 또는 한 줄 압축을 선택해 주세요.');
  try { JSON.parse(raw); }
  catch (error) {
    const position = String(error.message).match(/position (\d+)/i);
    throw new Error(`JSON 형식이 올바르지 않습니다.${position ? ' 문자 위치 ' + (Number(position[1]) + 1) + ' 근처의' : ''} 큰따옴표·쉼표·괄호를 확인해 주세요.`);
  }
  // 검증 결과를 stringify하지 않는다. 원문의 숫자·키 순서·문자열 토큰을 그대로 사용한다.
  const tokens = raw.match(/"(?:\\.|[^"\\])*"|[{}\[\],:]|[^\s{}\[\],:]+/g);
  const parts = [];
  let depth = 0, length = 0;
  const compact = mode === 'compact', unit = compact ? '' : ' '.repeat(Number(mode));
  function append(text) {
    length += text.length;
    if (length > MAX_JSON_OUTPUT) throw new Error('정리한 결과가 너무 큽니다. 한 줄 압축을 고르거나 JSON을 나누어 넣어 주세요.');
    parts.push(text);
  }
  const newline = () => { if (!compact) append('\n' + unit.repeat(depth)); };
  for (let index = 0; index < tokens.length; index++) {
    const token = tokens[index], previous = tokens[index - 1], next = tokens[index + 1];
    if (token === '{' || token === '[') {
      append(token); depth++;
      if (depth > MAX_JSON_DEPTH) throw new Error('최대 100단계의 중첩까지 처리할 수 있습니다.');
      if (!((token === '{' && next === '}') || (token === '[' && next === ']'))) newline();
    } else if (token === '}' || token === ']') {
      depth--;
      if (!((previous === '{' && token === '}') || (previous === '[' && token === ']'))) newline();
      append(token);
    } else if (token === ',') { append(token); newline(); }
    else if (token === ':') append(compact ? ':' : ': ');
    else append(token);
  }
  return parts.join('');
}
if (typeof module !== 'undefined') module.exports = { formatJsonText, MAX_JSON_LENGTH, MAX_JSON_DEPTH, MAX_JSON_OUTPUT };
if (typeof document !== 'undefined') {
  const $ = id => document.getElementById(id);
  let version = 0;
  function clearResult() {
    version++; $('json-result').hidden = true; $('json-output').value = ''; $('json-error').textContent = '';
    $('json-summary').textContent = ''; $('copy-status').textContent = ''; $('copy-result').disabled = true;
  }
  $('json-form').addEventListener('input', clearResult); $('json-form').addEventListener('change', clearResult);
  $('json-form').addEventListener('submit', event => {
    event.preventDefault(); clearResult();
    try {
      const result = formatJsonText($('json-input').value, $('json-mode').value);
      $('json-output').value = result; $('json-summary').textContent = 'JSON 형식을 확인했습니다. 숫자와 문자열의 원문 표기를 유지했습니다.';
      $('json-result').hidden = false; $('copy-result').disabled = false; $('json-result').scrollIntoView({ block: 'nearest' });
    } catch (error) { $('json-error').textContent = error.message; }
  });
  $('example-text')?.addEventListener('click', () => {
    $('json-input').value = '{"이름":"하루콕","도구":["계산기","사진 편집"],"무료":true}'; $('json-mode').value = '2'; $('json-form').requestSubmit();
  });
  $('copy-result').addEventListener('click', async () => {
    const token = version, text = $('json-output').value;
    if ($('json-result').hidden) return;
    try { await navigator.clipboard.writeText(text); if (token === version) $('copy-status').textContent = '정리한 JSON을 복사했습니다.'; }
    catch { if (token !== version) return; $('json-output').focus(); $('json-output').select(); $('copy-status').textContent = '자동 복사를 사용할 수 없습니다. 결과 칸에서 직접 복사해 주세요.'; }
  });
  clearResult();
}
