'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..'),calc=(slug,values)=>require(path.join(root,'tools',slug+'.js')).calculate(values);
const has=(slug,values,expected)=>assert.ok(calc(slug,values).text.includes(expected),slug+' expected '+expected);
const close=(a,b,tolerance=1e-9)=>assert.ok(Math.abs(a-b)<=tolerance,`${a} should be close to ${b}`);

has('bpm-delay-calculator',{bpm:'120',note:'8',feel:'dotted'},'음표 길이: 375ms');
close(calc('bpm-delay-calculator',{bpm:'120',note:'4',feel:'triplet'}).ms,1000/3);
close(calc('bpm-delay-calculator',{bpm:'60',note:'1',feel:'straight'}).ms,4000);
assert.throws(()=>calc('bpm-delay-calculator',{bpm:'0',note:'4',feel:'straight'}));
assert.throws(()=>calc('bpm-delay-calculator',{bpm:'120',note:'3',feel:'straight'}));
assert.throws(()=>calc('bpm-delay-calculator',{bpm:'120',note:'4',feel:'unknown'}));

const note=(source,mode='note',reference='440')=>calc('note-frequency-calculator',{source,mode,reference});
close(note('A4').hz,440);close(note('A4','note','442').hz,442);close(note('C4').hz,261.6255653005986);
assert.equal(note('C#4').midi,61);assert.equal(note('Db4').midi,61);assert.equal(note('D♭4').midi,61);assert.equal(note('B#3').midi,60);assert.equal(note('Cb4').midi,59);assert.equal(note('C-1').midi,0);assert.equal(note('G9').midi,127);assert.equal(note('69','midi').hz,440);
for(const source of ['C-2','G#9','H4','C##4','440'])assert.throws(()=>note(source));
assert.throws(()=>note('128','midi'));assert.throws(()=>note('60.5','midi'));assert.throws(()=>note('A4','note','0'));

has('chord-transposer',{source:'C Am F G\nC/E Dm7 G7 C',semitones:'2',spelling:'sharp'},'D Bm G A\nD/F# Em7 A7 D');
has('chord-transposer',{source:'Bb/D F#m7b5 | G7(#9) N.C. - %',semitones:'1',spelling:'sharp'},'B/D# Gm7b5 | G#7(#9) N.C. - %');
has('chord-transposer',{source:'C/E',semitones:'-2',spelling:'flat'},'Bb/D');
has('chord-transposer',{source:'Db7 | B♭m',semitones:'12',spelling:'flat'},'Db7 | Bbm');
assert.throws(()=>calc('chord-transposer',{source:'Hello world',semitones:'2',spelling:'sharp'}));
assert.throws(()=>calc('chord-transposer',{source:'C',semitones:'1.5',spelling:'sharp'}));
assert.throws(()=>calc('chord-transposer',{source:'| N.C.',semitones:'0',spelling:'sharp'}));
assert.throws(()=>calc('chord-transposer',{source:'C6/9',semitones:'2',spelling:'sharp'}));

const tone=calc('tone-generator',{frequency:'1000',seconds:'.1',level:'20'}),wav=tone.wav,view=new DataView(wav.buffer,wav.byteOffset,wav.byteLength),ascii=(offset,length)=>new TextDecoder().decode(wav.slice(offset,offset+length));
assert.equal(wav.length,9644);assert.equal(ascii(0,4),'RIFF');assert.equal(view.getUint32(4,true),wav.length-8);assert.equal(ascii(8,4),'WAVE');assert.equal(ascii(12,4),'fmt ');assert.equal(view.getUint32(16,true),16);assert.equal(view.getUint16(20,true),1);assert.equal(view.getUint16(22,true),1);assert.equal(view.getUint32(24,true),48000);assert.equal(view.getUint32(28,true),96000);assert.equal(view.getUint16(32,true),2);assert.equal(view.getUint16(34,true),16);assert.equal(ascii(36,4),'data');assert.equal(view.getUint32(40,true),9600);
const sample=index=>view.getInt16(44+index*2,true);assert.equal(sample(0),0);assert.equal(sample(4799),0);assert.equal(sample(1212),6553);let crossings=0;for(let i=1;i<4800;i++){assert.ok(Math.abs(sample(i))<=6554);if(sample(i-1)<=0&&sample(i)>0)crossings++;}assert.equal(crossings,100);
const silent=calc('tone-generator',{frequency:'20',seconds:'.1',level:'0'}).wav;assert.ok(silent.subarray(44).every(n=>n===0));assert.equal(calc('tone-generator',{frequency:'20000',seconds:'10',level:'20'}).wav.length,960044);
for(const v of [{frequency:'0',seconds:'1',level:'5'},{frequency:'20001',seconds:'1',level:'5'},{frequency:'440',seconds:'.09',level:'5'},{frequency:'440',seconds:'11',level:'5'},{frequency:'440',seconds:'1',level:'21'}])assert.throws(()=>calc('tone-generator',v));

