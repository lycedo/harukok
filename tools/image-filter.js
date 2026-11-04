'use strict';
const FilterCommon = typeof Creative100 === 'undefined' ? require('./creative100-common') : Creative100;
function filterSettings(mode, brightness, contrast) {
  if (!['grayscale','sepia','invert','original'].includes(mode)) throw new Error('필터를 선택하세요.');
  return { mode, brightness: FilterCommon.number(brightness, 0, 200, '밝기') / 100, contrast: FilterCommon.number(contrast, 0, 200, '대비') / 100 };
}
function filterPixels(data, settings) {
  const out = new Uint8ClampedArray(data.length), {mode,brightness,contrast} = settings;
  for (let i=0;i<data.length;i+=4) {
    let r=data[i],g=data[i+1],b=data[i+2];
    if (mode==='grayscale') r=g=b=0.299*r+0.587*g+0.114*b;
    else if(mode==='sepia') { const x=r,y=g,z=b; r=.393*x+.769*y+.189*z; g=.349*x+.686*y+.168*z; b=.272*x+.534*y+.131*z; }
    else if(mode==='invert') {r=255-r;g=255-g;b=255-b;}
    out[i]=(r*brightness-127.5)*contrast+127.5; out[i+1]=(g*brightness-127.5)*contrast+127.5; out[i+2]=(b*brightness-127.5)*contrast+127.5; out[i+3]=data[i+3];
  }
  return out;
}
if(typeof module!=='undefined') module.exports={filterSettings,filterPixels};
if(typeof document!=='undefined') FilterCommon.imageTool({ids:['filter-mode','brightness','contrast'],suffix:'filter',render(source,v){const {canvas,context}=FilterCommon.canvas(source.width,source.height);context.drawImage(source.img,0,0);const image=context.getImageData(0,0,source.width,source.height);image.data.set(filterPixels(image.data,filterSettings(v['filter-mode'],v.brightness,v.contrast)));context.putImageData(image,0,0);return{canvas};}});
