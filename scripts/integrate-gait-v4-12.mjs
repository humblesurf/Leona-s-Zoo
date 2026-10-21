import fs from 'node:fs';
const dir='geo/assets/animation/v4-12-gait/';
const complete=fs.existsSync(dir+'manifest.json'),pack=JSON.parse(fs.readFileSync(dir+(complete?'manifest.json':'partial-pack.json'),'utf8'));
const definitions={},phases=['near-hind-release','near-hind-forward-swing','near-hind-contact','near-front-forward-swing','far-hind-release','far-hind-forward-swing','far-hind-contact','far-front-forward-swing'];
const profiles={zebra:{cycle:[185,90,135,135,185,90,135,135],travel:.32},rhino:{cycle:[205,100,150,160,205,100,150,160],travel:.26},buffalo:{cycle:[195,95,150,150,195,95,150,150],travel:.30}};
for(const[id,p]of Object.entries(pack.animals)){
 const profile=profiles[id],total=profile.cycle.reduce((s,x)=>s+x,0)*2;
 const sequence=[2],holds=[190],stages=['settle'],advance=[0];let elapsed=0;
 for(let lap=0;lap<2;lap++)for(let i=0;i<8;i++){sequence.push(i);holds.push(profile.cycle[i]);stages.push(phases[i]);advance.push(elapsed/total);elapsed+=profile.cycle[i];}
 sequence.push(2);holds.push(300);stages.push('rest');advance.push(1);
 definitions[id]={poster:p.poster,sheet:p.sheet,viewport:p.viewport,frames:p.frames,fps:8,loop:false,duration:holds.reduce((a,b)=>a+b,0),face:-1,travel:profile.travel,rig:false,walk:false,hop:0,pad:true,label:'V4.12 original four-beat walk, alternating hind limbs',cel:{sequence,holdsMs:holds,advance,stages,restFrame:2,motion:'walk',continuousAdvance:true}};
}
fs.writeFileSync('geo/assets/hoof-motion-v4-12.js',`/* Complete-body original drawings; no mesh, limb reconstruction or crossfade. */\n(function(g){const defs=${JSON.stringify(definitions)};for(const[id,d]of Object.entries(defs))g.ANIMAL_ANIMATIONS[id]=d;g.HOOF_V4_12={version:'4.12',ids:Object.keys(defs),poses:8,registration:'body landmarks, one shared output scale',continuousWholeCharacterTravel:true};})(window);\n`);
console.log({complete,ids:Object.keys(definitions),profiles});
