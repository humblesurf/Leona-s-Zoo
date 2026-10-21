import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
const require=createRequire('C:/Users/XTIA/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/package.json');
const {chromium}=require('playwright');
const root=new URL('../',import.meta.url),out=p=>new URL('screenshots/v4-1/'+p,root);
const partial=process.argv.includes('--partial');
const browser=await chromium.launch({headless:true,channel:'msedge'});
const reports=[],errors=[];
try{
 for(const viewport of [{width:1180,height:820},{width:2560,height:1440},{width:844,height:390}]){
  const context=await browser.newContext({viewport,deviceScaleFactor:2});const page=await context.newPage();
  page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400&&!partial)errors.push(r.status()+' '+r.url());});
  await page.goto('http://127.0.0.1:4173/geo/?v=4.1',{waitUntil:'load'});
  await page.waitForFunction(()=>window.__Animals?.worldW()>0);await page.waitForTimeout(500);
  assert.equal(await page.evaluate(()=>__Animals.language),'en');
  assert.deepEqual(await page.evaluate(()=>GAME_SCENE_ORDER),['savanna','rainforest','ocean','polar']);
  const initial=await page.evaluate(()=>({navHidden:document.getElementById('habitats').inert,noCapy:!GAME_DIALOGUE.capybara&&!GAME_DIALOGUE.tapir,polar:GAME_SCENES.polar.numScreens,count:Object.keys(GAME_DIALOGUE).length,greet:Object.values(GAME_DIALOGUE).filter(d=>d.intro.en.startsWith('Hi, little friend')).length,groups:Object.fromEntries(['zebra','giraffe','flamingo'].map(id=>[id,GAME_SCENES.savanna.animals.filter(a=>a.id===id).length])),penguins:GAME_SCENES.polar.animals.filter(a=>a.id==='penguin').length,languageOptions:[...document.querySelectorAll('[data-language]')].map(e=>e.dataset.language)}));
  assert(initial.navHidden&&initial.noCapy);assert(Math.abs(initial.polar-9.5/3)<1e-10);assert.equal(initial.count,55);assert.equal(initial.greet,11);assert.deepEqual(initial.groups,{zebra:3,giraffe:2,flamingo:3});assert.equal(initial.penguins,2);assert.equal(initial.languageOptions.length,7);
  await page.evaluate(()=>__Animals.swipe(-80));await page.waitForTimeout(600);assert(await page.locator('#intro').isHidden());
  await page.evaluate(()=>__Animals.goScene('rainforest'));await page.waitForTimeout(750);
  assert.equal(await page.locator('#previousScene small').innerText(),'草原');assert.equal(await page.locator('#nextScene small').innerText(),'海底');
  await page.locator('#nextScene').click();await page.waitForTimeout(750);assert.equal(await page.evaluate(()=>__Animals.sceneAt().id),'ocean');
  await page.locator('#navToggle').click();assert.equal(await page.locator('#habitats').getAttribute('aria-hidden'),'false');await page.locator('.nav-close').click();assert.equal(await page.locator('#habitats').getAttribute('aria-hidden'),'true');
  await page.locator('#soundButton').click();assert(await page.evaluate(()=>__Animals.muted));assert(await page.evaluate(()=>__Animals.musicEnabled));
  await page.locator('#musicButton').click();assert.equal(await page.evaluate(()=>__Animals.musicEnabled),false);await page.waitForTimeout(950);
  assert(await page.evaluate(()=>Object.values(__Animals.ambienceStatus()).every(a=>a.paused)));
  await page.locator('#musicButton').click();await page.waitForTimeout(950);assert.equal(await page.evaluate(()=>__Animals.ambienceStatus().ocean.paused),false);
  const ids=await page.evaluate(()=>Object.keys(GAME_DIALOGUE));const motion=[];let placements=[];
  for(const id of partial?['hippo','zebra']:ids){
   if(id!=='igloo'&&!partial)assert.equal(await page.evaluate(id=>ANIMAL_ANIMATIONS[id].frames.length,id),16,id+' frames');
   const located=await page.evaluate(id=>{
    const el=[...document.querySelectorAll(`.animal[data-id="${id}"]`)].find(e=>e.tabIndex===0);let start=0;
    for(const sid of GAME_SCENE_ORDER){if(sid===el.dataset.scene)break;start+=GAME_SCENES[sid].numScreens*__Animals.screenW();}
    const panel=el.closest('.panel');__Animals.camera=Math.max(start,start+Number(el.dataset.u)*panel.offsetWidth-innerWidth/2);return el.dataset.instance;
   },id);
   const el=page.locator(`.animal[data-instance="${located}"]`).nth(1);
   await el.locator('img').evaluate(img=>img.decode());
   await page.evaluate(async id=>{await AnimalAnims.preload(id);const el=[...document.querySelectorAll(`.animal[data-id="${id}"]`)].find(e=>e.tabIndex===0);AnimalAnims.play(el,id);},id);
   await page.waitForFunction(id=>{const el=[...document.querySelectorAll(`.animal[data-id="${id}"]`)].find(e=>e.tabIndex===0);return AnimalAnims.inspect(el)?.ready;},id);
   for(const phase of [.15,.45,.75]){
    const snap=await page.evaluate(({id,phase})=>{
     const el=[...document.querySelectorAll(`.animal[data-id="${id}"]`)].find(e=>e.tabIndex===0);AnimalAnims.seek(el,phase);
     const c=el.querySelector('canvas'),a=c.getContext('2d').getImageData(0,0,c.width,c.height).data;let minX=c.width,maxX=-1,minY=c.height,maxY=-1;
     for(let y=0;y<c.height;y++)for(let x=0;x<c.width;x++){if(a[(y*c.width+x)*4+3]>96){minX=Math.min(minX,x);maxX=Math.max(maxX,x);minY=Math.min(minY,y);maxY=Math.max(maxY,y);}}
     const r=c.getBoundingClientRect();return {id,...AnimalAnims.inspect(el),actualCss:[r.width,r.height],extent:[minX,minY,maxX,maxY],clip:getComputedStyle(el.querySelector('.sprite')).clipPath};
    },{id,phase});
    assert(Math.abs(snap.bitmap[0]/snap.actualCss[0]-2)<.01,id+' Retina CSS width');assert.equal(snap.clip,'none',id+' clipped wrapper');
    assert(snap.extent[0]>0&&snap.extent[1]>0&&snap.extent[2]<snap.bitmap[0]-1&&snap.extent[3]<snap.bitmap[1]-1,id+' whole silhouette');
    assert(snap.zoom>1.08,id+' click zoom');assert(snap.travel===0||snap.travel*snap.face>0,id+' forward travel');motion.push(snap);
   }
   if(id==='hippo'||id==='tiger'||id==='octopus'||id==='monkey')await page.screenshot({path:fileURLToPath(out(`${viewport.width}-${id}.png`))});
   await page.evaluate(id=>{const e=[...document.querySelectorAll(`.animal[data-id="${id}"]`)].find(e=>e.tabIndex===0);AnimalAnims.stop(e);},id);
  }
  await page.evaluate(()=>__Animals.activate('zebra'));await page.waitForTimeout(150);
  const caption=await page.locator('#subtitle').evaluate(el=>({top:el.getBoundingClientRect().top,whiteSpace:getComputedStyle(el.querySelector('.sub-text')).whiteSpace,display:getComputedStyle(el.querySelector('.sub-copy')).display}));
  assert(caption.top<100);assert.equal(caption.whiteSpace,'nowrap');assert.equal(caption.display,'flex');
  await page.evaluate(()=>__Animals.stopSpeech());
  placements=await page.evaluate(()=>[...document.querySelectorAll('.animal')].filter(e=>e.tabIndex===0).map(e=>({id:e.dataset.id,scene:e.dataset.scene,flip:e.dataset.flip,u:+e.dataset.u,h:e.offsetHeight,instance:e.dataset.instance})));
  reports.push({viewport,initial,caption,motion,placements});await context.close();
 }
 assert.deepEqual(errors,[]);
 fs.writeFileSync(out(partial?'smoke.json':'acceptance.json'),JSON.stringify({passed:true,reports,errors},null,2));
 console.log(JSON.stringify({passed:true,viewports:reports.length,characters:partial?2:55,errors}));
}finally{await browser.close();}
