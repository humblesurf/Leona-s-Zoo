import fs from'node:fs';import vm from'node:vm';import{createRequire}from'node:module';
const require=createRequire('C:/Users/XTIA/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/package.json'),sharp=require('sharp'),dir='geo/assets/chapters-v4-10/hongkong';
fs.copyFileSync('C:/Users/XTIA/.codex/generated_images/01a11ba2-8836-79e1-9351-6470352dff61/exec-09354e08-91c7-45bf-9a11-3a7aa12f6101.png',dir+'/source/hongkong-harbour.png');
const left=dir+'/source/hongkong-harbour.png',right=dir+'/source/hongkong-street.png',l=await sharp(left).metadata(),r=await sharp(right).metadata(),overlap=210,offset=l.width-overlap,width=offset+r.width,height=l.height;
const raw=await sharp(right).ensureAlpha().raw().toBuffer();for(let y=0;y<height;y++)for(let x=0;x<overlap;x++){const t=x/overlap,a=t*t*(3-2*t);raw[(y*r.width+x)*4+3]=Math.round(a*255);}
await sharp({create:{width,height,channels:4,background:'#00000000'}}).composite([{input:left,left:0,top:0},{input:raw,raw:{width:r.width,height,channels:4},left:offset,top:0}]).webp({lossless:true}).toFile(dir+'/background.webp');
const state={window:{}};for(const f of ['game-data','animation-data','authored-motion-data','exploration-data','chapters-data'])vm.runInNewContext(fs.readFileSync(`geo/assets/${f}.js`,'utf8'),state);
const objects={},animals=[];
function embedded(id,box,config={}){const bounds=[(offset+box[0]*r.width)/width,box[1],box[2]*r.width/width,box[3]];animals.push({id,u:bounds[0]+bounds[2]/2,h:bounds[3],feetY:bounds[1]+bounds[3],embedded:true,embeddedBounds:bounds,hitWidthRatio:bounds[2]*width/(bounds[3]*height),flip:false,idle:'none',kind:'discovery',instance:`${id}-embedded-v4-10`});objects[id]={...state.window.CHAPTER_OBJECTS[id],width:Math.round(bounds[2]*width),height:Math.round(bounds[3]*height),embedded:true,...config};}
animals.push({id:'hkferry',u:.17,h:.18,feetY:.80,flip:false,idle:'none',kind:'discovery',instance:'hkferry-v4-10'});
embedded('hkclock',[.202,.275,.030,.294],{clockCenter:[.50,.51]});
embedded('hkboc',[.549,.027,.039,.395],{windows:[[.18,.34,.16,.018],[.48,.40,.15,.018],[.20,.48,.16,.018],[.53,.58,.14,.018],[.28,.72,.13,.018],[.62,.78,.14,.018]]});
animals.push({id:'hktram',u:.767,h:.255,feetY:.878,flip:false,idle:'none',kind:'discovery',instance:'hktram-v4-10'});
animals.push({id:'hkbus',u:.884,h:.217,feetY:.955,flip:false,idle:'none',kind:'discovery',instance:'hkbus-v4-10'});
embedded('hkdim',[.866,.459,.129,.278],{steamAnchors:[{x:.56,y:.71},{x:.76,y:.71},{x:.91,y:.72}]});
objects.hktram={...state.window.CHAPTER_OBJECTS.hktram,wireRange:[.68,1],travelRange:[.705,.97]};objects.hkbus={...state.window.CHAPTER_OBJECTS.hkbus,travelRange:[.705,.97]};objects.hkferry={...state.window.CHAPTER_OBJECTS.hkferry,travelRange:[.025,.645]};
const scene={id:'hongkong',label:'香港',numScreens:6,panorama:true,bgStrip:'assets/chapters-v4-10/hongkong/background.webp',bgAspect:width/height,bgMirror:false,ambience:'assets/audio/v4-9/hongkong.mp3',animals};
fs.writeFileSync(dir+'/hongkong.json',JSON.stringify({scene,objects},null,2));fs.writeFileSync(dir+'/generation.json',JSON.stringify({tool:'built-in image_gen',sources:[left,right],sourceDimensions:[l.width,l.height],panoramaDimensions:[width,height],overlapPixels:overlap,registration:'matching waterfront horizon, eased alpha overlap; one continuous panorama without mirrored landmarks',landmarksEmbedded:['hkclock','hkboc','hkdim']},null,2));console.log({width,height,aspect:width/height,objects:Object.keys(objects)});
