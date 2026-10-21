import {createRequire} from 'node:module';
import fs from 'node:fs';
const require=createRequire('C:/Users/XTIA/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/package.json');
const {chromium}=require('playwright'),sharp=require('sharp');
fs.mkdirSync('geo/screenshots/v3',{recursive:true});
const browser=await chromium.launch({headless:true,channel:'msedge'}),page=await browser.newPage({viewport:{width:1180,height:820}});
const errors=[];page.on('pageerror',e=>errors.push(e.message));
await page.goto('http://127.0.0.1:4173/geo/');await page.waitForFunction(()=>window.__Animals&&[...document.images].every(i=>i.complete&&i.naturalWidth));
await page.evaluate(()=>__Animals.dismissIntro());await page.locator('#soundButton').click();await page.waitForTimeout(600);
const records=await page.evaluate(()=>GAME_SCENE_ORDER.flatMap(sid=>GAME_SCENES[sid].animals.map(a=>({id:a.id,sid,u:a.u}))));
for(const id of ['savanna','rainforest','ocean','arctic','antarctic']){
 const shots=[];const count=await page.evaluate(id=>Math.ceil(GAME_SCENES[id].numScreens),id);
 for(let i=0;i<count;i++){
  await page.evaluate(({id,i})=>{let acc=0;for(const s of GAME_SCENE_ORDER){if(s===id)break;acc+=GAME_SCENES[s].numScreens*__Animals.screenW();}__Animals.camera=acc+i*__Animals.screenW();},{id,i});await page.waitForTimeout(60);
  const buf=await page.screenshot();shots.push({input:await sharp(buf).resize(472,328).toBuffer(),left:(i%4)*472,top:Math.floor(i/4)*328});
 }
 await sharp({create:{width:1888,height:Math.ceil(count/4)*328,channels:3,background:'#fff'}}).composite(shots).jpeg({quality:88}).toFile(`geo/screenshots/v3/${id}-overview.jpg`);
}
const selected=process.argv.includes('--all')?records.filter((a,i)=>records.findIndex(b=>a.id===b.id)===i):records.filter(r=>['tiger','turtle','boa','elephant','penguin','butterfly','lion'].includes(r.id)).filter((a,i,ar)=>ar.findIndex(b=>a.id===b.id)===i);
for(const record of selected){
 await page.evaluate(({id,sid,u})=>{AnimalAnims.stopAll();__Animals.stopSpeech();let acc=0;for(const s of GAME_SCENE_ORDER){if(s===sid)break;acc+=GAME_SCENES[s].numScreens*__Animals.screenW();}__Animals.camera=acc+u*GAME_SCENES[sid].numScreens*__Animals.screenW()-innerWidth/2;const el=[...document.querySelectorAll(`.animal[data-id="${id}"]`)].find(e=>{const r=e.getBoundingClientRect();return r.left>=0&&r.right<=innerWidth;});window.auditEl=el;AnimalAnims.play(el,id);},record);
 const frames=[];
 for(const [i,t]of [0,.25,.45,.65].entries()){
  const box=await page.evaluate(t=>{AnimalAnims.seek(auditEl,t);const r=auditEl.getBoundingClientRect();return {x:Math.max(0,Math.floor(r.x-r.width*.3)),y:Math.max(0,Math.floor(r.y-r.height*.3)),width:Math.min(innerWidth-1,Math.ceil(r.width*1.6)),height:Math.min(innerHeight-1,Math.ceil(r.height*1.6))};},t);
  box.width=Math.min(box.width,1180-box.x);box.height=Math.min(box.height,820-box.y);
  const buf=await page.screenshot({clip:box});frames.push({input:await sharp(buf).resize(420,330,{fit:'contain',background:'#eef2eb'}).png().toBuffer(),left:i*420,top:0});
 }
 await sharp({create:{width:1680,height:330,channels:3,background:'#eef2eb'}}).composite(frames).jpeg({quality:94}).toFile(`geo/screenshots/v3/action-${record.id}.jpg`);
 console.log(record.id,await page.evaluate(()=>AnimalAnims.inspect(auditEl)));
}
console.log({errors});await browser.close();
