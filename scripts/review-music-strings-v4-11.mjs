import fs from 'node:fs';import path from 'node:path';import{createRequire}from'node:module';
const require=createRequire('C:/Users/XTIA/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/package.json'),{chromium}=require('playwright');
const out=path.resolve('screenshots/v4-11/ocean-music-market'),report={errors:[],checks:[]};fs.mkdirSync(out,{recursive:true});
const browser=await chromium.launch({channel:'msedge',headless:true});
try{
 for(const viewport of [{width:1920,height:1080},{width:844,height:390}]){
  const page=await browser.newPage({viewport});page.on('pageerror',e=>report.errors.push(e.message));
  await page.addInitScript(()=>{window.__qaSound=[];const play=HTMLMediaElement.prototype.play;HTMLMediaElement.prototype.play=function(...args){const row={src:this.currentSrc||this.src,rate:this.playbackRate,volume:this.volume};window.__qaSound.push(row);this.addEventListener('playing',()=>row.played=true,{once:true});return play.apply(this,args).then(()=>row.resolved=true).catch(e=>row.error=e.message);};});
  await page.goto('http://127.0.0.1:4173/geo/?scene=music&v=4.11-final-strings');await page.waitForFunction(()=>window.__Animals&&window.ChapterObjects);await page.evaluate(()=>{__Animals.dismissIntro();ChapterObjects.setMusic('slow','soft');});
  for(const id of ['musicguitar','musicharp']){
   await page.evaluate(id=>{AnimalAnims.stopAll();__Animals.stopSpeech();window.__qaSound=[];const e=[...document.querySelectorAll(`.animal[data-id="${id}"]`)].find(e=>e.tabIndex===0),r=e.getBoundingClientRect();__Animals.camera+=r.left+r.width/2-innerWidth/2;},id);await page.waitForTimeout(75);
   const el=page.locator(`.animal[data-id="${id}"][tabindex="0"]`).first();await el.click({force:true});await page.waitForTimeout(450);await el.evaluate(e=>AnimalAnims.seek(e,.45));
   const state=await el.evaluate(e=>({state:AnimalAnims.inspect(e),lines:CHAPTER_OBJECTS[e.dataset.id].stringLines,paths:[...e.querySelectorAll('.music-string-animation path')].map(p=>p.getAttribute('d'))}));
   const x0=state.lines[0][0];if(id==='musicguitar'&&x0<.64)report.errors.push('Old guitar offset still loaded');if(id==='musicharp'&&state.lines[0][1]>.10)report.errors.push('Old harp string neck position still loaded');
   const screenshot=path.join(out,`${viewport.width}-${id}-strings-final.png`);await page.screenshot({path:screenshot});
   await page.waitForTimeout(2900);
   const sound=await page.evaluate(id=>({beats:ChapterSounds.inspect(),audio:__qaSound.filter(a=>a.src.includes('/music/audio/'+id+'.mp3'))}),id);
   if(sound.audio.length!==4||sound.audio.some(a=>!a.played||!a.resolved||a.error))report.errors.push(`${viewport.width} ${id}: real note playback failed ${JSON.stringify(sound.audio)}`);
   const rates=sound.audio.map(a=>a.rate);if(rates.some((r,i)=>Math.abs(r-[1,1.259921,1.498307,2][i])>.001))report.errors.push(`${id}: arpeggio pitch rates failed`);
   report.checks.push({viewport,id,...state,...sound,screenshot});
  }
  await page.close();
 }
}finally{await browser.close();report.passed=!report.errors.length;fs.writeFileSync(path.join(out,'strings-final-report.json'),JSON.stringify(report,null,2));}
console.log(JSON.stringify({passed:report.passed,errors:report.errors,checks:report.checks.length},null,2));if(!report.passed)process.exitCode=1;
