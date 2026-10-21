import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const old={window:{}},current={window:{}};
for(const [state,dir]of[[old,'share/runtime-v4-11/assets/'],[current,'geo/assets/']]){
 for(const file of['animation-data','authored-motion-data','motion-v4-11','animal-styles-v4-11','ocean-styles-v4-11','cel-motion'])vm.runInNewContext(fs.readFileSync(dir+file+'.js','utf8'),state);
}
const report={unchanged:[],continuous:[]};
for(const[id,def]of Object.entries(old.window.ANIMAL_ANIMATIONS)){
 if(!def.cel||['zebra','rhino','buffalo'].includes(id))continue;
 const a=old.window.CelMotion.prepare(def),b=current.window.CelMotion.prepare(current.window.ANIMAL_ANIMATIONS[id]);
 for(let i=0;i<=64;i++)assert.equal(JSON.stringify(old.window.CelMotion.sample(a,a.duration*i/64)),JSON.stringify(current.window.CelMotion.sample(b,b.duration*i/64)),id+' exposure behavior changed');
 report.unchanged.push(id);
}
const override='geo/assets/hoof-motion-v4-12.js';
if(fs.existsSync(override)){
 vm.runInNewContext(fs.readFileSync(override,'utf8'),current);
 for(const id of['zebra','rhino','buffalo']){
  const def=current.window.ANIMAL_ANIMATIONS[id],plan=current.window.CelMotion.prepare(def);
  assert(plan.continuousAdvance,id+' is still moving by position jumps');
  let previous=0,movingWithinExposure=0;for(let t=0;t<=plan.duration;t+=5){const p=current.window.CelMotion.sample(plan,t);assert(p.advance>=previous-1e-8,id+' reverses');previous=p.advance;}
  let start=0;for(let i=0;i<plan.holds.length-1;i++){
   const a=current.window.CelMotion.sample(plan,start+plan.holds[i]*.25),b=current.window.CelMotion.sample(plan,start+plan.holds[i]*.75);
   assert.equal(a.frame,b.frame,id+' drawing must stay intact during exposure');
   if(b.advance>a.advance)movingWithinExposure++;
   const before=current.window.CelMotion.sample(plan,start+plan.holds[i]-.01),after=current.window.CelMotion.sample(plan,start+plan.holds[i]+.01);
   assert(Math.abs(after.advance-before.advance)<.001,id+' position jumps between exposures');start+=plan.holds[i];
  }
  assert(movingWithinExposure>=8,id+' too few traveling exposures');assert.equal(current.window.CelMotion.sample(plan,plan.duration,true).advance,0);
  report.continuous.push({id,frames:def.frames.length,movingWithinExposure});
 }
}
fs.mkdirSync('screenshots/v4-12/root',{recursive:true});fs.writeFileSync('screenshots/v4-12/root/cel-travel.json',JSON.stringify(report,null,2));console.log(report);
