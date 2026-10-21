import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';import {pathToFileURL} from 'node:url';import {createRequire} from 'node:module';
const require=createRequire('C:/Users/XTIA/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/package.json'),{chromium}=require('playwright');
const browser=await chromium.launch({channel:'msedge',headless:true}),context=await browser.newContext({viewport:{width:1180,height:820},offline:true}),page=await context.newPage(),errors=[],external=[];
page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(/^https?:/.test(r.url()))external.push(r.url());});
try{
 await page.goto(pathToFileURL(path.resolve('share/Leonas-Zoo-v4-5.html')).href,{timeout:60000});await page.waitForFunction(()=>window.__Animals&&[...document.images].every(i=>i.complete&&i.naturalWidth));
 await page.evaluate(()=>{__Animals.dismissIntro();const el=[...document.querySelectorAll('.animal[data-id="zebra"]')].find(e=>e.tabIndex===0),r=el.getBoundingClientRect();__Animals.camera+=r.left+r.width/2-innerWidth*.5;});
 const animal=page.locator('.animal[data-id="zebra"][tabindex="0"]').first();await animal.click();await page.waitForTimeout(1700);
 const first=await animal.evaluate(el=>AnimalAnims.inspect(el));assert(first.progress>.2&&first.zoom>1&&Math.abs(first.x)>1);
 const movingBox=await animal.boundingBox();await page.mouse.click(movingBox.x+movingBox.width*.5,movingBox.y+movingBox.height*.5);const retap=await animal.evaluate(el=>AnimalAnims.inspect(el));assert(retap.progress>=first.progress&&retap.progress<.75);await page.evaluate(()=>{__Animals.stopSpeech();AnimalAnims.stopAll();});
 const walkers=await page.evaluate(async()=>{const rows=[];for(const id of Object.keys(QuadrupedWalk.profiles)){const el=[...document.querySelectorAll(`.animal[data-id="${id}"]`)].find(e=>e.tabIndex===0);let turned=false,face;
  for(let i=0;i<7;i++){AnimalAnims.play(el);await new Promise(requestAnimationFrame);const s=AnimalAnims.inspect(el);if(s.travel*s.face<=0)throw Error(id+' not forward');if(face!==undefined&&s.face!==face)turned=true;face=s.face;AnimalAnims.seek(el,1);AnimalAnims.stop(el);}if(!turned)throw Error(id+' never turns at boundary');rows.push(id);}return rows;});
 const motion=await page.evaluate(async()=>{
  const rows=[];
  for(const id of ['cheetah','tiger','giraffe']){
   const el=[...document.querySelectorAll(`.animal[data-id="${id}"]`)].find(e=>e.tabIndex===0);
   AnimalAnims.play(el);await new Promise(requestAnimationFrame);AnimalAnims.seek(el,.55);
   const state=AnimalAnims.inspect(el);AnimalAnims.play(el);
   const keptProgress=AnimalAnims.inspect(el).progress===state.progress;
   const branch=id==='giraffe'&&[...el.parentElement.querySelectorAll('.browse-twig')].some(e=>Number(e.dataset.contact)>.9);
   rows.push({id,gait:state.motion,duration:state.duration,keptProgress,branch});AnimalAnims.stop(el);
  }
  return rows;
 });
 assert.equal(walkers.length,19);assert.equal(motion[0].gait,'gallop');assert.equal(motion[1].gait,'trot');
 assert(motion.every(m=>m.keptProgress));assert(motion[2].branch&&motion[2].duration===6000);
 assert.deepEqual(errors,[]);assert.deepEqual(external,[]);
 const report={offline:true,realClickStartsWalking:true,realRetapKeepsProgress:true,walkers,motion,external,errors};fs.writeFileSync('share/test-v4-5.json',JSON.stringify(report,null,2));console.log(report);
}finally{await browser.close();}
