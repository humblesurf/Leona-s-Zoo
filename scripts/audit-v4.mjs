import {createRequire} from 'node:module';
import fs from 'node:fs';
import vm from 'node:vm';
const require=createRequire('C:/Users/XTIA/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/package.json');
const sharp=require('sharp'),{chromium}=require('playwright');
const state={window:{}};vm.runInNewContext(fs.readFileSync('geo/assets/animation-data.js','utf8'),state);
const defs=Object.entries(state.window.ANIMAL_ANIMATIONS);
for(let n=0;n<defs.length;n+=18){
 const layers=[];
 for(let k=n;k<Math.min(n+18,defs.length);k++){
  const [id,d]=defs[k],i=k-n;
  layers.push({input:await sharp('geo/'+d.poster).resize(232,180,{fit:'contain',background:'#eff1e8'}).png().toBuffer(),left:(i%4)*250+9,top:Math.floor(i/4)*210+25});
  const label=Buffer.from(`<svg width="250" height="24"><text x="10" y="18" font-size="15" font-family="sans-serif" fill="#344">${id}</text></svg>`);
  layers.push({input:label,left:(i%4)*250,top:Math.floor(i/4)*210});
 }
 await sharp({create:{width:1000,height:1050,channels:3,background:'#eff1e8'}}).composite(layers).jpeg({quality:94}).toFile(`geo/screenshots/v4/posters-${n/18}.jpg`);
}
const browser=await chromium.launch({headless:true,channel:'msedge'}),page=await browser.newPage({viewport:{width:1180,height:820}}),errors=[],failed=[];
page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)failed.push(r.url());});
await page.goto('http://127.0.0.1:4173/geo/?v=4');await page.waitForFunction(()=>window.__Animals&&[...document.images].every(i=>i.complete&&i.naturalWidth));await page.waitForTimeout(800);
await page.screenshot({path:'geo/screenshots/v4/opening.png'});await page.locator('#soundButton').click();await page.evaluate(()=>__Animals.dismissIntro());
const records=await page.evaluate(()=>GAME_SCENE_ORDER.flatMap((sid,s)=>GAME_SCENES[sid].animals.map((a,k)=>({...a,sid,u:Number(document.querySelectorAll('.panel')[GAME_SCENE_ORDER.length+s].querySelectorAll('.animal')[k].dataset.u)}))));
for(const id of ['tiger','turtle','boa','sloth','monkey','orangutan','frog','elephant','elephantcalf','lioness','hippo','crocodile']){
 const rec=records.find(a=>a.id===id);
 await page.evaluate(({sid,u,id})=>{AnimalAnims.stopAll();__Animals.stopSpeech();let start=0;for(const s of GAME_SCENE_ORDER){if(s===sid)break;start+=GAME_SCENES[s].numScreens*__Animals.screenW();}__Animals.camera=start+u*GAME_SCENES[sid].numScreens*__Animals.screenW()-innerWidth/2;window.auditEl=[...document.querySelectorAll(`.animal[data-id="${id}"]`)].find(e=>{const r=e.getBoundingClientRect();return r.left>=0&&r.right<=innerWidth;});AnimalAnims.play(auditEl,id);},rec);
 await page.waitForFunction(()=>AnimalAnims.inspect(auditEl)?.ready);
 const frames=[];
 for(const [k,p]of [0,.18,.35,.52,.7,.87].entries()){
  const box=await page.evaluate(p=>{AnimalAnims.seek(auditEl,p);let r=auditEl.getBoundingClientRect();let x=Math.max(0,Math.floor(r.x-50)),y=Math.max(0,Math.floor(r.y-65));return {x,y,width:Math.min(innerWidth-x,Math.ceil(r.width+100)),height:Math.min(innerHeight-y,Math.ceil(r.height+105))};},p);
  const buf=await page.screenshot({clip:box});frames.push({input:await sharp(buf).resize(330,280,{fit:'contain',background:'#eff1e8'}).png().toBuffer(),left:k*330,top:0});
 }
 await sharp({create:{width:1980,height:280,channels:3,background:'#eff1e8'}}).composite(frames).jpeg({quality:95}).toFile(`geo/screenshots/v4/action-${id}.jpg`);
 await page.screenshot({path:`geo/screenshots/v4/scene-${id}.jpg`,quality:95});
}
console.log({errors,failed});await browser.close();
