import fs from 'node:fs';
import path from 'node:path';

// Far grassland groups are scenery, not additional foreground hit targets.
// Fixed offsets keep resize/reloads reproducible and give each herd a shared
// migration direction, with smaller members further behind the leading row.
const groups = [
  { centre: .050, species: ['buffalo', 'buffalo', 'gazelle', 'buffalo'] },
  { centre: .174, species: ['zebra', 'zebra', 'zebra', 'gazelle'] },
  { centre: .296, species: ['buffalo', 'buffalo', 'buffalo', 'buffalo'] },
  { centre: .422, species: ['gazelle', 'gazelle', 'buffalo', 'gazelle'] },
  { centre: .550, species: ['buffalo', 'buffalo', 'buffalo', 'buffalo'] },
  { centre: .676, species: ['zebra', 'zebra', 'zebra', 'zebra'] },
  { centre: .800, species: ['buffalo', 'buffalo', 'buffalo', 'buffalo'] },
  { centre: .923, species: ['buffalo', 'buffalo', 'zebra', 'buffalo'] },
];
const offsets = [-.0075, -.0025, .0037, .009];
const sizes = [.020, .024, .027, .034];
const grounds = [.475, .481, .484, .493];
const farHerds = groups.flatMap((group, groupIndex) => group.species.map((id, i) => ({
  id, u: +(group.centre + offsets[i]).toFixed(5),
  h: +(sizes[i] + (groupIndex % 3 - 1) * .001).toFixed(3),
  feetY: +(grounds[i] + (groupIndex % 2) * .002).toFixed(3),
  flip: true, opacity: [.68, .72, .75, .8][i], depth: 6,
  herdRevision: '4.12', herdGroup: `migration-${groupIndex + 1}`,
}))).concat([
  { id: 'buffalo', u: .106, h: .023, feetY: .482, flip: true, opacity: .72 },
  { id: 'gazelle', u: .353, h: .021, feetY: .48, flip: true, opacity: .70 },
  { id: 'zebra', u: .610, h: .025, feetY: .486, flip: true, opacity: .75 },
  { id: 'buffalo', u: .862, h: .022, feetY: .481, flip: true, opacity: .72 },
].map(item => ({ ...item, depth: 6, herdRevision: '4.12', herdGroup: 'scattered-followers' })));

const halfWater = {
  id: 'crocodile', instance: 'v4-12-crocodile-halfwater',
  u: .768, h: .115, feetY: .5883, waterDepth: .42,
  pondGroup: 'crocodile', shoreX: .765,
  flip: false, facing: 0, idle: 'none',
};

const source = `/* V4.12: distant migration and crocodiles placed in the painted pond. */
(function(g){
  const scene=g.GAME_SCENES?.savanna;
  if(!scene)throw new Error('Load savanna-v4-12.js after revisions-v4-11.js.');
  const removedInstance='v4-10-crocodile-30';
  scene.animals=scene.animals.filter(a=>a.instance!==removedInstance&&a.instance!=='v4-12-crocodile-halfwater');
  const bank=scene.animals.find(a=>a.instance==='savanna-crocodile-20');
  if(bank){bank.dryShore=true;delete bank.waterDepth;}
  const eyesNear=scene.animals.find(a=>a.instance==='v4-10-crocodile-31');
  const eyesFar=scene.animals.find(a=>a.instance==='v4-10-crocodile-32');
  if(eyesNear){eyesNear.shoreX=.69;eyesNear.feetY=.55;eyesNear.idle='none';}
  if(eyesFar){eyesFar.shoreX=.64;eyesFar.feetY=.544;eyesFar.idle='none';}
  scene.animals.push(${JSON.stringify(halfWater)});
  scene.backgroundHerds=[...(scene.backgroundHerds||[]).filter(d=>d.herdRevision!=='4.12'),...${JSON.stringify(farHerds)}];
  g.SAVANNA_V4_12={version:'4.12',removedInstance,farHerdCount:${farHerds.length},waterSurface:.54,
    waterInstances:['v4-12-crocodile-halfwater','v4-10-crocodile-31','v4-10-crocodile-32'],
    bankInstance:'savanna-crocodile-20',sceneScreens:scene.numScreens};
})(window);
`;
const target = path.resolve('geo/assets/savanna-v4-12.js');
fs.writeFileSync(target, source);
console.log(JSON.stringify({ output: target, newFarHerds: farHerds.length, species: farHerds.reduce((acc, d) => (acc[d.id] = (acc[d.id] || 0) + 1, acc), {}) }, null, 2));
