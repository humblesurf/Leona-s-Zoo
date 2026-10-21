import fs from 'node:fs';import{createRequire}from'node:module';
const require=createRequire('C:/Users/XTIA/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/package.json'),sharp=require('sharp');
const dir='geo/assets/animation/v4-11-motion';
const specs={lion:{cols:3,rows:2,sequence:[0,1,2,3,2,1,0],holds:[320,180,220,1050,220,220,390],label:'抬头、张嘴轻吼、慢慢合嘴',motion:'roar'},polarbear:{cols:3,rows:2,sequence:[0,1,2,3,2,4,1,0],holds:[380,340,300,1100,300,300,340,500],label:'坐稳、站起看一看、慢慢回到四足',motion:'stand'}};
function components(data,w,h){const labels=new Int32Array(w*h),q=new Int32Array(w*h),all=[];let number=0;for(let k=0;k<labels.length;k++){if(labels[k]||data[k*4+3]<96)continue;const c={label:++number,count:0,x:0,y:0,left:w,top:h,right:0,bottom:0};let head=0,tail=1;q[0]=k;labels[k]=number;while(head<tail){const a=q[head++],x=a%w,y=Math.floor(a/w);c.count++;c.x+=x;c.y+=y;c.left=Math.min(c.left,x);c.top=Math.min(c.top,y);c.right=Math.max(c.right,x+1);c.bottom=Math.max(c.bottom,y+1);for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const xx=x+dx,yy=y+dy;if(xx<0||yy<0||xx>=w||yy>=h)continue;const j=yy*w+xx;if(!labels[j]&&data[j*4+3]>=96){labels[j]=number;q[tail++]=j;}}}all.push(c);}all.sort((a,b)=>b.count-a.count);return{labels,main:all.filter(c=>c.count>all[0].count*.15)};}
const overrides={},records=[];
for(const[id,s]of Object.entries(specs)){
 const {data,info}=await sharp(`${dir}/source/${id}.png`).ensureAlpha().raw().toBuffer({resolveWithObject:true}),group=components(data,info.width,info.height),count=s.cols*s.rows;
 if(group.main.length!==count)throw Error(id+' expected six whole figures, got '+group.main.length);
 group.main.sort((a,b)=>a.y/a.count-b.y/b.count);for(let row=0;row<s.rows;row++)group.main.splice(row*s.cols,s.cols,...group.main.slice(row*s.cols,(row+1)*s.cols).sort((a,b)=>a.x/a.count-b.x/b.count));
 const pad=110,cw=Math.ceil(info.width/s.cols)+pad*2,ch=Math.ceil(info.height/s.rows)+pad*2,poses=[];let union={left:cw,top:ch,right:0,bottom:0};
 // Register every entire original against one common ground line. No anatomy
 // is reconstructed; transparent rows only compensate the artist's baseline.
 const grounds=group.main.map(c=>c.bottom-Math.round(Math.floor(group.main.indexOf(c)/3)*info.height/2));
 const base=Math.max(...grounds);
 for(let i=0;i<count;i++){
  const c=group.main[i],sx=Math.round(i%3*info.width/3),sy=Math.round(Math.floor(i/3)*info.height/2),groundShift=base-grounds[i],hindPawShift=id==='polarbear'?420-[420,327,331,289,310,418][i]:0,raw=Buffer.alloc(cw*ch*4);
  for(let y=0;y<ch;y++)for(let x=0;x<cw;x++){
   const xx=sx+x-pad-hindPawShift,yy=sy+y-pad-groundShift;if(xx<0||yy<0||xx>=info.width||yy>=info.height)continue;const pixel=yy*info.width+xx;let owned=group.labels[pixel]===c.label;
   if(!owned&&data[pixel*4+3]>16)for(let dy=-2;dy<=2&&!owned;dy++)for(let dx=-2;dx<=2&&!owned;dx++){const a=xx+dx,b=yy+dy;if(a>=0&&b>=0&&a<info.width&&b<info.height&&group.labels[b*info.width+a]===c.label)owned=true;}
   if(!owned)continue;data.copy(raw,(y*cw+x)*4,pixel*4,pixel*4+4);
   if(data[pixel*4+3]>64){union.left=Math.min(union.left,x);union.top=Math.min(union.top,y);union.right=Math.max(union.right,x+1);union.bottom=Math.max(union.bottom,y+1);}
  }
  poses.push(raw);
 }
 const margin=16,crop={left:Math.max(0,union.left-margin),top:Math.max(0,union.top-margin),width:Math.min(cw,union.right+margin)-Math.max(0,union.left-margin),height:Math.min(ch,union.bottom+margin)-Math.max(0,union.top-margin)},inputs=[],frames=[];
 for(let i=0;i<count;i++){const image=await sharp(poses[i],{raw:{width:cw,height:ch,channels:4}}).extract(crop).png().toBuffer();inputs.push({input:image,left:i%3*crop.width,top:Math.floor(i/3)*crop.height});frames.push({x:i%3*crop.width,y:Math.floor(i/3)*crop.height,w:crop.width,h:crop.height,dx:0,dy:0});if(i===0)await sharp(image).webp({lossless:true}).toFile(`${dir}/${id}-poster.webp`);}
 await sharp({create:{width:crop.width*3,height:crop.height*2,channels:4,background:'#00000000'}}).composite(inputs).webp({lossless:true}).toFile(`${dir}/${id}-frames.webp`);
 overrides[id]={sheet:`assets/animation/v4-11-motion/${id}-frames.webp`,poster:`assets/animation/v4-11-motion/${id}-poster.webp`,viewport:{w:crop.width,h:crop.height},frames,rig:false,walk:false,loop:false,hop:0,face:0,travel:0,fps:18,label:s.label,cel:{sequence:s.sequence,holdsMs:s.holds,advance:s.sequence.map(()=>0),restFrame:0,motion:s.motion},duration:s.holds.reduce((a,b)=>a+b,0)};
 records.push({id,poses:count,viewport:overrides[id].viewport,crop,source:`source/${id}.png`,wholePoseBounds:group.main.map(g=>[g.left,g.top,g.right,g.bottom]),registration:'complete silhouettes, shared crop and ground baseline, no mesh',motion:s.motion,sequence:s.sequence,holds:s.holds});
}
fs.writeFileSync(dir+'/overrides.json',JSON.stringify(overrides,null,2));fs.writeFileSync(dir+'/packaging.json',JSON.stringify({version:'4.11',tool:'built-in image_gen',records},null,2));
const file='geo/assets/motion-v4-11.js';let js=fs.readFileSync(file,'utf8');const start='/* BEGIN COMPLETE POSE OVERRIDES */',end='/* END COMPLETE POSE OVERRIDES */',insert=`${start}\nObject.assign(defs,${JSON.stringify(overrides)});\n${end}`;
if(js.includes(start))js=js.slice(0,js.indexOf(start))+insert+js.slice(js.indexOf(end)+end.length);else js=js.replace("const clamp=x=>",insert+"\nconst clamp=x=>");fs.writeFileSync(file,js);console.log(records);
