'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { scaleRecipe } = require('../tools/recipe-scale-calculator');
const { workdayDate, calculateBusinessDays } = require('../tools/business-day-calculator');
const ingredients = [{ name: '밀가루', amount: '500', unit: 'g' }, { name: '우유', amount: 300, unit: 'ml' }, { name: '달걀', amount: 2, unit: '개' }];
assert.deepEqual(scaleRecipe(4, 2, ingredients).items.map(item => item.amount), [250, 150, 1]);
assert.deepEqual(scaleRecipe(4, 6, ingredients).items.map(item => item.amount), [750, 450, 3]);
assert.equal(scaleRecipe('0.5', '0.1', [{ name: ' 소금 ', amount: 0, unit: '' }]).items[0].name, '소금');
assert.equal(scaleRecipe(4, 4, ingredients).items[0].amount, 500);
for (const servings of ['', 0, -1, 0.01, 100001, NaN, Infinity]) assert.throws(() => scaleRecipe(servings, 2, ingredients));
for (const bad of [[], Array(21).fill(ingredients[0]), [{ name: '', amount: 1, unit: '' }], [{ name: 'a'.repeat(41), amount: 1, unit: '' }], [{ name: '소금', amount: '', unit: 'g' }], [{ name: '소금', amount: -1, unit: 'g' }], [{ name: '소금', amount: 1e9 + 1, unit: 'g' }]]) assert.throws(() => scaleRecipe(2, 3, bad));
assert.equal(ingredients[0].amount, '500');
const base = { mode: 'add', start: '2026-11-02', count: 5 };
assert.equal(calculateBusinessDays(base).date, '2026-11-09');
assert.equal(calculateBusinessDays({ ...base, holidays: '2026-11-03' }).date, '2026-11-10');
assert.equal(calculateBusinessDays({ ...base, holidays: '2026-11-07\n2026-11-07' }).date, '2026-11-09');
assert.equal(calculateBusinessDays({ ...base, skipSaturday: false, skipSunday: false }).date, '2026-11-07');
assert.deepEqual(calculateBusinessDays({ mode: 'between', start: '2026-11-02', end: '2026-11-09' }), { date: '2026-11-09', workdays: 5, calendarDays: 7, excludedDates: 0 });
assert.equal(calculateBusinessDays({ mode: 'between', start: '2024-02-28', end: '2024-03-01' }).workdays, 2);
assert.equal(calculateBusinessDays({ ...base, start: '2026-11-07', count: 0 }).date, '2026-11-07');
assert.equal(calculateBusinessDays({ ...base, start: '2026-11-06', count: 1, skipSaturday: false }).date, '2026-11-07');
assert.equal(calculateBusinessDays({ mode: 'between', start: '1900-01-01', end: '2100-12-31', skipSaturday: false, skipSunday: false }).workdays, (workdayDate('2100-12-31') - workdayDate('1900-01-01')) / 86400000);
for (const date of ['', '2026-02-29', '1900-02-29', '1899-12-31', '2101-01-01', '2026-1-01']) assert.throws(() => workdayDate(date));
for (const changes of [{ count: '' }, { count: 1.5 }, { count: 20001 }, { mode: 'invalid' }, { holidays: 'not-a-date' }, { holidays: Array(367).fill('2026-11-03').join('\n') }, { start: '2100-12-31', count: 1 }, { mode: 'between', end: '2026-11-01' }]) assert.throws(() => calculateBusinessDays({ ...base, ...changes }));

function ui(slug, defaults) {
  const ids = new Map();
  function node(tag = 'div') {
    let id = '';
    const el = { tag, children: [], value: '', textContent: '', hidden: false, disabled: false, checked: false, handlers: {},
      addEventListener(event, handler) { this.handlers[event] = handler; },
      append(...children) { for (const child of children) { child.parent = this; this.children.push(child); } },
      replaceChildren(...children) { this.children = []; this.append(...children); },
      remove() { if (this.parent) this.parent.children = this.parent.children.filter(child => child !== this); },
      scrollIntoView() {}, focus() { this.focused = true; }, select() { this.selected = true; }
    };
    Object.defineProperty(el, 'id', { get: () => id, set(value) { id = value; ids.set(id, el); } });
    return el;
  }
  const get = id => { if (!ids.has(id)) { const el = node(); el.id = id; } return ids.get(id); };
  const form = slug.startsWith('recipe') ? 'recipe-form' : 'workday-form';
  const submit = () => get(form).handlers.submit({ preventDefault() {} });
  get(form).requestSubmit = submit;
  for (const [id, properties] of Object.entries(defaults || {})) Object.assign(get(id), properties);
  const clipboard = { writeText: async text => { clipboard.text = text; } };
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../tools/' + slug + '.js'), 'utf8'), { document: { getElementById: get, createElement: node }, navigator: { clipboard } });
  return { get, ids, submit, clipboard, form };
}
const recipeUI = ui('recipe-scale-calculator');
recipeUI.submit(); assert.ok(recipeUI.get('error').textContent);
recipeUI.get('recipe-example').handlers.click();
assert.equal(recipeUI.get('result-value').textContent, '0.5배'); assert.match(recipeUI.get('result-output').value, /밀가루: 250 g/);
assert.equal(recipeUI.get('original-servings').value, '4'); assert.equal(recipeUI.get('result').hidden, false);
recipeUI.get('add-ingredient').handlers.click(); assert.equal(recipeUI.get('result').hidden, true);
for (let i = 0; i < 30; i++) recipeUI.get('add-ingredient').handlers.click();
assert.equal(recipeUI.get('ingredients').children.length, 20); assert.equal(recipeUI.get('add-ingredient').disabled, true);
const businessUI = ui('business-day-calculator', { 'workday-mode': { value: 'add' }, 'skip-saturday': { checked: true }, 'skip-sunday': { checked: true } });
businessUI.submit(); assert.ok(businessUI.get('error').textContent);
businessUI.get('workday-example').handlers.click(); assert.equal(businessUI.get('result-value').textContent, '2026-11-09');
businessUI.get('workday-mode').value = 'between'; businessUI.get('workday-mode').handlers.change(); assert.equal(businessUI.get('between-fields').hidden, false); assert.equal(businessUI.get('result').hidden, true);
businessUI.get('end-date').value = '2026-11-09'; businessUI.submit(); assert.equal(businessUI.get('result-value').textContent, '5영업일');
(async () => {
  for (const u of [recipeUI, businessUI]) {
    u.get(u.form.startsWith('recipe') ? 'recipe-example' : 'workday-example').handlers.click();
    await u.get('copy-result').handlers.click(); assert.equal(u.clipboard.text, u.get('result-output').value);
    u.clipboard.writeText = async () => { throw new Error('denied'); }; await u.get('copy-result').handlers.click(); assert.match(u.get('copy-status').textContent, /직접 복사/); assert.equal(u.get('result-output').selected, true);
    let finish; u.clipboard.writeText = () => new Promise(resolve => { finish = resolve; }); const pending = u.get('copy-result').handlers.click(); u.get(u.form).handlers.input(); finish(); await pending; assert.equal(u.get('copy-status').textContent, ''); assert.equal(u.get('result').hidden, true);
  }
  console.log('PASS - recipe portions, unit/source preservation, row limits, workday boundaries/leap years/holidays and both real UIs/clipboard recovery');
})().catch(error => { console.error(error); process.exitCode = 1; });