has('bpm-tapper',{intervals:'500\n500\n500'},'평균 BPM: 120');
close(calc('bpm-tapper',{intervals:'400 600'}).bpm,120);assert.equal(calc('bpm-tapper',{intervals:'6000'}).bpm,10);assert.equal(calc('bpm-tapper',{intervals:'50'}).bpm,1200);
for(const intervals of ['', '49', '6001', 'NaN',Array(101).fill('500').join('\n')])assert.throws(()=>calc('bpm-tapper',{intervals}));

const dates={start:'2026-11-02',end:'2026-11-08',interval:'1',weekdays:'1,2,3,4,5',limit:'100'};
assert.deepEqual(calc('date-list-generator',dates).dates,['2026-11-02','2026-11-03','2026-11-04','2026-11-05','2026-11-06']);
assert.deepEqual(calc('date-list-generator',{...dates,limit:'2'}).dates,['2026-11-02','2026-11-03']);assert.equal(calc('date-list-generator',{...dates,limit:'2'}).truncated,true);assert.equal(calc('date-list-generator',{...dates,limit:'5'}).truncated,false);
assert.deepEqual(calc('date-list-generator',{start:'2024-02-28',end:'2024-03-01',interval:'1',weekdays:'1,2,3,4,5,6,7',limit:'100'}).dates,['2024-02-28','2024-02-29','2024-03-01']);
assert.deepEqual(calc('date-list-generator',{...dates,interval:'2'}).dates,['2026-11-02','2026-11-04','2026-11-06']);
assert.throws(()=>calc('date-list-generator',{...dates,start:'2026-02-29'}));assert.throws(()=>calc('date-list-generator',{...dates,weekdays:'8'}));assert.throws(()=>calc('date-list-generator',{...dates,interval:'0'}));assert.throws(()=>calc('date-list-generator',{...dates,start:'2026-11-08',end:'2026-11-02'}));

const rotation={start:'2024-02-28',end:'2024-03-01',pattern:'A\nB\nC',offset:'1'};
assert.deepEqual(calc('rotation-schedule-generator',rotation).lines,['2024-02-28 (수) A','2024-02-29 (목) B','2024-03-01 (금) C']);
assert.deepEqual(calc('rotation-schedule-generator',{...rotation,offset:'2'}).lines,['2024-02-28 (수) B','2024-02-29 (목) C','2024-03-01 (금) A']);
assert.throws(()=>calc('rotation-schedule-generator',{...rotation,offset:'4'}));assert.throws(()=>calc('rotation-schedule-generator',{...rotation,start:'2020-01-01',end:'2026-01-01'}));assert.throws(()=>calc('rotation-schedule-generator',{...rotation,pattern:''}));

has('paint-coverage-calculator',{area:'30',coats:'2',coverage:'10',container:'4'},'용기 개수: 2개');
assert.equal(calc('paint-coverage-calculator',{area:'.3',coats:'2',coverage:'1',container:'.2'}).count,3);
assert.equal(calc('paint-coverage-calculator',{area:'1e-9',coats:'1',coverage:'1e9',container:'1e9'}).count,1);
has('paint-coverage-calculator',{area:'1e9',coats:'1',coverage:'1',container:'.00003'},'용기 개수: 33,333,333,333,334개');
assert.equal(calc('paint-coverage-calculator',{area:'1.0000000000000002',coats:'1',coverage:'1',container:'1'}).count,2);
assert.equal(calc('paint-coverage-calculator',{area:'1000000000',coats:'1',coverage:'1',container:'0.0000999999999999999'}).count,10000000000001);
assert.equal(calc('paint-coverage-calculator',{area:'.2',coats:'3',coverage:'1',container:'.1'}).count,6);
assert.equal(calc('paint-coverage-calculator',{area:'2e-1',coats:'3',coverage:'1',container:'1e-1'}).count,6);
assert.equal(calc('paint-coverage-calculator',{area:'900719925.4740991',coats:'1',coverage:'1',container:'.0000001'}).count,Number.MAX_SAFE_INTEGER);
assert.throws(()=>calc('paint-coverage-calculator',{area:'900719925.4740992',coats:'1',coverage:'1',container:'.0000001'}));
assert.throws(()=>calc('paint-coverage-calculator',{area:'30',coats:'2',coverage:'0',container:'4'}));

