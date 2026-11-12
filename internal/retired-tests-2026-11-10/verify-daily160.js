'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..'),load=s=>require(path.join(root,'tools',s+'.js')),calc=(s,v)=>load(s).calculate(v);
const text=(s,v,expected)=>assert.ok(calc(s,v).text.includes(expected),s+' should contain '+expected);

text('clock-angle-calculator',{hours:'3',minutes:'30',seconds:'0'},'작은 각도: 75°');
text('clock-angle-calculator',{hours:'12',minutes:'0',seconds:'0'},'작은 각도: 0°');
text('clock-angle-calculator',{hours:'0',minutes:'0',seconds:'30'},'작은 각도: 2.75°');
assert.throws(()=>calc('clock-angle-calculator',{hours:'24',minutes:'0',seconds:'0'}));
assert.throws(()=>calc('clock-angle-calculator',{hours:'1',minutes:'60',seconds:'0'}));

text('decimal-hour-converter',{mode:'decimal',source:'1.5'},'시:분:초: 01:30:00');
text('decimal-hour-converter',{mode:'clock',source:'1:45:00'},'소수 시간: 1.75시간');
text('decimal-hour-converter',{mode:'decimal',source:'1.99999999'},'시:분:초: 02:00:00');
text('decimal-hour-converter',{mode:'clock',source:'24:00'},'소수 시간: 24시간');
text('decimal-hour-converter',{mode:'clock',source:'1000000:00:00'},'소수 시간: 1,000,000시간');
assert.throws(()=>calc('decimal-hour-converter',{mode:'clock',source:'1000000:00:01'}));
assert.throws(()=>calc('decimal-hour-converter',{mode:'decimal',source:'1000000.0001'}));
for(const source of ['1:60:00','1:00:60','-1:00','1:5'])assert.throws(()=>calc('decimal-hour-converter',{mode:'clock',source}));
assert.throws(()=>calc('decimal-hour-converter',{mode:'invalid',source:'1.5'}));

text('pace-calculator',{distance:'5',hours:'0',minutes:'25',seconds:'0'},'평균 페이스: 5분 0초/km');
text('pace-calculator',{distance:'5',hours:'0',minutes:'25',seconds:'0'},'평균 속도: 12km/h');
text('pace-calculator',{distance:'1',hours:'0',minutes:'4',seconds:'59'},'평균 페이스: 4분 59초/km');
assert.throws(()=>calc('pace-calculator',{distance:'5',hours:'0',minutes:'0',seconds:'0'}));
assert.throws(()=>calc('pace-calculator',{distance:'0',hours:'0',minutes:'25',seconds:'0'}));

text('fuel-consumption-calculator',{distance:'500',fuel:'40',price:'1700'},'100km당 소비: 8L/100km');
text('fuel-consumption-calculator',{distance:'500',fuel:'40',price:'1700'},'사용 연료비: 68,000원');
assert.throws(()=>calc('fuel-consumption-calculator',{distance:'500',fuel:'0',price:'1700'}));

text('unit-price-calculator',{unit:'g',priceA:'3000',amountA:'500',priceB:'4000',amountB:'800'},'상품 B가 저렴');
text('unit-price-calculator',{unit:'개',priceA:'3000',amountA:'3',priceB:'2000',amountB:'2'},'같은 단가');
text('unit-price-calculator',{unit:'개',priceA:'.3',amountA:'.1',priceB:'3',amountB:'1'},'같은 단가');
text('unit-price-calculator',{unit:'개',priceA:'.3',amountA:'.1',priceB:'3',amountB:'1'},'1개당 차이: 0원');
text('unit-price-calculator',{unit:'개',priceA:'3e-1',amountA:'1e-1',priceB:'3',amountB:'1'},'같은 단가');
text('unit-price-calculator',{unit:'개',priceA:'1.0000000000000001',amountA:'1',priceB:'1',amountB:'1'},'상품 B가 저렴');
text('unit-price-calculator',{unit:'개',priceA:'1.0000000000000001',amountA:'1',priceB:'1',amountB:'1'},'표시 정밀도 미만');
text('unit-price-calculator',{unit:'개',priceA:'0e99999999999999999999999999',amountA:'1',priceB:'0',amountB:'1'},'같은 단가');
assert.throws(()=>calc('unit-price-calculator',{unit:'g',priceA:'3000',amountA:'0',priceB:'4000',amountB:'800'}));
assert.throws(()=>calc('unit-price-calculator',{unit:'kg',priceA:'3',amountA:'5',priceB:'4',amountB:'8'}));

