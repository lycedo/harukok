const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const {cropRectangle,validateCropFile,cropDownloadName}=require('../tools/image-cropper');
let checks=0;
function equal(actual,expected){assert.deepEqual(actual,expected);checks++;}
function invalid(fn){assert.throws(fn);checks++;}
equal(cropRectangle(1200,800,'1:1'),{x:200,y:0,width:800,height:800});
equal(cropRectangle(1200,800,'1:1',0,50),{x:0,y:0,width:800,height:800});
equal(cropRectangle(1200,800,'1:1',100,50),{x:400,y:0,width:800,height:800});
equal(cropRectangle(800,1200,'1:1',50,100),{x:0,y:400,width:800,height:800});
equal(cropRectangle(1200,800,'16:9'),{x:0,y:63,width:1200,height:675});
equal(cropRectangle(1200,800,'9:16'),{x:375,y:0,width:450,height:800});
equal(cropRectangle(1200,800,'4:3'),{x:67,y:0,width:1067,height:800});
equal(cropRectangle(1200,800,'3:4'),{x:300,y:0,width:600,height:800});
equal(cropRectangle(1200,800,'original',0,100),{x:0,y:0,width:1200,height:800});
equal(cropRectangle(1,1,'16:9'),{x:0,y:0,width:1,height:1});
for(const args of [[0,800,'1:1'],[4001,3000,'1:1'],[1.5,2,'original'],[Infinity,2,'1:1'],[1200,800,'fake'],[1200,800,'toString'],[1200,800,'1:1',-1],[1200,800,'1:1',50,101],[1200,800,'1:1',NaN]]) invalid(()=>cropRectangle(...args));
for(const [width,height] of [[1,1],[2,200],[301,101],[1000,777],[4000,3000]]) {
  for(const ratio of ['1:1','4:3','3:4','16:9','9:16','original']) {
    for(const position of [0,37,50,100]) {
      const rect=cropRectangle(width,height,ratio,position,position);
      assert.ok(rect.x>=0&&rect.y>=0&&rect.width>=1&&rect.height>=1&&rect.x+rect.width<=width&&rect.y+rect.height<=height);
      assert.ok(Object.values(rect).every(Number.isInteger));checks++;
    }
  }
}
for(const file of [null,{size:0,type:'image/png'},{size:10485761,type:'image/jpeg'},{size:10,type:'image/svg+xml'},{size:10,type:'text/html',name:'image.png'},{size:10,type:'',name:'image.heic'}]) invalid(()=>validateCropFile(file));
validateCropFile({size:10485760,type:'image/webp'});validateCropFile({size:10,type:'',name:'IMAGE.PNG'});
equal(cropDownloadName('가족 사진.jpg',800,800,'image/png'),'가족 사진-crop-800x800.png');
equal(cropDownloadName('a/b?.png',1,1,'image/jpeg'),'a_b_-crop-1x1.jpg');

// Exercise real UI handlers with delayed decodes/encodes, including stale callbacks.
const html=fs.readFileSync(path.join(__dirname,'../tools/image-cropper.html'),'utf8');
const nodes=new Map(),images=[],callbacks=[],urls=[],revoked=[],draws=[],fills=[];
function canvasNode(){return {width:1,height:1,getContext(){return {fillRect(...args){fills.push(args);},fillText(){},drawImage(...args){draws.push(args);}};},toBlob(callback,type){callbacks.push({callback,type,width:this.width,height:this.height});}};}
for(const match of html.matchAll(/id="([^"]+)"/g)){
  nodes.set(match[1],{value:'',hidden:true,disabled:false,textContent:'',files:[],handlers:{},
    addEventListener(type,fn){this.handlers[type]=fn;},removeAttribute(name){delete this[name];}});
}
const $=id=>nodes.get(id);
Object.assign($('crop-preview'),canvasNode());$('crop-ratio').value='1:1';$('output-format').value='image/png';
const listeners={};
vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../tools/image-cropper.js'),'utf8'),{
  document:{getElementById:$,createElement(type){assert.equal(type,'canvas');return canvasNode();}},
  Image:class{constructor(){images.push(this);}naturalWidth=1200;naturalHeight=800;},
  File:class{constructor(parts,name,options){this.size=parts[0].size;this.type=options.type;this.name=name;}},
  URL:{createObjectURL(blob){const url='blob:'+urls.length;urls.push({url,blob});return url;},revokeObjectURL(url){revoked.push(url);}},
  window:{addEventListener(type,fn){listeners[type]=fn;}}
});
function fire(id,type='input'){$(id).handlers[type]({preventDefault(){}});}
function select(name='sample.png'){$('image-file').files=[{size:1000,type:'image/png',name}];fire('image-file','change');return images.at(-1);}
const first=select(),second=select('second.png');first.onload();equal($('image-previews').hidden,true);second.onload();
equal($('image-previews').hidden,false);equal($('position-y').disabled,true);equal($('position-x').disabled,false);
equal(draws.at(-1).slice(1),[200,0,800,800,0,0,800,800]);equal(revoked.includes('blob:0'),true);
$('position-x').value='100';fire('position-x');equal(draws.at(-1).slice(1,5),[400,0,800,800]);
fire('crop-form','submit');const stale=callbacks.shift();equal($('crop-submit').disabled,true);
$('crop-ratio').value='16:9';fire('crop-ratio');stale.callback({type:'image/png',size:500});equal($('image-result').hidden,true);equal(urls.length,2);
equal($('position-x').disabled,true);equal($('position-y').disabled,false);equal($('crop-preview').width,800);equal($('crop-preview').height,450);
fire('crop-form','submit');const ready=callbacks.shift();equal([ready.width,ready.height],[1200,675]);ready.callback({type:'image/png',size:500});
equal($('image-result').hidden,false);equal($('download-image').download,'second-crop-1200x675.png');const downloadURL=$('download-image').href;
$('output-format').value='image/jpeg';fire('output-format');equal($('download-image').href,undefined);equal(revoked.includes(downloadURL),true);assert.ok(fills.length>0);checks++;
fire('crop-form','submit');const pending=callbacks.shift();select('third.png');pending.callback({type:'image/jpeg',size:400});equal($('image-result').hidden,true);
images.at(-1).onload();fire('crop-form','submit');callbacks.shift().callback({type:'image/png',size:300});equal($('image-result').hidden,true);assert.ok($('image-error').textContent.includes('파일을 만들지 못했습니다'));checks++;
fire('demo-image','click');const demo=callbacks.shift();select('newest.png');const before=images.length;demo.callback({type:'image/png',size:200});equal(images.length,before);
const oversized=images.at(-1);oversized.naturalWidth=4001;oversized.naturalHeight=3000;oversized.onload();equal($('image-controls').disabled,true);assert.ok($('image-error').textContent.includes('1,200만'));checks++;
const last=select();last.onload();const sourceURL=$('original-preview').src;listeners.pagehide();equal(revoked.includes(sourceURL),true);
equal((html.match(/src="\/ad-banner-isolated.js/g)||[]).length,1);equal((html.match(/<h1>/g)||[]).length,1);
const schema=JSON.parse(html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]);equal(schema.url,'https://harukok.com/tools/image-cropper');
console.log(`PASS - ${checks} crop geometry, validation, preview, stale callback and URL cleanup checks`);
