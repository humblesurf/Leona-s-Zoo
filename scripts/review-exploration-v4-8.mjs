import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const require=createRequire('C:/Users/XTIA/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/package.json'),{chromium}=require('playwright');
fs.mkdirSync('screenshots/v4-8',{recursive:true});
const url=process.argv[2]||'http://127.0.0.1:4173/geo/';
const browser=await chromium.launch({channel:'msedge',headless:true}),report={errors:[],failedAssets:[],viewports:[],objects:[],audio:[],preserved:[]};
try{
 const page=await browser.newPage();page.on('pageerror',e=>report.errors.push(e.message));page.on('response',r=>{if(r.status()>=400)report.failedAssets.push(r.url());});
 for(const viewport of [{width:2560,height:1440},{width:844,height:390}]){
  await page.setViewportSize(viewport);await page.goto(url+'?scene=camp&v=4.8');await page.waitForFunction(()=>window.__Animals&&[...document.images].every(i=>i.complete&&i.naturalWidth));
  const scenes=await page.evaluate(()=>GAME_SCENE_ORDER.filter(id=>['harbor','camp','space'].includes(id)));
  for(const scene of scenes){
   await page.evaluate(id=>__Animals.goScene(id),scene);await page.waitForTimeout(700);
   assert.equal(await page.evaluate(()=>__Animals.sceneAt().id),scene);
   await page.screenshot({path:`screenshots/v4-8/${scene}-${viewport.width}-entry.png`});
   const ids=await page.evaluate(id=>[...new Set(GAME_SCENES[id].animals.map(a=>a.id))],scene);
   for(const id of ids){
    await page.evaluate(id=>{AnimalAnims.stopAll();__Animals.stopSpeech();const el=[...document.querySelectorAll(`.animal[data-id="${id}"]`)].find(e=>e.tabIndex===0),r=el.getBoundingClientRect();__Animals.camera+=r.left+r.width/2-innerWidth*.5;},id);
    await page.evaluate(id=>AnimalAnims.preload(id),id);await page.waitForTimeout(60);
    const button=page.locator(`.animal[data-id="${id}"][tabindex="0"]`).first();await button.click();await page.waitForTimeout(130);
    const before=await button.evaluate(e=>AnimalAnims.inspect(e));assert.equal(before?.renderer,'exploration-rigid-originals',id);
    await button.click({force:true});const after=await button.evaluate(e=>AnimalAnims.inspect(e));assert(after.progress>=before.progress,id+': repeat reset');
    await button.evaluate(e=>AnimalAnims.seek(e,.50));const mid=await button.evaluate(e=>{const state=AnimalAnims.inspect(e),r=e.getBoundingClientRect(),layer=e.querySelector('.orientation').getBoundingClientRect();return {...state,visible:r.right>0&&r.left<innerWidth,uncropped:layer.top>=0&&layer.bottom<=innerHeight,width:r.width,height:r.height};});
    assert(mid.visible&&mid.uncropped,id+': clipped/outside');
    if(['boat','sailboat','rover'].includes(mid.motion))assert(mid.travel*mid.face>0,id+': reverse travel');
    if(mid.motion==='tent')assert(mid.open>.99,id+': tent did not open');
    if(mid.motion==='lighthouse')assert(mid.beam>.9,id+': lighthouse off');
    if(mid.motion==='rover')assert(mid.wheels>=2,id+': wheels missing');
    if(mid.motion==='sailboat')assert(mid.sail,id+': sail not mounted');
    report.objects.push({viewport:viewport.width,id,motion:mid.motion,travel:mid.travel,face:mid.face,repeatKeepsProgress:true,open:mid.open,beam:mid.beam,wheels:mid.wheels,uncropped:mid.uncropped});
    await page.screenshot({path:`screenshots/v4-8/${id}-${viewport.width}-active.png`});
    await button.evaluate(e=>AnimalAnims.stop(e));assert.equal(await button.locator('.exploration-action').count(),0);
   }
   const voices=await page.evaluate(scene=>GAME_SCENES[scene].animals.every(a=>{const d=GAME_DIALOGUE[a.id];return Object.values(d.voiceVariants).every(v=>v.length===3)&&Object.keys(d.intro).length===3;}),scene);assert(voices);
   report.viewports.push({scene,...viewport,voices});
  }
 }
 // The new night state is shared across loop copies, and survives rebuilding.
 await page.evaluate(()=>{ExplorationObjects.setNight(true);__Animals.goScene('camp');});assert(await page.evaluate(()=>ExplorationObjects.night));await page.waitForTimeout(4100);await page.screenshot({path:'screenshots/v4-8/camp-night.png'});await page.setViewportSize({width:1280,height:720});await page.waitForTimeout(250);assert(await page.evaluate(()=>[...document.querySelectorAll('.panel[data-scene="camp"]')].every(p=>p.classList.contains('camp-night'))));
 // Exercise real timed travel; the slow path and wheel positions are continuous.
 for(const id of ['harborferry','spacelunarrover']){
  if(!await page.evaluate(id=>!!EXPLORATION_OBJECTS[id],id))continue;
  await page.evaluate(id=>{AnimalAnims.stopAll();const el=[...document.querySelectorAll(`.animal[data-id="${id}"]`)].find(e=>e.tabIndex===0),r=el.getBoundingClientRect();__Animals.camera+=r.left+r.width/2-innerWidth*.5;},id);
  const button=page.locator(`.animal[data-id="${id}"][tabindex="0"]`).first();await button.click();await page.waitForTimeout(300);const a=await button.evaluate(e=>AnimalAnims.inspect(e));await page.waitForTimeout(450);const b=await button.evaluate(e=>AnimalAnims.inspect(e));assert(b.progress>a.progress&&Math.abs(b.x-a.x)>0,id+': stalled clock');
 }
 for(const scene of ['harbor','camp','space']){
  if(!await page.evaluate(scene=>!!GAME_SCENES[scene],scene))continue;
  await page.evaluate(id=>{__Animals.stopSpeech();__Animals.goScene(id);},scene);await page.waitForTimeout(1200);const status=await page.evaluate(id=>__Animals.ambienceStatus()[id],scene);assert.equal(status.context,'running');assert.equal(status.paused,false);assert(status.volume>.95&&status.time>0);report.audio.push({scene,...status});
 }
 assert.equal(await page.evaluate(()=>__Animals.language),'en');
 for(const id of ['cheetah','elephant','cow']){
  await page.evaluate(id=>{AnimalAnims.stopAll();const e=[...document.querySelectorAll(`.animal[data-id="${id}"]`)].find(e=>e.tabIndex===0),r=e.getBoundingClientRect();__Animals.camera+=r.left+r.width/2-innerWidth*.5;AnimalAnims.play(e,id);},id);await page.waitForTimeout(100);assert.equal(await page.locator(`.animal[data-id="${id}"][tabindex="0"]`).evaluate(e=>AnimalAnims.inspect(e)?.renderer),'authored-keyframes');report.preserved.push(id);
 }
 await page.emulateMedia({reducedMotion:'reduce'});await page.evaluate(()=>{AnimalAnims.stopAll();const e=[...document.querySelectorAll('.animal[data-id="spacelunarrover"]')].find(e=>e.tabIndex===0);AnimalAnims.play(e,'spacelunarrover');AnimalAnims.seek(e,.5);});assert.equal(await page.locator('.animal[data-id="spacelunarrover"][tabindex="0"]').evaluate(e=>AnimalAnims.inspect(e).travel),0);
 assert.equal(report.errors.length,0);assert.equal(report.failedAssets.length,0);console.log({scenes:report.viewports.length/2,objects:report.objects.length/2,audio:report.audio.length,errors:report.errors});
}finally{fs.writeFileSync('screenshots/v4-8/runtime-checks.json',JSON.stringify(report,null,2));await browser.close();}
