import fs from 'node:fs';
import {createRequire} from 'node:module';
const require=createRequire('C:/Users/XTIA/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/package.json'),{chromium}=require('playwright');
const dir='geo/assets/animation/v4-11-style/review';
const browser=await chromium.launch({channel:'msedge',headless:true}),report={characters:[],errors:[],requests:[]};
try{
 const page=await browser.newPage({viewport:{width:1800,height:1000}});
 page.on('pageerror',e=>report.errors.push(e.message));
 page.on('response',r=>{if(r.status()>=400)report.requests.push({url:r.url(),status:r.status()});});
 await page.route('**/share/runtime-v4-10/index.html*',async route=>{
  const original=fs.readFileSync('share/runtime-v4-10/index.html','utf8');
  const overlay=fs.readFileSync('geo/assets/animal-styles-v4-11.js','utf8').replaceAll('assets/animation/v4-11-style/','/geo/assets/animation/v4-11-style/');
  await route.fulfill({status:200,contentType:'text/html',body:original.replace('<script src="assets/chapter-motion.js">','<script>'+overlay+'</script><script src="assets/chapter-motion.js">')});
 });
 await page.goto('http://127.0.0.1:4173/share/runtime-v4-10/index.html?scene=savanna');
 await page.waitForFunction(()=>window.__Animals&&[...document.images].every(i=>i.complete&&i.naturalWidth));
 for(const id of ['tiger','gazelle','boa','crocodile']){
  const samples=await page.evaluate(async id=>{
   __Animals.dismissIntro();__Animals.stopSpeech();AnimalAnims.stopAll();
   const e=[...document.querySelectorAll('.animal')].find(e=>e.dataset.id===id&&e.tabIndex===0),d=ANIMAL_ANIMATIONS[id];
   await AnimalAnims.preload(id);const r=e.getBoundingClientRect();__Animals.camera+=r.left+r.width/2-innerWidth*.55;
   const result=AnimalAnims.play(e,id);let frames=[];const start=performance.now();
   await new Promise(resolve=>{function observe(now){const state=AnimalAnims.inspect(e);if(state){frames.push({frame:state.frame,time:now-start,renderer:state.renderer,progress:state.progress});requestAnimationFrame(observe);}else resolve();}requestAnimationFrame(observe);});
   return {id,expectedFrames:d.frames.length,framesSeen:[...new Set(frames.map(s=>s.frame))],duration:result.duration,observed:performance.now()-start,samples:frames};
  },id);
  report.characters.push(samples);
  const count=await page.evaluate(id=>ANIMAL_ANIMATIONS[id].frames.length,id);
  for(let frame=0;frame<count;frame++){
   await page.evaluate(id=>{
    AnimalAnims.stopAll();const e=[...document.querySelectorAll('.animal')].find(e=>e.dataset.id===id&&e.tabIndex===0);AnimalAnims.play(e,id);
   },id);
   await page.waitForFunction(id=>{const e=[...document.querySelectorAll('.animal')].find(e=>e.dataset.id===id&&e.tabIndex===0);return AnimalAnims.inspect(e)?.ready;},id);
   await page.evaluate(({id,frame})=>{
    const e=[...document.querySelectorAll('.animal')].find(e=>e.dataset.id===id&&e.tabIndex===0),d=ANIMAL_ANIMATIONS[id];
    const index=d.cel.sequence.indexOf(frame),elapsed=d.cel.holdsMs.slice(0,index).reduce((a,b)=>a+b,0)+d.cel.holdsMs[index]*.4;
    AnimalAnims.seek(e,elapsed/d.duration);
   },{id,frame});
   await page.screenshot({path:dir+'/'+id+'-actual-'+frame+'.png'});
  }
 }
}finally{await browser.close();fs.writeFileSync(dir+'/runtime.json',JSON.stringify(report,null,2));}
const passed=!report.errors.length&&!report.requests.length&&report.characters.every(c=>c.framesSeen.length===c.expectedFrames&&Math.abs(c.duration-c.observed)<120);
console.log(JSON.stringify({passed,errors:report.errors,requests:report.requests,characters:report.characters.map(({id,expectedFrames,framesSeen,duration,observed})=>({id,expectedFrames,framesSeen,duration,observed}))},null,2));
if(!passed)process.exitCode=1;
