'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { webcrypto } = require('node:crypto');
const { Worker: NodeWorker } = require('node:worker_threads');
const { transformBase64, MAX_BASE64_TEXT } = require('../tools/base64-converter');
const { parseCSV, convertCSVJSON, MAX_DATA_TEXT } = require('../tools/csv-json-converter');
const { parseUnixValue, convertUnixTime, unixSeconds } = require('../tools/unix-time-converter');
const { generateUUIDs } = require('../tools/uuid-generator');
const { convertNumberBase } = require('../tools/number-base-converter');
const { runRegex } = require('../tools/regex-worker');
const { startRegexJob, regexResultText } = require('../tools/regex-tester');
let checks = 0;
function test(name, fn) { fn(); checks++; console.log('PASS - ' + name); }

test('Base64 UTF-8 round trips preserve Korean, emoji, BOM and whitespace', () => {
  for (const value of ['하루콕 😀', '\uFEFF문자', 'A\r\nB\t ', '\u0000\u0001', '😀'.repeat(500)]) {
    assert.equal(transformBase64(value, 'encode'), Buffer.from(value, 'utf8').toString('base64'));
    assert.equal(transformBase64(transformBase64(value, 'encode'), 'decode'), value);
  }
  assert.equal(transformBase64('Y Q==\r\n', 'decode'), 'a');
  assert.equal(transformBase64('a'.repeat(MAX_BASE64_TEXT), 'encode'), Buffer.from('a'.repeat(MAX_BASE64_TEXT)).toString('base64'));
  assert.equal(transformBase64('A'.repeat(MAX_BASE64_TEXT), 'decode').length, 150000);
  assert.throws(() => transformBase64('A'.repeat(MAX_BASE64_TEXT - 1) + '!', 'decode'));
  for (const value of ['', 'YQ', 'YQ=', 'YR==', '!!!!', 'a===', '/w==', 'SGVsbG8_']) assert.throws(() => transformBase64(value, 'decode'));
  for (const value of ['\uD800', '\uDC00', 'A'.repeat(MAX_BASE64_TEXT + 1)]) assert.throws(() => transformBase64(value, 'encode'));
  assert.throws(() => transformBase64('A', 'bad'));
});

test('CSV quotes, multiline cells, BOM and CRLF are parsed without changing cell strings', () => {
  const raw = '\uFEFF이름,번호,메모\r\n하루콕,001,"쉼표, 따옴표 ""예시""\r\n두 줄"\r\n';
  const result = convertCSVJSON(raw, 'csv-to-json');
  assert.equal(result.rows, 1); assert.equal(result.columns, 3);
  const data = JSON.parse(result.text);
  assert.deepEqual(data, [{ 이름: '하루콕', 번호: '001', 메모: '쉼표, 따옴표 "예시"\r\n두 줄' }]);
  assert.deepEqual(parseCSV(convertCSVJSON(result.text, 'json-to-csv').text), parseCSV(raw));
  assert.deepEqual(parseCSV('a,b\nx,\r'), [['a', 'b'], ['x', '']]);
  assert.deepEqual(parseCSV('a\n""'), [['a'], ['']]);
  assert.equal(convertCSVJSON('a,b', 'csv-to-json').text, '[]');
  assert.deepEqual(JSON.parse(convertCSVJSON('__proto__,constructor\nx,y', 'csv-to-json').text), [JSON.parse('{"__proto__":"x","constructor":"y"}')]);
  const numericHeaders = convertCSVJSON('2,1,__proto__\nx,y,z', 'csv-to-json').text;
  assert.ok(numericHeaders.indexOf('"2"') < numericHeaders.indexOf('"1"'));
  assert.equal(convertCSVJSON(numericHeaders, 'json-to-csv').text, '2,1,__proto__\r\nx,y,z');
});

