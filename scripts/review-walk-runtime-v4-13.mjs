// Private actual-webpage review. Structural success is not a natural-gait PASS.
// Sole points are measured from original artwork, never sampled from a guide.
import fs from 'node:fs';
import {createRequire} from 'node:module';
const require=createRequire('C:/Users/XTIA/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/package.json');
const {chromium}=require('playwright'),sharp=require('sharp');
const manifest=JSON.parse(fs.readFileSync('v4-13/assets/animation/walk-v4-13/manifest.json','utf8'));
const ids=process.argv.slice(2).length?process.argv.slice(2):['zebra'];
const url='http://127.0.0.1:4174/v4-13/?qa=walk-original-review';
const dir='reviews/v4-13/runtime-walk';fs.mkdirSync(dir,{recursive:true});
const report={url,method:'Actual runtime held-cel sampling and projection of independently measured original-art sole points. No guide geometry. Structural result does not imply natural movement approval.',views:[],errors:[],failed:[]};
const browser=await chromium.launch({channel:'msedge',headless:true});
try{
 for(const viewport of [{width:1800,height:1000},{width:844,height:390}])for(const flip of [false,true]){
  const page=await browser.newPage({viewport});
  page.on('pageerror',e=>report.errors.push(e.message));page.on('response',r=>{if(r.status()>=400)report.failed.push({url:r.url(),status:r.status()});});
  await page.goto(url);await page.waitForFunction(()=>window.__Animals&&window.AnimalAnims&&[...document.images].every(i=>i.complete&&i.naturalWidth));
  await page.evaluate(()=>{__Animals.dismissIntro();__Animals.stopSpeech();});
  for(const id of ids){
   const entry=manifest.animals[id];if(!entry?.ready)throw Error(id+' asset pack is not ready');
   const def=await page.evaluate(id=>ANIMAL_ANIMATIONS[id],id);if(!def.sheet.includes('walk-v4-13'))throw Error(id+' still has old animation');
   await page.evaluate(async({id,flip})=>{
    AnimalAnims.stopAll();const e=[...document.querySelectorAll('.animal[data-id="'+id+'"]')].find(e=>e.tabIndex===0);
    e.dataset.flip=String(flip);e.querySelector('.orientation').style.transform=`scaleX(${flip?-1:1})`;
    const b=e.getBoundingClientRect();__Animals.camera+=b.left+b.width/2-innerWidth*.5;await AnimalAnims.preload(id);AnimalAnims.play(e,id);
   },{id,flip});
   await page.waitForFunction(id=>AnimalAnims.inspect([...document.querySelectorAll('.animal[data-id="'+id+'"]')].find(e=>e.tabIndex===0))?.ready,id);
   const initial=await page.evaluate(id=>AnimalAnims.inspect([...document.querySelectorAll('.animal[data-id="'+id+'"]')].find(e=>e.tabIndex===0)),id);
   const holds=initial.cel.holdsMs,walkCount=holds.length-2,cycles=walkCount/16;
   if(!Number.isInteger(cycles)||cycles<1)throw Error(id+' malformed cycle count');
   let time=holds[0];const samples=[],thumbs=[];
   for(let frame=0;frame<=16+(cycles>1?1:0);frame++){
    const seam=frame===17,expectedFrame=seam?0:frame;
    const exposure=frame===16?walkCount+1:frame+1;
    const elapsed=seam?holds.slice(0,17).reduce((a,b)=>a+b,0)+holds[17]/2:frame===16?initial.duration-holds.at(-1)/2:time+holds[exposure]/2;
    const points=entry.qa.actualFeet[frame===16||seam?0:frame];if(!points)throw Error(id+' missing actual foot measurements '+frame);
    const sample=await page.evaluate(({id,frame,elapsed,entry,points})=>{
     const e=[...document.querySelectorAll('.animal[data-id="'+id+'"]')].find(e=>e.tabIndex===0);AnimalAnims.seek(e,elapsed/AnimalAnims.inspect(e).duration);
     const s=AnimalAnims.inspect(e),orientation=e.querySelector('.orientation'),b=orientation.getBoundingClientRect(),w=orientation.offsetWidth,h=orientation.offsetHeight;
     const fit=Math.min(w/entry.viewport.w,h/entry.viewport.h),pad=(s.cssSize[0]-w)/2,baseX=(w-entry.viewport.w*fit)/2,baseY=(h-entry.viewport.h*fit)/2;
     const c=e.querySelector('canvas.animal-frames'),ctx=c.getContext('2d'),dpr=c.width/s.cssSize[0],feet={};
     for(const[leg,item]of Object.entries(points)){
      const outX=item.masterPoint[0]*entry.outputScale+entry.outputOffset[0],outY=item.masterPoint[1]*entry.outputScale+entry.outputOffset[1];
      const x=w*.5+(baseX+outX*fit-w*.5)*s.zoom,y=h*.96+(baseY+outY*fit-h*.96)*s.zoom;
      const px=Math.round((pad+x)*dpr),py=Math.round((pad+y)*dpr),raw=ctx.getImageData(Math.max(0,px-5),Math.max(0,py-5),11,11).data;
      let opaque=0;for(let i=3;i<raw.length;i+=4)if(raw[i]>32)opaque++;
      feet[leg]={state:item.state,masterPoint:item.masterPoint,worldPoint:[b.x+(s.orientation<0?w-x:x),b.y+y],canvasOpaquePixelsNearby:opaque};
     }
     return{...s,expectedFrame:frame,fit,feet,box:{x:b.x,y:b.y,width:b.width,height:b.height}};
    },{id,frame:expectedFrame,elapsed,entry,points});
    sample.reviewExposure=seam?'second-cycle phase0':frame===16?'final settlement rest':'first-cycle phase'+frame;
    if(sample.frame!==expectedFrame)throw Error(`${id} requested${expectedFrame} exposed${sample.frame}`);
    if(!sample.ready||sample.travel*sample.face<=0)throw Error(id+' not ready or travelling backwards');
    if((frame<16||seam)&&Math.abs(sample.zoom-1.1)>1e-8)throw Error(id+' zoom changes during planted-foot walk');
    if(Object.values(sample.feet).some(p=>p.canvasOpaquePixelsNearby===0))throw Error(id+' hoof disappeared/cropped at frame'+frame);
    const b=sample.box,pad=50,x=Math.max(0,Math.floor(b.x-pad)),y=Math.max(0,Math.floor(b.y-pad));
    const clip={x,y,width:Math.min(viewport.width-x,Math.ceil(b.width+pad*2)),height:Math.min(viewport.height-y,Math.ceil(b.height+pad*2))};
    const path=`${dir}/${id}-${viewport.width}-${flip?'right':'left'}-${String(frame).padStart(2,'0')}.png`;await page.screenshot({path,clip});
    const thumb=await sharp(path).resize({width:340}).png().toBuffer();thumbs.push({frame,thumb,height:(await sharp(thumb).metadata()).height});samples.push(sample);
    if(frame<16)time+=holds[frame+1];
   }
   const contact=[];
   for(let frame=0;frame<15;frame++)for(const[leg,a]of Object.entries(samples[frame].feet)){
    const b=samples[frame+1].feet[leg];if(a.state===b.state&&a.state==='stance')contact.push({fromFrame:frame,toFrame:frame+1,leg,worldDelta:[b.worldPoint[0]-a.worldPoint[0],b.worldPoint[1]-a.worldPoint[1]]});
   }
   const loopSeamContacts=[];
   if(cycles>1)for(const[leg,a]of Object.entries(samples[15].feet)){
    const b=samples[17].feet[leg];if(a.state===b.state&&a.state==='stance')loopSeamContacts.push({fromFrame:15,toFrame:0,leg,worldDelta:[b.worldPoint[0]-a.worldPoint[0],b.worldPoint[1]-a.worldPoint[1]]});
   }
   const flaggedForVisualReview=contact.filter(v=>Math.abs(v.worldDelta[0])>4||Math.abs(v.worldDelta[1])>4);
   const th=Math.max(...thumbs.map(t=>t.height))+28,overlays=[];
   for(const{frame,thumb}of thumbs){const left=frame%4*340,top=Math.floor(frame/4)*th;overlays.push({input:thumb,left,top:top+28},{input:Buffer.from(`<svg width="340" height="28"><rect width="100%" height="100%" fill="#efe9db"/><text x="8" y="20" font-size="16" font-family="Arial">${id} ${frame}</text></svg>`),left,top});}
   await sharp({create:{width:1360,height:Math.ceil(thumbs.length/4)*th,channels:3,background:'#efe9db'}}).composite(overlays).png().toFile(`${dir}/${id}-${viewport.width}-${flip?'right':'left'}-runtime.png`);
   report.views.push({id,viewport,flip,cycles,definition:def,samples,contactTransitions:contact,loopSeamContacts,flaggedForVisualReview,structuralPass:true,naturalMovementApproval:'NOT AUTOMATIC: stance movement flags need whole-cycle visual review.'});
  }
  await page.close();
 }
}finally{await browser.close();fs.writeFileSync(`${dir}/walk-runtime.json`,JSON.stringify(report,null,2));}
console.log(JSON.stringify({errors:report.errors,failed:report.failed,views:report.views.map(v=>({id:v.id,width:v.viewport.width,flip:v.flip,cycles:v.cycles,frames:v.samples.length,flagged:v.flaggedForVisualReview.length,maxStanceDeltaX:Math.max(...v.contactTransitions.map(t=>Math.abs(t.worldDelta[0])))}))},null,2));
if(report.errors.length||report.failed.length)process.exitCode=1;
