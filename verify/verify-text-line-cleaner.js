'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { cleanTextLines, MAX_TEXT_LENGTH, MAX_TEXT_LINES } = require('../tools/text-line-cleaner');
let checks = 0;
function test(name, fn) { fn(); checks++; console.log('PASS - ' + name); }

test('Keeps first occurrences and original order', () => {
  assert.deepEqual(cleanTextLines('사과\n바나나\n사과\n포도'), {
    text: '사과\n바나나\n포도', inputLines: 4, outputLines: 3,
    removedDuplicates: 1, removedBlank: 0, removedLines: 1
  });
  assert.equal(cleanTextLines('B\nA\nB\nC\nA').text, 'B\nA\nC');
});
test('Normalizes line separators and counts final empty line consistently', () => {
  assert.deepEqual(cleanTextLines('A\r\nB\rA\n'), {
    text: 'A\nB\n', inputLines: 4, outputLines: 3,
    removedDuplicates: 1, removedBlank: 0, removedLines: 1
  });
  const result = cleanTextLines('A\n\n\nB\n', { removeBlank: true });
  assert.equal(result.text, 'A\nB'); assert.equal(result.removedBlank, 3);
  assert.equal(result.removedDuplicates, 0);
});
test('Whitespace options apply before comparison without altering inner spaces', () => {
  assert.equal(cleanTextLines(' A \nA\nA  B\nA B').text, ' A \nA\nA  B\nA B');
  const result = cleanTextLines(' A \nA\n \t\nB ', { trimLines: true, removeBlank: true });
  assert.equal(result.text, 'A\nB'); assert.equal(result.removedDuplicates, 1);
  assert.equal(result.removedBlank, 1); assert.equal(result.removedLines, 2);
  assert.equal(cleanTextLines('A\nA\n\n', { removeDuplicates: false }).text, 'A\nA\n\n');
});
test('Case comparison preserves first spelling and Unicode is not normalized', () => {
  assert.equal(cleanTextLines('Apple\napple\nAPPLE').text, 'Apple\napple\nAPPLE');
  assert.equal(cleanTextLines('Apple\napple\nAPPLE', { caseSensitive: false }).text, 'Apple');
  assert.equal(cleanTextLines('É\né', { caseSensitive: false }).text, 'É');
  const text = '가\n가\né\ne\u0301\n😀\n😀';
  assert.equal(cleanTextLines(text).text, '가\n가\né\ne\u0301\n😀');
  assert.equal(cleanTextLines('<script>alert(1)</script>\n__proto__\n<script>alert(1)</script>').text,
    '<script>alert(1)</script>\n__proto__');
});
test('Input limits and errors are enforced at the actual boundaries', () => {
  for (const value of ['', ' \t\r\n', null, 123]) assert.throws(() => cleanTextLines(value));
  assert.equal(cleanTextLines('A'.repeat(MAX_TEXT_LENGTH)).text.length, MAX_TEXT_LENGTH);
  assert.throws(() => cleanTextLines('A'.repeat(MAX_TEXT_LENGTH + 1)), /200,000/);
  assert.equal(cleanTextLines(Array(MAX_TEXT_LINES).fill('A').join('\n')).inputLines, MAX_TEXT_LINES);
  assert.throws(() => cleanTextLines(Array(MAX_TEXT_LINES + 1).fill('A').join('\n')), /20,000/);
});

