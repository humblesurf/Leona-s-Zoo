import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createRequire} from 'node:module';
const require=createRequire('C:/Users/XTIA/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/package.json');
const {chromium}=require('playwright');
const browser=await chromium.launch({channel:'msedge',headless:true});
const page=await browser.newPage({viewport:{width:1180,height:820},hasTouch:true}),errors=[];
page.on('pageerror',e=>errors.push(e.message));
await page.goto('http://127.0.0.1:4173/geo/?v=4');
await page.waitForFunction(()=>window.__Animals&&[...document.images].every(i=>i.complete&&i.naturalWidth));
assert.equal(await page.locator('#habitats').getAttribute('aria-hidden'),'true');
assert.ok(await page.locator('#intro').isVisible());
await page.mouse.move(20,819);
await page.waitForFunction(()=>document.body.classList.contains('nav-open'));
await page.mouse.move(20,300);
await page.waitForFunction(()=>!document.body.classList.contains('nav-open'),{},{timeout:4000});
await page.locator('#navToggle').click();
await page.locator('#habitats [data-scene="rainforest"]').click();
await page.waitForFunction(()=>!document.body.classList.contains('nav-open'),{},{timeout:4000});
assert.equal(await page.evaluate(()=>__Animals.sceneAt().id),'rainforest');
await page.locator('#navToggle').click();
await page.locator('#world').dispatchEvent('wheel',{deltaX:100});
assert.equal(await page.locator('#habitats').getAttribute('aria-hidden'),'true');
await page.waitForTimeout(650);
assert.equal(await page.locator('#intro').isVisible(),false);
assert.ok(await page.evaluate(()=>GAME_SCENES.savanna.numScreens>=8&&GAME_SCENES.rainforest.numScreens>=8&&GAME_SCENES.ocean.numScreens>=7.5));
assert.deepEqual(await page.evaluate(()=>['savanna','rainforest','ocean'].map(s=>({aspect:GAME_SCENES[s].bgAspect,path:GAME_SCENES[s].bgPanels[0]}))),['savanna','rainforest','ocean'].map(s=>({aspect:3,path:`assets/bg/reference/${s}-preferred-v4.png`})));
assert.equal(await page.locator('script[src*="animal-rigs"]').count(),0);
const result=await page.evaluate(async()=>{
 const rows=[];
 for(const [id,d]of Object.entries(ANIMAL_ANIMATIONS)){
  if(!d.sheet)continue;
  const el=document.querySelector(`.animal[data-id="${id}"]`);
  if(!el)throw Error(`Missing ${id}`);
  await AnimalAnims.preload(id);
  let previous=null,turned=false;
  for(let attempt=0;attempt<(d.travel?5:1);attempt++){
   const r=AnimalAnims.play(el,id);await new Promise(resolve=>requestAnimationFrame(resolve));
   if(!AnimalAnims.inspect(el)?.ready)throw Error(`Sheet not ready ${id}`);
   const state=AnimalAnims.inspect(el);
   if(state.renderer!=='sprite-keyframes')throw Error(`Renderer ${id}`);
   if(d.travel&&state.travel*state.face<0)throw Error(`Walking backwards ${id}`);
   if(previous!=null&&state.face!==previous)turned=true;
   previous=state.face;
   let last=Number(el.style.translate.split(' ')[0].replace('px',''));
   for(const p of [0,.18,.35,.52,.7,.87,1]){
    AnimalAnims.seek(el,p);
    const now=Number(el.style.translate.split(' ')[0].replace('px',''));
    if(d.travel&&(now-last)*state.face<-.01)throw Error(`Travel reversed during action ${id}`);
    last=now;
    const canvas=el.querySelector('canvas'),pixels=canvas.getContext('2d').getImageData(0,0,canvas.width,canvas.height).data;
    if(!pixels.some((v,i)=>i%4===3&&v>96))throw Error(`Empty frame ${id} ${p}`);
    if(el.querySelectorAll('canvas').length!==1)throw Error(`Duplicate renderer ${id}`);
   }
   AnimalAnims.stop(el);
  }
  if(d.travel&&!turned)throw Error(`Did not face forward after reaching boundary ${id}`);
  rows.push({id,frames:d.frames.length,forward:d.travel?true:null,turnAtBoundary:d.travel?turned:null});
 }
 AnimalAnims.stopAll();return rows;
});
assert.equal(result.length,53);assert.ok(result.every(r=>r.frames===6));
assert.equal(await page.locator('canvas.animal-frames').count(),0);
assert.equal(await page.locator('.acting').count(),0);
await page.setViewportSize({width:844,height:390});await page.waitForTimeout(250);
assert.equal(await page.locator('#habitats').getAttribute('aria-hidden'),'true');
assert.ok((await page.locator('#navToggle').boundingBox()).height<=28);
await page.touchscreen.tap(14,389);
await page.waitForFunction(()=>document.body.classList.contains('nav-open'));
await page.locator('#habitats [data-scene="ocean"]').click();
await page.waitForFunction(()=>!document.body.classList.contains('nav-open'),{},{timeout:4000});
assert.equal(await page.evaluate(()=>__Animals.sceneAt().id),'ocean');
await page.waitForTimeout(320);
await page.screenshot({path:'geo/screenshots/v4/mobile-landscape.jpg',quality:94});
assert.deepEqual(errors,[]);
const report={characters:53,actions:result,navigation:'collapsed, edge reveal, auto hide, drag hide, mobile landscape',errors};
fs.writeFileSync('geo/screenshots/v4/animation-test.json',JSON.stringify(report,null,2));
console.log({characters:53,movingCharacters:result.filter(r=>r.forward).length,errors});
await browser.close();
