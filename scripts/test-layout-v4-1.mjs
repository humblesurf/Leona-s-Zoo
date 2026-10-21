import assert from 'node:assert/strict';import fs from 'node:fs';import crypto from 'node:crypto';import {createRequire} from 'node:module';
const require=createRequire('C:/Users/XTIA/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/package.json'),{chromium}=require('playwright'),sharp=require('sharp');
for(const r of JSON.parse(fs.readFileSync('geo/assets/generation-v4.json','utf8')).preferredBackgrounds){const bytes=fs.readFileSync(r.file),meta=await sharp(bytes).metadata();assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'),r.sha256);assert.equal(meta.width,2172);assert.equal(meta.height,724);}
const browser=await chromium.launch({channel:'msedge',headless:true}),page=await browser.newPage(),errors=[],failed=[],views=[];
page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)failed.push(r.url());});
try{
 await page.goto('http://127.0.0.1:4173/geo/?v=4.1');await page.waitForFunction(()=>window.__Animals);await page.evaluate(()=>__Animals.dismissIntro());
 for(const viewport of [{width:2560,height:1440},{width:844,height:390}]){
  await page.setViewportSize(viewport);await page.waitForTimeout(350);await page.waitForFunction(()=>[...document.images].every(i=>i.complete&&i.naturalWidth));
  const data=await page.evaluate(()=>{
   const collisions=[],distribution={},environment=[];let start=0;
   for(const [s,sid]of GAME_SCENE_ORDER.entries()){
    const scene=GAME_SCENES[sid],w=scene.numScreens*__Animals.screenW(),panel=document.querySelectorAll('.panel')[GAME_SCENE_ORDER.length+s],els=[...panel.querySelectorAll('.animal')];
    distribution[sid]={left:scene.animals.filter(a=>a.facing===-1).length,right:scene.animals.filter(a=>a.facing===1).length};
    for(const el of els){
     __Animals.camera=Math.max(start,start+Number(el.dataset.u)*w-innerWidth/2);
     const r=el.getBoundingClientRect(),x=r.left+r.width/2,y=r.top+r.height/2,hit=document.elementFromPoint(x,y)?.closest('.animal');
     if(hit!==el)collisions.push({id:el.dataset.id,instance:el.dataset.instance,hit:hit?.dataset.instance??null,scene:sid,x,y});
    }
    const tile=panel.querySelector('.bg-panel');if(Math.abs(tile.offsetWidth/innerHeight-scene.bgAspect)>.003)throw Error('Background crop '+sid);
    environment.push({scene:sid,width:w,characters:els.length});start+=w;
   }
   return {collisions,distribution,environment};
  });
  views.push({...viewport,...data});
  for(const [name,sid,u]of [['savanna-family','savanna',.045],['savanna-giraffes','savanna',.31],['savanna-pond','savanna',.68],['rainforest-canopy','rainforest',.21],['rainforest-cats','rainforest',.69],['ocean-coral','ocean',.67],['polar-north','polar',.2],['polar-south','polar',.70]]){
   await page.evaluate(({sid,u})=>{let start=0;for(const s of GAME_SCENE_ORDER){if(s===sid)break;start+=GAME_SCENES[s].numScreens*__Animals.screenW();}__Animals.camera=Math.max(start,start+u*GAME_SCENES[sid].numScreens*__Animals.screenW()-innerWidth/2);},{sid,u});await page.screenshot({path:`screenshots/v4-1/${viewport.width}-${name}.jpg`,quality:95});
  }
 }
 assert.deepEqual(errors,[]);assert.deepEqual(failed,[]);
 fs.writeFileSync('screenshots/v4-1/layout.json',JSON.stringify({originalBackgroundsUnchanged:true,views,errors,failed},null,2));console.log(views.map(v=>({viewport:v.width,collisions:v.collisions,distribution:v.distribution})));
 assert(views.every(v=>v.collisions.length===0),'Every interactive character centre should remain reachable');
 for(const v of views)for(const [sid,d]of Object.entries(v.distribution))assert(Math.abs(d.left-d.right)<=3,sid+' mixed facing');
}finally{await browser.close();}
