'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.join(__dirname, '..');
const slugs = ['ratio-calculator','pythagorean-calculator','sector-calculator','volume-calculator','permutation-combination-calculator','scientific-notation-converter','decimal-fraction-converter','statistics-calculator','sequence-calculator','time-zone-converter'];
const calc = Object.fromEntries(slugs.map(slug=>[slug,require('../tools/'+slug).calculate]));
let checks=0;
function test(name,fn){fn();checks++;}
const close=(a,b)=>assert.ok(Math.abs(a-b)<=Math.max(1,Math.abs(b))*1e-10,`${a} != ${b}`);
test('Ratio unknowns and invalid/underdetermined ratios',()=>{
  const values={a:'2',b:'3',c:'4',d:'6'};
  for(const id of ['a','b','c','d']) assert.match(calc['ratio-calculator']({...values,[id]:''}).value,new RegExp(id.toUpperCase()+' = '+values[id]+'$'));
  for(const bad of [{a:'1',b:'2',c:'3',d:'4'},{a:'',b:'',c:'1',d:'2'},{a:'1',b:'0',c:'2',d:''},{a:'0',b:'2',c:'1',d:''},{a:'Infinity',b:'2',c:'4',d:''},{a:'',b:'1e-200',c:'1e-200',d:'1e12'}])assert.throws(()=>calc['ratio-calculator'](bad));
});
test('Pythagorean length, stable near-equal subtraction and invalid inputs',()=>{
  assert.equal(calc['pythagorean-calculator']({mode:'hypotenuse',x:'3',y:'4'}).value,'5');
  assert.equal(calc['pythagorean-calculator']({mode:'leg',x:'13',y:'5'}).value,'12');
  assert.ok(calc['pythagorean-calculator']({mode:'leg',x:'1000000000',y:'999999999'}).text.includes('44,721'));
  for(const bad of [{mode:'leg',x:3,y:4},{mode:'leg',x:4,y:4},{mode:'hypotenuse',x:0,y:1},{mode:'bad',x:3,y:4},{mode:'hypotenuse',x:'',y:1},{mode:'hypotenuse',x:1e10,y:1}])assert.throws(()=>calc['pythagorean-calculator'](bad));
});
test('Sector boundaries, formula and invalid angles/units',()=>{
  const r=calc['sector-calculator']({radius:10,angle:90,unit:'cm'});assert.match(r.text,/78\.5398163397cm²/);assert.match(r.text,/15\.7079632679cm/);
  assert.match(calc['sector-calculator']({radius:2,angle:360,unit:'m'}).text,/12\.5663706144m²/);
  assert.match(calc['sector-calculator']({radius:2,angle:0,unit:'cm'}).value,/^0cm²$/);
  for(const bad of [{radius:0,angle:90,unit:'cm'},{radius:2,angle:361,unit:'cm'},{radius:2,angle:-1,unit:'cm'},{radius:2,angle:1,unit:'inch'}])assert.throws(()=>calc['sector-calculator'](bad));
});
test('Solid shapes, liter conversion and hidden-field independence',()=>{
  assert.equal(calc['volume-calculator']({shape:'box',unit:'cm',a:3,b:4,c:5}).text,'부피: 60cm³\n리터: 0.06 L');
  assert.match(calc['volume-calculator']({shape:'cylinder',unit:'m',a:1,b:1,c:'bad'}).text,/3,141\.59265359 L/);
  assert.match(calc['volume-calculator']({shape:'cone',unit:'cm',a:3,b:4}).value,/37\.6991118431/);
  assert.match(calc['volume-calculator']({shape:'sphere',unit:'cm',a:3,b:'bad',c:'bad'}).value,/113\.097335529/);
  for(const bad of [{shape:'box',unit:'cm',a:3,b:4,c:''},{shape:'sphere',unit:'cm',a:-3},{shape:'invalid',unit:'cm',a:3},{shape:'sphere',unit:'bad',a:3}])assert.throws(()=>calc['volume-calculator'](bad));
});
test('Exact BigInt permutations/combinations and boundaries',()=>{
  assert.equal(calc['permutation-combination-calculator']({n:52,r:5}).text,'조합 52C5 = 2598960\n순열 52P5 = 311875200');
  assert.equal(calc['permutation-combination-calculator']({n:0,r:0}).value,'1');
  assert.equal(calc['permutation-combination-calculator']({n:500,r:500}).value,'1');
  assert.ok(calc['permutation-combination-calculator']({n:500,r:250}).value.length>140);
  for(const n of ['',-1,501,3.5,'Infinity'])assert.throws(()=>calc['permutation-combination-calculator']({n,r:0}));
  for(const r of [-1,6,1.5])assert.throws(()=>calc['permutation-combination-calculator']({n:5,r}));
});
test('Exact scientific strings retain large integer digits',()=>{
  const sci=calc['scientific-notation-converter'];
  assert.equal(sci({source:'000.0012300',mode:'scientific'}).text,'1.23e-3');
  assert.equal(sci({source:'-0.000',mode:'scientific'}).text,'0e0');
  assert.equal(sci({source:'-1.23e-5',mode:'decimal'}).text,'-0.0000123');
  assert.equal(sci({source:'9007199254740993',mode:'decimal'}).text,'9007199254740993');
  assert.equal(sci({source:'1e1000',mode:'decimal'}).text,'1'+'0'.repeat(1000));
  assert.equal(sci({source:'9'.repeat(1000),mode:'scientific'}).text,'9.'+'9'.repeat(999)+'e999');
  for(const source of ['', '1,000','0x10','Infinity','1e1001','1e-1001','1e99999','1'.repeat(1001)])assert.throws(()=>sci({source,mode:'decimal'}));
});
test('Decimal and fraction exactness, repeating/long terminating distinction',()=>{
  const f=calc['decimal-fraction-converter'];
  assert.equal(f({source:'0.125',mode:'fraction'}).text,'기약분수: 1/8');
  assert.equal(f({source:'-.50',mode:'fraction'}).text,'기약분수: -1/2');
  assert.equal(f({source:'0',mode:'fraction'}).text,'기약분수: 0/1');
  assert.equal(f({source:'1/-8',mode:'decimal'}).value,'-0.125');
  assert.equal(f({source:'1/3',mode:'decimal'}).value,'≈ 0.33333333333333333333…');
  const long=f({source:'1/'+(2n**600n),mode:'decimal'}).value;assert.equal(long.includes('≈'),false);assert.equal(long.includes('…'),false);assert.equal(long.length,602);
  for(const source of ['','1e-3','1/0','1/2/3','1'.repeat(201)])assert.throws(()=>f({source,mode:source.includes('/')?'decimal':'fraction'}));
});
test('Population/sample statistics and large offset data',()=>{
  const s=calc['statistics-calculator'];
  assert.match(s({source:'2,4,4,4,5,5,7,9',mode:'population'}).text,/표준편차: 2\n분산: 4\n평균: 5/);
  assert.match(s({source:'1;2;3;',mode:'sample'}).text,/표준편차: 1\n분산: 1/);
  assert.match(s({source:'999999999999 1000000000000',mode:'population'}).text,/분산: 0\.25/);
  assert.match(s({source:'5 5 5',mode:'population'}).text,/표준편차: 0/);
  for(const input of [{source:'',mode:'population'},{source:'1',mode:'sample'},{source:'1 a',mode:'population'},{source:'1e13',mode:'population'},{source:'1 '.repeat(10001),mode:'population'}])assert.throws(()=>s(input));
});
test('Arithmetic/geometric sequences, cancellation and overflow/underflow',()=>{
  const s=calc['sequence-calculator'];
  assert.equal(s({mode:'arithmetic',first:2,step:3,n:5}).text,'5번째 항: 14\n첫 5항의 합: 40');
  assert.equal(s({mode:'geometric',first:3,step:2,n:10}).text,'10번째 항: 1,536\n첫 10항의 합: 3,069');
  assert.equal(s({mode:'geometric',first:5,step:-1,n:10000}).text,'10000번째 항: -5\n첫 10000항의 합: 0');
  assert.equal(s({mode:'geometric',first:5,step:0,n:2}).text,'2번째 항: 0\n첫 2항의 합: 5');
  assert.match(s({mode:'geometric',first:0,step:1e6,n:10000}).text,/첫 10000항의 합: 0/);
  for(const input of [{mode:'arithmetic',first:1,step:1,n:0},{mode:'arithmetic',first:1,step:1,n:10001},{mode:'geometric',first:1,step:1e6,n:1000},{mode:'geometric',first:1,step:1e-6,n:1000}])assert.throws(()=>s(input));
});
test('Time zones: midnight crossing, DST, half-hour offset and leap dates',()=>{
  const z=calc['time-zone-converter'];
  assert.match(z({source:'2026-07-01T12:00','source-zone':'KST','target-zone':'America/New_York'}).text,/2026\. 06\. 30\.[\s\S]*GMT-4/);
  assert.match(z({source:'2026-01-01T12:00','source-zone':'KST','target-zone':'America/New_York'}).text,/GMT-5/);
  assert.match(z({source:'2026-01-01T00:00','source-zone':'UTC','target-zone':'Asia/Kolkata'}).text,/GMT\+5:30/);
  assert.match(z({source:'2024-02-29T12:01:02','source-zone':'UTC','target-zone':'UTC'}).text,/2024-02-29T12:01:02\.000Z/);
  for(const source of ['', '1900-02-29T00:00','2026-02-30T00:00','2026-01-01T24:00','1899-12-31T00:00','2101-01-01T00:00'])assert.throws(()=>z({source,'source-zone':'UTC','target-zone':'UTC'}));
  assert.throws(()=>z({source:'2026-01-01T00:00','source-zone':'UTC','target-zone':'<script>'}));
});