test('CSV and JSON reject structure loss, duplicate keys and non-string cells', () => {
  for (const raw of ['', 'a,a\n1,2', 'a,\n1,2', 'a,b\n1', 'a\n"oops', 'a\nx"y', 'a\n"x"y']) assert.throws(() => parseCSV(raw));
  for (const raw of ['[]', '[{"a":1}]', '[{"a":null}]', '[{"a":true}]', '[{"a":"x","a":"y"}]', '[{"a":"x","\\u0061":"y"}]', '[{"a":"x"},{"b":"y"}]', '[["a"],["x","y"]]', '[["a","a"],["x","y"]]']) assert.throws(() => convertCSVJSON(raw, 'json-to-csv'));
  const exact = convertCSVJSON('[{"number":"9007199254740993","zero":"001"}]', 'json-to-csv');
  assert.equal(exact.text, 'number,zero\r\n9007199254740993,001');
  assert.equal(convertCSVJSON('[["a","b"],["x","y"]]', 'json-to-csv').text, 'a,b\r\nx,y');
  assert.doesNotThrow(() => parseCSV('a\n' + Array(999).fill('x').join('\n')));
  assert.throws(() => parseCSV('a\n' + Array(1000).fill('x').join('\n')), /1,000/);
  assert.throws(() => parseCSV(Array(101).fill('a').join(',')), /100개/);
  assert.throws(() => convertCSVJSON('x'.repeat(MAX_DATA_TEXT + 1), 'csv-to-json'), /200,000/);
});

test('Unix seconds and milliseconds use explicit fixed zones and preserve signed fractions', () => {
  assert.equal(convertUnixTime('1700000000', 'unix-to-date', 's', 'UTC').local, '2023-11-14T22:13:20.000Z');
  assert.equal(convertUnixTime('1700000000', 'unix-to-date', 's', 'KST').local, '2023-11-15T07:13:20.000+09:00');
  assert.equal(convertUnixTime('2026-11-03T09:00:00.123', 'date-to-unix', 's', 'KST').milliseconds, String(Date.UTC(2026, 10, 3, 0, 0, 0, 123)));
  assert.equal(convertUnixTime('2026-11-03T09:00', 'date-to-unix', 's', 'KST').utc, '2026-11-03T00:00:00.000Z');
  assert.equal(parseUnixValue('-0.001', 's'), -1); assert.equal(unixSeconds(-1), '-0.001'); assert.equal(unixSeconds(-1001), '-1.001');
  assert.equal(convertUnixTime('-1', 'unix-to-date', 'ms', 'UTC').utc, '1969-12-31T23:59:59.999Z');
  for (const zone of ['UTC', 'KST']) for (const value of ['1900-01-01T00:00:00', '2000-02-29T23:59:59.999', '2100-12-31T23:59:59']) {
    const r = convertUnixTime(value, 'date-to-unix', 's', zone);
    assert.equal(convertUnixTime(r.milliseconds, 'unix-to-date', 'ms', zone).local, r.local);
  }
  for (const value of ['1900-02-29T00:00:00', '2026-02-29T00:00:00', '2026-01-01T24:00:00', '2026-01-01T00:60:00', '2026-11-03']) assert.throws(() => convertUnixTime(value, 'date-to-unix', 's', 'KST'));
  assert.throws(() => convertUnixTime('2101-01-01T00:00:00', 'date-to-unix', 's', 'UTC'), /1900/);
  for (const value of ['', '1.0001', '1e3', 'Infinity', '1,000']) assert.throws(() => parseUnixValue(value, 's'));
  assert.throws(() => parseUnixValue('1.5', 'ms')); assert.throws(() => convertUnixTime('0', 'unix-to-date', 's', 'bad'));
});

