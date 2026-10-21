import fs from 'node:fs';import vm from 'node:vm';import {createRequire} from 'node:module';
const require=createRequire('C:/Users/XTIA/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/package.json'),sharp=require('sharp');
const generated='C:/Users/XTIA/.codex/generated_images/01a10f9e-2f4a-7871-99ad-7fc17088e9c3/';
const dir='geo/assets/chapters-v4-10';
const assets=[['camp','map','exec-0ce74ae9-34bf-425e-b009-dc572187828d.png'],['camp','binoculars','exec-b67b29d5-0c6e-49a6-93d3-89818d47cb34.png'],['camp','lantern','exec-4e8b8b92-8375-4b20-9002-76fc4166f5d0.png'],['camp','family','exec-69406ab5-bc63-49e5-9978-2093c7d2caa8.png'],['beach','background','exec-3db63419-71de-441a-8e3d-a825809c7cc4.png']];
const specs={};for(const [scene,id,file]of assets){fs.mkdirSync(`${dir}/${scene}/source`,{recursive:true});fs.copyFileSync(generated+file,`${dir}/${scene}/source/${id}.png`);let pipeline=sharp(generated+file);if(scene==='camp')pipeline=pipeline.trim({threshold:4}).extend({top:12,right:12,bottom:12,left:12,background:'#00000000'});await pipeline.webp({lossless:true}).toFile(`${dir}/${scene}/${id}.webp`);specs[id]=await sharp(`${dir}/${scene}/${id}.webp`).metadata();}
const state={window:{}};for(const f of ['game-data','animation-data','authored-motion-data','exploration-data','chapters-data'])vm.runInNewContext(fs.readFileSync(`geo/assets/${f}.js`,'utf8'),state);
const camp=structuredClone(state.window.GAME_SCENES.camp),objects={};camp.decor=[{sprite:'assets/chapters-v4-10/camp/family.webp',u:.144,feetY:.75,h:.24,depth:8}];
for(const [id,key,u,h,feetY,motion]of [['camplantern','lantern',.204,.19,.87,'camp-lantern'],['campmap','map',.288,.15,.80,'camp-map'],['campbinoculars','binoculars',.603,.135,.87,'camp-binoculars']]){camp.animals.push({id,u,h,feetY,flip:false,idle:'none',kind:'discovery',instance:`${id}-v4-10`});objects[id]={poster:`assets/chapters-v4-10/camp/${key}.webp`,width:specs[key].width,height:specs[key].height,motion,duration:4400};}
const dialogue={
 camplantern:{name:{en:'Camping lantern',yue:'露營燈',cmn:'露营灯'},emoji:'🏮',intro:{en:"I'm a camping lantern. Tap me and watch my warm light glow.",yue:'我係露營燈。點一點，睇吓我暖暖嘅燈光。',cmn:'我是露营灯。点一点，看看我暖暖的灯光。'}},
 campmap:{name:{en:'Trail map',yue:'行山地圖',cmn:'徒步地图'},emoji:'🗺️',intro:{en:"I'm a trail map. Follow my little path past the trees and the stream.",yue:'我係行山地圖。沿住小路行，經過樹木同小溪。',cmn:'我是徒步地图。沿着小路走，经过树木和小溪。'}},
 campbinoculars:{name:{en:'Binoculars',yue:'望遠鏡',cmn:'望远镜'},emoji:'🔭',intro:{en:"I'm a pair of binoculars. Look through me to see the faraway mountains.",yue:'我係望遠鏡。望入嚟，遠處嘅山都睇得清。',cmn:'我是望远镜。看进来，远处的山也能看清。'}}
};for(const d of Object.values(dialogue))d.kind='discovery';
fs.writeFileSync(`${dir}/camp/camp.json`,JSON.stringify({scene:camp,objects,dialogue},null,2));fs.writeFileSync(`${dir}/camp/dialogue.json`,JSON.stringify(dialogue,null,2));
const beach=structuredClone(state.window.GAME_SCENES.beach);beach.bgStrip='assets/chapters-v4-10/beach/background.webp';beach.animals=beach.animals.filter(a=>a.id!=='beachwave');
for(const a of beach.animals){a.h*=.84;a.feetY-=a.id==='beachcrab'?.08:.03;}
fs.writeFileSync(`${dir}/beach/beach.json`,JSON.stringify({scene:beach},null,2));
fs.writeFileSync(`${dir}/camp/generation.json`,JSON.stringify({tool:'built-in image_gen',assets:assets.filter(a=>a[0]==='camp'),packaging:'genuine alpha; trim + 12px transparent margin; lossless WebP'},null,2));
fs.writeFileSync(`${dir}/beach/generation.json`,JSON.stringify({tool:'built-in image_gen',reference:'assets/chapters-v4-9/beach/background.webp',assets:assets.filter(a=>a[0]==='beach'),packaging:'lossless WebP; landscape preserved with painted beach visitors'},null,2));
console.log(Object.fromEntries(Object.entries(specs).map(([k,s])=>[k,[s.width,s.height,s.hasAlpha]])));
