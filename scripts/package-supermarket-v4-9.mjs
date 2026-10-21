import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import {createRequire} from 'node:module';
const require=createRequire('C:/Users/XTIA/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/package.json');
const sharp=require('sharp');
const root=path.resolve('geo/assets/chapters-v4-9/supermarket');
const prefix='assets/chapters-v4-9/supermarket/';
const ids=['shopmilk','shopbread','shopeggs','shopyogurt','shoptissue','shopcart','shopbasket'];
const report={generatedWith:'built-in image_gen',operations:'Whole-object crop with transparent padding; original alpha preserved; lossless WebP encoding. No joints, mesh deformation, sprite splitting, or fake resolution increase.',assets:[]};
const objects={};
for(const id of ['background',...ids]){
 const source=path.join(root,'source',id+'.png');
 const meta=await sharp(source).metadata();
 const {data,info}=await sharp(source).ensureAlpha().raw().toBuffer({resolveWithObject:true});
 let transparent=0,semi=0,opaque=0,edge=0,minX=info.width,minY=info.height,maxX=-1,maxY=-1;
 for(let y=0;y<info.height;y++)for(let x=0;x<info.width;x++){
  const a=data[(y*info.width+x)*4+3];
  if(a===0)transparent++;else if(a===255)opaque++;else semi++;
  if(a>=16){minX=Math.min(minX,x);minY=Math.min(minY,y);maxX=Math.max(maxX,x);maxY=Math.max(maxY,y);if(x===0||y===0||x===info.width-1||y===info.height-1)edge++;}
 }
 if(id!=='background'&&(!meta.hasAlpha||transparent/(info.width*info.height)<.05))throw Error(id+' does not have usable transparency');
 const margin=14,left=id==='background'?0:Math.max(0,minX-margin),top=id==='background'?0:Math.max(0,minY-margin);
 const right=id==='background'?info.width:Math.min(info.width,maxX+margin+1),bottom=id==='background'?info.height:Math.min(info.height,maxY+margin+1);
 const crop={left,top,width:right-left,height:bottom-top};
 const dest=path.join(root,id+'.webp');
 await sharp(source).extract(crop).webp({lossless:true}).toFile(dest);
 const out=await sharp(dest).metadata();
 const rec={id,sourceWidth:info.width,sourceHeight:info.height,width:out.width,height:out.height,hasAlpha:meta.hasAlpha,transparentRatio:transparent/(info.width*info.height),semiRatio:semi/(info.width*info.height),edgeAlphaPixels:edge,crop,sha256:crypto.createHash('sha256').update(await fs.readFile(dest)).digest('hex')};
 report.assets.push(rec);
 if(id!=='background'){
  objects[id]={poster:prefix+id+'.webp',width:out.width,height:out.height,motion:id==='shopcart'?'shop-cart':id==='shopbasket'?'shop-basket':'shop-product',duration:id==='shopcart'?6800:id==='shopbasket'?3200:4200};
  if(id==='shopcart'){
   // Hub centers recorded from the complete generated source image; wheels remain whole in the painting.
   const sourceHubs=[[.147,.796,.057],[.350,.710,.046],[.675,.906,.055],[.885,.811,.056]];
   objects[id].face=1;
   objects[id].wheelHubs=sourceHubs.map(([x,y,r])=>({x:(x*info.width-left)/crop.width,y:(y*info.height-top)/crop.height,r:r*info.width/crop.width}));
  }
 }
}
const layout=[
 ['shopmilk',.09,.445,.25],['shopbread',.23,.445,.18],['shopeggs',.38,.445,.21],
 ['shopyogurt',.52,.445,.21],['shoptissue',.67,.445,.22],['shopcart',.81,.90,.37],['shopbasket',.95,.885,.27]
];
const scene={id:'supermarket',label:'逛超市',numScreens:5,bgStrip:prefix+'background.webp',bgAspect:3,bgMirror:true,ambience:'assets/audio/v4-9/supermarket.mp3',counterFeetY:.445,animals:layout.map(([id,u,feetY,h],i)=>({id,u,feetY,h,flip:false,idle:'none',kind:'discovery',instance:'supermarket-v4-9-'+id+'-'+i}))};
const dialogue=JSON.parse(await fs.readFile(path.join(root,'dialogue.json'),'utf8'));
await fs.writeFile(path.join(root,'supermarket.json'),JSON.stringify({scene,objects,dialogue},null,2)+'\n');
await fs.writeFile(path.join(root,'manifest.json'),JSON.stringify(report,null,2)+'\n');
await fs.writeFile(path.join(root,'README.md'),'# 逛超市 V4.9\n\nGenerated with the built-in ImageGen tool. All prompts are in prompts.json; targeted background extraction prompts are in transparency-fixes.json. Original source PNGs and generation metadata are retained in this folder. Runtime artwork is lossless WebP.\n\nThe counter top is at background y ≈ 0.43; products use feetY 0.445 with transparent padding. The shopping cart and basket stand on the aisle floor. There are no people, brands, printed product names, or clickable products baked into the background. Six eggs and four caster wheels were privately inspected. Cart wheelHubs refer to intact painted wheel centers, not separated limb artwork.\n\nProducts move into a runtime shopping basket; the collection renderer and recordings are integrated by the root runtime.\n');
console.log(JSON.stringify({scene:scene.id,objects:ids.length,background:report.assets[0],sprites:report.assets.slice(1).map(a=>({id:a.id,width:a.width,height:a.height,alpha:a.transparentRatio,edge:a.edgeAlphaPixels}))},null,2));
