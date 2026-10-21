import fs from 'node:fs/promises';
import path from 'node:path';
const base=path.resolve('geo/assets/exploration-v4-8/camp');
const packaging=JSON.parse(await fs.readFile(path.join(base,'packaging.json'),'utf8')).records;
const dialogue=JSON.parse(await fs.readFile(path.join(base,'dialogue.json'),'utf8'));
const prefix='assets/exploration-v4-8/camp/';
const assets={camptent:['tent','tent-closed.webp','tent',5400],campbackpack:['backpack','backpack.webp','backpack',3800],campstream:['stream','stream.webp','stream',5000],camptree:['tree','tree.webp','tree',4800],campfireflies:['fireflies','fireflies.webp','fireflies',6400],campstars:['stars','stars.webp','stars',6000]};
const objects={};
for(const [id,[name,file,motion,duration]] of Object.entries(assets)){
 const rec=packaging.find(x=>x.name===name);
 objects[id]={poster:prefix+file,width:rec.width,height:rec.height,motion,duration};
}
objects.camptent.extraLayers={open:prefix+'tent-open.webp'};
objects.camptent.label='打开帐篷的小门，看看舒服的内帐';
objects.campbackpack.label='背包轻轻打开，准备出发';
objects.campstream.label='水波流过石头，听轻柔溪水';
objects.camptree.label='树冠随山间微风轻摆';
objects.campfireflies.label='黄昏慢慢变暗，萤火虫亮起';
objects.campstars.label='抬头看看夜空里的星星';
const placements=[
 {id:'camptent',u:.095,feetY:.87,h:.31},
 {id:'campbackpack',u:.25,feetY:.92,h:.18},
 {id:'camptree',u:.37,feetY:.85,h:.44},
 {id:'campfireflies',u:.49,feetY:.61,h:.043,extra:{group:'camp-lights'}},
 {id:'campfireflies',u:.515,feetY:.67,h:.033,extra:{group:'camp-lights'}},
 {id:'campfireflies',u:.536,feetY:.58,h:.034,extra:{group:'camp-lights'}},
 {id:'campstars',u:.66,feetY:.24,h:.12},
 {id:'campstream',u:.85,feetY:.90,h:.135,extra:{bgAnchorX:.86,bgAnchorY:.8}}
].map((p,i)=>({id:p.id,u:p.u,feetY:p.feetY,h:p.h,flip:false,idle:'none',special:null,rotate:0,waterline:null,kind:'discovery',instance:'camp-v4-8-'+p.id+'-'+i,...p.extra}));
const data={scene:{id:'camp',label:'山间露营',numScreens:5,bgStrip:prefix+'background.webp',bgAspect:3,bgMirror:true,ambience:'assets/audio/v4-8/camp.mp3',streamBgAnchorX:.86,animals:placements},objects,dialogue,notes:{background:'Clear native 2172×724 AI original; no people, no fixed tents or bags.',tent:'Both complete original states use the same union crop. Source roof and base bounds match within 1 pixel; no silhouette normalization.',campfireflies:'Keep each insect small at h .033–.043; light pulses and night sky are added by the runtime.',campstream:'Anchor X .86 aligns with the visible right foreground waterway; root renderer resolves nearest mirrored repeat.',prompts:'geo/assets/exploration-v4-8/camp/prompts.json'}};
await fs.writeFile(path.join(base,'camp.json'),JSON.stringify(data,null,2));
console.log(JSON.stringify({ids:Object.keys(objects),placements:placements.length,background:data.scene.bgStrip},null,2));
