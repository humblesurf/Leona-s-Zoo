import fs from'node:fs';import{createRequire}from'node:module';
const require=createRequire('C:/Users/XTIA/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/package.json'),{chromium}=require('playwright');
const url='https://freesound.org/people/antique98/sounds/160686/';
const html=await(await fetch(url)).text();
const download=html.match(/https:\/\/cdn\.freesound\.org\/previews\/[^"<>\s]+-hq\.mp3/)?.[0];
if(!download||!html.includes('Creative Commons 0'))throw Error('Public preview / CC0 license missing');
const dir='geo/assets/animation/v4-11-motion/goose/source',out='geo/assets/calls/v4-11';fs.mkdirSync(dir,{recursive:true});fs.mkdirSync(out,{recursive:true});
const response=await fetch(download);if(!response.ok)throw Error('Goose preview '+response.status);
const input=Buffer.from(await response.arrayBuffer());fs.writeFileSync(dir+'/freesound-160686-goose.mp3',input);fs.writeFileSync(dir+'/freesound-160686-license.html',html);
const browser=await chromium.launch({channel:'msedge',headless:true}),page=await browser.newPage();
const decoded=await page.evaluate(async b64=>{const raw=Uint8Array.from(atob(b64),c=>c.charCodeAt(0)),ctx=new AudioContext(),buffer=await ctx.decodeAudioData(raw.buffer);const n=buffer.length,mono=new Float32Array(n);for(let ch=0;ch<buffer.numberOfChannels;ch++){const data=buffer.getChannelData(ch);for(let i=0;i<n;i++)mono[i]+=data[i]/buffer.numberOfChannels;}await ctx.close();return{sampleRate:buffer.sampleRate,samples:Array.from(mono)};},input.toString('base64'));await browser.close();
const peak=Math.max(...decoded.samples.map(Math.abs).slice(0,10000),...Array.from({length:Math.ceil(decoded.samples.length/10000)},(_,i)=>Math.max(...decoded.samples.slice(i*10000,(i+1)*10000).map(Math.abs))));
const n=decoded.samples.length,sr=decoded.sampleRate,wav=Buffer.alloc(44+n*2),volume=.46/peak;wav.write('RIFF');wav.writeUInt32LE(36+n*2,4);wav.write('WAVE',8);wav.write('fmt ',12);wav.writeUInt32LE(16,16);wav.writeUInt16LE(1,20);wav.writeUInt16LE(1,22);wav.writeUInt32LE(sr,24);wav.writeUInt32LE(sr*2,28);wav.writeUInt16LE(2,32);wav.writeUInt16LE(16,34);wav.write('data',36);wav.writeUInt32LE(n*2,40);let sum=0;
for(let i=0;i<n;i++){const fade=Math.min(1,i/(sr*.025),(n-1-i)/(sr*.065)),v=decoded.samples[i]*volume*fade;sum+=v*v;wav.writeInt16LE(Math.max(-32768,Math.min(32767,Math.round(v*32767))),44+i*2);}
fs.writeFileSync(out+'/farmgoose.wav',wav);
const record={id:'farmgoose',path:'assets/calls/v4-11/farmgoose.wav',duration:n/sr,title:'A squeaking goose',author:'antique98',source:url,download,license:'CC0 1.0',licenseUrl:'https://creativecommons.org/publicdomain/zero/1.0/',type:'recording',description:'Real goose vocalization recorded at a local farm by the contributor.',modifications:'Mono mix, gentle peak normalization to 0.46, short 25 ms / 65 ms edge fades; original pitch and duration.',rms:Math.sqrt(sum/n),peak:.46};fs.writeFileSync('geo/assets/animation/v4-11-motion/goose/call-recording.json',JSON.stringify(record,null,2));console.log(record);
