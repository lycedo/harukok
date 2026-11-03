'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { calculateFractions } = require('../tools/fraction-calculator');
const { calculateAverage, formatAverageNumber } = require('../tools/average-calculator');
const { sumTimeDurations } = require('../tools/time-duration-calculator');
const { calculateGPA } = require('../tools/gpa-calculator');
let checks = 0;
function test(name, fn) { fn(); checks++; console.log('PASS - ' + name); }

test('Fraction addition, subtraction, multiplication and division reduce exactly', () => {
  assert.equal(calculateFractions('1', '2', '3', '4', 'add').fraction, '5/4');
  assert.equal(calculateFractions('1', '2', '3', '4', 'subtract').fraction, '-1/4');
  assert.equal(calculateFractions('2', '3', '9', '4', 'multiply').fraction, '3/2');
  assert.equal(calculateFractions('2', '3', '4', '5', 'divide').fraction, '5/6');
  assert.equal(calculateFractions('1', '2', '1', '2', 'subtract').fraction, '0');
  assert.equal(calculateFractions('0', '-2', '0', '3', 'add').denominator, 1n);
});
test('Fraction signs and mixed numbers are unambiguous', () => {
  assert.equal(calculateFractions('-7', '3', '0', '1', 'add').mixed, '-(2 + 1/3)');
  assert.equal(calculateFractions('7', '-3', '0', '1', 'add').mixed, '-(2 + 1/3)');
  assert.equal(calculateFractions('-7', '-3', '0', '1', 'add').mixed, '2 + 1/3');
  assert.equal(calculateFractions('-6', '3', '0', '1', 'add').mixed, '-2');
  assert.equal(calculateFractions('1', '-2', '-1', '3', 'divide').fraction, '3/2');
});
test('Fraction products remain exact beyond Number integer precision', () => {
  const result = calculateFractions('999999937', '999999929', '999999937', '999999929', 'multiply');
  assert.equal(result.numerator, 999999874000003969n);
  assert.equal(result.denominator, 999999858000005041n);
  assert.equal(calculateFractions('1000000000', '1', '1000000000', '1', 'multiply').numerator, 1000000000000000000n);
});
test('Fraction invalid integers, ranges and zero divisors are rejected', () => {
  for (const value of ['', '1.5', '1e3', '1000000001', '-1000000001', 'Infinity', '1'.repeat(1000)]) assert.throws(() => calculateFractions(value, '1', '1', '2', 'add'));
  assert.throws(() => calculateFractions('1', '0', '1', '2', 'add'), /분모/);
  assert.throws(() => calculateFractions('1', '2', '0', '3', 'divide'), /나눌/);
  assert.throws(() => calculateFractions('1', '2', '1', '3', 'other'));
});
test('Average, median, range and count use every numeric value', () => {
  assert.deepEqual(calculateAverage('10, 20, 20\n30 100'), { count: 5, sum: 180, average: 36, median: 20, minimum: 10, maximum: 100 });
  assert.equal(calculateAverage('40 10 30 20').median, 25);
  assert.deepEqual(calculateAverage('-5'), { count: 1, sum: -5, average: -5, median: -5, minimum: -5, maximum: -5 });
  assert.equal(calculateAverage('1e12 .001 -1e12').sum, 0.001);
  assert.equal(formatAverageNumber(-0.00000001), '0');
});
test('Average validates syntax, counts and raw input bounds', () => {
  for (const value of ['', ' ', '1/2', '0x10', 'Infinity', 'NaN', '1000000000001', '1e309', '1;2']) assert.throws(() => calculateAverage(value));
  assert.equal(calculateAverage(Array(10000).fill('1').join(',')).count, 10000);
  assert.throws(() => calculateAverage(Array(10001).fill('1').join(',')), /10,000/);
  assert.throws(() => calculateAverage('1' + ' '.repeat(100000)), /100,000/);
  assert.equal(calculateAverage('1,000').count, 2);
});
test('Time durations add seconds, carry minutes and retain hours beyond 24', () => {
  assert.deepEqual(sumTimeDurations('1:30\n2:15:30\n0:45'), { count: 3, totalSeconds: 16230, totalMinutes: 270.5, hours: 4, minutes: 30, seconds: 30 });
  assert.equal(sumTimeDurations('25:00\r\n\r\n0:00:59\r0:00:01').hours, 25);
  assert.equal(sumTimeDurations('0:00:59\n0:00:01').minutes, 1);
  assert.equal(sumTimeDurations('0:00').totalSeconds, 0);
  assert.equal(sumTimeDurations('0:00:01').totalSeconds, 1);
});
test('Time durations reject malformed fields and enforce safe limits', () => {
  for (const text of ['', ' ', '-1:00', '1:60', '1:00:60', '1:5', '1.5', '01:00:00:00', '1000000001:00']) assert.throws(() => sumTimeDurations(text));
  assert.equal(sumTimeDurations(Array(1000).fill('1000000000:59:59').join('\n')).count, 1000);
  assert.ok(Number.isSafeInteger(sumTimeDurations(Array(1000).fill('1000000000:59:59').join('\n')).totalSeconds));
  assert.throws(() => sumTimeDurations(Array(1001).fill('0:01').join('\n')), /1,000/);
  assert.throws(() => sumTimeDurations('0:00' + ' '.repeat(100000)), /100,000/);
});
test('GPA weights credits and excludes P while including F', () => {
  assert.deepEqual(calculateGPA([{ credits: 3, grade: 'A' }, { credits: 2, grade: 'B+' }, { credits: 1, grade: 'P' }], '4.5'), { gpa: 3.8, includedCredits: 5, weightedPoints: 19, includedCount: 2, excludedCount: 1 });
  assert.equal(calculateGPA([{ credits: 3, grade: 'A' }, { credits: 3, grade: 'F' }], '4.5').gpa, 2);
  assert.equal(calculateGPA([{ credits: 0.5, grade: 'A+' }, { credits: 1.5, grade: 'B-' }], '4.3').gpa, 3.1);
  assert.equal(calculateGPA([{ credits: '10', grade: 'A+' }], '4.3').gpa, 4.3);
  assert.equal(calculateGPA([{ credits: 0.5, grade: 'F' }], '4.5').gpa, 0);
});
test('GPA validates scales, grades, credits and course count', () => {
  for (const credits of ['', null, undefined, true, 0, -1, 0.25, 10.5, Infinity]) assert.throws(() => calculateGPA([{ credits, grade: 'A' }], '4.5'));
  for (const scale of ['5', '', '__proto__']) assert.throws(() => calculateGPA([{ credits: 1, grade: 'A' }], scale));
  for (const grade of ['', 'A-', '__proto__']) assert.throws(() => calculateGPA([{ credits: 1, grade }], '4.5'));
  assert.throws(() => calculateGPA([{ credits: 1, grade: 'P' }], '4.5'), /한 개 이상/);
  assert.throws(() => calculateGPA([], '4.5'));
  assert.equal(calculateGPA(Array(30).fill({ credits: 3, grade: 'A' }), '4.5').includedCount, 30);
  assert.throws(() => calculateGPA(Array(31).fill({ credits: 3, grade: 'A' }), '4.5'));
});

