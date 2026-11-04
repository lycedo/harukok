'use strict';
const RadiusCommon=typeof Creative100==='undefined'?require('./creative100-common'):Creative100;
function borderRadius(topLeft,topRight,bottomRight,bottomLeft){return[topLeft,topRight,bottomRight,bottomLeft].map((v,i)=>RadiusCommon.number(v,0,500,['왼쪽 위','오른쪽 위','오른쪽 아래','왼쪽 아래'][i])+'px').join(' ');}
if(typeof module!=='undefined')module.exports={borderRadius};
if(typeof document!=='undefined')RadiusCommon.textTool(['top-left','top-right','bottom-right','bottom-left'],(v,$)=>{const css=borderRadius(v['top-left'],v['top-right'],v['bottom-right'],v['bottom-left']);$('radius-preview').style.borderRadius=css;return{summary:'모서리 CSS',text:'border-radius: '+css+';'};});
