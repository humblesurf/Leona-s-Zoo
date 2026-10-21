import fs from 'node:fs';import vm from 'node:vm';import{createRequire}from'node:module';
const require=createRequire('C:/Users/XTIA/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/package.json'),sharp=require('sharp');
const state={window:{}};for(const file of ['animation-data','authored-motion-data'])vm.runInNewContext(fs.readFileSync('geo/assets/'+file+'.js','utf8'),state);
for(const id of ['zebra','rhino','buffalo']){
 const d=state.window.ANIMAL_ANIMATIONS[id],w=d.viewport.w,h=d.viewport.h,inputs=[];
 for(let i=0;i<d.frames.length;i++){
  const f=d.frames[i],image=await sharp('geo/'+d.sheet).extract({left:f.x,top:f.y,width:f.w,height:f.h}).flatten({background:'#f5f2e7'}).png().toBuffer();
  const label=Buffer.from(`<svg width="${w}" height="32"><rect width="${w}" height="32" fill="#e9e5db"/><text x="12" y="23" font-family="Arial" font-size="19" fill="#222">${id} actual old pose ${i}</text></svg>`);
  inputs.push({input:image,left:i%2*w,top:Math.floor(i/2)*(h+32)+32},{input:label,left:i%2*w,top:Math.floor(i/2)*(h+32)});
 }
 await sharp({create:{width:w*2,height:(h+32)*Math.ceil(d.frames.length/2),channels:3,background:'#f5f2e7'}}).composite(inputs).png().toFile('screenshots/v4-12-private/'+id+'-old4.png');
 console.log(id,d.frames.length,d.cel.holdsMs,d.cel.advance);
}
