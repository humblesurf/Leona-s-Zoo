/* Whole painted character sheets, one camera crop per species. */
import fs from 'node:fs';
import vm from 'node:vm';
import crypto from 'node:crypto';
import {createRequire} from 'node:module';
const require=createRequire('C:/Users/XTIA/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/package.json'),sharp=require('sharp');
const dir='geo/assets/animation/v4-11-style';
const state={window:{}};
for(const file of ['animation-data.js','authored-motion-data.js','animal-fixes-v4-10.js'])vm.runInNewContext(fs.readFileSync('geo/assets/'+file,'utf8'),state);
const input=JSON.parse(fs.readFileSync(dir+'/source/selected.json','utf8'));
if(fs.existsSync(dir+'/source/selected-new.json'))Object.assign(input.characters,JSON.parse(fs.readFileSync(dir+'/source/selected-new.json','utf8')).characters);
function components(data,w,h,expected){
 const labels=new Int32Array(w*h),queue=new Int32Array(w*h),groups=[];let number=0;
 for(let start=0;start<labels.length;start++){
  if(labels[start]||data[start*4+3]<=64)continue;
  const c={label:++number,count:0,x:0,y:0,left:w,top:h,right:0,bottom:0};let head=0,tail=1;queue[0]=start;labels[start]=number;
  while(head<tail){const k=queue[head++],x=k%w,y=Math.floor(k/w);c.count++;c.x+=x;c.y+=y;c.left=Math.min(c.left,x);c.top=Math.min(c.top,y);c.right=Math.max(c.right,x+1);c.bottom=Math.max(c.bottom,y+1);
   for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const xx=x+dx,yy=y+dy;if(xx<0||yy<0||xx>=w||yy>=h)continue;const j=yy*w+xx;if(!labels[j]&&data[j*4+3]>64){labels[j]=number;queue[tail++]=j;}}
  }groups.push(c);
 }
 groups.sort((a,b)=>b.count-a.count);const main=groups.filter(c=>c.count>groups[0].count*.15);
 if(main.length!==expected)throw Error(`Expected ${expected} complete silhouettes, found ${main.length}`);
 main.sort((a,b)=>a.y/a.count-b.y/b.count);return {labels,main};
}
const defs={},records=[];
for(const [id,spec] of Object.entries(input.characters)){
 const file=`${dir}/source/${id}.png`,{data,info}=await sharp(file).ensureAlpha().raw().toBuffer({resolveWithObject:true});
 const count=spec.columns*spec.rows,group=components(data,info.width,info.height,count);
 for(let row=0;row<spec.rows;row++)group.main.splice(row*spec.columns,spec.columns,...group.main.slice(row*spec.columns,(row+1)*spec.columns).sort((a,b)=>a.x/a.count-b.x/b.count));
 let transparent=0;for(let i=3;i<data.length;i+=4)if(data[i]<16)transparent++;
 const alphaFraction=transparent/(info.width*info.height);if(alphaFraction<.20)throw Error(id+' must have true transparent margins');
 const pad=96,cw=Math.floor(info.width/spec.columns)+pad*2,ch=(spec.cellHeight||Math.floor(info.height/spec.rows))+pad*2;
 const cells=[];let union={left:cw,top:ch,right:0,bottom:0};
 for(let i=0;i<count;i++){
  const c=group.main[i],sx=Math.round(i%spec.columns*info.width/spec.columns),sy=Math.round(spec.rowOrigins?.[Math.floor(i/spec.columns)]??Math.floor(i/spec.columns)*info.height/spec.rows),raw=Buffer.alloc(cw*ch*4);let pixels=0,clipped=0;
  const bounds={left:cw,top:ch,right:0,bottom:0};
  for(let y=0;y<ch;y++)for(let x=0;x<cw;x++){
   const xx=sx+x-pad,yy=sy+y-pad;if(xx<0||yy<0||xx>=info.width||yy>=info.height)continue;
   const p=yy*info.width+xx;let owned=group.labels[p]===c.label;
   if(!owned&&data[p*4+3]>16)for(let dy=-3;dy<=3&&!owned;dy++)for(let dx=-3;dx<=3&&!owned;dx++){const a=xx+dx,b=yy+dy;if(a>=0&&b>=0&&a<info.width&&b<info.height&&group.labels[b*info.width+a]===c.label)owned=true;}
   if(!owned)continue;data.copy(raw,(y*cw+x)*4,p*4,p*4+4);
   if(raw[(y*cw+x)*4+3]>64){pixels++;bounds.left=Math.min(bounds.left,x);bounds.top=Math.min(bounds.top,y);bounds.right=Math.max(bounds.right,x+1);bounds.bottom=Math.max(bounds.bottom,y+1);if(x<2||y<2||x>=cw-2||y>=ch-2)clipped++;if(xx<2||yy<2||xx>=info.width-2||yy>=info.height-2)throw Error(id+' silhouette clipped at source edge');}
  }
  if(pixels<c.count*.98)throw Error(id+' lost complete silhouette '+i);
  if(clipped)throw Error(id+' common camera cell clips pose '+i);
  union.left=Math.min(union.left,bounds.left);union.top=Math.min(union.top,bounds.top);union.right=Math.max(union.right,bounds.right);union.bottom=Math.max(union.bottom,bounds.bottom);cells.push({raw,bounds,pixels});
 }
 const margin=14,crop={left:Math.max(0,union.left-margin),top:Math.max(0,union.top-margin),width:Math.min(cw,union.right+margin)-Math.max(0,union.left-margin),height:Math.min(ch,union.bottom+margin)-Math.max(0,union.top-margin)};
 const inputs=[],frames=[],hashes=[];
 for(let i=0;i<count;i++){
  const pose=await sharp(cells[i].raw,{raw:{width:cw,height:ch,channels:4}}).extract(crop).png().toBuffer();
  await sharp(pose).webp({lossless:true}).toFile(`${dir}/review/${id}-${i}.webp`);
  const x=i%4*crop.width,y=Math.floor(i/4)*crop.height;inputs.push({input:pose,left:x,top:y});frames.push({x,y,w:crop.width,h:crop.height,dx:0,dy:0});hashes.push(crypto.createHash('sha256').update(pose).digest('hex'));
  if(i===0)await sharp(pose).webp({lossless:true}).toFile(`${dir}/${id}-poster.webp`);
 }
 await sharp({create:{width:crop.width*4,height:crop.height*Math.ceil(count/4),channels:4,background:'#00000000'}}).composite(inputs).webp({lossless:true}).toFile(`${dir}/${id}-frames.webp`);
 const base=state.window.ANIMAL_ANIMATIONS[id]||spec.base;
 if(!base?.cel)throw Error(id+' must provide a complete exposure plan');
 defs[id]={...base,poster:`assets/animation/v4-11-style/${id}-poster.webp`,sheet:`assets/animation/v4-11-style/${id}-frames.webp`,viewport:{w:crop.width,h:crop.height},frames};
 if(spec.label)defs[id].label=spec.label;
 records.push({id,poses:count,alphaFraction,crop,sourceDimensions:[info.width,info.height],sourceGrid:[spec.columns,spec.rows],rowOrigins:spec.rowOrigins||null,cellHeight:spec.cellHeight||null,distinct:new Set(hashes).size,bounds:cells.map(c=>c.bounds),wholeSilhouettes:group.main.map(c=>[c.left,c.top,c.right,c.bottom]),originalExposurePlan:base.cel,sourceSHA256:crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex'),registration:'shared source camera crop; complete-silhouette alpha isolation; no per-pose re-scaling, limb reconstruction, mesh, or morphing'});
}
await sharp(dir+'/source/crocodile-eyes.png').trim({threshold:4}).extend({top:14,right:14,bottom:14,left:14,background:'#00000000'}).webp({lossless:true}).toFile(dir+'/crocodile-eyes.webp');
fs.writeFileSync('geo/assets/animal-styles-v4-11.js',`/* V4.11: illustrated complete original drawings. Species exposure timing and locomotion preserved. */\n(function(g){Object.assign(g.ANIMAL_ANIMATIONS,${JSON.stringify(defs)});g.ANIMAL_STYLES_V4_11={version:'4.11',characters:${JSON.stringify(Object.keys(defs))},decoration:{crocodileEyes:'assets/animation/v4-11-style/crocodile-eyes.webp'}};})(window);\n`);
fs.writeFileSync(dir+'/packaging.json',JSON.stringify({version:'4.11',mode:'built-in image_gen',records},null,2));
console.log(records.map(r=>({id:r.id,poses:r.poses,distinct:r.distinct,viewport:defs[r.id].viewport})));
