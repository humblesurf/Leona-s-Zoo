import fs from 'node:fs';import path from 'node:path';import{createRequire}from'node:module';
const require=createRequire('C:/Users/XTIA/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/package.json'),{chromium}=require('playwright');
const out=path.resolve('screenshots/v4-11/ocean-music-market'),browser=await chromium.launch({channel:'msedge',headless:true}),report=[];
try{
 for(const viewport of [{width:1920,height:1080},{width:844,height:390}]){
  const page=await browser.newPage({viewport});await page.goto(process.env.QA_URL||'http://127.0.0.1:4173/geo/?scene=music&v=4.11-placement-final');await page.waitForFunction(()=>window.__Animals&&window.ChapterObjects);await page.evaluate(()=>__Animals.dismissIntro());
  for(const id of viewport.width===1920?['musicharp']:['musicharp','musicguitar']){
   await page.evaluate(id=>{AnimalAnims.stopAll();__Animals.stopSpeech();const e=[...document.querySelectorAll(`.animal[data-id="${id}"]`)].find(e=>e.tabIndex===0),r=e.getBoundingClientRect();__Animals.camera+=r.left+r.width/2-innerWidth/2;},id);await page.waitForTimeout(70);const el=page.locator(`.animal[data-id="${id}"][tabindex="0"]`).first();await el.click({force:true});await page.waitForTimeout(100);await el.evaluate(e=>AnimalAnims.seek(e,.45));
   const d=await el.evaluate(e=>({strings:CHAPTER_OBJECTS[e.dataset.id].stringLines,mask:getComputedStyle(e.closest('.panel').querySelector('.bg')).maskImage}));if(id==='musicharp'&&d.strings.at(-1)[3]!==.41)throw Error('Latest harp ends not yet integrated');const screenshot=path.join(out,`${viewport.width}-${id}-placement-${process.env.QA_URL?'runtime-':''}final.png`);await page.screenshot({path:screenshot});report.push({viewport,id,...d,screenshot});
  }await page.close();
 }
}finally{await browser.close();fs.writeFileSync(path.join(out,'placement-final-report.json'),JSON.stringify(report,null,2));}
console.log(JSON.stringify({passed:true,checks:report.length},null,2));