text('split-bill-calculator',{amount:'10000',people:'3',tip:'0'},'2명 × 3,333원');
text('split-bill-calculator',{amount:'10000',people:'3',tip:'0'},'1명 × 3,334원');
for(const amount of [0,1,2,100,10001,999999999999])for(const people of [1,2,3,7,10000])for(const tip of [0,.5,10,100]){const r=calc('split-bill-calculator',{amount:String(amount),people:String(people),tip:String(tip)});assert.equal(r.base*people+r.more,r.total);assert.ok(r.more>=0&&r.more<people);}
assert.throws(()=>calc('split-bill-calculator',{amount:'1.5',people:'3',tip:'0'}));
assert.throws(()=>calc('split-bill-calculator',{amount:'10000',people:'0',tip:'0'}));

text('shipping-volume-calculator',{width:'50',length:'40',height:'30',count:'2',divisor:'6000'},'전체 부피: 0.12CBM');
text('shipping-volume-calculator',{width:'50',length:'40',height:'30',count:'2',divisor:'6000'},'전체 부피무게: 20kg');
assert.throws(()=>calc('shipping-volume-calculator',{width:'50',length:'40',height:'30',count:'2',divisor:'0'}));

text('electricity-cost-calculator',{watts:'1000',hours:'3',days:'30',price:'200'},'단순 사용 비용: 18,000원');
text('electricity-cost-calculator',{watts:'0',hours:'24',days:'30',price:'200'},'전력 사용량: 0kWh');
assert.throws(()=>calc('electricity-cost-calculator',{watts:'1000',hours:'25',days:'30',price:'200'}));

text('download-time-calculator',{size:'1',sizeUnit:'GB',rate:'100',rateUnit:'Mbps'},'정밀 시간: 80초');
text('download-time-calculator',{size:'1',sizeUnit:'GiB',rate:'1',rateUnit:'MiBs'},'정밀 시간: 1,024초');
text('download-time-calculator',{size:'0',sizeUnit:'GB',rate:'1',rateUnit:'Gbps'},'정밀 시간: 0초');
assert.throws(()=>calc('download-time-calculator',{size:'1',sizeUnit:'GB',rate:'0',rateUnit:'Mbps'}));
assert.throws(()=>calc('download-time-calculator',{size:'1',sizeUnit:'KB',rate:'1',rateUnit:'Mbps'}));

text('video-storage-calculator',{video:'8',audio:'0',minutes:'60',count:'1'},'전체 용량: 3.6GB');
text('video-storage-calculator',{video:'0',audio:'128',minutes:'60',count:'1'},'전체 용량: 0.0576GB');
assert.throws(()=>calc('video-storage-calculator',{video:'0',audio:'0',minutes:'60',count:'1'}));

text('print-scaling-calculator',{width:'210',height:'297',targetWidth:'420',targetHeight:'594',mode:'fit'},'인쇄 배율: 200%');
text('print-scaling-calculator',{width:'100',height:'200',targetWidth:'100',targetHeight:'100',mode:'fit'},'남는 총 여백: 50 × 0mm');
text('print-scaling-calculator',{width:'100',height:'200',targetWidth:'100',targetHeight:'100',mode:'fill'},'잘리는 총 길이: 0 × 100mm');
assert.throws(()=>calc('print-scaling-calculator',{width:'0',height:'200',targetWidth:'100',targetHeight:'100',mode:'fit'}));

text('reading-time-calculator',{source:'하루콕 도구',mode:'chars',speed:'5'},'정밀 시간: 60초');
text('reading-time-calculator',{source:'One two\nthree',mode:'words',speed:'3'},'정밀 시간: 60초');
text('reading-time-calculator',{source:'😀 a',mode:'chars',speed:'2'},'분량: 2자');
assert.throws(()=>calc('reading-time-calculator',{source:'  ',mode:'chars',speed:'5'}));
assert.throws(()=>calc('reading-time-calculator',{source:'a',mode:'chars',speed:'0'}));

