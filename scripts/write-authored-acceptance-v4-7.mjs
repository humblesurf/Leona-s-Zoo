import fs from 'node:fs';import crypto from 'node:crypto';import assert from 'node:assert/strict';
const root='geo/assets/animation/v4-7',pack=JSON.parse(fs.readFileSync(root+'/packaging.json','utf8'));
const runtime=JSON.parse(fs.readFileSync('screenshots/v4-7/runtime-checks.json','utf8')),playback=JSON.parse(fs.readFileSync('screenshots/v4-7/playback-checks.json','utf8')),preview=JSON.parse(fs.readFileSync('screenshots/v4-7/preview-checks.json','utf8'));
assert.equal(pack.characters.length,19);assert.equal(runtime.characters.length,19);assert.equal(playback.characters.length,19);
assert.equal(runtime.errors.length+playback.errors.length+preview.errors.length,0);
const characters=pack.characters.map(c=>{
 const technical=runtime.characters.find(r=>r.id===c.id),clock=playback.characters.find(r=>r.id===c.id);
 assert(technical&&clock&&technical.allExposureBoundaries&&clock.exposureOrder&&clock.preserved&&clock.forward,c.id);
 return {id:c.id,poses:c.poses,motion:c.motion,durationMs:c.duration,cycleHoldsMs:c.cycleHolds,source:c.source,sourceSha256:crypto.createHash('sha256').update(fs.readFileSync(c.source)).digest('hex'),viewport:c.viewport,renderer:'whole painted cels; no limb segmentation, IK, mesh deformation or pose blending',technical:{unclipped:technical.edgeAlphaPixels===0,forward:clock.forward,repeatedTapKeepsPhase:clock.preserved,exposureOrder:clock.exposureOrder,maximumClockBoundaryErrorMs:clock.maxClockError,turnsAtBoundary:clock.turnsAtBoundary}};
});
const reviews=['hoof-temporal-qa.json','cats-hoof-temporal-qa.json','family-temporal-qa.json'].map(file=>({file:'assets/animation/v4-7/source/'+file,...JSON.parse(fs.readFileSync(root+'/source/'+file,'utf8'))}));
const approved=new Set(reviews.flatMap(r=>r.finalAcceptedIds||[]));
for(const c of characters)assert(approved.has(c.id),c.id+': final footfall review is missing');
const report={version:'V4.7',base:'Preserved V4.6.1; V5 excluded',workflow:'Complete original pose paintings; species-specific exposure timing. No AI video.',inspection:'Private chronological pose/footfall review plus real webpage clock, input and clipping checks; stylized key poses, not motion capture.',characters,visualReviews:reviews,preview:{normalAndHalfSpeed:true,oldVersionComparison:true,viewports:preview.viewports},unchangedBaseline:JSON.parse(fs.readFileSync('screenshots/v4-7/preserved-baseline.json','utf8'))};
fs.writeFileSync(root+'/acceptance.json',JSON.stringify(report,null,2));console.log({characters:characters.length,paintedPoses:characters.reduce((n,c)=>n+c.poses,0),maximumClockError:Math.max(...characters.map(c=>c.technical.maximumClockBoundaryErrorMs))});
