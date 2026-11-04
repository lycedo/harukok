'use strict';

const MAX_TEXT_LENGTH = 200000;
const MAX_TEXT_LINES = 20000;

function cleanTextLines(raw, options = {}) {
  if (typeof raw !== 'string') throw new Error('정리할 글을 입력해 주세요.');
  if (raw.length > MAX_TEXT_LENGTH) throw new Error('한 번에 최대 200,000자까지 정리할 수 있습니다. 글을 나누어 넣어 주세요.');
  if (!raw.trim()) throw new Error('내용이 있는 글을 한 줄 이상 입력해 주세요.');
  const lines = raw.replace(/\r\n?/g, '\n').split('\n');
  if (lines.length > MAX_TEXT_LINES) throw new Error('한 번에 최대 20,000줄까지 정리할 수 있습니다. 글을 나누어 넣어 주세요.');
  const removeDuplicates = options.removeDuplicates !== false;
  const removeBlank = options.removeBlank === true;
  const trimLines = options.trimLines === true;
  const caseSensitive = options.caseSensitive !== false;
  const seen = new Set();
  const kept = [];
  let removedDuplicates = 0, removedBlank = 0;
  for (const source of lines) {
    const line = trimLines ? source.trim() : source;
    if (removeBlank && !line.trim()) { removedBlank++; continue; }
    const key = caseSensitive ? line : line.toLowerCase();
    if (removeDuplicates && seen.has(key)) { removedDuplicates++; continue; }
    seen.add(key);
    kept.push(line);
  }
  return { text: kept.join('\n'), inputLines: lines.length, outputLines: kept.length,
    removedDuplicates, removedBlank, removedLines: lines.length - kept.length };
}

if (typeof module !== 'undefined') module.exports = { cleanTextLines, MAX_TEXT_LENGTH, MAX_TEXT_LINES };
if (typeof document !== 'undefined') {
  const $ = id => document.getElementById(id);
  let version = 0;
  function clearResult() {
    version++;
    $('cleanup-result').hidden = true;
    $('cleaned-text').value = '';
    $('cleanup-summary').textContent = '';
    $('cleanup-error').textContent = '';
    $('copy-status').textContent = '';
    $('copy-result').disabled = true;
    $('case-sensitive').disabled = !$('remove-duplicates').checked;
  }
  $('line-cleaner-form').addEventListener('input', clearResult);
  $('line-cleaner-form').addEventListener('change', clearResult);
  $('line-cleaner-form').addEventListener('submit', event => {
    event.preventDefault();
    clearResult();
    try {
      const result = cleanTextLines($('source-text').value, {
        removeDuplicates: $('remove-duplicates').checked,
        removeBlank: $('remove-blank').checked,
        trimLines: $('trim-lines').checked,
        caseSensitive: $('case-sensitive').checked
      });
      $('cleaned-text').value = result.text;
      $('cleanup-summary').textContent = `입력 ${result.inputLines.toLocaleString('ko-KR')}줄 → 결과 ${result.outputLines.toLocaleString('ko-KR')}줄 · 중복 ${result.removedDuplicates.toLocaleString('ko-KR')}줄, 빈 줄 ${result.removedBlank.toLocaleString('ko-KR')}줄 제외`;
      $('cleanup-result').hidden = false;
      $('copy-result').disabled = !result.text;
      $('cleanup-result').scrollIntoView({ block: 'nearest' });
    } catch (error) { $('cleanup-error').textContent = error.message; }
  });
  $('example-text')?.addEventListener('click', () => {
    $('source-text').value = '사과\n바나나\n사과\n\n포도';
    $('remove-duplicates').checked = true;
    $('remove-blank').checked = false;
    $('trim-lines').checked = false;
    $('case-sensitive').checked = true;
    clearResult();
    $('line-cleaner-form').requestSubmit();
  });
  $('copy-result').addEventListener('click', async () => {
    const currentVersion = version;
    const text = $('cleaned-text').value;
    if (!text || $('cleanup-result').hidden) return;
    try {
      await navigator.clipboard.writeText(text);
      if (currentVersion === version) $('copy-status').textContent = '정리한 글을 복사했습니다.';
    } catch {
      if (currentVersion !== version) return;
      $('copy-status').textContent = '자동 복사를 사용할 수 없습니다. 결과 칸에서 글을 선택해 직접 복사해 주세요.';
      $('cleaned-text').focus();
      $('cleaned-text').select();
    }
  });
  clearResult();
}
