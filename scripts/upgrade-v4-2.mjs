import fs from 'node:fs';import vm from 'node:vm';
const w={};for(const file of ['game-data','animation-data','puppet-rigs'])vm.runInNewContext(fs.readFileSync(`geo/assets/${file}.js`,'utf8'),{window:w});
const {GAME_DIALOGUE:D,GAME_SCENES:S,ANIMAL_ANIMATIONS:A,SpritePuppets:{rigs}}=w;
delete D.ostrich;delete A.ostrich;S.savanna.animals=S.savanna.animals.filter(a=>a.id!=='ostrich');
for(const [id,rig]of Object.entries(rigs)){if(!A[id])continue;A[id]={...A[id],rig:true,sheet:null,frames:[{x:0,y:0,w:A[id].viewport.w,h:A[id].viewport.h,dx:0,dy:0}],duration:rig.duration,label:rig.label,travel:0,loop:false,hop:0};}
for(const a of S.savanna.animals){
 if(a.id==='giraffe'){a.h=a.h>.30?.48:.33;a.feetY=a.h>.40?.81:.855;a.browseTree=true;}
 if(a.id==='elephant'){a.h=.365;a.feetY=.80;}
 if(a.id==='elephantcalf'){a.h=.225;a.feetY=.855;}
 if(a.id==='warthog'){a.h=a.h>.15?.21:.15;a.feetY=a.h>.18?.82:.90;}
}
fs.writeFileSync('geo/assets/game-data.js','/* V4.2, continued from V4.1; no V5 changes. */\nwindow.GAME_DIALOGUE = '+JSON.stringify(D)+';\nwindow.GAME_SCENES = '+JSON.stringify(S)+';\nwindow.GAME_SCENE_ORDER = '+JSON.stringify(w.GAME_SCENE_ORDER)+';\n');
fs.writeFileSync('geo/assets/animation-data.js','/* V4.2 continuous rigid joint gestures plus retained V4.1 rainforest/ocean cels. */\nwindow.ANIMAL_ANIMATIONS = '+JSON.stringify(A)+';\n');
fs.writeFileSync('geo/assets/placements.json',JSON.stringify(S,null,2));
console.log('Removed ostrich; continuous joints:',Object.keys(rigs).length);
