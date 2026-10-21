/* Verify the real clock, input handling and boundary turns in the game. */
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const require=createRequire('C:/Users/XTIA/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/package.json');
const {chromium}=require('playwright');
const browser=await chromium.launch({channel:'msedge',headless:true});
const report={errors:[],characters:[],realClicks:[],unchanged:[]};
const idsRequested=process.argv.slice(2);
try{
 const page=await browser.newPage({viewport:{width:1365,height:768}});
 page.on('pageerror',e=>report.errors.push(e.message));
 await page.goto('http://127.0.0.1:4173/geo/?v=4.7');
 await page.waitForFunction(()=>window.__Animals&&[...document.images].every(i=>i.complete&&i.naturalWidth));
 await page.evaluate(()=>{__Animals.dismissIntro();__Animals.stopSpeech();});
 const ids=await page.evaluate(()=>Object.keys(ANIMAL_ANIMATIONS).filter(id=>ANIMAL_ANIMATIONS[id].cel));
 for(const id of ids.filter(id=>!idsRequested.length||idsRequested.includes(id))){
  const result=await page.evaluate(async id=>{
   const el=[...document.querySelectorAll(`.animal[data-id="${id}"]`)].find(e=>e.tabIndex===0);
   await AnimalAnims.preload(id);AnimalAnims.stopAll();AnimalAnims.play(el,id);
   const samples=[];let retap=false,preserved=false;
   await new Promise(resolve=>{
    const start=performance.now();
    function check(now){
     const s=AnimalAnims.inspect(el);
     if(!s){resolve();return;}
     samples.push({time:now-start,step:s.cel?.step,frame:s.frame,x:s.x,face:s.face,progress:s.progress});
     if(s.progress>.36&&!retap){retap=true;AnimalAnims.play(el,id);const t=AnimalAnims.inspect(el);preserved=t.progress===s.progress&&t.x===s.x&&t.cel.step===s.cel.step;}
     if(now-start>s.duration+500)throw Error(id+': action did not finish');
     requestAnimationFrame(check);
    }requestAnimationFrame(check);
   });
   const transitions=samples.filter((s,i)=>!i||s.step!==samples[i-1].step);
   const forward=samples.every((s,i)=>!i||(s.x-samples[i-1].x)*s.face>=-1e-7);
   const timeMonotonic=samples.every((s,i)=>!i||s.progress>=samples[i-1].progress);
   const exposureOrder=transitions.every((s,i)=>!i||s.step===transitions[i-1].step+1);
   const def=ANIMAL_ANIMATIONS[id];let expected=0,maxClockError=0;
   // Playback starts after the sheet is ready. Compare its real sampled clock
   // with the exposure boundaries, excluding observer/initial paint latency.
   for(const t of transitions){expected=def.cel.holdsMs.slice(0,t.step).reduce((a,b)=>a+b,0);maxClockError=Math.max(maxClockError,Math.abs(t.progress*def.duration-expected));}
   let firstFace,turned=false;const boundary=[];
   for(let n=0;n<8;n++){
    AnimalAnims.play(el,id);await new Promise(requestAnimationFrame);const s=AnimalAnims.inspect(el);
    boundary.push(s.travel*s.face>0);if(firstFace!==undefined&&s.face!==firstFace)turned=true;firstFace=s.face;
    AnimalAnims.seek(el,1);AnimalAnims.stop(el);
   }
   return {id,frames:def.frames.length,duration:def.duration,sampledExposures:transitions.length,expectedExposures:def.cel.sequence.length,retap,preserved,forward,timeMonotonic,exposureOrder,maxClockError,turnsAtBoundary:turned,forwardAfterTurns:boundary.every(Boolean),transitions};
  },id);
  report.characters.push(result);
  assert(result.retap&&result.preserved&&result.forward&&result.timeMonotonic&&result.exposureOrder,id);
  assert(result.turnsAtBoundary&&result.forwardAfterTurns,id);
  assert.equal(result.sampledExposures,result.expectedExposures,id+': missing exposure');
  assert(result.maxClockError<55,id+': clock drift '+result.maxClockError);
 }
 for(const id of ['cheetah','elephant','jaguar']){
  await page.evaluate(id=>{
   AnimalAnims.stopAll();__Animals.stopSpeech();const el=[...document.querySelectorAll(`.animal[data-id="${id}"]`)].find(e=>e.tabIndex===0),r=el.getBoundingClientRect();__Animals.camera+=r.left+r.width/2-innerWidth*.5;
  },id);
  await page.waitForTimeout(80);
  const el=page.locator(`.animal[data-id="${id}"][tabindex="0"]`).first();await el.click();await page.waitForTimeout(300);
  const before=await el.evaluate(e=>AnimalAnims.inspect(e));
  await el.click();const after=await el.evaluate(e=>AnimalAnims.inspect(e));
  assert(before?.renderer==='authored-keyframes'&&after.progress>=before.progress,id+': click/retap');
  report.realClicks.push({id,renderer:before.renderer,before:before.progress,after:after.progress});
 }
 for(const file of ['assets/game-data.js','assets/game.js','assets/game.css','assets/welcome.css','assets/calls-data.js']){
  const same=fs.readFileSync('geo/'+file).equals(fs.readFileSync('share/runtime-v4-6-1/'+file));
  // Portable calls-data intentionally strips unused recordings.
  if(file!=='assets/calls-data.js')assert(same,file+': unrelated change');
  report.unchanged.push({file,same});
 }
 assert.equal(report.errors.length,0);
 console.log(JSON.stringify({characters:report.characters.length,realClicks:report.realClicks,maximumClockError:Math.max(...report.characters.map(c=>c.maxClockError)),errors:report.errors},null,2));
}finally{
 fs.mkdirSync('screenshots/v4-7',{recursive:true});fs.writeFileSync('screenshots/v4-7/playback-checks.json',JSON.stringify(report,null,2));await browser.close();
}
