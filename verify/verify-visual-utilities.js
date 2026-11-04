'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { aspectRatio } = require('../tools/aspect-ratio-calculator');
const { convertColor } = require('../tools/color-converter');
const { rotationTransform, validateRotateFile, rotatedFileName } = require('../tools/image-rotate-flip');
let checks = 0;
function test(name, fn) { fn(); checks++; console.log('PASS - ' + name); }

test('Aspect ratio reduction, both target axes and integer rounding', () => {
  assert.deepEqual(aspectRatio(1920, 1080, 'width', 1280), { ratio: '16:9', width: 1280, height: 720, rounded: false, exact: 720 });
  assert.equal(aspectRatio(1080, 1920, 'height', 1280).width, 720);
  assert.equal(aspectRatio(3, 2, 'width', 100).height, 67);
  assert.equal(aspectRatio(3, 2, 'width', 100).rounded, true);
  assert.equal(aspectRatio(100000, 1, 'width', 1).height, 1);
  assert.equal(aspectRatio(1, 100000, 'height', 1).width, 1);
  for (const dimensions of [[0, 1, 'width', 1], [1, 0, 'width', 1], [1.2, 3, 'width', 4], [100001, 1, 'width', 1], [1, 1, 'other', 1], [1, 1, 'width', NaN]]) assert.throws(() => aspectRatio(...dimensions));
});
test('HEX shortcuts, primaries, gray and HSL hue wrap', () => {
  assert.equal(convertColor('hex', ['#f00']).hex, '#FF0000');
  assert.deepEqual(convertColor('hex', ['#FF0000']).rgb, [255, 0, 0]);
  assert.equal(convertColor('hsl', [360, 100, 50]).hex, '#FF0000');
  assert.equal(convertColor('hsl', [120, 100, 50]).hex, '#00FF00');
  assert.equal(convertColor('hsl', [240, 100, 50]).hex, '#0000FF');
  assert.equal(convertColor('hsl', [240, 0, 50]).hex, '#808080');
  assert.deepEqual(convertColor('hex', ['#000']).hsl, { h: 0, s: 0, l: 0 });
  assert.deepEqual(convertColor('hex', ['#fff']).hsl, { h: 0, s: 0, l: 100 });
  for (const hex of ['', '#12', '#abcd', '#12345678', '#GGGGGG', '<script>']) assert.throws(() => convertColor('hex', [hex]));
  for (const rgb of [[-1, 0, 0], [256, 0, 0], [0.5, 0, 0], [NaN, 0, 0], [0, 0]]) assert.throws(() => convertColor('rgb', rgb));
  for (const hsl of [[361, 100, 50], [-1, 50, 50], [0, 101, 50], [0, 10, -1], [NaN, 0, 0]]) assert.throws(() => convertColor('hsl', hsl));
});
test('RGB to HSL and back keeps channel values across a color cube', () => {
  for (const r of [0, 51, 102, 153, 204, 255]) for (const g of [0, 51, 102, 153, 204, 255]) for (const b of [0, 51, 102, 153, 204, 255]) {
    const { h, s, l } = convertColor('rgb', [r, g, b]).hsl;
    assert.deepEqual(convertColor('hsl', [h, s, l]).rgb, [r, g, b]);
  }
});
test('Rotation matrices move all corners into the output without scaling', () => {
  for (const rotation of [0, 90, 180, 270]) for (const flipX of [false, true]) for (const flipY of [false, true]) {
    const result = rotationTransform(3, 2, rotation, flipX, flipY);
    assert.deepEqual([result.width, result.height], rotation % 180 ? [2, 3] : [3, 2]);
    const [a, b, c, d, e, f] = result.matrix;
    const corners = [[0, 0], [3, 0], [0, 2], [3, 2]].map(([x, y]) => [a * x + c * y + e, b * x + d * y + f]);
    assert.deepEqual(new Set(corners.map(point => point.join(','))), new Set([[0, 0], [result.width, 0], [0, result.height], [result.width, result.height]].map(point => point.join(','))));
    assert.equal(Math.abs(a * d - b * c), 1);
  }
  assert.deepEqual(rotationTransform(3, 2, 90).matrix, [0, 1, -1, 0, 2, 0]);
  assert.deepEqual(rotationTransform(3, 2, 90, true).matrix, [0, 1, 1, 0, 0, 0]);
  assert.deepEqual(rotationTransform(3, 2, 270).matrix, [0, -1, 1, 0, 0, 3]);
  assert.throws(() => rotationTransform(4000, 3001, 90));
  assert.throws(() => rotationTransform(3, 2, 45));
  assert.throws(() => rotationTransform(0, 2, 90));
  assert.doesNotThrow(() => rotationTransform(4000, 3000, 90));
});
test('Image input limits, supported types and safe download names', () => {
  validateRotateFile({ size: 10 * 1024 * 1024, type: 'image/png', name: 'a.png' });
  validateRotateFile({ size: 1, type: '', name: 'A.JPEG' });
  for (const file of [null, { size: 0, type: 'image/png' }, { size: 10 * 1024 * 1024 + 1, type: 'image/png' }, { size: 10, type: 'image/svg+xml', name: 'x.svg' }]) assert.throws(() => validateRotateFile(file));
  assert.equal(rotatedFileName('photo.jpg'), 'photo-rotated.png');
  assert.equal(rotatedFileName('../x:y.jpg'), '.._x_y-rotated.png');
});

