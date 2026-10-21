import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';

const require=createRequire('C:/Users/XTIA/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/package.json');
const {chromium}=require('playwright');
const output='screenshots/v4-6-1';
fs.mkdirSync(output,{recursive:true});
const browser=await chromium.launch({channel:'msedge',headless:true});
const report={method:{cycle:'960 samples over one full distance-derived cycle, envelope=1; actual prepared poster, roots, IK and renderer',velocity:'Signed forward paw velocity relative to torso, threshold 0.01 image heights per cycle; pair peaks and contacts checked independently',visibility:'For each textured leg/paw, remove the alpha of every later draw layer in the actual far-leg / torso / near-leg paint order. Residual alpha >100 counts as visible. This measures surviving pixels, not human recognition.',realtime:'Unmodified AnimalAnims.play at normal wall-clock speed. No seek or altered clock. Inspect on every requestAnimationFrame, retain canvas captures roughly every 100ms.'},errors:[],versions:[]};

try{
 for(const version of [{name:'V4.6 fixed snapshot',key:'old',url:'http://127.0.0.1:4173/share/runtime-v4-6/index.html'},{name:'V4.6.1 candidate',key:'new',url:'http://127.0.0.1:4173/geo/?v=4.6.1'}]){
  const page=await browser.newPage({viewport:{width:1800,height:1080}});
  page.on('pageerror',e=>report.errors.push({version:version.key,error:e.message}));
  await page.goto(version.url);
  await page.waitForFunction(()=>window.__Animals&&[...document.images].every(i=>i.complete&&i.naturalWidth));
  const cycle=await page.evaluate(()=>{
   __Animals.dismissIntro();
   const el=[...document.querySelectorAll('.animal[data-id="cheetah"]')].find(e=>e.tabIndex===0),img=el.querySelector('img'),Q=QuadrupedWalk,r=Q.prepare(img,'cheetah'),p=r.profile||Q.profiles.cheetah,N=960;
   const fronts=r.layers.filter(l=>l.name.endsWith('front')),names=r.layers.map(l=>l.name),poses=[];
   for(let i=0;i<N;i++){
    const t=i/N,state={envelope:1,distance:t*r.stride/p.duty/r.h,stride:r.stride,progress:.5,time:t/p.cadence};
    poses.push({t,state,legs:Object.fromEntries(r.layers.map(l=>[l.name,Q.pose(p,l,state,r.w,r.h)]))});
   }
   const circularDifference=(a,b)=>Math.min(Math.abs(a-b),1-Math.abs(a-b));
   const contacts={},peaks={},visibility=Object.fromEntries(names.map(name=>[name,{minLegPixels:Infinity,minPawPixels:Infinity,minLegRatio:1,minPawRatio:1,zeroLegFrames:0,zeroPawFrames:0}]));
   let bothForward=0,eitherForward=0,maxReach=0,maxFootSlip=0,maxJointStep=0;
   const speedThreshold=.01*r.h;
   for(const l of r.layers){contacts[l.name]=[];let best=-Infinity,peak=0;
    for(let i=0;i<N;i++){
     const q=poses[i].legs[l.name],prev=poses[(i+N-1)%N].legs[l.name],lift=l.ankleGround-(q.foot[1]+q.drop);
     if(q.stance&&!prev.stance)contacts[l.name].push(i/N);
     if(lift>best){best=lift;peak=i/N;}
     maxReach=Math.max(maxReach,q.reachError/r.h);
     const angle=(a,b)=>Math.abs(Math.atan2(Math.sin(a-b),Math.cos(a-b)));
     maxJointStep=Math.max(maxJointStep,angle(q.upper,prev.upper),angle(q.lower,prev.lower));
     if(i>0&&q.stance&&prev.stance){const world=(pose,j)=>pose.foot[0]+p.face*poses[j].state.distance*r.h;maxFootSlip=Math.max(maxFootSlip,Math.abs(world(q,i)-world(prev,i-1))/r.h);}
    }
    peaks[l.name]={phase:peak,lift:best/r.h};
   }
   for(let i=0;i<N;i++){
    const next=poses[(i+1)%N],current=poses[i];
    const forward=fronts.map(l=>p.face*(next.legs[l.name].foot[0]-current.legs[l.name].foot[0])*N>speedThreshold);
    if(forward[0]&&forward[1])bothForward++;
    if(forward[0]||forward[1])eitherForward++;
   }
   const make=()=>{const c=document.createElement('canvas');c.width=r.w;c.height=r.h;return c;};
   const scratch=make(),ctx=scratch.getContext('2d',{willReadFrequently:true});
   function part(c,bitmap,origin,angle,source){c.save();c.translate(...origin);c.rotate(angle);c.translate(-source[0],-source[1]);c.drawImage(bitmap.image,bitmap.x,bitmap.y);c.restore();}
   function limb(c,l,q,pawOnly=false){if(!pawOnly){part(c,l.upper,q.root,q.upper,l.H);part(c,l.lower,q.knee,q.lower,l.K);}part(c,l.footLayer,q.foot,q.toe,l.F);}
   function body(c,state){const b=Q.torso(p,state,r.w,r.h);c.save();c.translate(b.cx,b.cy);c.rotate(b.pitch);c.translate(-b.cx,-b.cy);if(r.details)QuadrupedDetails.draw(c,r.details,state);else c.drawImage(r.body,0,0);c.restore();}
   const order=[...r.layers.filter(l=>l.far),'body',...r.layers.filter(l=>!l.far)];
   function pixels(l,frame,pawOnly,occluded){ctx.reset();ctx.clearRect(0,0,r.w,r.h);const q=frame.legs[l.name];ctx.translate(0,q.drop);limb(ctx,l,q,pawOnly);
    if(occluded){ctx.globalCompositeOperation='destination-out';for(const later of order.slice(order.indexOf(l)+1)){if(later==='body')body(ctx,frame.state);else limb(ctx,later,frame.legs[later.name]);}}
    const rgba=ctx.getImageData(0,0,r.w,r.h).data;let count=0;for(let k=3;k<rgba.length;k+=4)count+=rgba[k]>100;return count;
   }
   const visibilityFrames=[];
   for(let i=0;i<N;i+=12){const frame=poses[i],row={phase:frame.t,legs:{}};
    for(const l of r.layers){const raw=pixels(l,frame,false,false),visible=pixels(l,frame,false,true),rawPaw=pixels(l,frame,true,false),visiblePaw=pixels(l,frame,true,true),v=visibility[l.name];
     v.minLegPixels=Math.min(v.minLegPixels,visible);v.minPawPixels=Math.min(v.minPawPixels,visiblePaw);v.minLegRatio=Math.min(v.minLegRatio,visible/raw);v.minPawRatio=Math.min(v.minPawRatio,visiblePaw/rawPaw);v.zeroLegFrames+=visible===0;v.zeroPawFrames+=visiblePaw===0;
     row.legs[l.name]={visible,raw,visiblePaw,rawPaw};
    }
    visibilityFrames.push(row);
   }
   const renderFrame=t=>{const c=make(),frame=poses[Math.round(t*N)%N];Q.draw(c.getContext('2d'),'cheetah',img,frame.state,r.w,r.h);return {phase:t,png:c.toDataURL(),feet:Object.fromEntries(fronts.map(l=>[l.name,{phase:frame.legs[l.name].phase,stance:frame.legs[l.name].stance}]))};};
   const frontContactSeparation=circularDifference(contacts['near-front'][0],contacts['far-front'][0]);
   const frontPeakSeparation=circularDifference(peaks['near-front'].phase,peaks['far-front'].phase);
   const diagonalContactError=Math.max(circularDifference(contacts['near-hind'][0],contacts['far-front'][0]),circularDifference(contacts['far-hind'][0],contacts['near-front'][0]));
   return {gait:p.gait,cadence:p.cadence,duty:p.duty,dimensions:[r.w,r.h],stride:r.stride,samples:N,contacts,peaks,frontContactSeparation,frontPeakSeparation,diagonalContactError,bothForwardFraction:bothForward/N,eitherForwardFraction:eitherForward/N,maxReach,maxFootSlip,maxJointStep,visibility,visibilityFrames,storyboard:Array.from({length:8},(_,i)=>renderFrame(i/8))};
  });
  const board=cycle.storyboard;delete cycle.storyboard;
  cycle.alternationPass=Math.abs(cycle.frontContactSeparation-.5)<.01&&Math.abs(cycle.frontPeakSeparation-.5)<.01&&cycle.diagonalContactError<.01&&cycle.bothForwardFraction<.01;
  if(version.key==='new'){
   assert(cycle.alternationPass,'candidate must show genuinely alternating forelegs');assert.equal(cycle.gait,'trot');
   assert(cycle.maxReach<.005&&cycle.maxFootSlip<.001&&cycle.maxJointStep<.065,'candidate continuous reachable planted paws');
   for(const [name,v]of Object.entries(cycle.visibility)){assert(v.minLegPixels>40,name+' still has visible limb texture');assert(v.minPawPixels>15,name+' paw disappears');assert(v.zeroLegFrames===0&&v.zeroPawFrames===0,name+' zero alpha');}
  }else assert(!cycle.alternationPass,'old gait must fail new alternation condition');
  const real=await page.evaluate(async()=>{
   const el=[...document.querySelectorAll('.animal[data-id="cheetah"]')].find(e=>e.tabIndex===0),img=el.querySelector('img'),profile=QuadrupedWalk.profiles.cheetah;
   const rect=el.getBoundingClientRect();__Animals.camera+=rect.left+rect.width/2-innerWidth*.55;
   const frames=[],captures=[];AnimalAnims.play(el);const start=performance.now();let lastCapture=-Infinity;
   await new Promise(resolve=>{function tick(t){const s=AnimalAnims.inspect(el);if(!s){resolve();return;}frames.push({ms:t-start,progress:s.progress,zoom:s.zoom,distance:s.walkState.distance,envelope:s.walkState.envelope,legs:s.gait.map(l=>({name:l.name,stance:l.stance,phase:l.phase,foot:l.foot,upper:l.upper,lower:l.lower}))});
     if(t-lastCapture>=95&&s.progress<.99){const canvas=el.querySelector('.animal-frames');captures.push({ms:t-start,progress:s.progress,png:canvas.toDataURL()});lastCapture=t;}
     if(t-start<Math.max(s.duration+500,3500))requestAnimationFrame(tick);else resolve();}requestAnimationFrame(tick);});
   return {duration:frames.at(-1)?.ms,samples:frames.length,frames,captures,finished:!AnimalAnims.isActing(el),profileCadence:profile.cadence};
  });
  const captures=real.captures;delete real.captures;
  const steady=real.frames.filter(f=>f.envelope>.999999&&f.progress>.30&&f.progress<.68);
  let realtimeBothForward=0,realtimeMoving=0;const touchEvents=[];
  for(let i=1;i<steady.length;i++){
   const now=steady[i],prev=steady[i-1];if(now.distance-prev.distance<1e-6)continue;
   const a=now.legs.filter(l=>l.name.endsWith('front')).map(l=>{const old=prev.legs.find(p=>p.name===l.name);return -1*(l.foot[0]-old.foot[0])/(now.ms-prev.ms)>.00002;});
   realtimeBothForward+=a[0]&&a[1];realtimeMoving++;
  }
  for(let i=1;i<real.frames.length;i++){const now=real.frames[i],prev=real.frames[i-1];if(now.envelope<.99||prev.envelope<.99)continue;for(const leg of now.legs){const old=prev.legs.find(l=>l.name===leg.name);if(leg.stance&&!old.stance)touchEvents.push({ms:now.ms,name:leg.name,progress:now.progress});}}
  real.steadySamples=steady.length;real.bothForwardFraction=realtimeBothForward/realtimeMoving;real.touchEvents=touchEvents;
  assert(real.finished,'normal wall clock action completes');if(version.key==='new')assert(real.bothForwardFraction<.04,'normal speed forelegs simultaneously forward');
  await page.evaluate(({board,captures,title})=>{
   const root=document.createElement('div');root.id='qa-board';root.style.cssText='position:absolute;inset:0;z-index:99999;background:#f6f7f9;color:#18232f;font-family:Arial;padding:22px;box-sizing:border-box;overflow:visible';
   const h=document.createElement('h1');h.textContent=title+' — 8 phases across a complete cycle';h.style.cssText='font-size:22px;margin:0 0 12px';root.append(h);
   const legend=document.createElement('p');legend.textContent='Near front = N; far front = F. Touchdown and lifted paw states shown below each actual rendered frame.';legend.style.cssText='margin:0 0 14px;font-size:15px';root.append(legend);
   const grid=document.createElement('div');grid.style.cssText='display:grid;grid-template-columns:repeat(4,1fr);gap:12px';root.append(grid);
   for(const item of board){const card=document.createElement('div');card.style.cssText='background:white;border:1px solid #ccd3dd;border-radius:8px;padding:10px';const label=document.createElement('div');label.style.cssText='font-size:16px;font-weight:600';label.textContent='Cycle '+item.phase.toFixed(3);card.append(label);const img=new Image();img.src=item.png;img.style.cssText='display:block;width:100%;height:340px;object-fit:contain';card.append(img);const state=document.createElement('div');state.textContent=Object.entries(item.feet).map(([name,f])=>(name.startsWith('near')?'N':'F')+': '+(f.stance?'grounded':'swinging')).join('  /  ');state.style.cssText='font-size:15px;text-align:center';card.append(state);grid.append(card);}
   document.body.append(root);
  },{board,captures,title:version.name});
  await page.waitForFunction(()=>[...document.querySelectorAll('#qa-board img')].every(i=>i.complete));
  await page.locator('#qa-board').screenshot({path:`${output}/cheetah-${version.key}-cycle.png`});
  await page.evaluate(({captures,title})=>{
   const root=document.querySelector('#qa-board');root.replaceChildren();const h=document.createElement('h1');h.style.cssText='font-size:22px;margin:0 0 12px';h.textContent=title+' — normal wall-clock playback captures, no seeking';root.append(h);const grid=document.createElement('div');grid.style.cssText='display:grid;grid-template-columns:repeat(6,1fr);gap:8px';root.append(grid);
   for(const item of captures){const card=document.createElement('div');card.style.cssText='background:white;border:1px solid #ccd3dd;border-radius:8px;padding:6px';const img=new Image();img.src=item.png;img.style.cssText='display:block;width:100%;height:170px;object-fit:contain';const label=document.createElement('div');label.textContent=Math.round(item.ms)+' ms | '+item.progress.toFixed(3);label.style.cssText='font-size:13px;text-align:center';card.append(img,label);grid.append(card);}root.style.height='auto';
  },{captures,title:version.name});
  await page.waitForFunction(()=>[...document.querySelectorAll('#qa-board img')].every(i=>i.complete));
  await page.locator('#qa-board').screenshot({path:`${output}/cheetah-${version.key}-normal-playback.png`});
  report.versions.push({...version,cycle,realtime:real});await page.close();
 }
 assert.deepEqual(report.errors,[]);
 fs.writeFileSync(`${output}/cheetah-alternation.json`,JSON.stringify(report,null,2));
 console.log(JSON.stringify(report.versions.map(v=>({version:v.name,gait:v.cycle.gait,pass:v.cycle.alternationPass,bothForward:v.cycle.bothForwardFraction,contactSeparation:v.cycle.frontContactSeparation,peakSeparation:v.cycle.frontPeakSeparation,diagonalError:v.cycle.diagonalContactError,visibility:v.cycle.visibility,realtimeSamples:v.realtime.samples,realtimeBothForward:v.realtime.bothForwardFraction})),null,2));
}finally{await browser.close();}
