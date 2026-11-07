'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { calculateGCDLCM } = require('../tools/gcd-lcm-calculator');
const { primeFactorization } = require('../tools/prime-factorization');
const { solveQuadratic, equationResultText } = require('../tools/quadratic-equation-calculator');
const { calculateGeometry } = require('../tools/geometry-calculator');
const { randomIndexBelow, drawRandomNumbers } = require('../tools/random-number-generator');
const { calculateMotion } = require('../tools/speed-distance-time-calculator');
const slugs = ['gcd-lcm-calculator', 'prime-factorization', 'quadratic-equation-calculator', 'geometry-calculator', 'random-number-generator', 'speed-distance-time-calculator'];
let checks = 0;
function test(name, fn) { fn(); checks++; console.log('PASS - ' + name); }
function near(actual, expected, tolerance = 1e-12) { assert.ok(Math.abs(actual - expected) <= tolerance * Math.max(1e-300, Math.abs(expected)), actual + ' != ' + expected); }

test('GCD and LCM are exact for multiple inputs and integers beyond Number precision', () => {
  assert.deepEqual(calculateGCDLCM('12, 18\n30'), { gcd: '6', lcm: '180', count: 3 });
  assert.deepEqual(calculateGCDLCM('7'), { gcd: '7', lcm: '7', count: 1 });
  assert.equal(calculateGCDLCM('1000000000 999999937').lcm, '999999937000000000');
  assert.equal(calculateGCDLCM('1000000000 999999937').gcd, '1');
  assert.equal(calculateGCDLCM('12 12 12').lcm, '12');
  assert.equal(calculateGCDLCM(Array(50).fill('1').join(' ')).count, 50);
  for (let a = 1; a <= 25; a++) for (let b = 1; b <= 25; b++) {
    let gcd = 1; for (let d = 1; d <= Math.min(a, b); d++) if (a % d === 0 && b % d === 0) gcd = d;
    const r = calculateGCDLCM(a + ' ' + b);
    assert.equal(r.gcd, String(gcd)); assert.equal(r.lcm, String(a * b / gcd));
  }
});
test('GCD/LCM rejects zero, noninteger, overly large and excessive inputs', () => {
  for (const raw of ['', ' ', ', ,', '0', '-2', '1.2', '1e3', '1000000001', '1'.repeat(1000), '1,000']) assert.throws(() => calculateGCDLCM(raw));
  assert.throws(() => calculateGCDLCM(', ,'), /정수를 한 개/);
  assert.throws(() => calculateGCDLCM(Array(51).fill('1').join(' ')), /50/);
  assert.throws(() => calculateGCDLCM('1' + ' '.repeat(2000)), /2,000/);
});
test('Prime powers, divisors, one and large primes are classified correctly', () => {
  const r = primeFactorization('360');
  assert.deepEqual(r.factors, [{ prime: '2', exponent: 3 }, { prime: '3', exponent: 2 }, { prime: '5', exponent: 1 }]);
  assert.equal(r.expression, '2^3 × 3^2 × 5'); assert.equal(r.divisorCount, 24); assert.equal(r.isPrime, false);
  assert.deepEqual(r.divisors, Array.from({ length: 360 }, (_, i) => i + 1).filter(n => 360 % n === 0).map(String));
  assert.equal(primeFactorization('1').isPrime, false); assert.deepEqual(primeFactorization('1').divisors, ['1']);
  assert.equal(primeFactorization('2').isPrime, true); assert.equal(primeFactorization('9999999967').isPrime, true);
  const large = primeFactorization('1000000000000'); assert.equal(large.expression, '2^12 × 5^12'); assert.equal(large.divisorCount, 169);
  assert.equal(large.divisors.at(-1), '1000000000000');
});
test('Prime factorization validates syntax and strict domain bounds', () => {
  for (const raw of ['', 0, '-1', '1.5', '1e3', '1,000', '1000000000001', null, true, '9'.repeat(1000)]) assert.throws(() => primeFactorization(raw));
});
test('Quadratic roots, signs, repeated roots and linear degeneracies match independent values', () => {
  assert.deepEqual(solveQuadratic(1, -3, 2).roots, [1, 2]); assert.equal(solveQuadratic(1, -3, 2).discriminant, 1);
  assert.deepEqual(solveQuadratic(-1, 3, -2).roots, [1, 2]);
  assert.deepEqual(solveQuadratic(1, 2, 1).roots, [-1]); assert.equal(solveQuadratic(1, 2, 1).kind, 'repeated');
  assert.equal(solveQuadratic(1, 0, 1).kind, 'complex'); assert.match(equationResultText(solveQuadratic(1, 0, 1)), /복소수 해/);
  assert.deepEqual(solveQuadratic(0, 2, -6).roots, [3]); assert.equal(solveQuadratic(0, 0, 0).kind, 'all');
  assert.equal(solveQuadratic(0, 0, 1).kind, 'none'); assert.equal(Object.is(solveQuadratic(1, 0, 0).roots[0], -0), false);
});
test('Stable quadratic formula preserves a small root and refuses unrepresentable arithmetic', () => {
  const r = solveQuadratic(1, 1000000000, 1);
  near(r.roots[0], -1e9); near(r.roots[1], -1e-9); near(r.roots[0] * r.roots[1], 1);
  const positive = solveQuadratic(1, -1000000000, 1); near(positive.roots[0], 1e-9); near(positive.roots[1], 1e9);
  assert.throws(() => solveQuadratic('1e-200', '0', '1e-200'));
  assert.throws(() => solveQuadratic(0, 1e9, '5e-324'));
  for (const raw of ['', ' ', 'x', '0x10', '1000000001', true, null, '1e309', '1e-9999']) assert.throws(() => solveQuadratic(raw, '1', '1'));
});
test('Circle, rectangle and triangle areas and units use the selected lengths', () => {
  const circle = calculateGeometry('circle', ['3'], 'cm'); near(circle.area, Math.PI * 9); near(circle.perimeter, Math.PI * 6);
  const rectangle = calculateGeometry('rectangle', ['3', '4'], 'm'); assert.equal(rectangle.area, 12); assert.equal(rectangle.perimeter, 14); assert.equal(rectangle.unit, 'm');
  for (const sides of [[3, 4, 5], [5, 3, 4], [4, 5, 3]]) { const triangle = calculateGeometry('triangle', sides); assert.equal(triangle.area, 6); assert.equal(triangle.perimeter, 12); }
  near(calculateGeometry('triangle', [2, 2, 3]).area, 3 * Math.sqrt(7) / 4);
});
test('Geometry rejects degenerate triangles, invalid lengths and units', () => {
  for (const sides of [[1, 2, 3], [3, 1, 1], [1e9, 1, 1]]) assert.throws(() => calculateGeometry('triangle', sides));
  for (const value of ['', 0, -1, true, null, '1e309', '1000000001', '1e-999']) assert.throws(() => calculateGeometry('circle', [value]));
  assert.throws(() => calculateGeometry('circle', ['1e-200']));
  assert.throws(() => calculateGeometry('circle', [1], '__proto__')); assert.throws(() => calculateGeometry('other', [1]));
});
function sequenceRandom() { let state = 1729; return () => { state = (Math.imul(1664525, state) + 1013904223) >>> 0; return state; }; }
test('Cryptographic integer mapping rejects biased overflow and samples distinct values efficiently', () => {
  let calls = 0; assert.equal(randomIndexBelow(10, () => calls++ === 0 ? 4294967295 : 7), 7); assert.equal(calls, 2);
  assert.equal(randomIndexBelow(4294967296, () => 4294967295), 4294967295);
  const full = drawRandomNumbers(-3, 3, 7, false, sequenceRandom()); assert.deepEqual(full.slice().sort((a, b) => a - b), [-3, -2, -1, 0, 1, 2, 3]);
  assert.deepEqual(drawRandomNumbers(7, 7, 3, true, () => 0), [7, 7, 7]);
  assert.deepEqual(drawRandomNumbers(1, 5, 5, false, () => 0), [1, 5, 4, 3, 2]);
  const many = drawRandomNumbers(-1000000000, 1000000000, 1000, false, sequenceRandom()); assert.equal(new Set(many).size, 1000); assert.ok(many.every(n => n >= -1e9 && n <= 1e9));
});
test('Random number inputs enforce finite integer ranges and possible sample counts', () => {
  for (const values of [[2, 1, 1], [1, 2, 3], [1, 2, 0], [1, 2, 1001], ['1.5', 3, 1], ['', 3, 1], [-1000000001, 2, 1]]) assert.throws(() => drawRandomNumbers(...values));
  assert.throws(() => drawRandomNumbers(1, 2, 1, 'yes')); assert.throws(() => randomIndexBelow(0)); assert.throws(() => randomIndexBelow(10, () => -1));
});
const standardUnits = { distance: 'km', time: 'h', speed: 'kmh' };
test('Speed, distance and time convert units consistently in each solving direction', () => {
  const speed = calculateMotion('speed', { distance: 120, time: 2 }, standardUnits); near(speed.speedMetresPerSecond * 3.6, 60); assert.equal(speed.distanceMetres, 120000); assert.equal(speed.timeSeconds, 7200);
  const distance = calculateMotion('distance', { speed: 60, time: 30 }, { ...standardUnits, time: 'min' }); near(distance.distanceMetres, 30000);
  const time = calculateMotion('time', { distance: 100, speed: 10 }, { distance: 'm', time: 's', speed: 'ms' }); assert.equal(time.timeSeconds, 10);
  const seconds = calculateMotion('speed', { distance: 3, time: 6 }, { distance: 'm', time: 's', speed: 'ms' }); assert.equal(seconds.speedMetresPerSecond, 0.5);
});
test('Motion calculation rejects missing, nonpositive, overflowing and invalid-unit inputs', () => {
  for (const value of ['', ' ', 0, -1, null, true, 'Infinity', '1e-999', '1000000001']) assert.throws(() => calculateMotion('speed', { distance: value, time: 1 }, standardUnits));
  assert.throws(() => calculateMotion('other', {}, standardUnits)); assert.throws(() => calculateMotion('speed', { distance: 1, time: 1 }, { ...standardUnits, time: '__proto__' }));
  assert.throws(() => calculateMotion('speed', { distance: '5e-324', time: 1e9 }, standardUnits));
});

