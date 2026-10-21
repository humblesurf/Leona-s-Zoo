import fs from 'node:fs';import{createRequire}from'node:module';
const require=createRequire('C:/Users/XTIA/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/package.json'),{chromium}=require('playwright'),sharp=require('sharp');
const browser=await chromium.launch({channel:'msedge',headless:true});let defs;
try{const page=await browser.newPage({viewport:{width:1800,height:1000}});await page.goto('http://127.0.0.1:4173/geo/?v=4.12-private-gait');await page.waitForFunction(()=>window.__Animals&&window.AnimalAnims);defs=await page.evaluate(()=>Object.fromEntries(['elephant','elephantcalf','warthog','lioness','lioncub','cheetah','giraffe','hippo','gazelle'].map(id=>[id,ANIMAL_ANIMATIONS[id]])));}finally{await browser.close();}
fs.writeFileSync('screenshots/v4-12-private/other-quadrupeds-defs.json',JSON.stringify(defs,null,2));
for(const[id,d]of Object.entries(defs)){
 if(!d?.sheet){console.log(id,'no sheet',d?.rig,d?.walk);continue;}
 const paths='geo/'+d.sheet,w=d.viewport.w,h=d.viewport.h,displayW=Math.min(w,550),scale=displayW/w,displayH=Math.ceil(h*scale),inputs=[];
 for(let i=0;i<d.frames.length;i++){
  const f=d.frames[i],pose=await sharp(paths).extract({left:f.x,top:f.y,width:f.w,height:f.h}).flatten({background:'#f5f2e7'}).resize(displayW,displayH).png().toBuffer(),col=i%4,row=Math.floor(i/4),left=col*displayW,top=row*(displayH+30);
  inputs.push({input:pose,left,top:top+30});inputs.push({input:Buffer.from(`<svg width="${displayW}" height="30"><rect width="100%" height="100%" fill="#e8e4d8"/><text x="9" y="22" font-family="Arial" font-size="17">${id} actual pose ${i}</text></svg>`),left,top});
 }
 await sharp({create:{width:displayW*4,height:(displayH+30)*Math.ceil(d.frames.length/4),channels:3,background:'#f5f2e7'}}).composite(inputs).png().toFile('screenshots/v4-12-private/'+id+'-other-current.png');
 console.log(id,d.frames.length,d.cel?.sequence,d.label);
}
