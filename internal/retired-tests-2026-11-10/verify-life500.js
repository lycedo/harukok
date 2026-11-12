'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),root=path.resolve(__dirname,'..');let checks=0;
function eq(a,b,label){assert.deepEqual(a,b,label);checks++;}function ok(condition,label){assert.ok(condition,label);checks++;}function near(a,b,label,tolerance=1e-10){ok(Number.isFinite(a)&&Math.abs(a-b)<=tolerance*Math.max(1,Math.abs(b)),label+' '+a+' ~ '+b);}function rejects(fn,label){assert.throws(fn,Error,label);checks++;}
const catalog={};for(const [category,groups]of Object.entries({
finance:['early-loan-repayment-calculator','debt-payoff-calculator','rent-yield-calculator','lease-deposit-converter','sales-commission-calculator','target-selling-price-calculator','ad-roas-calculator','ad-metrics-calculator','customer-lifetime-value-calculator','churn-rate-calculator','sales-funnel-calculator','equity-dilution-calculator','bond-price-calculator','portfolio-return-calculator','currency-cross-rate-calculator','currency-exchange-fee-calculator','cash-denomination-calculator','cash-runway-calculator','inventory-reorder-calculator','economic-order-quantity-calculator'],
daily:['concrete-volume-calculator','soil-gravel-calculator','turf-roll-calculator','brick-quantity-calculator','grout-quantity-calculator','fence-post-calculator','deck-board-calculator','stair-layout-calculator','stud-spacing-calculator','screw-spacing-calculator','curtain-fabric-calculator','fabric-shrinkage-calculator','knitting-gauge-calculator','quilt-binding-calculator','circle-skirt-calculator','bakers-percentage-calculator','dough-hydration-calculator','baking-pan-converter','food-cost-calculator','brine-salinity-calculator','coffee-ratio-calculator','meal-batch-divider','layover-itinerary-calculator','baggage-weight-calculator','travel-budget-calculator'],
creative:['exposure-value-calculator','nd-filter-calculator','exposure-equivalence-calculator','depth-of-field-calculator','panorama-overlap-calculator','field-of-view-calculator','crop-factor-calculator','macro-extension-calculator','timelapse-calculator','slow-motion-calculator','frame-timecode-converter','shutter-angle-calculator','audio-fade-plan-generator','sprite-sheet-layout-calculator','print-bleed-calculator','tuplet-duration-calculator','fret-position-calculator','string-tension-ratio-calculator','chord-tone-generator','key-signature-calculator']
})){for(const slug of groups)catalog[slug]={category,calculate:require(path.join(root,'tools',slug+'.js')).calculate};}
eq(Object.keys(catalog).length,65,'65 distinct tools');
const qaPath=path.join(root,'internal/private/life500-qa.json');const manifest=fs.existsSync(qaPath)?JSON.parse(fs.readFileSync(qaPath,'utf8')):null;
// Independent sample vectors live here; private QA examples are supplementary.
const c=(slug,v)=>catalog[slug].calculate(v);
const e=c('early-loan-repayment-calculator',{principal:'100000',annual:'0',months:'10',prepay:'40000',fee:'2'});eq(e.saving,-800,'zero-interest prepay fees');eq(e.after.payment,6000,'recast payment');
const normalEarly=c('early-loan-repayment-calculator',{principal:'1000000',annual:'12',months:'12',prepay:'1000000',fee:'0'});near(normalEarly.saving,1000000*.01*12/(1-1.01**-12)-1000000,'full prepay saves all interest');
const fullDebt=c('debt-payoff-calculator',{principal:'1200',annual:'0',payment:'1'});eq(fullDebt.months,1200,'1200-month loan');eq(fullDebt.interest,0,'zero interest');
const longDebt=c('debt-payoff-calculator',{principal:'1000000',annual:'6',payment:'10000'});eq(longDebt.months,139,'ordinary long loan ends139');near(longDebt.last,9757.806387775474,'stable long-loan last');ok(longDebt.text.includes('총이자: 389,758원'),'long-loan text');
eq(c('debt-payoff-calculator',{principal:'0',annual:'6',payment:'1'}).months,0,'zero principal');
rejects(()=>c('debt-payoff-calculator',{principal:'1000',annual:'6',payment:'5'}),'interest-only never amortizes');rejects(()=>c('debt-payoff-calculator',{principal:'1000',annual:'1e-300',payment:'10'}),'scientific scale cap');rejects(()=>c('debt-payoff-calculator',{principal:'1201',annual:'0',payment:'1'}),'duration cap');
// Exact cents boundary with integer monthly payments: at1% monthly, P50 yields50.5 due.
eq(c('debt-payoff-calculator',{principal:'50',annual:'12',payment:'51'}).text.split('\n')[1],'마지막 납입액: 51원','half-won rounds up');
eq(c('debt-payoff-calculator',{principal:'50',annual:'11.99976',payment:'51'}).text.split('\n')[1],'마지막 납입액: 50원','50.49999 does not round up');
eq(c('debt-payoff-calculator',{principal:'1',annual:'0.000000000001',payment:'1'}).months,2,'positive tiny exact interest requires extra month');
eq(c('rent-yield-calculator',{price:'100000',acquisition:'10000',deposit:'10000',loan:'50000',annual:'10',rent:'1000',vacancy:'2',expenses:'1000'}).net,4000,'rent NOI interest');
near(c('lease-deposit-converter',{mode:'rent',difference:'50000',annual:'5'}).result,12000000,'reverse lease conversion');
eq(c('sales-commission-calculator',{mode:'net',amount:'100',rate:'10',fixed:'0'}).sale,112,'exact commission ceil');
const parity=c('sales-commission-calculator',{mode:'sale',amount:'10001',rate:'50',fixed:'0'});ok(parity.text.includes('수수료: 5,000.5원\n정산액: 5,000.5원'),'commission fractionalwon sums reconcile');
const priceParity=c('target-selling-price-calculator',{cost:'0',shipping:'0',fixed:'0',profit:'5000',rate:'50.005'});ok(!priceParity.text.includes('NaN'),'target fractionalmoney finite');near(priceParity.fee+priceParity.net,priceParity.sale,'target sale reconciles');
eq(c('target-selling-price-calculator',{cost:'100',shipping:'20',fixed:'10',profit:'50',rate:'10'}).sale,200,'all costs included');
eq(c('ad-roas-calculator',{spend:'100',revenue:'500',margin:'20'}).profit,0,'ROAS breakeven');
const emptyAd=c('ad-metrics-calculator',{spend:'0',impressions:'0',clicks:'0',conversions:'0'});eq(emptyAd.ctr,null,'undefined CTR');eq(emptyAd.cpa,null,'undefined CPA');
eq(c('ad-metrics-calculator',{spend:'10000',impressions:'1000',clicks:'20',conversions:'2'}).cpa,5000,'CPA');
eq(c('customer-lifetime-value-calculator',{monthly:'100',margin:'50',churn:'25',acquisition:'20'}).ltv,200,'LTV geometric');
eq(c('churn-rate-calculator',{start:'10',lost:'10',new:'3'}).end,3,'churn existing cohort');
eq(c('sales-funnel-calculator',{stages:'a,100\nb,0\nc,0'}).conversion,0,'zero intermediate funnel');
ok(c('sales-funnel-calculator',{stages:'광고 방문,100\n구매 완료,10'}).text.includes('구매 완료: 10명'),'space in stage names');
near(c('equity-dilution-calculator',{existing:'100',owned:'25',new:'100',investment:'10000'}).after,12.5,'share dilution');
eq(c('bond-price-calculator',{face:'1000',coupon:'0',yield:'0',frequency:'1',periods:'10'}).price,1000,'zero coupon zero rate');
near(c('bond-price-calculator',{face:'1000',coupon:'0',yield:'10',frequency:'1',periods:'2'}).price,1000/1.21,'zero coupon discounted');
near(c('bond-price-calculator',{face:'1000',coupon:'10',yield:'0',frequency:'2',periods:'4'}).price,1200,'undiscounted coupons');
near(c('portfolio-return-calculator',{assets:'A,1000,10\nB,3000,-10'}).rate,-5,'amount weighted return');
eq(c('currency-cross-rate-calculator',{from:'2',to:'100',amount:'10'}).result,500,'cross currency direction');
eq(c('currency-exchange-fee-calculator',{foreign:'10',rate:'1000',spread:'5',discount:'100',fixed:'100'}).cost,10100,'discount only spread');
eq(c('cash-denomination-calculator',{amount:'12345',minimum:'100'}).remainder,45,'denomination residual');
eq(c('cash-denomination-calculator',{amount:'0',minimum:'1'}).total,0,'zero cash');
eq(c('cash-runway-calculator',{cash:'100',reserve:'20',inflow:'10',outflow:'10'}).months,null,'cash not depleting');
eq(c('inventory-reorder-calculator',{daily:'.1',lead:'3',safety:'0',onhand:'1',onorder:'0'}).threshold,1,'reorder fractional demand ceil');
eq(c('economic-order-quantity-calculator',{demand:'100',orderCost:'50',holding:'1'}).quantity,100,'EOQ exact integer');
eq(c('concrete-volume-calculator',{length:'1',width:'1',depth:'10',waste:'0',yield:'10'}).bags,10,'100L ten bags');
eq(c('soil-gravel-calculator',{area:'1',depth:'10',density:'1000',bag:'10',waste:'0'}).bags,10,'100kg ten bags');
eq(c('turf-roll-calculator',{area:'.3',width:'.1',length:'1',waste:'0'}).rolls,3,'exact roll count');
eq(c('brick-quantity-calculator',{area:'1',width:'190',height:'90',joint:'10',waste:'0'}).count,50,'nominal200x100 brick');
near(c('grout-quantity-calculator',{area:'1',width:'90',height:'90',joint:'10',depth:'10',density:'2',waste:'0'}).weight,3.8,'joint crossings not double counted');
eq(c('fence-post-calculator',{length:'.3',spacing:'.1',shape:'open'}).posts,4,'exact fence boundary');
eq(c('fence-post-calculator',{length:'.300000000001',spacing:'.1',shape:'open'}).posts,5,'above fence boundary');
eq(c('fence-post-calculator',{length:'9',spacing:'3',shape:'closed'}).posts,3,'closed circuit no duplicated endpoint');
eq(c('deck-board-calculator',{length:'1',width:'.3',boardWidth:'100',gap:'0',boardLength:'1',waste:'0'}).count,3,'deck exact count');
eq(c('stair-layout-calculator',{height:'280',maxRise:'18',tread:'27'}).rises,16,'stair rises');
eq(c('stair-layout-calculator',{height:'280',maxRise:'18',tread:'27'}).treads,15,'top landing existingfloor');
eq(c('stud-spacing-calculator',{length:'.8',spacing:'40'}).count,3,'stud exact ends');
eq(c('screw-spacing-calculator',{width:'60',height:'60',spacing:'30'}).count,9,'grid includes edges');
const curtain=c('curtain-fabric-calculator',{width:'100',fullness:'2',fabric:'100',height:'200',side:'0',hem:'10',repeat:'50'});eq(curtain.panels,2,'curtain exact width');eq(curtain.cut,250,'pattern repeat');eq(curtain.metres,5,'curtain purchase');
const shrink=c('fabric-shrinkage-calculator',{mode:'before',width:'90',height:'80',widthRate:'10',heightRate:'20'});near(shrink.width,100,'width shrink inverse');near(shrink.height,100,'height shrink inverse');
eq(c('knitting-gauge-calculator',{width:'10',height:'10',stitches:'21',rows:'30',repeat:'4',edge:'2'}).count,26,'repeat round thenedge');
eq(c('quilt-binding-calculator',{width:'100',height:'100',extra:'0',fabric:'100',loss:'0',strip:'5'}).strips,4,'binding exactboundary');
near(c('circle-skirt-calculator',{waist:String(Math.PI*20),ease:'0',length:'50',hem:'0',shape:'half'}).radius,20,'half circle arc');
const baker=c('bakers-percentage-calculator',{mode:'dough',weight:'1720',ingredients:'water,70\nsalt,2'});eq(baker.flour,1000,'total dough reverse');eq(baker.total,1720,'dough total');
eq(c('dough-hydration-calculator',{flour:'0',water:'0',starter:'100',hydration:'100'}).hydration,100,'starter alone');
near(c('baking-pan-converter',{oldShape:'rect',oldWidth:'10',oldHeight:'20',oldDepth:'5',newShape:'rect',newWidth:'20',newHeight:'20',newDepth:'10'}).ratio,4,'pan area and depth');
eq(c('food-cost-calculator',{ingredients:'A,1000,1000,100,50',servings:'2'}).total,200,'yield cost');
const brine=c('brine-salinity-calculator',{water:'900',percent:'10',basis:'solution'});eq(brine.salt,100,'solution massfraction');eq(brine.concentration,10,'solution concentration');
eq(c('coffee-ratio-calculator',{mode:'water',weight:'300',ratio:'15',batches:'2'}).coffee,40,'reverse brew ratio');
const meal=c('meal-batch-divider',{weight:'.3',portion:'.1',capacity:'1',cost:'300'});eq(meal.full,3,'meal decimal boundary');eq(meal.containers,3,'no phantom residue container');eq(meal.remainder,0,'exact zero residue');
eq(c('layover-itinerary-calculator',{departure:'2026-01-01 00:00',offset:'14',legs:'A,60,-12,0'}).arrivals[0],'A: 2025-12-30 23:00 (UTC-12)','cross dateline back');
eq(c('layover-itinerary-calculator',{departure:'2026-01-01 12:00',offset:'2.05',legs:'A,60,4.1,0'}).arrivals[0],'A: 2026-01-01 15:03 (UTC+4.1)','exact decimal positive minute offsets');
eq(c('layover-itinerary-calculator',{departure:'2026-01-01 12:00',offset:'-2.05',legs:'A,60,-4.1,0'}).arrivals[0],'A: 2026-01-01 10:57 (UTC-4.1)','exact decimal negative minute offsets');
eq(c('baggage-weight-calculator',{items:'a,1.5,2',bag:'2',allowance:'4',fee:'1000'}).extraCost,1000,'baggage sum');
eq(c('baggage-weight-calculator',{items:'a,0.1,1\nb,0.2,1',bag:'0',allowance:'0.3',fee:'10000'}).excess,0,'exact baggage .1+.2 boundary');
near(c('baggage-weight-calculator',{items:'a,0.1,1\nb,0.200000000001,1',bag:'0',allowance:'0.3',fee:'10000'}).excess,1e-12,'true tiny baggage excess retained',1e-20);
ok(c('baggage-weight-calculator',{items:'a,0.30005,1',bag:'0',allowance:'0.3',fee:'10000'}).text.includes('초과비용: 1원'),'exact .5won baggage fee');
eq(c('travel-budget-calculator',{people:'2',days:'3',nights:'2',transport:'100',lodging:'200',daily:'10',shared:'40',contingency:'0'}).total,700,'travel costing');
eq(c('exposure-value-calculator',{aperture:'4',shutter:'1/64',iso:'200'}).ev100,9,'ISO-normalized EV');
eq(c('nd-filter-calculator',{shutter:'1/100',mode:'factor',strength:'100'}).seconds,1,'ND100 factor');
near(c('nd-filter-calculator',{shutter:'1',mode:'density',strength:'1.8'}).stops,Math.log2(10**1.8),'ND density');
eq(c('exposure-equivalence-calculator',{oldAperture:'4',oldIso:'100',oldShutter:'1/100',newAperture:'8',newIso:'400'}).seconds,.01,'aperture ISO cancel');
const dof=c('depth-of-field-calculator',{focal:'50',aperture:'8',distance:'3',coc:'.03'});near(dof.near,3/(1+.24*2950/2500),'DOF near optical blur');near(dof.far,3/(1-.24*2950/2500),'DOF far optical blur');
const infinite=c('depth-of-field-calculator',{focal:'50',aperture:'8',distance:'100',coc:'.03'});eq(infinite.far,null,'far infinity');
eq(c('panorama-overlap-calculator',{fov:'60',overlap:'50',target:'180'}).frames,5,'panorama extra coverage');
near(c('field-of-view-calculator',{width:'36',height:'24',focal:'18',distance:'10'}).horizontal,90,'90 degree horizontal');
eq(c('crop-factor-calculator',{width:'36',height:'24',focal:'50'}).crop,1,'full frame crop1');
eq(c('macro-extension-calculator',{focal:'50',base:'1',extension:'50',sensor:'36'}).magnification,2,'macro base plus extension');
eq(c('timelapse-calculator',{duration:'.3',interval:'.1',fps:'24',exposure:'0'}).frames,4,'both timelapse endpoints');
eq(c('slow-motion-calculator',{capture:'120',playback:'24',duration:'10'}).seconds,50,'slow mo allframes');
eq(c('frame-timecode-converter',{mode:'timecode',fps:'30',source:'01:02:03:04'}).frames,111694,'timecode mixed units');
eq(c('shutter-angle-calculator',{mode:'time',fps:'25',source:'1/50'}).angle,180,'shutter inverse');
const fade=c('audio-fade-plan-generator',{seconds:'2',steps:'2',curve:'power'});near(fade.points[1].a**2+fade.points[1].b**2,1,'equalpower');eq(fade.points[0].b,0,'fade initialzero');eq(fade.points[2].a,0,'fade finalzero');
ok(c('audio-fade-plan-generator',{seconds:'3600',steps:'2',curve:'linear'}).text.split('\n').slice(1).every(row=>row.split(',').length===5),'fade CSV column count no thousands separators');
ok(c('fret-position-calculator',{scale:'3000',frets:'12'}).text.split('\n').slice(1).every(row=>row.split(',').length===4),'fret CSV column count no thousands separators');
const sprites=c('sprite-sheet-layout-calculator',{width:'10',height:'20',frames:'5',columns:'3',gap:'2',margin:'1'});eq(sprites.sheetWidth,36,'sprite width');eq(sprites.sheetHeight,44,'sprite height');eq(sprites.coords[4],{frame:4,x:13,y:23},'sprite last coords');
const bleed=c('print-bleed-calculator',{width:'25.4',height:'25.4',bleed:'0',safe:'1',dpi:'300'});eq(bleed.x,300,'exactinch pixels');
near(c('tuplet-duration-calculator',{bpm:'60',denominator:'8',actual:'3',normal:'2'}).note,1/3,'triplet in quarter');
near(c('fret-position-calculator',{scale:'648',frets:'24'}).positions[23].position,486,'twooctave fret');
eq(c('string-tension-ratio-calculator',{oldLength:'100',newLength:'200',oldFrequency:'100',newFrequency:'100',tension:'10'}).newTension,40,'length squared tension');
eq(c('chord-tone-generator',{root:'C#',quality:'aug'}).notes,['C#','E#','G##'],'aug chord correct spellings');eq(c('chord-tone-generator',{root:'C',quality:'dim7'}).notes,['C','Eb','Gb','Bbb'],'dim7 spelling');
eq(c('key-signature-calculator',{key:'minor:A#'}).signature,7,'A#minor7sharps');eq(c('key-signature-calculator',{key:'major:Cb'}).relative,'Ab 단조','Cb relative');
// Crosschecks use direct monthly simulation, direct coupon discount and exact decimal counts.
for(let principal=10;principal<=500;principal+=10){for(const annual of[0,3,12]){const payment=20;let balance=principal,total=0,months=0,last=0;while(balance>1e-12&&months<1200){const due=balance*(1+annual/1200);last=Math.min(payment,due);total+=last;balance=due-last;months++;}const got=c('debt-payoff-calculator',{principal:String(principal),annual:String(annual),payment:String(payment)});eq(got.months,months,'simulated debt count');near(got.total,total,'simulated debt total');}}
for(let periods=1;periods<=30;periods++)for(const annual of[0,1,6,15]){let direct=0;const r=annual/200;for(let j=1;j<=periods;j++)direct+=25/(1+r)**j;direct+=1000/(1+r)**periods;near(c('bond-price-calculator',{face:'1000',coupon:'5',yield:String(annual),frequency:'2',periods:String(periods)}).price,direct,'direct discounted cashflows');}
for(let n=1;n<=100;n++){const amountValue=n*1973+9,got=c('cash-denomination-calculator',{amount:String(amountValue),minimum:'10'});eq(got.pieces.reduce((sum,a)=>sum+a.unit*a.count,0)+got.remainder,amountValue,'cash sum exact');eq(got.remainder,amountValue%10,'cash residual');const panels=c('fence-post-calculator',{length:String(n/10),spacing:'.1',shape:'open'});eq(panels.sections,n,'decimal fence exact');}
for(const fps of[1,2,24,25,30,50,60,120])for(const frames of[0,1,fps-1,fps,fps*3600+fps-1,9999999,1e12]){const got=c('frame-timecode-converter',{mode:'frames',fps:String(fps),source:String(frames)});eq(c('frame-timecode-converter',{mode:'timecode',fps:String(fps),source:got.timecode}).frames,frames,'timecode roundtrip');}
const invalid=[
['early-loan-repayment-calculator',{principal:'100',annual:'5',months:'12',prepay:'101',fee:'0'}],['rent-yield-calculator',{price:'100',acquisition:'0',deposit:'100',loan:'0',annual:'0',rent:'1',vacancy:'0',expenses:'0'}],['sales-commission-calculator',{mode:'net',amount:'1',rate:'100',fixed:'0'}],['ad-metrics-calculator',{spend:'1',impressions:'1',clicks:'2',conversions:'1'}],['customer-lifetime-value-calculator',{monthly:'1',margin:'50',churn:'0',acquisition:'0'}],['churn-rate-calculator',{start:'1',lost:'2',new:'1'}],['sales-funnel-calculator',{stages:'a,1\nb,2'}],['portfolio-return-calculator',{assets:'a,1,-101'}],['cash-runway-calculator',{cash:'1',reserve:'2',inflow:'1',outflow:'1'}],['fence-post-calculator',{length:'1',spacing:'1',shape:'closed'}],['quilt-binding-calculator',{width:'1',height:'1',extra:'0',fabric:'1',loss:'1',strip:'1'}],['dough-hydration-calculator',{flour:'0',water:'1',starter:'0',hydration:'100'}],['meal-batch-divider',{weight:'1',portion:'2',capacity:'1',cost:'1'}],['layover-itinerary-calculator',{departure:'2026-02-30 12:00',offset:'9',legs:'x,60,9,0'}],['timelapse-calculator',{duration:'10',interval:'1',fps:'30',exposure:'2'}],['frame-timecode-converter',{mode:'timecode',fps:'30',source:'00:00:00:30'}],['shutter-angle-calculator',{mode:'time',fps:'30',source:'1'}],['print-bleed-calculator',{width:'1',height:'1',bleed:'1',safe:'1',dpi:'300'}]
];for(const[slug,v]of invalid)rejects(()=>c(slug,v),slug+' invalid range');
// Every new page contains the ad/metadata/UI contract; private QA fixtures are optional on clean clone.
for(const [slug,entry]of Object.entries(catalog)){const html=fs.readFileSync(path.join(root,'tools',slug+'.html'),'utf8');eq((html.match(/ad-banner-isolated\.js/g)||[]).length,1,slug+' one ad');ok(html.includes('href="/tools/site-ui.css?v=20261108-1000"'),slug+' shared CSS');ok(!/button[^>]*>[^<]*(?:예시|샘플)/.test(html),slug+' no sample buttons');ok(!html.includes('/guides'),slug+' no guides');ok(html.includes('application/ld+json'),slug+' structured data');if(manifest){const row=manifest.find(r=>r.slug===slug);ok(row,slug+' manifest');eq(row.category,entry.category,slug+' category');const values={...row.fields,...row.selects},got=c(slug,values);ok(got.text.includes(row.expected),slug+' browser vector');ok(!/NaN|Infinity|undefined/.test(got.text),slug+' finite sample');for(const id of Object.keys(values)){rejects(()=>c(slug,{...values,[id]:''}),slug+' empty '+id);if(row.selects?.[id])rejects(()=>c(slug,{...values,[id]:'not-an-option'}),slug+' bad option');}}}
console.log('PASS - '+checks+' life500 checks:65 tools, independent financial/layout/photography/music vectors, long-debt exact arithmetic, rounding boundaries, timecode and malformed input');
