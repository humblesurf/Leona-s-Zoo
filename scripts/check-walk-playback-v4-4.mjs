import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const require=createRequire('C:/Users/XTIA/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/package.json');
const {chromium}=require('playwright');
const browser=await chromium.launch({channel:'msedge',headless:true}),report={errors:[],viewports:[]};
try{
 for(const [width,height,dpr]of [[2560,1440,1],[844,390,2]]){
  const page=await browser.newPage({viewport:{width,height},deviceScaleFactor:dpr});page.on('pageerror',e=>report.errors.push(e.message));
  await page.goto('http://127.0.0.1:4173/geo/?v=4.4');await page.waitForFunction(()=>window.__Animals&&[...document.images].every(i=>i.complete&&i.naturalWidth));
  const result=await page.evaluate(async()=>{
   __Animals.dismissIntro();const ids=Object.keys(QuadrupedWalk.profiles),bounds=[],prepareMs=[];
   for(const id of ids){
    const el=[...document.querySelectorAll(`.animal[data-id="${id}"]`)].find(e=>e.tabIndex===0);
    const start=performance.now();AnimalAnims.play(el,id);prepareMs.push({id,ms:performance.now()-start});await new Promise(requestAnimationFrame);
    for(const p of [0,.08,.16,.48,.82,.91,1]){
     AnimalAnims.seek(el,p);const c=el.querySelector('canvas'),a=c.getContext('2d').getImageData(0,0,c.width,c.height).data;let edge=0;
     for(let x=0;x<c.width;x++)for(const y of [0,1,c.height-2,c.height-1])edge+=a[(y*c.width+x)*4+3]>5;
     for(let y=0;y<c.height;y++)for(const x of [0,1,c.width-2,c.width-1])edge+=a[(y*c.width+x)*4+3]>5;
     bounds.push({id,p,edge});
    }
    AnimalAnims.stop(el);
   }
   // Run the actual RAF clock through start, steady walk, and finish.
   const actors=['zebra','buffalo','elephant'].map(id=>[...document.querySelectorAll(`.animal[data-id="${id}"]`)].find(e=>e.tabIndex===0));
   const r=actors[0].getBoundingClientRect();__Animals.camera+=r.left+r.width/2-innerWidth*.5;
   for(const el of actors)AnimalAnims.play(el);
   const stamps=[],poses=[];
   await new Promise(resolve=>{const start=performance.now();function frame(t){stamps.push(t);const s=AnimalAnims.inspect(actors[0]);if(s)poses.push({p:s.progress,x:s.x,phase:s.gait[0].phase});if(t-start<6300)requestAnimationFrame(frame);else resolve();}requestAnimationFrame(frame);});
   const gaps=stamps.slice(1).map((t,i)=>t-stamps[i]).sort((a,b)=>a-b);
   return {bounds,prepareMs,playback:{samples:stamps.length,medianMs:gaps[Math.floor(gaps.length*.5)],p95Ms:gaps[Math.floor(gaps.length*.95)],maxMs:gaps.at(-1),completed:actors.every(el=>!AnimalAnims.isActing(el)),first:poses[0],last:poses.at(-1)}};
  });
  assert(result.bounds.every(r=>r.edge===0));assert(result.playback.completed);assert(result.playback.samples>100);assert(result.playback.p95Ms<40);
  await page.screenshot({path:`screenshots/v4-4/scene-${width}.jpg`,quality:92});report.viewports.push({width,height,dpr,...result});await page.close();
 }
 const page=await browser.newPage({viewport:{width:1440,height:900}});page.on('pageerror',e=>report.errors.push(e.message));
 await page.goto('http://127.0.0.1:4173/geo/walk-review.html');await page.waitForFunction(()=>!document.querySelector('#replay').disabled);
 await page.waitForTimeout(1100);const game=page.frames().find(f=>f.url().includes('/geo/?'));
 assert(await game.evaluate(()=>[...document.querySelectorAll('.animal')].some(el=>AnimalAnims.isActing(el))));
 await page.selectOption('#animal','tiger');await page.waitForTimeout(1300);await page.screenshot({path:'screenshots/v4-4/review-tiger.jpg',quality:95});
 await page.selectOption('#speed','0.5');await page.waitForTimeout(500);
 report.preview=await game.evaluate(()=>{const el=[...document.querySelectorAll('.animal[data-id="tiger"]')].find(e=>AnimalAnims.isActing(e));return AnimalAnims.inspect(el);});assert(report.preview?.progress>0&&report.preview.progress<.3);
 await page.close();assert.deepEqual(report.errors,[]);fs.writeFileSync('screenshots/v4-4/playback-review.json',JSON.stringify(report,null,2));console.log(report.viewports.map(v=>({size:[v.width,v.height],coldPrepareMax:Math.max(...v.prepareMs.map(p=>p.ms)),...v.playback})));console.log({preview:true,errors:report.errors});
}finally{await browser.close();}
