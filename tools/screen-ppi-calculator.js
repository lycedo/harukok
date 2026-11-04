'use strict';
const PpiCommon=typeof Creative100==='undefined'?require('./creative100-common'):Creative100;
function screenPPI(width,height,diagonal){const w=PpiCommon.number(width,1,100000,'가로 픽셀',true),h=PpiCommon.number(height,1,100000,'세로 픽셀',true),d=PpiCommon.number(diagonal,.1,1000,'대각선 인치'),pixels=Math.hypot(w,h),ppi=pixels/d;return{ppi,widthCm:w/ppi*2.54,heightCm:h/ppi*2.54,diagonalCm:d*2.54};}
if(typeof module!=='undefined')module.exports={screenPPI};
if(typeof document!=='undefined')PpiCommon.textTool(['pixel-width','pixel-height','diagonal'],v=>{const r=screenPPI(v['pixel-width'],v['pixel-height'],v.diagonal),f=n=>n.toLocaleString('ko-KR',{maximumFractionDigits:3});return{summary:f(r.ppi)+' PPI',text:'픽셀 밀도: '+f(r.ppi)+' PPI\n화면 가로: '+f(r.widthCm)+'cm\n화면 세로: '+f(r.heightCm)+'cm\n화면 대각선: '+f(r.diagonalCm)+'cm'};});
