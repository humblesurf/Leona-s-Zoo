import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const ids=process.argv.slice(2).length?process.argv.slice(2):['harbor','camp','space'];
const chapters=ids.map(id=>[id,JSON.parse(fs.readFileSync(`geo/assets/exploration-v4-8/${id}/${id}.json`,'utf8'))]);
const scenes={},objects={},dialogue={};
const cast={en:[['child',''],['male','-male'],['female','-female']],yue:[['female',''],['male','-male'],['bright','-bright']],cmn:[['female',''],['male','-male'],['bright','-bright']]};
const frameDefs={};
for(const [id,chapter]of chapters){
 scenes[id]=chapter.scene;Object.assign(objects,chapter.objects);Object.assign(dialogue,chapter.dialogue);
 if(id==='harbor')Object.assign(scenes[id].animals.find(a=>a.id==='harborlighthouse'),{feetY:.84,h:.46});
 // Reflect each adjoining half of the original landscape to join its edge
 // exactly; straight repeats make a visible cut across the lunar terrain.
 if(id==='space')for(const section of scenes[id].sections||[])section.bgMirror=true;
 for(const [oid,d]of Object.entries(chapter.dialogue)){
  d.voiceVariants=Object.fromEntries(Object.entries(cast).map(([lang,voices])=>[lang,voices.map(([key,suffix])=>({key,path:`assets/voice/v4-8/${oid}-${lang}${suffix}.mp3`}))]));
  d.voice=Object.fromEntries(Object.entries(d.voiceVariants).map(([lang,v])=>[lang,v[0].path]));
  for(const variants of Object.values(d.voiceVariants))for(const v of variants)assert(fs.statSync('geo/'+v.path).size>3000,v.path);
 }
 for(const a of chapter.scene.animals){assert(objects[a.id]&&dialogue[a.id],a.id);a.facing=a.flip?-1:1;}
 for(const [oid,obj]of Object.entries(chapter.objects)){
  // Chapter artwork manifests may express time in seconds; runtime uses ms.
  if(obj.duration>0&&obj.duration<100)obj.duration*=1000;
  if(Array.isArray(obj.extraLayers))obj.extraLayers=Object.fromEntries(obj.extraLayers.map(l=>[l.id?.includes('sail')?'sail':l.id,{...l,origin:l.origin||l.pivot}]));
  if(obj.lampAnchor)obj.lamp={x:obj.lampAnchor[0],y:obj.lampAnchor[1]};
  const w=obj.width||obj.size?.[0],h=obj.height||obj.size?.[1];assert(w&&h&&obj.poster,oid+': incomplete dimensions');
  frameDefs[oid]={exploration:true,poster:obj.poster,sheet:null,viewport:{w,h},frames:[{x:0,y:0,w,h,dx:0,dy:0}],duration:obj.duration||6000,face:obj.facing??1,travel:0,label:dialogue[oid].name.cmn};
  assert(fs.existsSync('geo/'+obj.poster),obj.poster);
  for(const layer of Object.values(obj.extraLayers||{}))assert(fs.existsSync('geo/'+(typeof layer==='string'?layer:layer.path)),oid+': layer');
 }
}
const recordings=JSON.parse(fs.readFileSync('geo/assets/audio/v4-8/recordings.json','utf8')),stream=recordings.find(r=>r.id==='campstream');
const script=`/* V4.8 new chapters; the V4.7.1 baseline stays separate. */\nwindow.EXPLORATION_OBJECTS = ${JSON.stringify(objects)};\nObject.assign(window.ANIMAL_ANIMATIONS,${JSON.stringify(frameDefs)});\nObject.assign(window.GAME_DIALOGUE,${JSON.stringify(dialogue)});\nObject.assign(window.GAME_SCENES,${JSON.stringify(scenes)});\nwindow.GAME_SCENE_ORDER.push(...${JSON.stringify(ids)});\n`;
fs.writeFileSync('geo/assets/exploration-data.js',script);
fs.writeFileSync('geo/assets/exploration-calls.js','Object.assign(window.CALL_RECORDINGS,'+JSON.stringify({campstream:stream})+');\n');
const state={window:{}};
for(const f of ['game-data','animation-data','authored-motion-data','exploration-data'])vm.runInNewContext(fs.readFileSync('geo/assets/'+f+'.js','utf8'),state);
const report={version:'V4.8',chapters:ids,newObjects:Object.keys(objects).length,newPlacements:chapters.reduce((n,[_,c])=>n+c.scene.animals.length,0),newNarrations:Object.keys(dialogue).length*9,totalObjects:Object.keys(state.window.GAME_DIALOGUE).length,sceneOrder:state.window.GAME_SCENE_ORDER,paintedQuadrupeds:Object.values(state.window.ANIMAL_ANIMATIONS).filter(d=>d.cel).length,media:Object.values(objects).flatMap(o=>[o.poster,...Object.values(o.extraLayers||{}).map(l=>typeof l==='string'?l:l.path)]),ambience:recordings};
fs.writeFileSync('geo/assets/exploration-v4-8/manifest.json',JSON.stringify(report,null,2));
fs.writeFileSync('geo/assets/exploration-v4-8/placements.json',JSON.stringify(state.window.GAME_SCENES,null,2));
console.log({chapters:report.chapters,newObjects:report.newObjects,newPlacements:report.newPlacements,newNarrations:report.newNarrations,paintedQuadrupeds:report.paintedQuadrupeds});
