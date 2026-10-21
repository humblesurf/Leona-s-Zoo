/* Stable marine originals with continuous, small rigid joint motion.
   No mesh warps and no inconsistent full-image cycle for slow swimmers. */
(function(g){
'use strict';
const defs=g.ANIMAL_ANIMATIONS,active=new Map(),positions=new WeakMap(),images=new Map(),prepared=new Map();
/* BEGIN COMPLETE POSE OVERRIDES */
Object.assign(defs,{"lion":{"sheet":"assets/animation/v4-11-motion/lion-frames.webp","poster":"assets/animation/v4-11-motion/lion-poster.webp","viewport":{"w":636,"h":399},"frames":[{"x":0,"y":0,"w":636,"h":399,"dx":0,"dy":0},{"x":636,"y":0,"w":636,"h":399,"dx":0,"dy":0},{"x":1272,"y":0,"w":636,"h":399,"dx":0,"dy":0},{"x":0,"y":399,"w":636,"h":399,"dx":0,"dy":0},{"x":636,"y":399,"w":636,"h":399,"dx":0,"dy":0},{"x":1272,"y":399,"w":636,"h":399,"dx":0,"dy":0}],"rig":false,"walk":false,"loop":false,"hop":0,"face":0,"travel":0,"fps":18,"label":"抬头、张嘴轻吼、慢慢合嘴","cel":{"sequence":[0,1,2,3,2,1,0],"holdsMs":[320,180,220,1050,220,220,390],"advance":[0,0,0,0,0,0,0],"restFrame":0,"motion":"roar"},"duration":2600},"polarbear":{"sheet":"assets/animation/v4-11-motion/polarbear-frames.webp","poster":"assets/animation/v4-11-motion/polarbear-poster.webp","viewport":{"w":621,"h":507},"frames":[{"x":0,"y":0,"w":621,"h":507,"dx":0,"dy":0},{"x":621,"y":0,"w":621,"h":507,"dx":0,"dy":0},{"x":1242,"y":0,"w":621,"h":507,"dx":0,"dy":0},{"x":0,"y":507,"w":621,"h":507,"dx":0,"dy":0},{"x":621,"y":507,"w":621,"h":507,"dx":0,"dy":0},{"x":1242,"y":507,"w":621,"h":507,"dx":0,"dy":0}],"rig":false,"walk":false,"loop":false,"hop":0,"face":0,"travel":0,"fps":18,"label":"坐稳、站起看一看、慢慢回到四足","cel":{"sequence":[0,1,2,3,2,4,1,0],"holdsMs":[380,340,300,1100,300,300,340,500],"advance":[0,0,0,0,0,0,0,0],"restFrame":0,"motion":"stand"},"duration":3560}});
/* END COMPLETE POSE OVERRIDES */
const clamp=x=>Math.max(0,Math.min(1,x));
const ease=x=>{x=clamp(x);return x*x*x*(x*(x*6-15)+10);};
const envelope=p=>ease(p/.16)*ease((1-p)/.20),TAU=Math.PI*2;
const source=p=>g.resolveAsset?g.resolveAsset(p):p;
for(const id of ['whale','jellyfish']){
 const def=defs[id];defs[id]={...def,sheet:null,frames:[{x:0,y:0,w:def.viewport.w,h:def.viewport.h,dx:0,dy:0}],rig:false,walk:false,cel:null,smoothMarine:true,duration:5200,label:id==='whale'?'尾鳍缓缓摆动，平稳向前游':'轻柔收伞、触手随水流摆动'};
}
// The fox already uses the same complete originals as the savanna animals.
// Give all four alternating contact poses equal exposures in a short trot.
if(defs.arcticfox?.cel){const def=defs.arcticfox;defs.arcticfox={...def,duration:1590,cel:{...def.cel,holdsMs:[230,130,130,130,130,130,130,130,130,320]}};}
function preload(id){
 const def=defs[id];if(!def?.smoothMarine)return Promise.resolve(null);
 const url=source(def.poster);if(images.has(url))return images.get(url);
 const promise=new Promise(resolve=>{const img=new Image();img.onload=()=>resolve(img);img.onerror=()=>resolve(null);img.src=url;if(img.complete&&img.naturalWidth)resolve(img);});images.set(url,promise);return promise;
}
function path(ctx,points,w,h){ctx.beginPath();points.forEach(([x,y],i)=>i?ctx.lineTo(x*w,y*h):ctx.moveTo(x*w,y*h));ctx.closePath();}
function painting(id,img){
 const key=id+':'+img.currentSrc;if(prepared.has(key))return prepared.get(key);
 const w=img.naturalWidth,h=img.naturalHeight,make=()=>{const c=document.createElement('canvas');c.width=w;c.height=h;return c;};
 const body=make(),limb=make(),bc=body.getContext('2d'),lc=limb.getContext('2d');bc.drawImage(img,0,0);
 const poly=id==='whale'?[[.68,.405],[1,.405],[1,.81],[.68,.81]]:[[0,.355],[1,.355],[1,1],[0,1]];
 const pivot=id==='whale'?[.70,.545]:[.50,.355];
 lc.save();path(lc,poly,w,h);lc.clip();lc.drawImage(img,0,0);lc.restore();
 bc.globalCompositeOperation='destination-out';path(bc,poly,w,h);bc.fill();bc.globalCompositeOperation='source-over';
 // Restore the original paint only around the joint; no duplicate tail/tentacles.
 bc.save();bc.beginPath();if(id==='whale')bc.ellipse(pivot[0]*w,pivot[1]*h,w*.055,h*.15,0,0,TAU);else bc.rect(0,h*.335,w,h*.045);bc.clip();bc.drawImage(img,0,0);bc.restore();
 const value={body,limb,pivot,w,h};prepared.set(key,value);return value;
}
function render(r,p){
 p=clamp(p);const e=r.reduced?0:envelope(p),t=p*r.duration/1000;
 const zoom=1+.10*e,joint=r.id==='whale'?.038*Math.sin(t*TAU*.32)*e:.028*Math.sin(t*TAU*.26)*e;
 const y=r.reduced?0:r.id==='whale'?-Math.sin(p*Math.PI)*r.height*.025:-Math.sin(p*Math.PI)*r.height*.08;
 const angle=r.id==='whale'?-.012*Math.sin(p*TAU)*e:.012*Math.sin(p*TAU)*e;
 r.x=r.start+r.travel*ease(p);r.progress=p;r.zoom=zoom;r.joint=joint;r.y=y;
 r.el.style.translate=`${r.x}px ${y}px`;
 const c=r.ctx;c.setTransform(r.dpr,0,0,r.dpr,0,0);c.clearRect(0,0,r.cssW,r.cssH);
 c.save();c.translate(r.pad+r.width*.5,r.pad+r.height*.5);c.rotate(angle);c.scale(zoom,zoom);c.translate(-r.width*.5,-r.height*.5);
 const paint=r.paint,w=paint.w*r.fit,h=paint.h*r.fit,ox=(r.width-w)/2,oy=(r.height-h)/2;
 const limb=()=>{c.save();c.translate(ox+paint.pivot[0]*w,oy+paint.pivot[1]*h);c.rotate(joint);c.translate(-paint.pivot[0]*w,-paint.pivot[1]*h);c.drawImage(paint.limb,0,0,w,h);c.restore();};
 if(r.id==='jellyfish')limb();
 if(r.id==='jellyfish'){const pulse=1+.014*Math.sin(t*TAU*.43)*e;c.save();c.translate(ox+w*.5,oy+h*.355);c.scale(pulse,pulse);c.translate(-w*.5,-h*.355);c.drawImage(paint.body,0,0,w,h);c.restore();}
 else {c.drawImage(paint.body,ox,oy,w,h);limb();}
 c.restore();
}
function stop(el){const r=active.get(el);if(!r)return;cancelAnimationFrame(r.frame);r.canvas.remove();r.img.style.visibility='';el.classList.remove('acting');el.style.translate=`${r.x}px 0px`;positions.set(el,{x:r.x,orientation:r.orientation});active.delete(el);}
function play(el,id){
 if(active.has(el))return active.get(el);
 const img=el.querySelector('img'),def=defs[id];if(!img?.complete||!img.naturalWidth||!def?.smoothMarine)return;
 if(active.size>=3)stop(active.keys().next().value);
 const layer=el.querySelector('.orientation'),width=layer.offsetWidth,height=layer.offsetHeight;
 const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches,previous=positions.get(el)||{x:parseFloat(el.style.translate)||0,orientation:el.dataset.flip==='true'?-1:1};
 let orientation=previous.orientation,direction=(def.face||0)*orientation;
 const limit=Math.min(innerWidth*.18,width*.5),distance=reduced?0:Math.min(width*.19,innerWidth*.14);
 if(direction&&limit-direction*previous.x<distance*.65){orientation*=-1;direction*=-1;}
 const travel=direction?direction*Math.min(distance,Math.max(0,limit-direction*previous.x)):0;
 layer.style.transform=`scaleX(${orientation})`;
 const dpr=Math.min(2,g.devicePixelRatio||1),pad=Math.ceil(Math.max(width,height)*.20),cssW=width+pad*2,cssH=height+pad*2;
 const canvas=document.createElement('canvas');canvas.className='animal-frames';canvas.setAttribute('aria-hidden','true');canvas.width=Math.ceil(cssW*dpr);canvas.height=Math.ceil(cssH*dpr);canvas.style.cssText=`left:${-pad}px;top:${-pad}px;width:${cssW}px;height:${cssH}px`;
 el.querySelector('.sprite').append(canvas);el.classList.add('acting');
 const r={el,id,img,def,width,height,canvas,ctx:canvas.getContext('2d'),dpr,pad,cssW,cssH,fit:Math.min(width/img.naturalWidth,height/img.naturalHeight),paint:painting(id,img),reduced,start:previous.x,x:previous.x,orientation,travel,duration:reduced?650:def.duration,frame:0};
 r.ctx.imageSmoothingEnabled=true;r.ctx.imageSmoothingQuality='high';active.set(el,r);img.style.visibility='hidden';render(r,0);
 const start=performance.now();function tick(now){if(active.get(el)!==r)return;const p=Math.min(1,(now-start)/r.duration);render(r,reduced?0:p);if(p<1)r.frame=requestAnimationFrame(tick);else stop(el);}r.frame=requestAnimationFrame(tick);return r;
}
g.MotionV411={play,preload,stop,stopAll(){[...active.keys()].forEach(stop);},isActing:el=>active.has(el),seek(el,p){const r=active.get(el);if(r){cancelAnimationFrame(r.frame);render(r,p);}},inspect(el){const r=active.get(el);return r?{id:r.id,renderer:'stable-original-continuous-joints',duration:r.duration,progress:r.progress,zoom:r.zoom,joint:r.joint,x:r.x,y:r.y,travel:r.travel,face:(r.def.face||0)*r.orientation,orientation:r.orientation,ready:true,cssSize:[r.cssW,r.cssH],bitmap:[r.canvas.width,r.canvas.height],label:r.def.label}:null;}};
})(window);
