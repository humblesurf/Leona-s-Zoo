import {createRequire} from 'node:module';
const require=createRequire('C:/Users/XTIA/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/package.json');
const sharp=require('sharp');
for(const id of ['harborferry','harborsailboat','sail','harborfishingboat','harborlighthouse','harborbuoy','harborpier']){
 const {data,info}=await sharp('geo/assets/exploration-v4-8/harbor/source/'+id+'.png').ensureAlpha().raw().toBuffer({resolveWithObject:true});
 const hist=new Map();for(let i=3;i<data.length;i+=4)hist.set(data[i],(hist.get(data[i])||0)+1);
 console.log(id,[...hist].sort((a,b)=>b[1]-a[1]).slice(0,6));
}
