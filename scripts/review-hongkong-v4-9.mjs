import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const require=createRequire('C:/Users/XTIA/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/package.json');
const {chromium}=require('playwright');
const dir='screenshots/v4-9/hk';await fs.mkdir(dir,{recursive:true});
const browser=await chromium.launch({channel:'msedge',headless:true});
const report={scene:'hongkong',errors:[],failedAssets:[],viewports:[],objects:[],manualReviewPending:true};
try{
 const page=await browser.newPage();page.on('pageerror',e=>report.errors.push(e.message));page.on('response',r=>{if(r.status()>=400)report.failedAssets.push(r.url());});
 for(const viewport of [{width:2560,height:1440},{width:844,height:390}].filter(v=>!process.argv[3]||v.width===Number(process.argv[3]))){
  await page.setViewportSize(viewport);await page.goto('http://127.0.0.1:4173/geo/?scene=hongkong&v=4.9');
  await page.waitForFunction(()=>window.__Animals&&window.CHAPTER_OBJECTS?.hkferry&&[...document.images].every(i=>i.complete&&i.naturalWidth));
  await page.evaluate(()=>__Animals.goScene('hongkong'));await page.waitForTimeout(750);
  assert.equal(await page.evaluate(()=>__Animals.sceneAt().id),'hongkong');
  await page.screenshot({path:dir+'/hongkong-'+viewport.width+'-entry.png'});
  for(const id of ['hkferry','hktram','hkbus','hkboc','hkclock','hkdim'].filter(id=>!process.argv[2]||id===process.argv[2])){
   await page.evaluate(id=>{AnimalAnims.stopAll();__Animals.stopSpeech();const e=[...document.querySelectorAll('.animal[data-id="'+id+'"]')].find(e=>e.tabIndex===0);const r=e.getBoundingClientRect();__Animals.camera+=r.left+r.width/2-innerWidth/2;},id);
   await page.evaluate(id=>AnimalAnims.preload(id),id);await page.waitForTimeout(80);
   const button=page.locator('.animal[data-id="'+id+'"][tabindex="0"]').first();
   await page.screenshot({path:dir+'/'+id+'-'+viewport.width+'-rest.png'});
   await button.click();await page.waitForTimeout(120);
   const a=await button.evaluate(e=>AnimalAnims.inspect(e));
   assert.equal(a?.renderer,'chapter-originals',id);
   await button.click({force:true});const b=await button.evaluate(e=>AnimalAnims.inspect(e));assert(b.progress>=a.progress,id+': retap reset');
   await button.evaluate(e=>AnimalAnims.seek(e,.5));
   await page.waitForTimeout(1800);
   const mid=await button.evaluate(e=>{
    const state=AnimalAnims.inspect(e),r=e.querySelector('.chapter-visual').getBoundingClientRect(),sub=document.getElementById('subtitle').getBoundingClientRect();
    const images=[...e.querySelectorAll('img')].map(i=>({source:i.src,complete:i.complete&&!!i.naturalWidth}));
    const effects=[...e.querySelectorAll('.chapter-effect')].map(n=>{const q=n.getBoundingClientRect();return {type:n.className,x:q.x,y:q.y,width:q.width,height:q.height};});
    return {...state,images,effects,rect:{x:r.x,y:r.y,width:r.width,height:r.height,bottom:r.bottom,right:r.right},visible:r.right>0&&r.left<innerWidth,uncropped:r.top>=0&&r.bottom<=innerHeight,subtitle:{y:sub.y,height:sub.height,bottom:sub.bottom,text:document.querySelector('.sub-text').textContent,nowrap:getComputedStyle(document.querySelector('.sub-text')).whiteSpace},language:__Animals.language,section:document.getElementById('sceneTag').textContent};
   });
   report.objects.push({viewport:viewport.width,id,...mid,repeatPreserved:true});
   await page.screenshot({path:dir+'/'+id+'-'+viewport.width+'-active.png'});
   assert(mid.visible&&mid.uncropped,id+': clipped/outside');assert(mid.images.every(i=>i.complete),id+': image missing');
   if(['boat','tram','bus'].includes(mid.motion))assert(mid.travel*mid.face>0,id+': backward movement');
   if(id==='hktram')assert.equal(mid.wheels,2);if(id==='hkbus')assert.equal(mid.wheels,3);
   if(id==='hkboc')assert(mid.windows);assert.equal(mid.language,'en');
   assert.equal(mid.subtitle.nowrap,'nowrap',id+': subtitle wrapped');
   if(id==='hkboc')assert(mid.rect.y>=mid.subtitle.bottom,id+': subtitle obscures mast');
   await button.evaluate(e=>AnimalAnims.stop(e));assert.equal(await button.locator('.chapter-action').count(),0);
  }
  report.viewports.push({...viewport,checked:6});
 }
 assert.equal(report.errors.length,0);assert.equal(report.failedAssets.length,0);
 console.log(JSON.stringify({scene:'hongkong',objects:6,viewports:2,errors:report.errors,failedAssets:report.failedAssets}));
}catch(e){report.errors.push(e.message);throw e;}finally{await fs.writeFile(dir+'/report.json',JSON.stringify(report,null,2));await browser.close();}

