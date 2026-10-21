import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const require=createRequire('C:/Users/XTIA/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/package.json');
const {chromium}=require('playwright');
fs.mkdirSync('screenshots/quadruped-details-v4-6',{recursive:true});
const browser=await chromium.launch({channel:'msedge',headless:true});
try{
 const page=await browser.newPage({viewport:{width:1820,height:1380}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:4173/geo/?details-review=4.6');
 await page.waitForFunction(()=>window.QuadrupedWalk&&window.SpritePuppets);
 if(!await page.evaluate(()=>!!window.QuadrupedDetails))await page.addScriptTag({url:'http://127.0.0.1:4173/geo/assets/quadruped-details.js'});
 const checks=await page.evaluate(async()=>{
  const results=[];window.detailReviews={};
  for(const [id,profile]of Object.entries(QuadrupedWalk.profiles)){
   const img=new Image();img.src=ANIMAL_ANIMATIONS[id].poster;await img.decode();const rig=QuadrupedWalk.prepare(img,id),details=QuadrupedDetails.prepare(rig.body,id),canvas=document.createElement('canvas');canvas.width=rig.w;canvas.height=rig.h;const c=canvas.getContext('2d');c.drawImage(rig.body,0,0);const original=c.getImageData(0,0,rig.w,rig.h).data;
   let endpointChanges=0,endpointPixelError=0,maxAngleStep=0,maxAngle=0;const previous=new Map();
   for(let i=0;i<=240;i++){const p=i/240,state={progress:p,time:p*4.6,distance:0,envelope:QuadrupedWalk.envelope(p),profile};
    for(const [n,part]of details.layers.entries()){const a=QuadrupedDetails.angle(part,state);maxAngle=Math.max(maxAngle,Math.abs(a));if(previous.has(n))maxAngleStep=Math.max(maxAngleStep,Math.abs(a-previous.get(n)));previous.set(n,a);}
    if(i===0||i===240){c.clearRect(0,0,rig.w,rig.h);QuadrupedDetails.draw(c,details,state);const actual=c.getImageData(0,0,rig.w,rig.h).data;for(let q=0;q<actual.length;q++){if(q%4===3)endpointChanges+=actual[q]!==original[q];endpointPixelError+=Math.abs(actual[q]-original[q])/(actual.length*2);}}
   }
   results.push({id,parts:details.layers.map(l=>({type:l.type,mode:l.mode})),endpointChanges,endpointPixelError,maxAngleStep,maxAngle});window.detailReviews[id]={rig,details,img,profile};
  }
  window.paintReview=(id,p,ctx)=>{
   const {rig:r,details,profile}=window.detailReviews[id],state={progress:p,time:p*4.6,distance:2*r.stride/profile.duty/r.h*QuadrupedWalk.advance(p),envelope:QuadrupedWalk.envelope(p),stride:r.stride,profile};
   const body=QuadrupedWalk.torso(profile,state,r.w,r.h),poses=r.layers.map(l=>QuadrupedWalk.pose(profile,l,state,r.w,r.h));
   ctx.save();ctx.translate(0,body.bodyY);
   const part=(bitmap,origin,a,source)=>{ctx.save();ctx.translate(...origin);ctx.rotate(a);ctx.translate(-source[0],-source[1]);ctx.drawImage(bitmap.image,bitmap.x,bitmap.y);ctx.restore();};
   const limb=(l,s)=>{part(l.upper,s.root,s.upper,l.H);part(l.lower,s.knee,s.lower,l.K);part(l.footLayer,s.foot,s.toe,l.F);};
   r.layers.forEach((l,i)=>{if(l.far)limb(l,poses[i]);});ctx.save();ctx.translate(body.cx,body.cy);ctx.rotate(body.pitch);ctx.translate(-body.cx,-body.cy);QuadrupedDetails.draw(ctx,details,state);ctx.restore();r.layers.forEach((l,i)=>{if(!l.far)limb(l,poses[i]);});ctx.restore();
  };
  for(const e of [...document.body.children])e.style.display='none';document.body.style.cssText='margin:0;background:#d3d9c5;display:grid;grid-template-columns:repeat(4,450px);gap:4px;font:16px sans-serif';
  window.showDetails=(ids,p)=>{for(const old of [...document.querySelectorAll('.detail-review')])old.remove();for(const id of ids){const {rig}=window.detailReviews[id],box=document.createElement('div'),c=document.createElement('canvas');box.className='detail-review';c.width=450;c.height=410;const ctx=c.getContext('2d'),scale=Math.min(410/rig.w,345/rig.h);ctx.translate((450-rig.w*scale)/2,25);ctx.scale(scale,scale);window.paintReview(id,p,ctx);box.append(c,document.createTextNode(`${id} · progress ${p}`));document.body.append(box);}};
  return results;
 });
 for(const r of checks){assert.equal(r.endpointChanges,0,r.id+' untouched endpoint silhouette');assert(r.endpointPixelError<.025,r.id+' endpoint color');assert(r.maxAngleStep<.011,r.id+' joint jump');assert(r.maxAngle<.18,r.id+' over-rotation');assert(r.parts.every(p=>!['paw','hoof'].includes(p.type)),r.id+' old stationary leg');}
 assert(checks.find(r=>r.id==='elephant').parts.some(p=>p.type==='trunk'));assert.equal(checks.find(r=>r.id==='cheetah').parts.length,0);
 for(const [group,ids]of Object.entries({savannah:['elephant','elephantcalf','buffalo','rhino','warthog','zebra','tiger','lioness'],farm:['cow','sheep','pig','calf','lamb','piglet','polarbear','arcticfox']})){
  for(const p of [.58,.75,.87]){await page.evaluate(({ids,p})=>window.showDetails(ids,p),{ids,p});await page.screenshot({path:`screenshots/quadruped-details-v4-6/${group}-${p}.png`,fullPage:true});}
 }
 assert.deepEqual(errors,[]);fs.writeFileSync('screenshots/quadruped-details-v4-6/checks.json',JSON.stringify(checks,null,2));console.log(JSON.stringify({checked:checks.length,animated:checks.filter(r=>r.parts.length).length,maxStep:Math.max(...checks.map(r=>r.maxAngleStep)),errors}));
}finally{await browser.close();}
