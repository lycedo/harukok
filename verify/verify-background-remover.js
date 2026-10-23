'use strict';
const assert=require('node:assert/strict');
const {removeWhitePixels,backgroundSize}=require('../tools/background-remover');
const fs=require('node:fs'),path=require('node:path');
let passed=0;
function check(name,fn){fn();passed++;console.log('PASS '+name);}
function pixels(rows) {
  const map={'W':[255,255,255,255],'B':[0,0,0,255],'G':[240,240,240,255],'R':[255,255,100,255],'T':[0,0,0,0]};
  return new Uint8ClampedArray(rows.join('').split('').flatMap(x=>map[x]));
}
function alpha(p,w,x,y){return p[(y*w+x)*4+3];}
check('Edge flood preserves enclosed white, global clears it',()=>{
  const p=pixels(['WWWWW','WBBBW','WBWBW','WBBBW','WWWWW']);
  assert.equal(removeWhitePixels(p,5,5,0,true),16);
  assert.equal(alpha(p,5,2,2),255);assert.equal(alpha(p,5,0,0),0);
  assert.equal(removeWhitePixels(p,5,5,0,false),1);assert.equal(alpha(p,5,2,2),0);
});
check('Diagonal pixels do not connect across dark boundaries',()=>{
  const p=pixels(['WBB','BWB','BBB']);
  assert.equal(removeWhitePixels(p,3,3,0,true),1);assert.equal(alpha(p,3,1,1),255);
});
check('Transparent boundary connects to inner white without changing color',()=>{
  const p=pixels(['TTT','TWT','TTT']);
  assert.equal(removeWhitePixels(p,3,3,20,true),1);assert.equal(alpha(p,3,1,1),0);
  assert.equal(p[4*4],255);
});
check('Threshold requires each RGB channel, preserves partial alpha on nonwhite',()=>{
  const p=pixels(['WGR']);p[11]=128;
  assert.equal(removeWhitePixels(p,3,1,10,false),1);
  assert.equal(alpha(p,3,1,0),255);
  assert.equal(removeWhitePixels(p,3,1,15,false),1);
  assert.equal(alpha(p,3,2,0),128);
});
check('Single pixel, nonwhite and fullwhite inputs',()=>{
  assert.equal(removeWhitePixels(pixels(['W']),1,1,0),1);
  assert.equal(removeWhitePixels(pixels(['B']),1,1,100),0);
  assert.equal(removeWhitePixels(pixels(['WWW','WWW']),3,2,0),6);
});
check('Image dimensions and work limits',()=>{
  assert.deepEqual(backgroundSize(4000,3000),{width:1600,height:1200});
  assert.deepEqual(backgroundSize(3000,4000),{width:1200,height:1600});
  assert.deepEqual(backgroundSize(480,300),{width:480,height:300});
  assert.deepEqual(backgroundSize(1,3000),{width:1,height:1600});
  for(const dims of [[0,5],[1.2,6],[4001,3000],[NaN,2]]) assert.throws(()=>backgroundSize(...dims));
  for(const value of [-1,101,1.2,NaN]) assert.throws(()=>removeWhitePixels(pixels(['W']),1,1,value));
  assert.throws(()=>removeWhitePixels(new Uint8ClampedArray(4),2,2,20));
});
check('Metadata, banners, safe static output',()=>{
  const html=fs.readFileSync(path.join(__dirname,'../tools/background-remover.html'),'utf8');
  assert.ok(html.includes('https://harukok.com/tools/background-remover'));
  const data=JSON.parse(html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]);assert.equal(data.url,'https://harukok.com/tools/background-remover');
  assert.equal((html.match(/ad-banner-isolated.js/g)||[]).length,1);
  const js=fs.readFileSync(path.join(__dirname,'../tools/background-remover.js'),'utf8');
  assert.ok(!js.includes('innerHTML'));assert.ok(!js.includes('fetch('));
});
console.log(`${passed} background-remover checks passed`);
