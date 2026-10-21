import fs from 'node:fs';
import {createRequire} from 'node:module';
const require=createRequire('C:/Users/XTIA/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/package.json');
const {chromium}=require('playwright');
const requested=process.argv.slice(2);
const ids=requested.length?requested:['cheetah','tiger','jaguar','lioness','lioncub'];
const outputName=requested.length?'hoof-actual-cadence':'cats-actual-cadence';
const browser=await chromium.launch({channel:'msedge',headless:true});
const report={method:'Actual wall-clock RAF observation; normal driver unchanged, half driver scales elapsed time; no fake clock or frame-index stepping.',characters:[],errors:[]};
try{
 const page=await browser.newPage({viewport:{width:1800,height:1000}});
 page.on('pageerror',e=>report.errors.push(e.message));
 await page.goto('http://127.0.0.1:4173/geo/?v=4.7-cats-cadence');
 await page.waitForFunction(()=>window.__Animals&&[...document.images].every(i=>i.complete&&i.naturalWidth));
 for(const id of ids)for(const speed of [1,.5]){
  const item=await page.evaluate(async({id,speed})=>{
   __Animals.dismissIntro();__Animals.stopSpeech();AnimalAnims.stopAll();
   const el=[...document.querySelectorAll(`.animal[data-id="${id}"]`)].find(e=>e.tabIndex===0);
   const d=ANIMAL_ANIMATIONS[id];if(!d.cel)return {id,speed,ready:false};
   await el.querySelector('img').decode();await AnimalAnims.preload(id);
   const box=el.getBoundingClientRect();__Animals.camera+=box.left+box.width/2-innerWidth*.58;
   const r=AnimalAnims.play(el,id),start=performance.now(),samples=[];
   const expectedDuration=r.duration/speed;
   if(speed!==1)AnimalAnims.seek(el,0);
   await new Promise(resolve=>{
    function watch(now){
     if(speed!==1&&AnimalAnims.isActing(el))AnimalAnims.seek(el,Math.min(1,(now-start)/expectedDuration));
     const s=AnimalAnims.inspect(el);
     if(s)samples.push({t:now-start,p:s.progress,frame:s.frame,x:s.x,zoom:s.zoom});
     if(!s||(speed!==1&&now-start>=expectedDuration)){if(speed!==1)AnimalAnims.stop(el);resolve();return;}
     requestAnimationFrame(watch);
    }
    requestAnimationFrame(watch);
   });
   const runs=[];for(const s of samples){let last=runs.at(-1);if(!last||last.frame!==s.frame){last={frame:s.frame,start:s.t,end:s.t,count:0};runs.push(last);}last.end=s.t;last.count++;}
   const deltas=samples.slice(1).map((s,i)=>s.t-samples[i].t).sort((a,b)=>a-b);
   return {id,speed,ready:true,expectedFrameCount:d.frames.length,expectedDuration,observedDuration:performance.now()-start,sampleCount:samples.length,framesSeen:[...new Set(samples.map(s=>s.frame))],rafP95:deltas[Math.floor(deltas.length*.95)]||0,rafMax:deltas.at(-1)||0,runs,samples};
  },{id,speed});
  report.characters.push(item);console.log(JSON.stringify({id,speed,ready:item.ready,expectedDuration:item.expectedDuration,observedDuration:item.observedDuration,frames:item.framesSeen,p95:item.rafP95,max:item.rafMax}));
 }
}finally{
 fs.writeFileSync('screenshots/v4-7/'+outputName+'.json',JSON.stringify(report,null,2));
 await browser.close();
}
if(report.errors.length||report.characters.some(x=>!x.ready||x.framesSeen.length!==x.expectedFrameCount||Math.abs(x.observedDuration-x.expectedDuration)>80))process.exitCode=1;
