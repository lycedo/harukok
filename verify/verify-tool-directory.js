'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const expectedToolLinks = new Set(['tools', 'fun'].flatMap(dir => fs.readdirSync(path.join(root, dir))
  .filter(file => file.endsWith('.html')).map(file => '/' + dir + '/' + file.replace(/\.html$/, ''))));
const expectedToolCount = 1000;
assert.equal(expectedToolLinks.size, expectedToolCount);
const expectedCounts = {all:1000,daily:152,finance:83,document:547,math:40,salary:5,leaving:3,image:48,random:10,creative:106,pet:3,family:3};
function element(extra = {}) {
  return { hidden: false, dataset: {}, handlers: {}, addEventListener(name, fn) { this.handlers[name] = fn; },
    setAttribute(name, value) { this[name] = value; }, focus() { this.focused = true; }, ...extra };
}
const groups = [...html.matchAll(/<section[^>]*data-tool-group="([^"]+)"[^>]*>([\s\S]*?)<\/section>/g)].map(([, category, content]) => {
  const items = [...content.matchAll(/<li[^>]*data-keywords="([^"]+)"[^>]*>([\s\S]*?)<\/li>/g)].map(([, keywords, item]) => element({ dataset: { keywords }, textContent: item.replace(/<[^>]*>/g, ''), href: item.match(/href="([^"]+)"/)?.[1] }));
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
assert.equal(visible().length, expectedToolCount);
assert.equal(ids['directory-controls'].hidden, false);
search('  사진  ');
assert.equal(visible().length, 49);
assert.ok(visible().every(item => /이미지|사진|배경/.test(item.textContent + ' ' + item.dataset.keywords)));
assert.ok(visible().some(item => /피사계심도/.test(item.textContent)));
assert.equal(ids['featured-tools'].hidden, true);
category('salary');
assert.equal(visible().length, 5);
assert.equal(ids['tool-search'].value, '');
assert.equal(ids['empty-search'].hidden, true);
search('없는도구');
assert.equal(visible().length, 0);
assert.equal(ids['empty-search'].hidden, false);
ids['empty-reset'].handlers.click();
assert.equal(visible().length, expectedToolCount);
assert.equal(ids['tool-search'].focused, true);
category('image');
assert.equal(visible().length, 48);
assert.equal(filters.find(button => button.dataset.categoryFilter === 'image')['aria-pressed'], 'true');
search('WeB P');
assert.equal(visible().length, 6);
search('<script>alert(1)</script>');
assert.equal(visible().length, 0);
ids['tool-search'].handlers.keydown({ key: 'Escape' });
assert.equal(visible().length, expectedToolCount);
assert.equal(ids['reset-search'].hidden, true);
assert.equal(ids['featured-tools'].hidden, false);
category('leaving');
assert.equal(visible().length, 3);
search('사진');
assert.equal(visible().length, 49);
assert.equal(filters.find(button => button.dataset.categoryFilter === 'all')['aria-pressed'], 'true');
search('글자수');
assert.ok(visible().some(item => /글자 수·바이트 세기/.test(item.textContent)));
assert.deepEqual(visible().map(item => item.textContent).sort(), ['글자 수·바이트 세기', '읽기 시간 계산기', '텍스트 나누기', '텍스트 줄바꿈 도구', '글자 수 맞춤 채우기'].sort());
search('중복줄');
assert.equal(visible().length, 1);
assert.match(visible()[0].textContent, /중복 줄/);
search('디데이'.normalize('NFD'));
assert.equal(visible().length, 1);
ids['show-all-tools'].handlers.click();
assert.equal(visible().length, expectedToolCount);
assert.equal(ids['tool-search'].value, '');
category('document');
assert.equal(visible().length, 547);
category('math');
assert.equal(visible().length, 40);
category('daily');
assert.equal(visible().length, 152);
category('creative');
assert.equal(visible().length, 106);
category('finance');
assert.equal(visible().length, 83);
ids['show-all-tools'].handlers.click();
assert.equal(visible().length, expectedToolCount);
for (const [key,count] of Object.entries(expectedCounts)) { category(key); assert.equal(visible().length,count,key+' category count'); }
for (const [query,count,slugs] of [['p D f',35,['pdf-merge-files','pdf-extract-selectable-text','images-to-pdf-file']],['ZIP',13,['zip-create-files','zip-extract-files','tar-to-zip-file']],['QR',3,['qr-code-generator','qr-code-reader']]]) { search(query); assert.equal(visible().length,count,query+' search count'); for (const slug of slugs) assert.ok(visible().some(item=>item.href==='/tools/'+slug),query+' missing '+slug); }
search('일차방정식'); assert.equal(visible().length,0); assert.equal(ids['empty-search'].hidden,false);
ids['show-all-tools'].handlers.click(); assert.equal(visible().length,expectedToolCount);
const links = [...html.matchAll(/href="(\/(?:tools|fun)\/[^"#?]+)"/g)].map(match => match[1]);
assert.deepEqual(new Set(links), expectedToolLinks);
for (const link of links) assert.ok(fs.existsSync(path.join(root, link + '.html')), link);
assert.match(html, /id="directory-controls" hidden/);
assert.ok(!html.includes('innerHTML'));
console.log('PASS - ' + expectedToolCount + ' discoverable tools, Korean/alias search, category combinations, empty reset, keyboard reset, local links');