test('UUID generation obeys v4 and variant bits and uses secure random bytes', () => {
  const ids = generateUUIDs(100, webcrypto);
  assert.equal(new Set(ids).size, 100);
  for (const id of ids) assert.match(id, /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
  assert.equal(generateUUIDs(1, { getRandomValues(bytes) { bytes.fill(255); return bytes; } })[0], 'ffffffff-ffff-4fff-bfff-ffffffffffff');
  assert.throws(() => generateUUIDs(2, { getRandomValues(bytes) { bytes.fill(0); return bytes; } }), /반복/);
  assert.throws(() => generateUUIDs(1, null), /난수/);
  for (const count of [0, -1, 101, 1.5, NaN]) assert.throws(() => generateUUIDs(count, webcrypto));
});

test('Base conversion preserves exact big integers, prefixes and negative sign', () => {
  assert.deepEqual(convertNumberBase('255', 10), { binary: '11111111', octal: '377', decimal: '255', hexadecimal: 'FF' });
  assert.equal(convertNumberBase('-0xFF', 16).decimal, '-255'); assert.equal(convertNumberBase('+0B101', 2).decimal, '5');
  assert.equal(convertNumberBase('9007199254740993', 10).hexadecimal, '20000000000001');
  assert.equal(convertNumberBase('0'.repeat(256), 16).decimal, '0');
  assert.equal(convertNumberBase('F'.repeat(256), 16).binary.length, 1024);
  const hex = 'F'.repeat(200); assert.equal(convertNumberBase(convertNumberBase(hex, 16).decimal, 10).hexadecimal, hex);
  for (const [text, base] of [['2', 2], ['8', 8], ['0x10', 10], ['1.1', 10], ['1e3', 10], ['1,000', 10], ['1 0', 2], ['', 16], ['F'.repeat(257), 16], ['10', 3]]) assert.throws(() => convertNumberBase(text, base));
});

test('Regex matching returns positions and capture groups and advances empty Unicode matches', () => {
  const result = runRegex({ pattern: '(?<word>하루)(콕)', text: '하루콕 하루콕', flags: 'g' });
  assert.equal(result.matches.length, 2); assert.equal(result.matches[1].index, 4);
  assert.deepEqual(result.matches[0].groups, ['하루', '콕']); assert.deepEqual(result.matches[0].named, { word: '하루' });
  assert.equal(runRegex({ pattern: '', text: '😀', flags: 'gu' }).matches.length, 2);
  assert.equal(runRegex({ pattern: '', text: '😀', flags: 'g' }).matches.length, 3);
  assert.equal(runRegex({ pattern: 'a', text: 'aaa', flags: '' }).matches.length, 1);
  assert.equal(runRegex({ pattern: '^A..$', text: 'a\nx', flags: 'is' }).matches.length, 1);
  assert.equal(runRegex({ pattern: 'x', text: 'none', flags: 'g' }).matches.length, 0);
  const capped = runRegex({ pattern: 'a', text: 'a'.repeat(201), flags: 'g' }); assert.equal(capped.matches.length, 200); assert.equal(capped.truncated, true);
  assert.match(regexResultText(result), /이름 그룹/);
  for (const flags of ['gg', 'z', 'y', 'v']) assert.throws(() => runRegex({ pattern: 'a', text: 'a', flags }));
  assert.throws(() => runRegex({ pattern: '(', text: 'a', flags: 'g' }));
  assert.throws(() => runRegex({ pattern: 'a'.repeat(2001), text: 'a', flags: 'g' }));
});

class RealWorkerShim {
  constructor() {
    const workerPath = path.join(__dirname, '../tools/regex-worker.js');
    this.worker = new NodeWorker(`const {parentPort}=require('node:worker_threads'); globalThis.self={postMessage:data=>parentPort.postMessage(data)}; require(${JSON.stringify(workerPath)}); parentPort.on('message',data=>self.onmessage({data}));`, { eval: true });
    this.worker.on('message', data => this.onmessage?.({ data })); this.worker.on('error', error => this.onerror?.(error));
  }
  postMessage(value) { this.worker.postMessage(value); }
  terminate() { this.terminated = true; return this.worker.terminate(); }
}
class FastWorker {
  postMessage(payload) { queueMicrotask(() => { if (this.terminated) return; try { this.onmessage({ data: { result: runRegex(payload) } }); } catch (error) { this.onmessage({ data: { error: error.message } }); } }); }
  terminate() { this.terminated = true; }
}

function fixture(slug) {
  const html = fs.readFileSync(path.join(__dirname, '../tools/' + slug + '.html'), 'utf8');
  const elements = Object.fromEntries([...html.matchAll(/\bid="([^"]+)"/g)].map(([, id]) => [id, { value: '', textContent: '', hidden: true, disabled: false, handlers: {}, addEventListener(type, fn) { this.handlers[type] = fn; }, scrollIntoView() {}, focus() { this.focused = true; }, select() { this.selected = true; } }]));
  const defaults = { 'base64-converter': { mode: 'encode' }, 'csv-json-converter': { mode: 'csv-to-json' }, 'unix-time-converter': { mode: 'unix-to-date', unit: 's', zone: 'KST' }, 'uuid-generator': { count: '1' }, 'number-base-converter': { base: '10' }, 'regex-tester': { flags: 'g' } }[slug];
  for (const [id, value] of Object.entries(defaults)) elements[id].value = value;
  let lastSubmit;
  elements.converter.requestSubmit = () => { lastSubmit = elements.converter.handlers.submit({ preventDefault() {} }); return lastSubmit; };
  const clipboard = { writeText: async value => { clipboard.text = value; } };
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../tools/' + slug + '.js'), 'utf8'), { document: { getElementById: id => elements[id] }, navigator: { clipboard }, crypto: webcrypto, TextEncoder, TextDecoder, btoa, atob, Uint8Array, Worker: FastWorker, setTimeout, clearTimeout, queueMicrotask, window: { addEventListener() {} } });
  return { elements, clipboard, submit: elements.converter.requestSubmit, async example() { elements.example.handlers.click(); await lastSubmit; } };
}

async function asynchronousChecks() {
  const normal = await startRegexJob({ pattern: 'a+', text: 'aaa', flags: 'g' }, RealWorkerShim).promise; assert.equal(normal.matches[0].value, 'aaa');
  const start = Date.now(); await assert.rejects(startRegexJob({ pattern: '(a+)+$', text: 'a'.repeat(12000) + '!', flags: 'g' }, RealWorkerShim, 100).promise, /중단/); assert.ok(Date.now() - start < 3000);
  const pending = startRegexJob({ pattern: 'a', text: 'a', flags: 'g' }, RealWorkerShim); pending.cancel(); await assert.rejects(pending.promise, /취소/);
  await assert.rejects(startRegexJob({ pattern: '(', text: 'a', flags: 'g' }, RealWorkerShim).promise, /문법/);
  checks++; console.log('PASS - real separate-worker execution, hostile regex timeout, cancellation and syntax error');
  for (const slug of ['base64-converter', 'csv-json-converter', 'unix-time-converter', 'uuid-generator', 'number-base-converter', 'regex-tester']) {
    const { elements: e, clipboard, submit, example } = fixture(slug);
    if (slug !== 'uuid-generator') { await submit(); assert.ok(e.error.textContent, slug + ' empty input error'); }
    await example(); assert.equal(e.result.hidden, false, slug + ' result visible'); assert.ok(e.output.value, slug + ' result');
    const source = e.source?.value; await e.copy.handlers.click(); assert.equal(clipboard.text, e.output.value);
    clipboard.writeText = async () => { throw new Error('denied'); }; await e.copy.handlers.click(); assert.match(e['copy-status'].textContent, /직접 복사/); assert.equal(e.output.selected, true);
    let finish; clipboard.writeText = () => new Promise(resolve => { finish = resolve; }); const copying = e.copy.handlers.click(); e.converter.handlers.input(); finish(); await copying;
    assert.equal(e.result.hidden, true); assert.equal(e.output.value, ''); assert.equal(e['copy-status'].textContent, ''); if (e.source) assert.equal(e.source.value, source);
    if (slug === 'base64-converter') { e.source.value = 'A'.repeat(MAX_BASE64_TEXT + 1); await submit(); assert.match(e.error.textContent, /200,000/); assert.equal(e.source.value.length, MAX_BASE64_TEXT + 1); }
  }
  checks++; console.log('PASS - six actual UIs preserve source, recover from errors, copy with fallback and clear stale output');
  for (const slug of ['base64-converter', 'csv-json-converter', 'unix-time-converter', 'uuid-generator', 'number-base-converter', 'regex-tester']) {
    const html = fs.readFileSync(path.join(__dirname, '../tools/' + slug + '.html'), 'utf8');
    assert.equal((html.match(/ad-banner-isolated\.js/g) || []).length, 1); assert.match(html, /<textarea id="output"[^>]*readonly/);
    assert.ok(!html.includes('maxlength=')); assert.ok(!fs.readFileSync(path.join(__dirname, '../tools/' + slug + '.js'), 'utf8').includes('innerHTML'));
  }
  checks++; console.log('PASS - six isolated ad integrations, readonly text rendering and no native input truncation');
  console.log(checks + ' developer-tool checks passed');
}
asynchronousChecks().catch(error => { console.error(error); process.exitCode = 1; });
