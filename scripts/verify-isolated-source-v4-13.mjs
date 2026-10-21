import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { loadRuntimeState, collectMedia } from './runtime-state.mjs';

const directory=path.resolve('v4-13');
const {state,scripts,styles}=loadRuntimeState(directory);
const media=collectMedia(state);
const files=[...new Set([...scripts,...styles,...media.media])];
const missing=[];
for(const file of files){
  const absolute=path.resolve(directory,file);
  if(!absolute.startsWith(directory+path.sep)||!fs.existsSync(absolute))missing.push(file);
}
const sha=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const report={schema:1,base:'4.12',stage:'Prototype isolation proof; does not approve gait artwork',source:directory,chapters:state.GAME_SCENE_ORDER.length,objects:media.ids.size,activeFiles:files.length,allActiveAssetsWithinRuntime:missing.length===0,missing,indexSha256:sha(path.join(directory,'index.html')),baselineIndexSha256:sha('share/runtime-v4-12/index.html'),completed:missing.length===0&&state.GAME_SCENE_ORDER.length===9&&media.ids.size===98};
fs.writeFileSync('reviews/v4-13/source-isolation.json',JSON.stringify(report,null,2));
console.log(report);if(!report.completed)process.exitCode=1;
