import fs from 'node:fs';import assert from 'node:assert/strict';import {createRequire} from 'node:module';
const require=createRequire('C:/Users/XTIA/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/package.json'),{chromium}=require('playwright');
fs.mkdirSync('screenshots/v4-4',{recursive:true});const browser=await chromium.launch({channel:'msedge',headless:true}),page=await browser.newPage({viewport:{width:1180,height:820}}),errors=[];
page.on('pageerror',e=>errors.push(e.message));
try{
 await page.goto('http://127.0.0.1:4173/geo/?v=4.4');await page.waitForFunction(()=>window.__Animals&&[...document.images].every(i=>i.complete&&i.naturalWidth));await page.evaluate(()=>__Animals.dismissIntro());
 const results=await page.evaluate(async()=>{
  const rows=[];
  for(const [id,profile]of Object.entries(QuadrupedWalk.profiles)){
   const el=[...document.querySelectorAll(`.animal[data-id="${id}"]`)].find(e=>e.tabIndex===0),img=el.querySelector('img'),rig=QuadrupedWalk.prepare(img,id),last=new Map(),ranges=new Map();let reach=0,slip=0,jointStep=0,footStep=0;
   for(let i=0;i<=800;i++){
    const distance=i/800*rig.stride/profile.duty/rig.h;
    for(const l of rig.layers){const p=QuadrupedWalk.pose(profile,l,{envelope:1,distance,stride:rig.stride},rig.w,rig.h),worldX=p.foot[0]+profile.face*distance*rig.h,worldY=p.foot[1]+p.drop,prev=last.get(l.name),range=ranges.get(l.name)||[Infinity,-Infinity];range[0]=Math.min(range[0],p.foot[0]-p.root[0]);range[1]=Math.max(range[1],p.foot[0]-p.root[0]);ranges.set(l.name,range);reach=Math.max(reach,p.reachError/rig.h);if(prev){const angle=(a,b)=>Math.abs(Math.atan2(Math.sin(a-b),Math.cos(a-b)));jointStep=Math.max(jointStep,angle(p.upper,prev.upper),angle(p.lower,prev.lower),angle(p.toe,prev.toe));footStep=Math.max(footStep,Math.hypot(p.foot[0]-prev.foot[0],p.foot[1]-prev.foot[1])/rig.h);if(p.stance&&prev.stance&&Math.abs(p.phase-prev.phase)<.01)slip=Math.max(slip,Math.abs(worldX-prev.worldX)/rig.h,Math.abs(worldY-prev.worldY)/rig.h);}last.set(l.name,{...p,worldX,worldY});}
   }
   // Include the eased start/stop, not just the repeating steady-state loop.
   let transitionStep=0;for(const offset of [0,.41]){const previous=new Map();for(let i=0;i<=600;i++){const p=i/600,state={envelope:QuadrupedWalk.envelope(p),distance:offset+QuadrupedWalk.advance(p)*rig.stride/profile.duty*profile.cycles/rig.h,stride:rig.stride};for(const l of rig.layers){const current=QuadrupedWalk.pose(profile,l,state,rig.w,rig.h),before=previous.get(l.name);if(before)transitionStep=Math.max(transitionStep,Math.hypot(current.foot[0]-before.foot[0],current.foot[1]-before.foot[1])/rig.h);previous.set(l.name,current);}}}
   AnimalAnims.play(el,id);await new Promise(requestAnimationFrame);const state=AnimalAnims.inspect(el),frames=[];
   for(const p of [0,.05,.16,.3,.45,.6,.75,.82,.95,1]){AnimalAnims.seek(el,p);const s=AnimalAnims.inspect(el),c=el.querySelector('canvas'),px=c.getContext('2d').getImageData(0,0,c.width,c.height).data;let edge=0;for(let x=0;x<c.width;x++)for(const y of [0,c.height-1])edge+=px[(y*c.width+x)*4+3]>4;for(let y=0;y<c.height;y++)for(const x of [0,c.width-1])edge+=px[(y*c.width+x)*4+3]>4;frames.push({p,x:s.x,zoom:s.zoom,edge});}
   AnimalAnims.seek(el,.45);const previous=AnimalAnims.inspect(el);AnimalAnims.play(el,id);const retap=AnimalAnims.inspect(el).progress===previous.progress;AnimalAnims.stop(el);
   rows.push({id,stride:rig.stride/rig.h,reach,slip,jointStep,footStep,transitionStep,passesUnderBody:[...ranges.values()].every(([min,max])=>min<-.015*rig.h&&max>.015*rig.h),retap,forward:state.travel*state.face>0,frames});
  }return rows;
 });
 fs.writeFileSync('screenshots/v4-4/kinematic-review.json',JSON.stringify({results,errors},null,2));console.log(results.map(({id,stride,reach,slip,jointStep,passesUnderBody})=>({id,stride,reach,slip,jointStep,passesUnderBody})));
 assert.deepEqual(errors,[]);for(const r of results){assert(r.forward&&r.retap&&r.passesUnderBody,r.id);assert(r.reach<.005,r.id+' unreachable');assert(r.slip<.001,r.id+' slide');assert(r.jointStep<.06,r.id+' angular discontinuity');assert(r.footStep<.006,r.id+' position discontinuity');assert(r.transitionStep<.02,r.id+' start/stop discontinuity');assert(r.frames.every(f=>!f.edge),r.id+' cropped');}
}finally{await browser.close();}
