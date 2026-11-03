'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { compareTextLines, diffCopyText, MAX_DIFF_LENGTH, MAX_DIFF_LINES } = require('../tools/text-diff');
const { formatJsonText, MAX_JSON_LENGTH, MAX_JSON_DEPTH } = require('../tools/json-formatter');
const { transformUrlText, MAX_URL_TEXT_LENGTH } = require('../tools/url-encoder');
let checks = 0;
function test(name, fn) { fn(); checks++; console.log('PASS - ' + name); }

test('Line comparison marks changes and preserves exact source order', () => {
  const result = compareTextLines('사과\n바나나\n포도', '사과\n딸기\n포도');
  assert.deepEqual(result.rows, [
    { type: 'same', text: '사과', oldLine: 1, newLine: 1 },
    { type: 'remove', text: '바나나', oldLine: 2, newLine: null },
    { type: 'add', text: '딸기', oldLine: null, newLine: 2 },
    { type: 'same', text: '포도', oldLine: 3, newLine: 3 }
  ]);
  assert.equal(result.same, 2); assert.equal(result.removed, 1); assert.equal(result.added, 1);
  assert.match(diffCopyText(result), /삭제 \[이전 2 \/ 새 —\] 바나나/);
  for (const [before, after] of [['A\nA\nB', 'A\nB\nA'], ['B\nA', 'A\nB'], ['', 'A\n'], ['A\n\nB', 'A\nB'], ['가\n가', '가\n😀']]) {
    const rows = compareTextLines(before, after).rows;
    assert.deepEqual(rows.filter(row => row.type !== 'add').map(row => row.text), before ? before.split('\n') : []);
    assert.deepEqual(rows.filter(row => row.type !== 'remove').map(row => row.text), after ? after.split('\n') : []);
  }
});
test('Line separators, whitespace, empty sides and limits behave consistently', () => {
  assert.equal(compareTextLines('A\r\nB\rC', 'A\nB\nC').same, 3);
  assert.equal(compareTextLines('A', ' A').same, 0);
  assert.equal(compareTextLines('A\n', 'A').removed, 1);
  assert.equal(compareTextLines('', 'A').added, 1);
  assert.equal(compareTextLines('A', '').removed, 1);
  assert.throws(() => compareTextLines('', ''), /한 곳 이상/);
  assert.throws(() => compareTextLines(null, 'A'));
  assert.equal(compareTextLines('A'.repeat(MAX_DIFF_LENGTH), '').removed, 1);
  assert.throws(() => compareTextLines('A'.repeat(MAX_DIFF_LENGTH + 1), ''), /50,000/);
  assert.equal(compareTextLines(Array(MAX_DIFF_LINES).fill('A').join('\n'), Array(MAX_DIFF_LINES).fill('A').join('\n')).same, MAX_DIFF_LINES);
  assert.throws(() => compareTextLines(Array(MAX_DIFF_LINES + 1).fill('A').join('\n'), ''), /1,000/);
});
test('JSON formatting preserves token spelling, big numbers, duplicate keys and key order', () => {
  const raw = '{ "2":9007199254740993, "1":1.00, "a":-0, "a":1e+99, "b":"\\uAC00", "x":"a : , [ \\\" b" }';
  const compact = '{"2":9007199254740993,"1":1.00,"a":-0,"a":1e+99,"b":"\\uAC00","x":"a : , [ \\\" b"}';
  assert.equal(formatJsonText(raw, 'compact'), compact);
  assert.equal(formatJsonText(formatJsonText(raw, '2'), 'compact'), compact);
  assert.equal(formatJsonText(formatJsonText(raw, '4'), 'compact'), compact);
  assert.equal(formatJsonText('{"a":[1,{},[]]}', '2'), '{\n  "a": [\n    1,\n    {},\n    []\n  ]\n}');
  assert.equal(formatJsonText('{"a":1}', '4'), '{\n    "a": 1\n}');
  for (const text of ['null', 'true', 'false', '1e999', '"가 😀"', '{}', '[]']) assert.equal(formatJsonText(text), text);
  assert.equal(formatJsonText('"line\\ntext"', 'compact'), '"line\\ntext"');
});
test('JSON rejects invalid input, excessive depth and oversized formatted output', () => {
  for (const raw of ['', ' ', '{"a":}', '{"a":1,}', "{'a':1}", '{/* comment */}', 'undefined', 'NaN']) assert.throws(() => formatJsonText(raw));
  assert.throws(() => formatJsonText('{}', '8'));
  const atLimit = '"' + 'A'.repeat(MAX_JSON_LENGTH - 2) + '"';
  assert.equal(formatJsonText(atLimit).length, MAX_JSON_LENGTH);
  assert.throws(() => formatJsonText(atLimit + ' '), /200,000/);
  assert.doesNotThrow(() => formatJsonText('['.repeat(MAX_JSON_DEPTH) + '0' + ']'.repeat(MAX_JSON_DEPTH)));
  assert.throws(() => formatJsonText('['.repeat(MAX_JSON_DEPTH + 1) + '0' + ']'.repeat(MAX_JSON_DEPTH + 1)), /100단계/);
  const hugeIndent = '['.repeat(100) + Array(10000).fill('0').join(',') + ']'.repeat(100);
  assert.throws(() => formatJsonText(hugeIndent, '4'), /결과가 너무/);
  assert.equal(formatJsonText(hugeIndent, 'compact'), hugeIndent);
});
test('URL component encoding round trips without treating plus as space', () => {
  for (const text of ['하루콕 & 메모', 'a+b = /?&#%', '😀\n가', ' ', '!\'()*~']) assert.equal(transformUrlText(transformUrlText(text), 'decode'), text);
  assert.equal(transformUrlText('가 나'), '%EA%B0%80%20%EB%82%98');
  assert.equal(transformUrlText('A+B', 'decode'), 'A+B');
  assert.equal(transformUrlText('A%20B', 'decode'), 'A B');
  assert.equal(transformUrlText('%2520', 'decode'), '%20');
  assert.equal(transformUrlText('https://example.com/a?b=c'), 'https%3A%2F%2Fexample.com%2Fa%3Fb%3Dc');
  assert.throws(() => transformUrlText('\uD800'), /완전하지/);
  assert.throws(() => transformUrlText('\uD800', 'decode'), /완전하지/);
  assert.throws(() => transformUrlText('\uDC00', 'decode'), /완전하지/);
  for (const value of ['%', '%2', '%GG', '%C0%AF', '%ED%A0%80']) assert.throws(() => transformUrlText(value, 'decode'), /올바르지/);
  assert.throws(() => transformUrlText('')); assert.throws(() => transformUrlText('A', 'other'));
  assert.equal(transformUrlText('A'.repeat(MAX_URL_TEXT_LENGTH)).length, MAX_URL_TEXT_LENGTH);
  assert.throws(() => transformUrlText('A'.repeat(MAX_URL_TEXT_LENGTH + 1)), /200,000/);
});

