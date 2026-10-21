/* V4.9: full painted objects, continuous paths, and scene-wide changes. */
(function(g){
'use strict';
const defs=g.CHAPTER_OBJECTS||{},active=new Map(),positions=new WeakMap(),cache=new Map(),counts=new Map();
const asset=p=>g.resolveAsset?g.resolveAsset(p):p,clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x)),ease=x=>{x=clamp(x);return x*x*(3-2*x);};
let tempo='slow',weight='soft',weather='sun',castleBuilt=false;const basket=[];
function load(p){if(!p)return Promise.resolve(null);if(cache.has(p))return cache.get(p);const result=new Promise(resolve=>{const i=new Image();i.onload=()=>resolve(i);i.onerror=()=>resolve(null);i.src=asset(p);if(i.complete&&i.naturalWidth)resolve(i);});cache.set(p,result);return result;}
function preload(id){const d=defs[id];return d?Promise.all([load(d.poster),...Object.values(d.extraLayers||{}).map(l=>load(typeof l==='string'?l:l.path))]):Promise.resolve(null);}
function node(tag,cls,parent){const n=document.createElement(tag);n.className=cls;n.setAttribute('aria-hidden','true');parent?.append(n);return n;}
function updateBasket(){document.querySelectorAll('.shopping-dock').forEach(d=>{d.querySelector('.shopping-count').textContent=String(basket.length);const items=d.querySelector('.shopping-items');items.replaceChildren();for(const id of basket.slice(-5)){const img=node('img','',items);img.src=asset(defs[id].poster);img.alt='';}});}
function setWeather(value){weather=value;document.querySelectorAll('.panel[data-scene="weather"]').forEach(p=>p.dataset.weather=value);}
function settingsButton(group,key,label,value,parent){const b=document.createElement('button');b.type='button';b.dataset.value=value;b.textContent=label;b.setAttribute('aria-pressed',String((key==='tempo'?tempo:weight)===value));b.addEventListener('click',()=>{if(key==='tempo')tempo=value;else weight=value;document.querySelectorAll('.music-settings [data-group="'+key+'"] button').forEach(x=>x.setAttribute('aria-pressed',String(x.dataset.value===value)));});group.append(b);}
function mountPanel(panel,sc,w,h){
 if(sc.id==='weather'){
  panel.dataset.weather=weather;const wash=node('div','weather-wash',panel),rain=node('div','weather-rain',panel),snow=node('div','weather-snow',panel),leaves=node('div','weather-leaves',panel),wind=node('div','weather-wind',panel);
  for(let i=0;i<Math.min(90,Math.round(w/h*17));i++){
   const r=node('i','',rain);r.style.cssText=`left:${((i*73+31)%997)/997*100}%;top:${-((i*31)%90)}%;animation-delay:${-i*.17}s;animation-duration:${.7+(i%5)*.09}s`;
   const s=node('i','',snow);s.style.cssText=`left:${((i*67+17)%997)/997*100}%;top:${-((i*41)%90)}%;animation-delay:${-i*.47}s;animation-duration:${7+i%5}s`;
   if(i<22){const l=node('i','',leaves);l.style.cssText=`left:${((i*37+27)%97)}%;animation-delay:${-i*.71}s;animation-duration:${5+i%4}s`;}if(i<13){const gust=node('i','',wind);gust.style.cssText=`top:${18+(i*13)%55}%;left:${i/13*100}%;animation-delay:${-i*.37}s`;}
  }
  const arc=node('div','weather-rainbow',panel);arc.style.left=w*.37+'px';arc.style.width=h*1.0+'px';arc.style.height=h*.5+'px';
 }
 if(sc.id==='beach')node('div','beach-shorewash',panel);
}
function mountUI(){
 const app=document.getElementById('zooApp');if(!app)return;
 const ui=document.createElement('div');ui.className='music-settings';ui.setAttribute('aria-label','演奏节奏和力度');
 for(const [key,list] of [['tempo',[['slow','慢一点'],['fast','快一点']]],['weight',[['soft','轻一点'],['strong','重一点']]]]){const group=document.createElement('div');group.dataset.group=key;for(const [value,label]of list)settingsButton(group,key,label,value,ui);ui.append(group);}app.append(ui);
 const dock=document.createElement('button');dock.className='shopping-dock';dock.type='button';dock.setAttribute('aria-label','购物篮，点击清空');dock.innerHTML='<span aria-hidden="true">🧺</span><span class="shopping-items"></span><span class="shopping-count">0</span>';dock.addEventListener('click',()=>{basket.length=0;updateBasket();});app.append(dock);
}
function sceneChanged(id){document.body.dataset.chapter=id;}
function attach(el,id){const d=defs[id];if(!d)return;if(d.motion==='beach-wave')el.classList.add('beach-wave-target');
 if(d.motion==='tram'){
  const panel=el.closest('.panel'),sc=g.GAME_SCENES[el.dataset.scene],ns='http://www.w3.org/2000/svg',wire=document.createElementNS(ns,'svg'),path=document.createElementNS(ns,'path');wire.classList.add('tram-overhead-wire');wire.setAttribute('aria-hidden','true');wire.append(path);panel.append(wire);const width=panel.offsetWidth,height=innerHeight;wire.setAttribute('viewBox',`0 0 ${width} ${height}`);wire.style.width=width+'px';wire.style.height=height+'px';path.setAttribute('stroke','#716f637f');path.setAttribute('stroke-width','1.1');path.setAttribute('fill','none');
  const tip=d.poleTip||{x:.03,y:.03},orientation=el.querySelector('.orientation');let left=(d.wireRange?.[0]||0)*width,right=(d.wireRange?.[1]||1)*width,cursor=0;for(const part of sc.sections||[]){const end=cursor+part.screens*(width/sc.numScreens);if(part.id===el.dataset.region){left=cursor;right=end;break;}cursor=end;}
  const update=(zoom=1,y=0,shift=0,face=el.dataset.flip==='true'?-1:1)=>{const w=orientation.offsetWidth,h=orientation.offsetHeight,px=.5+(tip.x-.5)*zoom,py=.96+(tip.y-.96)*zoom,x=el.offsetLeft+(parseFloat(orientation.style.left)||0)+(face>0?px:1-px)*w+shift,contactY=el.offsetTop+(parseFloat(orientation.style.top)||0)+py*h+y;path.setAttribute('d',`M${left} ${contactY-3} Q${(left+x)/2} ${contactY+2} ${x} ${contactY} Q${(x+right)/2} ${contactY+2} ${right} ${contactY-3}`);};el._chapterWire={update};const image=el.querySelector('.idle-layer img');image.addEventListener('load',()=>update(),{once:true});update();
 }
}
function stop(el){const r=active.get(el);if(!r)return;cancelAnimationFrame(r.frame);r.action.remove();r.fly?.remove();r.peek?.remove();r.idle.style.visibility='';r.orientation.style.transform=`scaleX(${r.face})`;el.style.translate=`${r.x}px 0px`;el.classList.remove('acting');el._chapterWire?.update(1,0,r.x,r.face);positions.set(el,{x:r.x,face:r.face});active.delete(el);}
function effect(r,cls){return node('div','chapter-effect '+cls,r.visual);}
function render(r,p){
 p=clamp(p);r.progress=p;const d=r.def,t=p*r.duration/1000,envelope=ease(Math.min(p/.12,(1-p)/.16));let y=0,angle=0;r.x=r.start;
 if(r.distance)r.x=r.start+r.distance*ease(p);
 if(!r.reduced&&!r.embedded){
  if(d.motion==='boat'){y=Math.sin(t*1.3)*r.height*.013*envelope;angle=Math.sin(t)*.65*envelope;}
  if(d.motion==='tram'||d.motion==='bus'||d.motion==='shop-cart')y=Math.sin(t*4)*r.height*.003*envelope;
  if(d.motion==='tambourine'||d.motion==='maracas')angle=Math.sin(t*2*Math.PI/r.beat)*8*envelope;
  if(d.motion==='beach-umbrella'||d.motion==='weather-umbrella')angle=Math.sin(t*1.3)*1.5*envelope;
  if(d.motion==='beach-bucket')angle=-Math.sin(p*Math.PI)*135;
  if(d.motion==='beach-shovel'){angle=-Math.sin(p*Math.PI*2)*23*envelope;y=Math.sin(p*Math.PI*2)*r.height*.07*envelope;}
  if(d.motion==='beach-shell')angle=Math.sin(p*Math.PI)*22;
  if(d.motion==='beach-crab')y=-Math.abs(Math.sin(t*5))*r.height*.015*envelope;
  if(d.motion==='weather-cloud')y=-Math.sin(p*Math.PI)*r.height*.05;
 }
 r.zoom=r.reduced||r.embedded?1:1+(d.motion==='weather-rainbow'?.32:.075)*envelope;
 r.el._chapterWire?.update(r.zoom,y,r.x,r.face);
 r.visual.style.transform=`translateY(${y}px) rotate(${angle}deg) scale(${r.zoom})`;r.el.style.translate=`${r.x}px 0px`;
 if(r.mallet){const phase=((t/r.beat)%1),strike=Math.pow(Math.cos(phase*Math.PI),8);r.mallet.style.transform=`rotate(${-27+strike*28}deg)`;r.mallet.dataset.strike=String(strike);}
 if(r.strings)r.strings.forEach((path,i)=>{const q=d.stringLines[i],phase=t/r.beat%1,decay=Math.exp(-phase*5),bend=Math.sin(t*72+i)*1.2*decay*envelope;path.setAttribute('d',`M${q[0]*100} ${q[1]*100}Q${(q[0]+q[2])*50+bend} ${(q[1]+q[3])*50} ${q[2]*100} ${q[3]*100}`);path.style.opacity=String(envelope*(.25+decay*.65));});if(r.radio)r.radio.querySelectorAll('i').forEach((ring,i)=>{const f=(t*.58-i*.22+2)%1;ring.style.transform=`scale(${.3+f*.8})`;ring.style.opacity=String((1-f)*envelope*.7);});
 if(r.keys)r.keys.forEach((key,i)=>{const beat=Math.floor(t/r.beat);key.style.opacity=String(beat%r.keys.length===i?envelope*.7:0);});
 if(r.head)r.head.style.opacity=String(envelope*Math.pow(Math.cos(t/r.beat*Math.PI),12)*.28);
 if(r.windows)r.windows.style.opacity=String(ease(p/.25)*ease((1-p)/.2));
 if(r.clockhand)r.clockhand.style.opacity=String(envelope*.35);
 if(r.steam)r.steam.style.opacity=String(envelope*.65);
 if(r.open){const opened=ease(p/.22)*ease((1-p)/.18);r.open.style.opacity=String(opened);r.base.style.opacity=String(1-opened);}
 if(r.sand)r.sand.style.opacity=String(envelope*.85);
 if(r.castle){const built=ease(clamp((p-.10)/.48));r.base.style.opacity=String(1-ease(p/.10));r.castle.style.opacity=String(ease(p/.12));r.castle.style.clipPath=`inset(${(1-built)*98}% 0 0 0)`;}
 if(r.orbit){const a=p*Math.PI*2,rx=r.width*.39,ry=r.height*.22,size=1-.58*envelope;r.base.style.width=size*100+'%';r.base.style.height=size*100+'%';r.base.style.left=(1-size)*50+'%';r.base.style.top=(1-size)*50+'%';r.base.style.transform=`translate(${Math.cos(a)*rx*envelope}px,${Math.sin(a)*ry*envelope}px)`;r.orbit.style.opacity=String(envelope);r.visual.style.transform=`scale(${1+.03*envelope})`;}
 if(r.fly){const f=ease(clamp((p-.13)/.57)),s=r.origin,dest=r.destination;r.fly.style.left=s.x+(dest.x-s.x)*f+'px';r.fly.style.top=s.y+(dest.y-s.y)*f-Math.sin(f*Math.PI)*innerHeight*.17+'px';r.fly.style.transform=`translate(-50%,-50%) scale(${1-f*.74}) rotate(${f*12}deg)`;r.fly.style.opacity=String(p>.91?1-ease((p-.91)/.09):1);if(f>=1&&!r.added){basket.push(r.id);r.added=true;updateBasket();}}
 for(const wheel of r.wheels||[]){wheel.style.transform=`rotate(${(r.x-r.start)*r.face/Math.max(1,r.height*.035)*180/Math.PI}deg)`;}
 if(r.glow)r.glow.style.opacity=String(envelope*.55);if(r.beatPulse){const phase=t/r.beat%1;r.beatPulse.style.opacity=String(envelope*(.25+.6*(1-phase)));r.beatPulse.style.transform=`scale(${.85+phase*.4})`; }if(r.lantern)r.lantern.style.opacity=String(envelope*.75);if(r.route){r.route.style.opacity=String(envelope);r.route.style.strokeDashoffset=String(48-p*144);}if(r.peek)r.peek.style.opacity=String(envelope);
}
function play(el,id){
 const d=defs[id];if(!d)return;const old=active.get(el);if(old){if(['piano','drum','xylophone','tambourine','maracas','guitar','harp'].includes(d.motion))stop(el);else return old;}const img=el.querySelector('.idle-layer img');if(!img?.complete||!img.naturalWidth)return;
 if(active.size>=3)stop(active.keys().next().value);
 const orientation=el.querySelector('.orientation'),width=orientation.offsetWidth,height=orientation.offsetHeight,prior=positions.get(el)||{x:0,face:el.dataset.flip==='true'?-1:1},reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
 const motion=d.motion;let face=prior.face,distance=0;
 if(['boat','tram','bus','shop-cart','beach-crab'].includes(motion)&&!reduced&&el.dataset.embedded!=='true'){distance=Math.min(innerWidth*.22,width*(motion==='beach-crab'?.5:.8));const panel=el.closest('.panel'),left=el.offsetLeft,right=left+el.offsetWidth,section=el.dataset.region;let min=0,max=panel.offsetWidth;if(section&&g.GAME_SCENES[el.dataset.scene].sections){let cursor=0;for(const part of g.GAME_SCENES[el.dataset.scene].sections){const end=cursor+part.screens*g.__Animals.screenW();if(part.id===section){min=cursor;max=end;break;}cursor=end;}}
 if(d.travelRange){min=d.travelRange[0]*panel.offsetWidth;max=d.travelRange[1]*panel.offsetWidth;}const room=()=>face>0?max-right-prior.x-width*.1:left+prior.x-min-width*.1;if(room()<distance){face*=-1;distance=Math.min(distance,Math.max(0,room()));}distance*=face;}
 const action=node('div','chapter-action'),visual=node('div','chapter-visual',action),base=node('img','chapter-base',visual);base.src=asset(d.poster);base.alt='';base.draggable=false;
 const beat=tempo==='fast'?.32:.68,duration=reduced?900:(['piano','drum','xylophone','tambourine','maracas','guitar','harp'].includes(motion)?beat*4*1000+420:d.duration||5000);
 const r={embedded:el.dataset.embedded==='true',el,id,def:d,action,visual,base,idle:el.querySelector('.idle-layer'),orientation,width,height,face,start:prior.x,x:prior.x,distance,reduced,duration,beat,tempo,weight,frame:0,progress:0,ready:true,wheels:[]};
 for(const [kind,l]of Object.entries(d.extraLayers||{})){const im=node('img','chapter-'+kind,visual);im.src=asset(typeof l==='string'?l:l.path);im.alt='';if(typeof l==='object'&&l.rect){const[x,y,w,h]=l.rect;im.style.cssText=`left:${x*100}%;top:${y*100}%;width:${w*100}%;height:${h*100}%`;}if(kind==='open'){r.open=im;im.style.opacity='0';}}
 if(motion==='drum'||motion==='xylophone'){r.mallet=effect(r,'music-mallet');r.mallet.style.left=(motion==='drum'?49:60)+'%';r.mallet.style.top=(motion==='drum'?26:31)+'%';if(d.strikePoint){r.mallet.style.left=d.strikePoint[0]*100+'%';r.mallet.style.top=d.strikePoint[1]*100+'%';r.mallet.classList.add('embedded-mallet');}if(motion==='drum'){r.head=effect(r,'drum-head');if(d.strikeHeadRect){const q=d.strikeHeadRect;r.head.style.cssText=`left:${q[0]*100}%;top:${q[1]*100}%;width:${q[2]*100}%;height:${q[3]*100}%`;}}}
 if(motion==='guitar'||motion==='harp'){const ns='http://www.w3.org/2000/svg',svg=document.createElementNS(ns,'svg');svg.setAttribute('viewBox','0 0 100 100');svg.setAttribute('preserveAspectRatio','none');svg.classList.add('music-string-animation');r.visual.append(svg);r.strings=(d.stringLines||[]).map(()=>{const path=document.createElementNS(ns,'path');svg.append(path);return path;});}if(motion==='radio'){r.radio=effect(r,'radio-waves');for(let i=0;i<3;i++)node('i','',r.radio);}
 if(motion==='piano'){r.keys=[];for(let i=0;i<4;i++){const key=effect(r,'piano-key-light');key.style.left=(d.keys?.[i]?.[0]??(.28+i*.09))*100+'%';key.style.top=(d.keys?.[i]?.[1]??.58)*100+'%';if(d.keys?.[i]?.length===4){key.style.width=d.keys[i][2]*100+'%';key.style.height=d.keys[i][3]*100+'%';}r.keys.push(key);}}
 if(motion==='windows'){r.windows=effect(r,'building-window-lights');for(const box of d.windows||[[.27,.25,.045,.025],[.48,.4,.04,.027],[.57,.62,.042,.025],[.34,.7,.04,.028]]){const cell=node('i','',r.windows);cell.style.cssText=`left:${box[0]*100}%;top:${box[1]*100}%;width:${box[2]*100}%;height:${box[3]*100}%`;}}
 if(motion==='clock'){r.clockhand=effect(r,'clock-hand');const q=d.clockCenter||[.5,.2];r.clockhand.style.left=q[0]*100+'%';r.clockhand.style.top=q[1]*100+'%';}
 if(motion==='steam'){r.steam=effect(r,'dim-sum-steam');for(const [i,q]of (d.steamAnchors||[{x:.32,y:.6},{x:.53,y:.64},{x:.76,y:.64}]).entries()){const puff=node('i','',r.steam);puff.style.left=(Array.isArray(q)?q[0]:q.x)*100+'%';puff.style.top=(Array.isArray(q)?q[1]:q.y)*100+'%';puff.style.animationDelay=-i*.4+'s';}}
 if(['tram','bus','shop-cart'].includes(motion))for(const q of d.wheels||[]){const wh=effect(r,'vehicle-hub');wh.style.cssText=`left:${q.x*100}%;top:${q.y*100}%;width:${q.r*200}%;height:${q.r*200*width/height}%`;r.wheels.push(wh);}
 if(motion.startsWith('weather-'))setWeather(motion.slice(8)==='umbrella'?'rain':motion.slice(8));
 if(motion==='beach-wave'){const panel=el.closest('.panel');panel.classList.remove('shore-active');void panel.offsetWidth;panel.classList.add('shore-active');setTimeout(()=>panel.classList.remove('shore-active'),reduced?900:5500);}
 if(motion==='beach-bucket'||motion==='beach-shovel')r.sand=effect(r,'sand-trickle');
 if(motion==='beach-castle'){r.castle=effect(r,'sandcastle-reveal');const full=node('img','',r.castle);full.src=asset(d.poster);r.base.style.opacity='0';r.castle.style.opacity='0';castleBuilt=true;}
 if(['earth-orbit','planet-orbit','satellite'].includes(motion)){
  r.orbit=effect(r,'orbit-guide');const center=node('img','orbit-center',r.orbit);center.src=asset(defs[motion==='satellite'?'cosmosearth':'cosmossun'].poster);const label=node('span','orbit-label',r.orbit);label.textContent='轨道示意';
 }
 if(['sun','stars','galaxy','weather-rainbow','shop-basket'].includes(motion))r.glow=effect(r,'chapter-glow');
 if(motion==='shop-product'){const rect=el.getBoundingClientRect(),dock=document.querySelector('.shopping-dock').getBoundingClientRect();r.origin={x:rect.left+rect.width/2,y:rect.top+rect.height/2};r.destination={x:dock.left+dock.width/2,y:dock.top+dock.height/2};r.fly=node('img','shopping-flight',document.body);r.fly.src=asset(d.poster);const flightScale=Math.min(1,130/rect.width,130/rect.height);const fh=Math.min(120,rect.height),fw=fh*(d.posterAspect||rect.width/rect.height);r.fly.style.width=fw+'px';r.fly.style.height=fh+'px';r.base.style.opacity='.6';}
 if(motion==='shop-basket'){basket.length=0;updateBasket();}
 if(r.embedded&&['tambourine','maracas','shop-cart'].includes(motion)){r.beatPulse=effect(r,'music-beat-pulse');r.beatPulse.textContent=motion==='shop-cart'?'':'♪';}if(motion==='camp-lantern')r.lantern=effect(r,'camp-lantern-glow');if(motion==='camp-map'){const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.classList.add('camp-route');svg.setAttribute('viewBox','0 0 100 100');svg.innerHTML='<path d="M23 45Q34 21 47 35T68 34T76 22" fill="none" stroke="#ffe49a" stroke-width="2" stroke-dasharray="4 3"/>';r.visual.append(svg);r.route=svg.querySelector('path');}if(motion==='camp-binoculars'){r.peek=node('div','camp-peek',el.closest('.panel'));r.peek.style.left=(el.offsetLeft+width*.5-height*.45)+'px';r.peek.style.top=Math.max(innerHeight*.19,el.offsetTop-height*.92)+'px';r.peek.style.width=height*1.5+'px';r.peek.style.height=height*1.1+'px';r.peek.style.backgroundImage=`url("${asset(g.GAME_SCENES.camp.bgStrip)}")`;}orientation.style.transform=`scaleX(${face})`;r.idle.style.visibility='hidden';el.classList.add('acting');el.querySelector('.sprite').append(action);active.set(el,r);counts.set(id,(counts.get(id)||0)+1);render(r,0);
 const start=performance.now();function tick(now){if(active.get(el)!==r)return;const p=clamp((now-start)/duration);render(r,p);if(p<1)r.frame=requestAnimationFrame(tick);else stop(el);}r.frame=requestAnimationFrame(tick);return r;
}
g.ChapterObjects={defs,play,stop,preload,attach,mountPanel,mountUI,sceneChanged,setWeather,get weather(){return weather;},get basket(){return [...basket];},get tempo(){return tempo;},get weight(){return weight;},setMusic(t,w){tempo=t;weight=w;},stopAll(){[...active.keys()].forEach(stop);},isActing:el=>active.has(el),seek(el,p){const r=active.get(el);if(r){cancelAnimationFrame(r.frame);render(r,p);}},inspect(el){const r=active.get(el);return r?{id:r.id,renderer:'chapter-originals',motion:r.def.motion,ready:r.ready,progress:r.progress,duration:r.duration,x:r.x,travel:r.distance,face:r.face,zoom:r.zoom,tempo:r.tempo,weight:r.weight,weather,basket:basket.length,windows:!!r.windows,orbit:!!r.orbit,wheels:r.wheels.length,flight:!!r.fly,open:r.open?Number(r.open.style.opacity):null}:null;}};
})(window);