function fixture(slug, defaults = {}, extra = {}) {
  const html = fs.readFileSync(path.join(__dirname, '../tools/' + slug + '.html'), 'utf8');
  const elements = {};
  for (const [, id] of html.matchAll(/\bid="([^"]+)"/g)) elements[id] = { value: '', textContent: '', hidden: false, checked: false, disabled: false, files: [], style: {}, handlers: {}, attrs: {},
    addEventListener(name, fn) { this.handlers[name] = fn; },
    removeAttribute(name) { delete this[name]; delete this.attrs[name]; },
    focus() { this.focused = true; }, select() { this.selected = true; }, scrollIntoView() {} };
  for (const [id, value] of Object.entries(defaults)) Object.assign(elements[id], value);
  for (const element of Object.values(elements)) element.requestSubmit = () => element.handlers.submit({ preventDefault() {} });
  const clipboard = { copied: '', writeText: async text => { clipboard.copied = text; } };
  const window = { handlers: {}, addEventListener(event, fn) { this.handlers[event] = fn; } };
  const document = { getElementById(id) { return elements[id] || null; }, ...extra.document };
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../tools/' + slug + '.js'), 'utf8'), { document, navigator: { clipboard }, window, ...extra.context });
  return { elements, clipboard, window, html };
}
test('Aspect UI calculates actual values, preserves input and clears stale output', () => {
  const { elements: e } = fixture('aspect-ratio-calculator', { 'target-axis': { value: 'width' }, 'ratio-result': { hidden: true } });
  e['ratio-form'].requestSubmit(); assert.match(e['ratio-error'].textContent, /모두 입력/);
  for (const [id, value] of Object.entries({ 'source-width': '1920', 'source-height': '1080', 'target-axis': 'width', 'target-size': '1280' })) e[id].value = value;
  e['ratio-form'].requestSubmit();
  assert.equal(e['source-width'].value, '1920'); assert.equal(e['ratio-output'].value, '16:9 · 1280 × 720px');
  assert.equal(e['ratio-result'].hidden, false);
  e['ratio-form'].handlers.input(); assert.equal(e['ratio-result'].hidden, true); assert.equal(e['ratio-output'].value, '');
});
test('Color UI shows the chosen fields and prevents missing channels', () => {
  const { elements: e } = fixture('color-converter', { 'color-mode': { value: 'hex' } });
  assert.equal(e['rgb-fields'].hidden, true); assert.equal(e['hex-fields'].hidden, false);
  e['hex-value'].value = '#B23A2E'; e['color-form'].requestSubmit(); assert.equal(e['hex-result'].textContent, '#B23A2E');
  assert.equal(e['color-preview'].style.backgroundColor, '#B23A2E');
  e['color-mode'].value = 'rgb'; e['color-mode'].handlers.change();
  assert.equal(e['hex-fields'].hidden, true); assert.equal(e['color-result'].hidden, true);
  e['color-form'].requestSubmit(); assert.match(e['color-error'].textContent, /모두 입력/);
  e.red.value = '255'; e.green.value = '0'; e.blue.value = '0'; e['color-form'].requestSubmit();
  assert.equal(e['hex-result'].textContent, '#FF0000'); assert.match(e['color-output'].value, /rgb\(255, 0, 0\)/);
});

