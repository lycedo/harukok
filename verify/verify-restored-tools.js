const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert');
const {FakeDocument,loadCalculator}=require('./dom-shim');
const root=path.join(__dirname,'..');
const html=fs.readFileSync(path.join(root,'tools/password-generator.html'),'utf8');
const doc=new FakeDocument();doc.registerFromHtml(html);
for(const id of ['optUpper','optLower','optNumber','optSymbol'])doc.getElementById(id).checked=true;
let calls=0;
const context={document:doc,crypto:{getRandomValues(a){calls++;a[0]=calls===1?0xffffffff:42;return a;}},Uint32Array,Math,setTimeout:()=>{}};
for(const m of html.matchAll(/<script([^>]*)>([\s\S]*?)<\/script>/g))if(!/src=|ld\+json/.test(m[1]))vm.runInNewContext(m[2],context);
assert.equal(calls,32,'rejected random sample must be retried');
for(const length of [6,16,32]){
 doc.getElementById('length').value=length;doc.getElementById('genBtn').click();
 const pw=doc.getElementById('output').value;
 assert.equal(pw.length,length);for(const re of [/[A-Z]/,/[a-z]/,/[0-9]/,/[!@#$%^&*()\-_=+\[\]{}]/])assert(re.test(pw));
}
for(const id of ['optUpper','optLower','optNumber','optSymbol'])doc.getElementById(id).checked=false;
doc.getElementById('genBtn').click();assert(doc.getElementById('output').value.includes('선택하세요'));
const age=loadCalculator(path.join(root,'tools/pet-age-calculator.html'));
age.getElementById('years').value=3;age.getElementById('calcBtn').click();assert(age.getElementById('humanAge').textContent.startsWith('28'));
const food=loadCalculator(path.join(root,'tools/pet-food-calculator.html'));
food.getElementById('weight').value=5;food.getElementById('density').value=350;food.getElementById('calcBtn').click();assert(food.getElementById('dailyGram').textContent.startsWith('107'));
food.getElementById('weight').value=0;food.getElementById('calcBtn').click();assert(food.getElementById('resultCard').classList.contains('hidden'));
console.log('PASS - restored password generation and pet calculation regression checks');
