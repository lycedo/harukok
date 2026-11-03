'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { checkContrast, relativeLuminance, contrastHex } = require('../tools/color-contrast-checker');
const { makeGradient } = require('../tools/gradient-generator');
const { paperSize, A_PAPER_SIZES } = require('../tools/paper-size-calculator');
const { mergeLayout, validateMergeFiles } = require('../tools/image-merger');
const { watermarkSettings, watermarkPlacement, validateEditFile } = require('../tools/image-watermark');
const { mosaicRegion } = require('../tools/image-mosaic');
let checks = 0;
async function test(name, fn) { await fn(); checks++; console.log('PASS - ' + name); }
const tick = async () => { for (let i = 0; i < 6; i++) await Promise.resolve(); };

function fixture(slug, defaults = {}) {
  const html = fs.readFileSync(path.join(__dirname, '../tools/' + slug + '.html'), 'utf8');
  const elements = {};
  for (const [, id] of html.matchAll(/\bid="([^"]+)"/g)) elements[id] = { value: '', hidden: false, disabled: false, checked: false, textContent: '', files: [], style: {}, handlers: {},
    addEventListener(name, fn) { this.handlers[name] = fn; }, removeAttribute(name) { delete this[name]; },
    focus() { this.focused = true; }, select() { this.selected = true; }, scrollIntoView() {} };
  for (const [id, value] of Object.entries(defaults)) if (elements[id]) Object.assign(elements[id], value);
  for (const e of Object.values(elements)) e.requestSubmit = () => e.handlers.submit({ preventDefault() {} });
  const images = [], canvases = [], revoked = [], created = [], handlers = {};
  class MockImage { constructor() { images.push(this); } }
  class MockFile { constructor(parts, name, options) { this.name = name; this.type = options.type; this.size = parts.reduce((sum, p) => sum + p.size, 0); } }
  const document = { getElementById(id) { assert.ok(elements[id], 'HTML must contain ' + id); return elements[id]; }, createElement(tag) {
    assert.equal(tag, 'canvas');
    const ops = [], c = { drawImage(...args) { ops.push(['drawImage', ...args]); }, clearRect(...args) { ops.push(['clearRect', ...args]); }, fillRect(...args) { ops.push(['fillRect', ...args]); }, fillText(...args) { ops.push(['fillText', ...args]); }, measureText(text) { return { width: Array.from(text).length * Number((this.font || '10px').match(/([\d.]+)px/)[1]) * 0.6 }; } };
    const canvas = { width: 1, height: 1, ops, context: c, callbacks: [], getContext() { return c; }, toBlob(fn, type) { this.callbacks.push({ fn, type }); } }; canvases.push(canvas); return canvas;
  } };
  const clipboard = { copied: '', writeText: async text => { clipboard.copied = text; } };
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../tools/' + slug + '.js'), 'utf8'), {
    document, navigator: { clipboard }, Image: MockImage, File: MockFile,
    URL: { createObjectURL(value) { const url = 'blob:test-' + created.length; created.push({ value, url }); return url; }, revokeObjectURL(url) { revoked.push(url); } },
    window: { addEventListener(name, fn) { handlers[name] = fn; } }
  });
  return { e: elements, images, canvases, revoked, created, handlers, clipboard, html,
    load(index, width = 600, height = 400) { const img = images[index]; img.naturalWidth = width; img.naturalHeight = height; img.onload(); } };
}
const imageDefaults = { 'font-percent': { value: '5' }, opacity: { value: '60' }, 'watermark-text': { value: 'HARUKOK' }, 'text-color': { value: '#FFFFFF' }, 'text-position': { value: 'bottom-right' }, 'image-result': { hidden: true }, 'image-controls': { disabled: true }, 'source-figure': { hidden: true } };
const png = (name = 'photo.png', size = 100) => ({ name, type: 'image/png', size });

