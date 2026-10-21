import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import {createRequire} from 'node:module';
const require=createRequire('C:/Users/XTIA/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/package.json');
const sharp=require('sharp');
const root=path.resolve('geo/assets/exploration-v4-8/harbor');
const ids=['harborferry','harborsailboat','sail','harborfishingboat','harborlighthouse','harborbuoy','harborpier'];
const report={tool:'built-in image_gen',operations:'Lossless encoding and whole-asset union crop only; alpha preserved.',assets:[]};
for(const id of ['background',...ids]){
 const source=path.join(root,'source',id+'.png');
 const meta=await sharp(source).metadata();
 const {data,info}=await sharp(source).ensureAlpha().raw().toBuffer({resolveWithObject:true});
 let transparent=0,semi=0,opaque=0,edge=0,minX=info.width,minY=info.height,maxX=-1,maxY=-1;
 for(let y=0;y<info.height;y++)for(let x=0;x<info.width;x++){
  const a=data[(y*info.width+x)*4+3];
  if(a===0)transparent++;else if(a===255)opaque++;else semi++;
  if(a>=16){minX=Math.min(minX,x);minY=Math.min(minY,y);maxX=Math.max(maxX,x);maxY=Math.max(maxY,y);if(x===0||y===0||x===info.width-1||y===info.height-1)edge++;}
 }
 const bbox={left:minX,top:minY,width:maxX-minX+1,height:maxY-minY+1};
 const rec={id,sourceWidth:info.width,sourceHeight:info.height,hasAlpha:meta.hasAlpha,transparentRatio:transparent/(info.width*info.height),semiRatio:semi/(info.width*info.height),opaqueRatio:opaque/(info.width*info.height),edgeAlphaPixels:edge,bbox};
 if(process.argv.includes('--inspect')){console.log(rec);continue;}
 const dest=path.join(root,id+'.webp');
 // Sail and hull stay on their original same-size registration canvas.
 let pipeline=sharp(source);
 if(id!=='background'&&id!=='harborsailboat'&&id!=='sail'){
  const margin=14,left=Math.max(0,minX-margin),top=Math.max(0,minY-margin);
  const right=Math.min(info.width,maxX+margin+1),bottom=Math.min(info.height,maxY+margin+1);
  pipeline=pipeline.extract({left,top,width:right-left,height:bottom-top});
 }
 await pipeline.webp({lossless:true}).toFile(dest);
 const out=await sharp(dest).metadata();
 rec.width=out.width;rec.height=out.height;rec.poster='assets/exploration-v4-8/harbor/'+id+'.webp';rec.sha256=crypto.createHash('sha256').update(await fs.readFile(dest)).digest('hex');
 report.assets.push(rec);
}
if(!process.argv.includes('--inspect'))await fs.writeFile(path.join(root,'manifest.json'),JSON.stringify(report,null,2));
