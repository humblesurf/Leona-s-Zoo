import fs from 'node:fs';
import vm from 'node:vm';
import crypto from 'node:crypto';
const state={window:{}};
const sources=['quadruped-walk.js','animal-motion.js','puppet-rigs.js','anims.js','game.js','game.css'];
for(const name of sources.slice(0,3))vm.runInNewContext(fs.readFileSync('geo/assets/'+name,'utf8'),state);
const report={
 version:'4.5',base:'4.4',scope:'Species-specific quadruped motion and giraffe browsing',
 renderer:'Continuous 2D rigid articulated cutouts with planted stance feet',
 profiles:state.window.QuadrupedWalk.profiles,
 giraffe:state.window.SpritePuppets.rigs.giraffe,
 sources:Object.fromEntries(sources.map(name=>[name,crypto.createHash('sha256').update(fs.readFileSync('geo/assets/'+name)).digest('hex')])),
 checks:['scripts/review-motion-v4-5.mjs','scripts/playback-motion-v4-5.mjs','scripts/giraffe-v4-5-review.mjs','scripts/check-motion-portable-v4-5.mjs'],
 limitations:'Stylized 2D short run; no complete spine flexion, muscle deformation or 3D model',
 preservedBaseline:'share/runtime-v4-4'
};
fs.mkdirSync('geo/assets/animation/v4-5',{recursive:true});
fs.writeFileSync('geo/assets/animation/v4-5/motion.json',JSON.stringify(report,null,2));
console.log({version:report.version,walkers:Object.keys(report.profiles).length,giraffeDuration:report.giraffe.duration});
