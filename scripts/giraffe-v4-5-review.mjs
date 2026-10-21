import fs from 'node:fs';
import {createRequire} from 'node:module';
const require=createRequire('C:/Users/XTIA/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/package.json');
const {chromium}=require('playwright');
fs.mkdirSync('screenshots/giraffe-v4-5',{recursive:true});
const browser=await chromium.launch({channel:'msedge',headless:true});
const page=await browser.newPage({viewport:{width:1500,height:1000}});
await page.goto('http://127.0.0.1:4173/geo/?giraffe-review=4.5');
await page.waitForFunction(()=>window.SpritePuppets);
const originalPuppets=fs.readFileSync('.upgrade-backup/v4-4-before-motion/puppet-rigs.js','utf8');
const result=await page.evaluate(async originalSource=>{
 const img=new Image();img.src='assets/animation/v4-1/giraffe-poster.webp';await img.decode();
 document.body.style.cssText='background:#eef1e6;margin:0;display:grid;grid-template-columns:repeat(3,490px);gap:8px;font:16px sans-serif';
 for(const e of document.body.children)e.style.display='none';
 const result=[];
 for(const p of [0,.22,.40,.55,.72,1]){
  const box=document.createElement('div'),c=document.createElement('canvas');c.width=490;c.height=475;
  const ctx=c.getContext('2d');ctx.translate(8,8);SpritePuppets.draw(ctx,'giraffe',img,p,475,452);
  const mouth=SpritePuppets.giraffeMouth?.(p);if(mouth){ctx.strokeStyle='#cf6b4c';ctx.beginPath();ctx.arc(mouth.x*475,mouth.y*452,4,0,Math.PI*2);ctx.stroke();}
  box.append(c,document.createTextNode('Progress '+p));document.body.append(box);result.push({p,mouth,joints:SpritePuppets.inspect('giraffe',p)});
 }
 const canvas=()=>{const c=document.createElement('canvas');c.width=475;c.height=452;return c;},original=canvas();original.getContext('2d').drawImage(img,0,0);const reference=original.getContext('2d').getImageData(0,0,475,452).data;
 let lowerBodyPixelChanges=0,maxMouthStep=0,endPixelError=0;
 for(let i=0;i<=120;i++){const p=i/120,c=canvas(),ctx=c.getContext('2d');SpritePuppets.draw(ctx,'giraffe',img,p,475,452);const pixels=ctx.getImageData(0,0,475,452).data;
  for(let q=Math.ceil(.61*452)*475*4;q<pixels.length;q++)if(pixels[q]!==reference[q])lowerBodyPixelChanges++;
  if(i===0||i===120){let sum=0;for(let q=0;q<pixels.length;q++)sum+=Math.abs(pixels[q]-reference[q]);endPixelError=Math.max(endPixelError,sum/pixels.length);}
  if(i){const prev=SpritePuppets.giraffeMouth((i-1)/120),curr=SpritePuppets.giraffeMouth(p);maxMouthStep=Math.max(maxMouthStep,Math.hypot((curr.x-prev.x)*475,(curr.y-prev.y)*452));}
 }
 const beforeWindow={};new Function('window',originalSource)(beforeWindow);const unchangedAnimals=[];
 for(const id of ['lion','hippo','boa','duck','hen']){const other=new Image();other.src=ANIMAL_ANIMATIONS[id].poster;await other.decode();const a=canvas(),b=canvas();SpritePuppets.draw(a.getContext('2d'),id,other,.44,475,452);beforeWindow.SpritePuppets.draw(b.getContext('2d'),id,other,.44,475,452);const pa=a.getContext('2d').getImageData(0,0,475,452).data,pb=b.getContext('2d').getImageData(0,0,475,452).data;let changed=0;for(let q=0;q<pa.length;q++)changed+=pa[q]!==pb[q];unchangedAnimals.push({id,changed});}
 return {frames:result,checks:{lowerBodyPixelChanges,maxMouthStep,endPixelError,unchangedAnimals}};
},originalPuppets);
await page.screenshot({path:'screenshots/giraffe-v4-5/frames.png',fullPage:true});
fs.writeFileSync('screenshots/giraffe-v4-5/joints.json',JSON.stringify(result,null,2));
console.log(JSON.stringify(result));
await browser.close();
if(result.checks.lowerBodyPixelChanges||result.checks.endPixelError>.1||result.checks.maxMouthStep>2||result.checks.unchangedAnimals.some(a=>a.changed))process.exitCode=1;
