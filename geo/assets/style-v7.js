/* V7 keeps the current scenes, voices and interactions.
   The first version's pictures are one continuous painting, not a repeated tile.
   Animals keep that drawing and move as a whole body. Legs are never cut apart. */
(function(g){
'use strict';
const poster=id=>'assets/v1/animals/'+id+'.webp';
const classic=['boa','buffalo','butterfly','capybara','chameleon','cheetah','clownfish','crab','crocodile','dolphin','elephant','flamingo','frog','gazelle','giraffe','gorilla','hippo','hummingbird','jaguar','jellyfish','leopard','lion','lobster','macaw','meerkat','monkey','octopus','orangutan','otter','pufferfish','rhino','seahorse','seal','shark','sloth','starfish','stingray','tapir','tiger','toucan','turtle','warthog','whale','zebra'];
const specs={};
const put=(ids,spec)=>{for(const id of ids)specs[id]=spec;};
put(['zebra','buffalo','rhino','elephant','warthog','leopard','gorilla','orangutan','monkey','meerkat','flamingo','capybara','tapir','chameleon'],{travel:.34,hop:.045,steps:4,duration:2400,zoom:0,label:'迈步向前'});
put(['cheetah','tiger','jaguar'],{travel:.72,hop:.055,steps:7,duration:1300,zoom:0,label:'向前奔跑'});
put(['gazelle','frog'],{travel:.38,hop:.2,steps:1,duration:1100,zoom:0,label:'向前一跃'});
put(['clownfish','seahorse','starfish','turtle','pufferfish','crab','whale','dolphin','jellyfish','otter','octopus','stingray','shark','seal','lobster'],{travel:.32,hop:0,wave:.05,duration:2600,zoom:0,label:'向前游'});
put(['hummingbird','butterfly','macaw'],{travel:.06,hop:.08,steps:6,duration:1200,zoom:0,label:'轻轻飞一飞'});
put(['lion'],{travel:0,hop:0,zoom:.2,duration:1700,label:'抬头发声'});
put(['hippo'],{travel:0,hop:0,zoom:.2,duration:1700,label:'张大嘴打招呼'});
put(['crocodile'],{travel:0,hop:.02,zoom:.08,duration:2000,label:'晒太阳'});
put(['giraffe'],{travel:.2,hop:.035,steps:3,duration:2600,zoom:0,label:'慢慢走去吃叶子'});
put(['toucan'],{travel:0,hop:.04,steps:2,zoom:.08,duration:1400,label:'站在树枝上点头'});
put(['sloth'],{travel:0,hop:.025,steps:2,zoom:.04,duration:2400,label:'慢慢转头'});
put(['boa'],{travel:.16,hop:0,wave:.03,duration:2600,zoom:0,label:'慢慢游动'});
for(const id of classic){
 const d=g.ANIMAL_ANIMATIONS[id];if(!d)continue;
 const spec=specs[id]||{travel:.28,hop:.04,steps:4,duration:2200,zoom:0,label:'动一动'};
 d.poster=poster(id);
 d.sheet=null;d.cel=null;d.walk=false;d.rig=false;d.smoothMarine=false;d.loop=false;
 d.frames=[{x:0,y:0,w:1,h:1,dx:0,dy:0}];
 d.travel=spec.travel;d.hop=spec.hop||0;d.stepCount=spec.steps||0;d.wave=spec.wave||0;
 d.zoom=spec.zoom==null?0:spec.zoom;d.duration=spec.duration;
 if(spec.label)d.label=spec.label;
}
const strips={savanna:'assets/v1/bg/savanna-strip.webp',rainforest:'assets/v1/bg/rainforest-strip.webp',ocean:'assets/v1/bg/ocean-strip.webp'};
for(const [id,src] of Object.entries(strips)){
 const sc=g.GAME_SCENES[id];if(!sc)continue;
 sc.bgPanels=[src];sc.bgStrip=src;sc.bgMirror=false;
 sc.singleBackground=true;sc.bgFit='fill';
 if(sc.sections)for(const part of sc.sections){part.bgPanels=[src];part.bgStrip=src;}
}
const restyle={
 'assets/bg/farm-v4-2.webp':'assets/v1/restyle/farm.webp',
 'assets/bg/arctic-hd-v4.webp':'assets/v1/restyle/arctic.webp',
 'assets/bg/antarctic-hd-v4.webp':'assets/v1/restyle/antarctic.webp',
 'assets/chapters-v4-11/music/background.webp':'assets/v1/restyle/music.webp',
 'assets/chapters-v4-11/market/background.webp':'assets/v1/restyle/market.webp',
 'assets/chapters-v4-10/beach/background.webp':'assets/v1/restyle/beach.webp',
 'assets/chapters-v4-10/supermarket/background.webp':'assets/v1/restyle/supermarket.webp',
 'assets/chapters-v4-10/hongkong/background.webp':'assets/v1/restyle/hongkong.webp',
 'assets/exploration-v4-8/camp/background.webp':'assets/v1/restyle/camp.webp',
 'assets/chapters-v4-9/planets/planets-background.webp':'assets/v1/restyle/planets.webp',
 'assets/chapters-v4-9/weather/weather-background.webp':'assets/v1/restyle/weather.webp',
 'assets/exploration-v4-8/harbor/background.webp':'assets/v1/restyle/harbor.webp',
 'assets/exploration-v4-8/space/moon-landscape.webp':'assets/v1/restyle/moon.webp'
};
function retarget(scene){
 const swap=path=>restyle[path]||path;
 if(scene.bgPanels)scene.bgPanels=scene.bgPanels.map(swap);
 if(scene.bgStrip)scene.bgStrip=swap(scene.bgStrip);
 if(scene.sections)for(const part of scene.sections)retarget(part);
}
for(const scene of Object.values(g.GAME_SCENES))retarget(scene);
const classicSet=new Set(classic);
for(const sc of Object.values(g.GAME_SCENES)){
 for(const group of [sc.animals,sc.backgroundHerds,sc.decor]){
  if(!group)continue;
  for(const item of group){if(item&&classicSet.has(item.id))item.sprite=poster(item.id);}
 }
}
g.STYLE_V7={version:'7',animals:classic,backgrounds:Object.keys(strips),motion:'whole-body'};
})(window);
