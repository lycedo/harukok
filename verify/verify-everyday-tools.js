const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const {FakeDocument} = require('./dom-shim');
const {calculatePercent} = require('../tools/percent-calculator');
const {daysBetween,addDays,parseDay} = require('../tools/date-calculator');
const {countText} = require('../tools/character-counter');
const root = path.join(__dirname,'..');
let checks=0;
function equal(actual,expected) {assert.deepEqual(actual,expected); checks++;}
function invalid(fn) {assert.throws(fn); checks++;}
function near(actual,expected) {assert.ok(Math.abs(actual-expected)<1e-9); checks++;}
equal(calculatePercent('of',80000,15).value,12000);
equal(calculatePercent('of',200,150).value,300);
equal(calculatePercent('of',-200,12.5).value,-25);
equal(calculatePercent('ratio',30,200).value,15);
near(calculatePercent('ratio',1,3).value,100/3);
equal(calculatePercent('change',3000,3300).value,10);
equal(calculatePercent('change',100,90).value,-10);
equal(calculatePercent('change',100,0).value,-100);
equal(calculatePercent('change',100,100).value,0);
equal(calculatePercent('discount',80000,15),{value:68000,saving:12000});
equal(calculatePercent('discount',100,100).value,0);
equal(calculatePercent('discount',100,0).value,100);
near(calculatePercent('discount',calculatePercent('discount',100000,20).value,10).value,72000);
for (const args of [['ratio',1,0],['ratio',1,-5],['change',0,20],['change',-1,20],['discount',100,101],['discount',-100,10],['discount',100,-1],['of',NaN,2],['of',1,Infinity],['of',1e13,2],['bad',1,2]]) invalid(()=>calculatePercent(...args));
equal(daysBetween('2024-02-28','2024-03-01'),{signed:2,days:2});
equal(daysBetween('2025-02-28','2025-03-01'),{signed:1,days:1});
equal(daysBetween('2026-10-18','2026-10-18',true),{signed:0,days:1});
equal(daysBetween('2026-10-20','2026-10-18',true),{signed:-2,days:3});
equal(daysBetween('2026-03-07','2026-03-09').days,2); // DST does not change calendar days.
equal(addDays('2026-10-18',100),'2027-01-26');
equal(addDays('2026-10-18',100,true),'2027-01-25');
equal(addDays('2026-10-18',1,true),'2026-10-18');
equal(addDays('2026-10-18',0),'2026-10-18');
equal(addDays('2024-03-01',-1),'2024-02-29');
equal(addDays('2000-02-28',1),'2000-02-29');
equal(addDays('1900-02-28',1),'1900-03-01');
for (const date of ['2026-02-29','1900-02-29','2026-02-30','2026-13-01','2026-00-01','2026-01-00','1899-12-31','2101-01-01','','2026-1-1']) invalid(()=>parseDay(date));
for (const args of [['1900-01-01',-1],['2100-12-31',1],['2026-10-18',0,true],['2026-10-18',-1,true],['2026-10-18',1.5],['2026-10-18',Infinity]]) invalid(()=>addDays(...args));
equal(countText(''),{withSpaces:0,withoutSpaces:0,bytes:0,words:0,lines:0,utf16:0});
equal(countText('안녕하세요'),{withSpaces:5,withoutSpaces:5,bytes:15,words:1,lines:1,utf16:5});
equal(countText('안녕 hello'),{withSpaces:8,withoutSpaces:7,bytes:12,words:2,lines:1,utf16:8});
equal(countText('😀'),{withSpaces:1,withoutSpaces:1,bytes:4,words:1,lines:1,utf16:2});
equal(countText('A\r\nB\r\n'),countText('A\nB\n'));
equal(countText('A\nB\n').lines,3);
equal(countText(' \t\n').withoutSpaces,0);
equal(countText('가\u00a0나').withoutSpaces,2);
equal(countText('👨‍👩‍👧‍👦').withSpaces,7);
equal(countText('e\u0301').withSpaces,2);
equal(countText('가'.repeat(10000)).bytes,30000);

