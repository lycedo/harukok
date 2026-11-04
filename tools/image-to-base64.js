'use strict';
const BaseImageCommon=typeof Creative100==='undefined'?require('./creative100-common'):Creative100;
function dataURLLimit(file){return BaseImageCommon.fileType(file,2*1024*1024);}
function readImageDataURL(file){const mime=dataURLLimit(file);return new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>{const value=String(reader.result);if(!/^data:image\/(?:png|jpeg|webp);base64,[a-zA-Z0-9+/]+=*$/.test(value))return reject(new Error('사진을 Base64로 읽지 못했습니다.'));resolve(value);};reader.onerror=()=>reject(new Error('사진을 읽지 못했습니다.'));reader.onabort=()=>reject(new Error('파일 읽기가 취소됐습니다.'));reader.readAsDataURL(new Blob([file],{type:mime}));});}
if(typeof module!=='undefined')module.exports={dataURLLimit,readImageDataURL};
if(typeof document!=='undefined')BaseImageCommon.imageTool({ids:[],text:true,maxBytes:2*1024*1024,suffix:'base64',async render(source){return{text:await readImageDataURL(source.file),info:source.width+' × '+source.height+'px · 원본 파일의 Data URL'};}});
