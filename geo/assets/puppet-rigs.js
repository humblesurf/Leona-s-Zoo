/* Continuous cutout character animation: one immutable painting, rigid joint
   transforms and overlapping sockets. No mesh deformation or AI frame cycling.
   Grounded characters perform species-specific gestures rather than slide. */
(function(g){
'use strict';
const rigs={},cache=new Map(),TAU=Math.PI*2;
const clamp=x=>Math.max(0,Math.min(1,x));
const ease=x=>{x=clamp(x);return x*x*x*(x*(x*6-15)+10);};
const hold=p=>ease(p/.23)*ease((1-p)/.25);
const head=(poly,pivot,angle=.065)=>({poly,pivot,angle,type:'head',socket:.068});
const tail=(poly,pivot,angle=.11)=>({poly,pivot,angle,type:'tail',socket:.035});
const part=(poly,pivot,angle,type,socket=.04)=>({poly,pivot,angle,type,socket});
const define=(id,label,parts,extra={})=>rigs[id]={label,parts,duration:4200,travel:0,face:0,...extra};
define('zebra','抬蹄轻踏、转耳朵、甩尾',[
 head([[0,0],[.36,0],[.39,.29],[.35,.48],[.24,.53],[0,.50]],[.34,.40],.045),
 tail([[.76,.35],[1,.35],[1,.85],[.88,.82],[.79,.56]],[.80,.43],.10)
]);
define('giraffe','伸长脖子够树叶、慢慢咀嚼',[
 part([[0,0],[.42,0],[.46,.36],[.535,.46],[.535,.52],[.49,.555],[.425,.54],[.30,.46],[0,.40]],[.475,.515],.19,'browseNeck',.073),
 {...part([[0,0],[.42,0],[.405,.282],[.345,.338],[.265,.36],[0,.40]],[.325,.293],-.08,'browseHead',.048),parent:0},
 {...tail([[.72,.56],[.94,.55],[1,.87],[.80,.85],[.75,.69]],[.76,.61],.085),stationary:true},
 // A small painted lower jaw belongs to the head, which belongs to the neck.
 // Moving this rigid layer opens the real muzzle rather than bobbing its head.
 {...part([[.124,.350],[.168,.352],[.206,.336],[.225,.342],[.194,.364],[.138,.370],[.117,.360]],[.209,.345],-.105,'browseJaw',.014),parent:1}
],{duration:6000,leaf:true});
define('buffalo','低头吃草、嚼一嚼、尾巴驱虫',[
 head([[0,0],[.47,0],[.49,.33],[.39,.52],[.21,.62],[0,.59]],[.39,.41],-.080),
 tail([[.83,.15],[1,.17],[1,.75],[.92,.74],[.87,.36]],[.89,.27],.12)
]);
define('warthog','低头拱食、抬头嗅一嗅',[
 head([[0,0],[.40,0],[.39,.34],[.32,.59],[0,.65]],[.33,.42],-.075),
 tail([[.84,0],[1,0],[1,.49],[.89,.46]],[.90,.35],.14)
]);
define('rhino','沉稳低头嗅探、摆耳朵',[
 head([[0,0],[.38,0],[.42,.30],[.38,.55],[.18,.61],[0,.61]],[.36,.41],.045),
 tail([[.86,.24],[1,.22],[1,.73],[.92,.72]],[.92,.38],.085)
]);
define('elephant','慢慢扇耳、卷起长鼻打招呼',[
 part([[.02,.46],[.17,.47],[.16,.70],[.06,.72],[0,.58]],[.12,.52],-.40,'trunk',.07),
 {...part([[.02,.66],[.155,.68],[.16,.92],[.11,.995],[.02,.97],[0,.80]],[.10,.72],-1.35,'trunkTip',.05),parent:0},
 part([[.37,.035],[.53,.04],[.65,.19],[.64,.40],[.55,.58],[.38,.55],[.31,.32]],[.40,.20],.075,'ear',.072),
 tail([[.88,.38],[1,.38],[1,.96],[.93,.96]],[.93,.50],.085)
]);
define('elephantcalf','摆摆大耳朵、用小鼻子问好',[
 part([[0,.41],[.22,.42],[.20,.81],[.28,.95],[.14,.99],[0,.84]],[.14,.48],-.12,'trunk',.06),
 part([[.32,.03],[.53,.03],[.65,.21],[.57,.47],[.36,.46],[.28,.29]],[.40,.18],.065,'ear',.07)
]);
define('lion','抬头低吼、轻甩尾巴',[
 head([[.43,0],[1,0],[1,.51],[.73,.63],[.53,.53]],[.63,.45],-.045),
 tail([[0,.37],[.24,.37],[.26,.66],[.12,.86],[0,.82]],[.22,.59],.12)
],{roar:true});
define('lioness','抬头张望、轻轻摆尾',[
 head([[0,0],[.37,0],[.38,.31],[.30,.51],[0,.54]],[.31,.38],-.065),
 tail([[.83,.26],[1,.26],[1,.86],[.93,.88],[.87,.47]],[.88,.38],.10)
]);
define('lioncub','探头看一看、轻轻伸爪邀请玩耍',[
 head([[.53,0],[1,0],[1,.49],[.66,.54],[.56,.38]],[.66,.39],-.06),
 part([[.62,.57],[.84,.56],[.99,.92],[.98,.99],[.77,.95]],[.76,.62],-.07,'paw',.05)
]);
define('cheetah','抬起前爪、探头观察、长尾轻摆',[
 head([[0,0],[.31,0],[.34,.30],[.24,.47],[0,.46]],[.25,.30],-.05),
 tail([[.69,.16],[1,.17],[1,.61],[.88,.63],[.72,.43]],[.74,.30],.10),
 part([[.20,.39],[.33,.44],[.24,.79],[0,.86],[0,.73],[.17,.64]],[.26,.49],.055,'paw',.04)
]);
define('gazelle','抬头听一听、摆动短尾',[
 head([[0,0],[.38,0],[.41,.21],[.30,.42],[0,.47]],[.31,.29],-.06),
 tail([[.79,.27],[1,.20],[1,.58],[.86,.60]],[.87,.44],.11)
]);
define('hippo','张大嘴打招呼、耳朵轻动',[
 head([[0,0],[.38,0],[.44,.24],[.37,.53],[.21,.61],[0,.59]],[.34,.40],-.02),
 {...part([[.03,.515],[.16,.508],[.245,.525],[.26,.61],[.175,.705],[.035,.685]],[.24,.528],.95,'jaw',.028),parent:0}
]);
define('jaguar','停稳探头、前爪轻轻伸出、摆尾',[
 head([[0,0],[.34,0],[.36,.24],[.28,.43],[0,.43]],[.27,.29],-.05),
 tail([[.79,.17],[1,.17],[1,.81],[.88,.84],[.82,.47]],[.85,.35],.09)
]);
define('tiger','探头张望、轻摆尾巴',[
 head([[0,0],[.37,0],[.39,.24],[.31,.49],[0,.53]],[.31,.35],-.055),
 tail([[.80,.18],[1,.15],[1,.93],[.89,.93],[.83,.48]],[.87,.37],.09)
]);
define('polarbear','抬头闻一闻、轻轻探爪',[
 head([[0,0],[.38,0],[.41,.27],[.32,.52],[0,.55]],[.32,.38],-.05)
]);
define('arcticfox','探头听一听、蓬松尾巴轻摆',[
 head([[0,0],[.38,0],[.40,.22],[.30,.48],[0,.52]],[.31,.32],-.055),
 tail([[.60,.31],[1,.21],[1,.76],[.64,.73]],[.66,.51],.08)
]);
define('boa','盘绕稳稳不动、抬头观察、吐小舌头',[
 head([[0,.08],[.49,.08],[.54,.32],[.43,.48],[.18,.50],[0,.47]],[.43,.39],-.045)
],{tongue:{x:.075,y:.39,face:-1}});
define('cow','嚼一嚼草叶、慢慢摆尾',[
 head([[0,0],[.34,0],[.39,.22],[.37,.42],[.24,.58],[0,.59]],[.32,.40],-.080),
 tail([[.87,.28],[1,.28],[1,.87],[.93,.87],[.89,.48]],[.92,.39],.10)
],{snack:{x:.07,y:.42}});
define('sheep','低头闻草叶、轻轻咀嚼',[
 head([[0,0],[.40,0],[.43,.28],[.36,.48],[.22,.60],[0,.54]],[.34,.40],-.07)
],{snack:{x:.07,y:.37}});
define('pig','鼻子闻闻、低头拱一拱',[
 head([[0,0],[.37,0],[.41,.29],[.32,.62],[0,.65]],[.32,.44],-.075)
]);
define('hen','低头啄一啄、鸡窝里出现鸡蛋',[
 head([[0,0],[.35,0],[.37,.25],[.25,.50],[0,.45]],[.26,.32],-.055)
],{egg:true});
define('duck','池边探头、轻轻摆翅膀',[
 head([[0,0],[.42,0],[.45,.26],[.34,.49],[0,.48]],[.35,.33],-.045),
 part([[.43,.41],[.77,.41],[.90,.61],[.84,.79],[.49,.68]],[.48,.49],.035,'ear',.06)
]);
define('calf','探头看看、摆摆小耳朵',[
 head([[0,0],[.66,0],[.65,.31],[.60,.46],[.42,.58],[0,.54]],[.49,.46],-.045),
 tail([[.87,.31],[1,.31],[1,.80],[.92,.80]],[.91,.47],.07)
]);
define('lamb','轻轻低头闻草',[
 head([[0,0],[.67,0],[.70,.27],[.56,.47],[.36,.59],[0,.54]],[.48,.44],-.045)
]);
define('piglet','小鼻子嗅一嗅',[
 head([[0,0],[.67,0],[.66,.35],[.54,.56],[.33,.63],[0,.59]],[.49,.45],-.045)
]);
define('chick','点点头、轻摆小翅膀',[
 head([[0,0],[.61,0],[.66,.30],[.58,.48],[.28,.51],[0,.47]],[.46,.42],-.045),
 part([[.49,.44],[.80,.47],[.92,.61],[.78,.75],[.51,.65]],[.52,.49],.035,'ear',.06)
]);
define('duckling','探头看看、轻摆小翅膀',[
 head([[0,0],[.63,0],[.65,.29],[.53,.48],[.25,.52],[0,.47]],[.47,.41],-.045),
 part([[.50,.46],[.82,.46],[.90,.63],[.76,.72],[.50,.65]],[.54,.49],.035,'ear',.06)
]);
const oval=(x,y,rx,ry)=>Array.from({length:24},(_,i)=>[x+rx*Math.cos(i*TAU/24),y+ry*Math.sin(i*TAU/24)]);
define('tractor','车轮连续转动、慢慢向前驶',[
 part(oval(.239,.776,.157,.229),[.239,.776],TAU,'wheel',.02),
 part(oval(.801,.694,.209,.304),[.801,.694],TAU,'wheel',.02)
]);
function path(ctx,poly,w,h){ctx.beginPath();poly.forEach(([x,y],i)=>i?ctx.lineTo(x*w,y*h):ctx.moveTo(x*w,y*h));ctx.closePath();}
// A giraffe reaches from the shoulder, then balances its head at the top of
// that neck. Both joints use the same continuous timeline as the leaf tip.
function giraffeReach(p){return ease((p-.10)/.30)*ease((.98-p)/.23);}
function giraffeBite(p){return ease((p-.39)/.08)*ease((.80-p)/.10);}
function giraffePose(p){const reach=giraffeReach(p),bite=giraffeBite(p),t=p*6;
 return {reach,bite,neck:.19*reach,head:-.080*reach+.006*Math.sin(t*TAU*.85)*bite,jaw:-.105*(.5-.5*Math.cos(t*TAU*.85))*bite};
}
function giraffeMouth(p,aspect=475/452){const pose=giraffePose(p),neck=rigs.giraffe.parts[0],head=rigs.giraffe.parts[1];
 const turn=([x,y],pivot,a)=>{const dx=(x-pivot[0])*aspect,dy=y-pivot[1],c=Math.cos(a),s=Math.sin(a);return [pivot[0]+(dx*c-dy*s)/aspect,pivot[1]+dx*s+dy*c];};
 const mouth=turn(turn([.149,.351],head.pivot,pose.head),neck.pivot,pose.neck);
 return {x:mouth[0],y:mouth[1],angle:pose.neck+pose.head,bite:pose.bite,reach:pose.reach,jaw:pose.jaw};
}
function prepareGiraffe(img,rig,w,h,make){const body=make(),bc=body.getContext('2d');bc.drawImage(img,0,0);
 const layers=rig.parts.map(part=>{const layer=make(),c=layer.getContext('2d');c.save();path(c,part.poly,w,h);c.clip();c.drawImage(img,0,0);c.restore();return {...part,layer};});
 // Remove the complete original neck and restore only its shoulder socket.
 // Restoring every edge of the source mask would leave a ghost neck behind.
 for(const part of [rig.parts[0]]){bc.globalCompositeOperation='destination-out';path(bc,part.poly,w,h);bc.fill();bc.globalCompositeOperation='source-over';bc.save();bc.beginPath();bc.ellipse(part.pivot[0]*w,part.pivot[1]*h,part.socket*Math.min(w,h),part.socket*Math.min(w,h),0,0,TAU);bc.clip();bc.drawImage(img,0,0);bc.restore();}
 const nc=layers[0].layer.getContext('2d'),head=rig.parts[1];nc.globalCompositeOperation='destination-out';path(nc,head.poly,w,h);nc.fill();nc.globalCompositeOperation='source-over';nc.save();nc.beginPath();nc.arc(head.pivot[0]*w,head.pivot[1]*h,head.socket*Math.min(w,h),0,TAU);nc.clip();nc.drawImage(img,0,0);nc.restore();
 const jaw=rig.parts[3],hc=layers[1].layer.getContext('2d');hc.globalCompositeOperation='destination-out';path(hc,jaw.poly,w,h);hc.fill();hc.globalCompositeOperation='source-over';hc.save();hc.beginPath();hc.arc(jaw.pivot[0]*w,jaw.pivot[1]*h,jaw.socket*Math.min(w,h),0,TAU);hc.clip();hc.drawImage(img,0,0);hc.restore();
 return {body,layers,w,h};
}
function prepare(img,id){const key=id+':'+img.currentSrc;if(cache.has(key)){const value=cache.get(key);cache.delete(key);cache.set(key,value);return value;}
 const rig=rigs[id],w=img.naturalWidth,h=img.naturalHeight;
 const make=()=>{const c=document.createElement('canvas');c.width=w;c.height=h;return c;};
 if(id==='giraffe'){const value=prepareGiraffe(img,rig,w,h,make);cache.set(key,value);while(cache.size>12)cache.delete(cache.keys().next().value);return value;}
 const body=make(),bc=body.getContext('2d');bc.drawImage(img,0,0);
 const layers=rig.parts.map(part=>{const layer=make(),c=layer.getContext('2d');c.save();path(c,part.poly,w,h);c.clip();c.drawImage(img,0,0);c.restore();
  bc.globalCompositeOperation='destination-out';path(bc,part.poly,w,h);bc.fill();
  if(part.type==='step'&&part.foot){bc.beginPath();bc.ellipse(part.foot[0]*w,part.foot[1]*h,Math.min(w,h)*.14,Math.min(w,h)*.12,0,0,TAU);bc.fill();}
  bc.globalCompositeOperation='source-over';
  // Restore a stationary socket under the rotating limb. Its radius encloses
  // the cut seam; the joint centre is invariant throughout the movement.
  bc.save();bc.beginPath();bc.arc(part.pivot[0]*w,part.pivot[1]*h,part.socket*Math.min(w,h),0,TAU);bc.clip();bc.drawImage(img,0,0);bc.restore();
  // Translating feet and an opening jaw must leave a hole. Restoring the
  // original seam would glue the rest pose back in place, so those pairs
  // would never exchange which foot is ahead.
  if(part.type!=='step'&&part.type!=='jaw'&&part.type!=='trunkTip'&&part.type!=='trunk'){
   const socket=make(),sc=socket.getContext('2d');path(sc,part.poly,w,h);sc.strokeStyle='#fff';sc.lineWidth=Math.min(w,h)*.105;sc.lineJoin='round';sc.stroke();sc.globalCompositeOperation='source-in';sc.drawImage(img,0,0);bc.drawImage(socket,0,0);
  }
  return {...part,layer};});
 for(const part of layers){
  if(part.parent===undefined)continue;
  const parent=layers[part.parent],pc=parent.layer.getContext('2d');
  pc.globalCompositeOperation='destination-out';path(pc,part.poly,w,h);pc.fill();pc.globalCompositeOperation='source-over';
  pc.save();pc.beginPath();pc.arc(part.pivot[0]*w,part.pivot[1]*h,part.socket*Math.min(w,h),0,TAU);pc.clip();pc.drawImage(img,0,0);pc.restore();
 }
 const value={body,layers,w,h};cache.set(key,value);while(cache.size>12)cache.delete(cache.keys().next().value);return value;
}
function swapWave(u){
 const x=((u%1)+1)%1;
 if(x<.28)return 0;
 if(x<.50)return ease((x-.28)/.22);
 if(x<.78)return 1;
 return 1-ease((x-.78)/.22);
}
function swapLift(u){
 const x=((u%1)+1)%1;
 if(x>=.28&&x<.50)return Math.sin(Math.PI*(x-.28)/.22);
 if(x>=.78)return Math.sin(Math.PI*(x-.78)/.22);
 return 0;
}
function swapDir(u){
 const x=((u%1)+1)%1;
 if(x>=.28&&x<.50)return 1;
 if(x>=.78)return -1;
 return 0;
}
function stepPose(part,p){
 const e=hold(p),u=((p*2+(part.pair||0))%1+1)%1,S=swapWave(u)*e,lift=swapLift(u)*e;
 const role=part.role||1,dir=swapDir(u),forward=role*dir<0;
 return {angle:(forward?0.18:0.05)*lift*(role>0?-1:1),x:(part.tuck||.17)*S*role,y:-(part.lift||.07)*lift*(forward?1:0.3)};
}
function angle(part,p,duration){const e=hold(p),t=p*duration/1000;
 if(part.stationary)return 0;
 if(part.type==='browseNeck')return giraffePose(p).neck;
 if(part.type==='browseHead')return giraffePose(p).head;
 if(part.type==='browseJaw')return giraffePose(p).jaw;
 if(part.type==='tail')return part.angle*Math.sin(t*TAU*.48)*e;
 if(part.type==='ear')return part.angle*Math.sin(t*TAU*.70)*e;
 if(part.type==='hoof')return part.angle*Math.pow(Math.sin(t*Math.PI*.65),2)*e;
 if(part.type==='paw')return part.angle*e;
 if(part.type==='jaw')return part.angle*ease((p-.10)/.14)*ease((.88-p)/.12);
 if(part.type==='step')return stepPose(part,p).angle;
 if(part.type==='trunk')return part.angle*e*(.8+.2*Math.cos(t*1.6));
 if(part.type==='trunkTip')return part.angle*e*ease((p-.10)/.18)*ease((.88-p)/.16)*( .85+.15*Math.cos(t*1.4));
 if(part.type==='wheel')return part.angle*ease(p);
 return part.angle*e;
}
function drawHippoMouth(ctx,img,p,w,h){
 ctx.drawImage(img,0,0,w,h);
 const open=hold(p)*ease((p-.08)/.14)*ease((.88-p)/.14);
 if(open<.02)return;
 const drop=open*.09*h,cx=.135*w,cy=.625*h,rx=.115*w,ry=.062*h;
 ctx.save();ctx.globalCompositeOperation='destination-out';ctx.beginPath();ctx.ellipse(cx,cy,rx,ry,-.08,0,TAU);ctx.fill();ctx.restore();
 ctx.save();ctx.fillStyle='#3c2624';ctx.beginPath();ctx.ellipse(cx,cy-.01*h,rx*.92,ry*.55+drop*.45,-.08,0,TAU);ctx.fill();
 ctx.fillStyle='#6d433c';ctx.beginPath();ctx.ellipse(cx-w*.008,cy+drop*.15,rx*.45,Math.max(h*.008,drop*.28),-.08,0,TAU);ctx.fill();ctx.restore();
 ctx.save();ctx.beginPath();ctx.ellipse(cx,cy+drop,rx,ry,-.08,0,TAU);ctx.clip();ctx.drawImage(img,0,drop,w,h);ctx.restore();
}
function draw(ctx,id,img,p,w,h){
 if(id==='hippo'){drawHippoMouth(ctx,img,p,w,h);return;}
 const rig=rigs[id],r=prepare(img,id);
 if(rig.egg&&p>.3){const e=ease((p-.3)/.2)*ease((1-p)/.14);ctx.save();ctx.globalAlpha=e;ctx.strokeStyle='#b39a69';ctx.lineWidth=h*.019;ctx.beginPath();ctx.ellipse(w*.73,h*.955,w*.11,h*.025,0,0,TAU);ctx.stroke();ctx.fillStyle='#f4e8c9';ctx.beginPath();ctx.ellipse(w*.73,h*(.96-.025*e),w*.04,h*.052,-.12,0,TAU);ctx.fill();ctx.fillStyle='#fff5d9';ctx.beginPath();ctx.ellipse(w*.722,h*(.947-.025*e),w*.016,h*.027,-.12,0,TAU);ctx.fill();ctx.restore();}
 ctx.drawImage(r.body,0,0,w,h);
 for(const part of r.layers){if(part.stationary)continue;ctx.save();const ancestors=[];let parentIndex=part.parent;while(parentIndex!==undefined){const parent=r.layers[parentIndex];ancestors.unshift(parent);parentIndex=parent.parent;}for(const parent of ancestors){const x=parent.pivot[0]*w,y=parent.pivot[1]*h;ctx.translate(x,y);ctx.rotate(angle(parent,p,rig.duration));ctx.translate(-x,-y);}
  if(part.type==='browseJaw'){const opening=clamp(-angle(part,p,rig.duration)/.105);if(opening>.01){ctx.fillStyle='#704326';ctx.beginPath();ctx.moveTo(.133*w,.350*h);ctx.lineTo(.187*w,.342*h);ctx.lineTo(.186*w,(.347+.007*opening)*h);ctx.lineTo(.135*w,(.351+.008*opening)*h);ctx.closePath();ctx.fill();}}
  if(part.type==='jaw'){const opening=clamp(angle(part,p,rig.duration)/.95);if(opening>.01){ctx.fillStyle='#3a2420';ctx.beginPath();ctx.ellipse(.13*w,.522*h,w*.12,h*(.016+.11*opening),-.05,0,TAU);ctx.fill();ctx.fillStyle='#6b3d38';ctx.beginPath();ctx.ellipse(.125*w,(.528+.04*opening)*h,w*.07,h*(.012+.03*opening),-.05,0,TAU);ctx.fill();}}
  if(part.type==='trunkTip'){const curl=clamp(-angle(part,p,rig.duration)/1.35);ctx.translate(curl*w*.05,-curl*h*.10);}
  const x=part.pivot[0]*w,y=part.pivot[1]*h;if(part.type==='step'){const s=stepPose(part,p);ctx.translate(s.x*w,s.y*h);}ctx.translate(x,y);ctx.rotate(angle(part,p,rig.duration));ctx.translate(-x,-y);ctx.drawImage(part.layer,0,0,w,h);ctx.restore();}
 // The browse branch owns its leaves. Drawing a new leaf at the muzzle on
 // every chew made it appear to grow out of the mouth. The neck and jaw keep
 // moving continuously, while the branch now supplies leaves to the mouth.
 if(rig.snack&&p>.25&&p<.82){const a=r.layers[0],e=ease((p-.25)/.1)*ease((.82-p)/.1);ctx.save();ctx.translate(a.pivot[0]*w,a.pivot[1]*h);ctx.rotate(angle(a,p,rig.duration));ctx.translate(-a.pivot[0]*w,-a.pivot[1]*h);ctx.globalAlpha=e;ctx.strokeStyle='#719348';ctx.lineWidth=Math.max(2,w*.006);for(let i=0;i<3;i++){ctx.beginPath();ctx.moveTo(rig.snack.x*w,rig.snack.y*h);ctx.lineTo((rig.snack.x-.028-i*.012)*w,(rig.snack.y+.035+(Math.sin(p*TAU*5)*.007))*h);ctx.stroke();}ctx.restore();}
 // The tiny tongue and leaves are authored vector effects, separate from the
 // animal's stable silhouette. They do not stretch or deform the painting.
 if(rig.tongue&&p>.35&&p<.72){const e=ease((p-.35)/.06)*ease((.72-p)/.06),a={x:.046,y:.422,face:-1};ctx.save();const joint=r.layers[0];ctx.translate(joint.pivot[0]*w,joint.pivot[1]*h);ctx.rotate(angle(joint,p,rig.duration));ctx.translate(-joint.pivot[0]*w,-joint.pivot[1]*h);ctx.strokeStyle='#bc635f';ctx.lineWidth=Math.max(1,w*.005);ctx.lineCap='round';ctx.beginPath();ctx.moveTo(a.x*w,a.y*h);ctx.lineTo((a.x+a.face*.045*e)*w,a.y*h);ctx.stroke();ctx.restore();}
}
function legStep(hip,foot,pair,role,tuck){
 const dx=foot[0]-hip[0],dy=foot[1]-hip[1],len=Math.hypot(dx,dy)||.2,ux=dx/len,uy=dy/len,nx=-uy,ny=ux;
 const knee=[hip[0]+dx*.48,hip[1]+dy*.48],tip=[foot[0]+ux*.06,foot[1]+uy*.06],rt=.08,rf=.13;
 const poly=[[knee[0]+nx*rt,knee[1]+ny*rt],[tip[0]+nx*rf,tip[1]+ny*rf],[tip[0]-ux*.01,tip[1]-uy*.01],[tip[0]-nx*rf,tip[1]-ny*rf],[knee[0]-nx*rt,knee[1]-ny*rt]];
 return Object.assign(part(poly,knee,.2,'step',.05),{pair,role,tuck,lift:.075,foot});
}
function attachWalk(id,fronts,hinds,dir){
 const rig=rigs[id];if(!rig)return;
 const left=dir>=0,ord=(a,b)=>left?a[0][0]-b[0][0]:b[0][0]-a[0][0];
 const f=fronts.slice().sort(ord),h=hinds.slice().sort(ord);
 const span=pair=>pair[1][0][0]-pair[0][0][0];
 const sF=span(f),sH=span(h);
 const steps=[legStep(f[0][1],f[0][0],0,+1,sF),legStep(h[0][1],h[0][0],.25,+1,sH),legStep(f[1][1],f[1][0],0,-1,sF),legStep(h[1][1],h[1][0],.25,-1,sH)];
 rig.parts=steps.concat(rig.parts.filter(p=>p.type!=='hoof'&&p.type!=='step'));
 rig.duration=2600;rig.travel=.28;rig.face=left?-1:1;
}
// Walking animals keep their complete drawings. Do not cut the legs off the poster.
function footX(part,p){if(!part.foot)return part.pivot[0];const s=stepPose(part,p),dx=part.foot[0]-part.pivot[0],dy=part.foot[1]-part.pivot[1],a=s.angle,c=Math.cos(a),sn=Math.sin(a);return part.pivot[0]+dx*c-dy*sn+s.x;}
g.SpritePuppets={rigs,draw,angle,hold,giraffeMouth,renderer:'continuous-rigid-joints',inspect(id,p){const rig=rigs[id];return rig?.parts.map(part=>({type:part.type,angle:angle(part,p,rig.duration),pivot:part.pivot,socket:part.socket,...(part.type==='step'?{...stepPose(part,p),pair:part.pair,role:part.role,footX:footX(part,p)}:{}),...(part.parent!==undefined?{parent:part.parent}:{})}));}};
})(window);
