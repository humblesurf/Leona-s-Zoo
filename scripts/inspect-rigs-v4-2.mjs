import fs from 'node:fs';import {createRequire} from 'node:module';
const require=createRequire('C:/Users/XTIA/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/package.json'),{chromium}=require('playwright');
fs.mkdirSync('screenshots/v4-2',{recursive:true});const browser=await chromium.launch({channel:'msedge',headless:true});const page=await browser.newPage({viewport:{width:1400,height:1200}});
await page.goto('http://127.0.0.1:4173/geo/?v=4.2');await page.waitForFunction(()=>window.__Animals);await page.waitForFunction(()=>[...document.images].every(i=>i.complete&&i.naturalWidth));
const ids=await page.evaluate(()=>Object.keys(SpritePuppets.rigs));
for(let offset=0;offset<ids.length;offset+=9){
 await page.evaluate(async list=>{document.body.style.cssText='background:#f0e8da;overflow:visible;display:grid;grid-template-columns:repeat(5,280px);margin:0;font:14px sans-serif';for(const e of document.body.children)e.style.display='none';
 for(const id of list){const img=new Image();img.src=ANIMAL_ANIMATIONS[id].poster;await img.decode();for(const p of [0,.25,.5,.75,1]){const box=document.createElement('div');box.className='qa';box.style.cssText='height:220px;display:flex;flex-direction:column;align-items:center';const c=document.createElement('canvas');c.width=520;c.height=390;c.style.cssText='width:260px;height:195px';const fit=Math.min(c.width/img.naturalWidth,c.height/img.naturalHeight);const ctx=c.getContext('2d');ctx.translate((c.width-img.naturalWidth*fit)/2,c.height-img.naturalHeight*fit);SpritePuppets.draw(ctx,id,img,p,img.naturalWidth*fit,img.naturalHeight*fit);box.append(c,document.createTextNode(id+' '+p));document.body.append(box);}}
 },ids.slice(offset,offset+9));
 await page.screenshot({path:`screenshots/v4-2/joints-${offset/9+1}.jpg`,fullPage:true});await page.evaluate(()=>document.querySelectorAll('.qa').forEach(e=>e.remove()));
}
await browser.close();
