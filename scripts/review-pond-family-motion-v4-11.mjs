import fs from'node:fs';import{createRequire}from'node:module';
const require=createRequire('C:/Users/XTIA/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/package.json'),{chromium}=require('playwright'),sharp=require('sharp');
const dir='geo/assets/animation/v4-11-motion/qa/pond-family';fs.mkdirSync(dir,{recursive:true});const browser=await chromium.launch({channel:'msedge',headless:true}),report=[];
for(const[vpName,viewport]of Object.entries({desktop:{width:2560,height:1440},mobile:{width:844,height:390}})){
 const page=await browser.newPage({viewport,deviceScaleFactor:1}),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('http://127.0.0.1:4173/geo/?v=4.11&scene=farm');await page.waitForFunction(()=>window.__Animals&&[...document.images].every(i=>i.complete&&i.naturalWidth));
 const entries=await page.evaluate(()=>[...document.querySelectorAll('.animal[tabindex="0"]')].filter(e=>(e.dataset.scene==='farm')||(e.dataset.id==='hippo'&&+e.dataset.waterDepth>0)).map(e=>({id:e.dataset.id,scene:e.dataset.scene,instance:e.dataset.instance,depth:e.dataset.waterDepth})));let index=0;
 for(const entry of entries){
  await page.evaluate(entry=>{const el=[...document.querySelectorAll('.animal[tabindex="0"]')].find(e=>e.dataset.instance===entry.instance);AnimalAnims.stopAll();__Animals.stopSpeech();__Animals.camera=Math.max(0,el.closest('.panel').offsetLeft-__Animals.worldW()+el.offsetLeft+el.offsetWidth/2-innerWidth*.5);},entry);await page.waitForTimeout(45);
  if(['cow','sheep','pig','hen','duck','farmgoose','hippo'].includes(entry.id))await page.screenshot({path:`${dir}/${vpName}-${String(index).padStart(2,'0')}-${entry.id}-rest.png`});
  if(+entry.depth>0){const check=await page.evaluate(async entry=>{const el=[...document.querySelectorAll('.animal[tabindex="0"]')].find(e=>e.dataset.instance===entry.instance);await AnimalAnims.preload(entry.id);AnimalAnims.play(el,entry.id);return{depth:+el.dataset.waterDepth,clip:getComputedStyle(el.querySelector('.orientation')).clipPath,restBox:el.getBoundingClientRect().toJSON()};},entry);await page.waitForTimeout(100);await page.evaluate(entry=>{const el=[...document.querySelectorAll('.animal[tabindex="0"]')].find(e=>e.dataset.instance===entry.instance);AnimalAnims.seek(el,.5);},entry);await page.screenshot({path:`${dir}/${vpName}-${String(index).padStart(2,'0')}-${entry.id}-active.png`});report.push({viewport:vpName,...entry,...check});}
  index++;
 }
 if(errors.length)throw Error(errors.join('\n'));await page.close();
}
await browser.close();fs.writeFileSync(dir+'/report.json',JSON.stringify(report,null,2));console.log(report);
