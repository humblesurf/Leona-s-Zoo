import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const require=createRequire('C:/Users/XTIA/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/package.json');
const {chromium}=require('playwright');
const browser=await chromium.launch({channel:'msedge',headless:true});
const report={samples:64,description:'Actual alpha coverage of each far leg/paw after all later far legs, torso and near legs occlude it. Same source dimensions; each version uses its actual gait.',versions:[]};
try{
 for(const [version,url]of [['V4.5','http://127.0.0.1:4173/share/runtime-v4-5/index.html'],['V4.6','http://127.0.0.1:4173/geo/?v=4.6']]){
  const page=await browser.newPage({viewport:{width:1400,height:900}});
  await page.goto(url);await page.waitForFunction(()=>window.__Animals&&[...document.images].every(i=>i.complete&&i.naturalWidth));
  const animals=await page.evaluate(samples=>{
   const Q=QuadrupedWalk,summary=[];
   const stats=values=>{const sorted=values.slice().sort((a,b)=>a-b);return {min:sorted[0],p10:sorted[Math.floor(sorted.length*.1)],mean:values.reduce((a,b)=>a+b,0)/values.length,visibleFrames:values.filter(v=>v>=.05).length,fullyHiddenFrames:values.filter(v=>v<.001).length};};
   for(const [id,profile]of Object.entries(Q.profiles)){
    const img=[...document.querySelectorAll(`.animal[data-id="${id}"] img`)].find(i=>i.naturalWidth),r=Q.prepare(img,id),canvas=document.createElement('canvas');canvas.width=r.w;canvas.height=r.h;
    const ctx=canvas.getContext('2d',{willReadFrequently:true}),far=r.layers.filter(l=>l.far),ratios=Object.fromEntries(far.map(l=>[l.name,{leg:[],paw:[],pawVisibleArea:[],legVisibleArea:[]}]));
    const part=(bitmap,origin,angle,source)=>{ctx.save();ctx.translate(...origin);ctx.rotate(angle);ctx.translate(-source[0],-source[1]);ctx.drawImage(bitmap.image,bitmap.x,bitmap.y);ctx.restore();};
    const limb=(l,p)=>{part(l.upper,p.root,p.upper,l.H);part(l.lower,p.knee,p.lower,l.K);part(l.footLayer,p.foot,p.toe,l.F);};
    const area=()=>{const pixels=ctx.getImageData(0,0,r.w,r.h).data;let alpha=0;for(let i=3;i<pixels.length;i+=4)alpha+=pixels[i]/255;return alpha;};
    for(let sample=0;sample<samples;sample++){
     const state={envelope:1,distance:sample/samples*r.stride/profile.duty/r.h,stride:r.stride,progress:.75,time:3.5},body=Q.torso(profile,state,r.w,r.h),poses=r.layers.map(l=>Q.pose(profile,l,state,r.w,r.h));
     const drawTorso=()=>{ctx.save();ctx.translate(body.cx,body.cy);ctx.rotate(body.pitch);ctx.translate(-body.cx,-body.cy);if(r.details)QuadrupedDetails.draw(ctx,r.details,state);else ctx.drawImage(r.body,0,0);ctx.restore();};
     for(const target of far){
      const index=r.layers.indexOf(target),pose=poses[index];
      for(const kind of ['leg','paw']){
       ctx.clearRect(0,0,r.w,r.h);ctx.save();ctx.translate(0,body.bodyY);
       if(kind==='leg')limb(target,pose);else part(target.footLayer,pose.foot,pose.toe,target.F);
       const original=area();
       // Each successive painted surface removes only its opaque coverage.
       ctx.globalCompositeOperation='destination-out';
       r.layers.forEach((l,i)=>{if(l.far&&i>index)limb(l,poses[i]);});
       drawTorso();r.layers.forEach((l,i)=>{if(!l.far)limb(l,poses[i]);});
       const visible=area();ctx.restore();
       ratios[target.name][kind].push(original?visible/original:0);ratios[target.name][kind+'VisibleArea'].push(visible);
      }
     }
    }
    summary.push({id,size:[r.w,r.h],gait:profile.gait,stride:r.stride,runSettings:{duty:profile.duty,lift:profile.lift,cadence:profile.cadence,minMs:profile.minMs,bob:profile.bob,pitch:profile.pitch,flight:profile.flight,phases:profile.legs.map(l=>[l.name,l.phase])},feet:far.map(l=>({name:l.name,root:l.root.map((v,i)=>v/(i?r.h:r.w)),leg:stats(ratios[l.name].leg),paw:stats(ratios[l.name].paw),meanVisiblePawPixels:ratios[l.name].pawVisibleArea.reduce((a,b)=>a+b,0)/samples,meanVisibleLegPixels:ratios[l.name].legVisibleArea.reduce((a,b)=>a+b,0)/samples}))});
   }
   return summary;
  },report.samples);
  report.versions.push({version,url,animals});await page.close();
 }
 const before=report.versions[0].animals.find(a=>a.id==='cheetah'),after=report.versions[1].animals.find(a=>a.id==='cheetah');
 assert.equal(after.stride,before.stride,'accepted cheetah stride');assert.deepEqual(after.runSettings,before.runSettings,'accepted cheetah rhythm');
 for(const animal of report.versions[1].animals)for(const foot of animal.feet){
  assert(foot.paw.visibleFrames>=report.samples*.9,`${animal.id} ${foot.name}: too often hidden`);
  assert(foot.leg.mean>=.2,`${animal.id} ${foot.name}: almost entirely obscured`);
 }
 // A side view may overlap limbs briefly, but each far paw must be clearly
 // present throughout most of the cycle and materially better than V4.5.
 for(const foot of after.feet){const old=before.feet.find(l=>l.name===foot.name);assert(foot.paw.visibleFrames>=report.samples*.9,`${foot.name}: too often hidden`);assert(foot.paw.mean>old.paw.mean*1.25,`${foot.name}: insufficient visible paw improvement`);}
 fs.mkdirSync('screenshots/v4-6',{recursive:true});fs.writeFileSync('screenshots/v4-6/leg-visibility-comparison.json',JSON.stringify(report,null,2));
 console.log(JSON.stringify({pass:true,samples:report.samples,cheetah:{before,after}},null,2));
}finally{await browser.close();}
