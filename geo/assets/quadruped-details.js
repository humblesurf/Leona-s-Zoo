/* Secondary gestures on the leg-free quadruped torso. Parts come from the
   current painting; no complete poster or old stationary legs are layered
   back over the locomotion. All transforms are rigid and return to rest. */
(function(g){
'use strict';
const TAU=Math.PI*2,cache=new WeakMap();
const clamp=p=>Math.max(0,Math.min(1,p));
const ease=p=>{p=clamp(p);return p*p*p*(p*(p*6-15)+10);};
const selected={
 zebra:{head:'look',headAngle:.032,tail:.055},
 buffalo:{head:'graze',headAngle:-.085,snack:[.08,.477]},
 warthog:{head:'sniff',headAngle:-.070},
 rhino:{head:'smell',headAngle:.043},
 elephant:{trunk:-.175,ear:.032},
 elephantcalf:{trunk:-.150,ear:.038},
 lioness:{head:'look',headAngle:.044,tail:.038},
 tiger:{head:'look',headAngle:.042,tail:.032},
 jaguar:{head:'look',headAngle:.040},
 // Keep the accepted running silhouette intact while fixing its four feet.
 cheetah:{},
 polarbear:{head:'smell',headAngle:.046},
 arcticfox:{head:'listen',headAngle:.049,tail:.040},
 cow:{head:'graze',headAngle:-.088,snack:[.070,.435]},
 sheep:{head:'graze',headAngle:-.076,snack:[.070,.380]},
 pig:{head:'sniff',headAngle:-.072},
 calf:{head:'listen',headAngle:.040},
 lamb:{head:'graze',headAngle:-.048,snack:[.100,.440]},
 piglet:{head:'sniff',headAngle:-.052},
 lioncub:{head:'look',headAngle:-.048}
};
const tailMasks={
 zebra:{line:[[.795,.425],[.84,.535],[.885,.68],[.945,.765]],width:.059,pivot:[.80,.43]},
 lioness:{line:[[.77,.30],[.82,.49],[.885,.71],[.953,.795]],width:.062,pivot:[.785,.35]},
 tiger:{line:[[.805,.34],[.852,.515],[.89,.68],[.957,.775],[.975,.74]],width:.077,pivot:[.815,.36]},
 arcticfox:{poly:[[.625,.43],[.75,.48],[.86,.54],[1,.58],[1,.82],[.77,.88],[.65,.70]],pivot:[.65,.53]}
};
const heads={
 lioness:{poly:[[0,0],[.255,0],[.265,.18],[.245,.32],[.18,.42],[0,.43]],pivot:[.245,.27]},
 tiger:{poly:[[0,0],[.27,0],[.295,.18],[.26,.31],[.225,.42],[0,.445]],pivot:[.24,.30]},
 jaguar:{poly:[[0,0],[.25,0],[.28,.19],[.245,.36],[.19,.425],[0,.435]],pivot:[.23,.30]},
 polarbear:{poly:[[0,0],[.315,0],[.34,.23],[.285,.42],[.23,.52],[0,.54]],pivot:[.28,.36]},
 calf:{poly:[[0,0],[.66,0],[.65,.27],[.54,.46],[.41,.535],[0,.52]],pivot:[.47,.40]},
 lamb:{poly:[[0,0],[.76,0],[.79,.29],[.70,.40],[.55,.47],[.36,.55],[0,.53]],pivot:[.49,.42]}
};
function polygon(c,points,w,h){c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x*w,y*h):c.moveTo(x*w,y*h));c.closePath();}
function make(w,h){const c=document.createElement('canvas');c.width=w;c.height=h;return c;}
function maskFor(part,w,h){const mask=make(w,h),c=mask.getContext('2d');
 if(part.line){c.beginPath();part.line.forEach(([x,y],i)=>i?c.lineTo(x*w,y*h):c.moveTo(x*w,y*h));c.strokeStyle='#fff';c.lineWidth=part.width*w;c.lineCap='round';c.lineJoin='round';c.stroke();}
 else{polygon(c,part.poly,w,h);c.fillStyle='#fff';c.fill();}
 return mask;
}
function prepare(bodyCanvas,id){
 let byId=cache.get(bodyCanvas);if(byId?.has(id))return byId.get(id);
 if(!byId){byId=new Map();cache.set(bodyCanvas,byId);}
 const style=selected[id],rig=g.SpritePuppets?.rigs[id],w=bodyCanvas.width,h=bodyCanvas.height,base=make(w,h),bc=base.getContext('2d');bc.drawImage(bodyCanvas,0,0);
 const chosen=[];
 if(style&&rig){
  for(const original of rig.parts){
   if(original.type==='head'&&style.head){
    let p={...original,poly:original.poly.map(v=>v.slice()),mode:style.head,amplitude:style.headAngle};
    // The bear's old mask reached the shoulder. Keep this head gesture above
    // its front-leg socket; the broad neck still covers the turning seam.
    if(heads[id])Object.assign(p,heads[id],{socket:.085});
    p.seam=id==='lioncub'?[[.53,0],[.56,.38],[.66,.54]]:p.poly.slice(1,-1);
    chosen.push(p);
   }
   if(original.type==='trunk'&&style.trunk){
    const lower=id==='elephant'?{poly:[[.035,.66],[.155,.66],[.17,.82],[.23,.97],[.12,1],[.015,.89]],pivot:[.10,.69]}:{poly:[[.025,.55],[.17,.55],[.15,.80],[.25,.96],[.12,1],[0,.89]],pivot:[.095,.60]};
    chosen.push({...original,...lower,mode:'trunk',amplitude:style.trunk,socket:.060});
   }
   // A small ear flap covers its unchanged base rather than exposing a
   // long cut along the shoulder; the outer silhouette only moves a few px.
   if(original.type==='ear'&&style.ear)chosen.push({...original,mode:'ear',amplitude:style.ear,keepBase:true});
  }
  if(style.tail&&tailMasks[id])chosen.push({...tailMasks[id],type:'tail',mode:'tail',amplitude:style.tail,socket:.066});
 }
 const layers=[];
 for(const part of chosen){const mask=maskFor(part,w,h),layer=make(w,h),c=layer.getContext('2d');c.drawImage(bodyCanvas,0,0);c.globalCompositeOperation='destination-in';c.drawImage(mask,0,0);
  if(!part.keepBase){bc.globalCompositeOperation='destination-out';bc.drawImage(mask,0,0);bc.globalCompositeOperation='source-over';}
  // Restore only the connected side of the cut, avoiding a stationary copy
  // of the face or tail contour. The socket remains behind the rotating part.
  const socket=make(w,h),sc=socket.getContext('2d'),radius=(part.socket||.064)*Math.min(w,h);
  sc.fillStyle='#fff';sc.beginPath();sc.arc(part.pivot[0]*w,part.pivot[1]*h,radius,0,TAU);sc.fill();
  if(part.seam){sc.strokeStyle='#fff';sc.lineWidth=Math.min(w,h)*.075;sc.lineCap='round';sc.lineJoin='round';sc.beginPath();part.seam.forEach(([x,y],i)=>i?sc.lineTo(x*w,y*h):sc.moveTo(x*w,y*h));sc.stroke();}
  sc.globalCompositeOperation='source-in';sc.drawImage(bodyCanvas,0,0);bc.drawImage(socket,0,0);
  layers.push({...part,image:layer});
 }
 const result={id,source:bodyCanvas,body:base,layers,w,h};byId.set(id,result);return result;
}
function angle(part,state){const p=clamp(state.progress||0),time=Number.isFinite(state.time)?state.time:p*5;
 const moving=ease(p/.14)*ease((1-p)/.16),arrival=ease((p-.48)/.18)*ease((.99-p)/.15);
 if(part.mode==='tail')return part.amplitude*Math.sin(time*TAU*.47)*moving;
 if(part.mode==='ear')return part.amplitude*Math.sin(time*TAU*.67)*moving;
 if(part.mode==='trunk')return part.amplitude*arrival*(.82+.18*Math.cos(time*2));
 if(part.mode==='graze')return part.amplitude*arrival+.008*Math.sin(time*TAU*1.15)*arrival;
 if(part.mode==='sniff')return part.amplitude*arrival*(.68+.32*Math.sin(time*TAU*.68)**2);
 if(part.mode==='listen')return part.amplitude*arrival*(.85+.15*Math.cos(time*TAU*.5));
 if(part.mode==='smell')return part.amplitude*arrival*(.88+.12*Math.sin(time*TAU*.65));
 return part.amplitude*arrival;
}
function draw(ctx,prepared,state={}){const p=clamp(state.progress||0);
 // Exact untouched endpoints avoid a brightness change and ensure no leg
 // fragments are introduced when the gesture returns to the resting art.
 if(p<.000001||p>.999999||!prepared.layers.length){ctx.drawImage(prepared.source,0,0);return;}
 ctx.drawImage(prepared.body,0,0);
 for(const part of prepared.layers){const a=angle(part,state),x=part.pivot[0]*prepared.w,y=part.pivot[1]*prepared.h;ctx.save();ctx.translate(x,y);ctx.rotate(a);ctx.translate(-x,-y);ctx.drawImage(part.image,0,0);
  const snack=selected[prepared.id]?.snack,arrival=ease((p-.52)/.13)*ease((.99-p)/.15);
  if(part.mode==='graze'&&snack&&arrival>.001){const w=prepared.w,h=prepared.h,time=Number.isFinite(state.time)?state.time:p*5,chew=.87+.13*Math.cos(time*TAU*1.15);ctx.save();ctx.translate(snack[0]*w,snack[1]*h);ctx.scale(chew,1);ctx.globalAlpha*=arrival;ctx.lineCap='round';
   for(let i=0;i<3;i++){const length=w*(.033+.009*i);ctx.strokeStyle=i===1?'#6c8d38':'#89a84d';ctx.lineWidth=Math.max(1.2,w*.0036);ctx.beginPath();ctx.moveTo(0,0);ctx.quadraticCurveTo(-length*.45,h*(.005+i*.007),-length,h*(.022+i*.010));ctx.stroke();}ctx.restore();
  }
  ctx.restore();}
}
g.QuadrupedDetails={prepare,draw,angle,styles:selected,inspect(prepared,state){return prepared.layers.map(part=>({type:part.type,mode:part.mode,pivot:part.pivot,angle:angle(part,state)}));},renderer:'rigid-torso-details'};
})(window);
