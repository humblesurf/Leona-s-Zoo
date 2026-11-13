/* Uniform emphasis sits outside the drawing; rigid wheels rotate in circular hubs. */
(function(g){
 'use strict';const api=g.AnimalAnims,old={};for(const key of ['play','stop','stopAll','isActing'])old[key]=api[key].bind(api);
 const active=new Map(),pulses=new Map(),reduced=matchMedia('(prefers-reduced-motion: reduce)');
 function stopLocal(el){const r=active.get(el);if(!r)return;cancelAnimationFrame(r.raf);r.animation?.cancel();r.canvas?.remove();r.image.style.visibility='';el.classList.remove('acting');active.delete(el);}
 function stopPulse(el){const r=pulses.get(el);if(!r)return;cancelAnimationFrame(r.raf);r.animation.cancel();pulses.delete(el);el.dataset.emphasis='1';}
 function emphasize(el){
  stopPulse(el);const target=el.querySelector('.sprite');if(!target)return;
  const r={animation:target.animate([{scale:'1'},{scale:'1.15'}],{duration:reduced.matches?0:190,easing:'ease-out',fill:'forwards'}),raf:0,start:performance.now()};pulses.set(el,r);el.dataset.emphasis='1.15';
  function watch(now){if(pulses.get(el)!==r)return;if(now-r.start<450||api.isActing(el)){r.raf=requestAnimationFrame(watch);return;}
   r.animation.cancel();r.animation=target.animate([{scale:'1.15'},{scale:'1'}],{duration:reduced.matches?0:220,easing:'ease-in-out'});r.animation.finished.then(()=>{if(pulses.get(el)===r){pulses.delete(el);el.dataset.emphasis='1';}}).catch(()=>{});
  }r.raf=requestAnimationFrame(watch);
 }
 function custom(el,id){
  if(!['tractor','shark','hen','duck','duckling'].includes(id)&&!id.startsWith('decor-'))return false;
  stopLocal(el);const image=el.querySelector('.idle-layer img');if(!image?.complete||!image.naturalWidth)return false;
  const r={image,raf:0,canvas:null,animation:null};active.set(el,r);el.classList.add('acting');
  if(id!=='tractor'){
   const duration=reduced.matches?250:1800,move=id==='shark'?'translateX(5%) rotate(-1deg)':['hen','duck','duckling'].includes(id)?'translateY(-2%) rotate(1.5deg)':'rotate(1deg)';
   r.animation=image.animate([{transform:'none'},{transform:move,offset:.4},{transform:'none'}],{duration,easing:'ease-in-out'});r.animation.finished.then(()=>{if(active.get(el)===r)stopLocal(el);}).catch(()=>{});return true;
  }
  const layer=el.querySelector('.orientation'),width=parseFloat(layer.style.width),height=parseFloat(layer.style.height),canvas=document.createElement('canvas'),dpr=Math.min(2,g.devicePixelRatio||1);
  canvas.width=Math.ceil(width*dpr);canvas.height=Math.ceil(height*dpr);canvas.className='animal-frames tractor-rigid';canvas.style.cssText=`width:${width}px;height:${height}px;left:0;top:0`;el.querySelector('.sprite').append(canvas);r.canvas=canvas;image.style.visibility='hidden';
  const c=canvas.getContext('2d');c.setTransform(dpr,0,0,dpr,0,0);c.imageSmoothingQuality='high';const started=performance.now();
  function draw(now){if(active.get(el)!==r)return;const p=Math.min(1,(now-started)/2200),angle=(p*p*(3-2*p))*Math.PI*4;
   c.clearRect(0,0,width,height);c.drawImage(image,0,0,width,height);
   // Only the round hubs turn. Tires and fenders keep their exact painted contours.
   for(const [nx,ny,nr]of [[.251,.759,.069],[.800,.655,.099]]){const x=nx*width,y=ny*height,radius=nr*width;c.save();c.beginPath();c.arc(x,y,radius,0,Math.PI*2);c.clip();c.translate(x,y);c.rotate(angle);c.drawImage(image,-x,-y,width,height);c.restore();}
   el.dataset.wheelAngle=String(angle);if(p<1&&!reduced.matches)r.raf=requestAnimationFrame(draw);else stopLocal(el);
  }r.raf=requestAnimationFrame(draw);return true;
 }
 api.play=(el,id=el?.dataset.id)=>{if(!el)return false;const result=custom(el,id)||old.play(el,id);emphasize(el);return result;};
 api.stop=el=>{stopLocal(el);stopPulse(el);old.stop(el);};
 api.stopAll=()=>{[...active.keys()].forEach(stopLocal);[...pulses.keys()].forEach(stopPulse);old.stopAll();};
 api.isActing=el=>active.has(el)||old.isActing(el);
})(window);