function createUI(name, ids) {
  const elements = Object.fromEntries(ids.map(id => [id, { value: '', hidden: false, open: false,
    disabled: false, textContent: '', children: [], handlers: {},
    addEventListener(event, fn) { this.handlers[event] = fn; },
    replaceChildren() { this.children = []; }, appendChild(child) { this.children.push(child); },
    scrollIntoView() {}, focus() { this.focused = true; }, select() { this.selected = true; } }]));
  const clipboard = { writeText: async text => { clipboard.copied = text; } };
  const document = { getElementById: id => elements[id], createElement: () => ({ textContent: '' }) };
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../tools/' + name + '.js'), 'utf8'), { document, navigator: { clipboard } });
  const form = elements[ids[0]];
  form.requestSubmit = () => form.handlers.submit({ preventDefault() {} });
  return { e: elements, form, clipboard };
}

async function verifyUI() {
  const configurations = [
    { name: 'text-diff', ids: ['diff-form', 'before-text', 'after-text', 'diff-result', 'diff-lines', 'diff-output', 'diff-summary', 'diff-error', 'copy-status', 'copy-result', 'copy-details', 'example-text'],
      source: 'before-text', result: 'diff-result', output: 'diff-output', error: 'diff-error',
      fill(e) { e['before-text'].value = '<script>x</script>\nA'; e['after-text'].value = '<script>x</script>\nB'; }, verify(e) { assert.equal(e['diff-lines'].children[0].textContent, '동일 [이전 1 / 새 1] <script>x</script>'); } },
    { name: 'json-formatter', ids: ['json-form', 'json-input', 'json-mode', 'json-result', 'json-output', 'json-error', 'json-summary', 'copy-status', 'copy-result', 'example-text'],
      source: 'json-input', result: 'json-result', output: 'json-output', error: 'json-error',
      fill(e) { e['json-input'].value = '{"n":9007199254740993}'; e['json-mode'].value = '2'; }, verify(e) { assert.ok(e['json-output'].value.includes('9007199254740993')); } },
    { name: 'url-encoder', ids: ['url-form', 'url-input', 'url-mode', 'url-result', 'url-output', 'url-error', 'url-summary', 'copy-status', 'copy-result', 'example-text'],
      source: 'url-input', result: 'url-result', output: 'url-output', error: 'url-error',
      fill(e) { e['url-input'].value = '가 나'; e['url-mode'].value = 'encode'; }, verify(e) { assert.equal(e['url-output'].value, '%EA%B0%80%20%EB%82%98'); } }
  ];
  for (const config of configurations) {
    const { e, form, clipboard } = createUI(config.name, config.ids);
    assert.equal(e[config.result].hidden, true);
    form.requestSubmit(); assert.ok(e[config.error].textContent);
    config.fill(e); const original = e[config.source].value;
    form.requestSubmit(); assert.equal(e[config.result].hidden, false); assert.equal(e[config.source].value, original); config.verify(e);
    await e['copy-result'].handlers.click(); assert.equal(clipboard.copied, e[config.output].value);
    clipboard.writeText = async () => { throw new Error('denied'); };
    await e['copy-result'].handlers.click(); assert.match(e['copy-status'].textContent, /직접/);
    assert.equal(e[config.output].selected, true);
    if (config.name === 'text-diff') assert.equal(e['copy-details'].open, true);
    let resolve;
    clipboard.writeText = () => new Promise(done => { resolve = done; });
    const pending = e['copy-result'].handlers.click();
    form.handlers.input(); resolve(); await pending;
    assert.equal(e[config.result].hidden, true); assert.equal(e[config.output].value, ''); assert.equal(e['copy-status'].textContent, '');
    e['example-text'].handlers.click(); assert.equal(e[config.result].hidden, false);
    checks++; console.log('PASS - ' + config.name + ' UI: errors, preserved source, safe result, copy fallback and stale-result reset');
  }
  // Invalid JSON must never leave the previous valid result visible.
  const { e, form } = createUI('json-formatter', configurations[1].ids);
  e['json-mode'].value = '2'; e['json-input'].value = '{}'; form.requestSubmit();
  e['json-input'].value = '{"a":}'; form.requestSubmit();
  assert.equal(e['json-result'].hidden, true); assert.equal(e['json-output'].value, ''); assert.ok(e['json-error'].textContent);
  checks++; console.log('PASS - invalid JSON replaces a prior successful result with an error');
  for (const config of configurations) {
    const html = fs.readFileSync(path.join(__dirname, '../tools/' + config.name + '.html'), 'utf8');
    assert.equal((html.match(/ad-banner-isolated\.js\?v=20261027-banner/g) || []).length, 1);
    assert.ok(!html.includes('maxlength='));
    assert.ok(!fs.readFileSync(path.join(__dirname, '../tools/' + config.name + '.js'), 'utf8').includes('innerHTML'));
    assert.match(html, new RegExp('rel="canonical" href="https://harukok.com/tools/' + config.name + '"'));
  }
  checks++; console.log('PASS - all three pages have one isolated banner, canonical and no silent input truncation');
}
verifyUI().then(() => console.log(checks + ' text-utility checks passed')).catch(error => { console.error(error); process.exitCode = 1; });
