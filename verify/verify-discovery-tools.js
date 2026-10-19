'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const {calculateAge,calendarDate}=require('../tools/age-calculator');
const {parseParticipants,drawNames,splitTeams,shuffled}=require('../tools/random-tools');
let checks=0;
function test(name,fn){fn();checks++;console.log('PASS '+name);}
test('Birthday boundaries',()=>{
  assert.equal(calculateAge('2000-10-20','2026-10-19').age,25);
  assert.deepEqual(calculateAge('2000-10-20','2026-10-20'),{age:26,yearAge:26,countingAge:27,days:9496,nextBirthday:'2026-10-20',untilBirthday:0});
  assert.equal(calculateAge('2000-10-20','2026-10-21').age,26);
  assert.equal(calculateAge('2026-10-19','2026-10-19').age,0);
  assert.equal(calculateAge('2000-01-01','2026-12-31').untilBirthday,1);
});
test('Leap day convention and calendar validation',()=>{
  assert.equal(calculateAge('2000-02-29','2025-02-28').age,24);
  assert.equal(calculateAge('2000-02-29','2025-03-01').age,25);
  assert.equal(calculateAge('2000-02-29','2024-02-28').nextBirthday,'2024-02-29');
  assert.equal(calculateAge('2000-02-29','2024-02-29').untilBirthday,0);
  for(const date of ['','2026-02-29','1900-02-29','2026-13-01','1899-01-01','2101-01-01','2026-1-1']) assert.throws(()=>calendarDate(date));
  assert.throws(()=>calculateAge('2026-10-20','2026-10-19'));
});
test('Names, duplicates, limits and markup as plain text',()=>{
  assert.deepEqual(parseParticipants(' A \r\n\n B\n<script>x</script>'),['A','B','<script>x</script>']);
  assert.deepEqual(parseParticipants('민수 A\n민수 B'),['민수 A','민수 B']);
  for(const text of ['','A\n A ','가\n가','a'.repeat(61),Array.from({length:201},(_,i)=>String(i)).join('\n'),'a'.repeat(16001)]) assert.throws(()=>parseParticipants(text));
});
test('Draw has no missing or duplicated participants',()=>{
  const names=Array.from({length:200},(_,i)=>'참가자 '+i), original=names.slice();
  for(let i=0;i<20;i++) {
    const picked=drawNames(names,7);assert.equal(picked.length,7);assert.equal(new Set(picked).size,7);assert.ok(picked.every(n=>names.includes(n)));
    assert.deepEqual(drawNames(names,200).sort(),names.slice().sort());
  }
  assert.deepEqual(names,original);
  for(const n of [0,-1,201,1.5,NaN]) assert.throws(()=>drawNames(names,n));
});
test('Teams balance and every person occurs exactly once',()=>{
  for(const size of [2,7,10,13,200]) for(const count of [2,3,4,50].filter(n=>n<=size)) {
    const names=Array.from({length:size},(_,i)=>String(i));const teams=splitTeams(names,count);
    assert.equal(teams.length,count);assert.deepEqual(teams.flat().sort(),names.slice().sort());
    assert.ok(Math.max(...teams.map(t=>t.length))-Math.min(...teams.map(t=>t.length))<=1);
  }
  for(const n of [0,1,4,2.5,NaN,51]) assert.throws(()=>splitTeams(['A','B','C'],n));
});
test('Random integer rejects biased overflow range',()=>{
  let calls=0;const context={Uint32Array,module:{exports:{}},crypto:{getRandomValues(buffer){buffer[0]=calls++===0?4294967295:7;}}};
  vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../tools/random-tools.js'),'utf8'),context);
  assert.equal(context.module.exports.randomIndex(10),7);assert.equal(calls,2);
});
test('Baby names cover each season without duplicate suggestions',()=>{
  const context={module:{exports:{}},shuffled};
  vm.createContext(context);vm.runInContext(fs.readFileSync(path.join(__dirname,'../fun/baby-name-generator.js'),'utf8'),context);
  assert.equal(context.module.exports.babyNames.length,32);
  assert.equal(new Set(context.module.exports.babyNames.map(n=>n.name)).size,32);
  for(const season of ['all','spring','summer','autumn','winter']) {
    const names=vm.runInContext(`recommendNames('${season}')`,context);
    assert.equal(names.length,6);assert.equal(new Set(names.map(n=>n.name)).size,6);
    assert.ok(names.every(n=>n.wish.length>5&&(season==='all'||n.season===season)));
  }
  assert.throws(()=>vm.runInContext("recommendNames('bad')",context));
});
test('Discoverability, local assets, isolated banners and redirects',()=>{
  const root=path.join(__dirname,'..'),home=fs.readFileSync(path.join(root,'index.html'),'utf8'),sitemap=fs.readFileSync(path.join(root,'sitemap.xml'),'utf8');
  for(const file of ['tools/age-calculator','tools/random-picker','tools/team-generator','fun/baby-name-generator']) {
    const html=fs.readFileSync(path.join(root,file+'.html'),'utf8');
    assert.ok(home.includes('href="/'+file+'"'));assert.ok(sitemap.includes('<loc>https://harukok.com/'+file+'</loc>'));
    assert.ok(html.includes('rel="canonical" href="https://harukok.com/'+file+'"'));assert.equal((html.match(/ad-banner-isolated\.js/g)||[]).length,2);
    for(const [,url] of html.matchAll(/(?:src|href)="(\/[^"#?]*)(?:[^\"]*)"/g)) {
      const local=path.join(root,url);assert.ok(fs.existsSync(local)||fs.existsSync(local+'.html'),url);
    }
    const json=html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1];assert.equal(JSON.parse(json).url,'https://harukok.com/'+file);
  }
  assert.match(fs.readFileSync(path.join(root,'_redirects'),'utf8'),/\/tools\/dday-calculator \/tools\/date-calculator 301/);
});
console.log(`${checks} discovery-tool checks passed`);