async function main() {
  await test('WCAG sRGB contrast primaries, symmetry and actual threshold boundaries', () => {
    assert.equal(relativeLuminance('#000'), 0); assert.equal(relativeLuminance('#fff'), 1);
    assert.equal(checkContrast('#000', '#fff').ratio, 21); assert.equal(checkContrast('#fff', '#000').ratio, 21);
    assert.equal(checkContrast('#123456', '#123456').ratio, 1);
    const dark = checkContrast('#767676', '#fff'), light = checkContrast('#777777', '#fff');
    assert.ok(dark.ratio > 4.5); assert.equal(dark.normalAA, true); assert.equal(light.normalAA, false);
    assert.equal(light.largeAA, true); assert.equal(light.normalAAA, false);
    assert.equal(contrastHex('#AbC'), '#AABBCC');
    for (const input of ['', '#abcd', '#12345678', 'red', '<script>']) assert.throws(() => checkContrast(input, '#fff'));
  });
  await test('Gradient code only contains validated HEX values and a bounded angle', () => {
    assert.equal(makeGradient('#123', '#f00', 90).css, 'background: linear-gradient(90deg, #112233 0%, #FF0000 100%);');
    assert.equal(makeGradient('#000', '#fff', 360).angle, 360);
    for (const angle of ['', -1, 361, Infinity, 'bad']) assert.throws(() => makeGradient('#000', '#fff', angle));
    assert.throws(() => makeGradient('url(https://example.com)', '#fff', 0));
  });
  await test('A-series dimensions, A4 pixel examples, orientation and invalid DPI', () => {
    assert.deepEqual(A_PAPER_SIZES.A0, [841, 1189]);
    const a4 = paperSize('A4', 300, 'portrait'); assert.equal(a4.pixelWidth, 2480); assert.equal(a4.pixelHeight, 3508);
    const half = paperSize('A4', 150, 'portrait'); assert.equal(half.pixelWidth, 1240); assert.equal(half.pixelHeight, 1754);
    assert.equal(paperSize('A3', 300, 'landscape').width, 420);
    for (const dpi of ['', 0, 71, 1201, 300.5, NaN]) assert.throws(() => paperSize('A4', dpi, 'portrait'));
    assert.throws(() => paperSize('__proto__', 300, 'portrait')); assert.throws(() => paperSize('A4', 300, 'other'));
  });
  await test('Collage tile positions preserve aspect and place odd grid tiles without cropping', () => {
    const dims = [{ width: 400, height: 200 }, { width: 200, height: 400 }];
    const r = mergeLayout(dims, 'horizontal', 600);
    assert.deepEqual(r, { width: 1200, height: 600, scaled: false, tiles: [{ x: 0, y: 150, width: 600, height: 300 }, { x: 750, y: 0, width: 300, height: 600 }] });
    assert.equal(mergeLayout(dims, 'vertical', 600).height, 1200);
    const grid = mergeLayout([...dims, { width: 100, height: 100 }], 'grid', 600);
    assert.equal(grid.width, 1200); assert.equal(grid.height, 1200); assert.equal(grid.tiles[2].x, 0); assert.equal(grid.tiles[2].y, 600);
    const scaled = mergeLayout(Array(6).fill({ width: 2000, height: 2000 }), 'vertical', 2000);
    assert.equal(scaled.scaled, true); assert.ok(scaled.width * scaled.height <= 12000000);
    for (const t of scaled.tiles) { assert.ok(t.x >= 0 && t.y >= 0 && t.x + t.width <= scaled.width + 1e-8 && t.y + t.height <= scaled.height + 1e-8); assert.equal(t.width, t.height); }
    assert.throws(() => mergeLayout(dims, 'bad', 600)); assert.throws(() => mergeLayout(dims, 'grid', 0)); assert.throws(() => mergeLayout([{ width: 1, height: 1 }], 'grid', 600));
  });
  await test('Image count, type, pixel and total file limits reject invalid sources', () => {
    validateMergeFiles(Array.from({ length: 6 }, () => png('p.png', 5 * 1024 * 1024)));
    assert.throws(() => validateMergeFiles([png()]));
    assert.throws(() => validateMergeFiles(Array.from({ length: 6 }, () => png('p.png', 6 * 1024 * 1024))));
    assert.throws(() => validateMergeFiles([png(), png('p.png', 10 * 1024 * 1024 + 1)]));
    assert.throws(() => validateMergeFiles([png(), { name: 'p.svg', type: 'image/svg+xml', size: 1 }]));
    validateEditFile({ name: 'PHOTO.JPG', type: '', size: 1 });
    assert.throws(() => validateEditFile(png('p.png', 0)));
    assert.throws(() => mergeLayout([{ width: 4000, height: 3001 }, { width: 2, height: 2 }], 'grid', 600));
  });
  await test('Watermark sizing, all positions, character limits and overflow', () => {
    assert.deepEqual(watermarkSettings(600, 400, 'HARUKOK', 5, 60, '#FFFFFF'), { text: 'HARUKOK', fontSize: 30, opacity: 0.6, color: '#FFFFFF' });
    assert.deepEqual(watermarkPlacement(100, 100, 20, 10, 'top-left'), { x: 3, y: 3 });
    assert.deepEqual(watermarkPlacement(100, 100, 20, 10, 'bottom-right'), { x: 77, y: 85 });
    assert.deepEqual(watermarkPlacement(100, 100, 20, 10, 'center'), { x: 40, y: 44 });
    for (const pos of ['bottom-left', 'top-right']) assert.ok(watermarkPlacement(100, 100, 20, 10, pos).x >= 3);
    watermarkSettings(600, 400, '😀'.repeat(60), 1, 100, '#000000');
    for (const text of ['', ' ', 'a'.repeat(61), 'a\nb']) assert.throws(() => watermarkSettings(600, 400, text, 5, 60, '#FFFFFF'));
    assert.throws(() => watermarkPlacement(100, 100, 100, 10, 'center'));
    assert.throws(() => watermarkSettings(600, 400, 'A', 0, 60, '#FFFFFF'));
    assert.throws(() => watermarkSettings(600, 400, 'A', 5, 0, '#FFFFFF'));
    assert.throws(() => watermarkSettings(600, 400, 'A', 5, 60, '#123456'));
  });
  await test('Mosaic region validates exact boundaries and computes reduced pixels', () => {
    assert.deepEqual(mosaicRegion(600, 400, 150, 100, 300, 200, 20), { x: 150, y: 100, width: 300, height: 200, smallWidth: 15, smallHeight: 10 });
    assert.equal(mosaicRegion(600, 400, 0, 0, 600, 400, 500).smallWidth, 2);
    for (const args of [[-1, 0, 1, 1, 20], [0, 0, 601, 1, 20], [0, 399, 1, 2, 20], [0, 0, 0, 1, 20], [0, 0, 1, 1, 1], [0, 0, 1.5, 1, 20]]) assert.throws(() => mosaicRegion(600, 400, ...args));
  });
  await test('Contrast, gradient and paper UIs execute examples and invalidate stale results', () => {
    for (const [slug, expected] of [['color-contrast-checker', '일반 글자 AA: 통과'], ['gradient-generator', 'linear-gradient(90deg'], ['paper-size-calculator', '2480 × 3508px']]) {
      const { e } = fixture(slug, { result: { hidden: true } });
      e.example.handlers.click(); assert.equal(e.result.hidden, false); assert.ok(e['result-text'].value.includes(expected));
      e.calculator.handlers.input(); assert.equal(e.result.hidden, true); assert.equal(e['result-text'].value, '');
      e.example.handlers.click(); assert.equal(e.error.textContent, '');
    }
  });
  await test('Single-image UI blocks old loads, clears old output and preserves the original selection', () => {
    for (const slug of ['image-watermark', 'image-mosaic']) {
      const f = fixture(slug, imageDefaults), e = f.e;
      e['image-file'].files = [png('first.png')]; e['image-file'].handlers.change();
      e['image-file'].files = [png('second.png')]; e['image-file'].value = 'second.png'; e['image-file'].handlers.change();
      f.load(0); assert.equal(e['image-controls'].disabled, true); f.load(1); assert.equal(e['image-controls'].disabled, false);
      e['image-form'].requestSubmit(); const canvas = f.canvases[0]; assert.equal(canvas.width, 600); assert.equal(canvas.height, 400);
      const id = slug === 'image-watermark' ? 'opacity' : 'block-size'; e[id].handlers.input();
      canvas.callbacks[0].fn({ type: 'image/png', size: 100 }); assert.equal(e['image-result'].hidden, true);
      e['image-form'].requestSubmit(); f.canvases.at(-1 - (slug === 'image-mosaic' ? 1 : 0)).callbacks[0].fn({ type: 'image/png', size: 100 });
      assert.equal(e['image-result'].hidden, false); assert.ok(e['download-image'].href.startsWith('blob:')); assert.equal(e['image-file'].value, 'second.png');
      if (slug === 'image-watermark') assert.ok(f.canvases[0].ops.some(op => op[0] === 'fillText' && op[1] === 'HARUKOK'));
      else { assert.ok(f.canvases[0].ops.some(op => op[0] === 'clearRect')); assert.equal(f.canvases[0].context.imageSmoothingEnabled, false); }
      f.handlers.pagehide(); assert.equal(e['image-file'].value, ''); assert.equal(e['image-result'].hidden, true); assert.equal(e['image-controls'].disabled, true); assert.ok(f.revoked.length >= 3);
    }
  });
  await test('Watermark overflow is a recoverable error and no downloadable partial image appears', () => {
    const f = fixture('image-watermark', imageDefaults), e = f.e;
    e['image-file'].files = [png()]; e['image-file'].handlers.change(); f.load(0);
    e['watermark-text'].value = 'x'.repeat(60); e['image-form'].requestSubmit(); assert.match(e['image-error'].textContent, /밖으로/); assert.equal(e['image-result'].hidden, true);
    e['watermark-text'].value = 'A'; e['image-form'].requestSubmit(); const canvas = f.canvases.at(-1); canvas.callbacks[0].fn(null); assert.match(e['image-error'].textContent, /PNG/); assert.equal(e['image-submit'].disabled, false);
  });
  await test('Collage UI handles multiple loads, stale encodes, PNG download and pagehide cleanup', async () => {
    const f = fixture('image-merger', { 'merge-mode': { value: 'grid' }, 'cell-size': { value: '600' }, 'merge-controls': { disabled: true }, result: { hidden: true } }), e = f.e;
    e['merge-files'].files = [png('old-a.png'), png('old-b.png')]; e['merge-files'].handlers.change();
    e['merge-files'].files = [png('new-a.png'), png('new-b.png')]; e['merge-files'].handlers.change();
    f.load(0); f.load(1); await tick(); assert.equal(e['merge-controls'].disabled, true);
    f.load(2, 400, 200); f.load(3, 200, 400); await tick(); assert.equal(e['merge-controls'].disabled, false); assert.match(e['source-info'].textContent, /new-a/);
    e['merge-form'].requestSubmit(); const c = f.canvases[0]; assert.equal(c.width, 1200); assert.equal(c.height, 600);
    assert.equal(c.ops.filter(op => op[0] === 'drawImage').length, 2);
    e['cell-size'].handlers.change(); c.callbacks[0].fn({ type: 'image/png', size: 100 }); assert.equal(e.result.hidden, true);
    e['merge-form'].requestSubmit(); f.canvases[1].callbacks[0].fn({ type: 'image/png', size: 100 }); assert.equal(e.result.hidden, false); assert.equal(e.download.download, 'harukok-merged.png');
    f.handlers.pagehide(); assert.equal(e['merge-files'].value, ''); assert.equal(e.result.hidden, true); assert.ok(f.revoked.length >= 5);
  });
  await test('Image example buttons create local images without upload and invalid files disable controls', async () => {
    for (const slug of ['image-watermark', 'image-mosaic']) {
      const f = fixture(slug, imageDefaults), e = f.e; e['image-example'].handlers.click();
      f.canvases[0].callbacks[0].fn({ type: 'image/png', size: 100 }); assert.equal(f.images.length, 1); f.load(0); assert.equal(e['image-controls'].disabled, false);
      e['image-file'].files = [{ type: 'text/plain', name: 'bad.txt', size: 10 }]; e['image-file'].handlers.change(); assert.match(e['image-error'].textContent, /JPG/); assert.equal(e['image-controls'].disabled, true);
    }
    const f = fixture('image-merger', { 'merge-mode': { value: 'grid' }, 'cell-size': { value: '600' } }); f.e['merge-example'].handlers.click();
    f.canvases[0].callbacks[0].fn({ type: 'image/png', size: 10 }); f.canvases[1].callbacks[0].fn({ type: 'image/png', size: 10 }); await tick(); assert.equal(f.images.length, 2); f.load(0); f.load(1); await tick(); assert.equal(f.e['merge-controls'].disabled, false);
  });
  await test('Copy UIs handle success, fallback and stale async completion', async () => {
    for (const slug of ['color-contrast-checker', 'gradient-generator', 'paper-size-calculator']) {
      const { e, clipboard } = fixture(slug); e.example.handlers.click(); await e.copy.handlers.click(); assert.equal(clipboard.copied, e['result-text'].value);
      clipboard.writeText = async () => { throw new Error('blocked'); }; await e.copy.handlers.click(); assert.match(e['copy-status'].textContent, /직접 복사/); assert.equal(e['result-text'].selected, true);
      let done; clipboard.writeText = () => new Promise(resolve => { done = resolve; }); const pending = e.copy.handlers.click(); e.calculator.handlers.input(); done(); await pending; assert.equal(e['copy-status'].textContent, '');
    }
  });
  await test('All six pages use canonical URLs, one isolated banner, shared CSS last and safe text rendering', () => {
    for (const slug of ['image-merger', 'image-watermark', 'image-mosaic', 'color-contrast-checker', 'gradient-generator', 'paper-size-calculator']) {
      const html = fs.readFileSync(path.join(__dirname, '../tools/' + slug + '.html'), 'utf8');
      assert.equal((html.match(/ad-banner-isolated\.js/g) || []).length, 1); assert.match(html, /rel="canonical" href="https:\/\/harukok.com\/tools\//);
      assert.ok(html.lastIndexOf('/tools/site-ui.css') > html.lastIndexOf('/tools/tool-controls.css'));
      assert.ok(!fs.readFileSync(path.join(__dirname, '../tools/' + slug + '.js'), 'utf8').includes('innerHTML'));
    }
  });
  console.log(checks + ' creative-expansion checks passed');
}
main().catch(error => { console.error(error); process.exitCode = 1; });
