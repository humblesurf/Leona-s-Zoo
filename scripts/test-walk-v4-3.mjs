import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createRequire} from 'node:module';
const require=createRequire('C:/Users/XTIA/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/package.json'),{chromium}=require('playwright');
fs.mkdirSync('screenshots/v4-3',{recursive:true});
const browser=await chromium.launch({channel:'msedge',headless:true}),errors=[],report={};
try{
 for(const [name,width,height,dpr] of [['desktop',2560,1440,1],['mobile',844,390,2]]){
  const page=await browser.newPage({viewport:{width,height},deviceScaleFactor:dpr});page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:4173/geo/?v=4.3',{timeout:60000});await page.waitForFunction(()=>window.__Animals&&[...document.images].every(i=>i.complete&&i.naturalWidth));await page.evaluate(()=>__Animals.dismissIntro());
  const walks=await page.evaluate(async()=>{
   const rows=[];
   for(const [id,profile] of Object.entries(QuadrupedWalk.profiles)){
    const el=[...document.querySelectorAll(`.animal[data-id="${id}"]`)].find(e=>e.tabIndex===0),img=el.querySelector('img'),rig=QuadrupedWalk.prepare(img,id);
    let maxReach=0,maxSlip=0,maxJointStep=0,swingLift=0;
    const last=new Map();
    // Sample a full stride with constant speed, when all four feet have settled.
    for(let i=0;i<=600;i++){
     const distance=i/600*profile.stride/profile.duty;
     for(const l of rig.layers){
      const p=QuadrupedWalk.pose(profile,l,{distance,envelope:1},rig.w,rig.h),worldX=p.foot[0]+profile.face*distance*rig.h,groundY=p.foot[1]+p.drop;
      maxReach=Math.max(maxReach,p.reachError/rig.h);if(!p.stance)swingLift=Math.max(swingLift,(l.F[1]-groundY)/rig.h);
      const prev=last.get(l.name);if(prev&&prev.stance&&p.stance&&Math.abs(p.phase-prev.phase)<.1)maxSlip=Math.max(maxSlip,Math.abs(worldX-prev.worldX)/rig.h,Math.abs(groundY-prev.groundY)/rig.h);
      if(prev){const diff=(a,b)=>Math.abs(Math.atan2(Math.sin(a-b),Math.cos(a-b)));maxJointStep=Math.max(maxJointStep,diff(p.upper,prev.upper),diff(p.lower,prev.lower));}last.set(l.name,{...p,worldX,groundY});
     }
    }
    AnimalAnims.play(el,id);await new Promise(requestAnimationFrame);AnimalAnims.seek(el,.48);const before=AnimalAnims.inspect(el),canvas=el.querySelector('canvas'),pixels=canvas.getContext('2d').getImageData(0,0,canvas.width,canvas.height).data;
    AnimalAnims.play(el,id);const after=AnimalAnims.inspect(el),pixels2=canvas.getContext('2d').getImageData(0,0,canvas.width,canvas.height).data;
    let retapDiff=0;for(let i=0;i<pixels.length;i++)retapDiff=Math.max(retapDiff,Math.abs(pixels[i]-pixels2[i]));
    if(before.travel*before.face<=0||before.renderer!=='continuous-ik-walk'||retapDiff>1||canvas!==el.querySelector('canvas')||before.progress!==after.progress)throw Error(id+' movement or retap '+JSON.stringify({before,after,retapDiff}));
    const gaitMoves=new Set();for(const p of [.2,.35,.5,.65,.8]){AnimalAnims.seek(el,p);const state=AnimalAnims.inspect(el);gaitMoves.add(JSON.stringify(state.gait.map(l=>l.foot)));}
    let edgePixels=0;for(let y=0;y<canvas.height;y++)for(const x of [0,1,canvas.width-2,canvas.width-1])if(pixels[(y*canvas.width+x)*4+3]>5)edgePixels++;for(let x=0;x<canvas.width;x++)for(const y of [0,1,canvas.height-2,canvas.height-1])if(pixels[(y*canvas.width+x)*4+3]>5)edgePixels++;
    AnimalAnims.seek(el,1);AnimalAnims.stop(el);
    rows.push({id,forward:true,poses:gaitMoves.size,retapPixelDifference:retapDiff,edgePixels,maxReach,maxSlip,maxJointStep,swingLift});
   }return rows;
  });
  const timing=await page.evaluate(async()=>{for(const id of ['zebra','buffalo','elephant'])AnimalAnims.play([...document.querySelectorAll(`.animal[data-id="${id}"]`)].find(e=>e.tabIndex===0),id);const stamps=[];await new Promise(resolve=>{const start=performance.now();function sample(t){stamps.push(t);if(t-start<1600)requestAnimationFrame(sample);else resolve();}requestAnimationFrame(sample);});AnimalAnims.stopAll();const ms=stamps.slice(1).map((t,i)=>t-stamps[i]).sort((a,b)=>a-b);return {actors:3,frames:stamps.length,medianMs:ms[Math.floor(ms.length*.5)],p95Ms:ms[Math.floor(ms.length*.95)]};});
  const reduced=await page.emulateMedia({reducedMotion:'reduce'}).then(()=>page.evaluate(async()=>{const el=[...document.querySelectorAll('.animal[data-id="zebra"]')].find(e=>e.tabIndex===0);AnimalAnims.play(el);await new Promise(requestAnimationFrame);const state=AnimalAnims.inspect(el);AnimalAnims.stop(el);return {travel:state.travel,zoom:state.zoom,envelope:state.walkState.envelope};}));await page.emulateMedia({reducedMotion:'no-preference'});
  await page.evaluate(()=>{__Animals.goScene('savanna');__Animals.stopSpeech();});await page.waitForTimeout(750);await page.screenshot({path:`screenshots/v4-3/${name}-savanna.jpg`,quality:95});
  report[name]={walks,timing,reduced};await page.close();
 }
 report.errors=errors;fs.writeFileSync('screenshots/v4-3/walk-tests.json',JSON.stringify(report,null,2));
 assert.deepEqual(errors,[]);for(const [name,data] of Object.entries(report)){if(name==='errors')continue;assert.equal(data.walks.length,19);for(const w of data.walks){assert.equal(w.poses,5);assert.equal(w.edgePixels,0,w.id+' cropped');assert(w.maxReach<.005,w.id+' unreachable foot');assert(w.maxSlip<.001,w.id+' slides in stance');assert(w.maxJointStep<.08,w.id+' discontinuous knee');assert(w.swingLift>.015,w.id+' does not lift feet');}assert(data.timing.medianMs<35);assert.equal(Math.abs(data.reduced.travel),0);assert.equal(data.reduced.zoom,1);assert.equal(data.reduced.envelope,0);}
 console.log(Object.fromEntries(Object.entries(report).filter(([k])=>k!=='errors').map(([k,v])=>[k,{walkers:v.walks.length,timing:v.timing,maxReach:Math.max(...v.walks.map(w=>w.maxReach)),maxSlip:Math.max(...v.walks.map(w=>w.maxSlip))}])));
}finally{await browser.close();}
