'use strict';
const MAX_DIFF_LENGTH = 50000;
const MAX_DIFF_LINES = 1000;
function compareTextLines(before, after) {
  if (typeof before !== 'string' || typeof after !== 'string') throw new Error('비교할 글을 입력해 주세요.');
  if (!before.length && !after.length) throw new Error('두 입력칸 중 한 곳 이상에 글을 넣어 주세요.');
  if (before.length > MAX_DIFF_LENGTH || after.length > MAX_DIFF_LENGTH) throw new Error('각 입력은 최대 50,000자까지 비교할 수 있습니다.');
  const split = text => text.length ? text.replace(/\r\n?/g, '\n').split('\n') : [];
  const oldLines = split(before), newLines = split(after);
  if (oldLines.length > MAX_DIFF_LINES || newLines.length > MAX_DIFF_LINES) throw new Error('각 입력은 최대 1,000줄까지 비교할 수 있습니다. 글을 나누어 넣어 주세요.');
  const width = newLines.length + 1;
  const dp = new Uint16Array((oldLines.length + 1) * width);
  for (let i = oldLines.length - 1; i >= 0; i--) {
    for (let j = newLines.length - 1; j >= 0; j--) {
      dp[i * width + j] = oldLines[i] === newLines[j] ? 1 + dp[(i + 1) * width + j + 1] : Math.max(dp[(i + 1) * width + j], dp[i * width + j + 1]);
    }
  }
  const rows = [];
  let i = 0, j = 0, same = 0, removed = 0, added = 0;
  while (i < oldLines.length || j < newLines.length) {
    if (i < oldLines.length && j < newLines.length && oldLines[i] === newLines[j]) {
      rows.push({ type: 'same', text: oldLines[i], oldLine: ++i, newLine: ++j }); same++;
    } else if (i < oldLines.length && (j === newLines.length || dp[(i + 1) * width + j] >= dp[i * width + j + 1])) {
      rows.push({ type: 'remove', text: oldLines[i], oldLine: ++i, newLine: null }); removed++;
    } else {
      rows.push({ type: 'add', text: newLines[j], oldLine: null, newLine: ++j }); added++;
    }
  }
  return { rows, same, removed, added };
}
function diffCopyText(result) {
  return result.rows.map(row => `${row.type === 'same' ? '동일' : row.type === 'remove' ? '삭제' : '추가'} [이전 ${row.oldLine ?? '—'} / 새 ${row.newLine ?? '—'}] ${row.text}`).join('\n');
}
if (typeof module !== 'undefined') module.exports = { compareTextLines, diffCopyText, MAX_DIFF_LENGTH, MAX_DIFF_LINES };
if (typeof document !== 'undefined') {
  const $ = id => document.getElementById(id);
  let version = 0;
  function clearResult() {
    version++; $('diff-result').hidden = true; $('diff-lines').replaceChildren();
    $('diff-output').value = ''; $('diff-summary').textContent = ''; $('diff-error').textContent = '';
    $('copy-status').textContent = ''; $('copy-result').disabled = true; $('copy-details').open = false;
  }
  $('diff-form').addEventListener('input', clearResult);
  $('diff-form').addEventListener('submit', event => {
    event.preventDefault(); clearResult();
    try {
      const result = compareTextLines($('before-text').value, $('after-text').value);
      for (const row of result.rows) {
        const line = document.createElement('p');
        line.textContent = `${row.type === 'same' ? '동일' : row.type === 'remove' ? '삭제' : '추가'} [이전 ${row.oldLine ?? '—'} / 새 ${row.newLine ?? '—'}] ${row.text || '(빈 줄)'}`;
        $('diff-lines').appendChild(line);
      }
      $('diff-output').value = diffCopyText(result);
      $('diff-summary').textContent = `동일 ${result.same}줄 · 삭제 ${result.removed}줄 · 추가 ${result.added}줄`;
      $('diff-result').hidden = false; $('copy-result').disabled = false;
      $('diff-result').scrollIntoView({ block: 'nearest' });
    } catch (error) { $('diff-error').textContent = error.message; }
  });
  $('example-text')?.addEventListener('click', () => {
    $('before-text').value = '사과\n바나나\n포도'; $('after-text').value = '사과\n딸기\n포도';
    $('diff-form').requestSubmit();
  });
  $('copy-result').addEventListener('click', async () => {
    const token = version, text = $('diff-output').value;
    if ($('diff-result').hidden) return;
    try { await navigator.clipboard.writeText(text); if (token === version) $('copy-status').textContent = '줄별 비교 결과를 복사했습니다.'; }
    catch { if (token !== version) return; $('copy-details').open = true; $('diff-output').focus(); $('diff-output').select(); $('copy-status').textContent = '자동 복사를 사용할 수 없습니다. 펼쳐진 결과 칸에서 직접 복사해 주세요.'; }
  });
  clearResult();
}
