'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const {FakeDocument, FakeElement} = require('./dom-shim');
const {convertArea, rectangleArea, formatArea} = require('../tools/area-calculator');
let checks = 0;
function same(actual, expected) { assert.deepEqual(actual, expected); checks++; }
function near(actual, expected) { assert.ok(Math.abs(actual - expected) < 1e-10); checks++; }
function invalid(fn) { assert.throws(fn); checks++; }

near(convertArea('sqm', 84).pyeong, 25.41);
near(convertArea('sqm', 59).pyeong, 17.8475);
near(convertArea('sqm', 102).pyeong, 30.855);
near(convertArea('pyeong', 24).squareMetres, 79.33884297520662);
near(convertArea('pyeong', 32).squareMetres, 105.78512396694215);
near(convertArea('sqm', convertArea('pyeong', 32).squareMetres).pyeong, 32);
near(convertArea('sqm', 84.96).pyeong, 25.7004);
same(convertArea('sqm', 0), {squareMetres: 0, pyeong: 0});
same(convertArea('pyeong', 0), {squareMetres: 0, pyeong: 0});
same(convertArea('sqm', 1e9).squareMetres, 1e9);
near(rectangleArea(3, 4).pyeong, 3.63);
near(rectangleArea(3.5, 4.2).squareMetres, 14.7);
same(rectangleArea(0, 4), {squareMetres: 0, pyeong: 0});
same(rectangleArea(1000000, 1000).squareMetres, 1e9);
for (const value of [-1, NaN, Infinity, 1e9 + 1, '', null, '84', Number.MIN_VALUE]) invalid(() => convertArea('sqm', value));
invalid(() => convertArea('bad', 84));
for (const pair of [[-1, 4], [3, -4], [Infinity, 1], [1, NaN], [1000001, 0], [1000000, 1001], [1e-300, 1e-300]]) invalid(() => rectangleArea(...pair));
same(formatArea(25.41), '25.41');
same(formatArea(30.855), '30.86');
same(formatArea(79.33884297520662), '79.34');
same(formatArea(0), '0');
same(formatArea(1e-8), '0.01 미만');
same(formatArea(1e-8, 6), '1.00000e-8');

const root = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'tools/area-calculator.html'), 'utf8');
const code = fs.readFileSync(path.join(root, 'tools/area-calculator.js'), 'utf8');
const doc = new FakeDocument();
doc.registerFromHtml(html);
const $ = id => {
  assert.ok(doc._elements.has(id), 'Missing real HTML element: ' + id);
  return doc.getElementById(id);
};
const examples = [...html.matchAll(/<button[^>]*data-area-example="([^"]+)"/g)].map(match => new FakeElement(doc, 'button', {'data-area-example': match[1]}));
doc.querySelectorAll = selector => selector === '[data-area-example]' ? examples : [];
$('area-unit').value = 'sqm';
$('length-unit').value = 'm';
const submit = id => $(id).dispatchEvent({type: 'submit', preventDefault() {}});
$('area-form').requestSubmit = () => submit('area-form');
$('rectangle-form').requestSubmit = () => submit('rectangle-form');
vm.runInNewContext(code, {document: doc}, {filename: 'area-calculator.js'});
$('area-value').value = '84'; submit('area-form');
same($('area-result-value').textContent, '25.41 평'); same($('area-result').hidden, false);
same($('area-formula').textContent, '84 ㎡ × 121 ÷ 400 = 25.41 평');
$('area-form').dispatchEvent({type: 'input'}); same($('area-result').hidden, true);
$('area-value').value = ''; submit('area-form'); same($('area-result').hidden, true);
assert.ok($('area-error').textContent.includes('입력')); checks++;
$('area-value').value = '-3'; submit('area-form'); same($('area-result').hidden, true);
$('area-unit').value = 'pyeong'; $('area-unit').dispatchEvent({type: 'change'});
same($('area-label').textContent, '면적 (평)'); same($('area-error').textContent, '');
same($('area-result').hidden, true);
same(examples.length, 2);
for (const [i, expected] of ['25.41 평', '105.79 ㎡'].entries()) {
  examples[i].click(); same($('area-result-value').textContent, expected); same($('area-result').hidden, false);
}
$('rectangle-example').click(); same($('rectangle-result-value').textContent, '12 ㎡');
same($('rectangle-pyeong').textContent, '평으로 환산: 3.63 평');
$('rectangle-form').dispatchEvent({type: 'input'}); same($('rectangle-result').hidden, true);
$('room-width').value = ''; submit('rectangle-form'); same($('rectangle-result').hidden, true);
assert.ok($('rectangle-error').textContent.includes('모두')); checks++;
$('room-width').value = '1000000'; $('room-length').value = '1001'; submit('rectangle-form');
assert.ok($('rectangle-error').textContent.includes('10억')); checks++;

$('length-unit').value = 'cm'; $('length-unit').dispatchEvent({type: 'change'});
same($('room-width-label').textContent, '가로 (cm)');
same($('rectangle-result').hidden, true);
$('room-width').value = '300'; $('room-length').value = '400'; submit('rectangle-form');
same($('rectangle-result-value').textContent, '12 ㎡');
same($('rectangle-pyeong').textContent, '평으로 환산: 3.63 평');
$('rectangle-example').click();
same($('length-unit').value, 'm'); same($('room-width-label').textContent, '가로 (m)');
same($('rectangle-result-value').textContent, '12 ㎡');

same((html.match(/<h1>/g) || []).length, 1);
same((html.match(/src="\/ad-banner-isolated.js/g) || []).length, 1);
const schema = JSON.parse(html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]);
same(schema.url, 'https://harukok.com/tools/area-calculator');
assert.ok(html.includes('<link rel="canonical" href="' + schema.url + '">')); checks++;
assert.ok(html.includes('https://jangan.suwon.go.kr/sub_view.asp?menu_id=sub04100105')); checks++;
assert.ok(html.includes('https://www.korea.kr/news/policyNewsView.do?newsId=148890758')); checks++;
for (const match of html.matchAll(/(?:href|src)="(\/[^"#?]*)[^\"]*"/g)) {
  const dest = path.join(root, match[1]);
  assert.ok([dest, dest + '.html', path.join(dest, 'index.html')].some(p => fs.existsSync(p)), 'Missing local link ' + match[1]);
}
assert.doesNotMatch(code, /innerHTML|fetch\(|localStorage|sessionStorage/); checks++;
console.log('PASS - ' + checks + ' area conversion, limits, UI, metadata and isolated-banner checks');
