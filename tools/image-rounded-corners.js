'use strict';
const RoundedCommon = typeof Creative100==='undefined'?require('./creative100-common'):Creative100;
function cornerRadius(width,height,radius) {RoundedCommon.dimensions(width,height);return RoundedCommon.number(radius,0,Math.min(width,height)/2,'모서리 반지름');}
function roundedPath(context,width,height,radius) {
  context.beginPath();context.moveTo(radius,0);context.lineTo(width-radius,0);context.quadraticCurveTo(width,0,width,radius);context.lineTo(width,height-radius);context.quadraticCurveTo(width,height,width-radius,height);context.lineTo(radius,height);context.quadraticCurveTo(0,height,0,height-radius);context.lineTo(0,radius);context.quadraticCurveTo(0,0,radius,0);context.closePath();
}
if(typeof module!=='undefined')module.exports={cornerRadius,roundedPath};
if(typeof document!=='undefined')RoundedCommon.imageTool({ids:['radius'],suffix:'rounded',render(source,v){const radius=cornerRadius(source.width,source.height,v.radius),{canvas,context}=RoundedCommon.canvas(source.width,source.height);roundedPath(context,source.width,source.height,radius);context.clip();context.drawImage(source.img,0,0);return{canvas};}});
