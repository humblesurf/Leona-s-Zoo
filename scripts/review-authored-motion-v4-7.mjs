import fs from 'node:fs';import assert from 'node:assert/strict';import {createRequire} from 'node:module';
const require=createRequire('C:/Users/XTIA/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/package.json');
const {chromium}=require('playwright');
const out='screenshots/v4-7';fs.mkdirSync(out+'/runtime-poses',{recursive:true});
const browser=await chromium.launch({channel:'msedge',headless:true});
const report={errors:[],characters:[],preservedNonQuadrupeds:[],viewports:[]};
const requested=process.argv.slice(2);
try{
 const page=await browser.newPage({viewport:{width:1800,height:1000}});page.on('pageerror',e=>report.errors.push(e.message));
 await page.goto('http://127.0.0.1:4173/geo/?v=4.7');await page.waitForFunction(()=>window.__Animals&&[...document.images].every(i=>i.complete&&i.naturalWidth));
 const ids=await page.evaluate(()=>Object.keys(ANIMAL_ANIMATIONS).filter(id=>ANIMAL_ANIMATIONS[id].cel));
 for(const id of ids.filter(id=>!requested.length||requested.includes(id))){
  const result=await page.evaluate(async id=>{
   __Animals.dismissIntro();__Animals.stopSpeech();AnimalAnims.stopAll();
   const el=[...document.querySelectorAll(`.animal[data-id="${id}"]`)].find(e=>e.tabIndex===0);
   const def=ANIMAL_ANIMATIONS[id],img=el.querySelector('img');await img.decode();await AnimalAnims.preload(id);
   const r=AnimalAnims.play(el,id);await new Promise(requestAnimationFrame);AnimalAnims.seek(el,0);
   const first=AnimalAnims.inspect(el),repeated=AnimalAnims.play(el,id)===r;
   const poses=document.createElement('canvas');poses.width=r.cssW*4;poses.height=r.cssH*2;
   const c=poses.getContext('2d');c.fillStyle='#e9e3d5';c.fillRect(0,0,poses.width,poses.height);
   const boundaryChecks=[],displacements=[],used=new Set();let elapsed=0,lastX=r.start;
   for(let step=0;step<r.cel.sequence.length;step++){
    const time=elapsed+r.cel.holds[step]/2;AnimalAnims.seek(el,time/r.duration);const s=AnimalAnims.inspect(el);
    const expected=r.cel.sequence[step];boundaryChecks.push(s.frame===expected&&s.renderer==='authored-keyframes'&&!s.gait&&!s.joints);
    displacements.push((s.x-lastX)*s.face>=-1e-8);lastX=s.x;
    // Inspect each drawing at the same 1.1 zoom in the second moving cycle.
    // Including the preparation image would falsely make frame zero smaller.
    if(step>=def.frames.length+1&&s.cel.stage==='move'&&!used.has(expected)&&used.size<8){const slot=used.size;used.add(expected);c.drawImage(r.canvas,slot%4*r.cssW,Math.floor(slot/4)*r.cssH,r.cssW,r.cssH);}
    elapsed+=r.cel.holds[step];
   }
   AnimalAnims.seek(el,.5);const mid=AnimalAnims.inspect(el),before=AnimalAnims.inspect(el);AnimalAnims.play(el,id);const after=AnimalAnims.inspect(el);
   const repeatMaintained=before.progress===after.progress&&before.x===after.x;
   let edge=0;const rgba=r.ctx.getImageData(0,0,r.canvas.width,r.canvas.height).data;
   for(let y=0;y<r.canvas.height;y++)for(let x=0;x<r.canvas.width;x++)if((x<2||y<2||x>=r.canvas.width-2||y>=r.canvas.height-2)&&rgba[(y*r.canvas.width+x)*4+3]>100)edge++;
   AnimalAnims.seek(el,1);const end=AnimalAnims.inspect(el);
   const posterCanvas=document.createElement('canvas');posterCanvas.width=def.viewport.w;posterCanvas.height=def.viewport.h;const pc=posterCanvas.getContext('2d');pc.drawImage(img,0,0);const poster=pc.getImageData(0,0,posterCanvas.width,posterCanvas.height).data;
   const sheetCanvas=document.createElement('canvas');sheetCanvas.width=def.viewport.w;sheetCanvas.height=def.viewport.h;const sc=sheetCanvas.getContext('2d'),f=def.frames[def.cel.restFrame];sc.drawImage(r.sheet,f.x,f.y,f.w,f.h,0,0,f.w,f.h);const rest=sc.getImageData(0,0,sheetCanvas.width,sheetCanvas.height).data;
   let posterDifferences=0,posterAlphaDifferences=0,posterMaxVisibleDifference=0;
   for(let i=0;i<rest.length;i+=4){if(rest[i+3]!==poster[i+3])posterAlphaDifferences++;for(let k=0;k<3;k++){if(rest[i+k]!==poster[i+k])posterDifferences++;posterMaxVisibleDifference=Math.max(posterMaxVisibleDifference,Math.abs(rest[i+k]*rest[i+3]-poster[i+k]*poster[i+3])/255);}}
   const checks={renderer:first.renderer,frameCount:def.frames.length,exposures:r.cel.sequence.length,duration:r.duration,totalHolds:r.cel.holds.reduce((a,b)=>a+b,0),allExposureBoundaries:boundaryChecks.every(Boolean),forwardAtAllSteps:displacements.every(Boolean),repeated,repeatMaintained,zoomAtMid:mid.zoom,edgeAlphaPixels:edge,restFrameMatches:end.frame===def.cel.restFrame,posterDifferences,posterAlphaDifferences,posterMaxVisibleDifference,finalAdvance:end.cel.effectiveAdvance,sourceSize:[img.naturalWidth,img.naturalHeight]};
   AnimalAnims.stop(el);return {id,...checks,poses:poses.toDataURL('image/png')};
  },id);
  const {poses,...checks}=result;fs.writeFileSync(`${out}/runtime-poses/${id}.png`,Buffer.from(poses.split(',')[1],'base64'));report.characters.push(checks);
  // Separate lossless WebP encodes and browser premultiplication each round
  // low-alpha RGB by one level; geometry/alpha must still match exactly.
  assert.equal(checks.renderer,'authored-keyframes',id);assert.equal(checks.duration,checks.totalHolds,id);assert(checks.allExposureBoundaries&&checks.forwardAtAllSteps&&checks.repeated&&checks.repeatMaintained,id);assert.equal(checks.edgeAlphaPixels,0,id);assert.equal(checks.zoomAtMid,1.1,id);assert(checks.restFrameMatches,id);assert.equal(checks.posterAlphaDifferences,0,id);assert(checks.posterMaxVisibleDifference<=2.01,id+': visible mismatch between rest drawing and poster');assert.equal(checks.finalAdvance,1,id);
 }
 for(const id of ['dolphin','monkey','turtle','giraffe']){
  const item=await page.evaluate(async id=>{const el=[...document.querySelectorAll(`.animal[data-id="${id}"]`)].find(e=>e.tabIndex===0);await el.querySelector('img').decode();const r=AnimalAnims.play(el,id);await new Promise(requestAnimationFrame);AnimalAnims.seek(el,.5);const s=AnimalAnims.inspect(el);AnimalAnims.stop(el);return {id,renderer:s.renderer};},id);report.preservedNonQuadrupeds.push(item);assert.notEqual(item.renderer,'authored-keyframes',id);
 }
 for(const viewport of [{width:2560,height:1440},{width:844,height:390}]){
  await page.setViewportSize(viewport);await page.waitForTimeout(100);report.viewports.push(await page.evaluate(()=>({width:innerWidth,height:innerHeight,scrollWidth:document.documentElement.scrollWidth})));await page.screenshot({path:`${out}/game-${viewport.width}.png`});
 }
 const reduced=await browser.newPage({viewport:{width:844,height:390},reducedMotion:'reduce'});await reduced.goto('http://127.0.0.1:4173/geo/?v=4.7');await reduced.waitForFunction(()=>window.__Animals&&[...document.images].every(i=>i.complete&&i.naturalWidth));
 report.reduced=await reduced.evaluate(async()=>{const id=Object.keys(ANIMAL_ANIMATIONS).find(id=>ANIMAL_ANIMATIONS[id].cel),el=document.querySelector(`.animal[data-id="${id}"]`);await AnimalAnims.preload(id);AnimalAnims.play(el,id);await new Promise(requestAnimationFrame);AnimalAnims.seek(el,.5);const s=AnimalAnims.inspect(el);return {id,travel:s.travel,zoom:s.zoom,frame:s.frame,restFrame:ANIMAL_ANIMATIONS[id].cel.restFrame};});
 assert.equal(Math.abs(report.reduced.travel),0);assert.equal(report.reduced.zoom,1);assert.equal(report.reduced.frame,report.reduced.restFrame);assert.equal(report.errors.length,0);
 console.log(JSON.stringify({characters:report.characters.length,errors:report.errors,reduced:report.reduced},null,2));
}finally{fs.writeFileSync(out+'/runtime-checks.json',JSON.stringify(report,null,2));await browser.close();}
