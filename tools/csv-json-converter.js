'use strict';
const MAX_DATA_TEXT = 200000;
function checkDataText(raw) {
  if (typeof raw !== 'string' || !raw.trim()) throw new Error('변환할 CSV 또는 JSON을 입력하세요.');
  if (raw.length > MAX_DATA_TEXT) throw new Error('최대 200,000자까지 처리합니다. 자료를 나누어 넣으세요.');
}
function validateHeaders(headers) {
  if (!headers || !headers.length || headers.some(header => typeof header !== 'string' || !header.trim())) throw new Error('첫 행의 열 이름은 비워 둘 수 없습니다.');
  if (new Set(headers).size !== headers.length) throw new Error('첫 행의 열 이름이 중복됩니다. 서로 다른 이름으로 바꾸세요.');
}
function parseCSV(raw) {
  checkDataText(raw); raw = raw.replace(/^\uFEFF/, '');
  const rows = []; let row = [], cell = '', quoted = false, closed = false, start = true;
  function pushCell() { row.push(cell); if (row.length > 100) throw new Error('열은 최대 100개까지 지원합니다.'); cell = ''; start = true; closed = false; }
  function pushRow() { pushCell(); rows.push(row); row = []; if (rows.length > 1000) throw new Error('머리글을 포함해 최대 1,000행까지 지원합니다.'); }
  for (let i = 0; i < raw.length; i++) {
    const char = raw[i];
    if (quoted) { if (char === '"') { if (raw[i + 1] === '"') { cell += '"'; i++; } else { quoted = false; closed = true; } } else cell += char; continue; }
    if (char === ',') { pushCell(); continue; }
    if (char === '\r' || char === '\n') { if (char === '\r' && raw[i + 1] === '\n') i++; pushRow(); continue; }
    if (closed) throw new Error('닫는 큰따옴표 뒤에는 쉼표나 줄바꿈만 올 수 있습니다.');
    if (char === '"') { if (!start) throw new Error('셀 안의 큰따옴표는 셀 전체를 큰따옴표로 감싸고 두 번 적으세요.'); quoted = true; start = false; }
    else { cell += char; start = false; }
  }
  if (quoted) throw new Error('닫히지 않은 큰따옴표가 있습니다.');
  if (row.length || cell.length || !start || !/[\r\n]$/.test(raw)) pushRow();
  validateHeaders(rows[0]);
  if (rows.some(r => r.length !== rows[0].length)) throw new Error('모든 행의 열 개수를 머리글과 맞추세요.');
  return rows;
}
function rejectDuplicateJsonKeys(raw) {
  const tokens = raw.match(/"(?:\\.|[^"\\])*"|[{}\[\],:]|[^\s{}\[\],:]+/g), stack = [];
  let firstObjectKeys = null, firstObjectSet = null;
  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    if (token === '{') {
      const keys = new Set();
      if (stack.length === 1 && stack[0] === null && firstObjectKeys === null) { firstObjectKeys = []; firstObjectSet = keys; }
      stack.push(keys);
    } else if (token === '[') stack.push(null); else if (token === '}' || token === ']') stack.pop();
    else if (token.startsWith('"') && tokens[i + 1] === ':' && stack[stack.length - 1]) { const key = JSON.parse(token), keys = stack[stack.length - 1]; if (keys.has(key)) throw new Error('JSON 객체의 키가 중복됩니다. 중복을 정리한 뒤 변환하세요.'); keys.add(key); if (keys === firstObjectSet) firstObjectKeys.push(key); }
  }
  return firstObjectKeys;
}
function convertCSVJSON(raw, mode) {
  checkDataText(raw);
  if (mode === 'csv-to-json') {
    const rows = parseCSV(raw), headers = rows[0];
    // Serialize in source column order, including numeric-looking header names.
    const objects = rows.slice(1).map(row => '  {\n' + headers.map((key, index) => '    ' + JSON.stringify(key) + ': ' + JSON.stringify(row[index])).join(',\n') + '\n  }');
    return { text: objects.length ? '[\n' + objects.join(',\n') + '\n]' : '[]', rows: rows.length - 1, columns: headers.length };
  }
  if (mode !== 'json-to-csv') throw new Error('변환 방향을 선택하세요.');
  let data; try { data = JSON.parse(raw); } catch { throw new Error('JSON 문법이 올바르지 않습니다. 큰따옴표·쉼표·괄호를 확인하세요.'); }
  const sourceHeaders = rejectDuplicateJsonKeys(raw);
  if (!Array.isArray(data) || !data.length || data.length > 1000) throw new Error('비어 있지 않은 객체 배열 또는 행 배열을 넣으세요. 최대 1,000행입니다.');
  let rows;
  if (Array.isArray(data[0])) rows = data;
  else {
    if (!data[0] || typeof data[0] !== 'object') throw new Error('JSON은 객체 배열 또는 행 배열이어야 합니다.');
    const headers = sourceHeaders || Object.keys(data[0]); validateHeaders(headers);
    if (data.length > 999) throw new Error('객체 배열은 머리글을 더해 최대 1,000행이므로 999개 객체까지 지원합니다.');
    rows = [headers, ...data.map(object => { if (!object || typeof object !== 'object' || Array.isArray(object) || Object.keys(object).length !== headers.length || headers.some(key => !Object.hasOwn(object, key))) throw new Error('모든 JSON 객체의 열 이름을 동일하게 맞추세요.'); return headers.map(key => object[key]); })];
  }
  validateHeaders(rows[0]);
  if (rows[0].length > 100 || rows.some(row => !Array.isArray(row) || row.length !== rows[0].length || row.some(cell => typeof cell !== 'string'))) throw new Error('열은 최대 100개이며 모든 셀 값은 큰따옴표로 감싼 문자열이어야 합니다. 숫자·null·배열은 지원하지 않습니다.');
  const quote = value => /[",\r\n]/.test(value) ? '"' + value.replace(/"/g, '""') + '"' : value;
  return { text: rows.map(row => row.map(quote).join(',')).join('\r\n'), rows: rows.length - 1, columns: rows[0].length };
}
if (typeof module !== 'undefined') module.exports = { parseCSV, convertCSVJSON, MAX_DATA_TEXT };
if (typeof document !== 'undefined') {
  const $ = id => document.getElementById(id); let version = 0;
  function clear() { version++; $('result').hidden = true; $('output').value = ''; $('summary').textContent = ''; $('error').textContent = ''; $('copy-status').textContent = ''; }
  $('converter').addEventListener('input', clear); $('converter').addEventListener('change', clear);
  $('converter').addEventListener('submit', event => { event.preventDefault(); clear(); try { const r = convertCSVJSON($('source').value, $('mode').value); $('output').value = r.text; $('summary').textContent = `데이터 ${r.rows}행 · ${r.columns}열`; $('result').hidden = false; $('result').scrollIntoView({ block: 'nearest' }); } catch (error) { $('error').textContent = error.message; } });
  $('example').addEventListener('click', () => { $('mode').value = 'csv-to-json'; $('source').value = '이름,메모\r\n하루콕,"쉼표, 큰따옴표 ""예시"""\r\n예시,"두 줄\n메모"'; $('converter').requestSubmit(); });
  $('copy').addEventListener('click', async () => { if ($('result').hidden) return; const token = version; try { await navigator.clipboard.writeText($('output').value); if (token === version) $('copy-status').textContent = '변환 결과를 복사했습니다.'; } catch { if (token !== version) return; $('output').focus(); $('output').select(); $('copy-status').textContent = '결과 칸의 글을 선택해 직접 복사하세요.'; } });
}
