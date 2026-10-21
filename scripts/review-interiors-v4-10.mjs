import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const require=createRequire('C:/Users/XTIA/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/package.json');
const {chromium}=require('playwright');
const out='screenshots/v4-10/interiors';fs.mkdirSync(out,{recursive:true});
const report={errors:[],assets:[],checks:[],music:[],basket:[]};
const check=(ok,text)=>{if(!ok)report.errors.push(text);};
const browser=await chromium.launch({channel:'msedge',headless:true});
try{
 const page=await browser.newPage();
 page.on('pageerror',e=>report.errors.push(e.message));
 page.on('response',r=>{if(r.status()>=400)report.assets.push({url:r.url(),status:r.status()});});
 await page.addInitScript(()=>{
  window.__qaAudio=[];const original=HTMLMediaElement.prototype.play;
  HTMLMediaElement.prototype.play=function(...args){const record={src:this.currentSrc||this.src,volume:this.volume,rate:this.playbackRate,played:false,resolved:false};window.__qaAudio.push(record);this.addEventListener('playing',()=>record.played=true,{once:true});this.addEventListener('error',()=>record.error=this.error?.message||'media error',{once:true});return original.apply(this,args).then(()=>{record.resolved=true;}).catch(e=>{record.error=e.message;throw e;});};
 });
 for(const vp of [{width:2560,height:1440},{width:844,height:390}]){
  await page.setViewportSize(vp);await page.goto('http://127.0.0.1:4173/geo/?scene=supermarket&v=4.10-interiors-qa');
  await page.waitForFunction(()=>window.__Animals&&window.ChapterObjects&&document.querySelector('.animal[data-id="shopmilk"][tabindex="0"] .idle-layer img')?.naturalWidth);
  await page.evaluate(()=>__Animals.dismissIntro());
  for(const scene of ['supermarket','music']){
   await page.evaluate(id=>{__Animals.stopSpeech();AnimalAnims.stopAll();__Animals.goScene(id);},scene);await page.waitForTimeout(750);
   await page.screenshot({path:out+'/'+vp.width+'-'+scene+'-entry.png'});
   const ids=await page.evaluate(id=>GAME_SCENES[id].animals.map(a=>a.id),scene);
   for(const id of ids){
    await page.evaluate(id=>{__Animals.stopSpeech();AnimalAnims.stopAll();const e=[...document.querySelectorAll('.animal[data-id="'+id+'"]')].find(e=>e.tabIndex===0),r=e.getBoundingClientRect();__Animals.camera+=r.left+r.width/2-innerWidth*.5;},id);
    await page.evaluate(id=>AnimalAnims.preload(id),id);await page.waitForTimeout(70);
    const el=page.locator('.animal[data-id="'+id+'"][tabindex="0"]').first();
    const resting=await el.evaluate(e=>{const panel=e.closest('.panel').getBoundingClientRect(),r=e.getBoundingClientRect(),orientation=e.querySelector('.orientation').getBoundingClientRect(),p=GAME_SCENES[e.dataset.scene].animals.find(a=>a.id===e.dataset.id);return {embedded:e.classList.contains('embedded-prop'),idle:getComputedStyle(e.querySelector('.idle-layer')).visibility,box:p.embeddedBounds,actual:[(r.left-panel.left)/panel.width,r.top/innerHeight,r.width/panel.width,r.height/innerHeight],orientation:[orientation.width,orientation.height],panelWidth:panel.width};});
    check(resting.embedded&&resting.idle==='hidden',id+': resting sticker visible');
    check(Math.abs(resting.actual[0]-resting.box[0])<.002&&Math.abs(resting.actual[1]-resting.box[1])<.003,id+': misplaced target');
    check(resting.actual[2]>=resting.box[2]-.002&&resting.actual[3]>=resting.box[3]-.003,id+': hit target smaller than painting');
    const before=await page.evaluate(()=>ChapterObjects.basket.length);
    await el.click({force:true});await page.waitForTimeout(80);await el.evaluate(e=>AnimalAnims.seek(e,.5));
    const mid=await el.evaluate(e=>{const visual=e.querySelector('.chapter-visual'),r=visual.getBoundingClientRect(),base=e.querySelector('.chapter-base'),fly=document.querySelector('.shopping-flight');return {...AnimalAnims.inspect(e),baseHidden:getComputedStyle(base).visibility==='hidden',visualTop:r.top,visualBottom:r.bottom,flightAspect:fly?parseFloat(fly.style.width)/parseFloat(fly.style.height):null,expectedAspect:CHAPTER_OBJECTS[e.dataset.id].posterAspect,overlays:[...visual.querySelectorAll('.chapter-effect')].map(x=>({class:x.className,box:[x.offsetLeft,x.offsetTop,x.offsetWidth,x.offsetHeight]}))};});
    check(mid.renderer==='chapter-originals'&&mid.baseHidden,id+': active sticker reappeared');check(mid.zoom===1,id+': painted object warped');
    check(mid.visualTop>=0&&mid.visualBottom<=vp.height+1,id+': clipped visual');
    if(mid.motion==='shop-product'){
     check(mid.flight&&Math.abs(mid.flightAspect-mid.expectedAspect)<.01,id+': flight shape distorted');
     await el.evaluate(e=>AnimalAnims.seek(e,.8));check(await page.evaluate(()=>ChapterObjects.basket.length)===before+1,id+': not added to basket');
     await el.evaluate(e=>AnimalAnims.seek(e,.8));check(await page.evaluate(()=>ChapterObjects.basket.length)===before+1,id+': duplicate basket insertion');
    }
    if(mid.motion==='shop-basket')check(await page.evaluate(()=>ChapterObjects.basket.length)===0,id+': basket not cleared');
    if(mid.motion==='shop-cart')check(mid.travel===0,id+': embedded cart unexpectedly moved');
    await page.screenshot({path:out+'/'+vp.width+'-'+id+'-active.png'});
    report.checks.push({viewport:vp.width,id,resting,mid});await el.evaluate(e=>AnimalAnims.stop(e));
   }
  }
  await page.evaluate(()=>{AnimalAnims.stopAll();__Animals.stopSpeech();ChapterObjects.setMusic('slow','soft');__Animals.goScene('music');});await page.waitForTimeout(750);
  for(const id of ['musicpiano','musicdrum','musicxylophone','musictambourine','musicmaracas']){
   await page.evaluate(id=>{__Animals.stopSpeech();AnimalAnims.stopAll();window.__qaAudio=[];const e=[...document.querySelectorAll('.animal[data-id="'+id+'"]')].find(e=>e.tabIndex===0),r=e.getBoundingClientRect();__Animals.camera+=r.left+r.width/2-innerWidth*.5;},id);
   await page.locator('.animal[data-id="'+id+'"][tabindex="0"]').click({force:true});await page.waitForTimeout(2300);
   const sound=await page.evaluate(id=>({state:ChapterSounds.inspect(),audio:window.__qaAudio.filter(a=>a.src.includes('/calls/v4-9/'+id+'.mp3'))}),id);
   check(sound.state.id===id&&sound.state.beats.length===4,id+': no four beats');check(sound.audio.length===4&&sound.audio.every(a=>a.played&&a.resolved&&!a.error),id+': instrument sample playback failed');
   const gaps=sound.state.beats.slice(1).map((b,i)=>b.time-sound.state.beats[i].time);check(gaps.every(g=>Math.abs(g-.68)<.09),id+': uneven rhythm');report.music.push({viewport:vp.width,id,...sound});
  }
  await page.evaluate(()=>{AnimalAnims.stopAll();__Animals.stopSpeech();__Animals.goScene('supermarket');});await page.waitForTimeout(750);
  await page.locator('.shopping-dock').click();
  await page.evaluate(()=>{const e=[...document.querySelectorAll('.animal[data-id="shopmilk"]')].find(e=>e.tabIndex===0),r=e.getBoundingClientRect();__Animals.camera+=r.left+r.width/2-innerWidth*.5;});
  await page.locator('.animal[data-id="shopmilk"][tabindex="0"]').click({force:true});await page.waitForTimeout(3300);
  const count=await page.evaluate(()=>ChapterObjects.basket.length);check(count===1,vp.width+': natural shopping timeline failed');report.basket.push({viewport:vp.width,naturalCount:count});
 }
 const unexpected=report.assets.filter(a=>!a.url.includes('animal-fixes-v4-10.js'));check(unexpected.length===0,'Unexpected missing assets '+JSON.stringify(unexpected));
 report.passed=report.errors.length===0;console.log(JSON.stringify({checks:report.checks.length,music:report.music.length,basket:report.basket,passed:report.passed,errors:report.errors,assets:report.assets},null,2));
}finally{fs.writeFileSync(out+'/validation.json',JSON.stringify(report,null,2));await browser.close();}
if(!report.passed)process.exitCode=1;
