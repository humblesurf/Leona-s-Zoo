import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import fs from 'node:fs';
const require=createRequire('C:/Users/XTIA/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/package.json');
const {chromium}=require('playwright');
const browser=await chromium.launch({headless:true,channel:'msedge'});
const failures=[],errors=[],requests=[];
const page=await browser.newPage({viewport:{width:1180,height:820}});
page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)requests.push([r.status(),r.url()]);});
await page.goto(process.env.ANIMAL_TEST_URL||'http://127.0.0.1:4173/geo/');await page.waitForFunction(()=>window.__Animals&&[...document.images].every(i=>i.complete&&i.naturalWidth));
await page.locator('#soundButton').click();
const records=await page.evaluate(()=>window.GAME_SCENE_ORDER.flatMap((sid,s)=>GAME_SCENES[sid].animals.map((a,k)=>({id:a.id,sid,u:Number(document.querySelectorAll('.panel')[GAME_SCENE_ORDER.length+s].querySelectorAll('.animal')[k].dataset.u)}))));
async function centre({id,sid,u}){
 await page.evaluate(({sid,u})=>{let acc=0;for(const s of GAME_SCENE_ORDER){if(s===sid)break;acc+=GAME_SCENES[s].numScreens*__Animals.screenW();}__Animals.camera=acc+u*GAME_SCENES[sid].numScreens*__Animals.screenW()-innerWidth/2;},{sid,u});
 const point=await page.evaluate(id=>{const els=[...document.querySelectorAll(`.animal[data-id="${id}"]`)];const el=els.find(e=>{const r=e.getBoundingClientRect();return r.left>=0&&r.right<=innerWidth;});if(!el)return null;const r=el.getBoundingClientRect(),x=r.left+r.width/2,y=r.top+r.height/2;return {x,y,hit:document.elementFromPoint(x,y)?.closest('.animal')?.dataset.id,width:r.width,height:r.height};},id);
 return point;
}
for(const record of records){
 const p=await centre(record);assert.ok(p,`Visible ${record.id}`);
 if(p.hit!==record.id){failures.push(`Tap occluded: ${record.id} hit ${p.hit}`);continue;}
 await page.mouse.click(p.x,p.y);await page.waitForTimeout(35);
 assert.ok(await page.evaluate(id=>[...document.querySelectorAll(`.animal[data-id="${id}"]`)].some(e=>AnimalAnims.isActing(e)),record.id),`action ${record.id}`);
 assert.ok(await page.evaluate(()=>[...document.querySelectorAll('.animal img')].every(i=>!i.style.clipPath&&!i.style.webkitClipPath)),'No cut body parts');
}
await page.evaluate(()=>__Animals.stopSpeech());await page.waitForFunction(()=>document.querySelectorAll('.acting').length===0,{},{timeout:6000});
assert.equal(await page.locator('.acting').count(),0,'all actions restore');assert.equal(await page.locator('.action-fx').count(),0,'effects clean up');
// Rapid re-taps restore a single connected original image, with no leftover rigs.
await centre(records.find(r=>r.id==='turtle'));
await page.evaluate(()=>{for(let i=0;i<20;i++)__Animals.activate('turtle');});await page.waitForFunction(()=>document.querySelectorAll('.acting').length===0,{},{timeout:6000});
assert.equal(await page.locator('.acting').count(),0);
assert.ok(await page.evaluate(()=>[...document.querySelectorAll('.animal')].every(el=>el.querySelectorAll('img').length===1)));
// Drag from an animal and cancel: neither action nor story is triggered.
const lion=records.find(r=>r.id==='lion'),p=await centre(lion);await page.evaluate(()=>__Animals.stopSpeech());
await page.mouse.move(p.x,p.y);await page.mouse.down();await page.mouse.move(p.x-190,p.y,{steps:8});await page.mouse.up();
assert.equal(await page.locator('#subtitle.show').count(),0,'drag does not introduce animal');
await page.waitForTimeout(700);
for(const lang of ['en','yue','cmn','all']){await page.locator('#languageButton').click();await page.locator(`[data-language="${lang}"]`).click();assert.equal(await page.evaluate(()=>__Animals.language),lang);}
// Portrait and landscape preserve logical camera location and usable touch targets.
for(const viewport of [{width:390,height:844},{width:844,height:390},{width:320,height:568}]){
 const ratio=await page.evaluate(()=>__Animals.camera/__Animals.worldW());await page.setViewportSize(viewport);await page.waitForTimeout(350);
 assert.ok(Math.abs(await page.evaluate(()=>__Animals.camera/__Animals.worldW())-ratio)<.001,'camera preserved');
 for(const id of ['savanna','rainforest','ocean','arctic','antarctic']){if(await page.locator('#habitats').getAttribute('aria-hidden')==='true')await page.locator('#navToggle').click();await page.locator(`#habitats [data-scene="${id}"]`).click();await page.waitForTimeout(750);assert.equal((await page.evaluate(()=>__Animals.sceneAt())).id,id);const visible=await page.evaluate(()=>[...document.querySelectorAll('.animal')].filter(e=>{const r=e.getBoundingClientRect();return r.left>=0&&r.right<=innerWidth&&r.bottom>100&&r.top<innerHeight-50;}));assert.ok(visible.length,`first ${id} on ${viewport.width}`);}
 await page.screenshot({path:`geo/screenshots/v2/mobile-${viewport.width}.jpg`,quality:90});
}
await page.setViewportSize({width:1180,height:820});await page.waitForTimeout(250);
// Real media order: call then English, Cantonese and Mandarin, with one active voice element.
await page.locator('#languageButton').click();await page.locator('#creditsButton').click();assert.equal(await page.locator('.credit-row').count(),await page.evaluate(()=>Object.keys(CALL_RECORDINGS).length));assert.ok(await page.locator('#creditsDialog').isVisible());await page.locator('#closeCredits').click();
await page.locator('#soundButton').click();await centre(lion);
await page.evaluate(()=>{window.__audioEvents=[];window.__playedMedia=new Set();const original=HTMLMediaElement.prototype.play;HTMLMediaElement.prototype.play=function(){__playedMedia.add(this);if(this.volume>0)__audioEvents.push({src:this.src,volume:this.volume});return original.call(this);};});
const lp=await centre(lion);await page.mouse.click(lp.x,lp.y);
await page.waitForFunction(()=>__audioEvents.some(e=>/\/voice\/lion-cmn(?:-[a-z]+)?\.mp3/.test(e.src)),{},{timeout:42000});
const mediaEvents=await page.evaluate(()=>__audioEvents);
assert.ok(mediaEvents.some(e=>e.src.includes('/calls/lion.mp3')));assert.ok(mediaEvents.some(e=>/\/voice\/lion-en(?:-[a-z]+)?\.mp3/.test(e.src)));assert.ok(mediaEvents.some(e=>/\/voice\/lion-yue(?:-[a-z]+)?\.mp3/.test(e.src)));assert.ok(mediaEvents.some(e=>/\/voice\/lion-cmn(?:-[a-z]+)?\.mp3/.test(e.src)));
await page.locator('#soundButton').click();await page.waitForTimeout(950);
assert.equal(await page.evaluate(()=>[...__playedMedia].filter(a=>!a.paused).length),0);
assert.deepEqual(errors,[]);assert.deepEqual(requests,[]);
console.log(JSON.stringify({charactersTapped:records.length,uniqueCharacters:new Set(records.map(r=>r.id)).size,occlusions:failures,mediaEvents,errors,failedRequests:requests},null,2));
fs.writeFileSync('geo/screenshots/v2/test-results.json',JSON.stringify({charactersTapped:records.length,occlusions:failures,errors,failedRequests:requests,mediaEvents},null,2));
await browser.close();if(failures.length)process.exitCode=1;
