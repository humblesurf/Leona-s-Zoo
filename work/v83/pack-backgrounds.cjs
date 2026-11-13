/* Opaque texture quilting: the join follows matching scenery, with no reflection or alpha fade. */
const fs=require('node:fs'),path=require('node:path'),sharp=require('C:/Users/XTIA/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
const root=path.resolve(__dirname,'..'),generated='C:/Users/XTIA/.codex/generated_images/01a1bc14-db0e-7f83-bc47-7812db6f2340/exec-8f301dab-2766-4520-8eaa-637c6f3637c2.png';
(async()=>{const maps={};for(const id of ['savanna','rainforest','farm','ocean']){
 const input=id==='ocean'?generated:id==='farm'?path.join(__dirname,'farm-clean-source.png'):path.join(root,'assets/bg/v8/'+id+'-forward.png');
 const {data,info}=await sharp(input).removeAlpha().raw().toBuffer({resolveWithObject:true}),w=info.width,h=info.height,n=Math.round(w*.13),tile=w-n;
 let prev=new Float64Array(n),curr=new Float64Array(n);const back=new Int8Array(n*h);
 for(let y=0;y<h;y++){
  for(let x=0;x<n;x++){
   const a=(y*w+tile+x)*3,b=(y*w+x)*3;let cost=0;
   for(let c=0;c<3;c++){cost+=(data[a+c]-data[b+c])**2;if(x&&x<n-1)cost+=.3*Math.abs(data[b+c+3]-data[b+c-3]);}
   // Keep the path away from overlap borders so both sides have complete texture.
   cost+=x<12||x>n-13?15000:0;
   let j=x;if(x&&prev[x-1]<prev[j])j=x-1;if(x<n-1&&prev[x+1]<prev[j])j=x+1;
   curr[x]=cost+(y?prev[j]:0);back[y*n+x]=j-x;
  }[prev,curr]=[curr,prev];
 }
 let x=0;for(let i=1;i<n;i++)if(prev[i]<prev[x])x=i;const seam=[];for(let y=h-1;y>=0;y--){seam[y]=x;x+=back[y*n+x];}
 const out=Buffer.alloc(tile*h*3);for(let y=0;y<h;y++)for(let x=0;x<tile;x++){const from=x<seam[y]?x+tile:x;data.copy(out,(y*tile+x)*3,(y*w+from)*3,(y*w+from)*3+3);}
 const target=path.join(root,'assets/bg/v83/'+id+'-forward.png');await sharp(out,{raw:{width:tile,height:h,channels:3}}).png().toFile(target);
 maps[id]={width:tile,height:h,sourceWidth:w,overlap:n,seam};
 const pair=await sharp({create:{width:tile*2,height:h,channels:3,background:'#000'}}).composite([{input:target,left:0,top:0},{input:target,left:tile,top:0}]).png().toBuffer();const preview=await sharp(pair).resize({width:1800}).png().toBuffer();fs.writeFileSync(path.join(__dirname,id+'-repeat.png'),preview);
 console.log(id,tile,h);
 }
 fs.writeFileSync(path.join(root,'assets/v83-background-map.js'),'/* Geometry of the opaque background joins. */\nwindow.V83_BACKGROUND_MAP='+JSON.stringify(maps)+';\n');
})();
