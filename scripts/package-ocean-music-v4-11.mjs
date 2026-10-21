import fs from 'node:fs/promises';
import path from 'node:path';
import {createRequire} from 'node:module';
const require=createRequire('C:/Users/XTIA/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/package.json');
const sharp=require('sharp');
const ROOT=path.resolve('.'), OUT=path.join(ROOT,'geo/assets/chapters-v4-11');
const source=JSON.parse(await fs.readFile(path.join(OUT,'ocean-music-generation.json'),'utf8'));
const summary={};
for(const id of ['nest','flower'])if(source.images[id]){
 const dir=path.join(OUT,'ocean'),src=path.join(dir,'source',id+'.png');await fs.mkdir(path.dirname(src),{recursive:true});await fs.copyFile(source.images[id],src);
 const meta=await sharp(src).metadata();if(!meta.hasAlpha)throw new Error('No genuine decoration alpha '+id);
 await sharp(src).webp({lossless:true}).toFile(path.join(dir,id+'.webp'));
}
function keepMainDrawing(data,w,h){
 const seen=new Uint8Array(w*h),queue=new Int32Array(w*h);let largest=[];
 for(let n=0;n<w*h;n++){
  if(seen[n]||data[n*4+3]<=8)continue;let read=0,end=0;queue[end++]=n;seen[n]=1;
  while(read<end){const p=queue[read++],x=p%w,y=Math.floor(p/w);for(const q of [x>0?p-1:-1,x<w-1?p+1:-1,y>0?p-w:-1,y<h-1?p+w:-1])if(q>=0&&!seen[q]&&data[q*4+3]>8){seen[q]=1;queue[end++]=q;}}
  if(end>largest.length)largest=Array.from(queue.subarray(0,end));
 }
 const kept=new Uint8Array(w*h);for(const p of largest){const x=p%w,y=Math.floor(p/w);for(let yy=Math.max(0,y-1);yy<=Math.min(h-1,y+1);yy++)for(let xx=Math.max(0,x-1);xx<=Math.min(w-1,x+1);xx++)kept[yy*w+xx]=1;}
 for(let p=0;p<w*h;p++)if(!kept[p])data[p*4+3]=0;
}
for(const id of ['octopus','stingray','lobster']){
 const dir=path.join(OUT,'ocean'),src=path.join(dir,'source',id+'.png');await fs.mkdir(path.dirname(src),{recursive:true});await fs.copyFile(source.images[id],src);
 const meta=await sharp(src).metadata(),cw=meta.width/2,ch=meta.height/2;
 if(!meta.hasAlpha||cw%1||ch%1)throw new Error(id+' must be transparent with integer 2x2 cells');
 // Retain genuine generated alpha and complete original drawings. No warped limbs.
 const selected=id==='octopus'?[0,1,3]:id==='lobster'?[0,1,2]:[0,1,2,3],number=selected.length,cells=[];let minX=cw,minY=ch,maxX=0,maxY=0,transparent=0;
 for(let i=0;i<number;i++){
  const sourceIndex=selected[i];const {data,info}=await sharp(src).extract({left:(sourceIndex%2)*cw,top:Math.floor(sourceIndex/2)*ch,width:cw,height:ch}).ensureAlpha().raw().toBuffer({resolveWithObject:true});
  // Reject disconnected pixels from a neighbouring grid cell at a boundary.
  keepMainDrawing(data,cw,ch);
  let x0=cw,y0=ch,x1=0,y1=0;for(let y=0;y<ch;y++)for(let x=0;x<cw;x++){const a=data[(y*cw+x)*4+3];if(a<=4)transparent++;if(a>8){x0=Math.min(x0,x);y0=Math.min(y0,y);x1=Math.max(x1,x);y1=Math.max(y1,y);}}
  minX=Math.min(minX,x0);minY=Math.min(minY,y0);maxX=Math.max(maxX,x1);maxY=Math.max(maxY,y1);cells.push({data,info});
 }
 if(transparent/(cw*ch*number)<.15)throw new Error('Opaque false background '+id);
 minX=Math.max(0,minX-10);minY=Math.max(0,minY-10);maxX=Math.min(cw-1,maxX+10);maxY=Math.min(ch-1,maxY+10);
 const width=maxX-minX+1,height=maxY-minY+1,images=[];
 for(let i=0;i<number;i++)images.push(await sharp(cells[i].data,{raw:cells[i].info}).extract({left:minX,top:minY,width,height}).png().toBuffer());
 const columns=2,rows=Math.ceil(number/2);await sharp({create:{width:width*columns,height:height*rows,channels:4,background:'#00000000'}}).composite(images.map((input,i)=>({input,left:i%columns*width,top:Math.floor(i/columns)*height}))).webp({lossless:true}).toFile(path.join(dir,id+'-frames.webp'));
 await sharp(images[0]).webp({lossless:true}).toFile(path.join(dir,id+'-poster.webp'));
 const def={poster:`assets/chapters-v4-11/ocean/${id}-poster.webp`,sheet:`assets/chapters-v4-11/ocean/${id}-frames.webp`,viewport:{w:width,h:height},frames:images.map((_,i)=>({x:i%2*width,y:Math.floor(i/2)*height,w:width,h:height,dx:0,dy:0})),face:id==='stingray'?-1:0,travel:0,loop:false,rig:false,walk:false,object:false,hop:0,fps:18};
 if(id==='octopus')Object.assign(def,{label:'轻轻抬腕、放松',cel:{sequence:[0,1,2,1,0],holdsMs:[450,650,450,420,500],advance:[0,0,0,0,0],restFrame:0,motion:'arm-wave'}});
 if(id==='stingray')Object.assign(def,{label:'斜侧面舒展双鳍',cel:{sequence:[0,1,2,3,2,1,0],holdsMs:[380,340,340,420,340,340,450],advance:[0,0,0,0,0,0,0],restFrame:0,motion:'fin-wave'}});
 if(id==='lobster')Object.assign(def,{label:'触须探路、轻举螯钳',cel:{sequence:[0,1,0,2,0],holdsMs:[450,620,420,300,450],advance:[0,0,0,0,0],restFrame:0,motion:'claw-wave'}});
 def.duration=def.cel.holdsMs.reduce((a,b)=>a+b,0);summary[id]={definition:def,sourceDimensions:[meta.width,meta.height],cells:number,sourceIndices:selected,transparentRatio:transparent/(cw*ch*number),commonCrop:[minX,minY,width,height],discardedFrames:id==='lobster'?[3]:id==='octopus'?[2]:[],privateReview:id==='octopus'?'Source frame 2 omitted: mantle crossed a grid boundary.':id==='lobster'?'Source frame 3 omitted: tail anatomy inconsistent.':'All four complete rays approved.'};
}
await fs.writeFile(path.join(OUT,'ocean','manifest.json'),JSON.stringify(summary,null,2));
await fs.writeFile(path.join(ROOT,'geo/assets/ocean-styles-v4-11.js'),`/* V4.11: complete transparent original poses; deliberately no mesh deformation. */\n(function(g){Object.assign(g.ANIMAL_ANIMATIONS,${JSON.stringify(Object.fromEntries(Object.entries(summary).map(([id,v])=>[id,v.definition])))});g.OCEAN_STYLES_V4_11={version:'4.11',ids:['octopus','stingray','lobster']};})(window);\n`);
const dir=path.join(OUT,'music');await fs.mkdir(path.join(dir,'source'),{recursive:true});await fs.copyFile(source.images.music,path.join(dir,'source/background.png'));await sharp(source.images.music).webp({quality:96,effort:6}).toFile(path.join(dir,'background.webp'));
const old=JSON.parse(await fs.readFile('geo/assets/chapters-v4-10/music/scene.json','utf8'));
const bounds={musicpiano:[.018,.263,.221,.460],musicdrum:[.307,.413,.099,.282],musicxylophone:[.454,.451,.134,.242],musicharp:[.628,.215,.091,.483],musictambourine:[.765,.306,.079,.219],musicmaracas:[.896,.319,.060,.192],musicguitar:[.912,.253,.086,.466]};
const strings={musicharp:{motion:'harp',emoji:'🎵',name:{en:'Harp',cmn:'竖琴',yue:'豎琴'},intro:{en:"I'm a harp. My long strings make gentle, sparkling notes. Listen to my little tune!",cmn:'我是竖琴，长长的琴弦弹出轻柔、明亮的声音。听听我的小曲吧！',yue:'我係豎琴，長長嘅琴弦彈出輕柔、明亮嘅聲音。聽吓我嘅小曲啦！'},stringLines:[[.23,.084,.305,.894],[.343,.119,.412,.80],[.478,.198,.544,.665],[.608,.273,.676,.525],[.74,.334,.788,.41]],strumPoint:[.43,.43]},musicguitar:{motion:'guitar',emoji:'🎸',name:{en:'Guitar',cmn:'吉他',yue:'結他'},intro:{en:"I'm a guitar. I have six strings. A little strum makes them ring together!",cmn:'我是吉他，我有六根琴弦。轻轻拨一下，就能听到好听的声音！',yue:'我係結他，我有六條琴弦。輕輕撥一下，就聽到好聽嘅聲音！'},stringLines:[[.65,.176,.335,.773],[.668,.176,.353,.773],[.686,.176,.371,.773],[.704,.176,.389,.773],[.722,.176,.407,.773],[.74,.176,.425,.773]],strumPoint:[.51,.606]}};
old.scene.bgStrip='assets/chapters-v4-11/music/background.webp';old.scene.label='音乐房';old.scene.animals=[];old.embeddedBounds=bounds;
const m=await sharp(source.images.music).metadata();
for(const[id,box]of Object.entries(bounds)){
 const[x,y,w,h]=box;old.scene.animals.push({id,u:x+w/2,feetY:y+h,h,hitWidthRatio:w*3/h,embedded:true,embeddedBounds:box,flip:false,idle:'none',kind:'discovery',instance:id+'-embedded-v4-11'});
 if(strings[id]){
  const crop={left:Math.round(x*m.width),top:Math.round(y*m.height),width:Math.round(w*m.width),height:Math.round(h*m.height)};
  await sharp(source.images.music).extract(crop).webp({quality:96}).toFile(path.join(dir,id+'.webp'));
  old.objects[id]={poster:`assets/chapters-v4-11/music/${id}.webp`,width:crop.width,height:crop.height,posterAspect:crop.width/crop.height,motion:strings[id].motion,duration:3800,embedded:true,stringLines:strings[id].stringLines,strumPoint:strings[id].strumPoint};
  old.dialogue[id]={name:strings[id].name,emoji:strings[id].emoji,intro:strings[id].intro,kind:'discovery'};
  if(id==='musicguitar')old.scene.animals.at(-1).hitPolygon=[[.58,0],[1,0],[1,.98],[0,1],[0,.46],[.45,.40]];
 }
}
await fs.writeFile(path.join(dir,'scene.json'),JSON.stringify(old,null,2));await fs.writeFile(path.join(dir,'dialogue.json'),JSON.stringify(Object.fromEntries(Object.keys(strings).map(id=>[id,old.dialogue[id]])),null,2));
await fs.writeFile(path.join(dir,'prompts.json'),JSON.stringify({mode:'built-in imagegen',prompt:source.prompts.music,reference:'assets/chapters-v4-10/music/background.webp'},null,2));
await fs.writeFile(path.join(OUT,'ocean','prompts.json'),JSON.stringify({mode:'built-in imagegen',prompts:Object.fromEntries(['octopus','stingray','lobster'].map(id=>[id,source.prompts[id]]))},null,2));
console.log(JSON.stringify({ocean:Object.fromEntries(Object.entries(summary).map(([k,v])=>[k,{cells:v.cells,viewport:v.definition.viewport,transparency:v.transparentRatio}])),music:old.scene.animals.map(a=>a.id)},null,2));
