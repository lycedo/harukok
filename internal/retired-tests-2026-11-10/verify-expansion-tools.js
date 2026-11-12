'use strict';
const assert=require('node:assert/strict'),fs=require('fs'),vm=require('vm'),path=require('path');
const {workMinutes}=require('../tools/work-time-calculator');
const {mixingAmounts}=require('../tools/mixing-amount-calculator');
const {colorHex,pixelPosition,validateColorFile}=require('../tools/image-color-picker');
const {FakeDocument}=require('./dom-shim');
assert.deepEqual(workMinutes('09:00','18:00',60,false),{span:540,minutes:480});
assert.equal(workMinutes('22:30','06:15',30,true).minutes,435);
assert.equal(workMinutes('09:00','09:00',0,false).minutes,0);
assert.equal(workMinutes('09:00','09:00',60,true).minutes,1380);
assert.equal(workMinutes('00:00','00:01',1,false).minutes,0);
for(const a of [['22:00','06:00',0,false],['09:00','18:00',0,true],['24:00','18:00',0,false],['','18:00',0,false],['09:00','18:00',541,false],['09:00','18:00',0.5,false],['09:00','18:00',NaN,false]])assert.throws(()=>workMinutes(...a));
assert.deepEqual(mixingAmounts(90,[2,1,0]).map(r=>r.amount),[60,30,0]);
assert.deepEqual(mixingAmounts(100,[0,0,1]).map(r=>r.amount),[0,0,100]);
for(const total of [0.001,2.5,99,1e6])for(const ratios of [[1,1,1],[0.1,0.2,0],[1e6,1,0.001]])assert(Math.abs(mixingAmounts(total,ratios).reduce((s,r)=>s+r.amount,0)-total)<1e-8);
for(const a of [[0,[1,1,0]],[100,[0,0,0]],[100,[-1,1,1]],[100,[NaN,1,1]],[Infinity,[1,1,1]],[100,[1,1]],[100,[1e7,1,0]]])assert.throws(()=>mixingAmounts(...a));
assert.equal(colorHex([0,15,255,255]),'#000FFF');assert.equal(colorHex(new Uint8ClampedArray([178,58,46,128])),'#B23A2E');
assert.deepEqual(pixelPosition(3999,2999,4000,3000),{x:3999,y:2999});
for(const a of [[1,0,1,1],[-1,0,5,5],[0.5,0,5,5],[0,0,4001,3000]])assert.throws(()=>pixelPosition(...a));
validateColorFile({size:1,type:'image/png'});validateColorFile({size:1024,name:'TEST.JPG',type:''});
for(const f of [null,{size:0,type:'image/png'},{size:11*1024*1024,type:'image/png'},{size:1,type:'image/svg+xml'}])assert.throws(()=>validateColorFile(f));
function setup(slug,extra={}){const doc=new FakeDocument();doc.registerFromHtml(fs.readFileSync(path.join(__dirname,'../tools/'+slug+'.html'),'utf8'));vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../tools/'+slug+'.js'),'utf8'),{document:doc,...extra});return id=>doc.getElementById(id);}
const submit=e=>e.dispatchEvent({type:'submit',preventDefault(){}});
const w=setup('work-time-calculator');submit(w('calculator'));assert.equal(w('result-value').textContent,'8시간 0분');w('start').value='22:00';w('end').value='06:00';w('next-day').checked=true;submit(w('calculator'));assert.equal(w('result-value').textContent,'7시간 0분');w('calculator').dispatchEvent({type:'input'});assert(w('result').hidden);w('break-minutes').value='';submit(w('calculator'));assert(w('error').textContent);assert(w('result').hidden);
const m=setup('mixing-amount-calculator');m('unit').value='g';submit(m('calculator'));assert(m('amounts').children[0].textContent.includes('66.667 g'));m('calculator').dispatchEvent({type:'change'});assert(m('result').hidden);m('ratio-a').value='0';m('ratio-b').value='0';submit(m('calculator'));assert(m('error').textContent);assert(m('result').hidden);
// Exercise image load races, corrupt files, pixel sampling, alpha and copy failure.
(async()=>{
 const doc=new FakeDocument();doc.registerFromHtml(fs.readFileSync(path.join(__dirname,'../tools/image-color-picker.html'),'utf8'));const get=id=>doc.getElementById(id),images=[],revoked=[];let rgba=[178,58,46,255],copyMode='ok',resolveCopy;
 get('image-canvas').getContext=()=>({drawImage(){},fillRect(){},getImageData(){return {data:rgba};}});get('image-canvas').getBoundingClientRect=()=>({left:0,top:0,width:300,height:150});
 const navigator={clipboard:{writeText(){if(copyMode==='fail')return Promise.reject(Error());if(copyMode==='pending')return new Promise(r=>resolveCopy=r);return Promise.resolve();}}};
 vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../tools/image-color-picker.js'),'utf8'),{document:doc,navigator,URL:{createObjectURL(){return 'blob:'+images.length;},revokeObjectURL(u){revoked.push(u);}},Image:class{constructor(){images.push(this);this.naturalWidth=600;this.naturalHeight=300;}}});
 const flush=()=>new Promise(r=>setImmediate(r));get('sample').click();get('image-canvas').dispatchEvent({type:'click',clientX:299,clientY:149});assert.equal(get('pixel-x').value,'598');assert.equal(get('pixel-y').value,'298');assert.equal(get('result-value').textContent,'#B23A2E');
 get('copy').click();await flush();assert.match(get('copy-status').textContent,/복사했/);copyMode='fail';get('copy').click();await flush();assert.match(get('copy-status').textContent,/못했/);
 copyMode='pending';get('copy').click();get('sample').click();resolveCopy();await flush();assert.equal(get('copy-status').textContent,'');assert(get('result').hidden);
 get('image-file').files=[{size:10,type:'image/png'}];get('image-file').dispatchEvent({type:'change'});get('image-file').dispatchEvent({type:'change'});images[0].onload();assert(get('picker').hidden);images[1].onload();assert(!get('picker').hidden);assert.equal(revoked.length,2);
 rgba=[0,0,0,0];submit(get('coordinates'));assert(get('result').hidden);assert.match(get('error').textContent,/透明|투명/);
 rgba=[1,2,3,128];submit(get('coordinates'));assert.match(get('result-detail').textContent,/50.2%/);
 get('image-file').dispatchEvent({type:'change'});images[2].onerror();assert(get('picker').hidden);assert.match(get('error').textContent,/읽지 못/);
 get('image-file').dispatchEvent({type:'change'});images[3].naturalWidth=13000000;images[3].onload();assert(get('picker').hidden);assert.match(get('error').textContent,/1,200만/);
 const home=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8'),map=fs.readFileSync(path.join(__dirname,'../sitemap.xml'),'utf8');
 for(const slug of ['work-time-calculator','mixing-amount-calculator','image-color-picker']){const h=fs.readFileSync(path.join(__dirname,'../tools/'+slug+'.html'),'utf8');assert(home.includes('/tools/'+slug));assert(map.includes('/tools/'+slug));assert.equal((h.match(/class="ad-banner ad-banner-strip"/g)||[]).length,1);assert(h.includes('<link rel="canonical" href="https://harukok.com/tools/'+slug+'"'));}
 console.log('PASS - work time, proportions, image pixel extraction, load races, copying and discovery');
})().catch(e=>{console.error(e);process.exit(1);});
