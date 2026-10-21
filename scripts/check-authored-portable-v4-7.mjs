import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';import {pathToFileURL} from 'node:url';import {createRequire} from 'node:module';
const require=createRequire('C:/Users/XTIA/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/package.json'),{chromium}=require('playwright');
const browser=await chromium.launch({channel:'msedge',headless:true}),report={errors:[],externalRequests:[],clicks:[]};
try{
 const context=await browser.newContext({offline:true,viewport:{width:1280,height:720}}),page=await context.newPage();
 page.on('pageerror',e=>report.errors.push(e.message));page.on('request',r=>{if(/^https?:/.test(r.url()))report.externalRequests.push(r.url());});
 await page.goto(pathToFileURL(path.resolve('share/Leonas-Zoo-v4-7.html')).href,{timeout:60000});await page.waitForFunction(()=>window.__Animals&&[...document.images].every(i=>i.complete&&i.naturalWidth));
 report.authored=await page.evaluate(()=>Object.values(ANIMAL_ANIMATIONS).filter(d=>d.cel).length);assert.equal(report.authored,19);
 for(const id of ['cheetah','elephant','cow']){
  await page.evaluate(id=>{__Animals.dismissIntro();__Animals.stopSpeech();AnimalAnims.stopAll();const el=[...document.querySelectorAll(`.animal[data-id="${id}"]`)].find(e=>e.tabIndex===0),r=el.getBoundingClientRect();__Animals.camera+=r.left+r.width/2-innerWidth*.5;},id);
  await page.waitForTimeout(70);const el=page.locator(`.animal[data-id="${id}"][tabindex="0"]`).first();await el.click();await page.waitForTimeout(350);
  const before=await el.evaluate(e=>AnimalAnims.inspect(e));assert(before?.renderer==='authored-keyframes'&&before.progress>0&&before.ready,id);
  await el.click();const after=await el.evaluate(e=>AnimalAnims.inspect(e));assert(after.progress>=before.progress&&after.frame>=0,id+': repeat');
  report.clicks.push({id,renderer:after.renderer,repeatKeptProgress:true,forward:after.travel*after.face>0});
 }
 assert.equal(report.errors.length,0);assert.equal(report.externalRequests.length,0);report.offline=true;console.log(JSON.stringify(report,null,2));
}finally{fs.writeFileSync('share/test-v4-7.json',JSON.stringify(report,null,2));await browser.close();}