const box={boxWidth:'100',boxLength:'80',boxHeight:'60',itemWidth:'20',itemLength:'10',itemHeight:'10',rotation:'allow'};
assert.equal(calc('box-packing-calculator',box).count,240);
const rotated={boxWidth:'4',boxLength:'3',boxHeight:'2',itemWidth:'3',itemLength:'2',itemHeight:'4'};
assert.equal(calc('box-packing-calculator',{...rotated,rotation:'fixed'}).count,0);
assert.equal(calc('box-packing-calculator',{...rotated,rotation:'allow'}).count,1);
assert.equal(calc('box-packing-calculator',{boxWidth:'.3',boxLength:'.3',boxHeight:'.3',itemWidth:'.1',itemLength:'.1',itemHeight:'.1',rotation:'fixed'}).count,27);
assert.throws(()=>calc('box-packing-calculator',{...box,itemWidth:'0'}));
assert.throws(()=>calc('box-packing-calculator',{...box,itemWidth:'1e-9',itemLength:'1e-9',itemHeight:'1e-9'}));

text('tile-calculator',{width:'3',length:'3',tileWidth:'30',tileLength:'30',gap:'0',waste:'10'},'여유 포함 수량: 110장');
text('tile-calculator',{width:'2',length:'1',tileWidth:'60',tileLength:'60',gap:'0',waste:'0'},'기본 격자 수량: 8장');
text('tile-calculator',{width:'.9',length:'.9',tileWidth:'30',tileLength:'30',gap:'0',waste:'0'},'기본 격자 수량: 9장');
assert.throws(()=>calc('tile-calculator',{width:'2',length:'1',tileWidth:'0',tileLength:'60',gap:'0',waste:'0'}));

const wall={width:'5',height:'2.4',rollWidth:'.5',rollLength:'10',pattern:'0',trim:'10'};
text('wallpaper-calculator',wall,'필요 롤 수: 3롤');
text('wallpaper-calculator',{...wall,pattern:'60'},'필요 롤 수: 4롤');
text('wallpaper-calculator',{...wall,height:'2.3',pattern:'60'},'한 폭 재단 길이: 2.4m');
assert.throws(()=>calc('wallpaper-calculator',{...wall,rollLength:'1'}));

for(const [date,year,week]of [['2021-01-01',2020,53],['2021-01-04',2021,1],['2019-12-30',2020,1],['2000-01-01',1999,52],['2017-01-01',2016,52],['1900-01-01',1900,1]]){const r=calc('week-number-calculator',{date});assert.equal(r.year,year);assert.equal(r.week,week);}
for(let year=1900;year<=2100;year++){assert.equal(calc('week-number-calculator',{date:year+'-01-04'}).week,1);assert.ok([52,53].includes(calc('week-number-calculator',{date:year+'-12-28'}).week));}
for(const date of ['2026-02-29','2026-13-01','2026-11-31','2026-1-01','1899-12-31'])assert.throws(()=>calc('week-number-calculator',{date}));

const random=load('random-date-generator');
assert.deepEqual(random.calculate({start:'2026-11-06',end:'2026-11-09',count:'2',mode:'weekday'},()=>0).dates,['2026-11-06','2026-11-09']);
assert.deepEqual(random.calculate({start:'2026-11-06',end:'2026-11-09',count:'2',mode:'weekend'},()=>0).dates,['2026-11-07','2026-11-08']);
assert.deepEqual(random.calculate({start:'2024-02-28',end:'2024-03-01',count:'3',mode:'all'},()=>0).dates,['2024-02-28','2024-02-29','2024-03-01']);
assert.throws(()=>random.calculate({start:'2026-11-04',end:'2026-11-04',count:'2',mode:'all'}));
assert.throws(()=>random.calculate({start:'2026-11-05',end:'2026-11-04',count:'1',mode:'all'}));
assert.throws(()=>random.calculate({start:'2026-11-07',end:'2026-11-08',count:'1',mode:'weekday'}));
assert.throws(()=>random.calculate({start:'2026-11-04',end:'2026-11-04',count:'1',mode:'all'},()=>-1));
const selected=random.calculate({start:'2026-01-01',end:'2026-12-31',count:'100',mode:'all'}).dates;assert.equal(new Set(selected).size,100);assert.ok(selected.every(s=>s>='2026-01-01'&&s<='2026-12-31'));

text('meeting-cost-calculator',{people:'6',hours:'1',minutes:'30',hourly:'20000'},'단순 비용: 180,000원');
text('meeting-cost-calculator',{people:'2',hours:'0',minutes:'15',hourly:'10000'},'총 투입 시간: 0.5인시');
assert.throws(()=>calc('meeting-cost-calculator',{people:'0',hours:'1',minutes:'0',hourly:'10000'}));

