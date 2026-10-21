// Private comparison of actual browser renderer output. No game assets change.
import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
import {spawnSync} from 'node:child_process';
const require=createRequire('C:/Users/XTIA/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/package.json');
const {chromium}=require('playwright'),sharp=require('sharp');
const output='reviews/v4-13/runtime-comparison';fs.mkdirSync(output,{recursive:true});
const modes=[{label:'V4.12 · 8 drawings',url:'http://127.0.0.1:4174/share/runtime-v4-12/',continuous:null},
 {label:'V4.13 · 16 drawings · held travel',url:'http://127.0.0.1:4174/v4-13/',continuous:false},
 {label:'V4.13 · 16 drawings · continuous travel (QA)',url:'http://127.0.0.1:4174/v4-13/',continuous:true}];
const metadata={tool:'Playwright screenshots of actual native canvas renderer, deterministic AnimalAnims.seek timeline sampling',fps:30,
 baseline:'share/runtime-v4-12',candidateSources:JSON.parse(fs.readFileSync('v4-13/assets/animation/walk-v4-13/source/zebra-source-selection.json','utf8')),
 productionModified:false,qualityApproval:'NOT AUTOMATIC. Compare whole motion and actual support drift.',views:[],errors:[],failed:[]};
const browser=await chromium.launch({channel:'msedge',headless:true});
try{
 for(const viewport of [{width:1800,height:1000,name:'desktop',clipW:620,clipH:440},{width:844,height:390,name:'mobile',clipW:420,clipH:280}]){
  const pages=[];
  for(const mode of modes){
   const page=await browser.newPage({viewport:{width:viewport.width,height:viewport.height}});
   page.on('pageerror',e=>metadata.errors.push(e.message));page.on('response',r=>{if(r.status()>=400)metadata.failed.push({url:r.url(),status:r.status()});});
   await page.goto(mode.url+'?qa=private-comparison');await page.waitForFunction(()=>window.__Animals&&window.AnimalAnims&&[...document.images].every(i=>i.complete&&i.naturalWidth));
   await page.evaluate(async continuous=>{
    __Animals.dismissIntro();__Animals.stopSpeech();AnimalAnims.stopAll();
    if(continuous!==null)ANIMAL_ANIMATIONS.zebra.cel.continuousAdvance=continuous;
    const e=[...document.querySelectorAll('.animal[data-id="zebra"]')].find(e=>e.tabIndex===0);e.dataset.gaitQa='true';e.dataset.flip='false';e.querySelector('.orientation').style.transform='scaleX(1)';
    const b=e.getBoundingClientRect();__Animals.camera+=b.left+b.width/2-innerWidth*.5;await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
    await AnimalAnims.preload('zebra');AnimalAnims.play(e,'zebra');
   },mode.continuous);
   await page.addStyleTag({content:'.animal:not([data-gait-qa="true"]){visibility:hidden!important;}'});
   await page.waitForFunction(()=>AnimalAnims.inspect(document.querySelector('[data-gait-qa="true"]'))?.ready);
   const info=await page.evaluate(({cw,ch})=>{const e=document.querySelector('[data-gait-qa="true"]');AnimalAnims.seek(e,0);const r=e.querySelector('.orientation').getBoundingClientRect();return{definition:ANIMAL_ANIMATIONS.zebra,state:AnimalAnims.inspect(e),clip:{x:Math.max(0,Math.min(innerWidth-cw,Math.floor(r.x+r.width/2-cw/2))),y:Math.max(0,Math.min(innerHeight-ch,Math.floor(r.y+r.height/2-ch/2))),width:cw,height:ch}};},{cw:viewport.clipW,ch:viewport.clipH});
   const h=info.state.cel.holdsMs;
   const exposureStart=h[0];const exposureEnd=exposureStart+h[1];
   const withinExposure=await page.evaluate(({a,b})=>{const e=document.querySelector('[data-gait-qa="true"]'),duration=AnimalAnims.inspect(e).duration;AnimalAnims.seek(e,a/duration);const first=AnimalAnims.inspect(e);AnimalAnims.seek(e,b/duration);const second=AnimalAnims.inspect(e);return{first,second,bodyDeltaX:second.x-first.x,deltaTimeMs:b-a};},{a:exposureStart+h[1]*.05,b:exposureEnd-h[1]*.05});
   pages.push({page,mode,info,withinExposure});
  }
  for(const timing of ['shared-click-progress','native-timing']){
   const dir=path.join(output,viewport.name,timing);fs.mkdirSync(dir,{recursive:true});
   const fps=30,endMs=3200,count=Math.floor(endMs/1000*fps)+1,states=[];
   console.log('Recording '+viewport.name+' '+timing+' '+count+' browser samples');
   for(let index=0;index<count;index++){
    const time=index*1000/fps;
    const captures=await Promise.all(pages.map(async({page,mode,info})=>{
     const state=await page.evaluate(({t,shared})=>{const e=document.querySelector('[data-gait-qa="true"]'),r=AnimalAnims.inspect(e);AnimalAnims.seek(e,Math.min(1,t/(shared?2900:r.duration)));return AnimalAnims.inspect(e);},{t:time,shared:timing==='shared-click-progress'});
     return{buffer:await page.screenshot({clip:info.clip}),state,label:mode.label};
    }));
    const overlays=[];
    for(let col=0;col<captures.length;col++){
     overlays.push({input:captures[col].buffer,left:col*viewport.clipW,top:32});
     overlays.push({input:Buffer.from(`<svg width="${viewport.clipW}" height="32"><rect width="100%" height="100%" fill="#efe9db"/><text x="8" y="22" font-size="15" font-family="Arial">${captures[col].label}</text></svg>`),left:col*viewport.clipW,top:0});
    }
    await sharp({create:{width:viewport.clipW*3,height:viewport.clipH+32,channels:3,background:'#efe9db'}}).composite(overlays).png().toFile(path.join(dir,`frame-${String(index).padStart(3,'0')}.png`));
    states.push({timelineMs:time,states:captures.map(c=>({id:c.label,frame:c.state.frame,x:c.state.x,zoom:c.state.zoom,stage:c.state.cel.stage,advance:c.state.cel.advance}))});
   }
   fs.writeFileSync(path.join(dir,'sampled-browser-states.json'),JSON.stringify(states,null,2));
   const result=spawnSync('C:/Users/XTIA/AppData/Local/Python/pythoncore-3.14-64/python.exe',['scripts/render-walk-comparison-v4-13.py',dir,'--fps',String(fps)],{encoding:'utf8'});
   if(result.status!==0)throw Error(result.stderr||result.stdout);console.log(result.stdout.trim());
   // Only remove the exact transient PNGs created above, after both encodings
   // succeeded. Paths are checked against this task's explicit QA directory.
   const safe=fs.realpathSync(dir)+path.sep;
   for(let index=0;index<count;index++){
    const file=fs.realpathSync(path.join(dir,`frame-${String(index).padStart(3,'0')}.png`));
    if(!file.startsWith(safe))throw Error('QA frame escaped intended directory');fs.unlinkSync(file);
   }
   metadata.views.push({viewport,timing,commonClickDurationMs:timing==='shared-click-progress'?2900:null,originalDurationsMs:pages.map(p=>p.info.state.duration),samplingCount:count,
     clips:pages.map(p=>p.info.clip),withinExposure:pages.map(p=>({label:p.mode.label,bodyDeltaX:p.withinExposure.bodyDeltaX,deltaTimeMs:p.withinExposure.deltaTimeMs,firstFrame:p.withinExposure.first.frame,secondFrame:p.withinExposure.second.frame,travel:p.info.state.travel})),
     gif:path.join(dir,'comparison.gif'),mp4:path.join(dir,'comparison.mp4'),
     note:timing==='shared-click-progress'?'Both versions use the same full-click progress over 2.9s for pose comparison; old exposure rhythm is proportionally slowed by 8.6%.':'Versions retain original elapsed-time exposures; old finishes at2.67s and candidate at2.90s. Other animals are hidden in private browser pages only.'});
  }
  await Promise.all(pages.map(p=>p.page.close()));
 }
}finally{await browser.close();fs.writeFileSync(path.join(output,'comparison-report.json'),JSON.stringify(metadata,null,2));}
console.log(JSON.stringify({errors:metadata.errors,failed:metadata.failed,views:metadata.views.map(v=>({viewport:v.viewport.name,timing:v.timing,withinExposure:v.withinExposure,gif:v.gif,mp4:v.mp4}))},null,2));
if(metadata.errors.length||metadata.failed.length)process.exitCode=1;
