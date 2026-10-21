import fs from 'node:fs';
import vm from 'node:vm';
const ctx={window:{}};
vm.runInNewContext(fs.readFileSync('share/runtime-v4/assets/game-data.js','utf8'),ctx);
const D=ctx.window.GAME_DIALOGUE,old=ctx.window.GAME_SCENES;
const plan=JSON.parse(fs.readFileSync('geo/assets/animation/v4-1/plan.json','utf8'));
delete D.capybara;delete D.tapir;
Object.assign(D,plan.newObjects);
const original=Object.fromEntries(Object.values(old).flatMap(s=>s.animals).map(a=>[a.id,a]));
function place(id,u,y,h,options={}){
 const a={...original[id],id,u,feetY:y,h,flip:false,rotate:0,waterline:null,idle:'breathe',special:null,...options};
 delete a.sprite;delete a.screen;delete a.x;delete a.habitatAnchor;
 return {...a,...options};
}
const north=5/3,south=4.5/3,polarLength=north+south;
function polar(id,screen,y,h,region,options={}){return place(id,screen/polarLength,y,h,{region,...options});}
function habitat(id,label,numScreens,animals,ambience){
 return {id,label,numScreens,bgPanels:[`assets/bg/reference/${id}-preferred-v4.png`],bgAspect:3,bgMirror:true,ambience,animals};
}
const S={
 savanna:habitat('savanna','草原',8,[
  place('lion',.040,.81,.25,{flip:false}),place('lioness',.095,.85,.225,{flip:false}),place('lioncub',.070,.94,.12),
  place('zebra',.154,.82,.24),place('zebra',.181,.91,.16),place('zebra',.209,.84,.205),
  place('ostrich',.250,.83,.28),
  place('giraffe',.300,.84,.36),place('giraffe',.338,.89,.235),
  place('warthog',.380,.87,.17),place('warthog',.410,.93,.125),
  place('meerkat',.445,.85,.15),place('meerkat',.460,.93,.105),
  place('elephant',.512,.84,.32),place('elephantcalf',.555,.91,.18),
  place('cheetah',.606,.88,.19),
  place('hippo',.635,.578,.18,{pondGroup:'hippo',shoreX:.65}),
  place('flamingo',.677,.564,.175,{pondGroup:'birds',shoreX:.81}),
  place('flamingo',.692,.571,.155,{pondGroup:'birds',shoreX:.88}),
  place('flamingo',.708,.566,.145,{pondGroup:'birds',shoreX:.95}),
  place('crocodile',.768,.577,.115,{pondGroup:'crocodile',shoreX:.83}),
  place('rhino',.802,.85,.235),
  place('buffalo',.850,.84,.24),place('buffalo',.883,.93,.17),
  place('gazelle',.938,.84,.22),place('gazelle',.967,.94,.15)
 ],'assets/audio/savanna.mp3'),
 rainforest:habitat('rainforest','雨林',8,[
  place('toucan',.048,.37,.21,{special:'perch',support:'branch'}),
  place('sloth',.121,.49,.255,{special:'hanging',idle:'none',support:'canopy'}),
  place('monkey',.197,.49,.235,{special:'hanging',idle:'none',support:'vine'}),
  place('monkey',.233,.60,.155,{special:'hanging',idle:'none',support:'vine'}),
  place('frog',.287,.92,.11,{support:'leaf'}),place('frog',.313,.96,.08,{support:'leaf'}),
  place('butterfly',.355,.50,.13,{idle:'flutter'}),place('butterfly',.379,.63,.09,{idle:'flutter'}),
  place('hummingbird',.427,.42,.13,{idle:'flutter'}),
  place('otter',.483,.672,.155,{idle:'bob'}),
  place('macaw',.594,.39,.24,{special:'perch',support:'branch'}),place('macaw',.628,.53,.175,{special:'perch',support:'branch'}),
  place('jaguar',.690,.87,.235),place('leopard',.736,.47,.205,{special:'perch',idle:'none',support:'branch'}),
  place('boa',.787,.48,.23,{special:'perch',idle:'none',support:'branch'}),
  place('chameleon',.837,.39,.14,{special:'perch',support:'branch'}),
  place('gorilla',.875,.92,.28),place('tiger',.940,.87,.255),
  place('orangutan',.964,.44,.235,{special:'hanging',idle:'none',support:'canopy'})
 ],'assets/audio/rainforest.mp3'),
 ocean:habitat('ocean','海底',7.5,[
  place('clownfish',.057,.50,.14,{idle:'bob'}),place('clownfish',.085,.63,.105,{idle:'bob'}),place('clownfish',.110,.43,.095,{idle:'bob'}),
  place('coral',.148,.94,.20,{kind:'discovery',idle:'none'}),place('shell',.190,.95,.11,{idle:'none'}),
  place('seahorse',.235,.71,.215,{idle:'bob'}),place('seahorse',.259,.85,.155,{idle:'bob'}),
  place('starfish',.295,.95,.11),place('starfish',.610,.92,.075),place('turtle',.339,.50,.225,{idle:'bob'}),
  place('pufferfish',.390,.75,.155,{idle:'bob'}),place('crab',.441,.94,.14),
  place('jellyfish',.481,.34,.20,{idle:'bob'}),place('jellyfish',.509,.64,.13,{idle:'bob'}),
  place('whale',.575,.51,.285,{idle:'bob'}),place('coral',.629,.95,.23,{kind:'discovery',idle:'none'}),
  place('octopus',.680,.92,.225),place('dolphin',.735,.33,.19,{idle:'bob'}),place('dolphin',.769,.59,.14,{idle:'bob'}),
  place('stingray',.832,.86,.215,{idle:'bob'}),place('shell',.863,.96,.09,{idle:'none'}),
  place('shark',.908,.51,.215,{idle:'bob'}),place('lobster',.954,.95,.135),
  place('reeffish',.397,.32,.11,{idle:'bob'}),place('reeffish',.801,.29,.095,{idle:'bob'})
 ],'assets/audio/ocean.mp3'),
 polar:{id:'polar',label:'极地',numScreens:polarLength,bgAspect:16/9,bgMirror:true,ambience:'assets/audio/polar.mp3',
  sections:[{id:'arctic',label:'北极',screens:north,bgPanels:['assets/bg/arctic-hd-v4.webp'],bgAspect:16/9},{id:'antarctic',label:'南极',screens:south,bgPanels:['assets/bg/antarctic-hd-v4.webp'],bgAspect:16/9}],
  animals:[polar('igloo',.22,.78,.30,'arctic',{kind:'discovery',idle:'none'}),polar('inuit',.40,.91,.22,'arctic',{kind:'discovery'}),
   polar('polarbear',.82,.89,.275,'arctic'),polar('arcticfox',1.23,.71,.135,'arctic'),polar('walrus',1.44,.92,.215,'arctic'),
   polar('penguin',1.92,.84,.245,'antarctic'),polar('penguin',2.17,.91,.16,'antarctic'),polar('seal',2.78,.86,.21,'antarctic')]
 }
};
const order=['savanna','rainforest','ocean','polar'];
const nativeLeft=new Set('zebra rhino buffalo cheetah tapir arcticfox gazelle warthog polarbear giraffe elephant elephantcalf meerkat ostrich flamingo hippo crocodile jaguar leopard chameleon boa toucan macaw hummingbird whale seal walrus penguin tiger otter'.split(' '));
const nativeRight=new Set(['lion','lioncub','turtle','clownfish','dolphin','shark','pufferfish','seahorse','reeffish']);
for(const [sid,sc]of Object.entries(S)){
 sc.animals.forEach((a,i)=>{
  a.instance=`${sid}-${a.id}-${i}`;a.screen=Math.floor(a.u*sc.numScreens);a.x=(a.u*sc.numScreens)%1;
  const native=nativeLeft.has(a.id)?-1:nativeRight.has(a.id)?1:0;
  const desired=i%2?-1:1;
  if(a.id!=='lion'&&a.id!=='lioness'&&native)a.flip=desired!==native;
  a.facing=native?(a.flip?-native:native):0;
 });
}
S.ocean.schools=[{u:.18,y:.29,count:7,scale:.046,direction:1},{u:.46,y:.66,count:6,scale:.038,direction:-1},{u:.76,y:.45,count:8,scale:.039,direction:1}];
S.rainforest.fireflies=[{u:.34,y:.31},{u:.71,y:.55}];
S.savanna.decorations='grasses';
// Seeded shuffle: stable between rebuilds, random-looking species selection.
let seed=20261007;const random=()=>{seed^=seed<<13;seed^=seed>>>17;seed^=seed<<5;return (seed>>>0)/4294967296;};
const greetingPool=Object.keys(D).filter(id=>D[id].kind!=='discovery');
for(let i=greetingPool.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[greetingPool[i],greetingPool[j]]=[greetingPool[j],greetingPool[i]];}
const greetingIds=new Set(greetingPool.slice(0,Math.round(Object.keys(D).length/5)));
for(const [id,d]of Object.entries(D)){
 const en=d.name.en.toLowerCase(),article=/^[aeiou]/.test(en)?'an':'a',greet=greetingIds.has(id);
 const self={en:id==='inuit'?"I'm your Inuit friend.":id==='igloo'?"I'm an igloo, a cosy snow house.":id==='coral'?"I'm a coral colony.":`I'm ${article} ${en}.`,yue:id==='inuit'?'我係因紐特小朋友。':id==='igloo'?'我係雪屋。':`我係${d.name.yue}。`,cmn:`我是${d.name.cmn}。`};
 d.greeting=greet;
 d.intro={en:`${greet?'Hi, little friend! ':''}${self.en} ${d.fact.en}`,yue:`${greet?'你好呀，小朋友！':''}${self.yue}${d.fact.yue}`,cmn:`${greet?'你好呀，小朋友！':''}${self.cmn}${d.fact.cmn}`};
 d.voice=Object.fromEntries(['en','yue','cmn'].map(lang=>[lang,`assets/voice/v4-1/${id}-${lang}.mp3`]));
 d.voiceVariants=Object.fromEntries(['en','yue','cmn'].map(lang=>[lang,[{key:'original',role:lang==='en'?'child':'female',path:d.voice[lang]},{key:'male',role:'male',path:`assets/voice/v4-1/${id}-${lang}-male.mp3`},{key:'alternate',role:lang==='en'?'female':'bright',path:`assets/voice/v4-1/${id}-${lang}-${lang==='en'?'female':'bright'}.mp3`}]]));
}
fs.writeFileSync('geo/assets/game-data.js','/* V4 continuation; no V5 dependencies. */\nwindow.GAME_DIALOGUE = '+JSON.stringify(D,null,2)+';\nwindow.GAME_SCENE_ORDER = '+JSON.stringify(order)+';\nwindow.GAME_SCENES = '+JSON.stringify(S,null,2)+';\n');
fs.writeFileSync('geo/assets/placements.json',JSON.stringify({sceneOrder:order,scenes:S},null,2));
fs.writeFileSync('geo/assets/voice/v4-1/script.json',JSON.stringify(Object.fromEntries(Object.entries(D).map(([id,d])=>[id,d.intro])),null,2));
fs.writeFileSync('geo/assets/voice/v4-1/greetings.json',JSON.stringify({seed:20261007,total:Object.keys(D).length,count:greetingIds.size,ids:[...greetingIds]},null,2));
console.log({characters:Object.keys(D).length,placements:Object.values(S).reduce((n,s)=>n+s.animals.length,0),greetings:greetingIds.size,polarScreens:polarLength});
