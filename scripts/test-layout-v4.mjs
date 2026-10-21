import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import {createRequire} from 'node:module';
const require=createRequire('C:/Users/XTIA/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/package.json'),{chromium}=require('playwright'),sharp=require('sharp');
const spec=JSON.parse(fs.readFileSync('geo/assets/generation-v4.json','utf8'));
for(const r of spec.preferredBackgrounds){
 const bytes=fs.readFileSync(r.file),meta=await sharp(bytes).metadata();
 assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'),r.sha256);
 assert.equal(meta.width,2172);assert.equal(meta.height,724);
}
const browser=await chromium.launch({channel:'msedge',headless:true}),page=await browser.newPage(),errors=[],failed=[];
page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)failed.push(r.url());});
await page.goto('http://127.0.0.1:4173/geo/?v=4');await page.waitForFunction(()=>window.__Animals);await page.evaluate(()=>__Animals.dismissIntro());
const views=[];
for(const viewport of [{width:2560,height:1440},{width:844,height:390}]){
 await page.setViewportSize(viewport);await page.waitForTimeout(650);
 await page.waitForFunction(()=>[...document.images].every(i=>i.complete&&i.naturalWidth));
 const collisions=await page.evaluate(()=>{
  const failures=[];let start=0;
  for(const [s,sid]of GAME_SCENE_ORDER.entries()){
   const scene=GAME_SCENES[sid],w=scene.numScreens*__Animals.screenW();
   const panel=document.querySelectorAll('.panel')[GAME_SCENE_ORDER.length+s],els=[...panel.querySelectorAll('.animal')];
   for(const el of els){
    __Animals.camera=Math.max(0,start+Number(el.dataset.u)*w-innerWidth/2);
    const r=el.getBoundingClientRect(),x=r.left+r.width/2,y=r.top+r.height/2,hit=document.elementFromPoint(x,y)?.closest('.animal');
    if(hit!==el)failures.push({id:el.dataset.id,hit:hit?.dataset.id??null,scene:sid});
   }
   const tile=panel.querySelector('.bg-panel');
   if(Math.abs(tile.offsetWidth/innerHeight-scene.bgAspect)>.002)throw Error(`Background crop ${sid}`);
   start+=w;
  }
  return failures;
 });
 views.push({...viewport,charactersChecked:57,collisions});
 if(viewport.width===2560){
  for(const sid of ['savanna','rainforest','ocean','arctic','antarctic']){
   await page.evaluate(sid=>{let start=0;for(const s of GAME_SCENE_ORDER){if(s===sid)break;start+=GAME_SCENES[s].numScreens*__Animals.screenW();}__Animals.camera=start+GAME_SCENES[sid].numScreens*__Animals.screenW()*.44;},sid);
   await page.screenshot({path:`geo/screenshots/v4/hd-${sid}.jpg`,quality:95});
  }
 }
}
assert.deepEqual(errors,[]);assert.deepEqual(failed,[]);
fs.writeFileSync('geo/screenshots/v4/layout-test.json',JSON.stringify({preferredOriginalsUnchanged:true,views,errors,failedRequests:failed},null,2));
console.log(views);await browser.close();
assert.ok(views.every(v=>v.collisions.length===0),'Animal centres must be reachable on desktop and mobile landscape');
