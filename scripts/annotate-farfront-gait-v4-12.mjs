import{createRequire}from'node:module';
const require=createRequire('C:/Users/XTIA/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/package.json'),sharp=require('sharp');
const dir='geo/assets/animation/v4-12-gait/source';
for(const id of['zebra','rhino']){
 const file=dir+'/'+id+'-pose-8.png',m=await sharp(file).metadata(),w=m.width,h=m.height;
 const point=id==='zebra'?[w*.410,h*.745]:[w*.320,h*.725];
 const svg=`<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg"><rect x="${w*.51}" y="${h*.015}" width="${w*.48}" height="${h*.09}" rx="12" fill="white"/><text x="${w*.53}" y="${h*.052}" font-family="Arial" font-size="${w*.018}" font-weight="bold" fill="#c52230">Lift THIS darker BACKGROUND front leg.</text><text x="${w*.53}" y="${h*.086}" font-family="Arial" font-size="${w*.017}" fill="#c52230">Keep the brighter FOREGROUND front planted.</text><path d="M${w*.7} ${h*.12}L${point[0]} ${point[1]}" stroke="#ff2446" stroke-width="${w*.005}"/><circle cx="${point[0]}" cy="${point[1]}" r="${w*.034}" fill="none" stroke="#ff2446" stroke-width="${w*.005}"/></svg>`;
 const annotated=await sharp(file).composite([{input:Buffer.from(svg)}]).png().toBuffer();
 await sharp(annotated).resize({width:1000}).png().toFile(dir+'/'+id+'-farfront-guide.png');
}
console.log('Anatomy annotations only.');
