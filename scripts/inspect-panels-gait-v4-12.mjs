import fs from'node:fs';import{createRequire}from'node:module';
const require=createRequire('C:/Users/XTIA/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/package.json'),sharp=require('sharp'),dir='geo/assets/animation/v4-12-gait/source';
const panels={};
for(const file of['zebra-pair-01.png','zebra-pair-56.png','rhino-pair-01.png']){
 const{data,info}=await sharp(dir+'/'+file).ensureAlpha().raw().toBuffer({resolveWithObject:true}),counts=[];
 for(let x=0;x<info.width;x++){let n=0;for(let y=0;y<info.height;y++)if(data[(y*info.width+x)*4+3]>64)n++;counts.push(n);}
 const gaps=[];let start=null;
 for(let x=Math.floor(info.width*.36);x<info.width*.66;x++){if(counts[x]===0){if(start===null)start=x;}else if(start!==null){gaps.push([start,x-1]);start=null;}}
 if(start!==null)gaps.push([start,Math.floor(info.width*.66)-1]);
 gaps.sort((a,b)=>(b[1]-b[0])-(a[1]-a[0]));if(!gaps.length)throw Error(file+' no alpha-empty inter-body gap');
 const gap=gaps[0],cut=Math.floor((gap[0]+gap[1])/2);panels[file]={canvas:[info.width,info.height],alphaEmptyGap:gap,cut,leftPanel:[0,0,cut,info.height]};
 let saturatedRed=0,redAlpha={};for(let k=0;k<data.length;k+=4)if(data[k]>220&&data[k+1]<40&&data[k+2]<40&&data[k+3]){saturatedRed++;redAlpha[data[k+3]]=(redAlpha[data[k+3]]||0)+1;}
 panels[file].alphaEdgeNoise={saturatedRed,redAlpha};
}
fs.writeFileSync(dir+'/panel-bounds-v4-12.json',JSON.stringify(panels,null,2));console.log(JSON.stringify(panels,null,2));