function ui() {
  const ids = ['source-text', 'remove-duplicates', 'remove-blank', 'trim-lines', 'case-sensitive',
    'line-cleaner-form', 'cleanup-result', 'cleaned-text', 'cleanup-summary', 'cleanup-error',
    'copy-status', 'copy-result', 'example-text'];
  const elements = Object.fromEntries(ids.map(id => [id, { value: '', checked: false, hidden: false,
    disabled: false, textContent: '', handlers: {}, addEventListener(event, fn) { this.handlers[event] = fn; },
    scrollIntoView() { this.scrolled = true; }, focus() { this.focused = true; }, select() { this.selected = true; } }]));
  elements['remove-duplicates'].checked = true; elements['case-sensitive'].checked = true;
  elements['line-cleaner-form'].requestSubmit = () => elements['line-cleaner-form'].handlers.submit({ preventDefault() {} });
  const clipboard = { writeText: async text => { clipboard.copied = text; } };
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../tools/text-line-cleaner.js'), 'utf8'), {
    document: { getElementById: id => elements[id] }, navigator: { clipboard }
  });
  return { elements, clipboard, submit: elements['line-cleaner-form'].requestSubmit };
}

test('UI preserves the source, reports results and invalidates old output', () => {
  const { elements: e, submit } = ui();
  assert.equal(e['cleanup-result'].hidden, true);
  submit(); assert.match(e['cleanup-error'].textContent, /한 줄 이상/);
  e['source-text'].value = 'A'.repeat(MAX_TEXT_LENGTH + 1); submit();
  assert.match(e['cleanup-error'].textContent, /200,000/);
  assert.equal(e['source-text'].value.length, MAX_TEXT_LENGTH + 1);
  e['source-text'].value = '사과\n바나나\n사과'; submit();
  assert.equal(e['source-text'].value, '사과\n바나나\n사과');
  assert.equal(e['cleaned-text'].value, '사과\n바나나');
  assert.match(e['cleanup-summary'].textContent, /입력 3줄 → 결과 2줄 · 중복 1줄/);
  assert.equal(e['cleanup-result'].hidden, false); assert.equal(e['copy-result'].disabled, false);
  e['line-cleaner-form'].handlers.input();
  assert.equal(e['cleanup-result'].hidden, true); assert.equal(e['cleaned-text'].value, '');
  assert.equal(e['copy-result'].disabled, true); assert.equal(e['cleanup-error'].textContent, '');
  e['example-text'].handlers.click();
  assert.equal(e['cleaned-text'].value, '사과\n바나나\n\n포도');
  e['remove-duplicates'].checked = false; e['line-cleaner-form'].handlers.change();
  assert.equal(e['case-sensitive'].disabled, true); assert.equal(e['cleanup-result'].hidden, true);
});

async function verifyClipboard() {
  const { elements: e, clipboard, submit } = ui();
  e['source-text'].value = 'A\nA\nB'; submit();
  await e['copy-result'].handlers.click();
  assert.equal(clipboard.copied, 'A\nB'); assert.match(e['copy-status'].textContent, /복사했습니다/);
  clipboard.writeText = async () => { throw new Error('denied'); };
  await e['copy-result'].handlers.click();
  assert.match(e['copy-status'].textContent, /직접 복사/);
  assert.equal(e['cleaned-text'].focused, true); assert.equal(e['cleaned-text'].selected, true);
  let finish;
  clipboard.writeText = () => new Promise(resolve => { finish = resolve; });
  const pending = e['copy-result'].handlers.click();
  e['line-cleaner-form'].handlers.input(); finish(); await pending;
  assert.equal(e['copy-status'].textContent, ''); assert.equal(e['cleanup-result'].hidden, true);
  checks++; console.log('PASS - clipboard success, manual fallback and stale-copy protection');
}
verifyClipboard().then(() => {
  const html = fs.readFileSync(path.join(__dirname, '../tools/text-line-cleaner.html'), 'utf8');
  assert.match(html, /<textarea[^>]*id="cleaned-text"[^>]*readonly/);
  assert.equal((html.match(/ad-banner-isolated\.js/g) || []).length, 1);
  assert.ok(!fs.readFileSync(path.join(__dirname, '../tools/text-line-cleaner.js'), 'utf8').includes('innerHTML'));
  checks++; console.log('PASS - readonly result, one isolated banner and text-only rendering');
  console.log(checks + ' text-line-cleaner checks passed');
}).catch(error => { console.error(error); process.exitCode = 1; });
