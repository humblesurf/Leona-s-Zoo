/* V4.6.1: clearly alternating cheetah fast trot. Other species retain V4.6
   gaits and details; separate limb roots and planted stance paws remain. */
(function(g){
'use strict';
const baseline=g.QuadrupedWalk,TAU=Math.PI*2,cache=new Map();
g.QuadrupedWalkBaseline=baseline;
const styles={
 elephant:{cadence:.46,minMs:4700,bob:.0018,pitch:.0025},
 elephantcalf:{cadence:.63,minMs:3800,bob:.003,pitch:.0035},
 rhino:{cadence:.48,minMs:4500,bob:.002,pitch:.003},
 buffalo:{cadence:.50,minMs:4200,bob:.0025,pitch:.003},
 polarbear:{cadence:.51,minMs:4300,bob:.003,pitch:.003},
 zebra:{gait:'trot',duty:.56,lift:.040,cadence:.97,minMs:2900,bob:.0035,pitch:.0045,travelFactor:.55},
 warthog:{gait:'trot',duty:.58,lift:.037,cadence:1.13,minMs:2600,bob:.004,pitch:.0045,travelFactor:.55},
 cow:{cadence:.56,minMs:3800,bob:.0025,pitch:.003},
 sheep:{cadence:.65,minMs:3400,bob:.003,pitch:.0035},
 pig:{gait:'trot',duty:.58,lift:.035,cadence:1.01,minMs:2850,bob:.0035,pitch:.004},
 calf:{gait:'trot',duty:.56,lift:.042,cadence:1.13,minMs:2600,bob:.004,pitch:.004},
 lamb:{gait:'trot',duty:.55,lift:.042,cadence:1.19,minMs:2550,bob:.004,pitch:.0045},
 piglet:{gait:'trot',duty:.58,lift:.035,cadence:1.28,minMs:2400,bob:.0045,pitch:.0045},
 lioness:{gait:'trot',duty:.55,lift:.049,cadence:.91,minMs:3000,bob:.004,pitch:.005},
 jaguar:{gait:'trot',duty:.54,lift:.048,cadence:.96,minMs:2900,bob:.0035,pitch:.0055},
 lioncub:{gait:'trot',duty:.56,lift:.042,cadence:1.15,minMs:2600,bob:.0045,pitch:.0045},
 arcticfox:{gait:'trot',duty:.53,lift:.051,cadence:1.22,minMs:2450,bob:.0045,pitch:.005,travelFactor:.60},
 tiger:{gait:'trot',duty:.48,lift:.052,cadence:1.03,minMs:2300,bob:.006,pitch:.008,travelFactor:.60},
 // This 2D short run uses a fast diagonal trot, not a simulated high-speed
 // rotary gallop. Front legs are half a cycle apart, visibly taking turns.
 cheetah:{gait:'trot',duty:.48,lift:.052,liftPower:3,stride:.30,cadence:1.65,minMs:2100,bob:.004,pitch:.011,travelFactor:.68}
};
const phaseMaps={trot:{'near-hind':0,'far-front':0,'far-hind':.5,'near-front':.5},gallop:{'far-hind':0,'near-hind':.90,'far-front':.50,'near-front':.40}};
const profiles=Object.fromEntries(Object.entries(baseline.profiles).map(([id,original])=>{
 const p={...original,...styles[id],id,gait:styles[id]?.gait||'walk',legs:original.legs.map(l=>({...l}))};
 if(phaseMaps[p.gait])for(const l of p.legs)l.phase=phaseMaps[p.gait][l.name];
 return [id,p];
}));
const ease=baseline.ease,wrap=a=>Math.atan2(Math.sin(a),Math.cos(a));
function prepare(img,id){
 const key=id+':'+img.currentSrc;if(cache.has(key))return cache.get(key);
 const original=baseline.prepare(img,id),profile=profiles[id];
 const layers=original.layers.map(l=>({...l,phase:profile.legs.find(p=>p.name===l.name).phase}));
 // Front/hind depth offsets can have opposite signs (especially cheetah).
 // Averaging them collapses the far pair into the near pair. Use each
 // painted hip's own x coordinate without changing its root height or gait.
 for(const l of layers.filter(l=>l.far)){
  l.root=[profile.legs.find(p=>p.name===l.name).hip[0]*original.w,l.root[1]];
  l.center=l.root[0];
 }
 // Leave clearance for the small shoulder/hip pitch. Preserve existing art.
 const stride=Math.min(profile.stride*original.h,original.stride*(profile.gait==='walk'?.94:1.04));
 const result={...original,layers,stride,profile,details:g.QuadrupedDetails?.prepare(original.body,id),transition:null};cache.set(key,result);while(cache.size>10)cache.delete(cache.keys().next().value);return result;
}
function torso(profile,state,w,h){
 const e=state.envelope||0,stride=state.stride||profile.stride*h,cycle=state.distance*h*profile.duty/stride;
 const phase=((cycle%1)+1)%1;
 let flight=0;
 if(profile.gait==='gallop'){
  // Body rise spans push-off, suspension and landing. Restricting it to the
  // tiny airborne interval would compress the lift into one or two frames.
  for(const center of [.47,.97]){const delta=Math.abs(wrap((phase-center)*TAU))/TAU;if(delta<.11)flight=Math.max(flight,Math.cos(delta/.11*Math.PI/2)**4);}
 }
 const bodyY=(.018+profile.bob*Math.cos(cycle*TAU*2)-(profile.flight||0)*flight)*h*e;
 const pitch=profile.pitch*Math.sin(cycle*TAU+(profile.gait==='gallop'?.5:0))*e;
 const roots=profile.legs.filter(l=>!l.far).map(l=>l.hip),cx=(roots[0][0]+roots[1][0])*w/2,cy=(roots[0][1]+roots[1][1])*h/2;
 return {bodyY,pitch,cx,cy,cycle,flight};
}
function solve(root,K,F,target,L1,L2,bend){
 const dx=target[0]-root[0],dy=target[1]-root[1],actual=Math.hypot(dx,dy),distance=Math.max(Math.abs(L1-L2)+.0001,Math.min(L1+L2-.0001,actual));
 const ux=dx/(actual||1),uy=dy/(actual||1),a=(L1*L1-L2*L2+distance*distance)/(2*distance),b=Math.sqrt(Math.max(0,L1*L1-a*a))*bend;
 const knee=[root[0]+ux*a-uy*b,root[1]+uy*a+ux*b],foot=[root[0]+ux*distance,root[1]+uy*distance];
 return {upper:Math.atan2(knee[1]-root[1],knee[0]-root[0])-Math.atan2(K[1]-root[1],K[0]-root[0]),lower:Math.atan2(foot[1]-knee[1],foot[0]-knee[0])-Math.atan2(F[1]-K[1],F[0]-K[0]),reachError:Math.abs(actual-distance)};
}
function pose(profile,l,state,w,h){
 const e=state.envelope||0,stride=state.stride||profile.stride*h,body=torso(profile,state,w,h),phase=((body.cycle+l.phase)%1+1)%1,stance=phase<profile.duty;
 let horizontal,lift=0,toe=0;
 if(stance)horizontal=.5-phase/profile.duty;
 else{
  const u=(phase-profile.duty)/(1-profile.duty),m=-(1-profile.duty)/profile.duty;
  horizontal=-.5+(1-m)*ease(u)+m*u;
  // The cheetah's faster alternating trot needs a broader lift arc than
  // the old concentrated gallop lift. Cubic sine still joins the ground
  // with zero velocity and acceleration, avoiding a sharp knee fold.
  lift=profile.lift*h*Math.sin(Math.PI*u)**(profile.liftPower||4);
  // Rotate an airborne paw only; a planted contact must not rock or slide.
  toe=profile.face*(profile.gait==='walk'?.085:.15)*Math.sin(Math.PI*u)**2;
 }
 const cos=Math.cos(body.pitch),sin=Math.sin(body.pitch),dx=l.H[0]*(1-e)+l.root[0]*e-body.cx,dy=l.H[1]*(1-e)+l.root[1]*e-body.cy;
 const moved=[body.cx+dx*cos-dy*sin,body.cy+dx*sin+dy*cos];
 const root=moved;
 const neutral=[l.center+profile.face*stride*horizontal,l.ankleGround-lift-body.bodyY];
 const target=[l.F[0]*(1-e)+neutral[0]*e,l.F[1]*(1-e)+neutral[1]*e];
 const shift=[root[0]-l.H[0],root[1]-l.H[1]],K=[l.K[0]+shift[0],l.K[1]+shift[1]],F=[l.F[0]+shift[0],l.F[1]+shift[1]];
 const ik=solve(root,K,F,target,l.L1,l.L2,l.bend),upper=wrap(ik.upper)*e,lower=wrap(ik.lower)*e;
 const knee=[root[0]+(l.K[0]-l.H[0])*Math.cos(upper)-(l.K[1]-l.H[1])*Math.sin(upper),root[1]+(l.K[0]-l.H[0])*Math.sin(upper)+(l.K[1]-l.H[1])*Math.cos(upper)];
 const foot=[knee[0]+(l.F[0]-l.K[0])*Math.cos(lower)-(l.F[1]-l.K[1])*Math.sin(lower),knee[1]+(l.F[0]-l.K[0])*Math.sin(lower)+(l.F[1]-l.K[1])*Math.cos(lower)];
 return {...ik,root,knee,foot,upper,lower,toe:toe*e,phase,stance,drop:body.bodyY,groundY:l.ground,target,body};
}
function paint(ctx,r,state,w,h){
 const s={...state,stride:r.stride},body=torso(r.profile,s,r.w,r.h),poses=r.layers.map(l=>pose(r.profile,l,s,r.w,r.h));
 ctx.save();ctx.scale(w/r.w,h/r.h);ctx.translate(0,body.bodyY);
 const part=(bitmap,origin,angle,source)=>{ctx.save();ctx.translate(...origin);ctx.rotate(angle);ctx.translate(-source[0],-source[1]);ctx.drawImage(bitmap.image,bitmap.x,bitmap.y);ctx.restore();};
 const limb=(l,p)=>{part(l.upper,p.root,p.upper,l.H);part(l.lower,p.knee,p.lower,l.K);part(l.footLayer,p.foot,p.toe,l.F);};
 r.layers.forEach((l,i)=>{if(l.far)limb(l,poses[i]);});
 ctx.save();ctx.translate(body.cx,body.cy);ctx.rotate(body.pitch);ctx.translate(-body.cx,-body.cy);
 if(r.details)g.QuadrupedDetails.draw(ctx,r.details,s);else ctx.drawImage(r.body,0,0);
 ctx.restore();
 r.layers.forEach((l,i)=>{if(!l.far)limb(l,poses[i]);});ctx.restore();
}
function draw(ctx,id,img,state,w,h){
 const blend=state?.envelope||0;if(blend<.000001){ctx.drawImage(img,0,0,w,h);return;}
 const r=prepare(img,id);if(blend===1){paint(ctx,r,state,w,h);return;}
 if(!r.transition){r.transition=document.createElement('canvas');r.transition.width=r.w;r.transition.height=r.h;}
 const c=r.transition.getContext('2d');c.clearRect(0,0,r.w,r.h);paint(c,r,state,r.w,r.h);
 ctx.save();ctx.globalAlpha*=1-blend;ctx.drawImage(img,0,0,w,h);ctx.restore();ctx.save();ctx.globalCompositeOperation='lighter';ctx.globalAlpha*=blend;ctx.drawImage(r.transition,0,0,w,h);ctx.restore();
}
function duration(r,travel,fit){
 const cycles=Math.abs(travel)/(fit*1.1)*r.profile.duty/r.stride;
 return Math.max(r.profile.minMs,Math.min(6900,1000*cycles/(r.profile.cadence*.5544)));
}
g.QuadrupedWalk={...baseline,profiles,prepare,pose,draw,duration,torso,inspect(id,img,state){const r=prepare(img,id);return r.layers.map(l=>{const p=pose(profiles[id],l,{...state,stride:r.stride},r.w,r.h);return {name:l.name,stance:p.stance,phase:p.phase,foot:p.foot.map((x,i)=>x/(i?r.h:r.w)),drop:p.drop/r.h,groundY:p.groundY/r.h,reachError:p.reachError/r.h,upper:p.upper,lower:p.lower,toe:p.toe,pitch:p.body.pitch,flight:p.body.flight,gait:r.profile.gait};});}};
})(window);
