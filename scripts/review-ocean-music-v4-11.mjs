import fs from 'node:fs';import path from 'node:path';import{createRequire}from'node:module';
const require=createRequire('C:/Users/XTIA/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/package.json'),{chromium}=require('playwright'),sharp=require('sharp');
const out=path.resolve('screenshots/v4-11/ocean-music-market');fs.mkdirSync(out,{recursive:true});
const report={problems:[],missing:[],checks:[],screenshots:[]};const check=(ok,message)=>{if(!ok)report.problems.push(message);};
const browser=await chromium.launch({channel:'msedge',headless:true});
try{
 for(const vp of [{width:1920,height:1080},{width:844,height:390}]){
  const page=await browser.newPage({viewport:vp});page.on('pageerror',e=>report.problems.push(`${vp.width}: ${e.message}`));page.on('response',r=>{if(r.status()>=400)report.missing.push({status:r.status(),url:r.url()});});
  await page.goto('http://127.0.0.1:4173/geo/?v=4.11-private-ocean-music');await page.waitForFunction(()=>window.__Animals&&window.AnimalAnims);await page.evaluate(()=>__Animals.dismissIntro());
  async function center(id){await page.evaluate(async id=>{AnimalAnims.stopAll();__Animals.stopSpeech();await AnimalAnims.preload(id);const e=[...document.querySelectorAll(`.animal[data-id="${id}"]`)].find(e=>e.tabIndex===0),r=e.getBoundingClientRect();__Animals.camera+=r.left+r.width/2-innerWidth/2;},id);await page.waitForTimeout(70);return page.locator(`.animal[data-id="${id}"][tabindex="0"]`).first();}
  async function shot(name){const file=path.join(out,`${vp.width}-${name}.png`);await page.screenshot({path:file});report.screenshots.push(file);}
  await page.evaluate(()=>__Animals.goScene('music'));await page.waitForTimeout(750);await shot('music-entry');
  for(const id of ['musicpiano','musicdrum','musicxylophone','musictambourine','musicmaracas','musicharp','musicguitar']){
   const el=await center(id);await el.click({force:true});await page.waitForTimeout(100);await el.evaluate(e=>AnimalAnims.seek(e,.45));
   const state=await el.evaluate(e=>{const s=AnimalAnims.inspect(e),r=e.getBoundingClientRect(),b=CHAPTER_OBJECTS[e.dataset.id],svg=e.querySelector('.music-string-animation');return{...s,box:[r.left,r.top,r.width,r.height],path:svg?[...svg.querySelectorAll('path')].map(p=>p.getAttribute('d')):null,lines:b.stringLines,baseHidden:getComputedStyle(e.querySelector('.chapter-base')).visibility==='hidden',idHit:document.elementFromPoint(r.left+r.width*.5,r.top+r.height*.65)?.closest('.animal')?.dataset.id};});
   check(state?.renderer==='chapter-originals',`${vp.width} ${id}: animation did not activate`);check(state?.baseHidden,`${vp.width} ${id}: foreground cutout reappears`);
   if(['musicharp','musicguitar'].includes(id)){check(state.path?.length===(id==='musicharp'?5:6),`${vp.width} ${id}: no string movement`);check(state.path?.every(x=>x&&x.includes('Q')),`${vp.width} ${id}: missing curved strings`);}
   await shot(`${id}-active`);report.checks.push({viewport:vp.width,id,state});
  }
  // Use a real maraca-head point inside the guitar rectangle's upper empty area.
  const maraca=await center('musicmaracas');const hits=await maraca.evaluate(e=>{const r=e.getBoundingClientRect();return[.2,.65].map(x=>{const point={x:r.left+r.width*x,y:r.top+r.height*.21};return{...point,id:document.elementFromPoint(point.x,point.y)?.closest('.animal')?.dataset.id};});});
  check(hits.every(x=>x.id==='musicmaracas'),`${vp.width}: guitar intercepts maraca head: ${JSON.stringify(hits)}`);report.checks.push({viewport:vp.width,id:'maraca-hit',hits});
  await page.evaluate(()=>__Animals.goScene('market'));await page.waitForTimeout(750);await shot('market-entry');
  const market=await page.evaluate(()=>GAME_SCENES.market.animals);
  for(const a of market){const el=await center(a.id);const box=await el.evaluate(e=>{const r=e.getBoundingClientRect(),p=e.closest('.panel').getBoundingClientRect(),a=GAME_SCENES.market.animals.find(a=>a.id===e.dataset.id);return{id:e.dataset.id,r:[r.left,r.top,r.width,r.height],placement:a,local:[(r.left+r.width/2-p.left)/p.width,r.top/innerHeight,r.width/p.width,r.height/innerHeight],hit:document.elementFromPoint(r.left+r.width/2,r.top+r.height/2)?.closest('.animal')?.dataset.id};});check(box.hit===a.id,`${vp.width} market ${a.id}: hotspot overlapped`);report.checks.push({viewport:vp.width,id:a.id,market:box});await shot(`market-${a.id}`);}
  await page.evaluate(()=>__Animals.goScene('ocean'));await page.waitForTimeout(750);
  for(const id of ['octopus','stingray','lobster','whale','jellyfish']){
   const el=await center(id);await el.click({force:true});await page.waitForTimeout(100);
   const points=id==='stingray'?[.06,.21,.36,.51,.66,.80,.94]:id==='octopus'?[.1,.33,.56,.76,.95]:id==='lobster'?[.1,.32,.58,.74,.93]:[.1,.3,.5,.7,.9];
   const samples=[];
   for(let i=0;i<points.length;i++){await el.evaluate((e,p)=>AnimalAnims.seek(e,p),points[i]);const sample=await el.evaluate(e=>{const state=AnimalAnims.inspect(e),c=e.querySelector('canvas'),raw=c.getContext('2d').getImageData(0,0,c.width,c.height).data;let border=0,painted=0;for(let y=0;y<c.height;y++)for(let x=0;x<c.width;x++){const a=raw[(y*c.width+x)*4+3];if(a>32){painted++;if(x<2||y<2||x>=c.width-2||y>=c.height-2)border++;}}return{...state,border,painted};});samples.push(sample);check(sample.painted>10,`${vp.width} ${id} empty frame`);check(sample.border===0,`${vp.width} ${id} clipped pose ${i}`);await shot(`${id}-${i}`);}
   if(['whale','jellyfish'].includes(id)){const smooth=await el.evaluate(e=>{let last,speed=0,jump=0;for(let i=0;i<=200;i++){AnimalAnims.seek(e,i/200);const s=AnimalAnims.inspect(e);if(last){jump=Math.max(jump,Math.abs(s.joint-last.joint));speed=Math.max(speed,Math.abs(s.y-last.y));}last=s;}return{jointStep:jump,driftStep:speed};});check(smooth.jointStep<.004,`${vp.width} ${id} discontinuous joint`);samples.push(smooth);}
   report.checks.push({viewport:vp.width,id,samples});
  }
  await page.close();
 }
}finally{await browser.close();report.passed=report.problems.length===0;fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2));}
// Compose only the useful full-frame reviews; raw screenshots remain available.
for(const group of ['music','market','octopus','stingray','lobster','whale','jellyfish']){const names=fs.readdirSync(out).filter(x=>x.startsWith('1920-'+group)&&x.endsWith('.png'));if(!names.length)continue;const p=[];for(let i=0;i<names.length;i++)p.push({input:await sharp(path.join(out,names[i])).resize(640,360).png().toBuffer(),left:i%2*640,top:Math.floor(i/2)*360});await sharp({create:{width:1280,height:Math.ceil(names.length/2)*360,channels:4,background:'#eee8dc'}}).composite(p).png().toFile(path.join(out,group+'-review.png'));}
console.log(JSON.stringify({passed:report.passed,problems:report.problems,missing:report.missing,checks:report.checks.length,output:out},null,2));if(!report.passed)process.exitCode=1;
