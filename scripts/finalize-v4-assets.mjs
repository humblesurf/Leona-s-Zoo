import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {createRequire} from 'node:module';
const require=createRequire('C:/Users/XTIA/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/package.json'),sharp=require('sharp');
const root=process.cwd(),file='geo/assets/generation-v4.json';
const spec=JSON.parse(fs.readFileSync(file,'utf8').replace(/^\uFEFF/,''));
function retain(record,folder){
 const source=path.resolve(record.source),target=path.resolve(folder,record.id+'-source-v4.png');
 fs.mkdirSync(folder,{recursive:true});
 if(source!==target)fs.copyFileSync(source,target);
 record.originalSource??=record.source;
 record.source=path.relative(root,target).replaceAll('\\','/');
}
for(const r of spec.atlases)retain(r,'geo/assets/animation/source');
for(const r of spec.backgrounds){
 r.active=/^(arctic|antarctic)(-|$)/.test(r.id);
 if(r.active)retain(r,'geo/assets/bg/reference');
 else r.reason='User requested the exact uploaded original scene instead of this generated variant.';
}
for(const r of spec.supports)retain(r,'geo/assets/animation/source');
spec.preferredBackgrounds=[];
for(const id of ['savanna','rainforest','ocean']){
 const file=`geo/assets/bg/reference/${id}-preferred-v4.png`,bytes=fs.readFileSync(file),meta=await sharp(bytes).metadata();
 spec.preferredBackgrounds.push({id,file,width:meta.width,height:meta.height,sha256:crypto.createHash('sha256').update(bytes).digest('hex'),policy:'Exact user-uploaded PNG. No redrawing, sharpening, resizing or style transfer. Display full source height at native 3:1 aspect, mirrored continuation at panorama edges.'});
}
spec.animationExtraction='Connected subject isolation; preserve original RGB and alpha edges, uniform padding and whole-frame drawing. Six poses per character. Hanging grip anchors aligned across poses.';
spec.finalAssets={animation:'geo/assets/animation/*-frames-v4.webp; *-poster-v4.webp',manifest:'geo/assets/animation-data.js',supports:'geo/assets/animation/support-tree-v4.webp',polar:'geo/assets/bg/{arctic,antarctic}{,-b}-hd-v4.webp',preferred:'geo/assets/bg/reference/{savanna,rainforest,ocean}-preferred-v4.png'};
fs.writeFileSync(file,JSON.stringify(spec,null,2));
console.log('Retained generated sources and exact preferred backgrounds in the project.');
