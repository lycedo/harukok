'use strict';
const assert=require('node:assert/strict'),path=require('node:path');let checks=0;
const run=(slug,v)=>require(path.join(__dirname,'../tools',slug+'.js')).calculate(v);
function eq(a,b){assert.deepEqual(a,b);checks++;}function near(a,b){assert.ok(Number.isFinite(a)&&Math.abs(a-b)<=Math.max(1e-10,Math.abs(b)*1e-11),a+' differs from '+b);checks++;}function bad(slug,v){assert.throws(()=>run(slug,v));checks++;}
const booklet='zine-booklet-imposition-generator';
eq(run(booklet,{pages:'8',binding:'left'}).layout,[{sheet:1,front:[8,1],back:[2,7]},{sheet:2,front:[6,3],back:[4,5]}]);
eq(run(booklet,{pages:'8',binding:'right'}).layout,[{sheet:1,front:[1,8],back:[7,2]},{sheet:2,front:[3,6],back:[5,4]}]);
for(let n=1;n<=128;n++)for(const binding of['left','right']){const r=run(booklet,{pages:String(n),binding}),pages=r.layout.flatMap(x=>x.front.concat(x.back)).filter(x=>x!==null).sort((a,b)=>a-b);eq(pages,Array.from({length:n},(_,i)=>i+1));eq(r.sheets,Math.ceil(n/4));eq(r.blank,4*r.sheets-n);}
bad(booklet,{pages:'513',binding:'left'});bad(booklet,{pages:'2.5',binding:'left'});bad(booklet,{pages:'8',binding:'unknown'});
const creep='saddle-stitch-creep-calculator';
eq(run(creep,{pages:'16',maximum:'.6',direction:'in'}).layout.map(x=>Math.round(x.amount*10)),[0,2,4,6]);
eq(run(creep,{pages:'16',maximum:'.6',direction:'out'}).layout.map(x=>Math.round(x.amount*10)),[6,4,2,0]);
eq(run(creep,{pages:'4',maximum:'10',direction:'in'}).layout[0].amount,0);bad(creep,{pages:'15',maximum:'.6',direction:'in'});
const cover='cover-spread-calculator',cv={width:'148',height:'210',spine:'10',flap:'0',bleed:'3'};
eq(run(cover,cv).width,312);eq(run(cover,cv).height,216);eq(run(cover,cv).frontStart,161);eq(run(cover,{...cv,flap:'20'}).width,352);
near(run(cover,{width:'.1',height:'.2',spine:'.1',flap:'.1',bleed:'.1'}).width,.7);bad(cover,{...cv,width:'0'});
const mass='paper-gsm-weight-calculator',ms={width:'210',height:'297',gsm:'80',sheets:'500'};
near(run(mass,ms).single,4.9896);near(run(mass,ms).grams,2494.8);near(run(mass,{...ms,width:'420',height:'594'}).grams,4*2494.8);bad(mass,{...ms,sheets:'1.5'});
const roll='roll-print-layout-calculator',rl={roll:'600',side:'10',end:'10',width:'80',height:'50',gap:'5',count:'100',orientation:'best'};
near(run(roll,rl).length,865);eq(run(roll,rl).rotated,true);eq(run(roll,{...rl,orientation:'normal'}).length,950);
const tinyRoll={roll:'.3',side:'0',end:'0',width:'.1',height:'.1',gap:'0',count:'3',orientation:'normal'};
eq(run(roll,tinyRoll).columns,3);eq(run(roll,tinyRoll).rows,1);eq(run(roll,{...tinyRoll,roll:'.299999999999'}).columns,2);eq(run(roll,{...tinyRoll,roll:'.299999999999'}).rows,2);
bad(roll,{...rl,side:'300'});bad(roll,{...rl,roll:'20',side:'0'});bad(roll,{...rl,count:'1000001'});
const label='label-sheet-layout-calculator',lb={sheetWidth:'210',sheetHeight:'297',width:'60',height:'30',left:'10',top:'10',gapX:'5',gapY:'5',columns:'3',rows:'8'};
eq(run(label,lb).positions.at(-1),{number:24,x:140,y:255});eq(run(label,lb).count,24);
const tinyLabel={sheetWidth:'.3',sheetHeight:'.1',width:'.1',height:'.1',left:'0',top:'0',gapX:'0',gapY:'0',columns:'3',rows:'1'};
near(run(label,tinyLabel).usedWidth,.3);bad(label,{...tinyLabel,sheetWidth:'.299999999999'});bad(label,{...lb,columns:'501'});
const poster='poster-tile-print-calculator',pt={width:'400',height:'600',paperWidth:'210',paperHeight:'297',overlap:'10'};
eq(run(poster,pt).count,6);eq(run(poster,pt).tiles.at(-1),{number:6,x:200,y:574,width:200,height:26});
eq(run(poster,{width:'.3',height:'.3',paperWidth:'.1',paperHeight:'.1',overlap:'0'}).count,9);
eq(run(poster,{width:'.300000000001',height:'.3',paperWidth:'.1',paperHeight:'.1',overlap:'0'}).count,12);
for(let n=1;n<=70;n++){const width=20+n*7,height=30+n*11,r=run(poster,{width:String(width),height:String(height),paperWidth:'100',paperHeight:'150',overlap:'10'});for(const t of r.tiles){eq(t.x>=0&&t.y>=0&&t.width>0&&t.height>0&&t.width<=100&&t.height<=150,true);near(t.x+t.width<=width+1e-10?0:1,0);near(t.y+t.height<=height+1e-10?0:1,0);}const maxX=Math.max(...r.tiles.map(t=>t.x+t.width)),maxY=Math.max(...r.tiles.map(t=>t.y+t.height));near(maxX,width);near(maxY,height);}
bad(poster,{...pt,overlap:'210'});bad(poster,{...pt,width:'1000000',height:'1000000',paperWidth:'1',paperHeight:'1',overlap:'0'});
const ink='ink-coverage-volume-calculator',ik={area:'1',coverage:'50',film:'2',copies:'10',density:'1.2',reserve:'0'};
near(run(ink,ik).volume,10);near(run(ink,ik).grams,12);near(run(ink,{...ik,coverage:'0'}).volume,0);bad(ink,{...ik,coverage:'.000000001'});
const screen='screen-emulsion-volume-calculator',em={width:'30',height:'40',film:'10',coats:'2',faces:'2',reserve:'10',package:'100'};
near(run(screen,em).volume,5.28);eq(run(screen,em).packages,1);
const edgeScreen={width:'100',height:'100',film:'10',coats:'1',faces:'1',reserve:'0',package:'10'};
eq(run(screen,edgeScreen).packages,1);eq(run(screen,{...edgeScreen,package:'9.999999999999'}).packages,2);bad(screen,{...em,faces:'3'});
const cross='cross-stitch-fabric-calculator',cs={width:'140',height:'70',count:'14',over:'1',margin:'5'};
near(run(cross,cs).width,35.4);near(run(cross,cs).height,22.7);eq(run(cross,{...cs,count:'28',over:'2'}).width,run(cross,cs).width);bad(cross,{...cs,count:'0'});
const fold='paper-fold-panel-calculator',fl={width:'297',panels:'3',mode:'roll',reduction:'3',inner:'right'};
eq(run(fold,fl).widths,[100,100,97]);eq(run(fold,fl).folds,[100,200]);eq(run(fold,{...fl,inner:'left'}).widths,[97,100,100]);
eq(run(fold,{width:'300',panels:'3',mode:'accordion',reduction:'',inner:'right'}).widths,[100,100,100]);
bad(fold,{...fl,panels:'4'});bad(fold,{...fl,reduction:'149'});
const holes='binding-hole-layout-calculator',hl={length:'210',margin:'20',count:'5',diameter:'3'};
eq(run(holes,hl).positions,[20,62.5,105,147.5,190]);eq(run(holes,hl).spacing,42.5);
for(let n=2;n<=50;n++){const r=run(holes,{...hl,count:String(n),diameter:'1'});eq(r.positions.length,n);near(r.positions[0],20);near(r.positions.at(-1),190);for(let j=1;j<n;j++)near(r.positions[j]-r.positions[j-1],170/(n-1));}
bad(holes,{...hl,count:'500'});bad(holes,{...hl,margin:'1',diameter:'3'});
for(const[slug,values]of[[cover,cv],[mass,ms],[roll,rl],[label,lb],[poster,pt],[ink,ik],[screen,em],[cross,cs],[fold,fl],[holes,hl]]){const key=Object.keys(values).find(k=>!['mode','orientation'].includes(k));for(const invalid of['','NaN','Infinity','1e999','<script>','-1'])bad(slug,{...values,[key]:invalid});}
for(const[slug,v]of[[label,lb],[poster,pt],[screen,em],[holes,hl]])bad(slug,{...v,[Object.keys(v)[0]]:'1e-300'});
console.log('PASS - '+checks+' print1000 checks:12 tools, booklet permutation/binding, geometric bounds, exactdecimalpacking, typography CSV, paper weight, folds and invalid inputs');
