import {createRequire} from 'node:module';
const require=createRequire('C:/Users/XTIA/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/package.json');
const sharp=require('sharp');
const root='geo/assets/exploration-v4-8/harbor/';
const sail=await sharp(root+'source/sail.png').resize(953,953).toBuffer();
await sharp({create:{width:1254,height:1254,channels:4,background:'#a5dbe9'}}).composite([
 {input:root+'source/harborsailboat.png',left:0,top:0},
 {input:sail,left:135,top:49}
]).png().toFile(root+'source/sail-registration-qa.png');
