/* Full original objects, rigid travel and independently drawn sail/door layers. */
(function(g){
'use strict';
const active=new Map(),positions=new WeakMap(),images=new Map();
const defs=g.EXPLORATION_OBJECTS||{},asset=p=>g.resolveAsset?g.resolveAsset(p):p;
const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v)),ease=v=>{v=clamp(v);return v*v*(3-2*v);};
let night=false;
function image(path){if(!path)return Promise.resolve(null);if(images.has(path))return images.get(path);const promise=new Promise(resolve=>{const i=new Image();i.onload=()=>resolve(i);i.onerror=()=>resolve(null);i.src=asset(path);if(i.complete&&i.naturalWidth)resolve(i);});images.set(path,promise);return promise;}
function layerPath(layer){return typeof layer==='string'?layer:layer?.path;}
function preload(id){const d=defs[id];return d?Promise.all([image(d.poster),...Object.values(d.extraLayers||{}).map(l=>image(layerPath(l)))]):Promise.resolve(null);}
function setNight(on){night=!!on;g.document.querySelectorAll('.panel[data-scene="camp"]').forEach(p=>{p.classList.toggle('camp-night',night);p.dataset.night=String(night);});}
function mountPanel(panel,sc,w,h){
 if(panel.dataset.scene!=='camp')return;
 const shade=document.createElement('div');shade.className='camp-night-shade';shade.setAttribute('aria-hidden','true');panel.append(shade);
 const sky=document.createElement('div');sky.className='camp-starfield';sky.setAttribute('aria-hidden','true');
 const count=Math.min(70,Math.round(w/h*11));
 for(let i=0;i<count;i++){const s=document.createElement('i'),x=((i*73+27)%997)/997,y=((i*31+19)%101)/101*.27;s.style.cssText=`left:${x*w}px;top:${y*h+h*.025}px;--star-delay:${-i*.43}s;width:${i%5===0?4:2}px;height:${i%5===0?4:2}px`;sky.append(s);}panel.append(sky);
 const fireflies=document.createElement('div');fireflies.className='camp-fireflyfield';fireflies.setAttribute('aria-hidden','true');
 for(let i=0;i<18;i++){const point=document.createElement('i');point.style.cssText=`left:${(.06+((i*47)%89)/100)*w}px;top:${(.52+((i*17)%31)/100)*h}px;animation-delay:${-i*.63}s`;fireflies.append(point);}panel.append(fireflies);
 panel.classList.toggle('camp-night',night);panel.dataset.night=String(night);
}
function attach(el,id){const d=defs[id],layer=d?.extraLayers?.sail;if(!layer)return;const rest=document.createElement('img');rest.className='exploration-rest-layer';rest.src=asset(layerPath(layer));rest.alt='';rest.draggable=false;if(layer.rect){const [x,y,w,h]=layer.rect;rest.style.cssText=`position:absolute;left:${x*100}%;top:${y*100}%;width:${w*100}%;height:${h*100}%;z-index:1`;}const idle=el.querySelector('.idle-layer');idle.querySelector('img').style.cssText='position:relative;z-index:2';idle.append(rest);}
function makeEffect(r,type){const effect=document.createElement('div');effect.className='exploration-effect '+type;effect.setAttribute('aria-hidden','true');r.visual.append(effect);return effect;}
function stop(el){const r=active.get(el);if(!r)return;cancelAnimationFrame(r.frame);r.action.remove();r.poster.style.visibility='';r.idle.style.visibility='';r.el.classList.remove('acting');r.el.style.translate=`${r.x}px 0px`;r.orientation.style.transform=`scaleX(${r.face})`;positions.set(el,{x:r.x,face:r.face});active.delete(el);}
function render(r,p){
 p=clamp(p);r.progress=p;const d=r.def,t=p*r.duration/1000;
 const envelope=ease(Math.min(p/.13,(1-p)/.16));
 let y=0,angle=0;r.x=r.start;
 if(['boat','sailboat','rover'].includes(d.motion))r.x=r.start+r.travel*ease(p);
 if(!r.reduced){
  if(d.motion==='boat'||d.motion==='sailboat'){y=Math.sin(t*1.35)*r.height*.013*envelope;angle=Math.sin(t*1.02)*(.55+(d.motion==='sailboat'?.3:0))*envelope;}
  if(d.motion==='buoy'){y=Math.sin(t*1.6)*r.height*.035*envelope;angle=Math.sin(t*1.4)*4*envelope;}
  if(d.motion==='tree')angle=Math.sin(t*1.3)*1.35*envelope;
  if(d.motion==='backpack')angle=Math.sin(t*2)*3.5*envelope;
  if(d.motion==='planet')angle=Math.sin(p*Math.PI)*3;
  if(d.motion==='rover'){const hill=Math.sin(p*Math.PI);y=-hill*hill*r.height*.052;angle=-Math.sin(p*2*Math.PI)*2.4*envelope;}
 }
 r.zoom=r.reduced?1:1+(['boat','sailboat','rover'].includes(d.motion)?.055:.09)*envelope;
 r.visual.style.transform=`translateY(${y}px) rotate(${angle}deg) scale(${r.zoom})`;
 r.el.style.translate=`${r.x}px 0px`;
 const open=ease(p/.22)*ease((1-p)/.18);
 if(r.open){r.open.style.opacity=String(open);r.base.style.opacity=String(1-open);}
 if(r.sail&&!r.reduced)r.sail.style.transform=`rotateY(${Math.sin(t*1.9)*8*envelope}deg) rotate(${Math.sin(t*1.4)*.8*envelope}deg)`;
 if(r.beam){const amount=ease(p/.13)*ease((1-p)/.16);r.beam.style.opacity=String(amount);r.beam.style.transform=`rotate(${Math.sin(t*.8)*12}deg)`;}
 for(const [i,ring]of (r.rings||[]).entries()){const phase=(p*3+i*.24)%1;ring.style.transform=`scale(${.45+phase*1.1})`;ring.style.opacity=String((1-phase)*envelope*.7);}
 for(const wheel of r.wheels||[]){const angle=(r.x-r.start)/(wheel.radius||1)*180/Math.PI;wheel.node.style.transform=`rotate(${angle*r.face}deg)`;}
 if(r.glow)r.glow.style.opacity=String(envelope*(.6+.2*Math.sin(t*2)));
}
function play(el,id){
 const def=defs[id];if(!def)return;
 const old=active.get(el);if(old)return old;
 const poster=el.querySelector('.idle-layer img');if(!poster?.complete||!poster.naturalWidth)return;
 if(active.size>=3)stop(active.keys().next().value);
 const orientation=el.querySelector('.orientation'),width=orientation.offsetWidth,height=orientation.offsetHeight;
 const prior=positions.get(el)||{x:0,face:el.dataset.flip==='true'?-1:1},reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
 let face=prior.face,distance=reduced?0:(['boat','sailboat','rover'].includes(def.motion)?Math.min(innerWidth*.24,width*(def.motion==='rover'?.70:.85)):0);
 const panel=el.closest('.panel'),margin=width*.16;
 const localLeft=el.offsetLeft,localRight=localLeft+el.offsetWidth;
 const min=el.dataset.region==='mars'?panel.offsetWidth*.5:0,max=el.dataset.region==='moon'?panel.offsetWidth*.5:panel.offsetWidth;
 const room=()=>face>0?max-localRight-prior.x-margin:localLeft+prior.x-min-margin;
 if(distance&&room()<distance){face*=-1;distance=Math.min(distance,Math.max(0,room()));}
 const action=document.createElement('div');action.className='exploration-action';
 const visual=document.createElement('div');visual.className='exploration-visual';action.append(visual);
 const base=document.createElement('img');base.src=asset(def.poster);base.alt='';base.draggable=false;visual.append(base);
 const r={el,id,def,poster,idle:el.querySelector('.idle-layer'),orientation,action,visual,base,face,width,height,start:prior.x,x:prior.x,travel:face*distance,reduced,duration:reduced?900:(def.duration||6000),frame:0,progress:0,ready:true,zoom:1,wheels:[]};
 for(const [kind,layer]of Object.entries(def.extraLayers||{})){
  const src=layerPath(layer);if(!src)continue;
  const child=document.createElement('img');child.src=asset(src);child.alt='';child.draggable=false;child.className='exploration-'+kind;
  if(typeof layer==='object'&&layer.rect){const [x,y,w,h]=layer.rect;child.style.cssText=`left:${x*100}%;top:${y*100}%;width:${w*100}%;height:${h*100}%`;}
  visual.append(child);if(kind==='open'){r.open=child;child.style.opacity='0';}if(kind==='sail'){r.sail=child;r.base.style.zIndex='2';child.style.zIndex='1';child.style.transformOrigin=(layer.origin||[.5,1]).map(v=>v*100+'%').join(' ');}
 }
 if(def.motion==='lighthouse'){
  r.beam=makeEffect(r,'lighthouse-beam');const lamp=def.lamp||{x:.5,y:.16};r.beam.style.left=lamp.x*100+'%';r.beam.style.top=lamp.y*100+'%';
 }
 if(['boat','sailboat','buoy','pier','stream'].includes(def.motion)){
  r.rings=[];for(let i=0;i<3;i++){const ring=makeEffect(r,'water-ring');ring.style.top=(def.motion==='stream'?50:89)+'%';ring.style.left=(32+i*6)+'%';r.rings.push(ring);}
 }
 if(def.motion==='rover')for(const w of def.wheels||[]){const hub=makeEffect(r,'rover-wheel-spokes');hub.style.cssText=`left:${w.x*100}%;top:${w.y*100}%;width:${w.r*200}%;height:${w.r*200*width/height}%`;r.wheels.push({node:hub,radius:w.r*width});}
 if(['planet','stars','fireflies','crater'].includes(def.motion)){r.glow=makeEffect(r,'exploration-glow');}
 if(def.motion==='stars')setNight(!night);if(def.motion==='fireflies')setNight(true);
 orientation.style.transform=`scaleX(${face})`;poster.style.visibility='hidden';r.idle.style.visibility='hidden';el.classList.add('acting');el.querySelector('.sprite').append(action);active.set(el,r);render(r,0);
 const t0=performance.now();function tick(now){if(active.get(el)!==r)return;const p=clamp((now-t0)/r.duration);render(r,p);if(p<1)r.frame=requestAnimationFrame(tick);else stop(el);}r.frame=requestAnimationFrame(tick);
 return r;
}
g.ExplorationObjects={defs,play,stop,preload,attach,mountPanel,setNight,get night(){return night;},stopAll(){[...active.keys()].forEach(stop);},isActing:el=>active.has(el),seek(el,p){const r=active.get(el);if(r){cancelAnimationFrame(r.frame);render(r,p);}},inspect(el){const r=active.get(el);return r?{id:r.id,renderer:'exploration-rigid-originals',motion:r.def.motion,ready:r.ready,progress:r.progress,duration:r.duration,x:r.x,travel:r.travel,face:r.face,zoom:r.zoom,open:r.open?Number(r.open.style.opacity):null,sail:r.sail?.style.transform,wheels:r.wheels.length,night,beam:r.beam?Number(r.beam.style.opacity):null}:null;}};
})(window);