function loadUI(slug) {
  const html = fs.readFileSync(path.join(__dirname, '../tools/' + slug + '.html'), 'utf8'), ids = {};
  for (const [, id] of html.matchAll(/\bid="([^"]+)"/g)) ids[id] = { value: '', hidden: true, checked: false, textContent: '', handlers: {},
    addEventListener(name, fn) { this.handlers[name] = fn; }, scrollIntoView() { this.scrolled = true; }, focus() { this.focused = true; }, select() { this.selected = true; } };
  for (const [, tag] of html.matchAll(/(<input\b[^>]*>)/g)) {
    const id = tag.match(/\bid="([^"]+)"/)?.[1], value = tag.match(/\bvalue="([^"]*)"/)?.[1]; if (id && value !== undefined) ids[id].value = value;
  }
  if (ids.shape) ids.shape.value = 'circle'; if (ids.unit) ids.unit.value = 'cm';
  if (ids.find) { ids.find.value = 'speed'; ids['distance-unit'].value = 'km'; ids['time-unit'].value = 'h'; ids['speed-unit'].value = 'kmh'; }
  ids.calculator.requestSubmit = () => ids.calculator.handlers.submit({ preventDefault() {} });
  const clipboard = { writeText: async text => { clipboard.copied = text; } }, random32 = sequenceRandom();
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../tools/' + slug + '.js'), 'utf8'), {
    document: { getElementById: id => ids[id] || null }, navigator: { clipboard }, crypto: { getRandomValues(array) { array[0] = random32(); return array; } }, Uint32Array
  });
  return { ids, clipboard };
}
function enterValues(slug, ids) {
  const values = {
    'gcd-lcm-calculator': { numbers: '12, 18, 30' },
    'prime-factorization': { number: '360' },
    'quadratic-equation-calculator': { a: '1', b: '-3', c: '2' },
    'geometry-calculator': { shape: 'triangle', 'side-a': '3', 'side-b': '4', 'side-c': '5', unit: 'cm' },
    'random-number-generator': { min: '1', max: '100', count: '5' },
    'speed-distance-time-calculator': { find: 'speed', distance: '120', time: '2' }
  }[slug];
  for (const [id, value] of Object.entries(values)) ids[id].value = value;
  if (ids.shape) ids.shape.handlers.change(); if (ids.find) ids.find.handlers.change();
  ids.calculator.requestSubmit();
}
test('All six actual browser scripts accept manual input, preserve it and clear stale results', () => {
  for (const slug of slugs) {
    const { ids } = loadUI(slug); enterValues(slug, ids); assert.equal(ids.result.hidden, false, slug); assert.ok(ids['result-text'].value, slug);
    const original = Object.fromEntries(Object.entries(ids).filter(([key]) => !['result-text'].includes(key)).map(([key, value]) => [key, value.value]));
    ids.calculator.handlers.input(); assert.equal(ids.result.hidden, true); assert.equal(ids['result-text'].value, ''); assert.equal(ids.error.textContent, '');
    for (const [key, value] of Object.entries(original)) assert.equal(ids[key].value, value, slug + ': preserve ' + key);
    ids.calculator.requestSubmit(); assert.equal(ids.result.hidden, false);
  }
});
test('Geometry and motion mode switches show only relevant inputs and clear old output', () => {
  const geometry = loadUI('geometry-calculator').ids; assert.equal(geometry['circle-fields'].hidden, false); assert.equal(geometry['triangle-fields'].hidden, true);
  enterValues('geometry-calculator', geometry); assert.match(geometry['result-text'].value, /6cm²/); geometry.shape.value = 'rectangle'; geometry.shape.handlers.change();
  assert.equal(geometry['rectangle-fields'].hidden, false); assert.equal(geometry['circle-fields'].hidden, true); assert.equal(geometry.result.hidden, true);
  const motion = loadUI('speed-distance-time-calculator').ids; enterValues('speed-distance-time-calculator', motion); assert.match(motion['result-text'].value, /60km\/h/);
  motion.find.value = 'time'; motion.find.handlers.change(); assert.equal(motion['time-field'].hidden, true); assert.equal(motion['speed-field'].hidden, false); assert.equal(motion.result.hidden, true);
});
test('All six UIs explain malformed input without changing the original', () => {
  const invalid = { 'gcd-lcm-calculator': 'numbers', 'prime-factorization': 'number', 'quadratic-equation-calculator': 'a', 'geometry-calculator': 'radius', 'random-number-generator': 'min', 'speed-distance-time-calculator': 'distance' };
  for (const slug of slugs) { const { ids } = loadUI(slug); ids[invalid[slug]].value = 'not-a-number'; ids.calculator.requestSubmit(); assert.ok(ids.error.textContent, slug); assert.equal(ids.result.hidden, true); assert.equal(ids[invalid[slug]].value, 'not-a-number'); }
});
async function clipboardChecks() {
  for (const slug of slugs) {
    const { ids, clipboard } = loadUI(slug); enterValues(slug, ids); await ids.copy.handlers.click(); assert.equal(clipboard.copied, ids['result-text'].value);
    clipboard.writeText = async () => { throw new Error('denied'); }; await ids.copy.handlers.click(); assert.match(ids['copy-status'].textContent, /직접 복사/); assert.equal(ids['result-text'].selected, true);
    let finish; clipboard.writeText = () => new Promise(resolve => { finish = resolve; }); const pending = ids.copy.handlers.click(); ids.calculator.handlers.change(); finish(); await pending;
    assert.equal(ids['copy-status'].textContent, ''); assert.equal(ids.result.hidden, true);
  }
  checks++; console.log('PASS - all six clipboard handlers support success, manual fallback and stale-response protection');
}
clipboardChecks().then(() => {
  for (const slug of slugs) {
    const html = fs.readFileSync(path.join(__dirname, '../tools/' + slug + '.html'), 'utf8');
    assert.equal((html.match(/ad-banner-isolated\.js/g) || []).length, 1); assert.match(html, /id="result-text"[^>]*readonly/);
    assert.ok(html.includes('rel="canonical" href="https://harukok.com/tools/' + slug + '"'));
    assert.ok(!fs.readFileSync(path.join(__dirname, '../tools/' + slug + '.js'), 'utf8').includes('innerHTML'));
  }
  checks++; console.log('PASS - one existing isolated banner per page, canonical URLs, readonly text-only results');
  console.log(checks + ' math expansion checks passed');
}).catch(error => { console.error(error); process.exitCode = 1; });
