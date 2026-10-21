import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';import {createRequire} from 'node:module';
const require=createRequire('C:/Users/XTIA/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/package.json'),sharp=require('sharp');
const rows=JSON.parse(fs.readFileSync('geo/assets/chapters-v4-9/root-generation.json','utf8')),reports=[];
for(const row of rows){
 const dir='geo/assets/chapters-v4-9/'+row.scene;fs.mkdirSync(dir+'/source',{recursive:true});const source=dir+'/source/'+row.id+'.png';fs.copyFileSync(row.source,source);
 const {data,info}=await sharp(source).ensureAlpha().raw().toBuffer({resolveWithObject:true});let minX=info.width,minY=info.height,maxX=-1,maxY=-1,transparent=0,edge=0;
 for(let y=0;y<info.height;y++)for(let x=0;x<info.width;x++){const a=data[(y*info.width+x)*4+3];if(a<8)transparent++;if(a>15){minX=Math.min(minX,x);maxX=Math.max(maxX,x);minY=Math.min(minY,y);maxY=Math.max(maxY,y);if(x===0||y===0||x===info.width-1||y===info.height-1)edge++;}}
 const bg=row.id==='background';if(!bg&&transparent/(info.width*info.height)<.1)throw Error(row.id+': not genuine transparent sprite');if(!bg&&edge>4)throw Error(row.id+': clipped edges');
 let pipeline=sharp(source);if(!bg){const m=12,l=Math.max(0,minX-m),t=Math.max(0,minY-m),r=Math.min(info.width,maxX+m+1),b=Math.min(info.height,maxY+m+1);pipeline=pipeline.extract({left:l,top:t,width:r-l,height:b-t});}
 if(!bg)pipeline=pipeline.extend({top:8,bottom:8,left:8,right:8,background:{r:0,g:0,b:0,alpha:0}});
 const dest=dir+'/'+row.id+'.webp';await pipeline.webp({lossless:true}).toFile(dest);const out=await sharp(dest).metadata();reports.push({...row,poster:'assets/chapters-v4-9/'+row.scene+'/'+row.id+'.webp',width:out.width,height:out.height,transparentRatio:transparent/(info.width*info.height),edgeAlpha:edge,sha256:crypto.createHash('sha256').update(fs.readFileSync(dest)).digest('hex')});
}
for(const scene of ['music','beach'])fs.writeFileSync('geo/assets/chapters-v4-9/'+scene+'/packaging.json',JSON.stringify(reports.filter(r=>r.scene===scene),null,2));
const contact=[];for(const row of reports){if(row.id==='background')continue;const buff=await sharp('geo/'+row.poster).resize(280,220,{fit:'contain',background:'#fff1d9'}).flatten({background:'#fff1d9'}).png().toBuffer();contact.push({input:buff,left:reports.filter(r=>r.id!=='background').findIndex(r=>r.id===row.id)%4*280,top:Math.floor(reports.filter(r=>r.id!=='background').findIndex(r=>r.id===row.id)/4)*220});}
await sharp({create:{width:1120,height:Math.ceil(contact.length/4)*220,channels:3,background:'#fff1d9'}}).composite(contact).png().toFile('geo/assets/chapters-v4-9/root-art-review.png');
console.log(reports.map(r=>({id:r.id,width:r.width,height:r.height,alpha:r.transparentRatio,edge:r.edgeAlpha})));
