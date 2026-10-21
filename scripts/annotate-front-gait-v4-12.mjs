import fs from'node:fs';import{createRequire}from'node:module';
const require=createRequire('C:/Users/XTIA/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/package.json'),sharp=require('sharp');
const dir='geo/assets/animation/v4-12-gait/source';
for(const id of['zebra','rhino']){
 const file=dir+'/'+id+'-pose-3.png',m=await sharp(file).metadata(),w=m.width,h=m.height;
 const point=id==='zebra'?[w*.307,h*.626]:[w*.534,h*.679];
 const labelX=w*.70,labelY=h*.05;
 const svg=`<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg"><rect x="${w*.53}" y="${h*.015}" width="${w*.46}" height="${h*.09}" rx="12" fill="white"/><text x="${w*.55}" y="${h*.052}" font-family="Arial" font-size="${w*.018}" font-weight="bold" fill="#c52230">Lift THIS bright FOREGROUND front leg.</text><text x="${w*.55}" y="${h*.086}" font-family="Arial" font-size="${w*.017}" fill="#c52230">Keep the darker BACKGROUND front planted.</text><path d="M${labelX} ${labelY+h*.07}L${point[0]} ${point[1]}" stroke="#ff2446" stroke-width="${w*.005}"/><circle cx="${point[0]}" cy="${point[1]}" r="${w*.034}" fill="none" stroke="#ff2446" stroke-width="${w*.005}"/></svg>`;
 const annotated=await sharp(file).composite([{input:Buffer.from(svg)}]).png().toBuffer();
 await sharp(annotated).resize({width:1000}).png().toFile(dir+'/'+id+'-nearfront-guide.png');
}
console.log('Anatomical foreground-front leg annotation guides only, not final sprites.');
