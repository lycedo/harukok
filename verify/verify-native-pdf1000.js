'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const P=require('../tools/vendor/pdf-lib-1.17.1.min.js'),api=require('../tools/native1000-pdf.js');
const N=P.PDFName.of;let checks=0;const outputs={};
function eq(a,b,label){assert.deepEqual(a,b,label);checks++;}
function ok(x,label){assert.ok(x,label);checks++;}
async function rejects(fn,re,label){await assert.rejects(fn,re,label);checks++;}
const bytes=s=>new TextEncoder().encode(s);
const file=(name,data,type='application/pdf')=>({name,type,bytes:data});
async function read(a){return P.PDFDocument.load(a.bytes,{updateMetadata:false});}
async function fixtures(){
 const sample=await P.PDFDocument.create(),font=await sample.embedFont(P.StandardFonts.Helvetica);sample.setTitle('Source title');sample.setAuthor('Source author');
 for(let i=1;i<=3;i++){const p=sample.addPage([300+i*10,400+i*20]);p.drawText('PAGE '+i,{x:30,y:300,font,size:24});p.drawRectangle({x:20,y:20,width:35,height:45,color:P.rgb(i===1?1:0,i===2?1:0,i===3?1:0)});}
 const second=await P.PDFDocument.create();second.addPage([200,300]).drawText('SECOND');
 const form=await P.PDFDocument.create(),fp=form.addPage([500,600]),f=form.getForm();const text=f.createTextField('name');text.setText('Initial');text.addToPage(fp,{x:30,y:400,width:300,height:35});const check=f.createCheckBox('agree');check.addToPage(fp,{x:30,y:350,width:20,height:20});const dropdown=f.createDropdown('choice');dropdown.addOptions(['A','B']);dropdown.select('A');dropdown.addToPage(fp,{x:30,y:300,width:150,height:25});
 const annotations=await P.PDFDocument.load(await sample.save());const link=annotations.context.register(annotations.context.obj({Type:'Annot',Subtype:'Link',Rect:[20,20,80,80],A:{S:'URI',URI:P.PDFString.of('https://example.com/a?x=1')},Border:[0,0,0]}));const note=annotations.context.register(annotations.context.obj({Type:'Annot',Subtype:'Text',Rect:[100,100,120,120],Contents:P.PDFString.of('note')}));annotations.getPage(0).node.set(N('Annots'),annotations.context.obj([link,note]));
 const attached=await P.PDFDocument.load(await sample.save());await attached.attach(bytes('attached text\n'),'notes.txt',{mimeType:'text/plain'});
 const front=await P.PDFDocument.create(),back=await P.PDFDocument.create();for(let i=1;i<=2;i++){front.addPage([300,400]).drawText('FRONT '+i);back.addPage([300,400]).drawText('BACK '+i);}
 const rotated=await P.PDFDocument.load(await sample.save());rotated.getPage(0).setRotation(P.degrees(90));rotated.getPage(1).setRotation(P.degrees(180));rotated.getPage(2).setRotation(P.degrees(270));
 const crop=await P.PDFDocument.load(await sample.save());crop.getPage(0).setMediaBox(10,20,310,420);crop.getPage(0).setCropBox(20,30,200,250);crop.getPage(0).setRotation(P.degrees(90));crop.getPage(1).node.set(N('UserUnit'),P.PDFNumber.of(2));
 const png=new Uint8Array(Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Wl6pO8AAAAASUVORK5CYII=','base64'));
 return {'sample.pdf':file('sample.pdf',await sample.save()),'second.pdf':file('second.pdf',await second.save()),'form.pdf':file('form.pdf',await form.save()),'annotations.pdf':file('annotations.pdf',await annotations.save()),'attached.pdf':file('attached.pdf',await attached.save()),'front.pdf':file('front.pdf',await front.save()),'back.pdf':file('back.pdf',await back.save()),'rotated.pdf':file('rotated.pdf',await rotated.save()),'cropped.pdf':file('cropped.pdf',await crop.save()),'mark.png':file('mark.png',png,'image/png'),'notes.txt':file('notes.txt',bytes('attachment payload'),'text/plain')};
}
async function main(){
 const F=await fixtures(),run=async(mode,v={},names=['sample.pdf'])=>{const r=await api.process(mode,v,names.map(n=>typeof n==='string'?F[n]:n));ok(typeof r.value==='string'&&typeof r.text==='string'&&Array.isArray(r.artifacts),mode+' contract');for(const a of r.artifacts){ok(a.bytes instanceof Uint8Array&&a.bytes.length>0,mode+' bytes');ok(a.name&&!/[\\/]/.test(a.name),mode+' safe name');}outputs[mode]=r;return r;};
 let r=await run('merge',{},['sample.pdf','second.pdf']),d;eq((await read(r.artifacts[0])).getPageCount(),4,'merge count');
 r=await run('extract',{pages:'3,1'});eq((await read(r.artifacts[0])).getPageCount(),2,'extract count');
 r=await run('delete',{pages:'2'});eq((await read(r.artifacts[0])).getPageCount(),2,'delete count');
 r=await run('reorder',{pages:'3,1,1,2'});eq((await read(r.artifacts[0])).getPageCount(),4,'repeated reorder');
 r=await run('split',{ranges:'1-2\n3'});eq(r.artifacts.length,2,'split files');eq((await read(r.artifacts[1])).getPageCount(),1,'split last count');
 r=await run('rotate',{pages:'1,3',angle:'90'});eq((await read(r.artifacts[0])).getPages().map(p=>p.getRotation().angle),[90,0,90],'selected rotation');
 r=await run('blank',{before:'2',count:'2'});eq((await read(r.artifacts[0])).getPageCount(),5,'blank count');
 r=await run('interleave',{backOrder:'reverse'},['front.pdf','back.pdf']);eq((await read(r.artifacts[0])).getPageCount(),4,'interleave');
 r=await run('numbers',{pages:'',start:'10',size:'12'});eq((await read(r.artifacts[0])).getPageCount(),3,'numbers count');
 r=await run('textWatermark',{pages:'',text:'하루콕 확인',size:'22',opacity:'25'});eq((await read(r.artifacts[0])).getPageCount(),3,'Korean watermark');
 r=await run('imageWatermark',{pages:'1',widthPercent:'35',opacity:'20'},['sample.pdf','mark.png']);eq((await read(r.artifacts[0])).getPageCount(),3,'image watermark');
 r=await run('addText',{pages:'1',text:'검토 완료',x:'20',y:'20',size:'14'});d=await read(r.artifacts[0]);eq(d.getPageCount(),3,'Korean text');const addedFonts=d.getPage(0).node.Resources().lookup(N('Font'),P.PDFDict);let customFont=false;for(const ref of addedFonts.values()){const dict=d.context.lookup(ref,P.PDFDict),descendants=dict.lookupMaybe(N('DescendantFonts'),P.PDFArray);if(!descendants)continue;const child=descendants.lookup(0,P.PDFDict),descriptor=child.lookup(N('FontDescriptor'),P.PDFDict),stream=descriptor.lookup(N('FontFile2'),P.PDFRawStream);eq(child.get(N('Subtype')),N('CIDFontType2'),'TrueType font type');eq(Buffer.from(P.decodePDFRawStream(stream).getBytes()),fs.readFileSync(path.join(__dirname,'../tools/vendor/NanumGothic-Regular.ttf')),'full font program preserves every glyph');customFont=true;}ok(customFont,'Korean TrueType font embedded');
 r=await run('crop',{pages:'1',left:'5',right:'6',top:'7',bottom:'8'});d=await read(r.artifacts[0]);let box=d.getPage(0).getCropBox();ok(Math.abs(box.width-(310-11*72/25.4))<1e-8,'crop width');ok(Math.abs(box.y-8*72/25.4)<1e-8,'crop bottom');
 r=await run('margins',{margin:'10'},['rotated.pdf']);d=await read(r.artifacts[0]);ok(Math.abs(d.getPage(0).getWidth()-(420+20*72/25.4))<1e-7,'rotated margins visual width');
 r=await run('resize',{width:'210',height:'297'},['cropped.pdf']);d=await read(r.artifacts[0]);ok(Math.abs(d.getPage(0).getWidth()-210*72/25.4)<1e-8,'resize target width');
 r=await run('twoUp',{gap:'5'});eq((await read(r.artifacts[0])).getPageCount(),2,'2-up odd count');
 r=await run('booklet');eq((await read(r.artifacts[0])).getPageCount(),2,'booklet padding');
 r=await run('cover',{title:'하루콕 자료',subtitle:'검토본'});eq((await read(r.artifacts[0])).getPageCount(),4,'cover inserted');
 r=await run('labels',{style:'r',prefix:'자료-',start:'3'});d=await read(r.artifacts[0]);ok(d.catalog.has(N('PageLabels')),'page labels numtree');
 r=await run('fillForm',{values:'{"name":"하루콕","agree":true,"choice":"B"}'},['form.pdf']);d=await read(r.artifacts[0]);eq(d.getForm().getTextField('name').getText(),'하루콕','Korean field canonical value');eq(d.getForm().getCheckBox('agree').isChecked(),true,'checkbox canonical');eq(d.getForm().getDropdown('choice').getSelected(),['B'],'dropdown canonical');
 r=await run('flattenForm',{},[{...F['form.pdf'],bytes:outputs.fillForm.artifacts[0].bytes}]);d=await read(r.artifacts[0]);ok(!d.catalog.has(N('AcroForm')),'no form tree after flatten');ok(d.getPages().every(p=>!p.node.lookupMaybe(N('Annots'),P.PDFArray)?.asArray().some(ref=>d.context.lookup(ref).get(N('Subtype'))===N('Widget'))),'no widget after flatten');
 r=await run('exportForm',{},['form.pdf']);eq(JSON.parse(r.text).length,3,'form export');eq(JSON.parse(r.text).map(x=>x.kind),['text','checkbox','dropdown'],'form human-readable kinds');
 r=await run('removeAnnotations',{},['annotations.pdf']);d=await read(r.artifacts[0]);ok(!d.getPage(0).node.has(N('Annots')),'annotations removed');
 r=await run('removeAnnotations',{},['form.pdf']);eq((await read(r.artifacts[0])).getForm().getFields().length,3,'widgets retained');
 r=await run('metadata',{title:'새 제목',author:'하루콕',subject:'자료',keywords:'회의,업무'});d=await read(r.artifacts[0]);eq(d.getTitle(),'새 제목','UTF16 metadata');eq(d.getAuthor(),'하루콕','author');
 r=await run('extractAttachments',{},['attached.pdf']);eq(new TextDecoder().decode(r.artifacts[0].bytes),'attached text\n','attachment bytes');
 r=await run('attach',{},['sample.pdf','notes.txt']);const attachedResult=r.artifacts[0];r=await run('extractAttachments',{},[{name:'new.pdf',type:'application/pdf',bytes:attachedResult.bytes}]);eq(new TextDecoder().decode(r.artifacts[0].bytes),'attachment payload','attach extract roundtrip');
 r=await run('removeAttachments',{},['attached.pdf']);d=await read(r.artifacts[0]);const names=d.catalog.lookup(N('Names'),P.PDFDict);ok(!names.has(N('EmbeddedFiles')),'attachment nametree removed');ok(!d.catalog.has(N('AF')),'AF removed');
 r=await run('info');eq(JSON.parse(r.text).pages,3,'info count');
 r=await run('links',{},['annotations.pdf']);eq(JSON.parse(r.text)[0].url,'https://example.com/a?x=1','link export');
 for(let count=1;count<=200;count++){eq(api.pageList('',count),Array.from({length:count},(_,i)=>i),'all pages '+count);eq(api.pageList(String(count),count),[count-1],'last page '+count);}
 for(const bad of ['0','4','3-1','1,,2','1,1','1.5','1-999999999','-1','1e1'])assert.throws(()=>api.pageList(bad,3));checks+=9;
 await rejects(()=>api.process('delete',{pages:'1-3'},[F['sample.pdf']]),/한 페이지/,'cannot delete all');
 await rejects(()=>api.process('crop',{pages:'',left:'1000',right:'0',top:'0',bottom:'0'},[F['sample.pdf']]),/여백/,'cannot crop whole page');
 await rejects(()=>api.process('reorder',{pages:'1'},[F['form.pdf']]),/양식/,'reassembly form rejection');
 await rejects(()=>api.process('fillForm',{values:'{"unknown":"a"}'},[F['form.pdf']]),/없는 양식/,'unknown field');
 await rejects(()=>api.process('fillForm',{values:'{"agree":"yes"}'},[F['form.pdf']]),/true/,'checkbox strict');
 await rejects(()=>api.process('fillForm',{values:'{"choice":"NO"}'},[F['form.pdf']]),/선택값/,'dropdown option validation');
 await rejects(()=>api.process('info',{},[file('x.pdf',bytes('not pdf'))]),/PDF 파일/,'magic required');
 await rejects(()=>api.process('info',{},[file('x.pdf',new Uint8Array(20*1024*1024+1))]),/20MB/,'size bounds');
 await rejects(()=>api.process('merge',{},[F['sample.pdf']]),/2개/,'merge minimum');
 await rejects(()=>api.process('interleave',{},[F['sample.pdf'],F['second.pdf']]),/페이지 수/,'duplex counts');
 await rejects(()=>api.process('addText',{pages:'1',text:'😀',x:'20',y:'20',size:'12'},[F['sample.pdf']]),/지원하지 않는 글자/,'unsupported glyph rejected');
 await rejects(()=>api.process('fillForm',{values:'{"name":"😀"}'},[F['form.pdf']]),/지원하지 않는 글자/,'form unsupported glyph rejected');
 const hugePng=F['mark.png'].bytes.slice();new DataView(hugePng.buffer).setUint32(16,20000);await rejects(()=>api.process('imageWatermark',{pages:'1',widthPercent:'35',opacity:'20'},[F['sample.pdf'],file('huge.png',hugePng,'image/png')]),/너무 큽니다/,'PNG dimensions checked before inflation');
 const many=await P.PDFDocument.create();for(let i=0;i<201;i++)many.addPage([10,10]);const manyBytes=await many.save();await rejects(()=>api.process('info',{},[file('many.pdf',manyBytes)]),/200페이지/,'source page limit');
 const compressed=await P.PDFDocument.create();compressed.addPage([10,10]);await compressed.attach(new Uint8Array(20*1024*1024+1),'expanded.bin');const compressedBytes=await compressed.save();await rejects(()=>api.process('extractAttachments',{},[file('compressed.pdf',compressedBytes)]),/용량/,'attachment decoded length cap');
 // A PDF.js6 proxy deliberately has no destroy method. Exercise the real runtime's cleanup paths with only the worker import replaced.
 const vm=require('node:vm');let destroyed=0,cleaned=0,throwContent=false;
 const fakeJS={GlobalWorkerOptions:{},getDocument(){const proxy={numPages:3,async getPage(n){return {async getTextContent(){if(throwContent)throw Error('content failure');return {items:[{str:'PAGE '+n,hasEOL:true}]};},cleanup(){cleaned++;}};}};return {promise:Promise.resolve(proxy),async destroy(){destroyed++;}};}};
 const source=fs.readFileSync(path.join(__dirname,'../tools/native1000-pdf.js'),'utf8').replace("import('./vendor/pdfjs/pdf.mjs')",'Promise.resolve(globalThis.__qaPDFJS)').replace("import('/tools/vendor/pdfjs/pdf.mjs')",'Promise.resolve(globalThis.__qaPDFJS)');
 const context={PDFLib:P,Uint8Array,ArrayBuffer,TextEncoder,console,__qaPDFJS:fakeJS};vm.runInNewContext(source,context);const browserAPI=context.HarukokNativePDF1000;
 r=await browserAPI.process('text',{pages:'1-2'},[F['sample.pdf']]);ok(new TextDecoder().decode(r.artifacts[0].bytes).includes('PAGE 2'),'PDF.js6 text output');eq(destroyed,1,'task destroyed after success');eq(cleaned,2,'pages cleaned after extraction');
 await rejects(()=>browserAPI.process('text',{pages:'9'},[F['sample.pdf']]),/페이지 범위/,'PDF.js selection error');eq(destroyed,2,'task destroyed after invalid page selection');
 throwContent=true;await rejects(()=>browserAPI.process('text',{pages:'1'},[F['sample.pdf']]),/content failure/,'PDF.js extraction error');eq(destroyed,3,'task destroyed after extraction failure');
 for(const angle of [0,90,180,270]){const q=await P.PDFDocument.load(F['sample.pdf'].bytes);q.getPage(0).setRotation(P.degrees(angle));const f=file('r.pdf',await q.save());r=await api.process('crop',{pages:'1',left:'1',right:'2',top:'3',bottom:'4'},[f]);d=await read(r.artifacts[0]);const g=d.getPage(0).getCropBox();ok(g.width>0&&g.height>0,'rotated crop positive '+angle);}
 if(process.argv.includes('--fixtures')){const dir=path.resolve(__dirname,'../internal/private/native1000-fixtures');fs.mkdirSync(dir,{recursive:true});for(const [name,f]of Object.entries(F))fs.writeFileSync(path.join(dir,name),f.bytes);const outdir=path.resolve(__dirname,'../internal/private/pdf1000-output');fs.mkdirSync(outdir,{recursive:true});for(const [mode,r]of Object.entries(outputs))for(let i=0;i<r.artifacts.length;i++)fs.writeFileSync(path.join(outdir,mode+'-'+i+'-'+r.artifacts[i].name),r.artifacts[i].bytes);fs.writeFileSync(path.join(outdir,'manifest.json'),JSON.stringify(Object.fromEntries(Object.entries(outputs).map(([k,r])=>[k,r.artifacts.map((a,i)=>k+'-'+i+'-'+a.name)])),null,2));}
 console.log('verify-native-pdf1000: '+checks+' checks PASS');
}
main().catch(e=>{console.error(e.stack||e);process.exitCode=1;});
