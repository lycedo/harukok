'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');const root=path.resolve(__dirname,'..'),catalog=JSON.parse(fs.readFileSync(path.join(root,'internal/catalog-retirement-1000.json'),'utf8'));let checks=0;
assert.equal(catalog.retired.length,116);assert.equal(catalog.retainedMath.length,40);checks+=2;
for(const r of catalog.retired){assert.equal(fs.existsSync(path.join(root,'tools',r.slug+'.html')),false,r.slug+' retired page returned');assert.equal(fs.existsSync(path.join(root,'tools',r.slug+'.js')),false,r.slug+' retired script returned');checks+=2;}
for(const r of catalog.retainedHashes){const source=fs.readFileSync(path.join(root,r.file),'utf8').replace(/\r\n/g,'\n');assert.equal(crypto.createHash('sha256').update(source).digest('hex'),r.sha256,r.slug+' verified retained logic changed');checks++;}
const retired=new Set(catalog.retired.map(r=>r.slug)),files=['index.html','sitemap.xml',...['tools','fun'].flatMap(d=>fs.readdirSync(path.join(root,d)).filter(n=>n.endsWith('.html')).map(n=>d+'/'+n))];
for(const file of files){const s=fs.readFileSync(path.join(root,file),'utf8');for(const m of s.matchAll(/(?:href="\/tools\/|<loc>https:\/\/harukok\.com\/tools\/)([a-z0-9-]+)(?:["<#?])/g)){assert.ok(!retired.has(m[1]),file+' links retired '+m[1]);checks++;}}
console.log('PASS - '+checks+' catalog1000 checks:116 retired academic tools absent,40 retained calculation modules unchanged,and public links clean');