function loadUI(slug) {
  const ids = {};
  function node(tag = 'div') {
    const element = { tagName: tag, children: [], handlers: {}, value: '', hidden: false, disabled: false, textContent: '',
      addEventListener(name, fn) { this.handlers[name] = fn; },
      append(...children) { for (const child of children) { child.parent = this; this.children.push(child); } },
      replaceChildren(...children) { this.children = []; this.append(...children); },
      remove() { if (this.parent) this.parent.children = this.parent.children.filter(child => child !== this); },
      scrollIntoView() { this.scrolled = true; }, focus() { this.focused = true; }, select() { this.selected = true; }
    };
    Object.defineProperty(element, 'id', { get() { return this.identifier; }, set(value) { this.identifier = value; ids[value] = this; } });
    return element;
  }
  const html = fs.readFileSync(path.join(__dirname, '../tools/' + slug + '.html'), 'utf8');
  for (const [, tag, id] of html.matchAll(/<(\w+)\b[^>]*\bid="([^"]+)"/g)) { const element = node(tag); element.id = id; }
  ids.scale && (ids.scale.value = '4.5'); ids.operation && (ids.operation.value = 'add');
  ids.calculator.requestSubmit = () => ids.calculator.handlers.submit({ preventDefault() {} });
  const clipboard = { writeText: async value => { clipboard.copied = value; } };
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../tools/' + slug + '.js'), 'utf8'), {
    document: { getElementById: id => ids[id], createElement: node }, navigator: { clipboard }
  });
  return { ids, clipboard, submit: ids.calculator.requestSubmit };
}
test('Fraction UI computes, preserves inputs and clears stale results on edits', () => {
  const { ids, submit } = loadUI('fraction-calculator');
  submit(); assert.ok(ids.error.textContent); assert.equal(ids.result.hidden, true);
  ids.example.handlers.click(); assert.equal(ids['result-value'].textContent, '5/4');
  assert.equal(ids.an.value, '1'); assert.equal(ids.ad.value, '2');
  ids.calculator.handlers.input(); assert.equal(ids.result.hidden, true); assert.equal(ids['result-text'].value, '');
  ids.ad.value = '0'; submit(); assert.match(ids.error.textContent, /분모/);
});
test('Average UI and time UI display independent results and retain original lists', () => {
  for (const [slug, field, value, expected] of [['average-calculator', 'numbers', '10, 20, 30', '평균 20'], ['time-duration-calculator', 'durations', '25:00\n0:30', '25시간 30분 0초']]) {
    const { ids, submit } = loadUI(slug);
    ids[field].value = value; submit(); assert.equal(ids['result-value'].textContent, expected);
    assert.equal(ids[field].value, value); assert.equal(ids.result.hidden, false);
    ids.calculator.handlers.change(); assert.equal(ids.result.hidden, true);
    ids[field].value = 'invalid'; submit(); assert.ok(ids.error.textContent); assert.equal(ids.result.hidden, true);
  }
});
test('GPA UI adds and deletes courses, protects last row and resets invalid scale grades', () => {
  const { ids, submit } = loadUI('gpa-calculator');
  assert.equal(ids.courses.children.length, 1);
  assert.equal(ids['course-1'].children.at(-1).disabled, true);
  ids['course-1-name'].value = '과목 원문'; ids['course-1-credits'].value = '2'; ids['course-1-grade'].value = 'A';
  submit(); assert.equal(ids['result-value'].textContent, '4 / 4.5'); assert.equal(ids['course-1-name'].value, '과목 원문');
  ids['add-course'].handlers.click(); assert.equal(ids.courses.children.length, 2); assert.equal(ids.result.hidden, true);
  ids['course-2'].children.at(-1).handlers.click(); assert.equal(ids.courses.children.length, 1);
  for (let index = 1; index < 31; index++) ids['add-course'].handlers.click();
  assert.equal(ids.courses.children.length, 30); assert.equal(ids['add-course'].disabled, true);
  ids.scale.value = '4.3'; ids.scale.handlers.change(); ids['course-1-grade'].value = 'A-';
  ids.scale.value = '4.5'; ids.scale.handlers.change(); assert.equal(ids['course-1-grade'].value, '');
  assert.equal(ids['course-1-name'].value, '과목 원문'); assert.equal(ids['course-1-credits'].value, '2');
  submit(); assert.ok(ids.error.textContent); assert.equal(ids.result.hidden, true);
});
async function clipboardChecks() {
  for (const slug of ['fraction-calculator', 'average-calculator', 'time-duration-calculator', 'gpa-calculator']) {
    const { ids, clipboard, submit } = loadUI(slug);
    if (ids.example) ids.example.handlers.click(); else submit();
    await ids.copy.handlers.click(); assert.equal(clipboard.copied, ids['result-text'].value); assert.ok(ids['copy-status'].textContent.includes('복사했습니다'));
    clipboard.writeText = async () => { throw new Error('blocked'); };
    await ids.copy.handlers.click(); assert.ok(ids['copy-status'].textContent.includes('직접 복사'));
    assert.equal(ids['result-text'].selected, true);
    let finish; clipboard.writeText = () => new Promise(resolve => { finish = resolve; });
    const pending = ids.copy.handlers.click(); ids.calculator.handlers.input(); finish(); await pending;
    assert.equal(ids['copy-status'].textContent, ''); assert.equal(ids.result.hidden, true);
  }
  checks++; console.log('PASS - all four UIs copy, provide manual fallback and ignore stale async status');
}
clipboardChecks().then(() => {
  for (const slug of ['fraction-calculator', 'average-calculator', 'time-duration-calculator', 'gpa-calculator']) {
    const html = fs.readFileSync(path.join(__dirname, '../tools/' + slug + '.html'), 'utf8');
    assert.equal((html.match(/ad-banner-isolated\.js/g) || []).length, 1);
    assert.match(html, /id="result-text"[^>]*readonly/);
    assert.ok(!fs.readFileSync(path.join(__dirname, '../tools/' + slug + '.js'), 'utf8').includes('innerHTML'));
  }
  checks++; console.log('PASS - one isolated banner per page, readonly copy fields and text-only rendering');
  console.log(checks + ' number-utilities checks passed');
}).catch(error => { console.error(error); process.exitCode = 1; });
