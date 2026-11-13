/* Four-beat cutout locomotion. Fixed painted bones, two-bone inverse
   kinematics and planted stance feet. No mesh warping or generated pose loop. */
(function(g){'use strict';
const TAU=Math.PI*2,cache=new Map(),profiles={};
const ease=x=>{x=Math.max(0,Math.min(1,x));return x*x*x*(x*(x*6-15)+10);};
const envelope=p=>ease(p/.16)*ease((1-p)/.18);
const leg=(name,hip,knee,foot,radii,phase)=>({name,hip,knee,foot,radii,phase,far:name.startsWith('far'),bend:name.includes('front')?-1:1});
function define(id,legs,extra={}){profiles[id]={legs,face:-1,stride:.115,lift:.055,drop:.024,duty:.68,travel:.45,duration:6200,...extra};}
define('zebra',[
 leg('far-front',[.305,.655],[.225,.754],[.208,.857],[.055,.035,.045],0),
 leg('far-hind',[.632,.635],[.693,.782],[.566,.906],[.06,.035,.054],.75),
 leg('near-front',[.384,.640],[.401,.786],[.403,.912],[.053,.031,.05],.5),
 leg('near-hind',[.727,.600],[.796,.759],[.838,.915],[.062,.041,.052],.25)
]);
define('buffalo',[
 leg('far-front',[.30,.56],[.26,.74],[.224,.93],[.048,.042,.055],0),
 leg('far-hind',[.64,.56],[.65,.74],[.664,.93],[.057,.044,.058],.75),
 leg('near-front',[.44,.56],[.48,.74],[.517,.93],[.06,.04,.06],.5),
 leg('near-hind',[.76,.56],[.78,.74],[.791,.92],[.062,.043,.056],.25)
],{duration:6800,travel:.38,lift:.046});
define('warthog',[
 leg('far-front',[.445,.682],[.475,.807],[.469,.918],[.037,.03,.041],0),
 leg('far-hind',[.674,.681],[.731,.806],[.647,.919],[.04,.035,.047],.75),
 leg('near-front',[.395,.667],[.319,.790],[.297,.918],[.057,.033,.046],.5),
 leg('near-hind',[.816,.656],[.866,.788],[.883,.918],[.043,.035,.046],.25)
],{duration:5400,stride:.095,lift:.057,travel:.47});
define('rhino',[
 leg('far-front',[.30,.58],[.27,.76],[.25,.96],[.05,.043,.06],0),
 leg('far-hind',[.72,.60],[.71,.78],[.69,.97],[.05,.04,.057],.75),
 leg('near-front',[.46,.58],[.50,.76],[.53,.97],[.056,.046,.068],.5),
 leg('near-hind',[.84,.60],[.85,.78],[.87,.96],[.066,.05,.063],.25)
],{duration:6900,travel:.34,stride:.10,lift:.040});
define('elephant',[
 leg('far-front',[.373,.687],[.370,.813],[.355,.924],[.043,.044,.057],0),
 leg('far-hind',[.708,.708],[.717,.828],[.716,.927],[.05,.043,.057],.75),
 leg('near-front',[.504,.659],[.522,.812],[.517,.933],[.065,.052,.064],.5),
 leg('near-hind',[.832,.651],[.860,.808],[.875,.933],[.061,.052,.065],.25)
],{duration:7200,travel:.35,stride:.10,lift:.04});
define('elephantcalf',[
 leg('far-front',[.346,.637],[.344,.805],[.336,.916],[.052,.043,.055],0),
 leg('far-hind',[.692,.686],[.718,.807],[.694,.913],[.05,.044,.055],.75),
 leg('near-front',[.487,.636],[.485,.801],[.467,.921],[.072,.056,.079],.5),
 leg('near-hind',[.811,.653],[.850,.801],[.862,.919],[.076,.065,.078],.25)
],{duration:6000,travel:.4,stride:.11,lift:.05});
define('lioness',[
 leg('far-front',[.285,.637],[.224,.783],[.122,.899],[.04,.043,.063],0),
 leg('far-hind',[.601,.610],[.653,.776],[.551,.899],[.058,.04,.067],.75),
 leg('near-front',[.385,.620],[.401,.782],[.388,.910],[.045,.037,.06],.5),
 leg('near-hind',[.715,.591],[.800,.751],[.831,.903],[.066,.044,.054],.25)
],{duration:5800,lift:.065,travel:.47});
define('tiger',[
 leg('far-front',[.266,.587],[.218,.760],[.118,.897],[.045,.042,.06],0),
 leg('far-hind',[.599,.605],[.629,.767],[.561,.899],[.044,.039,.058],.75),
 leg('near-front',[.388,.585],[.409,.759],[.383,.910],[.052,.046,.065],.5),
 leg('near-hind',[.711,.588],[.770,.749],[.805,.907],[.057,.04,.06],.25)
],{duration:5600,lift:.065,travel:.5});
define('jaguar',[
 leg('far-front',[.268,.599],[.200,.764],[.109,.910],[.045,.041,.055],0),
 leg('far-hind',[.597,.597],[.647,.765],[.562,.910],[.05,.045,.059],.75),
 leg('near-front',[.357,.600],[.361,.779],[.340,.917],[.05,.039,.058],.5),
 leg('near-hind',[.708,.578],[.750,.751],[.770,.916],[.062,.038,.06],.25)
],{duration:5900,travel:.46,lift:.062});
define('cheetah',[
 leg('far-front',[.365,.600],[.399,.783],[.375,.908],[.024,.028,.034],0),
 leg('far-hind',[.571,.561],[.614,.746],[.525,.886],[.036,.031,.046],.75),
 leg('near-front',[.263,.611],[.198,.767],[.076,.908],[.035,.033,.055],.5),
 leg('near-hind',[.685,.530],[.757,.718],[.827,.901],[.04,.028,.034],.25)
],{duration:4700,travel:.55,stride:.14,lift:.077});
define('polarbear',[
 leg('far-front',[.363,.539],[.350,.758],[.254,.903],[.056,.049,.066],0),
 leg('far-hind',[.846,.689],[.907,.791],[.921,.847],[.039,.034,.034],.75),
 leg('near-front',[.480,.550],[.511,.754],[.527,.903],[.063,.066,.084],.5),
 leg('near-hind',[.796,.621],[.832,.772],[.835,.904],[.071,.064,.097],.25)
],{duration:6800,travel:.37,stride:.105,lift:.043});
define('arcticfox',[
 leg('far-front',[.344,.692],[.372,.792],[.394,.920],[.031,.029,.041],0),
 leg('far-hind',[.470,.621],[.529,.785],[.453,.918],[.037,.033,.041],.75),
 leg('near-front',[.290,.689],[.186,.795],[.158,.889],[.033,.031,.043],.5),
 leg('near-hind',[.581,.591],[.670,.775],[.710,.875],[.04,.028,.022],.25)
],{duration:5000,travel:.5,stride:.13,lift:.065});
define('cow',[
 leg('far-front',[.335,.709],[.328,.827],[.309,.926],[.035,.033,.052],0),
 leg('far-hind',[.737,.747],[.733,.843],[.707,.928],[.034,.034,.045],.75),
 leg('near-front',[.421,.713],[.421,.845],[.409,.934],[.041,.036,.052],.5),
 leg('near-hind',[.850,.712],[.872,.841],[.860,.930],[.046,.039,.053],.25)
],{duration:6700,travel:.38,stride:.1,lift:.045});
define('sheep',[
 leg('far-front',[.340,.758],[.337,.848],[.322,.920],[.032,.03,.045],0),
 leg('far-hind',[.769,.763],[.753,.857],[.747,.920],[.033,.031,.042],.75),
 leg('near-front',[.430,.750],[.431,.853],[.427,.925],[.041,.037,.053],.5),
 leg('near-hind',[.882,.759],[.877,.856],[.875,.925],[.038,.035,.045],.25)
],{duration:5600,travel:.44,stride:.087,lift:.047,drop:.02});
define('pig',[
 leg('far-front',[.325,.708],[.321,.831],[.298,.927],[.035,.03,.044],0),
 leg('far-hind',[.763,.700],[.749,.829],[.730,.926],[.036,.036,.046],.75),
 leg('near-front',[.431,.688],[.432,.833],[.423,.937],[.048,.039,.054],.5),
 leg('near-hind',[.867,.680],[.916,.818],[.914,.934],[.051,.040,.057],.25)
],{duration:5700,travel:.43,stride:.09,lift:.05});
define('calf',[
 leg('far-front',[.411,.707],[.375,.827],[.366,.916],[.05,.037,.060],0),
 leg('far-hind',[.725,.695],[.724,.814],[.689,.909],[.045,.038,.061],.75),
 leg('near-front',[.540,.701],[.550,.825],[.531,.934],[.053,.048,.065],.5),
 leg('near-hind',[.854,.689],[.871,.819],[.877,.927],[.052,.041,.059],.25)
],{duration:5400,travel:.43,stride:.10,lift:.06});
define('lamb',[
 leg('far-front',[.389,.717],[.379,.830],[.360,.912],[.047,.039,.064],0),
 leg('far-hind',[.731,.709],[.726,.815],[.716,.910],[.047,.04,.062],.75),
 leg('near-front',[.527,.718],[.524,.829],[.511,.927],[.064,.055,.068],.5),
 leg('near-hind',[.866,.714],[.889,.829],[.890,.925],[.059,.047,.066],.25)
],{duration:5500,travel:.44,stride:.10,lift:.058});
define('piglet',[
 leg('far-front',[.369,.759],[.352,.842],[.333,.914],[.044,.035,.062],0),
 leg('far-hind',[.734,.768],[.730,.840],[.714,.913],[.044,.034,.059],.75),
 leg('near-front',[.516,.737],[.509,.838],[.500,.933],[.063,.046,.069],.5),
 leg('near-hind',[.852,.736],[.876,.840],[.875,.925],[.048,.04,.062],.25)
],{duration:5000,travel:.46,stride:.092,lift:.052,drop:.022});
define('lioncub',[
 leg('far-front',[.701,.700],[.717,.826],[.731,.917],[.035,.037,.045],0),
 leg('far-hind',[.315,.688],[.292,.796],[.331,.912],[.041,.038,.050],.75),
 leg('near-front',[.606,.698],[.616,.832],[.638,.925],[.047,.041,.06],.5),
 leg('near-hind',[.231,.679],[.195,.797],[.204,.924],[.05,.040,.054],.25)
],{face:-1,duration:5700,travel:.42,stride:.10,lift:.055});

// A walk is a footfall sequence around the shoulder/hip, not around the
// already extended feet in a still illustration. Keep the torso at its
// resting height and retain the painted silhouettes of the feet.
// Register joints against each poster, not the bounding box of its old atlas.
const corrections={
 lioncub:{'near-hind':{hip:[.337,.650],knee:[.281,.802],foot:[.282,.925],radii:[.055,.039,.055]},'far-hind':{hip:[.410,.676]},'far-front':{hip:[.721,.687]}},
 cheetah:{'far-front':{hip:[.348,.593],knee:[.426,.807],foot:[.405,.910],radii:[.035,.032,.044]}},
 arcticfox:{'near-hind':{foot:[.704,.910],radii:[.040,.032,.037]}}
};
for(const [id,legs]of Object.entries(corrections))for(const l of profiles[id].legs)Object.assign(l,legs[l.name]);
for (const [id,p] of Object.entries(profiles)) {
 const heavy=['elephant','elephantcalf','rhino','buffalo','polarbear'].includes(id);
 const cat=['tiger','lioness','jaguar','cheetah','arcticfox'].includes(id);
 const baby=['calf','lamb','piglet','lioncub'].includes(id);
 Object.assign(p,{stride:heavy?.16:cat?.22:baby?.18:.19,lift:heavy?.055:cat?.07:.06,duty:heavy?.76:.68,drop:0,cycles:2,duration:heavy?6400:cat?5200:5800});
 for(const l of p.legs)l.phase={'near-hind':0,'near-front':.75,'far-hind':.5,'far-front':.25}[l.name];
}
function polygon(ctx,points){ctx.beginPath();points.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.closePath();}
function cut(canvas,bounds,ankle){
 const ox=Math.max(0,Math.floor(bounds[0])),oy=Math.max(0,Math.floor(bounds[1])),w=Math.min(canvas.width,Math.ceil(bounds[2]))-ox,h=Math.min(canvas.height,Math.ceil(bounds[3]))-oy;
 const data=canvas.getContext('2d').getImageData(ox,oy,w,h),a=data.data;
 // Retain the connected paw, excluding fragments of an adjacent foot.
 if(ankle){const seen=new Uint8Array(w*h);let seed=-1,best=Infinity;for(let n=0;n<seen.length;n++)if(a[n*4+3]>100){const d=(n%w+ox-ankle[0])**2+(Math.floor(n/w)+oy-ankle[1])**2;if(d<best){seed=n;best=d;}}
  if(seed>=0){const stack=[seed];seen[seed]=1;while(stack.length){const n=stack.pop(),x=n%w,y=Math.floor(n/w);for(const q of [x?n-1:-1,x<w-1?n+1:-1,y?n-w:-1,y<h-1?n+w:-1])if(q>=0&&!seen[q]&&a[q*4+3]>12){seen[q]=1;stack.push(q);}}for(let n=0;n<seen.length;n++)if(!seen[n])a[n*4+3]=0;}
 }
 let x0=w,y0=h,x1=0,y1=0;for(let y=0;y<h;y++)for(let x=0;x<w;x++)if(a[(y*w+x)*4+3]>0){x0=Math.min(x0,x);y0=Math.min(y0,y);x1=Math.max(x1,x+1);y1=Math.max(y1,y+1);}
 const image=document.createElement('canvas');image.width=Math.max(1,x1-x0);image.height=Math.max(1,y1-y0);image.getContext('2d').putImageData(data,-x0,-y0);return {image,x:ox+x0,y:oy+y0,box:[ox+x0,oy+y0,ox+x1,oy+y1]};
}
function prepare(img,id){
 const key=id+':'+img.currentSrc;if(cache.has(key))return cache.get(key);
 const profile=profiles[id],w=img.naturalWidth,h=img.naturalHeight,make=()=>{const c=document.createElement('canvas');c.width=w;c.height=h;return c;},source=make(),sc=source.getContext('2d',{willReadFrequently:true});
 // A folder opened as a file taints every canvas that draws the <img>. The matching data-URL copy stays readable, including the leg cuts below.
 const photo=(g.WalkSources&&g.WalkSources.image(id))||img;sc.drawImage(photo,0,0,w,h);
 const pixels=sc.getImageData(0,0,w,h),protectedLayer=make(),pc=protectedLayer.getContext('2d');
 const tails={zebra:[[.77,.42],[.83,.48],[.90,.67],[.95,.75]],buffalo:[[.84,.28],[.89,.38],[.90,.51],[.95,.61]],rhino:[[.85,.33],[.92,.49],[.96,.64]],elephant:[[.90,.49],[.93,.69],[.96,.86]],elephantcalf:[[.84,.43],[.88,.67],[.91,.73]],lioness:[[.75,.22],[.84,.50],[.90,.68],[.95,.79]],tiger:[[.74,.28],[.83,.47],[.86,.63],[.92,.75],[.98,.72]],cheetah:[[.70,.29],[.77,.50],[.87,.63],[.97,.59]],cow:[[.90,.30],[.925,.48],[.928,.64],[.96,.84]],lioncub:[[.25,.44],[.16,.66],[.06,.79]]};
 tails.lioncub=[[.30,.46],[.23,.62],[.18,.74],[.13,.81]];
 const tail=tails[id];if(tail){pc.lineWidth=w*(id==='lioncub'?.11:.065);pc.lineCap='round';pc.lineJoin='round';pc.beginPath();tail.forEach(([x,y],i)=>i?pc.lineTo(x*w,y*h):pc.moveTo(x*w,y*h));pc.stroke();}
 const protect=poly=>{polygon(pc,poly.map(([x,y])=>[x*w,y*h]));pc.fill();};
 if(id==='jaguar'){pc.lineWidth=w*.105;pc.beginPath();pc.moveTo(w*.75,h*.43);pc.bezierCurveTo(w*.78,h*.61,w*.86,h*.82,w*.93,h*.70);pc.lineCap='round';pc.stroke();}
 if(id==='arcticfox')protect([[.58,.34],[.84,.38],[1,.67],[1,.84],[.78,.84],[.66,.68]]);
 if(id==='elephant'||id==='elephantcalf')protect([[0,.38],[.26,.38],[.27,.96],[0,.99]]);
 const layers=profile.legs.map(l=>{const H=[l.hip[0]*w,l.hip[1]*h],K=[l.knee[0]*w,l.knee[1]*h],F=[l.foot[0]*w,l.foot[1]*h];return {...l,H,K,F,L1:Math.hypot(K[0]-H[0],K[1]-H[1]),L2:Math.hypot(F[0]-K[0],F[1]-K[1]),sole:0};});
 const roots=layers.map(l=>l.H).sort((a,b)=>a[0]-b[0]);
 const body=make(),bc=body.getContext('2d');
 const fore=layers.filter(l=>l.name.includes('front')).map(l=>l.H),hind=layers.filter(l=>l.name.includes('hind')).map(l=>l.H),inner=[...fore.sort((a,b)=>a[0]-b[0]),...hind.sort((a,b)=>a[0]-b[0])].sort((a,b)=>a[0]-b[0]);
 const middle=[(inner[1][0]+inner[2][0])/2,Math.max(inner[1][1],inner[2][1])+h*.055];
 const edge=[...roots,middle].sort((a,b)=>a[0]-b[0]);
 const outline=[[0,0],[w,0],[w,roots.at(-1)[1]],...edge.slice().reverse(),[0,roots[0][1]]];
 bc.save();polygon(bc,outline);bc.clip();bc.drawImage(photo,0,0);bc.restore();
 pc.globalCompositeOperation='source-in';pc.drawImage(photo,0,0);bc.drawImage(protectedLayer,0,0);
 if(id==='cow'){const bodyData=sc.getImageData(0,0,w,h);for(let y=0;y<h;y++)for(let x=0;x<w;x++){const n=(y*w+x)*4;if(!(x>w*.64&&x<w*.81&&y>h*.56&&y<h*.82&&pixels.data[n]>pixels.data[n+1]*1.13))bodyData.data[n+3]=0;}const udder=make();udder.getContext('2d').putImageData(bodyData,0,0);bc.drawImage(udder,0,0);}
 const sample=(P,fallback)=>{let rgb=[0,0,0],count=0;for(let yy=-4;yy<=4;yy++)for(let xx=-4;xx<=4;xx++){const x=Math.max(0,Math.min(w-1,Math.round(P[0]+xx))),y=Math.max(0,Math.min(h-1,Math.round(P[1]+yy))),n=(y*w+x)*4;if(pixels.data[n+3]>200){rgb=rgb.map((v,i)=>v+pixels.data[n+i]);count++;}}return count?rgb.map(v=>Math.round(v/count)):fallback;};
 const bone=(A,B,ra,rb)=>{const c=make(),ctx=c.getContext('2d'),dx=B[0]-A[0],dy=B[1]-A[1],length=Math.hypot(dx,dy),nx=-dy/length,ny=dx/length;ctx.beginPath();ctx.moveTo(A[0]+nx*ra,A[1]+ny*ra);ctx.lineTo(B[0]+nx*rb,B[1]+ny*rb);ctx.arc(B[0],B[1],rb,Math.atan2(ny,nx),Math.atan2(-ny,-nx),true);ctx.lineTo(A[0]-nx*ra,A[1]-ny*ra);ctx.arc(A[0],A[1],ra,Math.atan2(-ny,-nx),Math.atan2(ny,nx),true);ctx.closePath();const rgb=sample([(A[0]+B[0])/2,(A[1]+B[1])/2],sample(A,[160,135,105]));ctx.fillStyle=`rgb(${rgb})`;ctx.fill();ctx.clip();ctx.drawImage(photo,0,0);return cut(c,[Math.min(A[0]-ra,B[0]-rb)-1,Math.min(A[1]-ra,B[1]-rb)-1,Math.max(A[0]+ra,B[0]+rb)+1,Math.max(A[1]+ra,B[1]+rb)+1]);};
 if(['warthog','cheetah','arcticfox'].includes(id)){
  const near=layers.find(l=>l.name==='near-front'),far=layers.find(l=>l.name==='far-front');near.home=near.H.slice();
  for(const k of ['H','K','F','L1','L2'])near[k]=far[k];
 }
 for(const l of layers.filter(l=>!l.far)){
  l.upper=bone(l.H,l.K,l.radii[0]*w*.83,l.radii[1]*w*.72);l.lower=bone(l.K,l.F,l.radii[1]*w*.72,l.radii[1]*w*.62);
  const bounds=[l.F[0]-l.radii[2]*w*1.22,l.F[1]-h*.03,l.F[0]+l.radii[2]*w*1.22,l.F[1]+h*.075];
  l.footLayer=cut(source,bounds,l.F);
  l.sole=l.footLayer.box[3];
 }
 // A hidden stump is not a whole leg. Use the complete near-side chain at
 // the same anatomical proportions for its far-side pair.
 const depthX=(profile.legs[0].hip[0]-profile.legs[2].hip[0]+profile.legs[1].hip[0]-profile.legs[3].hip[0])*w/2;
 const shadow=part=>{const image=document.createElement('canvas');image.width=part.image.width;image.height=part.image.height;const ctx=image.getContext('2d');ctx.drawImage(part.image,0,0);ctx.globalCompositeOperation='source-atop';ctx.fillStyle='rgba(26,24,24,.13)';ctx.fillRect(0,0,image.width,image.height);return {...part,image};};
 for(const far of layers.filter(l=>l.far)){
  const near=layers.find(l=>l.name===far.name.replace('far','near'));
  Object.assign(far,{H:near.H.slice(),K:near.K.slice(),F:near.F.slice(),home:near.home,L1:near.L1,L2:near.L2,upper:shadow(near.upper),lower:shadow(near.lower),footLayer:shadow(near.footLayer),sole:near.sole,shift:[depthX,-h*.012]});
 }
 for(const l of layers){
  const shift=l.shift||[0,0],home=l.home||l.H;l.root=[home[0]+shift[0],home[1]+shift[1]];
  l.ground=l.sole-(l.far?h*.012:0);l.ankleGround=l.F[1]-(l.far?h*.012:0);
  const dy=l.ankleGround-l.root[1]-h*.018,available=Math.sqrt(Math.max(0,(l.L1+l.L2-h*.003)**2-dy*dy));
  l.reach=available;l.bend=profile.face;
 }
 // A still painting already splits each pair, one foot ahead of the other.
 // Stepping around those painted foot positions keeps that same foot in
 // front for the whole cycle, so either the fore pair or the hind pair
 // never passes. Both feet of a pair share one shoulder or hip line.
 // Opposite phases then exchange which foot is ahead.
 for(const names of [['near-front','far-front'],['near-hind','far-hind']]){
  const pair=names.map(name=>layers.find(l=>l.name===name));
  const mid=(pair[0].root[0]+pair[1].root[0])/2;
  pair[0].center=mid;pair[1].center=mid;
 }
 const stride=Math.min(profile.stride*h,...layers.map(l=>Math.max(h*.12,l.reach*1.35)));
 const result={body,layers,w,h,stride,profile};cache.set(key,result);while(cache.size>8)cache.delete(cache.keys().next().value);return result;
}
function solve(H,K,F,target,L1,L2,bend){const dx=target[0]-H[0],dy=target[1]-H[1],original=Math.hypot(dx,dy),distance=Math.max(Math.abs(L1-L2)+.0001,Math.min(L1+L2-.0001,original)),ux=dx/(original||1),uy=dy/(original||1),a=(L1*L1-L2*L2+distance*distance)/(2*distance),b=Math.sqrt(Math.max(0,L1*L1-a*a))*bend,foot=[H[0]+ux*distance,H[1]+uy*distance],knee=[H[0]+ux*a-uy*b,H[1]+uy*a+ux*b];return {knee,foot,upper:Math.atan2(knee[1]-H[1],knee[0]-H[0])-Math.atan2(K[1]-H[1],K[0]-H[0]),lower:Math.atan2(foot[1]-knee[1],foot[0]-knee[0])-Math.atan2(F[1]-K[1],F[0]-K[0]),reachError:Math.abs(original-distance)};}
function pose(profile,layer,state,w,h){
 const e=state.envelope||0,stride=state.stride||profile.stride*h,duty=profile.duty,cycle=state.distance*h*duty/stride,phase=((cycle+layer.phase)%1+1)%1,stance=phase<duty;
 let horizontal,lift=0,toe=0;
 if(state.planted){horizontal=0;lift=0;toe=0;}
 else if(stance){horizontal=.5-phase/duty;toe=profile.face*.08*ease((phase/duty-.82)/.18);}
 else {const u=(phase-duty)/(1-duty);horizontal=-.5*Math.cos(Math.PI*u);lift=profile.lift*h*Math.sin(Math.PI*u)**1.35;toe=profile.face*(.08*(1-ease(u/.45))+.10*Math.sin(Math.PI*u)**2);}
 // gait 0 is the four-hoof stand. The step grows out of that stand, so a
 // raised hoof painted into the poster never flashes back in.
 const gait=state.planted?0:state.gait;
 if(gait!=null){horizontal*=gait;lift*=gait;toe*=gait;}
 const bone=gait==null?e:1;
 const bob=(state.planted||gait===0?0:(.012+.001*Math.cos(cycle*TAU*2))*h*(gait==null?e:1));
 const floor=state.floor||layer.ankleGround;
 const neutral=[layer.center+profile.face*stride*horizontal,floor-lift-bob];
 const target=[layer.F[0]*(1-bone)+neutral[0]*bone,layer.F[1]*(1-bone)+neutral[1]*bone];
 const root=[layer.H[0]*(1-bone)+layer.root[0]*bone,layer.H[1]*(1-bone)+layer.root[1]*bone];
 const shift=[root[0]-layer.H[0],root[1]-layer.H[1]],referenceK=[layer.K[0]+shift[0],layer.K[1]+shift[1]],referenceF=[layer.F[0]+shift[0],layer.F[1]+shift[1]];
 const ik=solve(root,referenceK,referenceF,target,layer.L1,layer.L2,layer.bend);
 // Ease into and out of the painted rest pose; keep fixed bone lengths.
 const wrap=a=>Math.atan2(Math.sin(a),Math.cos(a));
 const upper=wrap(ik.upper)*bone,lower=wrap(ik.lower)*bone;
 const knee=[root[0]+(layer.K[0]-layer.H[0])*Math.cos(upper)-(layer.K[1]-layer.H[1])*Math.sin(upper),root[1]+(layer.K[0]-layer.H[0])*Math.sin(upper)+(layer.K[1]-layer.H[1])*Math.cos(upper)];
 const foot=[knee[0]+(layer.F[0]-layer.K[0])*Math.cos(lower)-(layer.F[1]-layer.K[1])*Math.sin(lower),knee[1]+(layer.F[0]-layer.K[0])*Math.sin(lower)+(layer.F[1]-layer.K[1])*Math.cos(lower)];
 return {...ik,root,knee,foot,upper,lower,toe:toe*e,phase,stance,drop:bob,groundY:layer.ground,target};
}
function paintRig(ctx,profile,r,state,w,h){
 const s={...state,stride:r.stride,floor:Math.max(...r.layers.map(l=>l.ankleGround))},poses=r.layers.map(l=>pose(profile,l,s,r.w,r.h));ctx.save();ctx.scale(w/r.w,h/r.h);ctx.translate(0,poses[0].drop);
 const part=(image,origin,angle,source)=>{ctx.save();ctx.translate(...origin);ctx.rotate(angle);ctx.translate(-source[0],-source[1]);ctx.drawImage(image.image,image.x,image.y);ctx.restore();};
 const limb=(l,p)=>{part(l.upper,p.root,p.upper,l.H);part(l.lower,p.knee,p.lower,l.K);part(l.footLayer,p.foot,p.toe,l.F);};
 r.layers.forEach((l,i)=>{if(l.far)limb(l,poses[i]);});ctx.drawImage(r.body,0,0);r.layers.forEach((l,i)=>{if(!l.far)limb(l,poses[i]);});ctx.restore();
}
function draw(ctx,id,img,state,w,h){const profile=profiles[id],blend=state?.envelope||0;if(!profile||blend<.000001){ctx.drawImage(img,0,0,w,h);return;}
 const r=prepare(img,id);if(blend===1){paintRig(ctx,profile,r,state,w,h);return;}
 // Blend complete silhouettes once. Blending every overlapping limb makes
 // the torso translucent and causes a visible brightness pulse at start/stop.
 if(!r.transition){r.transition=document.createElement('canvas');r.transition.width=r.w;r.transition.height=r.h;}
 const tc=r.transition.getContext('2d');tc.clearRect(0,0,r.w,r.h);paintRig(tc,profile,r,state,r.w,r.h);
 ctx.save();ctx.globalAlpha*=1-blend;ctx.drawImage(img,0,0,w,h);ctx.restore();ctx.save();ctx.globalAlpha*=blend;ctx.drawImage(r.transition,0,0,w,h);ctx.restore();
}
function advance(p){const t=Math.max(0,Math.min(1,(p-.16)/.66)),a=.16;if(t<a){const u=t/a;return a*(u**3-.5*u**4)/(1-a);}if(t>1-a)return 1-advance(.16+(1-t)*.66);return (t-a/2)/(1-a);}
g.QuadrupedWalk={profiles,draw,envelope,ease,advance,prepare,pose,inspect(id,img,state){const r=prepare(img,id);return r.layers.map(l=>{const p=pose(profiles[id],l,{...state,stride:r.stride},r.w,r.h);return {name:l.name,stance:p.stance,phase:p.phase,foot:p.foot.map((x,i)=>x/(i?r.h:r.w)),drop:p.drop/r.h,groundY:p.groundY/r.h,reachError:p.reachError/r.h,upper:p.upper,lower:p.lower};});}};
})(window);

