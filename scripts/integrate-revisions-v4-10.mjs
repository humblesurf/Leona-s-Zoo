import fs from 'node:fs';
import vm from 'node:vm';
const root='geo/assets/chapters-v4-10';
const state={window:{}};
for(const name of ['game-data','animation-data','authored-motion-data','exploration-data','chapters-data'])vm.runInNewContext(fs.readFileSync(`geo/assets/${name}.js`,'utf8'),state);
const scenes={},objects={},dialogue={};
const savanna=structuredClone(state.window.GAME_SCENES.savanna);
const depths={lion:[.225,.775],lioness:[.175,.70],lioncub:[.105,.795],zebra:[[.19,.745],[.125,.77],[.15,.685]],warthog:[[.17,.735],[.115,.79]],meerkat:[[.125,.80],[.09,.845]],rhino:[.19,.74],buffalo:[[.205,.76],[.135,.70]],gazelle:[[.20,.80],[.14,.855]]};
const n={};for(const a of savanna.animals){const value=depths[a.id];if(value){const pair=Array.isArray(value[0])?value[(n[a.id]||0)%value.length]:value;[a.h,a.feetY]=pair;n[a.id]=(n[a.id]||0)+1;}}
const add=(id,u,h,feetY,flip=false,extra={})=>savanna.animals.push({id,u,h,feetY,flip,idle:'breathe',instance:`v4-10-${id}-${savanna.animals.length}`,facing:flip?1:-1,...extra});
add('zebra',.236,.125,.67,true);add('gazelle',.903,.12,.68,false);add('buffalo',.867,.105,.665,true);add('warthog',.424,.09,.67,false);add('meerkat',.478,.085,.77,false);
const croc=savanna.animals.find(a=>a.id==='crocodile');Object.assign(croc,{h:.165,feetY:.586,shoreX:.88});
add('crocodile',.724,.13,.582,false,{pondGroup:'crocodile',shoreX:.57});
add('crocodile',.794,.030,.550,true,{pondGroup:'crocodile',shoreX:.73,sprite:'assets/animation/v4-10/crocodile-eyes.webp',special:'water-eyes'});
add('crocodile',.744,.026,.544,false,{pondGroup:'crocodile',shoreX:.66,sprite:'assets/animation/v4-10/crocodile-eyes.webp',special:'water-eyes'});
savanna.backgroundHerds=[
 {id:'zebra',u:.118,h:.066,feetY:.592,flip:false},{id:'zebra',u:.126,h:.059,feetY:.595,flip:true},{id:'zebra',u:.133,h:.07,feetY:.60,flip:false},
 {id:'giraffe',u:.278,h:.115,feetY:.603,flip:true},{id:'giraffe',u:.287,h:.085,feetY:.61,flip:false},
 {id:'elephant',u:.488,h:.075,feetY:.616,flip:false},{id:'elephantcalf',u:.498,h:.042,feetY:.62,flip:true},
 {id:'buffalo',u:.838,h:.064,feetY:.61,flip:true},{id:'buffalo',u:.847,h:.06,feetY:.609,flip:false},
 {id:'gazelle',u:.925,h:.062,feetY:.625,flip:false},{id:'gazelle',u:.934,h:.055,feetY:.63,flip:true}
];scenes.savanna=savanna;
const ocean=structuredClone(state.window.GAME_SCENES.ocean);const whale=ocean.animals.find(a=>a.id==='whale');Object.assign(whale,{h:.52,feetY:.65,maxWidth:1.35});
ocean.animals.push({id:'shark',u:.878,h:.155,feetY:.69,flip:false,idle:'float',instance:'v4-10-shark-2'},{id:'shark',u:.931,h:.125,feetY:.31,flip:true,idle:'float',instance:'v4-10-shark-3'});scenes.ocean=ocean;
for(const id of ['beach','camp','hongkong','supermarket','music']){
 let file=`${root}/${id}/${id}.json`;if(!fs.existsSync(file))file=`${root}/${id}/scene.json`;if(!fs.existsSync(file))continue;
 const value=JSON.parse(fs.readFileSync(file,'utf8'));if(value.scene){scenes[id]={...state.window.GAME_SCENES[id],...value.scene};if(value.scene.panorama&&!value.scene.sections)delete scenes[id].sections;}
 Object.assign(objects,value.objects||{});Object.assign(dialogue,value.dialogue||{});
}
if(!scenes.beach)scenes.beach=structuredClone(state.window.GAME_SCENES.beach);
scenes.beach.animals=scenes.beach.animals.filter(a=>a.id!=='beachwave');
const voicePaths=(id,lang)=>[{key:lang==='en'?'child':'female',path:`assets/voice/v4-10/${id}-${lang}.mp3`},{key:'male',path:`assets/voice/v4-10/${id}-${lang}-male.mp3`},{key:lang==='en'?'female':'bright',path:`assets/voice/v4-10/${id}-${lang}-${lang==='en'?'female':'bright'}.mp3`}];
for(const [id,d]of Object.entries(dialogue)){if(state.window.GAME_DIALOGUE[id]){d.voiceVariants=state.window.GAME_DIALOGUE[id].voiceVariants;d.voice=state.window.GAME_DIALOGUE[id].voice;}else{d.voiceVariants=Object.fromEntries(['en','yue','cmn'].map(l=>[l,voicePaths(id,l)]));d.voice=Object.fromEntries(['en','yue','cmn'].map(l=>[l,d.voiceVariants[l][0].path]));}}
const order=state.window.GAME_SCENE_ORDER.filter(id=>!['weather','harbor'].includes(id));
const output=`/* V4.10 scene integration and depth; V4.7 authored locomotion remains unchanged. */\n(function(g){\nconst scenes=${JSON.stringify(scenes)};\nfor(const [id,scene]of Object.entries(scenes))g.GAME_SCENES[id]=scene;\ndelete g.GAME_SCENES.weather;delete g.GAME_SCENES.harbor;\ng.GAME_SCENE_ORDER=${JSON.stringify(order)};\nconst objects=${JSON.stringify(objects)};\nfor(const [id,d]of Object.entries(objects)){g.CHAPTER_OBJECTS[id]={...(g.CHAPTER_OBJECTS[id]||{}),...d};g.ANIMAL_ANIMATIONS[id]={poster:d.poster||g.ANIMAL_ANIMATIONS[id]?.poster,chapter:true};}\nObject.assign(g.GAME_DIALOGUE,${JSON.stringify(dialogue)});\ng.SCENE_REVISION='4.10';\n})(window);\n`;
fs.writeFileSync('geo/assets/revisions-data.js',output);fs.mkdirSync(root,{recursive:true});fs.writeFileSync(`${root}/manifest.json`,JSON.stringify({version:'V4.10',removed:['weather','harbor'],order,scenes,objects},null,2));
console.log({scenes:order.length,updated:Object.keys(scenes),objects:Object.keys(objects).length});