const countdown=load('countdown-timer'),stopwatch=load('stopwatch');
assert.equal(countdown.calculate({minutes:'5',seconds:'0'}).durationMs,300000);
assert.throws(()=>countdown.calculate({minutes:'0',seconds:'0'}));
assert.throws(()=>countdown.calculate({minutes:'1',seconds:'60'}));
let state=countdown.createState(5000,1000);assert.equal(countdown.remaining(state,3000),3000);state=countdown.pauseState(state,3000);assert.equal(countdown.remaining(state,9000),3000);state=countdown.resumeState(state,10000);assert.equal(countdown.remaining(state,11000),2000);assert.equal(countdown.remaining(state,20000),0);
let sw=stopwatch.createState(1000);assert.equal(stopwatch.elapsed(sw,1234),234);sw=stopwatch.pauseState(sw,2000);assert.equal(stopwatch.elapsed(sw,9999),1000);sw=stopwatch.resumeState(sw,10000);assert.equal(stopwatch.elapsed(sw,10500),1500);

// Lifecycle regression: background/bfcache transitions retain elapsed time without duplicate intervals.
function timerDOM(slug,values){let now=100000,next=0;const intervals=new Map(),elements=new Map(),windowEvents=new Map(),documentEvents=new Map();
  const on=(map,type,fn)=>{if(!map.has(type))map.set(type,[]);map.get(type).push(fn);};
  function element(id){if(!elements.has(id))elements.set(id,{value:values[id]||'',textContent:'',hidden:id==='result',disabled:false,events:new Map(),addEventListener(type,fn){on(this.events,type,fn);},focus(){},scrollIntoView(){},select(){}});return elements.get(id);}
  const context={Date:class extends Date{static now(){return now;}},document:{getElementById:element,addEventListener(type,fn){on(documentEvents,type,fn);}},window:{addEventListener(type,fn){on(windowEvents,type,fn);}},setInterval(fn){const id=++next;intervals.set(id,fn);return id;},clearInterval(id){intervals.delete(id);},navigator:{clipboard:{writeText:async()=>{}}}};
  vm.runInNewContext(fs.readFileSync(path.join(root,'tools',slug+'.js'),'utf8'),context,{filename:slug+'.js'});
  return {element,intervals,advance(ms){now+=ms;for(const fn of [...intervals.values()])fn();},dispatch(id,type){for(const fn of element(id).events.get(type)||[])fn({preventDefault(){}});},event(type){for(const fn of windowEvents.get(type)||[])fn();}};
}
const timer=timerDOM('countdown-timer',{minutes:'0',seconds:'5'});timer.dispatch('calculator','submit');assert.equal(timer.element('result-value').textContent,'00:00:05');assert.equal(timer.intervals.size,1);timer.advance(2000);assert.equal(timer.element('result-value').textContent,'00:00:03');timer.dispatch('pause','click');assert.equal(timer.intervals.size,0);timer.advance(10000);timer.event('pageshow');assert.equal(timer.element('result-value').textContent,'00:00:03');assert.equal(timer.intervals.size,0);timer.dispatch('pause','click');assert.equal(timer.intervals.size,1);timer.advance(1000);assert.equal(timer.element('result-value').textContent,'00:00:02');timer.event('pagehide');assert.equal(timer.intervals.size,0);timer.advance(3000);timer.event('pageshow');assert.equal(timer.element('result-value').textContent,'00:00:00');assert.equal(timer.intervals.size,0);assert.equal(timer.element('pause').disabled,true);timer.dispatch('reset','click');assert.equal(timer.element('result').hidden,true);
const watch=timerDOM('stopwatch',{});watch.dispatch('calculator','submit');watch.advance(250);assert.equal(watch.element('result-value').textContent,'00:00:00.2');watch.event('pagehide');assert.equal(watch.intervals.size,0);watch.advance(1000);watch.event('pageshow');assert.equal(watch.element('result-value').textContent,'00:00:01.2');assert.equal(watch.intervals.size,1);watch.event('pageshow');assert.equal(watch.intervals.size,1);watch.dispatch('pause','click');watch.advance(10000);watch.event('pageshow');assert.equal(watch.element('result-value').textContent,'00:00:01.2');assert.equal(watch.intervals.size,0);watch.dispatch('reset','click');assert.equal(watch.element('result').hidden,true);assert.equal(watch.intervals.size,0);

for(const bad of ['NaN','Infinity','0x10','-1','1e999','1e-999',''])assert.throws(()=>calc('fuel-consumption-calculator',{distance:bad,fuel:'40',price:'1700'}));
console.log('PASS - 생활 도구 20개: 알려진 답·날짜 경계·배분 합계·포장 올림·타이머 수명주기');
