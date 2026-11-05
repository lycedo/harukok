'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),calc=(slug,v)=>require(path.join(root,'tools',slug+'.js')).calculate(v);let checks=0;
function ok(v,m){checks++;assert.ok(v,m);}function eq(a,b){checks++;assert.deepEqual(a,b);}function near(a,b,tol=1e-10){checks++;assert.ok(Number.isFinite(a)&&Math.abs(a-b)<=tol*Math.max(Math.abs(b),1e-300),a+' != '+b);}function throws(slug,v){checks++;assert.throws(()=>calc(slug,v),Error);}

const cases=[
  {
    "slug": "quantile-calculator",
    "input": {
      "values": "1,2,3,4,5",
      "percent": "25"
    },
    "expected": "백분위수: 2"
  },
  {
    "slug": "iqr-outlier-calculator",
    "input": {
      "values": "1,2,3,4,100"
    },
    "expected": "이상치(1개): 100"
  },
  {
    "slug": "median-absolute-deviation-calculator",
    "input": {
      "values": "1,1,2,2,4,6,9"
    },
    "expected": "MAD: 1"
  },
  {
    "slug": "geometric-mean-calculator",
    "input": {
      "values": "2,8"
    },
    "expected": "기하평균: 4"
  },
  {
    "slug": "harmonic-mean-calculator",
    "input": {
      "values": "2,6"
    },
    "expected": "조화평균: 3"
  },
  {
    "slug": "root-mean-square-calculator",
    "input": {
      "values": "-3,3"
    },
    "expected": "RMS: 3"
  },
  {
    "slug": "coefficient-variation-calculator",
    "input": {
      "values": "1,2,3",
      "mode": "sample"
    },
    "expected": "변동계수(%): 50"
  },
  {
    "slug": "skewness-kurtosis-calculator",
    "input": {
      "values": "-1,0,1"
    },
    "expected": "초과첨도: -1.5"
  },
  {
    "slug": "covariance-calculator",
    "input": {
      "pairs": "1 2\n2 4\n3 6",
      "mode": "sample"
    },
    "expected": "공분산: 2"
  },
  {
    "slug": "spearman-correlation-calculator",
    "input": {
      "pairs": "1 30\n2 20\n3 10"
    },
    "expected": "순위상관계수: -1"
  },
  {
    "slug": "rank-calculator",
    "input": {
      "values": "100,80,80,60",
      "mode": "average",
      "direction": "desc"
    },
    "expected": "80 → 2.5위"
  },
  {
    "slug": "frequency-table-calculator",
    "input": {
      "values": "1,2,3,4,5",
      "bins": "2"
    },
    "expected": "[1, 3): 2개"
  },
  {
    "slug": "moving-average-calculator",
    "input": {
      "values": "1,2,3,4,5",
      "window": "3"
    },
    "expected": "3번째: 2"
  },
  {
    "slug": "exponential-smoothing-calculator",
    "input": {
      "values": "10,20,30",
      "alpha": ".5"
    },
    "expected": "3번째 평활값: 22.5"
  },
  {
    "slug": "weighted-median-calculator",
    "input": {
      "pairs": "10 1\n20 3\n30 1"
    },
    "expected": "가중중앙값: 20"
  },
  {
    "slug": "min-max-normalizer",
    "input": {
      "values": "10,20,30",
      "low": "0",
      "high": "1"
    },
    "expected": "0.5"
  },
  {
    "slug": "zscore-normalizer",
    "input": {
      "values": "1,2,3",
      "mode": "sample"
    },
    "expected": "표준편차: 1"
  },
  {
    "slug": "error-metrics-calculator",
    "input": {
      "pairs": "10 8\n20 22"
    },
    "expected": "RMSE: 2"
  },
  {
    "slug": "gini-coefficient-calculator",
    "input": {
      "values": "0,0,10"
    },
    "expected": "지니계수: 0.666666666667"
  },
  {
    "slug": "entropy-calculator",
    "input": {
      "values": "1,1,1,1"
    },
    "expected": "엔트로피(bit): 2"
  },
  {
    "slug": "normal-probability-calculator",
    "input": {
      "mean": "0",
      "sd": "1",
      "low": "-1",
      "high": "1"
    },
    "expected": "구간 확률: 0.682689492137"
  },
  {
    "slug": "normal-quantile-calculator",
    "input": {
      "p": ".5",
      "mean": "10",
      "sd": "2"
    },
    "expected": "분위수: 10"
  },
  {
    "slug": "poisson-probability-calculator",
    "input": {
      "lambda": "2",
      "k": "0"
    },
    "expected": "정확 확률: 0.135335283237"
  },
  {
    "slug": "geometric-probability-calculator",
    "input": {
      "p": ".5",
      "k": "3"
    },
    "expected": "정확 확률: 0.125"
  },
  {
    "slug": "hypergeometric-probability-calculator",
    "input": {
      "population": "10",
      "successes": "4",
      "draws": "3",
      "k": "2"
    },
    "expected": "정확 확률: 0.3"
  },
  {
    "slug": "negative-binomial-calculator",
    "input": {
      "p": ".5",
      "r": "2",
      "k": "1"
    },
    "expected": "정확 확률: 0.25"
  },
  {
    "slug": "exponential-distribution-calculator",
    "input": {
      "rate": "2",
      "time": "0"
    },
    "expected": "누적확률: 0"
  },
  {
    "slug": "uniform-distribution-calculator",
    "input": {
      "a": "0",
      "b": "10",
      "low": "2",
      "high": "5"
    },
    "expected": "구간 확률: 0.3"
  },
  {
    "slug": "bayes-theorem-calculator",
    "input": {
      "prior": ".5",
      "likelihood": ".8",
      "other": ".2"
    },
    "expected": "P(A|B): 0.8"
  },
  {
    "slug": "conditional-probability-calculator",
    "input": {
      "a": ".5",
      "b": ".4",
      "joint": ".2"
    },
    "expected": "P(A|B): 0.5"
  },
  {
    "slug": "expected-value-calculator",
    "input": {
      "pairs": "10 .5\n20 .5"
    },
    "expected": "기댓값: 15"
  },
  {
    "slug": "birthday-probability-calculator",
    "input": {
      "people": "23",
      "days": "365"
    },
    "expected": "중복 확률: 0.507297234324"
  },
  {
    "slug": "coupon-collector-calculator",
    "input": {
      "types": "2",
      "owned": "0"
    },
    "expected": "남은 기대횟수: 3"
  },
  {
    "slug": "sample-size-calculator",
    "input": {
      "confidence": "95",
      "margin": "5",
      "p": ".5",
      "population": "0"
    },
    "expected": "최소 표본수: 385"
  },
  {
    "slug": "confidence-interval-calculator",
    "input": {
      "mean": "100",
      "sigma": "10",
      "n": "100",
      "confidence": "95"
    },
    "expected": "표준오차: 1"
  },
  {
    "slug": "wilson-interval-calculator",
    "input": {
      "success": "50",
      "n": "100",
      "confidence": "95"
    },
    "expected": "표본비율: 0.5"
  },
  {
    "slug": "polynomial-evaluator",
    "input": {
      "coefficients": "1,-3,2",
      "x": "3"
    },
    "expected": "다항식 값: 2"
  },
  {
    "slug": "polynomial-derivative-calculator",
    "input": {
      "coefficients": "1,-3,2",
      "x": "3"
    },
    "expected": "도함수 계수: 2, -3"
  },
  {
    "slug": "polynomial-integral-calculator",
    "input": {
      "coefficients": "3,0,0",
      "low": "0",
      "high": "2"
    },
    "expected": "정적분: 8"
  },
  {
    "slug": "polynomial-multiplication-calculator",
    "input": {
      "a": "1,1",
      "b": "1,-1"
    },
    "expected": "곱의 계수: 1, 0, -1"
  },
  {
    "slug": "synthetic-division-calculator",
    "input": {
      "coefficients": "1,-3,2",
      "root": "1"
    },
    "expected": "몫의 계수: 1, -2"
  },
  {
    "slug": "modular-arithmetic-calculator",
    "input": {
      "a": "7",
      "b": "5",
      "m": "13",
      "mode": "power"
    },
    "expected": "나머지: 11"
  },
  {
    "slug": "modular-inverse-calculator",
    "input": {
      "a": "3",
      "m": "11"
    },
    "expected": "역원: 4"
  },
  {
    "slug": "chinese-remainder-calculator",
    "input": {
      "pairs": "2 3\n3 5\n2 7"
    },
    "expected": "최소 음이 아닌 해: 23"
  },
  {
    "slug": "continued-fraction-converter",
    "input": {
      "numerator": "355",
      "denominator": "113"
    },
    "expected": "연분수: [3; 7, 16]"
  },
  {
    "slug": "fibonacci-calculator",
    "input": {
      "n": "10"
    },
    "expected": "피보나치 수: 55"
  },
  {
    "slug": "binomial-expansion-calculator",
    "input": {
      "a": "1",
      "b": "1",
      "n": "3"
    },
    "expected": "1, 3, 3, 1"
  },
  {
    "slug": "factorial-trailing-zeros-calculator",
    "input": {
      "n": "100"
    },
    "expected": "끝자리 0 개수: 24"
  },
  {
    "slug": "polygon-coordinate-calculator",
    "input": {
      "points": "0 0\n4 0\n4 3\n0 3"
    },
    "expected": "넓이: 12"
  },
  {
    "slug": "point-line-distance-calculator",
    "input": {
      "x": "0",
      "y": "0",
      "a": "3",
      "b": "4",
      "c": "-10"
    },
    "expected": "최단거리: 2"
  },
  {
    "slug": "line-intersection-calculator",
    "input": {
      "first": "0 0\n2 2",
      "second": "0 2\n2 0"
    },
    "expected": "교점 x: 1"
  },
  {
    "slug": "circle-intersection-calculator",
    "input": {
      "x1": "0",
      "y1": "0",
      "r1": "5",
      "x2": "6",
      "y2": "0",
      "r2": "5"
    },
    "expected": "1번 교점: (3, 4)"
  },
  {
    "slug": "ellipse-calculator",
    "input": {
      "a": "5",
      "b": "3"
    },
    "expected": "넓이: 47.1238898038"
  },
  {
    "slug": "regular-polygon-calculator",
    "input": {
      "n": "4",
      "side": "2"
    },
    "expected": "넓이: 4"
  },
  {
    "slug": "chord-length-calculator",
    "input": {
      "radius": "10",
      "angle": "60"
    },
    "expected": "현 길이: 10"
  },
  {
    "slug": "cone-frustum-calculator",
    "input": {
      "r1": "3",
      "r2": "1",
      "height": "4"
    },
    "expected": "부피: 54.4542726622"
  },
  {
    "slug": "torus-calculator",
    "input": {
      "major": "5",
      "minor": "2"
    },
    "expected": "부피: 394.784176044"
  },
  {
    "slug": "spherical-cap-calculator",
    "input": {
      "radius": "3",
      "height": "1"
    },
    "expected": "부피: 8.37758040957"
  },
  {
    "slug": "triangle-centers-calculator",
    "input": {
      "points": "0 0\n4 0\n0 3"
    },
    "expected": "외심: (2, 1.5)"
  },
  {
    "slug": "coordinate-rotation-calculator",
    "input": {
      "x": "1",
      "y": "0",
      "cx": "0",
      "cy": "0",
      "angle": "90"
    },
    "expected": "회전 후 y: 1"
  },
  {
    "slug": "beam-deflection-calculator",
    "input": {
      "force": "1000",
      "length": "2",
      "modulus": "200000000000",
      "inertia": "0.000001",
      "mode": "simply"
    },
    "expected": "최대 처짐(mm): 0.833333333333"
  },
  {
    "slug": "stress-strain-calculator",
    "input": {
      "force": "1000",
      "area": ".001",
      "modulus": "200000000000"
    },
    "expected": "축응력(Pa): 1,000,000"
  },
  {
    "slug": "thermal-resistance-calculator",
    "input": {
      "layers": ".1 1 2\n.05 .5 2",
      "hot": "30",
      "cold": "20"
    },
    "expected": "열전달률(W): 100"
  },
  {
    "slug": "voltage-divider-calculator",
    "input": {
      "voltage": "12",
      "top": "1000",
      "bottom": "2000",
      "load": "0"
    },
    "expected": "출력 전압(V): 8"
  },
  {
    "slug": "capacitor-series-parallel-calculator",
    "input": {
      "values": "10,20",
      "mode": "parallel"
    },
    "expected": "합성 정전용량(μF): 30"
  },
  {
    "slug": "inductor-series-parallel-calculator",
    "input": {
      "values": "10,20",
      "mode": "series"
    },
    "expected": "합성 인덕턴스(mH): 30"
  },
  {
    "slug": "reactance-calculator",
    "input": {
      "frequency": "50",
      "inductance": "100",
      "capacitance": "100"
    },
    "expected": "유도 리액턴스(Ω): 31.4159265359"
  },
  {
    "slug": "impedance-calculator",
    "input": {
      "resistance": "10",
      "inductance": "0",
      "capacitance": "0",
      "frequency": "50"
    },
    "expected": "임피던스 크기(Ω): 10"
  },
  {
    "slug": "three-phase-power-calculator",
    "input": {
      "voltage": "380",
      "current": "10",
      "factor": ".8"
    },
    "expected": "유효전력(W): 5,265.43445501"
  },
  {
    "slug": "belt-speed-calculator",
    "input": {
      "diameter": "100",
      "rpm": "1000",
      "driven": "200"
    },
    "expected": "종동 회전수(RPM): 500"
  }
];
for(const row of cases){const r=calc(row.slug,row.input);ok(typeof r.value==='string'&&typeof r.text==='string',row.slug+' result');ok(r.text.includes(row.expected),row.slug+' known example');for(const key of Object.keys(row.input)){throws(row.slug,{...row.input,[key]:''});throws(row.slug,{...row.input,[key]:'NaN'});}const html=fs.readFileSync(path.join(root,'tools',row.slug+'.html'),'utf8');eq((html.match(/src="\/ad-banner-isolated\.js/g)||[]).length,1);ok(!/예시.*<\/button>/.test(html),'no sample button');}
function data(slug,input){return calc(slug,input).data;}
eq(data('quantile-calculator',{values:'10',percent:'100'}).q,10);eq(data('quantile-calculator',{values:'0 10',percent:'25'}).q,2.5);
eq(data('iqr-outlier-calculator',{values:'1 2 3 4 100'}).outliers,[100]);eq(data('iqr-outlier-calculator',{values:'2 2 2'}).iqr,0);
eq(data('median-absolute-deviation-calculator',{values:'1 2 3 4 5'}).mad,1);
near(data('geometric-mean-calculator',{values:'1e100,1e-100'}).mean,1);throws('geometric-mean-calculator',{values:'0 1'});throws('harmonic-mean-calculator',{values:'-1 1'});
near(data('harmonic-mean-calculator',{values:'3 6 9'}).mean,54/11);eq(data('root-mean-square-calculator',{values:'0 0'}).rms,0);
eq(data('rank-calculator',{values:'9 5 5 1',mode:'competition',direction:'desc'}).ranks,[1,2,2,4]);eq(data('rank-calculator',{values:'9 5 5 1',mode:'dense',direction:'desc'}).ranks,[1,2,2,3]);
eq(data('rank-calculator',{values:'9 5 5 1',mode:'average',direction:'asc'}).ranks,[4,2.5,2.5,1]);
eq(data('frequency-table-calculator',{values:'1 2 3 4 5',bins:'2'}).counts,[2,3]);eq(data('moving-average-calculator',{values:'1 2 3 4',window:'2'}).values,[1.5,2.5,3.5]);
eq(data('exponential-smoothing-calculator',{values:'1 2 3',alpha:'0'}).values,[1,1,1]);eq(data('exponential-smoothing-calculator',{values:'1 2 3',alpha:'1'}).values,[1,2,3]);
eq(data('weighted-median-calculator',{pairs:'0 1\n1 1\n2 1\n3 1\n4 1\n5 1\n6 1\n7 1\n8 1\n9 1\n10 10'}).median,9.5);
eq(data('weighted-median-calculator',{pairs:'0 .1\n1 .1\n2 .1\n3 .1\n4 .1\n5 .1\n6 .1\n7 .1\n8 .1\n9 .1\n10 1'}).median,9.5);
eq(data('weighted-median-calculator',{pairs:'1 1\n2 1.00000000000000000001'}).median,2);
eq(data('weighted-median-calculator',{pairs:'0 0\n1 1\n9 0'}).median,1);throws('weighted-median-calculator',{pairs:'0 0\n1 0'});
eq(data('error-metrics-calculator',{pairs:'0 1\n2 3'}).mape,null);eq(data('gini-coefficient-calculator',{values:'0 0'}).gini,0);eq(data('entropy-calculator',{values:'0 0 5'}).entropy,0);
near(data('normal-probability-calculator',{mean:'0',sd:'1',low:'-3',high:'3'}).probability,.9973002039367398,1e-13);
near(data('normal-probability-calculator',{mean:'0',sd:'1',low:'8',high:'9'}).probability,6.21983198586583e-16,1e-12);
near(data('normal-quantile-calculator',{mean:'0',sd:'1',p:'1e-12'}).z,-7.034483825301132,1e-12);
throws('normal-probability-calculator',{mean:'0',sd:'1',low:'-13',high:'1'});throws('normal-quantile-calculator',{mean:'0',sd:'1',p:'0'});
eq(data('poisson-probability-calculator',{lambda:'0',k:'1'}).probability,0);eq(data('poisson-probability-calculator',{lambda:'0',k:'0'}).probability,1);
eq(data('geometric-probability-calculator',{p:'1',k:'2'}).probability,0);eq(data('geometric-probability-calculator',{p:'1',k:'1'}).cdf,1);
eq(data('negative-binomial-calculator',{p:'1',r:'4',k:'0'}).probability,1);eq(data('negative-binomial-calculator',{p:'1',r:'4',k:'1'}).probability,0);
eq(data('hypergeometric-probability-calculator',{population:'10',successes:'0',draws:'5',k:'1'}).probability,0);
eq(data('hypergeometric-probability-calculator',{population:'10',successes:'4',draws:'0',k:'0'}).probability,1);
eq(data('wilson-interval-calculator',{success:'0',n:'1000',confidence:'95'}).low,0);eq(data('wilson-interval-calculator',{success:'1000',n:'1000',confidence:'95'}).high,1);
eq(data('sample-size-calculator',{confidence:'95',margin:'5',p:'.5',population:'0'}).n,385);eq(data('sample-size-calculator',{confidence:'95',margin:'5',p:'.5',population:'1'}).n,1);
near(data('confidence-interval-calculator',{mean:'100',sigma:'10',n:'100',confidence:'95'}).low,98.04003601545995);
eq(data('conditional-probability-calculator',{a:'0',b:'.2',joint:'0'}).bGivenA,null);throws('conditional-probability-calculator',{a:'.9',b:'.9',joint:'.1'});
eq(data('birthday-probability-calculator',{people:'366',days:'365'}).probability,1);eq(data('birthday-probability-calculator',{people:'0',days:'365'}).probability,0);
eq(data('coupon-collector-calculator',{types:'5',owned:'5'}).expected,0);eq(data('exponential-distribution-calculator',{rate:'2',time:'0'}).survival,1);
eq(data('polynomial-evaluator',{coefficients:'2 0 -1',x:'3'}).value,17);eq(data('polynomial-derivative-calculator',{coefficients:'10',x:'0'}).coefficients,[0]);
eq(data('polynomial-integral-calculator',{coefficients:'3 0 0',low:'2',high:'0'}).integral,-8);eq(data('polynomial-multiplication-calculator',{a:'1 1',b:'1 -1'}).coefficients,[1,0,-1]);
eq(data('synthetic-division-calculator',{coefficients:'1 -3 2',root:'2'}).coefficients,[1,-1]);eq(data('synthetic-division-calculator',{coefficients:'1 -3 2',root:'2'}).remainder,0);
eq(data('modular-arithmetic-calculator',{a:'-2',b:'3',m:'5',mode:'power'}).result,'2');eq(data('modular-arithmetic-calculator',{a:'0',b:'0',m:'1',mode:'power'}).result,'0');
throws('modular-arithmetic-calculator',{a:'2',b:'-1',m:'5',mode:'power'});throws('modular-inverse-calculator',{a:'2',m:'4'});
eq(data('chinese-remainder-calculator',{pairs:'2 4\n6 8'}).solution,'6');eq(data('chinese-remainder-calculator',{pairs:'2 4\n6 8'}).modulus,'8');throws('chinese-remainder-calculator',{pairs:'1 2\n0 4'});
eq(data('continued-fraction-converter',{numerator:'-3',denominator:'2'}).terms,['-2','2']);eq(data('fibonacci-calculator',{n:'100'}).result,'354224848179261915075');
eq(data('binomial-expansion-calculator',{a:'2',b:'-1',n:'3'}).coefficients,['8','-12','6','-1']);eq(data('factorial-trailing-zeros-calculator',{n:'1000'}).zeros,'249');
eq(data('polygon-coordinate-calculator',{points:'0 0\n4 0\n4 3\n0 3\n0 0'}).centroid,[2,1.5]);near(data('polygon-coordinate-calculator',{points:'1000000000 1000000000\n1000000004 1000000000\n1000000004 1000000003\n1000000000 1000000003'}).area,12);
throws('polygon-coordinate-calculator',{points:'0 0\n2 2\n0 2\n2 0'});throws('polygon-coordinate-calculator',{points:'0 0\n1 0\n2 0'});
eq(data('point-line-distance-calculator',{x:'0',y:'0',a:'3',b:'4',c:'-10'}).foot,[1.2,1.6]);throws('point-line-distance-calculator',{x:'0',y:'0',a:'0',b:'0',c:'1'});
eq(data('line-intersection-calculator',{first:'0 0\n0 1',second:'-1 2\n1 2'}).y,2);throws('line-intersection-calculator',{first:'0 0\n1 0',second:'0 1\n1 1'});
eq(data('circle-intersection-calculator',{x1:'0',y1:'0',r1:'1',x2:'2',y2:'0',r2:'1'}).count,1);eq(data('circle-intersection-calculator',{x1:'0',y1:'0',r1:'1',x2:'0',y2:'0',r2:'1'}).count,'infinite');
eq(data('circle-intersection-calculator',{x1:'0',y1:'0',r1:'1',x2:'3',y2:'0',r2:'1'}).count,0);eq(data('circle-intersection-calculator',{x1:'0',y1:'0',r1:'1000000000000',x2:'1',y2:'0',r2:'999999999999'}).points,[[1000000000000,0]]);eq(data('circle-intersection-calculator',{x1:'0',y1:'0',r1:'1000000000',x2:'1',y2:'0',r2:'999999999'}).count,1);
near(data('ellipse-calculator',{a:'2',b:'2'}).perimeter,4*Math.PI);eq(data('chord-length-calculator',{radius:'5',angle:'360'}).chord,0);
near(data('spherical-cap-calculator',{radius:'3',height:'6'}).volume,36*Math.PI);eq(data('spherical-cap-calculator',{radius:'3',height:'0'}).volume,0);throws('torus-calculator',{major:'2',minor:'2'});
eq(data('triangle-centers-calculator',{points:'0 0\n4 0\n0 3'}).circumcenter,[2,1.5]);throws('triangle-centers-calculator',{points:'0 0\n1 1\n2 2'});
eq(data('coordinate-rotation-calculator',{x:'1',y:'0',cx:'0',cy:'0',angle:'-90'}),{x:0,y:-1});
near(data('beam-deflection-calculator',{mode:'cantilever',force:'1000',length:'2',modulus:'200000000000',inertia:'0.000001'}).deflection,1/75);
near(data('beam-deflection-calculator',{mode:'simply',force:'1000',length:'2',modulus:'200000000000',inertia:'0.000001'}).deflection,1/1200);
eq(data('stress-strain-calculator',{force:'-1000',area:'.001',modulus:'200000000000'}).stress,-1000000);
near(data('voltage-divider-calculator',{voltage:'12',top:'1000',bottom:'2000',load:'2000'}).voltage,6);near(data('voltage-divider-calculator',{voltage:'1e100',top:'1',bottom:'1e100',load:'1e-300'}).voltage,1e-200);near(data('voltage-divider-calculator',{voltage:'1e100',top:'1e100',bottom:'1e-300',load:'0'}).voltage,1e-300);
eq(data('capacitor-series-parallel-calculator',{values:'10 10',mode:'series'}).equivalent,5);eq(data('inductor-series-parallel-calculator',{values:'10 10',mode:'parallel'}).equivalent,5);
near(data('reactance-calculator',{frequency:String(1/(2*Math.PI)),inductance:'1000',capacitance:'1000000'}).net,0);
eq(data('impedance-calculator',{resistance:'10',inductance:'0',capacitance:'0',frequency:'50'}).powerFactor,1);throws('impedance-calculator',{resistance:'0',inductance:'0',capacitance:'0',frequency:'50'});
eq(data('three-phase-power-calculator',{voltage:'380',current:'10',factor:'1'}).reactive,0);eq(data('belt-speed-calculator',{diameter:'100',rpm:'1000',driven:'200'}).drivenRPM,500);
function comb(n,k){if(k<0||k>n)return 0;let r=1n;for(let i=1;i<=k;i++)r=r*BigInt(n-i+1)/BigInt(i);return Number(r);}
for(let N=2;N<=18;N+=2)for(let K=0;K<=N;K+=2)for(let n=0;n<=Math.min(N,4);n++){let cumulative=0;for(let k=0;k<=n;k++){const expected=comb(K,k)*comb(N-K,n-k)/comb(N,n),actual=data('hypergeometric-probability-calculator',{population:String(N),successes:String(K),draws:String(n),k:String(k)});cumulative+=expected;near(actual.probability,expected);near(actual.cdf,cumulative);}}
for(let r=1;r<=5;r++)for(let k=0;k<=8;k++)for(const p of[.2,.5,.9]){const expected=comb(k+r-1,k)*p**r*(1-p)**k,actual=data('negative-binomial-calculator',{p:String(p),r:String(r),k:String(k)});near(actual.probability,expected);}
for(let m=2;m<30;m++)for(let a=-5;a<6;a++)for(const b of[0,1,3,8]){const expected=((BigInt(a)**BigInt(b))%BigInt(m)+BigInt(m))%BigInt(m);eq(data('modular-arithmetic-calculator',{a:String(a),b:String(b),m:String(m),mode:'power'}).result,String(expected));}
for(let n=1;n<=50;n++){const a=Array.from({length:n},(_,i)=>i+1).join(','),q=data('quantile-calculator',{values:a,percent:'50'}).q;near(q,(n+1)/2);const rms=data('root-mean-square-calculator',{values:a}).rms;near(rms,Math.sqrt((n+1)*(2*n+1)/6));}
for(let n=3;n<30;n++){const poly=data('regular-polygon-calculator',{n:String(n),side:'1'});near(poly.area,n/(4*Math.tan(Math.PI/n)));}
for(let angle=0;angle<360;angle+=15){const r=data('coordinate-rotation-calculator',{x:'3',y:'4',cx:'0',cy:'0',angle:String(angle)});near(Math.hypot(r.x,r.y),5);}
console.log('PASS - '+checks+' science500 assertions across70 new tools, exact-decimal regressions, independent small-combination vectors and boundary rejection');
