import fs from 'node:fs/promises';
import path from 'node:path';
import {createRequire} from 'node:module';
const require=createRequire('C:/Users/XTIA/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/package.json');
const sharp=require('sharp');
const out=path.resolve('geo/assets/exploration-v4-8/space');
const old=path.join(out,'source/moon-landscape.png');
const replacement='C:/Users/XTIA/.codex/generated_images/01a11a3c-82fc-71d0-8c01-956e381bb2cc/exec-8bf72749-9b2f-40b9-ac8d-aafe32c87ed5.png';
const [before,after]=await Promise.all([sharp(old).removeAlpha().raw().toBuffer({resolveWithObject:true}),sharp(replacement).removeAlpha().raw().toBuffer({resolveWithObject:true})]);
if(before.info.width!==after.info.width||before.info.height!==after.info.height)throw new Error('Canvas dimensions changed');
const w=after.info.width,h=after.info.height;
let groundSum=0,groundMax=0,groundPixels=0,outsideSum=0,outsideMax=0,outsidePixels=0;
for(let y=0;y<h;y++)for(let x=0;x<w;x++){
 const insideEarth=x>=1890&&x<=2035&&y>=40&&y<=180;
 for(let c=0;c<3;c++){
  const i=(y*w+x)*3+c,d=Math.abs(before.data[i]-after.data[i]);
  if(y>=225){groundSum+=d;groundMax=Math.max(groundMax,d);groundPixels++;}
  if(!insideEarth){outsideSum+=d;outsideMax=Math.max(outsideMax,d);outsidePixels++;}
 }
}
const stats={width:w,height:h,groundMeanAbsDifference:groundSum/groundPixels,groundMaxDifference:groundMax,outsideRemovalMeanAbsDifference:outsideSum/outsidePixels,outsideRemovalMaxDifference:outsideMax};
const backup=path.join(out,'source/moon-landscape-with-earth-original.png');
try{await fs.access(backup);}catch{await fs.copyFile(old,backup);}
await fs.copyFile(replacement,old);
await sharp(old).webp({quality:94,effort:6}).toFile(path.join(out,'moon-landscape.webp'));
const qa=JSON.parse(await fs.readFile(path.join(out,'asset-qa.json'),'utf8'));
qa.images.moonLandscape.Earth='removed to prevent repeated Earth discs when the panorama is mirrored';
qa.images.moonLandscape.preciseEdit=stats;
qa.runtimeReview={lunarRover844:{nearSideWheels:2,chassisConnected:true,facing:'right',seriousFloating:false},marsRover844:{nearSideWheels:3,chassisConnected:true,facing:'right',seriousFloating:false},screenshots:['screenshots/v4-8/spacelunarrover-844-active.png','screenshots/v4-8/spacemarsrover-844-active.png']};
await fs.writeFile(path.join(out,'asset-qa.json'),JSON.stringify(qa,null,2)+'\n');
console.log(JSON.stringify(stats,null,2));
