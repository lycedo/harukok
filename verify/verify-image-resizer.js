const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const {validateResizeFile,resizeDimensions,imageSizeComparison,imageDownloadName}=require('../tools/image-resizer');
let checks=0;
function equal(actual,expected){assert.deepEqual(actual,expected);checks++;}
function invalid(fn){assert.throws(fn);checks++;}
equal(resizeDimensions(4000,3000,1200),{width:1200,height:900});
equal(resizeDimensions(3000,4000,1500),{width:1500,height:2000});
equal(resizeDimensions(5,3,2),{width:2,height:1});
equal(resizeDimensions(12000000,1,1),{width:1,height:1});
for(const args of [[4001,3000,100],[0,300,100],[400,300,401],[400,300,0],[400,300,1.5],[400,300,NaN],[Infinity,1,1]]) invalid(()=>resizeDimensions(...args));
for(const file of [{size:0,type:'image/png'},{size:10485761,type:'image/png'},{size:40,type:'image/svg+xml'},{size:40,type:'image/gif'},{size:40,type:'text/plain',name:'photo.png'},null]) invalid(()=>validateResizeFile(file));
validateResizeFile({size:10485760,type:'image/png'});
validateResizeFile({size:1,type:'',name:'PHOTO.JPEG'});
equal(imageSizeComparison(1000,400),{change:-60,label:'감소'});
equal(imageSizeComparison(1000,1200),{change:20,label:'증가'});
equal(imageSizeComparison(1000,1000),{change:0,label:'변화 없음'});
equal(imageDownloadName('가족 사진.jpg',1200,800,'image/webp'),'가족 사진-1200x800.webp');
equal(imageDownloadName('a/b?.png',1,1,'image/png'),'a_b_-1x1.png');

// Resolve browser callbacks out of order to test real UI stale-result and URL cleanup paths.
const html=fs.readFileSync(path.join(__dirname,'../tools/image-resizer.html'),'utf8');
const elements=new Map(),images=[],blobs=[],created=[],revoked=[],draws=[];
for(const match of html.matchAll(/id="([^"]+)"/g)){
  elements.set(match[1],{value:'',hidden:true,disabled:false,textContent:'',files:[],handlers:{},
    addEventListener(type,handler){this.handlers[type]=handler;},
    removeAttribute(name){delete this[name];}});
}
const $=id=>elements.get(id);
function fire(id,type){$(id).handlers[type]({preventDefault(){}});}
$('output-format').value='image/jpeg';$('image-quality').value='80';
const listeners={};
const sandbox={
  document:{
    getElementById:$,
    createElement(type){
      assert.equal(type,'canvas');
      return {getContext(){return {fillRect(){draws.push('white');},drawImage(){draws.push('image');},
        fillText(){},beginPath(){},arc(){},fill(){}};},
        toBlob(callback,type){blobs.push({callback,type});}};
    }
  },
  Image:class {constructor(){images.push(this);} naturalWidth=1200;naturalHeight=800;},
  File:class {constructor(parts,name,options){this.size=parts[0].size;this.type=options.type;this.name=name;}},
  URL:{createObjectURL(blob){const url='blob:'+created.length;created.push({url,blob});return url;},revokeObjectURL(url){revoked.push(url);}},
  window:{addEventListener(type,handler){listeners[type]=handler;}}
};
vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../tools/image-resizer.js'),'utf8'),sandbox);
function select(name='photo.png'){ $('image-file').files=[{name,size:2000,type:'image/png'}]; fire('image-file','change'); return images.at(-1);}
const old=select(),current=select('current.png');
old.onload();equal($('image-previews').hidden,true);
current.onload();equal($('image-previews').hidden,false);equal($('image-controls').disabled,false);
equal(revoked.includes('blob:0'),true);
$('target-width').value='600';fire('resize-form','submit');
equal(draws.slice(-2),['white','image']);equal($('resize-submit').disabled,true);
fire('target-width','input');blobs.shift().callback({type:'image/jpeg',size:800});
equal($('image-result').hidden,true);equal(created.length,2);equal($('resize-submit').disabled,false);
fire('resize-form','submit');blobs.shift().callback({type:'image/jpeg',size:800});
equal($('image-result').hidden,false);equal($('download-image').download,'current-600x400.jpg');
equal($('download-image').href,'blob:2');
fire('image-quality','input');equal(revoked.includes('blob:2'),true);equal($('download-image').href,undefined);
fire('resize-form','submit');
select('replacement.png');
blobs.shift().callback({type:'image/jpeg',size:700});
equal($('image-result').hidden,true);equal(created.length,4);
images.at(-1).onload();$('target-width').value='600';$('output-format').value='image/webp';
fire('resize-form','submit');blobs.shift().callback({type:'image/png',size:700});
equal($('image-result').hidden,true);assert.ok($('image-error').textContent.includes('저장하지 못했습니다'));checks++;
$('output-format').value='image/png';fire('output-format','input');equal($('image-quality').disabled,true);
$('image-quality').value='';fire('resize-form','submit');blobs.shift().callback({type:'image/png',size:3000});
equal($('image-result').hidden,false);assert.ok($('size-comparison').textContent.includes('증가'));checks++;
fire('demo-image','click');const demoCallback=blobs.shift().callback;select('newest.png');const imageCount=images.length;
demoCallback({type:'image/png',size:100});equal(images.length,imageCount);
const tooBig=images.at(-1);tooBig.naturalWidth=5000;tooBig.naturalHeight=4000;tooBig.onload();
equal($('image-previews').hidden,true);equal($('image-controls').disabled,true);assert.ok($('image-error').textContent.includes('1,200만'));checks++;
const last=select();last.onload();const activeURL=$('original-preview').src;listeners.pagehide();equal(revoked.includes(activeURL),true);
equal((html.match(/src="\/ad-banner-isolated.js/g)||[]).length,1);
equal((html.match(/<h1>/g)||[]).length,1);
const schema=JSON.parse(html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]);
equal(schema.url,'https://harukok.com/tools/image-resizer');
console.log(`PASS - ${checks} image resize, format validation, stale callback and URL cleanup checks`);
