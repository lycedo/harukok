'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
function element(extra = {}) {
  return { hidden: false, dataset: {}, handlers: {}, addEventListener(name, fn) { this.handlers[name] = fn; },
    setAttribute(name, value) { this[name] = value; }, focus() { this.focused = true; }, ...extra };
}
const groups = [...html.matchAll(/<section[^>]*data-tool-group="([^"]+)"[^>]*>([\s\S]*?)<\/section>/g)].map(([, category, content]) => {
  const items = [...content.matchAll(/<li[^>]*data-keywords="([^"]+)"[^>]*>([\s\S]*?)<\/li>/g)].map(([, keywords, item]) => element({ dataset: { keywords }, textContent: item.replace(/<[^>]*>/g, '') }));
  return element({ dataset: { toolGroup: category }, querySelectorAll: () => items, items });
});
const filters = [...html.matchAll(/data-category-filter="([^"]+)"/g)].map(([, categoryFilter]) => element({ dataset: { categoryFilter } }));
const ids = Object.fromEntries(['tool-search', 'directory-status', 'empty-search', 'reset-search', 'empty-reset', 'directory-controls', 'featured-tools', 'show-all-tools'].map(id => [id, element({ value: '', hidden: id !== 'tool-search' })]));
vm.runInNewContext(fs.readFileSync(path.join(root, 'tools/tool-directory.js'), 'utf8'), { document: {
  getElementById: id => ids[id], querySelectorAll: selector => selector === '[data-category-filter]' ? filters : groups
} });
const visible = () => groups.flatMap(group => group.items).filter(item => !item.hidden);
const search = value => { ids['tool-search'].value = value; ids['tool-search'].handlers.input(); };
const category = value => filters.find(button => button.dataset.categoryFilter === value).handlers.click();
assert.equal(visible().length, 35);
assert.equal(ids['directory-controls'].hidden, false);
search('  사진  ');
assert.equal(visible().length, 4);
assert.ok(visible().every(item => /이미지|사진|배경/.test(item.textContent)));
assert.equal(ids['featured-tools'].hidden, true);
category('salary');
assert.equal(visible().length, 4);
assert.equal(ids['tool-search'].value, '');
assert.equal(ids['empty-search'].hidden, true);
search('없는도구');
assert.equal(visible().length, 0);
assert.equal(ids['empty-search'].hidden, false);
ids['empty-reset'].handlers.click();
assert.equal(visible().length, 35);
assert.equal(ids['tool-search'].focused, true);
category('image');
assert.equal(visible().length, 4);
assert.equal(filters.find(button => button.dataset.categoryFilter === 'image')['aria-pressed'], 'true');
search('WeB P');
assert.equal(visible().length, 1);
search('<script>alert(1)</script>');
assert.equal(visible().length, 0);
ids['tool-search'].handlers.keydown({ key: 'Escape' });
assert.equal(visible().length, 35);
assert.equal(ids['reset-search'].hidden, true);
assert.equal(ids['featured-tools'].hidden, false);
category('leaving');
assert.equal(visible().length, 3);
search('사진');
assert.equal(visible().length, 4);
assert.equal(filters.find(button => button.dataset.categoryFilter === 'all')['aria-pressed'], 'true');
search('글자수');
assert.equal(visible().length, 1);
search('디데이'.normalize('NFD'));
assert.equal(visible().length, 1);
ids['show-all-tools'].handlers.click();
assert.equal(visible().length, 35);
assert.equal(ids['tool-search'].value, '');
const links = [...html.matchAll(/href="(\/(?:tools|fun)\/[^"#?]+)"/g)].map(match => match[1]);
assert.equal(new Set(links).size, 35);
for (const link of links) assert.ok(fs.existsSync(path.join(root, link + '.html')), link);
assert.match(html, /id="directory-controls" hidden/);
assert.ok(!html.includes('innerHTML'));
console.log('PASS - 35 discoverable tools, Korean/alias search, category combinations, empty reset, keyboard reset, local links');
