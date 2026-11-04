'use strict';
const BorderCommon=typeof Creative100==='undefined'?require('./creative100-common'):Creative100;
function borderSettings(width,height,thickness,color){BorderCommon.dimensions(width,height);const border=BorderCommon.number(thickness,0,1000,'테두리 두께',true),size=BorderCommon.dimensions(width+border*2,height+border*2);return{...size,border,color:BorderCommon.hex(color)};}
if(typeof module!=='undefined')module.exports={borderSettings};
if(typeof document!=='undefined')BorderCommon.imageTool({ids:['thickness','border-color'],suffix:'border',render(source,v){const s=borderSettings(source.width,source.height,v.thickness,v['border-color']),{canvas,context}=BorderCommon.canvas(s.width,s.height);context.fillStyle=s.color;context.fillRect(0,0,s.width,s.height);context.drawImage(source.img,s.border,s.border);return{canvas};}});
