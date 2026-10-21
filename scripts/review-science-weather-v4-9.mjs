import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const require=createRequire('C:/Users/XTIA/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/package.json');
const {chromium}=require('playwright');
const root='screenshots/v4-9/science';fs.mkdirSync(root,{recursive:true});
const base=process.argv.find(a=>a.startsWith('http'))||'http://127.0.0.1:4173/geo/';
const satelliteOnly=process.argv.includes('--satellite-only');
const browser=await chromium.launch({channel:'msedge',headless:true});
const report={errors:[],failedAssets:[],viewports:[],objects:[],weather:[],orbit:[],warnings:[]};
try {
 const page=await browser.newPage();page.on('pageerror',e=>report.errors.push(e.message));page.on('response',r=>{if(r.status()>=400)report.failedAssets.push(r.url());});
 for(const viewport of [{width:2560,height:1440},{width:844,height:390}]) {
  await page.setViewportSize(viewport);await page.goto(base+'?scene=planets&v=4.9');await page.waitForFunction(()=>window.__Animals&&window.ChapterObjects&&[...document.images].every(i=>i.complete&&i.naturalWidth));
  for(const scene of satelliteOnly?['planets']:['planets','weather']) {
   await page.evaluate(id=>__Animals.goScene(id),scene);await page.waitForTimeout(800);assert.equal(await page.evaluate(()=>__Animals.sceneAt().id),scene);
   await page.screenshot({path:`${root}/${scene}-${viewport.width}-entry.png`});
   const ids=(await page.evaluate(scene=>[...new Set(GAME_SCENES[scene].animals.map(a=>a.id))],scene)).filter(id=>!satelliteOnly||id==='cosmossatellite');
   for(const id of ids) {
    await page.evaluate(id=>{AnimalAnims.stopAll();__Animals.stopSpeech();const e=[...document.querySelectorAll(`.animal[data-id="${id}"]`)].find(e=>e.tabIndex===0),r=e.getBoundingClientRect();__Animals.camera+=r.left+r.width/2-innerWidth*.5;},id);await page.evaluate(id=>AnimalAnims.preload(id),id);await page.waitForTimeout(60);
    const button=page.locator(`.animal[data-id="${id}"][tabindex="0"]`).first();await button.click();await page.waitForTimeout(130);
    const before=await button.evaluate(e=>AnimalAnims.inspect(e));assert.equal(before?.renderer,'chapter-originals',id+':renderer');
    await button.click({force:true});const after=await button.evaluate(e=>AnimalAnims.inspect(e));assert(after.progress>=before.progress,id+':repeat reset');
    await button.evaluate(e=>AnimalAnims.seek(e,.5));await page.waitForTimeout(id.startsWith('wx')?2150:90);
    const mid=await button.evaluate(e=>{const s=AnimalAnims.inspect(e),ori=e.querySelector('.orientation').getBoundingClientRect(),body=e.querySelector('.chapter-base').getBoundingClientRect(),r=e.getBoundingClientRect(),panel=e.closest('.panel');return {...s,visible:r.right>0&&r.left<innerWidth,uncropped:ori.top>=0&&ori.bottom<=innerHeight&&body.top>=0&&body.bottom<=innerHeight&&body.left>=0&&body.right<=innerWidth,hitBox:{width:r.width,height:r.height},original:{width:ori.width,height:ori.height},activeDrawing:{width:body.width,height:body.height},weatherLayers:panel.dataset.weather,orbitCenter:e.querySelector('.orbit-center')?.src||null};});
    assert(mid.visible&&mid.uncropped,id+':clipped/outside');assert(mid.hitBox.width>=44&&mid.hitBox.height>=44,id+':touch target');
    if(mid.orbit){const expected=mid.motion==='satellite'?'cosmosearth':'cosmossun';const correct=await button.evaluate((e,id)=>e.querySelector('.orbit-center').src===(window.resolveAsset?resolveAsset(CHAPTER_OBJECTS[id].poster):new URL(CHAPTER_OBJECTS[id].poster,location.href).href),expected);assert(correct,id+':wrong orbit center');report.orbit.push({viewport:viewport.width,id,center:expected,drawing:mid.activeDrawing,original:mid.original});if(mid.activeDrawing.height<25)report.warnings.push(id+': small active diagram at '+viewport.width+' ('+mid.activeDrawing.height.toFixed(1)+'px)');}
    if(id.startsWith('wx')){const target=id==='wxumbrella'?'rain':mid.motion.slice(8);assert.equal(mid.weatherLayers,target,id+':weather state');const expectedClass=target==='autumn'?'leaves':target==='sun'||target==='cloud'?'wash':target;const effect=await button.evaluate((e,cls)=>{const n=e.closest('.panel').querySelector('.weather-'+cls);return {opacity:Number(getComputedStyle(n).opacity),pointerEvents:getComputedStyle(n).pointerEvents,particles:n.querySelectorAll('i').length};},expectedClass);assert.equal(effect.pointerEvents,'none',id+':effect intercepts clicks');if(!['sun','cloud'].includes(target))assert(effect.opacity>.95,id+':invisible scene effect');report.weather.push({id,viewport:viewport.width,target,effect});}
    report.objects.push({id,scene,viewport:viewport.width,...mid});await page.screenshot({path:`${root}/${id}-${viewport.width}-active.png`});await button.evaluate(e=>AnimalAnims.stop(e));assert.equal(await button.locator('.chapter-action').count(),0);
   }
   report.viewports.push({scene,...viewport});
  }
 }
 // Resize reconstructs all panels. Scene-wide weather persists across copies.
 for(const target of satelliteOnly?[]:['rain','wind','autumn','snow','rainbow','sun']) {
  await page.evaluate(value=>ChapterObjects.setWeather(value),target);await page.setViewportSize({width:1280,height:720});await page.waitForTimeout(100);assert(await page.evaluate(value=>ChapterObjects.weather===value&&[...document.querySelectorAll('.panel[data-scene="weather"]')].every(p=>p.dataset.weather===value),target),target+':lost after resize');await page.setViewportSize({width:844,height:390});await page.waitForTimeout(100);
 }
 assert.equal(report.errors.length,0,'runtime errors');assert.equal(report.failedAssets.length,0,'missing assets');console.log(JSON.stringify({scenes:report.viewports.length/2,objects:report.objects.length/2,viewports:report.viewports.length,errors:report.errors,warnings:report.warnings},null,2));
} finally { fs.writeFileSync(`${root}/${satelliteOnly?'satellite-checks':'runtime-checks'}.json`,JSON.stringify(report,null,2));await browser.close(); }