const dilution={stock:'10',target:'2',volume:'100',concentrationUnit:'percent',volumeUnit:'mL'};
has('dilution-calculator',dilution,'필요 원액: 20mL');has('dilution-calculator',dilution,'추가 용매: 80mL');
assert.equal(calc('dilution-calculator',{...dilution,target:'10'}).solvent,0);assert.equal(calc('dilution-calculator',{...dilution,target:'0'}).original,0);
assert.equal(calc('dilution-calculator',{stock:'200',target:'100',volume:'1',concentrationUnit:'gL',volumeUnit:'L'}).original,.5);
assert.throws(()=>calc('dilution-calculator',{...dilution,target:'11'}));assert.throws(()=>calc('dilution-calculator',{...dilution,stock:'200'}));assert.throws(()=>calc('dilution-calculator',{...dilution,stock:'0'}));

const ramp=calc('ramp-slope-calculator',{rise:'3',run:'4'});close(ramp.slope,75);close(ramp.angle,36.86989764584402);close(ramp.length,5);
has('ramp-slope-calculator',{rise:'0',run:'10'},'높이:수평거리 = 0:1');assert.throws(()=>calc('ramp-slope-calculator',{rise:'1',run:'0'}));assert.throws(()=>calc('ramp-slope-calculator',{rise:'-1',run:'10'}));

has('expense-settlement-calculator',{expenses:'민수,30000\n지연,10000\n수아,20000'},'지연 → 민수: 10,000원');
function settlementInvariant(expenses){const r=calc('expense-settlement-calculator',{expenses});assert.equal(r.people.reduce((a,p)=>a+p.share,0),r.total);for(const p of r.people){const outgoing=r.transfers.filter(t=>t.from===p.name).reduce((a,t)=>a+t.amount,0),incoming=r.transfers.filter(t=>t.to===p.name).reduce((a,t)=>a+t.amount,0);assert.equal(p.spent+outgoing-incoming,p.share);}assert.ok(r.transfers.every(t=>Number.isSafeInteger(t.amount)&&t.amount>0));assert.ok(r.transfers.length<r.people.length);return r;}
settlementInvariant('A,0\nB,1');settlementInvariant('A,0\nB,0');settlementInvariant('A,1\nB,2\nC,3');
const huge=settlementInvariant('A,1000000000000\nB,999999999999');assert.ok(huge.text.includes('총 지출: 1,999,999,999,999원'));assert.ok(huge.text.includes('A 부담: 1,000,000,000,000원'));assert.ok(huge.text.includes('B 부담: 999,999,999,999원'));
for(let count=2;count<=30;count++)settlementInvariant(Array.from({length:count},(_,i)=>'P'+i+','+(i*123457+count*97)%1000000).join('\n'));
const many=settlementInvariant(Array.from({length:100},(_,i)=>'P'+i+','+(1000000000000-i)).join('\n'));assert.equal(many.total,99999999995050);assert.ok(many.text.includes('99,999,999,995,050원'));
for(const expenses of ['A,1\nA,2','가,1\n가,2','A,-1\nB,2','A,1.5\nB,2','A,1','A,1,000\nB,2'])assert.throws(()=>calc('expense-settlement-calculator',{expenses}));

const allocation=(total,weights)=>calc('budget-allocation-calculator',{total:String(total),weights});
assert.deepEqual(allocation(100,'A,1\nB,1\nC,1').allocation,[{name:'A',amount:34},{name:'B',amount:33},{name:'C',amount:33}]);
assert.deepEqual(allocation(100,'A,.1\nB,.2').allocation,[{name:'A',amount:33},{name:'B',amount:67}]);
assert.deepEqual(allocation(1,'A,0\nB,1\nC,1').allocation,[{name:'A',amount:0},{name:'B',amount:1},{name:'C',amount:0}]);
assert.deepEqual(allocation(10,'A,1\nB,2\nC,3').allocation,[{name:'A',amount:2},{name:'B',amount:3},{name:'C',amount:5}]);
for(const total of [0,1,7,10000,999999999999,1000000000000])for(let n=1;n<=15;n++){const r=allocation(total,Array.from({length:n},(_,i)=>'W'+i+','+((i*97+n*13)%1000+1)).join('\n'));assert.equal(r.allocation.reduce((a,p)=>a+p.amount,0),total);assert.ok(r.allocation.every(p=>Number.isSafeInteger(p.amount)&&p.amount>=0));}
assert.ok(allocation(999999999999,'A,1').text.includes('999,999,999,999원'));
for(const weights of ['A,0\nB,0','A,1\nA,2','A,-1\nB,2','A,.0000001\nB,1','A,1e5'])assert.throws(()=>allocation(100,weights));

