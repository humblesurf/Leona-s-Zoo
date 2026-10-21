import fs from 'node:fs';import vm from 'node:vm';import assert from 'node:assert/strict';
const ids=['music','hongkong','beach','planets','weather','supermarket'],objects={},scenes={},dialogue={},defs={};
const cast={en:[['child',''],['male','-male'],['female','-female']],yue:[['female',''],['male','-male'],['bright','-bright']],cmn:[['female',''],['male','-male'],['bright','-bright']]};
for(const id of ids){
 const dir='geo/assets/chapters-v4-9/'+id,f=fs.existsSync(dir+'/'+id+'.json')?dir+'/'+id+'.json':dir+'/manifest.json',chapter=JSON.parse(fs.readFileSync(f,'utf8'));assert(chapter.scene&&chapter.objects&&chapter.dialogue,id);
 scenes[id]=chapter.scene;Object.assign(objects,chapter.objects);Object.assign(dialogue,chapter.dialogue);
 if(id==='hongkong')scenes[id].animals.find(a=>a.id==='hkboc').h=.58;
 if(id==='planets')Object.assign(scenes[id].animals.find(a=>a.id==='cosmossatellite'),{h:.23,feetY:.52});
 if(id==='weather')for(const a of scenes[id].animals)if(!['wxumbrella','wxleaves'].includes(a.id))a.feetY=Math.max(a.feetY,.29+a.h*(a.id==='wxrainbow'?1.32:1.075));
 for(const [oid,obj]of Object.entries(chapter.objects)){
  if(obj.duration<100)obj.duration*=1000;if(!obj.wheels&&obj.wheelHubs)obj.wheels=obj.wheelHubs;
  const w=obj.width||obj.size?.[0],h=obj.height||obj.size?.[1];assert(w&&h&&fs.existsSync('geo/'+obj.poster),oid);
  for(const layer of Object.values(obj.extraLayers||{}))assert(fs.existsSync('geo/'+(typeof layer==='string'?layer:layer.path)),oid);
  defs[oid]={chapter:true,poster:obj.poster,sheet:null,viewport:{w,h},frames:[{x:0,y:0,w,h,dx:0,dy:0}],duration:obj.duration||5000,face:obj.face||1,travel:0,label:dialogue[oid].name.cmn};
 }
 for(const [oid,d]of Object.entries(chapter.dialogue)){
  d.voiceVariants=Object.fromEntries(Object.entries(cast).map(([lang,voices])=>[lang,voices.map(([key,suffix])=>({key,path:`assets/voice/v4-9/${oid}-${lang}${suffix}.mp3`}))]));d.voice=Object.fromEntries(Object.entries(d.voiceVariants).map(([l,v])=>[l,v[0].path]));for(const v of Object.values(d.voiceVariants).flat())assert(fs.statSync('geo/'+v.path).size>3000,v.path);
 }
 for(const a of chapter.scene.animals){assert(objects[a.id]&&dialogue[a.id],a.id);a.facing=a.flip?-1:1;}
}
const order=['savanna','rainforest','ocean','beach','weather','polar','market','supermarket','farm','harbor','hongkong','camp','music','space','planets'];
fs.writeFileSync('geo/assets/chapters-data.js','/* V4.9 six new chapters, preserving the V4.8 baseline. */\nwindow.CHAPTER_OBJECTS='+JSON.stringify(objects)+';\nObject.assign(window.ANIMAL_ANIMATIONS,'+JSON.stringify(defs)+');\nObject.assign(window.GAME_DIALOGUE,'+JSON.stringify(dialogue)+');\nObject.assign(window.GAME_SCENES,'+JSON.stringify(scenes)+');\nwindow.GAME_SCENE_ORDER='+JSON.stringify(order)+';\n');
const state={window:{}};for(const f of ['game-data','animation-data','authored-motion-data','exploration-data','chapters-data'])vm.runInNewContext(fs.readFileSync('geo/assets/'+f+'.js','utf8'),state);
const report={version:'V4.9',base:'V4.8',chapters:ids,newObjects:Object.keys(objects).length,newPlacements:Object.values(scenes).reduce((n,s)=>n+s.animals.length,0),newNarrations:Object.keys(dialogue).length*9,sceneOrder:order,totalObjects:Object.keys(state.window.GAME_DIALOGUE).length,paintedQuadrupeds:Object.values(state.window.ANIMAL_ANIMATIONS).filter(d=>d.cel).length};
assert.equal(report.newObjects,41);assert.equal(report.paintedQuadrupeds,19);fs.writeFileSync('geo/assets/chapters-v4-9/manifest.json',JSON.stringify(report,null,2));fs.writeFileSync('geo/assets/chapters-v4-9/placements.json',JSON.stringify(state.window.GAME_SCENES,null,2));console.log(report);
