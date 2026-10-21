import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
import {createRequire} from 'node:module';
const require=createRequire('C:/Users/XTIA/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/package.json');
const {chromium}=require('playwright');
const browser=await chromium.launch({channel:'msedge',headless:true});
const report={offline:true,errors:[],externalRequests:[],objects:[],preserved:[],voices:[]};
try {
 const context=await browser.newContext({offline:true,viewport:{width:1280,height:720}});
 const page=await context.newPage();
 page.on('pageerror',e=>report.errors.push(e.message));
 page.on('request',r=>{if(/^https?:/.test(r.url()))report.externalRequests.push(r.url());});
 await page.goto(pathToFileURL(path.resolve('share/Leonas-Zoo-v4-8.html')).href,{timeout:90000});
 await page.waitForFunction(()=>window.__Animals&&[...document.images].every(i=>i.complete&&i.naturalWidth),null,{timeout:60000});
 const inventory=await page.evaluate(()=>({
  scenes:GAME_SCENE_ORDER,
  objects:Object.keys(EXPLORATION_OBJECTS),
  authored:Object.entries(ANIMAL_ANIMATIONS).filter(([,d])=>d.cel).map(([id])=>id),
  language:__Animals.language
 }));
 assert.equal(inventory.scenes.length,9,'scene count');
 for(const id of ['harbor','camp','space'])assert(inventory.scenes.includes(id),id+' scene');
 assert.equal(inventory.objects.length,17,'new object count');
 assert.equal(inventory.authored.length,19,'preserved authored quadruped count');
 assert.equal(inventory.language,'en','English default');
 report.inventory=inventory;
 for(const id of inventory.objects) {
  const voice=await page.evaluate(id=>{
   const d=GAME_DIALOGUE[id];
   return {id,languages:['en','cmn','yue'].map(lang=>({
    lang,text:d.intro?.[lang],variants:(d.voiceVariants?.[lang]||[]).map(v=>({
     role:v.role,embedded:/^(data:|blob:)/.test(resolveAsset(v.path))
    }))
   }))};
  },id);
  for(const lang of voice.languages) {
   assert(lang.text,id+': missing '+lang.lang+' introduction');
   assert.equal(lang.variants.length,3,id+': voice variants '+lang.lang);
   assert(lang.variants.every(v=>v.embedded),id+': non-embedded voice '+lang.lang);
  }
  report.voices.push(voice);
 }
 async function center(id) {
  await page.evaluate(id=>{
   __Animals.dismissIntro();__Animals.stopSpeech();AnimalAnims.stopAll();
   const e=[...document.querySelectorAll('.animal')].find(e=>e.dataset.id===id&&e.tabIndex===0);
   if(!e)throw new Error('No interactive object '+id);
   const r=e.getBoundingClientRect();__Animals.camera+=r.left+r.width/2-innerWidth*.5;
  },id);
  await page.evaluate(id=>AnimalAnims.preload(id),id);
  await page.waitForTimeout(80);
  return page.locator('.animal[data-id="'+id+'"][tabindex="0"]').first();
 }
 for(const id of ['harborferry','harborsailboat','harborlighthouse','camptent','campstars','spacelunarrover','spacemarsrover']) {
  const button=await center(id);
  await button.click();
  await page.waitForTimeout(180);
  const first=await button.evaluate(e=>AnimalAnims.inspect(e));
  assert.equal(first?.renderer,'exploration-rigid-originals',id+': click renderer');
  assert(first.ready&&first.progress>0,id+': not playing');
  await button.click({force:true});
  const repeated=await button.evaluate(e=>AnimalAnims.inspect(e));
  assert(repeated.progress>=first.progress,id+': repeated click reset');
  await button.evaluate(e=>AnimalAnims.seek(e,.5));
  const state=await button.evaluate(e=>{
   const s=AnimalAnims.inspect(e),images=[...e.querySelectorAll('.exploration-action img')];
   const box=e.querySelector('.orientation').getBoundingClientRect();
   return {...s,completeImages:images.length>0&&images.every(i=>i.complete&&i.naturalWidth&&i.naturalHeight),
    imageCount:images.length,uncropped:box.top>=0&&box.bottom<=innerHeight,
    visible:box.right>0&&box.left<innerWidth,
    sailLayers:e.querySelectorAll('.exploration-sail').length,
    wheelLayers:e.querySelectorAll('.rover-wheel-spokes').length,
    closedOpacity:e.querySelector('.exploration-visual>img')?.style.opacity,
    nightPanels:[...document.querySelectorAll('.panel[data-scene="camp"]')].every(p=>p.classList.contains('camp-night'))
   };
  });
  assert(state.completeImages,id+': incomplete object images');
  assert(state.uncropped&&state.visible,id+': clipped/outside');
  if(['boat','sailboat','rover'].includes(state.motion))assert(state.travel*state.face>0,id+': reverse motion');
  if(state.motion==='sailboat')assert(state.sailLayers===1&&state.sail,id+': missing sail layer');
  if(state.motion==='tent')assert(state.open>.99&&state.closedOpacity==='0',id+': tent not open');
  if(state.motion==='lighthouse')assert(state.beam>.9,id+': lighthouse not lit');
  if(state.motion==='rover')assert(state.wheels>=2&&state.wheelLayers>=2,id+': missing wheels');
  if(state.motion==='stars')assert(state.nightPanels,id+': night not applied');
  report.objects.push({...state,repeatKeepsProgress:true});
 }
 for(const id of inventory.authored) {
  const button=await center(id);
  await button.evaluate((e,id)=>AnimalAnims.play(e,id),id);
  await page.waitForTimeout(60);
  const state=await button.evaluate(e=>AnimalAnims.inspect(e));
  assert.equal(state?.renderer,'authored-keyframes',id+': old painted renderer changed');
  assert(state.ready,id+': painted sheet not ready');
  report.preserved.push({id,renderer:state.renderer,ready:true});
 }
 assert.equal(report.errors.length,0,'page errors');
 assert.equal(report.externalRequests.length,0,'external HTTP requests');
 report.passed=true;
 console.log(JSON.stringify({offline:report.offline,scenes:inventory.scenes.length,objects:inventory.objects.length,clicked:report.objects.length,authored:report.preserved.length,voices:report.voices.length*9,errors:report.errors,externalRequests:report.externalRequests},null,2));
} catch(e) {
 report.passed=false;report.failure=e.message;throw e;
} finally {
 fs.writeFileSync('share/test-v4-8.json',JSON.stringify(report,null,2));
 await browser.close();
}