// Exercise actual DOM handlers without a new browser/test dependency.
function dom(slug,values){let time=0,sequence=0,playCalls=0;const elements=new Map(),events=new Map(),blobs=new Map(),revoked=[];
 const add=(map,type,fn)=>{if(!map.has(type))map.set(type,[]);map.get(type).push(fn);};
 function dispatch(id,type){for(const fn of element(id).events.get(type)||[])fn({preventDefault(){}});}
 function element(id){if(!elements.has(id))elements.set(id,{value:values[id]||'',textContent:'',hidden:id==='result',events:new Map(),addEventListener(type,fn){add(this.events,type,fn);},requestSubmit(){dispatch(id,'submit');},focus(){},scrollIntoView(){},select(){},pause(){},load(){},play(){playCalls++;},removeAttribute(name){delete this[name];}});return elements.get(id);}
 const context={document:{getElementById:element},window:{addEventListener(type,fn){add(events,type,fn);}},performance:{now:()=>time},URL:{createObjectURL(blob){const key='blob:life200-'+(++sequence);blobs.set(key,blob);return key;},revokeObjectURL(key){revoked.push(key);}},Blob,navigator:{clipboard:{writeText:async()=>{}}}};
 vm.runInNewContext(fs.readFileSync(path.join(root,'tools',slug+'.js'),'utf8'),context,{filename:slug+'.js'});
 return{element,dispatch,advance(ms){time+=ms;},event(type){for(const fn of events.get(type)||[])fn();},blobs,revoked,get playCalls(){return playCalls;}};
}
const tap=dom('bpm-tapper',{intervals:''});tap.dispatch('tap','click');assert.equal(tap.element('result').hidden,true);tap.advance(500);tap.dispatch('tap','click');assert.equal(tap.element('result-value').textContent,'120BPM');tap.advance(500);tap.dispatch('tap','click');assert.equal(tap.element('intervals').value,'500\n500');assert.ok(tap.element('result-text').value.includes('측정 간격 수: 2개'));tap.advance(10);tap.dispatch('tap','click');assert.ok(tap.element('tap-status').textContent.includes('50ms'));tap.advance(6001);tap.dispatch('tap','click');assert.equal(tap.element('result').hidden,true);tap.advance(600);tap.dispatch('tap','click');assert.equal(tap.element('result-value').textContent,'100BPM');tap.event('pagehide');tap.advance(600);tap.dispatch('tap','click');assert.equal(tap.element('result').hidden,true);tap.dispatch('tap-reset','click');assert.equal(tap.element('intervals').value,'');assert.equal(tap.element('result').hidden,true);
tap.dispatch('tap','click');for(let i=0;i<40;i++){tap.advance(500);tap.dispatch('tap','click');}assert.equal(tap.element('intervals').value.split('\n').length,32);assert.equal(tap.element('result-value').textContent,'120BPM');tap.element('intervals').value='1000';tap.dispatch('calculator','input');tap.dispatch('calculator','submit');assert.equal(tap.element('result-value').textContent,'60BPM');

const audio=dom('tone-generator',{frequency:'440',seconds:'.1',level:'5'});audio.dispatch('calculator','submit');assert.equal(audio.element('result').hidden,false);assert.equal(audio.playCalls,0);const firstUrl=audio.element('tone-audio').src;assert.equal(firstUrl,'blob:life200-1');assert.equal(audio.element('tone-download').href,firstUrl);assert.equal(audio.element('tone-download').download,'harukok-tone-440hz.wav');assert.equal(audio.blobs.get(firstUrl).size,9644);assert.equal(audio.blobs.get(firstUrl).type,'audio/wav');audio.event('pagehide');assert.deepEqual(audio.revoked,[firstUrl]);assert.equal(audio.element('tone-audio').src,undefined);audio.event('pageshow');assert.equal(audio.element('tone-audio').src,'blob:life200-2');audio.event('pageshow');assert.equal(audio.blobs.size,2);audio.element('frequency').value='0';audio.dispatch('calculator','input');assert.equal(audio.element('result').hidden,true);assert.equal(audio.element('tone-download').href,undefined);audio.dispatch('calculator','submit');assert.equal(audio.element('result').hidden,true);assert.ok(audio.element('error').textContent);assert.equal(audio.playCalls,0);
const toneHTML=fs.readFileSync(path.join(root,'tools/tone-generator.html'),'utf8');assert.match(toneHTML,/<audio[^>]*id="tone-audio"[^>]*controls[^>]*preload="metadata"/);assert.ok(!/\bautoplay\b/.test(toneHTML));

console.log('PASS - 생활·음악 12개: 음표·WAV PCM·BPM 탭·날짜·정산 합계·가중 배분·오디오 URL 수명주기');
