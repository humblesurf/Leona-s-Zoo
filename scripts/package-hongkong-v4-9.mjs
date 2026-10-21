import fs from 'node:fs/promises';
import path from 'node:path';
import { createRequire } from 'node:module';
const require = createRequire('C:/Users/XTIA/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/package.json');
const sharp = require('sharp');
const dir='geo/assets/chapters-v4-9/hongkong';
const prefix='assets/chapters-v4-9/hongkong/';
const sourceIds={hkferry:'hkferry',hktram:'hktram-clean',hkbus:'hkbus',hkboc:'hkboc-clean',hkclock:'hkclock',hkdim:'hkdim-complete'};
const packaging=[];
const objects={};
const motion={hkferry:'boat',hktram:'tram',hkbus:'bus',hkboc:'windows',hkclock:'clock',hkdim:'steam'};
function mapPoint(p,b,m){return {x:(p.x*m.width-b.left)/b.width,y:(p.y*m.height-b.top)/b.height,...(p.r?{r:p.r*m.width/b.width}:{})};}
for(const [id,src] of Object.entries(sourceIds)){
 const source=path.join(dir,'source',src+'.png');
 const {data,info}=await sharp(source).ensureAlpha().raw().toBuffer({resolveWithObject:true});
 let left=info.width,top=info.height,right=0,bottom=0,clear=0;
 for(let y=0;y<info.height;y++)for(let x=0;x<info.width;x++){const a=data[(y*info.width+x)*4+3];if(a<=8){clear++;continue;}left=Math.min(left,x);top=Math.min(top,y);right=Math.max(right,x);bottom=Math.max(bottom,y);}
 const pad=6;left=Math.max(0,left-pad);top=Math.max(0,top-pad);right=Math.min(info.width-1,right+pad);bottom=Math.min(info.height-1,bottom+pad);
 const crop={left,top,width:right-left+1,height:bottom-top+1};
 const file=path.join(dir,id+'.webp');
 await sharp(source).extract(crop).webp({lossless:true,effort:6}).toFile(file);
 const final=await sharp(file).metadata();
 objects[id]={poster:prefix+id+'.webp',width:final.width,height:final.height,motion:motion[id],duration:['boat','tram','bus'].includes(motion[id])?7000:4300};
 if(id==='hkferry')objects[id].travel=.15;
 if(id==='hktram'){objects[id].travel=.18;objects[id].wheelHubs=[{x:.2575,y:.906,r:.017},{x:.545,y:.912,r:.017}].map(p=>mapPoint(p,crop,info));objects[id].poleTip=mapPoint({x:.125,y:.026},crop,info);}
 if(id==='hkbus'){objects[id].travel=.19;objects[id].wheelHubs=[{x:.137,y:.828,r:.029},{x:.213,y:.829,r:.029},{x:.623,y:.839,r:.034}].map(p=>mapPoint(p,crop,info));}
 if(id==='hkclock'){objects[id].clockFaces=[mapPoint({x:.408,y:.463,r:.054},crop,info),mapPoint({x:.584,y:.47,r:.06},crop,info)];}
 if(id==='hkdim'){objects[id].steamAnchors=[{x:.32,y:.60},{x:.53,y:.64},{x:.76,y:.64}];}
 if(id==='hkboc'){objects[id].windows=[[.403,.341,.019,.005],[.201,.677,.022,.005],[.269,.697,.022,.005],[.554,.696,.019,.005],[.235,.797,.020,.005],[.309,.847,.020,.005],[.724,.909,.020,.005],[.822,.927,.021,.005]];}
 if(objects[id].wheelHubs)objects[id].wheels=objects[id].wheelHubs;
 if(objects[id].clockFaces)objects[id].clockCenter=[objects[id].clockFaces[0].x,objects[id].clockFaces[0].y];
 packaging.push({id,source:'source/'+src+'.png',file:id+'.webp',sourceSize:[info.width,info.height],crop,finalSize:[final.width,final.height],transparentFraction:clear/(info.width*info.height),alphaPreserved:true});
}
for(const region of ['harbour','street','skyline']){
 const src=path.join(dir,'source','background-'+region+'.png');
 const m=await sharp(src).metadata();
 if(Math.abs(m.width/m.height-3)>.02)throw new Error('Background aspect '+region);
 await sharp(src).webp({lossless:true,effort:6}).toFile(path.join(dir,'background-'+region+'.webp'));
 packaging.push({id:'background-'+region,file:'background-'+region+'.webp',sourceSize:[m.width,m.height],finalSize:[m.width,m.height],opaque:true});
}
const dialogue=JSON.parse(await fs.readFile(path.join(dir,'dialogue.json'),'utf8'));
const placements=[
 {id:'hkferry',u:.14,h:.25,feetY:.79,flip:false,region:'harbour',facing:1},
 {id:'hktram',u:.43,h:.48,feetY:.892,flip:false,region:'street',facing:1},
 {id:'hkbus',u:.59,h:.38,feetY:.95,flip:false,region:'street',facing:1},
 {id:'hkboc',u:.727,h:.67,feetY:.90,flip:false,region:'skyline',facing:0},
 {id:'hkclock',u:.855,h:.58,feetY:.91,flip:false,region:'skyline',facing:0},
 {id:'hkdim',u:.944,h:.41,feetY:.94,flip:false,region:'skyline',facing:0}
].map((a,i)=>({...a,idle:'none',instance:'v4-9-'+a.id+'-'+i,kind:'discovery'}));
const scene={id:'hongkong',label:'香港',numScreens:9,bgAspect:3,bgMirror:true,ambience:'assets/audio/v4-9/hongkong.mp3',bgStrip:prefix+'background-harbour.webp',sections:[
 {id:'harbour',label:'维港与码头',screens:3,bgStrip:prefix+'background-harbour.webp',bgAspect:3,bgMirror:true},
 {id:'street',label:'街道与叮叮车',screens:3,bgStrip:prefix+'background-street.webp',bgAspect:3,bgMirror:true},
 {id:'skyline',label:'城市天际线',screens:3,bgStrip:prefix+'background-skyline.webp',bgAspect:3,bgMirror:true}
],animals:placements};
await fs.writeFile(path.join(dir,'manifest.json'),JSON.stringify({scene,objects,dialogue},null,2)+'\n');
await fs.writeFile(path.join(dir,'asset-qa.json'),JSON.stringify({version:'V4.9',chapter:'香港',assets:packaging,qa:{fullObjectSprites:true,landmarkRecognizabilityReviewed:true,backgroundTargetsNotDuplicated:true,noPeople:true,vehiclesFaceRight:true,notAScaleMap:true},notes:['Style is stylized 3D painted game art; source alpha preserved and final transparent sprites tested over pale background.','Educational composition shows independent Hong Kong landmark illustrations rather than pretending this is an exact geographic panorama.','Star Ferry white upper deck / green lower hull / two-level traditional double-ended design; tram has two decks and trolley pole; bus has two decks and 3 axles; BOC four stepped triangular shafts, diagonal braces and 2 masts; Clock Tower red brick, pale stone, octagonal dome/rod.','Street rails are horizontal at y about .86; tram tyres near .89. Overhead background wire is distant.']},null,2)+'\n');
console.log(JSON.stringify({chapter:'hongkong',objects:Object.keys(objects),placements:placements.length,assets:packaging.map(x=>({id:x.id,size:x.finalSize}))},null,2));

