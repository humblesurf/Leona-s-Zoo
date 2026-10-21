import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import fs from 'node:fs';
const require=createRequire('C:/Users/XTIA/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/package.json');
const {chromium}=require('playwright');
const browser=await chromium.launch({headless:true,channel:'msedge'}),page=await browser.newPage({viewport:{width:844,height:390}}),errors=[];
page.on('pageerror',e=>errors.push(e.message));
await page.goto('http://127.0.0.1:4173/geo/');await page.waitForFunction(()=>window.__Animals&&[...document.images].every(i=>i.complete&&i.naturalWidth));
const density=await page.evaluate(()=>{
 const result={};for(const sid of GAME_SCENE_ORDER){const s=GAME_SCENES[sid],w=s.numScreens*__Animals.screenW();let max=0;for(let left=0;left<w-innerWidth;left+=innerWidth/8){const n=s.animals.filter(a=>a.u*w>=left&&a.u*w<left+innerWidth).length;max=Math.max(max,n);}result[sid]={screens:w/innerWidth,maximumCentresInViewport:max};}return result;
});
assert.equal(density.savanna.screens,8);assert.equal(density.rainforest.screens,8);assert.ok(density.savanna.maximumCentresInViewport<=3);
assert.ok(await page.locator('#intro').isVisible());await page.evaluate(()=>__Animals.swipe(-80));await page.waitForTimeout(650);assert.ok(await page.locator('#intro').isHidden());
await page.evaluate(()=>{window.__voiceChoices=[];const original=HTMLMediaElement.prototype.play;HTMLMediaElement.prototype.play=function(){if(this.src.includes('/voice/'))__voiceChoices.push(this.src);return original.call(this);};});
const cast={};
for(const lang of ['en','yue','cmn']){
 await page.locator('#languageButton').click();await page.locator(`[data-language="${lang}"]`).click();
 cast[lang]=await page.evaluate(async lang=>{__voiceChoices.length=0;for(let i=0;i<9;i++){__Animals.activate('lion');await new Promise(r=>setTimeout(r,80));}__Animals.stopSpeech();return __voiceChoices.map(src=>src.split('/').pop());},lang);
 assert.equal(new Set(cast[lang]).size,3,`${lang} has three performers`);
 for(let i=1;i<cast[lang].length;i++)assert.notEqual(cast[lang][i],cast[lang][i-1],`${lang} repeats performer`);
}
await page.evaluate(()=>AnimalAnims.stopAll());
await page.setViewportSize({width:1180,height:820});await page.waitForTimeout(200);
const frames=await page.evaluate(()=>{
 const el=document.querySelector('.animal[data-id=tiger]');AnimalAnims.play(el,'tiger');
 const times=[];for(let i=0;i<20;i++){const t=performance.now();AnimalAnims.seek(el,.2+i*.025);times.push(performance.now()-t);}AnimalAnims.stopAll();return times;
});
assert.ok(await page.evaluate(()=>[...document.querySelectorAll('.animal img')].every(i=>i.style.visibility==='')));
// Force the non-WebGL path and inspect an actual frame for offline/older-browser compatibility.
const fallback=await browser.newPage({viewport:{width:1180,height:820}});
await fallback.addInitScript(()=>{const original=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(type,...args){return type==='webgl'?null:original.call(this,type,...args);};});
await fallback.goto('http://127.0.0.1:4173/geo/');await fallback.waitForFunction(()=>window.__Animals&&[...document.images].every(i=>i.complete&&i.naturalWidth));
const cpu=await fallback.evaluate(()=>{const el=document.querySelector('.animal[data-id=turtle]');AnimalAnims.play(el,'turtle');AnimalAnims.seek(el,.4);const info=AnimalAnims.inspect(el),c=el.querySelector('canvas'),a=c.getContext('2d').getImageData(0,0,c.width,c.height).data;let opaque=0;for(let i=3;i<a.length;i+=4)if(a[i]>200)opaque++;AnimalAnims.stopAll();return {...info,opaque,remaining:document.querySelectorAll('.animal-mesh').length};});
assert.equal(cpu.renderer,'canvas2d');assert.ok(cpu.opaque>1000);assert.equal(cpu.remaining,0);assert.deepEqual(errors,[]);
const report={density,cast,webglFrameMedianMs:frames.sort((a,b)=>a-b)[10],fallback:cpu,errors};
fs.writeFileSync('geo/screenshots/v3/redesign-tests.json',JSON.stringify(report,null,2));console.log(report);await browser.close();
