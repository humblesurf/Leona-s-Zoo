(function(){
'use strict';
const D=window.GAME_DIALOGUE,S=window.GAME_SCENES,order=window.GAME_SCENE_ORDER;
const asset=p=>window.resolveAsset?window.resolveAsset(p):p;
const strip=document.getElementById('strip'),world=document.getElementById('world'),nav=document.getElementById('habitats');
const subtitle=document.getElementById('subtitle'),intro=document.getElementById('intro');
const languageButton=document.getElementById('languageButton'),languageMenu=document.getElementById('languageMenu'),soundButton=document.getElementById('soundButton'),musicButton=document.getElementById('musicButton');
const icons={savanna:'🌾',rainforest:'🌿',ocean:'🐠',polar:'❄️',market:'🍎',farm:'🚜',harbor:'⛵',camp:'⛺',space:'🌕',music:'🎹',hongkong:'🚋',beach:'⛱️',planets:'🪐',weather:'🌈',supermarket:'🛒'},labels={savanna:'草原',rainforest:'雨林',ocean:'海底',polar:'极地',market:'菜市场',farm:'农场',harbor:'港口',camp:'露营',space:'月球与火星',music:'音乐小屋',hongkong:'香港',beach:'海边度假',planets:'行星与星空',weather:'天气与四季',supermarket:'逛超市'};
const sequences={en:['en'],yue:['yue'],cmn:['cmn'],'en-yue':['en','yue'],'en-cmn':['en','cmn'],'cmn-yue':['cmn','yue'],all:['en','yue','cmn']};
const previousScene=document.getElementById('previousScene'),nextScene=document.getElementById('nextScene');
const langLabels={en:'English',yue:'粤语',cmn:'普通话','en-yue':'英 · 粤','en-cmn':'英 · 普','cmn-yue':'普 · 粤',all:'三语'};
let camera=0,sw=0,vh=0,vw=0,worldW=0,velocity=0,frame=0,lastFrame=0,currentScene='';
let drag=null,selectedLanguage='en',muted=false,musicEnabled=true,backgroundDucked=false,ctx=null,ambMaster=null,ambAnalyser=null,ambients={},narration=null,token=0,abortPlayback=null;
let introDismissed=false,introTravel=0;
const voiceBags={},lastVoice={},recognizedAnimals=new Set();let lastLearning=null;
const navToggle=document.getElementById('navToggle'),navEdge=document.getElementById('navEdge');
let navTimer=0;
function hideNavigation(){clearTimeout(navTimer);document.body.classList.remove('nav-open');nav.setAttribute('aria-hidden','true');nav.inert=true;navToggle.setAttribute('aria-expanded','false');navToggle.setAttribute('aria-label','展开场景导航');}
function scheduleNavigationHide(ms=2200){clearTimeout(navTimer);navTimer=setTimeout(()=>{if(!nav.contains(document.activeElement))hideNavigation();},ms);}
function showNavigation(){clearTimeout(navTimer);document.body.classList.add('nav-open');nav.setAttribute('aria-hidden','false');nav.inert=false;navToggle.setAttribute('aria-expanded','true');navToggle.setAttribute('aria-label','收起场景导航');scheduleNavigationHide();}
navToggle.addEventListener('click',()=>document.body.classList.contains('nav-open')?hideNavigation():showNavigation());
navEdge.addEventListener('pointerenter',e=>{if(e.pointerType==='mouse'&&!drag)showNavigation();});
navEdge.addEventListener('pointerdown',e=>{e.preventDefault();showNavigation();});
nav.addEventListener('pointerenter',()=>clearTimeout(navTimer));
nav.addEventListener('pointerleave',()=>scheduleNavigationHide(1100));
nav.addEventListener('pointerdown',()=>clearTimeout(navTimer));
nav.addEventListener('pointerup',()=>scheduleNavigationHide());
nav.addEventListener('focusout',()=>scheduleNavigationHide(900));
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&document.body.classList.contains('nav-open')){hideNavigation();navToggle.focus();}});
function chooseVoice(d,lang,characterRole=null,mode='intro'){
 const variants=(mode==='name'?d.nameVoiceVariants?.[lang]:d.voiceVariants?.[lang])||[{key:'original',path:d.voice[lang]}];
 if(characterRole){const role=characterRole==='child'?(lang==='en'?'child':'bright'):characterRole;const performer=v=>v.role||(['male','female','child','bright'].includes(v.key)?v.key:v.path?.includes('-male.')?'male':v.path?.includes('-female.')?'female':v.path?.includes('-bright.')?'bright':lang==='en'?'child':'female');const voice=variants.find(v=>performer(v)===role);return voice?{...voice,role,characterRole}:{key:role,role,characterRole,path:null};}
 if(!voiceBags[lang]?.length){
  const bag=variants.map(v=>v.key);for(let i=bag.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[bag[i],bag[j]]=[bag[j],bag[i]];}
  if(bag.length>1&&bag[bag.length-1]===lastVoice[lang])[bag[0],bag[bag.length-1]]=[bag[bag.length-1],bag[0]];
  voiceBags[lang]=bag;
 }
 const key=voiceBags[lang].pop();lastVoice[lang]=key;return variants.find(v=>v.key===key)||variants[0];
}
function dismissIntro(){
if(introDismissed)return;introDismissed=true;intro.setAttribute('aria-hidden','true');intro.classList.add('leaving');document.body.classList.add('immersive');document.getElementById('sceneTag').setAttribute('aria-hidden','true');
setTimeout(()=>{intro.hidden=true;},matchMedia('(prefers-reduced-motion: reduce)').matches?0:550);
}
function trackIntroTravel(delta){if(!introDismissed){introTravel+=Math.abs(delta);if(introTravel>=60)dismissIntro();}}
const landscape=matchMedia('(orientation: landscape)');
function updateOrientation(){
const wide=landscape.matches;document.getElementById('orientationGuide').classList.toggle('landscape',wide);
document.getElementById('orientationTitle').textContent=wide?'横屏准备好啦！':'把手机横过来';
document.getElementById('orientationDescription').textContent=wide?'一起认识动物朋友吧':'横屏看，动物世界更宽阔';
}
updateOrientation();if(landscape.addEventListener)landscape.addEventListener('change',updateOrientation);else landscape.addListener(updateOrientation);
const voiceAudio=new Audio();voiceAudio.preload='auto';
const timers=new Set();
function later(fn,ms){const t=setTimeout(()=>{timers.delete(t);fn();},ms);timers.add(t);return t;}
function sceneWidth(id){const sc=S[id];return sc.panorama?Math.max(vw,vh*(sc.bgAspect||3)):sc.numScreens*sw;}
function sceneAt(cam=camera){let c=((cam+vw*.5)%worldW+worldW)%worldW,acc=0;for(const id of order){const width=sceneWidth(id);if(c<acc+width)return {id,local:c-acc};acc+=width;}return {id:order[0],local:0};}
function currentStart(id){let start=0;for(const sid of order){if(sid===id)return start;start+=sceneWidth(sid);}return 0;}
function setAmbient(id){
if(!ctx||!ambMaster)return;
for(const [sid,item]of Object.entries(ambients)){const {gain,audio}=item;
const p=gain.gain,t=ctx.currentTime;p.cancelScheduledValues(t);p.setValueAtTime(p.value,t);p.linearRampToValueAtTime(sid===id?1:0,t+.8);
if(sid===id&&musicEnabled){audio.play().then(()=>{item.error=null;musicButton.classList.remove('music-locked');}).catch(e=>{item.error=e.name;musicButton.classList.add('music-locked');});}else setTimeout(()=>{if(currentScene!==sid||!musicEnabled)audio.pause();},850);
}}
function duck(on){backgroundDucked=on;if(!ambMaster)return;const g=ambMaster.gain,t=ctx.currentTime;g.cancelScheduledValues(t);g.setValueAtTime(g.value,t);g.linearRampToValueAtTime(!musicEnabled?0:on&&!muted?.12:.38,t+.35);}
function unlockAudio(){
if(ctx){if(ctx.state==='suspended')ctx.resume().then(()=>{if(musicEnabled)setAmbient(sceneAt().id);}).catch(()=>{});setAmbient(sceneAt().id);duck(backgroundDucked);return;}
try{ctx=new(window.AudioContext||window.webkitAudioContext)();ambMaster=ctx.createGain();ambMaster.gain.value=musicEnabled?.38:0;ambAnalyser=ctx.createAnalyser();ambAnalyser.fftSize=512;ambMaster.connect(ambAnalyser);ambAnalyser.connect(ctx.destination);
for(const id of order){const a=new Audio(asset(S[id].ambience));a.loop=true;a.preload='auto';const gain=ctx.createGain();gain.gain.value=0;ctx.createMediaElementSource(a).connect(gain);gain.connect(ambMaster);ambients[id]={gain,audio:a,error:null};}
ctx.resume().then(()=>setAmbient(sceneAt().id)).catch(()=>{});setAmbient(sceneAt().id);
}catch(e){ctx=null;}}
function apply(){
 if(!worldW)return;camera=((camera%worldW)+worldW)%worldW;strip.style.transform=`translate3d(${-camera-worldW}px,0,0)`;
 const at=sceneAt(),id=at.id;
 if(id!==currentScene){
  currentScene=id;window.ChapterObjects?.sceneChanged(id);nav.querySelectorAll('button').forEach(b=>b.setAttribute('aria-current',String(b.dataset.scene===id)));setAmbient(id);
  const i=order.indexOf(id),prev=order[(i+order.length-1)%order.length],next=order[(i+1)%order.length];
  for(const [button,target]of [[previousScene,prev],[nextScene,next]]){button.dataset.scene=target;button.querySelector('small').textContent=labels[target];button.setAttribute('aria-label','前往'+labels[target]);}
 }
 const section=S[id].sections?.find((s,i,list)=>at.local<list.slice(0,i+1).reduce((n,x)=>n+x.screens*sw,0));
 const tag=section?S[id].label+' · '+section.label:S[id].label+' · '+({savanna:'SAVANNA',rainforest:'RAINFOREST',ocean:'OCEAN',market:'MARKET',farm:'FARM',harbor:'HARBOR',camp:'CAMP',space:'SPACE',music:'MUSIC',hongkong:'HONG KONG',beach:'BEACH',planets:'PLANETS',weather:'WEATHER',supermarket:'SUPERMARKET'}[id]);
 if(document.getElementById('sceneTag').textContent!==tag)document.getElementById('sceneTag').textContent=tag;
 // Preload only nearby characters, avoiding dozens of decoded atlases on phones.
 S[id].animals.filter(a=>Math.abs((a.renderU??a.u)*sceneWidth(id)-at.local)<vw*.85).forEach(a=>window.AnimalAnims.preload(a.id));
}
function attachEnvironment(panel,a,el,left){
if(a.browseTree){
 const tree=document.createElement('div');tree.className='browse-tree';tree.setAttribute('aria-hidden','true');panel.append(tree);
 const image=document.createElement('img');image.src=asset('assets/animation/v4-2/acacia.webp');image.alt='';image.draggable=false;image.style.cssText='width:100%;height:100%';tree.append(image);
 const ns='http://www.w3.org/2000/svg',twig=document.createElementNS(ns,'svg');twig.classList.add('browse-twig');twig.setAttribute('aria-hidden','true');panel.append(twig);
 const stem=document.createElementNS(ns,'path');stem.setAttribute('fill','none');stem.setAttribute('stroke','#88663b');stem.setAttribute('stroke-linecap','round');twig.append(stem);
 const leaves=[];for(let i=0;i<11;i++){const cluster=document.createElementNS(ns,'g'),wind=document.createElementNS(ns,'g');wind.classList.add('browse-leaf-live');wind.style.animationDelay=(-i*.47)+'s';
  for(const [d,fill]of [['M0 0Q10 -13 27 -4Q16 9 0 0',i%3===0?'#a6b856':'#739540'],['M0 0L27 -4L11 2Z',i%2?'#557d36':'#8ead48']]){const leaf=document.createElementNS(ns,'path');leaf.setAttribute('d',d);leaf.setAttribute('fill',fill);wind.append(leaf);}
  const vein=document.createElementNS(ns,'path');vein.setAttribute('d','M1 0L23 -4');vein.setAttribute('stroke','#c1cb78');vein.setAttribute('stroke-width','.7');vein.setAttribute('fill','none');wind.append(vein);cluster.append(wind);twig.append(cluster);leaves.push(cluster);
 }
 let layout;const project=(p,zoom)=>{const m=window.SpritePuppets.giraffeMouth(p,layout.width/layout.height),x=.5+(m.x-.5)*zoom,y=.96+(m.y-.96)*zoom;return {x:left+(a.flip?1:-1)*(.5-x)*layout.width-layout.x,y:a.feetY*vh-layout.height+y*layout.height-layout.y,m};};
 function update(p=0,zoom=1){if(!layout)return;const rest=project(.53,1.1),mouth=project(p,zoom),contact=mouth.m.bite;
  const tip={x:rest.x*(1-contact)+(mouth.x+(a.flip?1:-1)*layout.width*.018)*contact,y:rest.y*(1-contact)+mouth.y*contact};
  const start={x:left+(a.flip?1:-1)*layout.width*.78-layout.x,y:a.feetY*vh-layout.height*.77-layout.y},dx=tip.x-start.x,dy=tip.y-start.y;
  stem.setAttribute('d',`M${start.x} ${start.y}C${start.x+dx*.30} ${start.y-layout.height*.026} ${tip.x-dx*.22} ${tip.y+layout.height*.016} ${tip.x} ${tip.y}`);stem.setAttribute('stroke-width',String(layout.height*.006));
  for(const [i,leaf]of leaves.entries()){const t=.29+i*.066,x=start.x+dx*t,y=start.y+dy*t-layout.height*.019*Math.sin(t*Math.PI),angle=(a.flip?0:180)+(i%2?38:-42)+contact*Math.sin(p*6*Math.PI*2*1.15+i)*3,scale=layout.height/452*(i>8?.85:1.15);leaf.setAttribute('transform',`translate(${x} ${y}) rotate(${angle}) scale(${scale})`);const eaten=i>=9?Math.max(0,Math.min(1,(p-(i===9?.50:.64))/.10)):0;leaf.style.opacity=String(1-eaten*.96);}
  twig.dataset.contact=String(contact);twig.dataset.tipX=String(layout.x+tip.x);twig.dataset.tipY=String(layout.y+tip.y);twig.dataset.mouthX=String(layout.x+mouth.x);twig.dataset.mouthY=String(layout.y+mouth.y);
 }
 el._browseBranch={update,reset:()=>update(0,1)};
 return ()=>{const layer=el.querySelector('.orientation'),height=parseFloat(layer.style.height)||a.h*vh,width=parseFloat(layer.style.width)||height;
  const x=left+(a.flip?1:-1)*width*.34,y=a.feetY*vh-height*.67,treeH=height*1.05,treeW=treeH*1474/1018;tree.style.cssText=`left:${x-treeW*(a.flip?.10:.90)}px;top:${y-treeH*.36}px;width:${treeW}px;height:${treeH}px;transform:scaleX(${a.flip?-1:1})`;
  layout={width,height,x:left-width*.95,y:a.feetY*vh-height*.94};twig.style.cssText=`left:${layout.x}px;top:${layout.y}px;width:${width*1.9}px;height:${height*.48}px`;twig.setAttribute('viewBox',`0 0 ${width*1.9} ${height*.48}`);update();
 };
}
if(a.dryShore||(!a.support&&!a.waterDepth&&!['hippo','crocodile','otter','flamingo'].includes(a.id)))return;
const support=document.createElement('div');support.className='habitat-support';support.dataset.for=a.id;panel.appendChild(support);
function position(){
 const layer=el.querySelector('.orientation'),h=parseFloat(layer.style.height)||parseFloat(el.style.height),w=parseFloat(layer.style.width)||parseFloat(el.style.width),top=parseFloat(el.style.top)+(parseFloat(layer.style.top)||0);
 if(a.support==='leaf'){
  support.style.cssText=`left:${left-w*.65}px;top:${a.feetY*vh-h*.09}px;width:${w*1.3}px;height:${h*.25}px;z-index:3`;
  support.innerHTML='<svg viewBox="0 0 200 45" width="100%" height="100%" aria-hidden="true"><path d="M4 24Q32-4 97 5Q165-8 196 24Q159 49 101 37Q40 50 4 24" fill="#477c3f"/><path d="M4 24Q50 12 98 19L196 24L102 29Z" fill="#72a84a"/><path d="M10 24H188M52 12L75 24L52 37M135 10L119 24L140 37" stroke="#a7c670" stroke-width="1.5" fill="none"/></svg>';
  return;
 }
 if(!a.support){
  support.style.cssText=`left:${left-w*.58}px;top:${a.feetY*vh-h*(a.waterDepth||.07)-h*.03}px;width:${w*1.16}px;height:${h*.09}px;z-index:14`;
  support.innerHTML='<svg viewBox="0 0 200 35" width="100%" height="100%" aria-hidden="true"><path d="M8 16Q45 7 69 13M134 11Q162 8 191 17M26 24Q63 30 88 24M120 25Q157 31 184 23" stroke="#e6fcf2" stroke-width="2" fill="none" opacity=".75"/></svg>';
  return;
 }
 const anchors={sloth:.035,monkey:.035,orangutan:.035,toucan:.935,macaw:.814,leopard:.40,boa:.92,chameleon:.90};
 const gripY=top+h*(a.gripY??anchors[a.id]??.90),branchY=gripY-(a.support==='vine'?vh*.115:0);
 const gx=window.ANIMAL_ANIMATIONS?.[a.id]?.gripX??.5;
 const gripX=left+w*((a.flip?1-gx:gx)-.5);
 const treeH=(vh*.87-branchY)/(.965-.28),treeW=treeH*2/3;
 support.style.cssText=`left:${gripX-treeW*.65}px;top:${branchY-treeH*.28}px;width:${treeW}px;height:${treeH}px;z-index:2`;
 support.replaceChildren();const tree=document.createElement('img');tree.src=asset('assets/animation/support-tree-v4.webp');tree.alt='';tree.draggable=false;tree.className='support-tree';support.appendChild(tree);
 if(a.support==='vine'){
  const vine=document.createElementNS('http://www.w3.org/2000/svg','svg');vine.setAttribute('aria-hidden','true');vine.style.cssText=`position:absolute;left:${treeW*.65-16}px;top:${treeH*.28}px;width:32px;height:${gripY-branchY+7}px;overflow:visible`;
  const length=gripY-branchY;vine.setAttribute('viewBox',`0 0 32 ${length+7}`);vine.innerHTML=`<path d="M16 0C7 ${length*.35} 26 ${length*.65} 16 ${length+3}" stroke="#596e32" stroke-width="4" fill="none" stroke-linecap="round"/><path d="M15 ${length*.38}q-19-12-9-17q12-2 9 17M18 ${length*.66}q17-11 10-17q-12-1-10 17" fill="#638f3e"/>`;support.appendChild(vine);
 }
}
return position;
}
function build(){
window.AnimalAnims.stopAll();vh=innerHeight;vw=innerWidth;sw=Math.max(vw,vh*1180/820);worldW=order.reduce((sum,id)=>sum+sceneWidth(id),0);strip.replaceChildren();
for(let copy=0;copy<3;copy++)for(const sid of order){
const sc=S[sid],w=sceneWidth(sid),panel=document.createElement('section');panel.className='panel';panel.dataset.scene=sid;panel.style.width=w+'px';panel.setAttribute('aria-label',sc.label);
const bg=document.createElement('div');bg.className='bg';
const nativeWidth=vh*(sc.bgAspect||16/9),count=Math.ceil(w/nativeWidth),segment=nativeWidth;
let regionLeft=0;
for(const part of sc.sections||[{...sc,screens:sc.numScreens}]){
 const width=sc.panorama?w:part.screens*sw,region=document.createElement('div');region.className='bg-region';region.style.cssText=`left:${regionLeft}px;width:${width}px`;
 if(sc.sectionBlend){const blend=vh*sc.sectionBlend,isFirst=regionLeft===0;region.style.overflow='visible';region.style.zIndex=isFirst?'1':'2';if(!isFirst){region.style.left=(regionLeft-blend)+'px';region.style.width=(width+blend)+'px';region.style.maskImage=`linear-gradient(to right,transparent,black ${blend*2}px)`;}region.dataset.blend=String(blend);}
 const sources=part.bgPanels||[part.bgStrip],tileWidth=sc.singleBackground?width:(sc.panorama?w:vh*(part.bgAspect||sc.bgAspect||16/9));
 const tiles=sc.singleBackground?1:Math.ceil(width/tileWidth-1e-4);
 for(let i=0;i<tiles;i++){
  const tile=document.createElement('div');tile.className='bg-panel';tile.style.cssText=`left:${i*tileWidth}px;width:${tileWidth+(window.CHAPTER_OBJECTS&&['music','hongkong','beach','planets','weather','supermarket'].includes(sid)?1:0)}px;background-image:url("${asset(sources[i%sources.length])}")`;
  if(sc.bgFit==='fill')tile.style.backgroundSize='100% 100%';
  if((part.bgMirror??sc.bgMirror)&&i%2)tile.style.transform='scaleX(-1)';region.appendChild(tile);
 }
 bg.appendChild(region);
 if(sc.sections){const label=document.createElement('span');label.className='polar-region-label';label.textContent=part.label;label.style.left=(regionLeft+width*.5)+'px';panel.appendChild(label);}
 regionLeft+=width;
}
panel.appendChild(bg);
for(const d of [...(sc.backgroundHerds||[]),...(sc.decor||[])]){
 const image=document.createElement('img');image.className=d.id?'distant-animal':'scene-decoration';image.src=asset(d.sprite||window.ANIMAL_ANIMATIONS?.[d.id]?.poster);image.alt='';image.draggable=false;image.setAttribute('aria-hidden','true');
 let decorLeft=d.u*w,decorFlip=d.flip;if(d.bgAnchorX!==undefined){const points=Array.from({length:count},(_,i)=>({i,x:i*segment+(sc.bgMirror&&i%2?1-d.bgAnchorX:d.bgAnchorX)*segment})).filter(p=>p.x>0&&p.x<w);const near=points.reduce((b,p)=>Math.abs(p.x-decorLeft)<Math.abs(b.x-decorLeft)?p:b,points[0]);if(near){decorLeft=near.x;decorFlip=!!d.flip!==!!(sc.bgMirror&&near.i%2);}}
 image.style.cssText=`left:${decorLeft}px;top:${(d.feetY-d.h)*vh}px;height:${d.h*vh}px;transform:translateX(-50%) scaleX(${decorFlip?-1:1});z-index:${d.depth||Math.round(d.feetY*10)+2};opacity:${d.opacity??1}`;panel.appendChild(image);
}
window.ExplorationObjects?.mountPanel(panel,sc,w,vh);window.ChapterObjects?.mountPanel(panel,sc,w,vh);
if(sc.schools)for(const [schoolIndex,school]of sc.schools.entries()){
 const group=document.createElement('div');group.className='fish-school';group.style.cssText=`left:${school.u*w}px;top:${school.y*vh}px;width:${vh*.48}px;height:${vh*.16}px;--drift:${school.direction*vh*.16}px;animation-delay:${-schoolIndex*4}s`;group.setAttribute('aria-hidden','true');
 for(let i=0;i<school.count;i++){
  const fish=document.createElement('img'),size=school.scale*vh*(.82+(i%3)*.15),fishId=school.ids?.[i%school.ids.length]||'reeffish';fish.src=asset(window.ANIMAL_ANIMATIONS?.[fishId]?.poster||'assets/animation/v4-1/reeffish-poster.webp');fish.alt='';fish.draggable=false;
  fish.style.cssText=`left:${(i%4)*vh*.10}px;top:${Math.floor(i/4)*vh*.075+(i%2)*vh*.025}px;width:${size*1.8}px;height:${size}px;--face:${school.direction};animation-delay:${-i*.7}s`;group.appendChild(fish);
 }panel.appendChild(group);
}
if(sc.fireflies)for(const item of sc.fireflies){const light=document.createElement('span');light.className='firefly';light.style.cssText=`left:${item.u*w}px;top:${item.y*vh}px;animation-delay:${-item.u*9}s`;light.setAttribute('aria-hidden','true');panel.appendChild(light);}
for(const a of sc.animals){
const el=document.createElement('button');el.className='animal idle-'+a.idle;el.type='button';el.dataset.id=a.id;el.dataset.scene=sid;el.dataset.flip=String(!!a.flip);el.dataset.special=a.special||'';el.dataset.instance=a.instance;el.dataset.region=a.region||'';el.setAttribute('aria-label',`${D[a.id].name.cmn}，点击听介绍`);el.tabIndex=copy===1?0:-1;
if(a.voiceRole)el.dataset.voiceRole=a.voiceRole;
if(D[a.id].learningMode)el.setAttribute('aria-label',`${D[a.id].name.cmn}，点击听名字，再次点击听介绍`);
if(!a.instance)el.dataset.instance=sid+':'+a.id+':'+sc.animals.indexOf(a);
if(a.embedded){el.classList.add('embedded-prop');el.dataset.embedded='true';if(a.hitPolygon)el.style.clipPath=`polygon(${a.hitPolygon.map(p=>p.map(x=>x*100+'%').join(' ')).join(',')})`;}if(a.submerged)el.classList.add('submerged-animal');if(a.waterDepth){el.classList.add('waterline-animal');el.style.setProperty('--water-cut',a.waterDepth*100+'%');el.dataset.waterDepth=String(a.waterDepth);}
let left=a.u*w;
if(a.bgAnchorX!==undefined){const candidates=Array.from({length:count},(_,i)=>({x:i*segment+(sc.bgMirror&&i%2?1-a.bgAnchorX:a.bgAnchorX)*segment})).filter(p=>p.x>vh*.08&&p.x<w-vh*.08);if(candidates.length)left=candidates.reduce((best,p)=>Math.abs(p.x-left)<Math.abs(best.x-left)?p:best,candidates[0]).x;}
if(a.pondGroup&&sc.bgMirror){
 const hippo=sc.animals.find(b=>b.id==='hippo'),target=(hippo?.u??sc.pondAnchor??a.u)*w,centre=sc.pondCentre??.65;
 const shores=sc.animals.filter(b=>b.pondGroup===a.pondGroup).map(b=>b.shoreX);
 const ponds=Array.from({length:count},(_,i)=>({i,x:i*segment+(i%2?1-centre:centre)*segment})).filter(p=>p.x>vw*.2&&p.x<w-vw*.2&&shores.every(x=>{const point=p.i*segment+(p.i%2?1-x:x)*segment;return point>vw*.06&&point<w-vw*.06;}));
 const main=ponds.reduce((best,p)=>Math.abs(p.x-target)<Math.abs(best.x-target)?p:best,ponds[0]);
 const candidates=a.pondGroup==='crocodile'?ponds.filter(p=>p.i!==main.i):[main];
 const nearest=candidates.reduce((best,p)=>Math.abs(p.x-a.u*w)<Math.abs(best.x-a.u*w)?p:best,candidates[0]||main);
 left=nearest.i*segment+(nearest.i%2?1-a.shoreX:a.shoreX)*segment;
}
el.dataset.u=String(left/w);a.renderU=left/w;
const height=(vh<=500&&vw>vh&&sid==='supermarket'&&window.CHAPTER_OBJECTS?.[a.id]?.motion==='shop-product'?Math.min(a.h,.16):a.h)*vh;el.style.height=height+'px';el.style.width=height+'px';el.style.top=(a.feetY*vh-height)+'px';el.style.left=(left-height/2)+'px';el.style.zIndex=String(Math.round(a.feetY*10)+3);
const shadow=document.createElement('div');shadow.className='shadow';el.appendChild(shadow);
const orientation=document.createElement('div');orientation.className='orientation';orientation.style.transform=`scaleX(${a.flip?-1:1}) rotate(${a.rotate||0}deg)`;
const sprite=document.createElement('div');sprite.className='sprite';const idle=document.createElement('div');idle.className='idle-layer';idle.style.animationDelay=(-a.u*5)+'s';
const img=document.createElement('img');img.src=asset(a.sprite||window.ANIMAL_ANIMATIONS?.[a.id]?.poster||`assets/animals/${a.id}.webp`);img.alt='';img.draggable=false;img.decoding='async';
let positionSupport;const fit=()=>{if(a.embedded){const box=a.embeddedBounds||[a.u-a.h*(a.hitWidthRatio||1)*vh/w/2,a.feetY-a.h,a.h*(a.hitWidthRatio||1)*vh/w,a.h];const width=box[2]*w,hh=box[3]*vh;el.style.cssText+=`;left:${box[0]*w}px;top:${box[1]*vh}px;width:${Math.max(44,width)}px;height:${Math.max(44,hh)}px`;orientation.style.cssText+=`;width:${width}px;height:${hh}px;left:0;top:0`;return;}if(img.naturalWidth){const aspect=img.naturalWidth/img.naturalHeight,width=Math.min(height*aspect,vw*(a.maxWidth||.9)),fittedHeight=width/aspect,targetW=Math.max(44,width),targetH=Math.max(44,fittedHeight);if(a.basketHotspot){const hitW=a.basketHotspot.width*w,hitH=a.basketHotspot.height*vh;el.classList.add('basket-hotspot');el.style.width=hitW+'px';el.style.height=hitH+'px';el.style.top=a.basketHotspot.top*vh+'px';el.style.left=(left-hitW/2)+'px';orientation.style.width=width+'px';orientation.style.height=fittedHeight+'px';orientation.style.left=((hitW-width)/2)+'px';orientation.style.top=((hitH-fittedHeight)/2)+'px';}else{el.style.width=targetW+'px';el.style.height=targetH+'px';el.style.top=(a.feetY*vh-targetH)+'px';el.style.left=(left-targetW/2)+'px';orientation.style.width=width+'px';orientation.style.height=fittedHeight+'px';orientation.style.left=((targetW-width)/2)+'px';orientation.style.top=(targetH-fittedHeight)+'px';}positionSupport?.();}};
idle.appendChild(img);sprite.appendChild(idle);orientation.appendChild(sprite);el.appendChild(orientation);panel.appendChild(el);
img.onload=fit;if(img.complete)fit();
window.ExplorationObjects?.attach(el,a.id);window.ChapterObjects?.attach(el,a.id);
if(a.model){el.classList.add('planet-model');const caption=document.createElement('span');caption.className='planet-model-caption';caption.textContent=D[a.id].name.cmn+'模型';el.append(caption);}
positionSupport=attachEnvironment(panel,a,el,left);positionSupport?.();
el.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();activate(el);}});
el.addEventListener('focus',()=>{if(copy!==1)return;cancelFrame();camera=currentStart(sid)+Math.max(0,left-vw/2);world.scrollLeft=0;apply();});
}strip.appendChild(panel);}
strip.style.width=worldW*3+'px';apply();}
function cancelFrame(){if(frame)cancelAnimationFrame(frame);frame=0;velocity=0;}
function glide(time){const dt=Math.min(32,time-lastFrame||16);lastFrame=time;if(drag)return;const dx=velocity*dt/1000;camera-=dx;trackIntroTravel(dx);velocity*=Math.pow(.93,dt/16.667);apply();if(Math.abs(velocity)>8)frame=requestAnimationFrame(glide);else frame=0;}
function goScene(id){
if(!S[id])return;cancelFrame();stopSpeech();dismissIntro();const target=currentStart(id)+Math.max(0,S[id].animals[0].u*sceneWidth(id)-vw/2);let distance=target-camera;if(distance>worldW/2)distance-=worldW;if(distance<-worldW/2)distance+=worldW;
const start=camera,t0=performance.now(),duration=matchMedia('(prefers-reduced-motion: reduce)').matches?0:650;
const step=t=>{const p=duration?Math.min(1,(t-t0)/duration):1;camera=start+distance*(1-Math.pow(1-p,3));apply();if(p<1)frame=requestAnimationFrame(step);else frame=0;};frame=requestAnimationFrame(step);unlockAudio();}
for(const id of order){const b=document.createElement('button');b.dataset.scene=id;b.innerHTML=`<span class="nav-icon">${icons[id]}</span>${labels[id]}`;b.addEventListener('click',()=>{goScene(id);b.blur();scheduleNavigationHide(1000);});nav.appendChild(b);}
const navClose=document.createElement('button');navClose.className='nav-close';navClose.setAttribute('aria-label','收起场景导航');navClose.textContent='⌄';navClose.addEventListener('click',()=>{hideNavigation();navToggle.focus();});nav.appendChild(navClose);
function show(d,text,label){subtitle.querySelector('.sub-source')?.remove();subtitle.querySelector('.sub-emoji').textContent=d.emoji;subtitle.querySelector('.sub-text').textContent=text;subtitle.querySelector('.sub-label').textContent=label;subtitle.classList.add('show');subtitle.querySelector('.sub-copy').scrollLeft=0;}
function stopSpeech(){token++;if(abortPlayback){abortPlayback();abortPlayback=null;}for(const t of timers)clearTimeout(t);timers.clear();voiceAudio.onended=null;voiceAudio.onerror=null;voiceAudio.pause();if(narration){narration=null;}window.AnimalCalls.stop();if(window.speechSynthesis)window.speechSynthesis.cancel();subtitle.classList.remove('show');duck(false);}
function fallback(text,lang,t,characterRole=null){return new Promise(resolve=>{
if(t!==token){resolve(false);return;}if(!window.speechSynthesis){later(()=>resolve(false),2400);return;}
const code={en:'en-US',yue:'zh-HK',cmn:'zh-CN'}[lang],voices=speechSynthesis.getVoices();
const local=voices.filter(v=>v.lang.toLowerCase()===code.toLowerCase()),cast=characterRole==='male'?/Andrew|David|Guy|Yunxi\b|WanLung|\bMale\b/i:characterRole==='female'?/Emma|Jenny|Aria|Xiaoxiao|HiuMaan|\bFemale\b/i:characterRole==='child'?{en:/Ana\b/i,yue:/HiuGaai/i,cmn:/Yunxia\b/i}[lang]:null;
const voice=cast?local.find(v=>cast.test(v.name)):local.find(v=>/natural|neural|enhanced|premium/i.test(v.name))||local[0];
if(!voice){later(()=>resolve(false),2600);return;}
const u=new SpeechSynthesisUtterance(text);u.lang=code;u.voice=voice;u.rate=.92;u.volume=.75;
let finished=false;const finish=(success=true)=>{if(finished)return;finished=true;clearTimeout(guard);timers.delete(guard);resolve(success);};
const guard=later(()=>{if(t===token)speechSynthesis.cancel();finish(false);},Math.max(6000,text.length*(lang==='en'?100:300)));u.onend=()=>finish(true);u.onerror=()=>finish(false);speechSynthesis.speak(u);
});}
function playLine(d,lang,t,voice,mode='intro'){return new Promise(resolve=>{
const text=mode==='name'?d.name[lang]:d.intro[lang];if(t!==token){resolve(false);return;}show(d,text,(mode==='name'?'认识动物 · ':d.name.cmn+' · ')+langLabels[lang]);
if(muted){later(()=>resolve(true),mode==='name'?Math.max(900,Math.min(1800,text.length*80)):Math.max(2400,Math.min(5200,text.length*100)));return;}
const audio=voiceAudio;audio.onended=null;audio.onerror=null;audio.dataset.narrator=voice.role||voice.key;audio.dataset.characterRole=voice.characterRole||'';audio.dataset.mode=mode;audio.volume=.8;narration=audio;
let finished=false,failing=false;const finish=(success=true)=>{if(finished)return;finished=true;clearTimeout(guard);timers.delete(guard);if(narration===audio)narration=null;resolve(success);};
const fail=()=>{if(finished||failing)return;failing=true;audio.pause();audio.onended=null;audio.onerror=null;if(t!==token){finish(false);return;}fallback(text,lang,t,voice.characterRole).then(finish);};
const guard=later(()=>{audio.pause();finish(false);},mode==='name'?8000:25000);audio.onended=()=>finish(true);audio.onerror=fail;if(!voice.path){fail();return;}audio.src=asset(voice.path);audio.play().catch(fail);
});}
async function activate(el){
if(!el)return;stopSpeech();unlockAudio();const t=token,id=el.dataset.id,d=D[id];if(!d)return;
const instance=el.dataset.instance||el.dataset.scene+':'+id+':'+el.dataset.u,mode=d.learningMode&&!recognizedAnimals.has(instance)?'name':'intro',characterRole=el.dataset.voiceRole||d.voiceRole||null;lastLearning={id,instance,mode,characterRole,phase:'starting'};
const cancelled=new Promise(resolve=>{abortPlayback=resolve;});
// Unlock the reusable narration element inside the real tap, also on iOS.
const sequence=sequences[selectedLanguage],firstLang=sequence[0];
const voices=Object.fromEntries(sequence.map(lang=>[lang,chooseVoice(d,lang,characterRole,mode)]));
let priming=true;if(!muted&&voices[firstLang].path){voiceAudio.src=asset(voices[firstLang].path);voiceAudio.dataset.mode=mode;voiceAudio.dataset.narrator=voices[firstLang].role||voices[firstLang].key;voiceAudio.volume=0;voiceAudio.play().then(()=>{if(t===token&&priming){voiceAudio.pause();voiceAudio.currentTime=0;}}).catch(()=>{});}
duck(true);show(d,mode==='name'?d.name[firstLang]:`${d.name.en} · ${d.name.yue} · ${d.name.cmn}`,d.kind==='discovery'?'一起发现':'动物朋友');
const callId=d.callId||id,recording=window.CALL_RECORDINGS?.[callId];if(!muted&&(!d.learningMode||mode==='name')&&recording?.copyright){const credit=document.createElement('a');credit.className='sub-source';credit.textContent=recording.copyright;credit.href=recording.source;credit.target='_blank';credit.rel='noopener';subtitle.querySelector('.sub-text').after(credit);}
const callDone=(!muted&&(!d.learningMode||mode==='name'))?new Promise(resolve=>{lastLearning.phase='call';window.AnimalCalls.play(callId,ctx,resolve);}):null;
try{window.AnimalAnims.play(el,id);}catch(err){console.error(err);}
if(callDone){await Promise.race([callDone,cancelled]);}if(t!==token)return;priming=false;
let namesCompleted=true;for(const lang of sequence){if(t!==token)return;lastLearning.phase=mode;lastLearning.language=lang;const completed=await Promise.race([playLine(d,lang,t,voices[lang],mode),cancelled]);if(t!==token)return;if(completed===false)namesCompleted=false;await Promise.race([new Promise(resolve=>later(resolve,300)),cancelled]);}
if(mode==='name'&&namesCompleted)recognizedAnimals.add(instance);lastLearning.phase='complete';lastLearning.nameLearned=recognizedAnimals.has(instance);
if(t===token)later(()=>{if(t===token){subtitle.classList.remove('show');duck(false);}},700);
}
world.addEventListener('pointerdown',e=>{
if((e.button&&e.button!==0)||drag)return;cancelFrame();drag={pointer:e.pointerId,x:e.clientX,y:e.clientY,lastX:e.clientX,lastT:performance.now(),moved:false,target:e.target.closest('.animal')};world.classList.add('dragging');world.setPointerCapture(e.pointerId);unlockAudio();
});
world.addEventListener('pointermove',e=>{
if(!drag||drag.pointer!==e.pointerId)return;const now=performance.now(),dx=e.clientX-drag.lastX,dt=Math.max(8,now-drag.lastT);
if(!drag.moved&&Math.hypot(e.clientX-drag.x,e.clientY-drag.y)>9){drag.moved=true;stopSpeech();hideNavigation();}
if(drag.moved){camera-=dx;trackIntroTravel(dx);velocity=Math.max(-2400,Math.min(2400,dx/dt*1000));apply();}drag.lastX=e.clientX;drag.lastT=now;
});
function endDrag(e,cancelled=false){
if(!drag||drag.pointer!==e.pointerId)return;const d=drag;drag=null;world.classList.remove('dragging');
if(cancelled){velocity=0;return;}if(!d.moved&&d.target){velocity=0;activate(d.target);}else if(d.moved){if(performance.now()-d.lastT>100)velocity=0;lastFrame=performance.now();frame=requestAnimationFrame(glide);}
}
world.addEventListener('pointerup',e=>endDrag(e));world.addEventListener('pointercancel',e=>endDrag(e,true));world.addEventListener('lostpointercapture',e=>{if(drag)endDrag(e,true);});
world.addEventListener('wheel',e=>{e.preventDefault();cancelFrame();stopSpeech();hideNavigation();const delta=e.deltaX||e.deltaY;camera+=delta;trackIntroTravel(delta);apply();unlockAudio();},{passive:false});world.addEventListener('contextmenu',e=>e.preventDefault());
languageButton.addEventListener('click',()=>{languageMenu.hidden=!languageMenu.hidden;languageButton.setAttribute('aria-expanded',String(!languageMenu.hidden));});
languageMenu.addEventListener('click',e=>{const b=e.target.closest('[data-language]');if(!b)return;selectedLanguage=b.dataset.language;stopSpeech();languageButton.innerHTML=langLabels[selectedLanguage]+' <span>⌄</span>';languageMenu.querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.language===selectedLanguage)));languageMenu.hidden=true;languageButton.setAttribute('aria-expanded','false');});
document.addEventListener('pointerdown',e=>{if(!e.target.closest('.controls')&&!e.target.closest('#languageMenu')){languageMenu.hidden=true;languageButton.setAttribute('aria-expanded','false');}});
soundButton.addEventListener('click',()=>{muted=!muted;stopSpeech();soundButton.textContent=muted?'🔇':'🔊';soundButton.setAttribute('aria-pressed',String(muted));soundButton.setAttribute('aria-label',muted?'开启动物声音':'关闭动物声音');unlockAudio();setAmbient(sceneAt().id);duck(false);});
document.addEventListener('visibilitychange',()=>{if(document.hidden){cancelFrame();stopSpeech();window.AnimalAnims.stopAll();Object.values(ambients).forEach(a=>a.audio.pause());}else if(ctx&&musicEnabled)setAmbient(sceneAt().id);});
const creditsDialog=document.getElementById('creditsDialog'),creditsList=document.getElementById('creditsList');
for(const [id,rec]of Object.entries(window.CALL_RECORDINGS||{})){
if(!D[id])continue;const row=document.createElement('div');row.className='credit-row';const title=document.createElement('strong');title.textContent=D[id].name.cmn+' · '+rec.author;row.appendChild(title);
const source=document.createElement(/^https?:/.test(rec.source||'')?'a':'span');source.textContent=rec.title;if(source.tagName==='A'){source.href=rec.source;source.target='_blank';source.rel='noopener';}row.appendChild(source);
const license=document.createElement(rec.licenseUrl?'a':'span');license.textContent=' · '+rec.license;if(rec.licenseUrl){license.href=rec.licenseUrl;license.target='_blank';license.rel='noopener';}row.appendChild(license);
const changes=document.createElement('small');changes.textContent='剪辑、单声道、响度处理、短淡入淡出；原音高。';row.appendChild(changes);creditsList.appendChild(row);
}
document.getElementById('creditsButton').addEventListener('click',()=>{stopSpeech();languageMenu.hidden=true;languageButton.setAttribute('aria-expanded','false');creditsDialog.showModal();});
document.getElementById('closeCredits').addEventListener('click',()=>creditsDialog.close());
creditsDialog.addEventListener('click',e=>{if(e.target===creditsDialog){const r=creditsDialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)creditsDialog.close();}});
musicButton.addEventListener('click',()=>{musicEnabled=!musicEnabled;musicButton.setAttribute('aria-pressed',String(musicEnabled));musicButton.setAttribute('aria-label',musicEnabled?'关闭背景音':'开启背景音');musicButton.classList.toggle('music-off',!musicEnabled);unlockAudio();setAmbient(sceneAt().id);duck(backgroundDucked);});
previousScene.addEventListener('click',()=>goScene(previousScene.dataset.scene));nextScene.addEventListener('click',()=>goScene(nextScene.dataset.scene));
let resizeFrame=0;window.addEventListener('resize',()=>{cancelAnimationFrame(resizeFrame);resizeFrame=requestAnimationFrame(()=>{const ratio=camera/worldW;cancelFrame();stopSpeech();build();camera=ratio*worldW;apply();});});
window.ChapterObjects?.mountUI();
build();
const entryScene=new URLSearchParams(location.search).get('scene');
if(S[entryScene]){dismissIntro();camera=currentStart(entryScene);apply();}
// Retry after every real gesture: an initial autoplay rejection must not leave
// background sound silent for the rest of the visit (particularly on Safari).
document.addEventListener('pointerdown',unlockAudio,{capture:true,passive:true});
document.addEventListener('keydown',e=>{if(['Enter',' ','ArrowLeft','ArrowRight'].includes(e.key))unlockAudio();});
unlockAudio();
window.__Animals={get camera(){return camera;},set camera(v){cancelFrame();camera=v;apply();},worldW:()=>worldW,screenW:()=>sw,sceneAt:()=>sceneAt(),goScene,stopSpeech,dismissIntro,activate(id){const els=[...document.querySelectorAll(`.animal[data-id="${id}"]`)];const el=els.find(e=>{const r=e.getBoundingClientRect();return r.right>0&&r.left<vw;})||els[0];return activate(el);},swipe(dx){camera-=dx;trackIntroTravel(dx);apply();},learningStatus(){return {...lastLearning,recognized:recognizedAnimals.size,completedInstances:[...recognizedAnimals]};},get language(){return selectedLanguage;},get muted(){return muted;},get musicEnabled(){return musicEnabled;},ambienceStatus(){return Object.fromEntries(Object.entries(ambients).map(([id,a])=>[id,{paused:a.audio.paused,volume:a.gain.gain.value,master:ambMaster?.gain.value,context:ctx?.state,error:a.error,time:a.audio.currentTime,source:a.audio.src}]));},ambienceLevel(){if(!ambAnalyser)return 0;const samples=new Float32Array(ambAnalyser.fftSize);ambAnalyser.getFloatTimeDomainData(samples);return Math.sqrt(samples.reduce((n,v)=>n+v*v,0)/samples.length);}};
})();
