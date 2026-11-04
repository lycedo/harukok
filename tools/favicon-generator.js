'use strict';
const FaviconCommon=typeof Creative100==='undefined'?require('./creative100-common'):Creative100;
function faviconLayout(width,height,size){FaviconCommon.dimensions(width,height);const side=Number(size);if(![16,32,48,180,192,512].includes(side))throw new Error('아이콘 크기를 선택하세요.');const scale=Math.min(side/width,side/height),w=width*scale,h=height*scale;return{size:side,width:w,height:h,x:(side-w)/2,y:(side-h)/2};}
if(typeof module!=='undefined')module.exports={faviconLayout};
if(typeof document!=='undefined')FaviconCommon.imageTool({ids:['icon-size'],suffix:'icon',render(source,v){const s=faviconLayout(source.width,source.height,v['icon-size']),{canvas,context}=FaviconCommon.canvas(s.size,s.size);context.drawImage(source.img,s.x,s.y,s.width,s.height);return{canvas,info:'비율 유지·빈 곳 투명'};}});
