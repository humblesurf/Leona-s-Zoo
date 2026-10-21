import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';import {pathToFileURL} from 'node:url';import {createRequire} from 'node:module';
const require=createRequire('C:/Users/XTIA/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/package.json'),{chromium}=require('playwright');
const browser=await chromium.launch({channel:'msedge',headless:true}),context=await browser.newContext({viewport:{width:844,height:390},deviceScaleFactor:2,offline:true}),page=await context.newPage(),errors=[],external=[];
page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(/^https?:/.test(r.url()))external.push(r.url());});
try{
 await page.goto(pathToFileURL(path.resolve('share/Leonas-Zoo-v4-1.html')).href,{waitUntil:'load',timeout:60000});await page.waitForFunction(()=>window.__Animals&&[...document.images].every(i=>i.complete&&i.naturalWidth),{},{timeout:60000});
 assert.equal(await page.evaluate(()=>__Animals.language),'en');assert.equal(await page.evaluate(()=>Object.keys(CALL_RECORDINGS).length),32);
 await page.locator('.animal[data-id="lion"]').nth(1).click();await page.waitForFunction(()=>document.querySelector('.sub-label').textContent.includes('English'),{},{timeout:12000});
 assert(await page.evaluate(()=>document.querySelector('.sub-text').textContent.startsWith(GAME_DIALOGUE.lion.intro.en)));
 await page.evaluate(()=>__Animals.stopSpeech());
 for(const sid of ['savanna','rainforest','ocean','polar']){await page.evaluate(sid=>__Animals.goScene(sid),sid);await page.waitForTimeout(750);assert.equal(await page.evaluate(()=>__Animals.sceneAt().id),sid);}
 const actions=await page.evaluate(async()=>{
  const rows=[];
  for(const [id,d]of Object.entries(ANIMAL_ANIMATIONS)){
   if(!d.travel)continue;const el=[...document.querySelectorAll(`.animal[data-id="${id}"]`)].find(e=>e.tabIndex===0);await AnimalAnims.preload(id);let oldFace,turned=false;
   for(let i=0;i<5;i++){AnimalAnims.play(el,id);await new Promise(r=>requestAnimationFrame(r));const s=AnimalAnims.inspect(el);if(s.travel*s.face<0)throw Error(id+' backwards');if(oldFace!==undefined&&oldFace!==s.face)turned=true;oldFace=s.face;AnimalAnims.seek(el,1);AnimalAnims.stop(el);}
   if(!turned)throw Error(id+' boundary turn');rows.push({id,forward:true,turnAtBoundary:true});
  }return rows;
 });assert.equal(actions.length,24);
 await page.evaluate(()=>__Animals.goScene('rainforest'));await page.waitForTimeout(750);
 const timing=await page.evaluate(async()=>{
  await AnimalAnims.preload('tiger');const el=[...document.querySelectorAll('.animal[data-id="tiger"]')].find(e=>e.tabIndex===0);AnimalAnims.play(el,'tiger');const stamps=[];await new Promise(resolve=>{const start=performance.now();function sample(t){stamps.push(t);if(t-start<900)requestAnimationFrame(sample);else resolve();}requestAnimationFrame(sample);});AnimalAnims.stopAll();const intervals=stamps.slice(1).map((t,i)=>t-stamps[i]).sort((a,b)=>a-b);return {callbacks:stamps.length,medianMs:intervals[Math.floor(intervals.length*.5)],p95Ms:intervals[Math.floor(intervals.length*.95)]};
 });assert(timing.callbacks>20);
 await page.screenshot({path:'screenshots/v4-1/offline-mobile.png'});
 assert.deepEqual(errors,[]);assert.deepEqual(external,[]);
 const report={offline:true,defaultEnglish:true,imagesLoaded:true,actions,timing,externalRequests:external,errors};fs.writeFileSync('share/test-v4-1.json',JSON.stringify(report,null,2));console.log({offline:true,forwardAnimals:actions.length,timing,errors,externalRequests:external.length});
}finally{await browser.close();}
