import fs from 'node:fs/promises';
import path from 'node:path';
import {createRequire} from 'node:module';
const require=createRequire('C:/Users/XTIA/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/package.json');
const sharp=require('sharp');
const out=path.resolve('geo/assets/exploration-v4-8/space');
const base='assets/exploration-v4-8/space/';
const backgrounds=['moon-landscape','mars-landscape'];
const names=['spacemoon','spacecrater','spacelunarrover','spacemars','spacemarsrover'];
const records={};
for(const id of backgrounds){
 const file=path.join(out,'source',id+'.png');
 const m=await sharp(file).metadata();
 await sharp(file).webp({quality:94,effort:6}).toFile(path.join(out,id+'.webp'));
 records[id]={width:m.width,height:m.height,poster:base+id+'.webp',source:'source/'+id+'.png',alpha:m.hasAlpha};
}
for(const id of names){
 const file=path.join(out,'source',id+'.png');
 try{await fs.access(file);}catch{continue;}
 const m=await sharp(file).metadata();
 const {data,info}=await sharp(file).ensureAlpha().raw().toBuffer({resolveWithObject:true});
 let minx=info.width,miny=info.height,maxx=-1,maxy=-1,transparent=0,edgeAlpha=0;
 for(let y=0;y<info.height;y++)for(let x=0;x<info.width;x++){
  const a=data[(y*info.width+x)*4+3];
  if(a<1)transparent++;
  if(a>8){minx=Math.min(minx,x);maxx=Math.max(maxx,x);miny=Math.min(miny,y);maxy=Math.max(maxy,y);}
  if((x===0||y===0||x===info.width-1||y===info.height-1)&&a>8)edgeAlpha++;
 }
 if(!m.hasAlpha||transparent/(info.width*info.height)<.03)throw new Error(id+' lacks actual transparency');
 if(edgeAlpha>10)throw new Error(id+' is clipped at source border: '+edgeAlpha);
 // Mechanical format conversion only: keep original full alpha and common camera canvas.
 await sharp(file).webp({lossless:true,effort:6}).toFile(path.join(out,id+'.webp'));
 records[id]={poster:base+id+'.webp',width:m.width,height:m.height,source:'source/'+id+'.png',transparentFraction:transparent/(info.width*info.height),alphaBounds:{x:minx,y:miny,width:maxx-minx+1,height:maxy-miny+1},edgeAlpha};
}
await fs.writeFile(path.join(out,'packaging.json'),JSON.stringify(records,null,2)+'\n');
const manifest=JSON.parse(await fs.readFile(path.join(out,'space.json'),'utf8'));
manifest.dialogue=JSON.parse(await fs.readFile(path.join(out,'dialogue.json'),'utf8'));
await fs.writeFile(path.join(out,'space.json'),JSON.stringify(manifest,null,2)+'\n');
console.log(JSON.stringify(records,null,2));
