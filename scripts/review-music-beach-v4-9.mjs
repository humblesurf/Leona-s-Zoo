import fs from 'node:fs';import assert from 'node:assert/strict';import {createRequire} from 'node:module';
const require=createRequire('C:/Users/XTIA/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/package.json'),{chromium}=require('playwright');
const base=process.argv[2]||'http://127.0.0.1:4173/geo/';fs.mkdirSync('screenshots/v4-9/root',{recursive:true});const browser=await chromium.launch({channel:'msedge',headless:true}),report={errors:[],badAssets:[],objects:[],music:[],ambience:[]};
try{
 const page=await browser.newPage();page.on('pageerror',e=>report.errors.push(e.message));page.on('response',r=>{if(r.status()>=400)report.badAssets.push(r.url());});
 for(const vp of [{width:2560,height:1440},{width:844,height:390}]){
  await page.setViewportSize(vp);await page.goto(base+'?scene=music&v=4.9');await page.waitForFunction(()=>window.__Animals&&[...document.images].every(i=>i.complete&&i.naturalWidth));assert.equal(await page.evaluate(()=>GAME_SCENE_ORDER.length),15);
  for(const scene of ['music','beach']){
   await page.evaluate(id=>__Animals.goScene(id),scene);await page.waitForTimeout(700);await page.screenshot({path:`screenshots/v4-9/root/${scene}-${vp.width}-entry.png`});
   const ids=await page.evaluate(id=>GAME_SCENES[id].animals.map(a=>a.id),scene);
   for(const id of ids){
    await page.evaluate(id=>{__Animals.stopSpeech();AnimalAnims.stopAll();const e=[...document.querySelectorAll(`.animal[data-id="${id}"]`)].find(e=>e.tabIndex===0),r=e.getBoundingClientRect();__Animals.camera+=r.left+r.width/2-innerWidth*.5;},id);await page.evaluate(id=>AnimalAnims.preload(id),id);await page.waitForTimeout(50);
    const el=page.locator(`.animal[data-id="${id}"][tabindex="0"]`).first();await el.click();await page.waitForTimeout(130);const state=await el.evaluate(e=>AnimalAnims.inspect(e));assert.equal(state?.renderer,'chapter-originals');await el.evaluate(e=>AnimalAnims.seek(e,.5));
    const check=await el.evaluate(e=>{const r=e.querySelector('.orientation').getBoundingClientRect();return {...AnimalAnims.inspect(e),uncropped:r.top>=0&&r.bottom<=innerHeight,images:[...e.querySelectorAll('img')].every(i=>i.complete&&i.naturalWidth)};});assert(check.uncropped&&check.images,id+': clipped/image');if(check.motion==='beach-crab')assert(check.travel*check.face>0,id+': backwards');report.objects.push({id,viewport:vp.width,...check});await page.screenshot({path:`screenshots/v4-9/root/${id}-${vp.width}-active.png`});await el.evaluate(e=>AnimalAnims.stop(e));
   }
  }
 }
 await page.evaluate(()=>{__Animals.stopSpeech();__Animals.goScene('music');});await page.waitForTimeout(750);
 for(const [tempo,weight]of [['slow','soft'],['fast','strong']]){
  await page.evaluate(([t,w])=>ChapterObjects.setMusic(t,w),[tempo,weight]);
  for(const id of ['musicpiano','musicdrum','musicxylophone','musictambourine','musicmaracas']){
   await page.evaluate(id=>{AnimalAnims.stopAll();const e=[...document.querySelectorAll(`.animal[data-id="${id}"]`)].find(e=>e.tabIndex===0),r=e.getBoundingClientRect();__Animals.camera+=r.left+r.width/2-innerWidth*.5;},id);
   await page.locator(`.animal[data-id="${id}"][tabindex="0"]`).click();await page.waitForTimeout(tempo==='slow'?2200:1100);const audio=await page.evaluate(()=>ChapterSounds.inspect());assert.equal(audio.beats.length,4,id);assert.equal(audio.tempo,tempo==='slow'?.68:.32);assert.equal(audio.weight,weight);report.music.push({id,tempo,weight,beats:audio.beats});await page.evaluate(()=>__Animals.stopSpeech());
  }
 }
 for(const scene of ['music','hongkong','beach','planets','weather','supermarket']){
  await page.evaluate(id=>{AnimalAnims.stopAll();__Animals.stopSpeech();__Animals.goScene(id);},scene);await page.waitForTimeout(1400);const audio=await page.evaluate(id=>({...__Animals.ambienceStatus()[id],rms:__Animals.ambienceLevel()}),scene);assert(audio.context==='running'&&!audio.paused&&audio.rms>.00001,scene+': inaudible ambience');report.ambience.push({scene,...audio});
 }
 assert.equal(await page.evaluate(()=>__Animals.language),'en');assert.equal(report.errors.length,0);assert.equal(report.badAssets.length,0);report.passed=true;console.log({objects:report.objects.length/2,musicGroups:report.music.length,ambience:report.ambience.length,errors:report.errors});
}finally{fs.writeFileSync('screenshots/v4-9/root/validation.json',JSON.stringify(report,null,2));await browser.close();}
