import fs from 'node:fs';
const root=new URL('../',import.meta.url),file=p=>new URL(p,root);
let js=fs.readFileSync(file('geo/assets/game.js'),'utf8');
function change(from,to){if(!js.includes(from))throw new Error('Missing V4 anchor: '+from.slice(0,90));js=js.replace(from,to);}
change("languageMenu=document.getElementById('languageMenu'),soundButton=document.getElementById('soundButton');","languageMenu=document.getElementById('languageMenu'),soundButton=document.getElementById('soundButton'),musicButton=document.getElementById('musicButton');");
change("const icons={savanna:'🌾',rainforest:'🌿',ocean:'🐠',arctic:'🐻‍❄️',antarctic:'🐧'},labels={savanna:'草原',rainforest:'雨林',ocean:'海洋',arctic:'北极',antarctic:'南极'};","const icons={savanna:'🌾',rainforest:'🌿',ocean:'🐠',polar:'❄️'},labels={savanna:'草原',rainforest:'雨林',ocean:'海底',polar:'极地'};\nconst sequences={en:['en'],yue:['yue'],cmn:['cmn'],'en-yue':['en','yue'],'en-cmn':['en','cmn'],'cmn-yue':['cmn','yue'],all:['en','yue','cmn']};\nconst previousScene=document.getElementById('previousScene'),nextScene=document.getElementById('nextScene');");
change("const langLabels={en:'English',yue:'粤语',cmn:'普通话',all:'三语'};","const langLabels={en:'English',yue:'粤语',cmn:'普通话','en-yue':'英 · 粤','en-cmn':'英 · 普','cmn-yue':'普 · 粤',all:'三语'};");
change("drag=null,selectedLanguage='all',muted=false","drag=null,selectedLanguage='en',muted=false,musicEnabled=true");
change("sid===id&&!muted","sid===id&&musicEnabled");
change("currentScene!==sid||muted","currentScene!==sid||!musicEnabled");
change("muted?0:on?.025:.10","!musicEnabled?0:on&&!muted?.024:.085");
change("ambMaster.gain.value=muted?0:.10","ambMaster.gain.value=musicEnabled?.085:0");
const start=js.indexOf('function apply(){'),end=js.indexOf('function attachEnvironment',start);
js=js.slice(0,start)+`function apply(){
 if(!worldW)return;camera=((camera%worldW)+worldW)%worldW;strip.style.transform=\`translate3d(\${-camera-worldW}px,0,0)\`;
 const at=sceneAt(),id=at.id;
 if(id!==currentScene){
  currentScene=id;nav.querySelectorAll('button').forEach(b=>b.setAttribute('aria-current',String(b.dataset.scene===id)));setAmbient(id);
  const i=order.indexOf(id),prev=order[(i+order.length-1)%order.length],next=order[(i+1)%order.length];
  for(const [button,target]of [[previousScene,prev],[nextScene,next]]){button.dataset.scene=target;button.querySelector('small').textContent=labels[target];button.setAttribute('aria-label','前往'+labels[target]);}
 }
 const section=S[id].sections?.find((s,i,list)=>at.local<list.slice(0,i+1).reduce((n,x)=>n+x.screens*sw,0));
 const tag=id==='polar'?'极地 · '+section.label:S[id].label+' · '+({savanna:'SAVANNA',rainforest:'RAINFOREST',ocean:'OCEAN'}[id]);
 if(document.getElementById('sceneTag').textContent!==tag)document.getElementById('sceneTag').textContent=tag;
 // Preload only nearby characters, avoiding dozens of decoded atlases on phones.
 S[id].animals.filter(a=>Math.abs(a.u*S[id].numScreens*sw-at.local)<vw*.85).forEach(a=>window.AnimalAnims.preload(a.id));
}
`+js.slice(end);
change("!['hippo','crocodile','otter'].includes(a.id)","!['hippo','crocodile','otter','flamingo'].includes(a.id)");
change("const gripX=left+w*((window.ANIMAL_ANIMATIONS?.[a.id]?.gripX??.5)-.5);","const gx=window.ANIMAL_ANIMATIONS?.[a.id]?.gripX??.5;\n const gripX=left+w*((a.flip?1-gx:gx)-.5);");
const bgStart=js.indexOf("const bg=document.createElement('div');bg.className='bg';",js.indexOf('function build()'));
const bgEnd=js.indexOf('for(const a of sc.animals)',bgStart);
js=js.slice(0,bgStart)+`const bg=document.createElement('div');bg.className='bg';
const nativeWidth=vh*(sc.bgAspect||16/9),count=Math.ceil(w/nativeWidth),segment=nativeWidth;
let regionLeft=0;
for(const part of sc.sections||[{...sc,screens:sc.numScreens}]){
 const width=part.screens*sw,region=document.createElement('div');region.className='bg-region';region.style.cssText=\`left:\${regionLeft}px;width:\${width}px\`;
 const sources=part.bgPanels||[part.bgStrip],tileWidth=vh*(part.bgAspect||sc.bgAspect||16/9);
 for(let i=0;i<Math.ceil(width/tileWidth);i++){
  const tile=document.createElement('div');tile.className='bg-panel';tile.style.cssText=\`left:\${i*tileWidth}px;width:\${tileWidth}px;background-image:url("\${asset(sources[i%sources.length])}")\`;
  if(sc.bgMirror&&i%2)tile.style.transform='scaleX(-1)';region.appendChild(tile);
 }
 bg.appendChild(region);
 if(sc.sections){const label=document.createElement('span');label.className='polar-region-label';label.textContent=part.label;label.style.left=(regionLeft+width*.5)+'px';panel.appendChild(label);}
 regionLeft+=width;
}
panel.appendChild(bg);
if(sc.schools)for(const [schoolIndex,school]of sc.schools.entries()){
 const group=document.createElement('div');group.className='fish-school';group.style.cssText=\`left:\${school.u*w}px;top:\${school.y*vh}px;width:\${vh*.48}px;height:\${vh*.16}px;--drift:\${school.direction*vh*.16}px;animation-delay:\${-schoolIndex*4}s\`;group.setAttribute('aria-hidden','true');
 for(let i=0;i<school.count;i++){
  const fish=document.createElement('img'),size=school.scale*vh*(.82+(i%3)*.15);fish.src=asset(window.ANIMAL_ANIMATIONS?.reeffish?.poster||'assets/animation/v4-1/reeffish-poster.webp');fish.alt='';fish.draggable=false;
  fish.style.cssText=\`left:\${(i%4)*vh*.10}px;top:\${Math.floor(i/4)*vh*.075+(i%2)*vh*.025}px;width:\${size*1.8}px;height:\${size}px;--face:\${school.direction};animation-delay:\${-i*.7}s\`;group.appendChild(fish);
 }panel.appendChild(group);
}
if(sc.fireflies)for(const item of sc.fireflies){const light=document.createElement('span');light.className='firefly';light.style.cssText=\`left:\${item.u*w}px;top:\${item.y*vh}px;animation-delay:\${-item.u*9}s\`;light.setAttribute('aria-hidden','true');panel.appendChild(light);}
`+js.slice(bgEnd);
change("el.dataset.special=a.special||'';","el.dataset.special=a.special||'';el.dataset.instance=a.instance;el.dataset.region=a.region||'';");
const pStart=js.indexOf('if(a.habitatAnchor!=null&&sc.bgMirror)'),pEnd=js.indexOf('el.dataset.u=',pStart);
js=js.slice(0,pStart)+`if(a.pondGroup&&sc.bgMirror){
 const hippo=sc.animals.find(b=>b.id==='hippo'),target=hippo.u*w;
 const ponds=Array.from({length:count},(_,i)=>({i,x:i*segment+(i%2?.35:.65)*segment})).filter(p=>p.x>vw*.2&&p.x<w-vw*.2);
 const main=ponds.reduce((best,p)=>Math.abs(p.x-target)<Math.abs(best.x-target)?p:best,ponds[0]);
 const candidates=a.pondGroup==='crocodile'?ponds.filter(p=>p.i!==main.i):[main];
 const nearest=candidates.reduce((best,p)=>Math.abs(p.x-a.u*w)<Math.abs(best.x-a.u*w)?p:best,candidates[0]||main);
 left=nearest.i*segment+(nearest.i%2?1-a.shoreX:a.shoreX)*segment;
}
`+js.slice(pEnd);
// Clamp canvas layout to a minimum touch target without moving the illustrated feet.
change("el.style.top=(a.feetY*vh-fittedHeight)+'px';el.style.left=(left-width/2)+'px';","el.style.top=(a.feetY*vh-Math.max(44,fittedHeight))+'px';el.style.left=(left-Math.max(44,width)/2)+'px';");
change("const firstLang=selectedLanguage==='all'?'en':selectedLanguage;","const sequence=sequences[selectedLanguage],firstLang=sequence[0];");
change("(selectedLanguage==='all'?['en','yue','cmn']:[selectedLanguage]).map", "sequence.map");
change("for(const lang of selectedLanguage==='all'?['en','yue','cmn']:[selectedLanguage])", "for(const lang of sequence)");
change("d.kind==='discovery'?'极地发现':'动物朋友'", "d.kind==='discovery'?'一起发现':'动物朋友'");
change("subtitle.classList.add('show');}","subtitle.classList.add('show');subtitle.querySelector('.sub-copy').scrollLeft=0;}");
change("muted?'开启声音':'关闭声音'","muted?'开启动物声音':'关闭动物声音'");
change("else if(ctx&&!muted)setAmbient(sceneAt().id)","else if(ctx&&musicEnabled)setAmbient(sceneAt().id)");
change("const row=document.createElement('div');row.className='credit-row';", "if(!D[id])continue;const row=document.createElement('div');row.className='credit-row';");
change("let resizeFrame=0;",`musicButton.addEventListener('click',()=>{musicEnabled=!musicEnabled;musicButton.setAttribute('aria-pressed',String(musicEnabled));musicButton.setAttribute('aria-label',musicEnabled?'关闭背景音':'开启背景音');musicButton.classList.toggle('music-off',!musicEnabled);unlockAudio();setAmbient(sceneAt().id);duck(!!narration);});
previousScene.addEventListener('click',()=>goScene(previousScene.dataset.scene));nextScene.addEventListener('click',()=>goScene(nextScene.dataset.scene));
let resizeFrame=0;`);
change("get muted(){return muted;}","get muted(){return muted;},get musicEnabled(){return musicEnabled;},ambienceStatus(){return Object.fromEntries(Object.entries(ambients).map(([id,a])=>[id,{paused:a.audio.paused,volume:a.gain.gain.value,source:a.audio.src}]));}");
fs.writeFileSync(file('geo/assets/game.js'),js);
let html=fs.readFileSync(file('geo/index.html'),'utf8');
html=html.replace('三语 <span>⌄</span></button><button id="soundButton" aria-label="关闭声音" aria-pressed="false">🔊</button>', 'English <span>⌄</span></button><button id="soundButton" aria-label="关闭动物声音" aria-pressed="false">🔊</button><button id="musicButton" aria-label="关闭背景音" aria-pressed="true"><span aria-hidden="true">♫</span></button>');
html=html.replace('<button data-language="all" aria-pressed="true">三语轮播</button><button data-language="en" aria-pressed="false">English</button><button data-language="yue" aria-pressed="false">粤语</button><button data-language="cmn" aria-pressed="false">普通话</button>', '<button data-language="en" aria-pressed="true">English</button><button data-language="yue" aria-pressed="false">粤语</button><button data-language="cmn" aria-pressed="false">普通话</button><button data-language="en-yue" aria-pressed="false">英语 + 粤语</button><button data-language="en-cmn" aria-pressed="false">英语 + 普通话</button><button data-language="cmn-yue" aria-pressed="false">普通话 + 粤语</button><button data-language="all" aria-pressed="false">三语轮播</button>');
html=html.replace('<span class="sub-emoji"></span><div>', '<span class="sub-emoji"></span><div class="sub-copy">');
html=html.replace('<div id="navEdge"', '<button id="previousScene" class="scene-arrow scene-previous" aria-label="前往上一场景"><span aria-hidden="true">‹</span><small></small></button><button id="nextScene" class="scene-arrow scene-next" aria-label="前往下一场景"><span aria-hidden="true">›</span><small></small></button>\n<div id="navEdge"');
fs.writeFileSync(file('geo/index.html'),html);
let css=fs.readFileSync(file('geo/assets/game.css'),'utf8');
css=css.replace('.animal-frames{position:absolute;inset:0;', '.animal-frames{position:absolute;');
css=css.replace('.animal[data-id=hippo] .sprite,.animal[data-id=crocodile] .sprite{clip-path:inset(0 0 10% 0)}','');
css+=`\n/* V4.1: complete silhouettes, compact single-line captions and scene neighbours. */
.animal .sprite{overflow:visible}.acting{z-index:20}.bg-region{position:absolute;top:0;height:100%;overflow:hidden}
.polar-region-label{position:absolute;top:18%;transform:translateX(-50%);padding:6px 15px;border-radius:18px;background:#fffaf0a0;color:#668096;font-size:13px;letter-spacing:3px;pointer-events:none;z-index:2}
#musicButton{position:relative;width:46px;padding:0;font-size:27px;color:#51755b}#musicButton.music-off::after{content:'';position:absolute;width:24px;height:2px;background:#8b695e;transform:rotate(-45deg);left:11px;top:22px}
#languageMenu{right:0;max-height:calc(100dvh - 80px);overflow-y:auto}
#subtitle,body.nav-open #subtitle{top:calc(70px + env(safe-area-inset-top));bottom:auto;max-width:calc(100% - 28px);width:max-content;padding:8px 14px;border-radius:16px;gap:9px;transform:translate(-50%,-6px);transition:opacity .2s,transform .2s}
#subtitle.show{transform:translate(-50%,0)}.sub-emoji{font-size:23px}.sub-copy{display:flex;align-items:center;gap:10px;white-space:nowrap;overflow-x:auto;scrollbar-width:none;pointer-events:auto;max-width:calc(100vw - 95px);touch-action:pan-x;user-select:text}.sub-copy::-webkit-scrollbar{display:none}
.sub-label,.sub-text,.sub-source{display:inline-block;white-space:nowrap;text-wrap:nowrap;margin:0;flex:none}.sub-text{font-size:clamp(14px,2vh,19px);line-height:1.5}.sub-source{font-size:10px}.sub-label{letter-spacing:0;font-size:11px}
.scene-arrow{position:fixed;top:48%;z-index:45;display:flex;flex-direction:column;align-items:center;justify-content:center;width:50px;min-height:75px;border-radius:28px;background:#fffaf03d;color:#355647;opacity:.35;transition:opacity .2s;touch-action:manipulation;text-shadow:0 1px 3px #fff8}
.scene-arrow:hover,.scene-arrow:focus-visible{opacity:.85;background:#fffaf095}.scene-arrow span{font:300 47px/40px Georgia,serif}.scene-arrow small{font-size:10px;padding-bottom:9px;letter-spacing:1px}.scene-previous{left:calc(9px + env(safe-area-inset-left))}.scene-next{right:calc(9px + env(safe-area-inset-right))}
.fish-school{position:absolute;pointer-events:none;z-index:3;animation:school-drift 15s ease-in-out infinite alternate}.fish-school img{position:absolute;object-fit:contain;animation:school-swim 2.6s ease-in-out infinite;pointer-events:none}
@keyframes school-drift{to{translate:var(--drift) -8px}}@keyframes school-swim{0%,100%{transform:scaleX(var(--face)) rotate(-2deg)}50%{transform:scaleX(var(--face)) rotate(2deg);translate:0 -3px}}
.firefly{position:absolute;width:3px;height:3px;border-radius:50%;background:#edfa9b;box-shadow:0 0 9px #e7f99b;z-index:2;pointer-events:none;animation:firefly 5s ease-in-out infinite}@keyframes firefly{0%,100%{opacity:.1}50%{opacity:.7;translate:13px -18px}}
@media(max-height:500px) and (orientation:landscape){#subtitle,body.nav-open #subtitle{top:calc(62px + env(safe-area-inset-top));padding:5px 10px;gap:6px}.sub-emoji{font-size:20px}.sub-label{font-size:10px}.sub-text{font-size:14px}.scene-arrow{width:43px;min-height:62px;top:43%}.scene-arrow span{font-size:40px;line-height:32px}}
`;
fs.writeFileSync(file('geo/assets/game.css'),css);console.log('V4.1 interface written');