// Execute each shipped UI script against its real HTML IDs to catch broken wiring.
function load(slug) {
  const doc=new FakeDocument();
  const html=fs.readFileSync(path.join(root,'tools',slug+'.html'),'utf8');
  doc.registerFromHtml(html);
  // The small DOM shim does not initialize a select's first option as browsers do.
  for (const match of html.matchAll(/<select[^>]*id="([^"]+)"[^>]*>\s*<option value="([^"]+)"/g)) doc.getElementById(match[1]).value=match[2];
  vm.runInNewContext(fs.readFileSync(path.join(root,'tools',slug+'.js'),'utf8'),{document:doc,TextEncoder,Intl,Date,setTimeout,clearTimeout});
  return id=>doc.getElementById(id);
}
const percent=load('percent-calculator');
percent('mode').value='discount';percent('a').value='80000';percent('b').value='15';
percent('calculator').dispatchEvent({type:'submit',preventDefault(){}});
equal(percent('result-value').textContent,'68,000원');equal(percent('result').hidden,false);
percent('calculator').dispatchEvent({type:'input'});equal(percent('result').hidden,true);
percent('a').value='';percent('calculator').dispatchEvent({type:'submit',preventDefault(){}});
equal(percent('result').hidden,true);assert.ok(percent('error').textContent);
const dates=load('date-calculator');
dates('start').value='2026-10-18';dates('end').value='2026-10-20';dates('inclusive').checked=true;
dates('difference-form').dispatchEvent({type:'submit',preventDefault(){}});
equal(dates('difference-value').textContent,'3일');assert.ok(dates('dday').textContent.startsWith('D-2'));
dates('base').value='2026-10-18';dates('days').value='100';dates('count-mode').value='nth';
dates('offset-form').dispatchEvent({type:'submit',preventDefault(){}});equal(dates('offset-value').textContent,'2027-01-25');
dates('days').value='7';dates('count-mode').value='before';
dates('count-mode').dispatchEvent({type:'change'});
dates('offset-form').dispatchEvent({type:'submit',preventDefault(){}});equal(dates('offset-value').textContent,'2026-10-11');
dates('count-mode').value='offset';dates('count-mode').dispatchEvent({type:'change'});
dates('offset-form').dispatchEvent({type:'submit',preventDefault(){}});equal(dates('offset-value').textContent,'2026-10-25');
dates('days').value='-7';dates('offset-form').dispatchEvent({type:'submit',preventDefault(){}});
equal(dates('offset-result').hidden,true);assert.ok(dates('offset-error').textContent.includes('0 이상의 정수'));
const text=load('character-counter');text('text').value='안녕 hello';text('limit-mode').value='withSpaces';text('limit').value='5';
text('limit').dispatchEvent({type:'input'});equal(text('bytes').textContent,'12');assert.ok(text('limit-status').textContent.includes('3자 초과'));

const home=fs.readFileSync(path.join(root,'index.html'),'utf8'), sitemap=fs.readFileSync(path.join(root,'sitemap.xml'),'utf8');
for (const slug of ['percent-calculator','date-calculator','character-counter']) {
  const html=fs.readFileSync(path.join(root,'tools',slug+'.html'),'utf8');
  const url='https://harukok.com/tools/'+slug;
  assert.ok(home.includes('href="/tools/'+slug+'"'));assert.ok(sitemap.includes('<loc>'+url+'</loc>'));
  equal((html.match(/<h1>/g)||[]).length,1);
  assert.ok(html.includes('<link rel="canonical" href="'+url+'">'));
  const schema=JSON.parse(html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]);
  equal(schema.url,url);equal(schema.offers.price,'0');
  equal((html.match(/src="\/ad-banner-isolated.js/g)||[]).length,1);
  for (const match of html.matchAll(/(?:href|src)="(\/[^"#?]*)[^\"]*"/g)) {
    const dest=path.join(root,match[1]);
    assert.ok([dest,dest+'.html',path.join(dest,'index.html')].some(p=>fs.existsSync(p)), 'Missing local link '+match[1]);
  }
}
console.log('PASS - '+checks+' calculation/UI checks plus metadata, internal links and ads for 3 tools');
