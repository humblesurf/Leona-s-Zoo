/* Package complete painted poses. Every cell uses the SAME crop rectangle.
   No per-pose centering, foot alignment, warping or limb reconstruction. */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import crypto from 'node:crypto';
import {createRequire} from 'node:module';
const require=createRequire('C:/Users/XTIA/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/package.json');
const sharp=require('sharp'),root=process.cwd(),out=path.join(root,'geo/assets/animation/v4-7');
const state={window:{}};
vm.runInNewContext(fs.readFileSync(path.join(root,'geo/assets/animation-data.js'),'utf8'),state);
const baseline=state.window.ANIMAL_ANIMATIONS;
const styles={
 cheetah:{label:'收拢、伸展，交错落脚的短跑',motion:'run',holds:[55,60,50,80,55,60,50,80],travel:.62},
 tiger:{label:'压肩承重、蹬地向前短跑',motion:'run',holds:[80,85,65,95,80,85,65,95],travel:.52},
 jaguar:{label:'低身推进、有力的短促跑动',motion:'run',holds:[85,85,75,95,85,85,75,95],travel:.46},
 lioness:{label:'从容迈步，前后脚依次落地',motion:'walk',holds:[125,100,135,105,125,100,135,105],travel:.38},
 lioncub:{label:'轻快地小跑几步',motion:'trot',holds:[95,75,110,75,95,75,110,75],travel:.46},
 zebra:{label:'对角换脚，轻快抬蹄小跑',motion:'trot',holds:[110,85,115,85,110,85,115,85],travel:.44},
 warthog:{label:'竖起尾巴，短腿快步向前',motion:'walk',holds:[95,70,100,70,95,70,100,70],travel:.40},
 buffalo:{label:'踏实承重，四拍稳步前行',motion:'walk',holds:[160,125,170,125,160,125,170,125],travel:.28},
 rhino:{label:'沉稳抬脚、落脚向前走',motion:'walk',holds:[165,130,175,130,165,130,175,130],travel:.26},
 elephant:{label:'四脚依次推进，缓步前行',motion:'walk',holds:[180,135,185,135,180,135,185,135],travel:.27},
 elephantcalf:{label:'小象轻快迈步，鼻子随步伐摆动',motion:'walk',holds:[145,110,150,110,145,110,150,110],travel:.32},
 polarbear:{label:'熊掌承重，稳稳向前走',motion:'walk',holds:[155,120,165,120,155,120,165,120],travel:.30},
 arcticfox:{label:'交替抬爪，轻快向前小跑',motion:'trot',holds:[95,75,105,75,95,75,105,75],travel:.44},
 cow:{label:'四拍迈步，平稳前行',motion:'walk',holds:[145,110,155,110,145,110,155,110],travel:.30},
 sheep:{label:'轻轻迈步，四脚轮流承重',motion:'walk',holds:[125,95,135,95,125,95,135,95],travel:.32},
 pig:{label:'短步小跑，鼻子探向前方',motion:'trot',holds:[105,80,110,80,105,80,110,80],travel:.38},
 calf:{label:'小牛轻快抬蹄、交替小跑',motion:'trot',holds:[105,80,110,80,105,80,110,80],travel:.40},
 lamb:{label:'小羊轻快向前小跑',motion:'trot',holds:[100,75,110,75,100,75,110,75],travel:.40},
 piglet:{label:'猪宝宝短步轻快小跑',motion:'trot',holds:[95,70,105,70,95,70,105,70],travel:.40}
};
function wholeComponents(data,width,height,expected){
 const labels=new Int32Array(width*height),queue=new Int32Array(width*height),groups=[];let label=0;
 for(let start=0;start<labels.length;start++){
  if(labels[start]||data[start*4+3]<=64)continue;
  const group={label:++label,count:0,left:width,top:height,right:0,bottom:0,sumX:0,sumY:0};let head=0,tail=1;queue[0]=start;labels[start]=label;
  while(head<tail){const k=queue[head++],x=k%width,y=Math.floor(k/width);group.count++;group.sumX+=x;group.sumY+=y;group.left=Math.min(group.left,x);group.top=Math.min(group.top,y);group.right=Math.max(group.right,x+1);group.bottom=Math.max(group.bottom,y+1);
   for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){if(!dx&&!dy)continue;const nx=x+dx,ny=y+dy;if(nx<0||ny<0||nx>=width||ny>=height)continue;const n=ny*width+nx;if(!labels[n]&&data[n*4+3]>64){labels[n]=label;queue[tail++]=n;}}
  }
  groups.push(group);
 }
 groups.sort((a,b)=>b.count-a.count);const main=groups.filter(g=>g.count>groups[0].count*.15);
 if(main.length!==expected)throw Error('Expected '+expected+' isolated complete characters, found '+main.length);
 main.sort((a,b)=>a.sumY/a.count-b.sumY/b.count);
 return {labels,main};
}
fs.mkdirSync(out,{recursive:true});
const overrides={},records=[],rejected=new Set();
const chosen=process.argv.slice(2).filter(a=>!a.startsWith('--'));
for(const [id,style] of Object.entries(styles)){
 if(chosen.length&&!chosen.includes(id))continue;
 let source=path.join(out,'source',id+'-source.png');
 const configPath=path.join(out,'source',id+'-pack.json');
 if(!fs.existsSync(configPath)){console.log('Awaiting reviewed layout: '+id);continue;}
 const config=JSON.parse(fs.readFileSync(configPath,'utf8'));
 if(config.readyForPackaging===false||config.approved===false){rejected.add(id);console.log('Awaiting pose repair: '+id);continue;}
 const motion=config.motion||style.motion;
 if(!['walk','trot','run'].includes(motion))throw Error(id+': invalid authored motion');
 let columns=config.columns||2,rows=config.rows||4;
 if(config.poseFiles){
  // Independently painted drawings keep their complete input camera frame.
  // Normalize canvas resolution, never the animal's individual bounding box.
  const width=config.canvasWidth||704,height=config.canvasHeight||502,inputs=[];
  columns=2;rows=Math.ceil(config.poseFiles.length/2);
  for(let i=0;i<config.poseFiles.length;i++){
   const file=path.resolve(root,config.poseFiles[i]);if(!fs.existsSync(file))throw Error(id+': missing painted pose '+file);
   const pose=await sharp(file).ensureAlpha().resize(width,height,{fit:'contain',position:'centre',background:{r:0,g:0,b:0,alpha:0}}).png().toBuffer();
   inputs.push({input:pose,left:i%2*width,top:Math.floor(i/2)*height});
  }
  source=path.join(out,'source',id+'-painted-poses.png');
  await sharp({create:{width:width*columns,height:height*rows,channels:4,background:{r:0,g:0,b:0,alpha:0}}}).composite(inputs).png().toFile(source);
  config.cellWidth=width;config.cellHeight=height;
  delete config.rowOrigins;delete config.columnOrigins;delete config.geometry;delete config.componentExtraction;
 }
 if(!fs.existsSync(source))continue;
 const {data,info}=await sharp(source).ensureAlpha().raw().toBuffer({resolveWithObject:true});
 const alphaFraction=Array.from({length:info.width*info.height},(_,i)=>data[i*4+3]<16?1:0).reduce((a,b)=>a+b,0)/(info.width*info.height);
 if(alphaFraction<.12)throw Error(id+': source does not have a transparent background');
 const cw=config.cellWidth||config.cellSize?.w||Math.floor(info.width/columns),ch=config.cellHeight||config.cellSize?.h||config.geometry?.cellHeight||Math.floor(info.height/rows),cells=[];
 let isolated=null;
 if(config.componentExtraction){isolated=wholeComponents(data,info.width,info.height,columns*rows);for(let row=0;row<rows;row++)isolated.main.splice(row*columns,columns,...isolated.main.slice(row*columns,(row+1)*columns).sort((a,b)=>a.sumX/a.count-b.sumX/b.count));}
 const edgePad=isolated?64:0,cellW=cw+edgePad*2,cellH=ch+edgePad*2;
 let union={left:cellW,top:cellH,right:0,bottom:0};
 for(let i=0;i<columns*rows;i++){
  const col=i%columns,row=Math.floor(i/columns);
  // Optional atlas-layout calibration moves a whole row/column origin.
  // It does not re-anchor individual silhouettes or flatten airborne poses.
  const x=Math.round(config.columnOrigins?.[col]??col*(config.geometry?.columnStride||info.width/columns));
  const y=Math.round(config.rowOrigins?.[row]??(config.geometry?.rowOriginY||0)+row*(config.geometry?.rowStride||info.height/rows));
  if(x<0||y<0||x+cw>info.width||y+ch>info.height)throw Error(id+': source cell outside image '+i);
  const raw=Buffer.alloc(cellW*cellH*4),bounds={left:cellW,top:cellH,right:0,bottom:0};let count=0,clipped=0;
  const group=isolated?.main[i];
  for(let cy=0;cy<cellH;cy++)for(let cx=0;cx<cellW;cx++){
   const sx=x+cx-edgePad,sy=y+cy-edgePad,j=(cy*cellW+cx)*4;if(sx<0||sy<0||sx>=info.width||sy>=info.height)continue;
   const pixel=sy*info.width+sx,offset=pixel*4;
   let owned=!isolated;
   if(isolated){owned=isolated.labels[pixel]===group.label;if(!owned&&data[offset+3]>=16)for(let dy=-2;dy<=2&&!owned;dy++)for(let dx=-2;dx<=2&&!owned;dx++){const nx=sx+dx,ny=sy+dy;if(nx>=0&&ny>=0&&nx<info.width&&ny<info.height&&isolated.labels[ny*info.width+nx]===group.label)owned=true;}}
   if(!owned)continue;data.copy(raw,j,offset,offset+4);
   if(raw[j+3]<16)raw[j+3]=0;
   if(raw[j+3]>96){count++;bounds.left=Math.min(bounds.left,cx);bounds.right=Math.max(bounds.right,cx+1);bounds.top=Math.min(bounds.top,cy);bounds.bottom=Math.max(bounds.bottom,cy+1);if(cx<2||cy<2||cx>=cellW-2||cy>=cellH-2)clipped++;if(isolated&&(sx<2||sy<2||sx>=info.width-2||sy>=info.height-2))throw Error(id+': complete pose clipped by original image edge');}
  }
  if(count<cw*ch*.035)throw Error(id+': empty or misplaced pose '+i);
  if(clipped>12&&!config.allowCellEdge)throw Error(id+': painted animal touches cell edge in pose '+i+' ('+clipped+' pixels)');
  union.left=Math.min(union.left,bounds.left);union.top=Math.min(union.top,bounds.top);union.right=Math.max(union.right,bounds.right);union.bottom=Math.max(union.bottom,bounds.bottom);
  cells.push({raw,bounds,count,clipped});
 }
 const margin=8;
 const crop=config.crop||{left:Math.max(0,union.left-margin),top:Math.max(0,union.top-margin),width:Math.min(cellW,union.right+margin)-Math.max(0,union.left-margin),height:Math.min(cellH,union.bottom+margin)-Math.max(0,union.top-margin)};
 const width=crop.width,height=crop.height,packed=[],frames=[],hashes=[];
 for(let i=0;i<cells.length;i++){
  const pose=await sharp(cells[i].raw,{raw:{width:cellW,height:cellH,channels:4}}).extract(crop).png().toBuffer();
  const col=i%4,row=Math.floor(i/4);packed.push({input:pose,left:col*width,top:row*height});
  frames.push({x:col*width,y:row*height,w:width,h:height,dx:0,dy:0});hashes.push(crypto.createHash('sha256').update(pose).digest('hex'));
  if(i===0)await sharp(pose).webp({lossless:true,effort:5}).toFile(path.join(out,id+'-poster.webp'));
 }
 await sharp({create:{width:width*4,height:height*Math.ceil(cells.length/4),channels:4,background:{r:0,g:0,b:0,alpha:0}}}).composite(packed).webp({lossless:true,effort:5}).toFile(path.join(out,id+'-frames.webp'));
 const cycle=config.cycle||Array.from({length:cells.length},(_,i)=>i);
 const cycleHolds=config.holdsMs||cycle.map((_,i)=>{
  if(cycle.length===4)return style.holds[i*2]+style.holds[i*2+1];
  return style.holds[i%style.holds.length];
 });
 if(cycleHolds.length!==cycle.length||cycle.some(i=>i>=cells.length))throw Error(id+': invalid cycle');
 const sequence=[0],holdsMs=[motion==='run'?160:220],advance=[0],stages=['prepare'];
 const repeats=config.repeats||2,totalSteps=cycle.length*repeats;
 // Each exposure has one corresponding world position. The complete body
 // drawing and its advance change together, rather than sliding a held paw.
 for(let pass=0;pass<repeats;pass++)for(let i=0;i<cycle.length;i++){
  sequence.push(cycle[i]);holdsMs.push(cycleHolds[i]);
  advance.push((pass*cycle.length+i)/totalSteps);stages.push('move');
 }
 sequence.push(0);holdsMs.push(motion==='run'?260:320);advance.push(1);stages.push('settle');
 const definition={...baseline[id],rig:false,walk:false,hop:0,loop:false,poster:`assets/animation/v4-7/${id}-poster.webp`,sheet:`assets/animation/v4-7/${id}-frames.webp`,viewport:{w:width,h:height},frames,face:-1,travel:config.travel??style.travel,label:config.label||style.label,cel:{sequence,holdsMs,advance,motion,restFrame:0,stages},duration:holdsMs.reduce((a,b)=>a+b,0)};
 overrides[id]=definition;
 records.push({id,source:path.relative(root,source).replaceAll('\\','/'),sourceDimensions:[info.width,info.height],sourceGrid:[columns,rows],sourceCell:[cw,ch],componentIsolation:!!isolated,componentBounds:isolated?.main.map(c=>({left:c.left,top:c.top,right:c.right,bottom:c.bottom}))||null,rowOrigins:config.rowOrigins||null,columnOrigins:config.columnOrigins||null,geometry:config.geometry||null,sharedCellCrop:crop,registration:'same crop for every pose; optional whole-row/column layout calibration and alpha isolation; no per-pose centering, resizing, bottom alignment or interpolation',poses:cells.length,distinct: new Set(hashes).size,viewport:[width,height],motion,duration:definition.duration,cycle,cycleHolds,exposures:sequence.length,alphaFraction,bounds:cells.map(c=>c.bounds),clipped:cells.map(c=>c.clipped)});
}
const previous=path.join(out,'packaging.json');
let allRecords=fs.existsSync(previous)?JSON.parse(fs.readFileSync(previous,'utf8')).characters:[];
allRecords=allRecords.filter(r=>!rejected.has(r.id)&&!records.some(n=>n.id===r.id)).concat(records);
let allDefs={};
const defsFile=path.join(root,'geo/assets/authored-motion-data.js');
if(fs.existsSync(defsFile)){const existing={window:{ANIMAL_ANIMATIONS:{}}};vm.runInNewContext(fs.readFileSync(defsFile,'utf8'),existing);allDefs=existing.window.ANIMAL_ANIMATIONS;}
for(const id of rejected)delete allDefs[id];
Object.assign(allDefs,overrides);
fs.writeFileSync(defsFile,'/* V4.7: complete painted poses and species-specific exposure timing. */\nObject.assign(window.ANIMAL_ANIMATIONS, '+JSON.stringify(allDefs)+');\n');
fs.writeFileSync(previous,JSON.stringify({base:'V4.6.1; V5 excluded',tool:'built-in image_gen; complete drawings',characters:allRecords},null,2));
console.log(JSON.stringify({packaged:records.map(r=>({id:r.id,poses:r.poses,viewport:r.viewport,duration:r.duration})),ready:Object.keys(allDefs).length,total:Object.keys(styles).length},null,2));
