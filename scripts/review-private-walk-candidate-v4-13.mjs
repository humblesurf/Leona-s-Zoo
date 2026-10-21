// PRIVATE actual renderer comparison. Candidate pack never enters production overlay/manifest.
import fs from 'node:fs';import path from 'node:path';import {createRequire} from 'node:module';import {spawnSync} from 'node:child_process';
const require=createRequire('C:/Users/XTIA/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/package.json');
const {chromium}=require('playwright'),sharp=require('sharp');
const id=process.argv[2]||'cow';const packPath=process.argv[3]||`v4-13/assets/animation/walk-v4-13/qa/${id}-trial-pack.json`;
const pack=JSON.parse(fs.readFileSync(packPath,'utf8'));
if(pack.actualGaitApproved)throw Error('This script is for non-approved private candidates');
const cycle={zebra:1200,rhino:1480,buffalo:1360,cow:1400,sheep:1200,pig:1160,calf:1120,lamb:1040,piglet:1040,elephant:1680,elephantcalf:1280,warthog:1040,lioness:1200,lioncub:1040,arcticfox:1040}[id];
if(!cycle||!Number.isFinite(pack.stridePixels))throw Error('Missing measured actual stride or cycle');
const stages=Array.from({length:32},(_,i)=>['near-fore-recovery','far-hind-recovery','far-fore-recovery','near-hind-recovery'][Math.floor(i%16/4)]);
const def={poster:pack.poster,sheet:pack.sheet,viewport:pack.viewport,frames:pack.frames,fps:16000/cycle,loop:false,duration:cycle*2+500,face:-1,travel:pack.stridePixels*2*1.1/pack.viewport.w,rig:false,walk:false,hop:0,pad:true,label:'PRIVATE complete original candidate',cel:{sequence:[16,...Array.from({length:32},(_,i)=>i%16),16],holdsMs:[200,...Array(32).fill(cycle/16),300],advance:[0,...Array.from({length:32},(_,i)=>i/32),1],restFrame:16,motion:'walk',poses:16,cycles:2,contactAuthored:true,stridePixels:pack.stridePixels,continuousAdvance:true,stages:['prepare',...stages,'settle']}};
const out=`reviews/v4-13/private-runtime-${id}`;fs.mkdirSync(out,{recursive:true});
const modes=[{name:'V4.12 baseline',url:'http://127.0.0.1:4174/share/runtime-v4-12/',candidate:false},{name:'16 originals / held travel',url:'http://127.0.0.1:4174/v4-13/',candidate:true,continuous:false},{name:'16 originals / continuous travel',url:'http://127.0.0.1:4174/v4-13/',candidate:true,continuous:true}];
const report={animal:id,privateOnly:true,productionModified:false,actualGaitApproved:false,packPath,bodyRMS:pack.bodyRMS,actualFootQA:pack.qa,views:[],errors:[],failed:[]};
const browser=await chromium.launch({channel:'msedge',headless:true});
try{
 for(const vp of [{width:1800,height:1000,name:'desktop',cw:620,ch:440},{width:844,height:390,name:'mobile',cw:420,ch:280}]){
  const pages=[];
  for(const mode of modes){
   const page=await browser.newPage({viewport:{width:vp.width,height:vp.height}});page.on('pageerror',e=>report.errors.push(e.message));page.on('response',r=>{if(r.status()>=400)report.failed.push({url:r.url(),status:r.status()});});
   await page.goto(mode.url+'?qa=private-'+id);await page.waitForFunction(()=>window.__Animals&&window.AnimalAnims&&[...document.images].every(i=>i.complete&&i.naturalWidth));
   await page.evaluate(async({id,mode,def})=>{
    __Animals.dismissIntro();__Animals.stopSpeech();AnimalAnims.stopAll();
    if(mode.candidate){ANIMAL_ANIMATIONS[id]=structuredClone(def);ANIMAL_ANIMATIONS[id].cel.continuousAdvance=mode.continuous;}
    const e=[...document.querySelectorAll(`.animal[data-id="${id}"]`)].find(e=>e.tabIndex===0);if(!e)throw Error('Missing active scene animal '+id);e.dataset.gaitQa='true';e.dataset.flip='false';e.querySelector('.orientation').style.transform='scaleX(1)';
    const b=e.getBoundingClientRect();__Animals.camera+=b.left+b.width/2-innerWidth*.5;await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
    await AnimalAnims.preload(id);AnimalAnims.play(e,id);
   },{id,mode,def});
   await page.addStyleTag({content:'.animal:not([data-gait-qa="true"]){visibility:hidden!important;}'});await page.waitForFunction(()=>AnimalAnims.inspect(document.querySelector('[data-gait-qa="true"]'))?.ready);
   const info=await page.evaluate(({id,cw,ch})=>{const e=document.querySelector('[data-gait-qa="true"]');AnimalAnims.seek(e,0);const r=e.querySelector('.orientation').getBoundingClientRect();return{definition:ANIMAL_ANIMATIONS[id],state:AnimalAnims.inspect(e),clip:{x:Math.max(0,Math.min(innerWidth-cw,Math.floor(r.x+r.width/2-cw/2))),y:Math.max(0,Math.min(innerHeight-ch,Math.floor(r.y+r.height/2-ch/2))),width:cw,height:ch}};},{id,cw:vp.cw,ch:vp.ch});
   pages.push({page,mode,info});
  }
  const folder=path.join(out,vp.name);fs.mkdirSync(folder,{recursive:true});const fps=30,count=Math.ceil((def.duration+200)*fps/1000)+1,states=[];
  console.log('Recording '+id+' '+vp.name+' '+count+' actual browser samples');
  for(let i=0;i<count;i++){
   const time=i*1000/fps;const caps=await Promise.all(pages.map(async p=>{const state=await p.page.evaluate(t=>{const e=document.querySelector('[data-gait-qa="true"]');const r=AnimalAnims.inspect(e);AnimalAnims.seek(e,Math.min(1,t/r.duration));return AnimalAnims.inspect(e);},time);return{buffer:await p.page.screenshot({clip:p.info.clip}),state};}));
   const composite=[];for(let c=0;c<3;c++){composite.push({input:caps[c].buffer,left:c*vp.cw,top:32});composite.push({input:Buffer.from(`<svg width="${vp.cw}" height="32"><rect width="100%" height="100%" fill="#eee9dd"/><text x="8" y="22" font-size="15" font-family="Arial">${modes[c].name}</text></svg>`),left:c*vp.cw,top:0});}
   await sharp({create:{width:vp.cw*3,height:vp.ch+32,channels:3,background:'#eee9dd'}}).composite(composite).png().toFile(path.join(folder,`frame-${String(i).padStart(3,'0')}.png`));
   states.push({timeMs:time,states:caps.map(c=>({frame:c.state.frame,x:c.state.x,zoom:c.state.zoom,cel:c.state.cel}))});
  }
  fs.writeFileSync(path.join(folder,'browser-states.json'),JSON.stringify(states,null,2));
  const enc=spawnSync('C:/Users/XTIA/AppData/Local/Python/pythoncore-3.14-64/python.exe',['scripts/render-walk-comparison-v4-13.py',folder,'--fps',String(fps),'--mp4-only'],{encoding:'utf8'});if(enc.status!==0)throw Error(enc.stderr||enc.stdout);
  console.log(enc.stdout.trim());const safe=fs.realpathSync(folder)+path.sep;for(let i=0;i<count;i++){const f=fs.realpathSync(path.join(folder,`frame-${String(i).padStart(3,'0')}.png`));if(!f.startsWith(safe))throw Error('QA cleanup outside intended folder');fs.unlinkSync(f);}
  report.views.push({viewport:vp,durations:pages.map(p=>p.info.state.duration),definitions:pages.map(p=>p.info.definition),sampleCount:count,mp4:path.join(folder,'comparison.mp4')});await Promise.all(pages.map(p=>p.page.close()));
 }
}finally{await browser.close();fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2));}
console.log(JSON.stringify({animal:id,errors:report.errors,failed:report.failed,views:report.views.map(v=>({viewport:v.viewport.name,samples:v.sampleCount,mp4:v.mp4}))}));
if(report.errors.length||report.failed.length)process.exitCode=1;