const uiCases=[
  ['ratio-calculator',{a:'2',b:'3',c:'4',d:''},'D = 6'],
  ['pythagorean-calculator',{mode:'hypotenuse',x:'3',y:'4'},'빗변: 5'],
  ['sector-calculator',{radius:'10',angle:'90',unit:'cm'},'78.5398163397'],
  ['volume-calculator',{shape:'box',unit:'cm',a:'3',b:'4',c:'5'},'60cm³'],
  ['permutation-combination-calculator',{n:'5',r:'2'},'5C2 = 10'],
  ['scientific-notation-converter',{source:'123000',mode:'scientific'},'1.23e5'],
  ['decimal-fraction-converter',{source:'0.125',mode:'fraction'},'1/8'],
  ['statistics-calculator',{source:'2 4 4 4 5 5 7 9',mode:'population'},'표준편차: 2'],
  ['sequence-calculator',{mode:'arithmetic',first:'2',step:'3',n:'5'},'첫 5항의 합: 40'],
  ['time-zone-converter',{source:'2026-07-01T12:00','source-zone':'KST','target-zone':'America/New_York'},'GMT-4']
];
function fixture(slug,values){
  const html=fs.readFileSync(path.join(root,'tools',slug+'.html'),'utf8'),ids={};
  for(const [,id]of html.matchAll(/\bid="([^"]+)"/g))ids[id]={value:'',textContent:'',hidden:id==='result',handlers:{},addEventListener(e,f){this.handlers[e]=f;},scrollIntoView(){},focus(){this.focused=true;},select(){this.selected=true;}};
  for(const [id,value]of Object.entries(values))ids[id].value=value;
  const labels={};let copied='',reject=false,pending;
  const clipboard={writeText(text){copied=text;return reject?Promise.reject(new Error('denied')):pending||Promise.resolve();}};
  vm.runInNewContext(fs.readFileSync(path.join(root,'tools',slug+'.js'),'utf8'),{document:{getElementById:id=>ids[id]||null,querySelector:selector=>labels[selector]||(labels[selector]={textContent:''})},navigator:{clipboard},Intl,Date,Set,Number,Object,Math,BigInt});
  return {ids,submit:()=>ids.calculator.handlers.submit({preventDefault(){}}),get copied(){return copied;},fail(){reject=true;},defer(){pending=new Promise(resolve=>this.resolve=resolve);}};
}
(async()=>{
  for(const [slug,values,expected]of uiCases){
    const f=fixture(slug,values),e=f.ids;f.submit();assert.equal(e.result.hidden,false,slug);assert.ok(e['result-text'].value.includes(expected),slug);
    await e.copy.handlers.click();assert.equal(f.copied,e['result-text'].value,slug+' copy');
    e.calculator.handlers.input();assert.equal(e.result.hidden,true);assert.equal(e['result-text'].value,'');assert.equal(e['copy-status'].textContent,'');
    const first=Object.keys(values).find(id=>!['mode','unit','shape','source-zone','target-zone'].includes(id));const saved=e[first].value;e[first].value='bad';f.submit();assert.equal(e.result.hidden,true,slug+' stale');assert.ok(e.error.textContent,slug+' error');e[first].value=saved;f.submit();assert.equal(e.error.textContent,'');assert.equal(e.result.hidden,false);
    f.fail();await e.copy.handlers.click();assert.equal(e['result-text'].selected,true,slug+' fallback');checks++;
  }
  const f=fixture('volume-calculator',{shape:'sphere',unit:'cm',a:'3',b:'bad',c:'bad'});f.ids.shape.handlers.change();assert.equal(f.ids['b-field'].hidden,true);assert.equal(f.ids['c-field'].hidden,true);f.submit();assert.equal(f.ids.result.hidden,false);checks++;
  const stale=fixture('ratio-calculator',{a:'2',b:'3',c:'4',d:''});stale.submit();stale.defer();const pending=stale.ids.copy.handlers.click();stale.ids.calculator.handlers.input();stale.resolve();await pending;assert.equal(stale.ids['copy-status'].textContent,'');checks++;
  for(const slug of slugs){const h=fs.readFileSync(path.join(root,'tools',slug+'.html'),'utf8');assert.equal((h.match(/src="\/ad-banner-isolated\.js\?v=20261027-banner"/g)||[]).length,1);assert.ok(!/<button[^>]*>[^<]*(예시|먼저 해보기)/.test(h));assert.match(h,/site-ui\.css\?v=20261104-simple/);}
  console.log('PASS - '+checks+' math100 calculation/precision/bounds and actual input/submit/copy/stale UI groups, 10 ads and no example buttons');
})().catch(error=>{console.error(error);process.exitCode=1;});
