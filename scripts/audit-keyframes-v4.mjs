import {createRequire} from 'node:module';
import fs from 'node:fs';
import vm from 'node:vm';
const require=createRequire('C:/Users/XTIA/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/package.json'),sharp=require('sharp');
const state={window:{}};vm.runInNewContext(fs.readFileSync('geo/assets/animation-data.js','utf8'),state);
const defs=Object.entries(state.window.ANIMAL_ANIMATIONS).filter(([,d])=>d.sheet);
for(let start=0;start<defs.length;start+=8){
 const layers=[];
 for(let row=0;row<Math.min(8,defs.length-start);row++){
  const [id,d]=defs[start+row];
  layers.push({input:Buffer.from(`<svg width="960" height="22"><text x="8" y="17" font-size="15" font-family="sans-serif" fill="#344">${id}</text></svg>`),left:0,top:row*142});
  for(let i=0;i<6;i++){
   const f=d.frames[i];
   const input=await sharp('geo/'+d.sheet).extract({left:f.x,top:f.y,width:f.w,height:f.h}).resize(154,115,{fit:'contain',background:'#eff1e8'}).png().toBuffer();
   layers.push({input,left:i*160+3,top:row*142+24});
  }
 }
 await sharp({create:{width:960,height:1136,channels:3,background:'#eff1e8'}}).composite(layers).jpeg({quality:95}).toFile(`geo/screenshots/v4/all-poses-${start/8}.jpg`);
}
console.log(`All ${defs.length*6} animation poses rendered for review`);
