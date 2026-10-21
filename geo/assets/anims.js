/* Timed complete drawings for authored quadrupeds. Existing joint gestures
   and other authored animal animations remain available for comparison. */
(function(g){
'use strict';
const active=new Map(),positions=new WeakMap(),sheets=new Map();
const asset=p=>g.resolveAsset?g.resolveAsset(p):p;
const defs=g.ANIMAL_ANIMATIONS||{};
function preload(id){
 if(defs[id]?.smoothMarine)return g.MotionV411.preload(id);
 if(defs[id]?.chapter)return g.ChapterObjects.preload(id);
 if(defs[id]?.exploration)return g.ExplorationObjects.preload(id);
 const def=defs[id];if(!def?.sheet)return Promise.resolve(null);
 const src=asset(def.sheet);let entry=sheets.get(src);
 if(entry){sheets.delete(src);sheets.set(src,entry);return entry.promise;}
 const img=new Image();entry={img,promise:null};
 entry.promise=new Promise(resolve=>{img.onload=()=>resolve(img);img.onerror=()=>resolve(null);img.src=src;if(img.complete&&img.naturalWidth)resolve(img);});
 sheets.set(src,entry);
 while(sheets.size>8)sheets.delete(sheets.keys().next().value);
 return entry.promise;
}
function finish(el){
 if(g.MotionV411?.isActing(el)){g.MotionV411.stop(el);return;}
 if(g.ChapterObjects?.isActing(el)){g.ChapterObjects.stop(el);return;}
 if(g.ExplorationObjects?.isActing(el)){g.ExplorationObjects.stop(el);return;}
 const r=active.get(el);if(!r)return;
 cancelAnimationFrame(r.frame);r.canvas.remove();r.fx.remove();r.img.style.visibility=el.querySelector('.stand-pose')?'hidden':'';
 el.classList.remove('acting');el.style.translate=`${r.x}px 0px`;
 const shadow=el.querySelector('.shadow');if(shadow)shadow.style.transform='';
 el._browseBranch?.reset();
 positions.set(el,{x:r.x,orientation:r.orientation,walkDistance:r.walkState?.distance||r.walkOffset||0});active.delete(el);
}
function draw(r,index,next=index,mix=0,zoom=1,gesture=0){
 const c=r.ctx,v=r.viewport;c.setTransform(r.dpr,0,0,r.dpr,0,0);c.clearRect(0,0,r.cssW,r.cssH);
 const pivotX=r.pad+r.width*(r.def.gripX??.5),pivotY=r.pad+r.height*(r.hanging?.04:.96);
 c.translate(pivotX,pivotY);c.scale(zoom,zoom);c.translate(-pivotX,-pivotY);
 if(!r.cel&&(r.def.rig||r.def.object)){c.save();c.translate(r.baseX,r.baseY);if(r.def.walk){if(r.walkRig)g.QuadrupedWalk.draw(c,r.id,r.img,r.walkState,v.w*r.fit,v.h*r.fit);else c.drawImage(r.img,0,0,v.w*r.fit,v.h*r.fit);}else if(r.def.object)g.StoryObjects.draw(c,r.id,gesture,v.w*r.fit,v.h*r.fit);else g.SpritePuppets.draw(c,r.id,r.img,gesture,v.w*r.fit,v.h*r.fit);c.restore();return;}
 const pose=(i,alpha)=>{c.globalAlpha=alpha;if(r.sheet){const f=r.def.frames[i];c.drawImage(r.sheet,f.x,f.y,f.w,f.h,r.baseX+f.dx*r.fit,r.baseY+f.dy*r.fit,f.w*r.fit,f.h*r.fit);}else c.drawImage(r.img,r.baseX,r.baseY,v.w*r.fit,v.h*r.fit);};
 if(mix&&next!==index){pose(index,1-mix);c.globalCompositeOperation='lighter';pose(next,mix);c.globalCompositeOperation='source-over';}else pose(index,1);c.globalAlpha=1;
}
function render(r,p){
 p=Math.max(0,Math.min(1,p));
 if(r.cel){
  const state=g.CelMotion.sample(r.cel,p*r.duration,r.reduced),ease=x=>x*x*(3-2*x);
  const envelope=Math.max(0,Math.min(1,p/.12,(1-p)/.16));
  const zoom=r.reduced?1:1+.10*ease(envelope);
  r.x=r.start+r.travel*state.advance;
  // Held drawings stay on the canvas. Only a new cel or the continuous
  // start/end zoom requires rasterizing again, which keeps phone playback light.
  if(r.drawnCel!==state.frame||r.drawnZoom!==zoom){
   draw(r,state.frame,state.frame,0,zoom,p);r.drawnCel=state.frame;r.drawnZoom=zoom;
  }
  r.celState=state;r.frameIndex=state.frame;r.progress=p;r.gesture=p;r.zoom=zoom;
  // Aquatic originals do not have planted feet. Their glide stays continuous
  // while the complete drawings hold the small neck and beak gestures.
  if(r.cel.motion==='swim'&&!r.reduced)r.x=r.start+r.travel*ease(p);
  let leapY=0;if(r.cel.motion==='leap'&&!r.reduced){const q=Math.max(0,Math.min(1,(p-.30)/.45));r.x=r.start+r.travel*(q*q*(3-2*q));leapY=-Math.sin(q*Math.PI)*r.height*.16;const shadow=r.el.querySelector('.shadow');if(shadow)shadow.style.transform=`translateY(${-leapY}px) scale(${1-Math.sin(q*Math.PI)*.25})`;}
  r.el.style.translate=`${r.x}px ${leapY}px`;
  return;
 }
 const n=r.def.frames.length,time=p*r.duration/1000;
 const phase=r.reduced?0:r.def.loop?time*r.def.fps:Math.min(n-1,p*(n-1));
 const idx=r.def.loop?Math.floor(phase)%n:Math.floor(phase),next=r.def.loop?(idx+1)%n:Math.min(n-1,idx+1);
 // Short, premultiplied transitions between adjacent complete poses. Slow
 // gestures need a slightly longer transition than a fast walking cycle.
 const window=Math.min(.80,(r.def.loop?r.def.fps:(n-1)/(r.duration/1000))*(r.def.loop?.025:.055));
 const mix=r.reduced?0:Math.max(0,(phase%1-(1-window))/window);
 const ease=x=>x*x*(3-2*x),envelope=Math.min(1,p/.13,(1-p)/.17),zoomPeak=r.def.zoom==null?0.10:r.def.zoom,zoom=r.reduced?1:1+zoomPeak*ease(envelope);
 const arrival=ease(Math.min(1,p/.12)),continuousZoom=(r.zoomStart||1)+(zoom-(r.zoomStart||1))*arrival;
 const gesture=(r.def.rig||r.def.object)?(r.poseStart||0)*(1-arrival)+p*arrival:p;
 const advance=r.def.walk?g.QuadrupedWalk.advance(p):p;
 r.x=r.start+r.travel*advance;
 if(r.def.walk){const env=r.reduced?0:g.QuadrupedWalk.envelope(p);r.walkState={envelope:r.def.plantedRest?1:env,gait:r.def.plantedRest?env:undefined,distance:r.walkOffset+Math.abs(r.travel)*advance/(r.fit*1.1*r.viewport.h),progress:p,time};}
 draw(r,idx,next,mix,continuousZoom,gesture);r.frameIndex=idx;r.progress=p;r.gesture=gesture;r.zoom=continuousZoom;
 r.el._browseBranch?.update(gesture,continuousZoom);
 let y=0;
 const steps=r.def.stepCount||0;
 if(steps){const q=Math.sin(Math.PI*((p*steps)%1));y-=q*r.height*(r.def.hop||0);const shadow=r.el.querySelector('.shadow');if(shadow)shadow.style.transform=`translateY(${-y}px) scale(${1-q*.18})`;}
 else if(r.def.hop){const q=Math.sin(Math.PI*p);y-=q*r.height*r.def.hop;const shadow=r.el.querySelector('.shadow');if(shadow)shadow.style.transform=`translateY(${-y}px) scale(${1-q*.2})`;}
 if(r.def.wave)y-=Math.sin(p*Math.PI*2*(r.def.waveCount||2))*r.height*r.def.wave;
 r.el.style.translate=`${r.x}px ${y}px`;
 if(r.def.glow)r.canvas.style.filter=`brightness(${1+.14*Math.sin(Math.PI*p)}) drop-shadow(0 0 ${Math.sin(Math.PI*p)*12}px #ffe2a4)`;
}
function play(el,id){
 if(!el)return;id=id||el.dataset.id;if(defs[id]?.smoothMarine)return g.MotionV411.play(el,id);if(defs[id]?.chapter)return g.ChapterObjects.play(el,id);if(defs[id]?.exploration)return g.ExplorationObjects.play(el,id);
 const old=active.get(el);
 // A repeat tap changes the narration, while the current planted-foot walk
 // carries on. Restarting its foot phase would break contact with the ground.
 if(old&&(old.cel||old.def.walk||old.id==='giraffe')&&old.id===id)return old;
 const zoomStart=old?.zoom||1,poseStart=old?.gesture||0;finish(el);
 const img=el.querySelector('img:not(.stand-pose)'),waterEyes=el.dataset.special==='water-eyes',def=waterEyes?{...defs[id],sheet:null,rig:false,walk:false,cel:null,travel:0,hop:0,duration:1800,frames:[{x:0,y:0,w:img?.naturalWidth||1,h:img?.naturalHeight||1,dx:0,dy:0}]}:defs[id];if(!def||!img?.complete||!img.naturalWidth)return;
 if(active.size>=3)finish(active.keys().next().value);
 const previous=positions.get(el)||{x:0,orientation:el.dataset.flip==='true'?-1:1};
 const layer=el.querySelector('.orientation'),width=layer.offsetWidth,height=layer.offsetHeight,limit=Math.min(innerWidth*.23,width*.8);
 const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
 const cel=g.CelMotion?.prepare(def)||null;
 let orientation=previous.orientation,distance=reduced?0:(def.travel||0)*width,direction=(def.face||0)*orientation;
 let walkRig=null;if(def.walk&&!cel&&!reduced){try{walkRig=g.QuadrupedWalk.prepare(img,id);const fit=Math.min(width/img.naturalWidth,height/img.naturalHeight);distance=Math.min((walkRig.profile.travelFactor||def.travel)*width,walkRig.stride/walkRig.profile.duty*walkRig.profile.cycles*fit*1.1);}catch(err){walkRig=null;}}
 // Turn the character before its next forward step at the walking boundary.
 if(distance&&limit-direction*previous.x<((def.walk||cel)?Math.max(distance*.65,width*.12):Math.min(distance,width*.12))){orientation*=-1;direction*=-1;}
 const room=Math.max(0,limit-direction*previous.x),travel=direction*Math.min(distance,room);
 el.querySelector('.orientation').style.transform=`scaleX(${orientation})`;
 const canvas=document.createElement('canvas');canvas.className='animal-frames';canvas.setAttribute('aria-hidden','true');
 const dpr=Math.min(2,g.devicePixelRatio||1),pad=Math.ceil(Math.max(width,height)*.20),cssW=width+pad*2,cssH=height+pad*2;
 canvas.width=Math.ceil(cssW*dpr);canvas.height=Math.ceil(cssH*dpr);
 // A Retina bitmap must never double the displayed canvas dimensions.
 canvas.style.cssText=`left:${-pad}px;top:${-pad}px;width:${cssW}px;height:${cssH}px`;
 const fx=document.createElement('div');fx.className='action-fx';el.querySelector('.sprite').append(canvas,fx);
 const viewport=def.sheet?def.viewport:{w:img.naturalWidth,h:img.naturalHeight},fit=Math.min(width/viewport.w,height/viewport.h);
 const r={el,id,def,viewport,img,walkRig,cel,canvas,ctx:canvas.getContext('2d'),fx,sheet:null,ready:false,reduced,width,height,dpr,pad,cssW,cssH,fit,baseX:pad+(width-viewport.w*fit)/2,baseY:pad+(height-viewport.h*fit)/2,hanging:el.dataset.special==='hanging',orientation,face:direction,start:previous.x,x:previous.x,travel,duration:reduced?650:(cel?.duration||(walkRig&&g.QuadrupedWalk.duration?g.QuadrupedWalk.duration(walkRig,travel,fit):id==='giraffe'?g.SpritePuppets.rigs.giraffe.duration:walkRig?.profile.duration||def.duration)),frame:0,progress:0};
 r.ctx.imageSmoothingEnabled=true;r.ctx.imageSmoothingQuality='high';
 r.zoomStart=zoomStart;r.poseStart=poseStart;r.zoom=zoomStart;r.gesture=poseStart;r.progress=0;r.walkOffset=previous.walkDistance||0;r.walkState={envelope:def.plantedRest?1:0,gait:def.plantedRest?0:undefined,distance:r.walkOffset};
 active.set(el,r);el.classList.add('acting');try{if(!cel){draw(r,0,0,0,zoomStart,poseStart);img.style.visibility='hidden';}}catch(err){finish(el);throw err;}
 preload(id).then(sheet=>{
  if(active.get(el)!==r)return;
  if(cel&&!sheet){finish(el);return;}
  r.sheet=def.sheet?sheet:null;r.ready=true;img.style.visibility='hidden';
  if(cel)render(r,0);
  const t0=performance.now();function tick(now){if(active.get(el)!==r)return;const p=Math.min(1,(now-t0)/r.duration);render(r,r.reduced?0:p);if(p<1)r.frame=requestAnimationFrame(tick);else finish(el);}
  r.frame=requestAnimationFrame(tick);
 });
 return r;
}
g.AnimalAnims={play,preload,stop:finish,stopAll(){[...active.keys()].forEach(finish);g.MotionV411?.stopAll();g.ExplorationObjects?.stopAll();g.ChapterObjects?.stopAll();},isActing:el=>active.has(el)||!!g.MotionV411?.isActing(el)||!!g.ChapterObjects?.isActing(el)||!!g.ExplorationObjects?.isActing(el),defs,
 seek(el,p){if(g.MotionV411?.isActing(el)){g.MotionV411.seek(el,p);return;}if(g.ChapterObjects?.isActing(el)){g.ChapterObjects.seek(el,p);return;}if(g.ExplorationObjects?.isActing(el)){g.ExplorationObjects.seek(el,p);return;}const r=active.get(el);if(r){cancelAnimationFrame(r.frame);render(r,p);}},
 inspect(el){if(g.MotionV411?.isActing(el))return g.MotionV411.inspect(el);if(g.ChapterObjects?.isActing(el))return g.ChapterObjects.inspect(el);if(g.ExplorationObjects?.isActing(el))return g.ExplorationObjects.inspect(el);const r=active.get(el);return r?{id:r.id,renderer:r.cel?'authored-keyframes':r.def.walk?'continuous-ik-walk':r.def.rig?'continuous-rigid-joints':r.def.object?'continuous-cutaway':'authored-cel-16',motion:r.cel?r.cel.motion:r.def.walk?g.QuadrupedWalk.profiles[r.id].gait||'walk':null,duration:r.duration,time:r.progress*r.duration,cel:r.cel?{...r.celState,effectiveAdvance:r.celState?.advance||0,steps:r.cel.sequence.length,holdsMs:r.cel.holds}:null,gait:r.def.walk&&!r.cel?g.QuadrupedWalk.inspect(r.id,r.img,r.walkState):null,details:r.walkRig?.details?g.QuadrupedDetails.inspect(r.walkRig.details,r.walkState):null,walkState:r.def.walk&&!r.cel?r.walkState:null,x:r.x,joints:r.def.rig&&!r.def.walk&&!r.cel?g.SpritePuppets.inspect(r.id,r.gesture):null,opening:r.def.object&&!r.cel?g.StoryObjects.opening(r.gesture):null,ready:r.ready,progress:r.progress,frame:r.frameIndex,zoom:r.zoom,face:r.face,travel:r.travel,orientation:r.orientation,label:r.def.label,cssSize:[r.cssW,r.cssH],bitmap:[r.canvas.width,r.canvas.height]}:null;}
};
})(window);
