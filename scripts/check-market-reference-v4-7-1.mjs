import fs from 'node:fs';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import crypto from 'node:crypto';
import {createRequire} from 'node:module';
const require=createRequire('C:/Users/XTIA/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/package.json'),{chromium}=require('playwright');
const hash=f=>crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex');
const load=f=>{const c={window:{}};vm.runInNewContext(fs.readFileSync(f,'utf8'),c);return c.window;};
const base=load('share/runtime-v4-7/assets/game-data.js'),current=load('geo/assets/game-data.js');
assert.equal(JSON.stringify(base.GAME_DIALOGUE),JSON.stringify(current.GAME_DIALOGUE));
assert.equal(JSON.stringify(base.GAME_SCENE_ORDER),JSON.stringify(current.GAME_SCENE_ORDER));
for(const id of current.GAME_SCENE_ORDER.filter(id=>id!=='market'))assert.equal(JSON.stringify(base.GAME_SCENES[id]),JSON.stringify(current.GAME_SCENES[id]),id);
for(const file of ['anims.js','authored-motion-data.js','cel-motion.js','animation-data.js','puppet-rigs.js','quadruped-walk.js','quadruped-details.js','animal-motion.js','story-objects.js'])assert.equal(hash('geo/assets/'+file),hash('share/runtime-v4-7/assets/'+file),file);
fs.mkdirSync('screenshots/v4-7-1',{recursive:true});
const browser=await chromium.launch({channel:'msedge',headless:true}),report={errors:[],failedAssets:[],viewports:[],interactions:[],preservedV47:true};
try{
 const page=await browser.newPage();page.on('pageerror',e=>report.errors.push(e.message));page.on('response',r=>{if(r.status()>=400)report.failedAssets.push(r.url());});
 for(const size of [{width:2560,height:1440},{width:844,height:390}]){
  await page.setViewportSize(size);await page.goto('http://127.0.0.1:4173/geo/?scene=market&v=4.7.1');
  await page.waitForFunction(()=>window.__Animals&&[...document.images].every(i=>i.complete&&i.naturalWidth));await page.waitForTimeout(650);
  const info=await page.evaluate(()=>{const panel=[...document.querySelectorAll('.panel[data-scene="market"]')][1],bg=panel.querySelector('.bg-panel'),r=panel.getBoundingClientRect();return {scene:__Animals.sceneAt().id,width:r.width,height:r.height,tiles:panel.querySelectorAll('.bg-panel').length,background:getComputedStyle(bg).backgroundImage,mirror:getComputedStyle(bg).transform,hiddenPosters:[...panel.querySelectorAll('.animal .idle-layer')].every(e=>getComputedStyle(e).visibility==='hidden'),basketCount:panel.querySelectorAll('.basket-hotspot').length};});
  assert.equal(info.scene,'market');assert.equal(info.tiles,1);assert.equal(info.mirror,'none');assert.equal(info.width,Math.max(size.width,size.height*3));assert(info.hiddenPosters&&info.basketCount===7);assert(info.background.includes('market-preferred-v4-7-1.webp'));
  report.viewports.push({...size,...info});await page.screenshot({path:`screenshots/v4-7-1/market-${size.width}-left.png`});
  for(const id of ['apple','banana','orange','pear','watermelon','tomato','carrot']){
   await page.evaluate(id=>{__Animals.stopSpeech();AnimalAnims.stopAll();const el=[...document.querySelectorAll(`.animal[data-scene="market"][data-id="${id}"]`)].find(e=>e.tabIndex===0),r=el.getBoundingClientRect();__Animals.camera+=r.left+r.width/2-innerWidth*.5;},id);
   await page.waitForTimeout(40);const button=page.locator(`.animal[data-scene="market"][data-id="${id}"][tabindex="0"]`);await button.click();await page.waitForTimeout(150);
   const active=await button.evaluate(e=>{const s=AnimalAnims.inspect(e),r=e.getBoundingClientRect();return {id:e.dataset.id,renderer:s?.renderer,hiddenPoster:getComputedStyle(e.querySelector('.idle-layer')).visibility==='hidden',popup:!!e.querySelector('canvas'),hitWidth:r.width,hitHeight:r.height,top:r.top};});
   assert.equal(active.renderer,'continuous-cutaway');assert(active.hiddenPoster&&active.popup);assert(active.hitWidth>44&&active.hitHeight>44);
   await button.evaluate(e=>AnimalAnims.seek(e,.5));if(id==='banana'||id==='watermelon')await page.screenshot({path:`screenshots/v4-7-1/market-${size.width}-${id}-open.png`});
   await button.evaluate(e=>AnimalAnims.stop(e));assert.equal(await button.locator('canvas').count(),0);report.interactions.push({...size,...active});
  }
  // Scene arrows still resolve the neighbors after using a natural-width market.
  assert.equal(await page.locator('#previousScene').getAttribute('data-scene'),'polar');assert.equal(await page.locator('#nextScene').getAttribute('data-scene'),'farm');
  await page.click('#nextScene');await page.waitForTimeout(750);assert.equal(await page.evaluate(()=>__Animals.sceneAt().id),'farm');
  await page.evaluate(()=>__Animals.goScene('savanna'));await page.waitForTimeout(750);assert.equal(await page.evaluate(()=>__Animals.sceneAt().id),'savanna');
  await page.evaluate(()=>{const el=[...document.querySelectorAll('.animal[data-id="cheetah"]')].find(e=>e.tabIndex===0),r=el.getBoundingClientRect();__Animals.camera+=r.left+r.width/2-innerWidth*.5;});
  await page.locator('.animal[data-id="cheetah"][tabindex="0"]').click();await page.waitForTimeout(180);assert.equal(await page.locator('.animal[data-id="cheetah"][tabindex="0"]').evaluate(e=>AnimalAnims.inspect(e)?.renderer),'authored-keyframes');
 }
 // Rebuilding after an orientation/size change keeps basket and image coordinates aligned.
 await page.goto('http://127.0.0.1:4173/geo/?scene=market');await page.setViewportSize({width:1280,height:720});await page.waitForTimeout(500);
 const resize=await page.evaluate(()=>{const p=[...document.querySelectorAll('.panel[data-scene="market"]')][1],r=p.getBoundingClientRect(),b=p.querySelector('.basket-hotspot[data-id="pear"]').getBoundingClientRect();return {width:r.width,height:r.height,pearU:(b.left+b.width/2-r.left)/r.width};});assert.equal(resize.width,2160);assert(Math.abs(resize.pearU-.495)<1e-5);report.resize=resize;
 assert.equal(report.errors.length,0);assert.equal(report.failedAssets.length,0);console.log(JSON.stringify(report,null,2));
}finally{fs.writeFileSync('screenshots/v4-7-1/market-checks.json',JSON.stringify(report,null,2));await browser.close();}
