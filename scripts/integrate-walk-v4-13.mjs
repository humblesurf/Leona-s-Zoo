import fs from 'node:fs';
import path from 'node:path';
import { walkingIds } from './runtime-state.mjs';

const source = path.resolve('v4-13');
const manifest = JSON.parse(fs.readFileSync(path.join(source, 'assets/animation/walk-v4-13/manifest.json'), 'utf8'));
const cyclesMs = { zebra: 1200, rhino: 1480, buffalo: 1360, warthog: 1040, elephant: 1680, elephantcalf: 1280, lioness: 1200, lioncub: 1040, arcticfox: 1040, cow: 1400, sheep: 1200, pig: 1160, calf: 1120, lamb: 1040, piglet: 1040 };
const definitions = {};
for (const id of walkingIds) {
  const pack = manifest.animals[id];
  if (!pack) continue;
  if (!pack.actualGaitApproved || !pack.ready || !pack.allOriginalsPresent) throw Error('Unapproved artwork cannot be installed: ' + id);
  if (pack.frames.length !== 17 || !Number.isFinite(pack.stridePixels) || pack.stridePixels <= 0) throw Error('Incomplete contact drawing: ' + id);
  const poses = 16, cycles = 2, count = poses * cycles;
  const sequence = [16, ...Array.from({ length: count }, (_, i) => i % poses), 16];
  const holdsMs = [200, ...Array(count).fill(cyclesMs[id] / poses), 300];
  const advance = [0, ...Array.from({ length: count }, (_, i) => i / count), 1];
  definitions[id] = {
    poster: pack.poster, sheet: pack.sheet, viewport: pack.viewport, frames: pack.frames,
    fps: 1000 * poses / cyclesMs[id], loop: false, duration: cyclesMs[id] * cycles + 500,
    face: -1, travel: pack.stridePixels * cycles * 1.1 / pack.viewport.w,
    rig: false, walk: false, hop: 0, pad: true,
    label: 'V4.13 sixteen complete original walk drawings',
    cel: { sequence, holdsMs, advance, restFrame: 16, motion: 'walk', poses, cycles,
      contactAuthored: true, stridePixels: pack.stridePixels, continuousAdvance: true,
      stages: ['prepare', ...Array.from({ length: count }, (_, i) => ['near-fore-recovery', 'far-hind-recovery', 'far-fore-recovery', 'near-hind-recovery'][Math.floor(i % poses / 4)]), 'settle'] },
  };
}
const code = `/* V4.13 complete original drawings. No mesh, rig, cut-out limbs, pose interpolation or AI video. */\n(function(g){const definitions=${JSON.stringify(definitions)};Object.assign(g.ANIMAL_ANIMATIONS,definitions);g.WALK_V4_13={base:'4.12',version:'4.13',ids:Object.keys(definitions),independentPoses:16};g.SCENE_REVISION='4.13';})(window);\n`;
fs.writeFileSync(path.join(source, 'assets/walk-v4-13.js'), code);
const index = path.join(source, 'index.html');
let html = fs.readFileSync(index, 'utf8');
if (!html.includes('assets/walk-v4-13.js')) html = html.replace('<script src="assets/game.js">', '<script src="assets/walk-v4-13.js"></script><script src="assets/game.js">');
html = html.replace('<title>Leona\'s ZOO · 动物世界</title>', '<title>Leona\'s ZOO · V4.13</title>');
fs.writeFileSync(index, html);
console.log({ ids: Object.keys(definitions), complete: Object.keys(definitions).length === walkingIds.length });
