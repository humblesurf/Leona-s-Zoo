import fs from 'node:fs';import{createRequire}from'node:module';
const require=createRequire('C:/Users/XTIA/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/package.json'),sharp=require('sharp');
const root='geo/assets/chapters-v4-11',dir=root+'/space';fs.mkdirSync(dir,{recursive:true});
const animations={},objects={},records=[];
for(const [source,id,holds]of [['alien','spacealien',[340,250,220,250,280,350]],['astronaut','spaceastronaut',[400,320,650,320,400]]]){
 const file=root+'/source/'+source+'.png',meta=await sharp(file).metadata(),cw=Math.floor(meta.width/2),ch=Math.floor(meta.height/2),poses=[];let width=0,height=0;
 for(let i=0;i<4;i++){const cell=await sharp(file).extract({left:i%2*cw,top:Math.floor(i/2)*ch,width:cw,height:ch}).png().toBuffer(),png=await sharp(cell).trim({threshold:18}).png().toBuffer(),m=await sharp(png).metadata();poses.push({png,w:m.width,h:m.height});width=Math.max(width,m.width);height=Math.max(height,m.height);}
 width+=32;height+=32;const frames=[],composites=[];
 for(let i=0;i<4;i++){const p=poses[i],pose=await sharp({create:{width,height,channels:4,background:'#00000000'}}).composite([{input:p.png,left:Math.round((width-p.w)/2),top:height-p.h-16}]).png().toBuffer();composites.push({input:pose,left:i%2*width,top:Math.floor(i/2)*height});frames.push({x:i%2*width,y:Math.floor(i/2)*height,w:width,h:height,dx:0,dy:0});if(!i)await sharp(pose).webp({lossless:true}).toFile(dir+'/'+id+'-poster.webp');}
 await sharp({create:{width:width*2,height:height*2,channels:4,background:'#00000000'}}).composite(composites).webp({lossless:true}).toFile(dir+'/'+id+'-frames.webp');
 const sequence=id==='spacealien'?[0,1,2,1,3,0]:[0,1,2,3,0];animations[id]={poster:'assets/chapters-v4-11/space/'+id+'-poster.webp',sheet:'assets/chapters-v4-11/space/'+id+'-frames.webp',viewport:{w:width,h:height},frames,face:0,travel:0,loop:false,rig:false,walk:false,duration:holds.reduce((a,b)=>a+b,0),cel:{sequence,holdsMs:holds,advance:holds.map(()=>0),restFrame:0,motion:'observe'}};records.push({id,poses:4,viewport:{width,height},registration:'Rigid bottom alignment, common canvas, no morphing; complete original drawings.'});
}
await sharp(root+'/source/dish.png').trim({threshold:12}).extend({top:16,right:16,bottom:16,left:16,background:'#00000000'}).webp({lossless:true}).toFile(dir+'/spacedish.webp');const dm=await sharp(dir+'/spacedish.webp').metadata();objects.spacedish={poster:'assets/chapters-v4-11/space/spacedish.webp',width:dm.width,height:dm.height,motion:'radio',duration:4200};
await sharp(root+'/source/market.png').webp({lossless:true}).toFile(root+'/market/background.webp');const m=await sharp(root+'/source/market.png').metadata();
fs.writeFileSync(root+'/root-art.json',JSON.stringify({animations,objects,records,market:{path:'assets/chapters-v4-11/market/background.webp',aspect:m.width/m.height}},null,2));
console.log(records);
