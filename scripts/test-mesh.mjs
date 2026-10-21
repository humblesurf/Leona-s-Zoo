import {createRequire} from 'node:module';
import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const require=createRequire('C:/Users/XTIA/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/package.json'),sharp=require('sharp');
const ctx={window:{}};vm.runInNewContext(fs.readFileSync('geo/assets/animal-rigs.js','utf8'),ctx);
const {ANIMAL_RIGS:rigs,poseAnimal:pose}=ctx.window,report=[];
for(const id of Object.keys(rigs)){
 const file=`geo/assets/animals/${id==='otter'?'otter-v2':id}.webp`,meta=await sharp(file).metadata(),{data,info}=await sharp(file).ensureAlpha().raw().toBuffer({resolveWithObject:true});
 let folded=0,sampled=0,max=0;
 const alpha=(x,y)=>data[(Math.min(info.height-1,Math.floor(y*info.height))*info.width+Math.min(info.width-1,Math.floor(x*info.width)))*4+3];
 for(const t of [0,.22,.37,.53,.71,1]){
  const points=[];
  for(let y=0;y<=32;y++)for(let x=0;x<=40;x++){
   const p=pose(id,x/40,y/32,t,meta.width/meta.height);assert.ok(Number.isFinite(p.x+p.y),id);
   if(t===0||t===1)assert.ok(Math.hypot(p.x-x/40,p.y-y/32)<1e-9,`${id}: rest pose`);
   max=Math.max(max,Math.hypot(p.x-x/40,p.y-y/32));points.push(p);
  }
  for(let y=0;y<32;y++)for(let x=0;x<40;x++){
   if(alpha((x+.5)/40,(y+.5)/32)<220)continue;
   const a=points[y*41+x],b=points[y*41+x+1],c=points[(y+1)*41+x],d=points[(y+1)*41+x+1];
   const area=(a,b,c)=>(b.x-a.x)*(c.y-a.y)-(b.y-a.y)*(c.x-a.x);
   sampled+=2;if(area(a,b,c)<=0)folded++;if(area(b,d,c)<=0)folded++;
  }
 }
 report.push({id,foldedOpaqueTriangles:folded,sampledOpaqueTriangles:sampled,maxDisplacement:max});
 assert.equal(folded,0,`${id}: avoid folded body surface`);
 if(id!=='igloo')assert.ok(max>.008,`${id}: moves a body part`);
}
const shell=pose('turtle',.45,.28,.4,700/426),neck=pose('boa',.51,.12,.4,621/546);
assert.ok(Math.hypot(shell.x-.45,shell.y-.28)<.005,'turtle shell stays stable');
assert.ok(neck.y<.02,'snake extends its neck');
const tiger=[.075,.37,.54,.82].map(x=>pose('tiger',x,.93,.3,700/286));
assert.ok(Math.abs((tiger[0].x-.075)-(tiger[1].x-.37))>.01,'front legs move separately');
fs.writeFileSync('geo/screenshots/v3/mesh-audit.json',JSON.stringify(report,null,2));console.log({rigs:report.length,foldedTriangles:0,restPoseRestored:true});
