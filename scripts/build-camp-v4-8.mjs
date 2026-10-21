import fs from 'node:fs/promises';
import path from 'node:path';
import { createRequire } from 'node:module';
const require = createRequire('C:/Users/XTIA/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/package.json');
const sharp = require('sharp');
const out = path.resolve('geo/assets/exploration-v4-8/camp');
await fs.mkdir(path.join(out,'source'),{recursive:true});
const generated = 'C:/Users/XTIA/.codex/generated_images/01a11a3c-09f1-79f3-9d03-026ea7c2da17';
const sources = {
  background:'exec-8a0c8354-23aa-4256-afbe-6426d887c8a3.png',
  tent:'exec-b2f67d84-2473-434e-a9fe-71d1382da639.png',
  backpack:'exec-189f9b10-08e4-40f4-92f8-fb246a6efc36.png',
  tree:'exec-0031fdc0-1d40-4442-8ec8-412369530ac7.png',
  fireflies:'exec-3457cdce-55c9-4f56-846e-d03733464ad7.png',
  stars:'exec-8d13008a-96de-469b-9a17-fb77b5d9baf0.png',
  stream:'exec-02d52373-1123-4412-b940-563787b527f5.png'
};
const records = [];
for (const [name,file] of Object.entries(sources)) {
  const target=path.join(out,'source',name+'.png');
  await fs.copyFile(path.join(generated,file),target);
  const m=await sharp(target).metadata();
  if(name==='background') {
    await sharp(target).webp({quality:94,effort:6}).toFile(path.join(out,'background.webp'));
    records.push({name,width:m.width,height:m.height,alpha:false});
    continue;
  }
  if(!m.hasAlpha) throw new Error(name+' is not truly transparent');
  const {data,info}=await sharp(target).ensureAlpha().raw().toBuffer({resolveWithObject:true});
  function bounds(x0,w,threshold=5) {
    let l=w,t=info.height,r=-1,b=-1,clear=0;
    for(let y=0;y<info.height;y++)for(let x=0;x<w;x++) {
      const a=data[(y*info.width+x+x0)*4+3];
      if(a<=threshold) {clear++;continue;}
      l=Math.min(l,x);t=Math.min(t,y);r=Math.max(r,x);b=Math.max(b,y);
    }
    return {l,t,r,b,transparentFraction:clear/(w*info.height)};
  }
  if(name==='tent') {
    if(info.width%2) throw new Error('Tent cells must have equal widths');
    const cw=info.width/2;
    const bb=[bounds(0,cw),bounds(cw,cw)];
    if(bb.some(x=>x.transparentFraction<.15))throw new Error('Tent missing alpha padding');
    const l=Math.max(0,Math.min(...bb.map(x=>x.l))-20),t=Math.max(0,Math.min(...bb.map(x=>x.t))-20);
    const r=Math.min(cw-1,Math.max(...bb.map(x=>x.r))+20),b=Math.min(info.height-1,Math.max(...bb.map(x=>x.b))+20);
    for(let i=0;i<2;i++)await sharp(target).extract({left:i*cw+l,top:t,width:r-l+1,height:b-t+1}).webp({lossless:true}).toFile(path.join(out,i?'tent-open.webp':'tent-closed.webp'));
    records.push({name,sourceWidth:m.width,sourceHeight:m.height,width:r-l+1,height:b-t+1,cells:2,commonCrop:{l,t,r,b},bounds:bb});
  } else {
    const bb=bounds(0,info.width,name==='stars'||name==='fireflies'?1:5);
    if(bb.transparentFraction<.1)throw new Error(name+' has insufficient genuine transparency');
    const l=Math.max(0,bb.l-20),t=Math.max(0,bb.t-20),r=Math.min(info.width-1,bb.r+20),b=Math.min(info.height-1,bb.b+20);
    await sharp(target).extract({left:l,top:t,width:r-l+1,height:b-t+1}).webp({lossless:true}).toFile(path.join(out,name+'.webp'));
    records.push({name,sourceWidth:m.width,sourceHeight:m.height,width:r-l+1,height:b-t+1,bounds:bb});
  }
}
await fs.writeFile(path.join(out,'packaging.json'),JSON.stringify({mode:'built-in imagegen',originalResolution:true,records},null,2));
const thumbs=[];
for(const file of ['tent-closed.webp','tent-open.webp','backpack.webp','tree.webp','fireflies.webp','stars.webp','stream.webp']) {
  const buf=await sharp(path.join(out,file)).resize(360,260,{fit:'contain',background:'#253b4a'}).png().toBuffer();
  thumbs.push(buf);
}
await sharp({create:{width:1440,height:520,channels:3,background:'#253b4a'}}).composite(thumbs.map((input,i)=>({input,left:(i%4)*360,top:Math.floor(i/4)*260}))).png().toFile(path.join(out,'source','private-contact.png'));
console.log(JSON.stringify(records,null,2));
