const fs=require('node:fs'),path=require('node:path'),sharp=require('C:/Users/XTIA/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
const root=path.resolve(__dirname,'../assets'),gen='C:/Users/XTIA/.codex/generated_images/01a1bc14-db0e-7f83-bc47-7812db6f2340';
const inputs={shark:gen+'/exec-9977c228-462e-4a75-bfbf-b19c62e15745.png',hen:gen+'/exec-2e61e820-ebfd-438b-9326-9c5f9f65bd3a.png',duck:gen+'/exec-1bce44cd-4f5d-46e3-89ab-bae4168ab2c4.png',duckling:gen+'/exec-713f9c31-c945-44ca-a225-d469e6176b1d.png',hippo:root+'/animals/v7-1/hippo/0.webp',crocodile:root+'/animals/v7-1/crocodile/0.webp'};
(async()=>{fs.mkdirSync(root+'/animals/v83',{recursive:true});for(const[id,input]of Object.entries(inputs)){
 const {data,info}=await sharp(input).ensureAlpha().raw().toBuffer({resolveWithObject:true});let x0=info.width,y0=info.height,x1=0,y1=0;
 for(let y=0;y<info.height;y++)for(let x=0;x<info.width;x++)if(data[(y*info.width+x)*4+3]>170){x0=Math.min(x0,x);x1=Math.max(x1,x);y0=Math.min(y0,y);y1=Math.max(y1,y);}
 x0=Math.max(0,x0-3);y0=Math.max(0,y0-3);x1=Math.min(info.width-1,x1+3);y1=Math.min(info.height-1,y1+3);
 await sharp(input).extract({left:x0,top:y0,width:x1-x0+1,height:y1-y0+1}).resize({width:1200,height:1000,fit:'inside',withoutEnlargement:true}).png().toFile(root+'/animals/v83/'+id+'.png');
 console.log(id,[x0,y0,x1,y1]);
}})();
