import fs from 'node:fs';import assert from 'node:assert/strict';import {createRequire} from 'node:module';
const require=createRequire('C:/Users/XTIA/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/package.json'),{chromium}=require('playwright');
const browser=await chromium.launch({channel:'msedge',headless:true}),page=await browser.newPage({viewport:{width:1180,height:820}}),errors=[];
page.on('pageerror',e=>errors.push(e.message));
await page.addInitScript(()=>{window.__media=new Set();window.__events=[];const play=HTMLMediaElement.prototype.play;HTMLMediaElement.prototype.play=function(){__media.add(this);if(this.volume>0&&this.src.includes('/voice/v4-1/'))__events.push(this.src);return play.call(this);};});
try{
 await page.goto('http://127.0.0.1:4173/');await page.waitForFunction(()=>window.__Animals);assert.equal(await page.evaluate(()=>__Animals.language),'en');
 const rows=[];
 for(const [mode,want]of Object.entries({en:['en'],yue:['yue'],cmn:['cmn'],'en-yue':['en','yue'],'en-cmn':['en','cmn'],'cmn-yue':['cmn','yue'],all:['en','yue','cmn']})){
  await page.locator('#languageButton').click();await page.locator(`[data-language="${mode}"]`).click();
  await page.evaluate(()=>{__events=[];__Animals.activate('zebra');});
  for(let n=0;n<want.length;n++){
   await page.waitForFunction(n=>__events.length>n,n,{timeout:12000});
   await page.evaluate(()=>{const a=[...__media].find(a=>!a.paused&&a.volume>0&&a.src.includes('/voice/v4-1/'));a.pause();a.dispatchEvent(new Event('ended'));});
  }
  await page.waitForTimeout(400);
  const events=await page.evaluate(()=>__events),got=events.map(p=>p.match(/zebra-(en|yue|cmn)/)[1]);assert.deepEqual(got,want);rows.push({mode,languages:got,files:events});await page.evaluate(()=>__Animals.stopSpeech());
 }
 await page.evaluate(async()=>{for(const id of ['tiger','turtle','boa','elephant','penguin','tiger','lion']){__Animals.activate(id);await new Promise(r=>setTimeout(r,75));}});
 await page.waitForFunction(()=>[...__media].some(a=>!a.paused&&a.volume>0&&/\/voice\/v4-1\/lion-en(?:-[a-z]+)?\.mp3/.test(a.src)&&a.currentTime>.15),{},{timeout:12000});
 const playing=await page.evaluate(()=>[...__media].filter(a=>!a.paused&&a.volume>0&&(/\/voice\/|\/calls\//).test(a.src)).map(a=>a.src));assert.equal(playing.length,1);
 await page.locator('#soundButton').click();assert(await page.evaluate(()=>__Animals.musicEnabled));
 await page.waitForTimeout(900);assert.equal(await page.evaluate(()=>[...__media].filter(a=>!a.paused&&(/\/voice\/|\/calls\//).test(a.src)).length),0);
 assert(await page.evaluate(()=>[...__media].some(a=>!a.paused&&a.src.includes('/audio/'))));
 assert.deepEqual(errors,[]);fs.writeFileSync('screenshots/v4-1/speech.json',JSON.stringify({defaultEnglish:true,rows,rapidRetaps:7,onlyLastNarration:true,independentBackground:true,errors},null,2));console.log({modes:rows.length,defaultEnglish:true,rapidRetaps:7,errors});
}finally{await browser.close();}