function imageFixture() {
  const images = [], canvases = [], revoked = [], urls = [];
  class MockImage { constructor() { images.push(this); } }
  const result = fixture('image-rotate-flip', { rotation: { value: '0' }, 'rotate-controls': { disabled: true }, 'rotate-result': { hidden: true }, 'source-figure': { hidden: true } }, {
    document: { createElement(tag) {
      assert.equal(tag, 'canvas');
      const context = { setTransform(...matrix) { this.matrix = matrix; }, drawImage(...args) { this.drawn = args; }, fillRect() {}, fillText() {} };
      const canvas = { getContext() { return context; }, toBlob(callback, type) { this.callback = callback; this.type = type; }, context };
      canvases.push(canvas); return canvas;
    } },
    context: { Image: MockImage, URL: { createObjectURL(blob) { const url = 'blob:' + (urls.length + 1); urls.push({ url, blob }); return url; }, revokeObjectURL(url) { revoked.push(url); } } }
  });
  function load(name = 'photo.jpg', width = 600, height = 400) {
    result.elements['rotate-file'].files = [{ name, size: 10, type: 'image/jpeg' }];
    result.elements['rotate-file'].handlers.change();
    const image = images.at(-1); image.naturalWidth = width; image.naturalHeight = height;
    return image;
  }
  return { ...result, images, canvases, revoked, urls, load };
}
test('Image UI draws correct canvas dimensions and rejects stale save callbacks', () => {
  const { elements: e, load, canvases, revoked } = imageFixture();
  e['rotate-form'].requestSubmit(); assert.match(e['rotate-error'].textContent, /먼저 사진/);
  const image = load(); image.onload();
  assert.equal(e['rotate-controls'].disabled, false);
  e.rotation.value = '90'; e['rotate-form'].requestSubmit();
  const pending = canvases.at(-1); assert.deepEqual([pending.width, pending.height], [400, 600]);
  assert.deepEqual(pending.context.matrix, [0, 1, -1, 0, 400, 0]);
  assert.equal(e['rotate-submit'].disabled, true);
  e.rotation.value = '180'; e.rotation.handlers.change();
  pending.callback({ type: 'image/png', size: 200 }); assert.equal(e['rotate-result'].hidden, true);
  e['rotate-form'].requestSubmit(); canvases.at(-1).callback({ type: 'image/png', size: 300 });
  assert.equal(e['rotate-result'].hidden, false); assert.equal(e['download-rotated'].download, 'photo-rotated.png');
  const savedURL = e['download-rotated'].href;
  e['flip-horizontal'].checked = true; e['flip-horizontal'].handlers.change();
  assert.equal(e['rotate-result'].hidden, true); assert.equal(e['download-rotated'].href, undefined); assert.ok(revoked.includes(savedURL));
});
test('Image UI ignores outdated loads, handles broken/oversized input and releases URLs', () => {
  const { elements: e, load, window, canvases, revoked, urls } = imageFixture();
  const first = load('old.jpg'), second = load('new.jpg', 100, 200);
  first.onload(); assert.equal(e['rotate-controls'].disabled, true);
  second.onload(); assert.equal(e['source-info'].textContent, '원본 100 × 200px');
  e['rotate-form'].requestSubmit(); canvases.at(-1).callback(null);
  assert.match(e['rotate-error'].textContent, /만들지 못했습니다/); assert.equal(e['rotate-submit'].disabled, false);
  const oversized = load('large.jpg', 4000, 3001); oversized.onload(); assert.match(e['rotate-error'].textContent, /1,200만/); assert.equal(e['rotate-controls'].disabled, true);
  const broken = load(); broken.onerror(); assert.match(e['rotate-error'].textContent, /읽지 못했습니다/);
  const last = load(); last.onload(); e['rotate-file'].value = 'chosen.jpg'; window.handlers.pagehide();
  assert.equal(e['rotate-controls'].disabled, true); assert.equal(e['source-figure'].hidden, true);
  assert.equal(e['rotate-file'].value, '');
  assert.ok(urls.every(({ url }) => revoked.includes(url)));
});

async function clipboardChecks() {
  for (const [slug, values, copy, output, form, result] of [
    ['aspect-ratio-calculator', { 'source-width': '1920', 'source-height': '1080', 'target-axis': 'width', 'target-size': '1280' }, 'copy-ratio', 'ratio-output', 'ratio-form', 'ratio-result'],
    ['color-converter', { 'color-mode': 'hex', 'hex-value': '#B23A2E' }, 'copy-color', 'color-output', 'color-form', 'color-result']
  ]) {
    const { elements: e, clipboard } = fixture(slug, slug === 'color-converter' ? { 'color-mode': { value: 'hex' } } : {});
    for (const [id, value] of Object.entries(values)) e[id].value = value;
    e[form].requestSubmit(); await e[copy].handlers.click(); assert.equal(clipboard.copied, e[output].value);
    clipboard.writeText = async () => { throw new Error('denied'); }; await e[copy].handlers.click();
    assert.match(e['copy-status'].textContent, /직접 복사/); assert.equal(e[output].selected, true);
    let finish; clipboard.writeText = () => new Promise(resolve => { finish = resolve; });
    const pending = e[copy].handlers.click(); e[form].handlers.input(); finish(); await pending;
    assert.equal(e['copy-status'].textContent, ''); assert.equal(e[result].hidden, true);
  }
  checks++; console.log('PASS - clipboard success, fallback and stale-response handling');
}
clipboardChecks().then(() => {
  for (const slug of ['aspect-ratio-calculator', 'color-converter', 'image-rotate-flip']) {
    const html = fs.readFileSync(path.join(__dirname, '../tools/' + slug + '.html'), 'utf8');
    assert.equal((html.match(/ad-banner-isolated\.js/g) || []).length, 1);
    assert.ok(html.includes('href="https://harukok.com/tools/' + slug + '"'));
  }
  console.log(checks + ' visual utility checks passed');
}).catch(error => { console.error(error); process.exitCode = 1; });
