import fs from 'node:fs';import {createRequire} from 'node:module';
const require=createRequire('C:/Users/XTIA/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/package.json'),sharp=require('sharp');
const layout={
music:[['musicpiano',.10,.88,.35,'piano'],['musicdrum',.30,.88,.27,'drum'],['musicxylophone',.50,.86,.22,'xylophone'],['musictambourine',.70,.85,.24,'tambourine'],['musicmaracas',.90,.87,.27,'maracas']],
beach:[['beachumbrella',.10,.90,.50,'beach-umbrella'],['beachbucket',.29,.88,.22,'beach-bucket'],['beachshovel',.41,.90,.20,'beach-shovel'],['beachshell',.53,.91,.14,'beach-shell'],['beachcastle',.67,.91,.31,'beach-castle'],['beachcrab',.82,.91,.12,'beach-crab'],['beachwave',.92,.57,.12,'beach-wave']]
};
for(const [id,rows]of Object.entries(layout)){
 const dir='geo/assets/chapters-v4-9/'+id,objects={},animals=[],dialogue=JSON.parse(fs.readFileSync(dir+'/dialogue.json','utf8'));
 for(const [oid,u,feetY,h,motion] of rows){
  let poster='assets/chapters-v4-9/'+id+'/'+oid+'.webp';if(oid==='beachshell')poster='assets/animation/v4-1/shell-poster.webp';if(oid==='beachcrab')poster='assets/animation/v4-1/crab-poster.webp';const meta=await sharp('geo/'+poster).metadata();
  objects[oid]={poster,width:meta.width,height:meta.height,motion,duration:motion==='beach-wave'?5500:4800};
  animals.push({id:oid,u,feetY,h,flip:false,idle:'none',instance:oid+'-main',kind:'discovery'});
 }
 // Align the key highlights to the painted key bank, rather than the cabinet.
 objects.musicpiano&&(objects.musicpiano.keys=[[.30,.51],[.40,.52],[.50,.535],[.60,.55]]);
 const scene={id,label:id==='music'?'音乐小屋':'海边度假',numScreens:5,bgAspect:3,bgMirror:true,bgStrip:'assets/chapters-v4-9/'+id+'/background.webp',ambience:'assets/audio/v4-9/'+id+'.mp3',animals};
 fs.writeFileSync(dir+'/'+id+'.json',JSON.stringify({scene,objects,dialogue},null,2));
}console.log('Music 5, beach 7 objects/placements ready.');
