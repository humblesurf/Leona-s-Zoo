import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
const require=createRequire('C:/Users/XTIA/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/package.json');
const sharp=require('sharp');
const sources={
  "supermarket": "C:\\Users\\XTIA\\.codex\\generated_images\\01a11ba2-de0b-7be3-b4b5-357b118b3ea5\\exec-b0172c87-b6de-4aff-8998-83478effe887.png",
  "music": "C:\\Users\\XTIA\\.codex\\generated_images\\01a11ba2-de0b-7be3-b4b5-357b118b3ea5\\exec-5e237d02-de68-480b-a8d9-04c9a777f81e.png"
};
const prompts={
  "supermarket": "Use case: illustration-story.\nAsset type: seamless 3:1 panoramic background for an interactive toddler learning game, high resolution, render the widest landscape image possible, sharp readable forms.\nPrimary request: a genuine modern supermarket interior seen from a child's standing eye level. Create one continuous broad aisle with shelving and a dairy refrigerator, not a fruit market, domestic kitchen or wooden produce counter.\nComposition: camera near frontal, modest depth perspective, bright off-white tiled floor occupies bottom 30%, stocked supermarket shelves fill middle 55%, signage and soft white ceiling above. Across the continuous panorama, left zone is an open refrigerated dairy shelf with recognizable blue-and-white milk cartons (at x 14%, y 47%) and small yogurt cups (x 32%, y 54%). Middle zone is a bakery shelf with transparent bags of golden sliced bread and loaves (x 49%, y 51%) and a carton of eggs sitting flat safely on a low shelf (x 64%, y 57%). Right zone is a regular household-goods shelf with soft pastel tissue boxes, each visibly dispensing one white tissue (x 80%, y 49%). Show multiples of each product fully resting on horizontal shelves with accurate contact shadows and consistent perspective, not huge floating single objects pasted in front. The target products should be recognizable and medium sized, reachable visually, several of each but enough space between categories.\nA single small empty metal shopping trolley with a green handle stands naturally on the floor at x 87%, y 79%, and a low stack of red shopping baskets is on floor at x 96%, y 86%. No people.\nStyle: high quality children's animated film environment, soft 3D-like painted materials with crisp contours, warm friendly but realistic supermarket design. Coherent lighting, not flat clip art, not photorealistic. White metal shelving, shelf edge strips, tiled floor, fluorescent ceiling light shapes, attractive pastel packaging. Bright diffuse daylight, detailed surface texture without noise.\nConstraints: no readable brands or arbitrary writing, no logos, no giant foreground props, no central kitchen island, no wooden fruit stall, no domestic furnishings, no UI, no border, no watermark. Items integrated into their appropriate supermarket shelves. Continuous physical space, one floor plane across the image. Full width composed intentionally, no repeated or mirrored panels.",
  "music": "Use case: illustration-story.\nAsset type: seamless 3:1 panoramic background for an interactive toddler music learning game, high resolution, render the widest landscape image possible with sharp instrument forms.\nPrimary request: a delightful purpose-built children's music studio / music classroom. Five recognizable instruments are naturally arranged in their own small activity areas across one continuous room. It must look like a music teaching room, not a family lounge or domestic house.\nComposition: child's eye-level panorama, mild perspective with floor bottom 30%. A low wooden mini stage with warm timber flooring connects instrument stations, acoustic wall panels and a few musical staff motifs high on rear wall, broad bright studio windows, sensible empty play space. No people, sofa, dining table, fireplace or kitchen.\nLeft (x 14%, y 57%): a warm wooden upright piano, its whole keyboard visible at about y 66%, piano fully standing on floor with matching small bench offset aside. Second station (x 34%, y 68%): one round red small drum on a stable short stand, pale drum skin on top with two wooden drumsticks parked on a small holder beside it. Middle (x 54%, y 70%): a recognizable wooden-bar xylophone, natural wood bars varying in length and tuned pitch, resting on a stable child-height wooden stand, two round-headed mallets neatly parked nearby. Fourth (x 73%, y 58%): a round tambourine with metal jingles, resting upright in a shallow wooden cradle on a low wall-mounted musical instrument shelf. Fifth (x 88%, y 61%): a pair of red and yellow maracas, both handles resting securely in a simple wooden stand on a similar shelf.\nEnsure each target instrument is not blocked and has clear silhouette, natural contact shadows and perspective matching its supporting furniture, not a line of oversized detached cutouts on the foreground floor. Instruments should be spread out in a coherent classroom, plausible and functional, enough large to tap them in a phone landscape game.\nStyle: polished animated children's-film environment with gentle 3D-like painted textures and clear silhouettes, natural wood and cheerful but restrained colours. Warm diffuse morning light, crisp realistic musical instrument construction, no flat 2D sticker style.\nConstraints: no readable text, no logos, no UI, no watermark, no blackboard dominating, no domestic furnishings, no decorative random extra instruments, no excessive clutter, no duplicated piano or drum. One continuous physical room without mirrors or repeated scenery."
};
const boxes={
 supermarket:{
  shopmilk:[.120,.480,.116,.145],
  shopyogurt:[.137,.328,.104,.119],
  shopbread:[.362,.329,.141,.125],
  shopeggs:[.552,.505,.115,.089],
  shoptissue:[.722,.335,.126,.150],
  shopcart:[.800,.574,.129,.364],
  shopbasket:[.934,.668,.064,.231]
 },
 music:{
  musicpiano:[.018,.265,.221,.458],
  musicdrum:[.308,.411,.099,.288],
  musicxylophone:[.475,.411,.183,.289],
  musictambourine:[.765,.306,.079,.219],
  musicmaracas:[.897,.319,.074,.192]
 }
};
const musical={
 musicpiano:{keys:[[.15,.446,.145,.035],[.33,.446,.145,.035],[.51,.446,.145,.035],[.69,.446,.145,.035]]},
 musicdrum:{strikePoint:[.48,.105],strikeHeadRect:[.06,.01,.88,.12]},
 musicxylophone:{strikePoint:[.58,.115]},
 musictambourine:{beatPoint:[.52,.45]},
 musicmaracas:{beatPoint:[.50,.43]}
};
for(const id of Object.keys(sources)){
 const dir='geo/assets/chapters-v4-10/'+id;fs.mkdirSync(dir+'/source',{recursive:true});
 const target=dir+'/source/background-original.png';fs.copyFileSync(sources[id],target);
 const metadata=await sharp(target).metadata();
 await sharp(target).webp({quality:96,effort:6}).toFile(dir+'/background.webp');
 const old=JSON.parse(fs.readFileSync('geo/assets/chapters-v4-9/'+id+'/'+id+'.json','utf8'));
 const objects={},animals=[];
 for(const [oid,b] of Object.entries(boxes[id])){
  const o=old.objects[oid];objects[oid]={...o,posterAspect:o.width/o.height,embedded:true,width:Math.round(b[2]*metadata.width),height:Math.round(b[3]*metadata.height),...(musical[oid]||{})};
  animals.push({id:oid,u:b[0]+b[2]/2,feetY:b[1]+b[3],h:b[3],hitWidthRatio:3*b[2]/b[3],embedded:true,embeddedBounds:b,flip:false,idle:'none',kind:'discovery',instance:oid+'-embedded-v4-10'});
 }
 const scene={...old.scene,numScreens:3,panorama:true,bgAspect:metadata.width/metadata.height,bgMirror:false,bgStrip:'assets/chapters-v4-10/'+id+'/background.webp',animals};delete scene.counterFeetY;
 const data={scene,objects,dialogue:old.dialogue,embeddedBounds:boxes[id]};
 fs.writeFileSync(dir+'/scene.json',JSON.stringify(data,null,2));
 fs.writeFileSync(dir+'/prompt.txt',prompts[id]+'\n');
 fs.writeFileSync(dir+'/generation.json',JSON.stringify({version:'V4.10',tool:'built-in image_gen.imagegen',original:sources[id],savedSource:'source/background-original.png',background:'background.webp',dimensions:[metadata.width,metadata.height],generatedAt:new Date().toISOString(),approach:'Target objects are part of the painted environment. Original independent sprites are used only for the shopping-flight image; no resting foreground sticker is displayed.',bounds:boxes[id]},null,2));
 console.log(id,metadata.width+'x'+metadata.height,animals.length+' embedded targets');
}

