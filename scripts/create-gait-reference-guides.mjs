/* Private pose planning references for the illustrator, never game artwork.
   Colored stick bones identify which leg must be forward in each drawing. */
import fs from 'node:fs';import path from 'node:path';import {createRequire} from 'node:module';
const require=createRequire('C:/Users/XTIA/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/package.json');
const sharp=require('sharp'),out='geo/assets/animation/v4-7/reference';fs.mkdirSync(out,{recursive:true});
const cw=600,ch=380,ground=330,TAU=Math.PI*2;
const limbs=[{name:'far hind',x:410,color:'#398347',phaseWalk:.5,phaseTrot:.5,far:true},{name:'far fore',x:270,color:'#266dd1',phaseWalk:.75,phaseTrot:0,far:true},{name:'near hind',x:388,color:'#9236b3',phaseWalk:0,phaseTrot:0,far:false},{name:'near fore',x:248,color:'#ef7516',phaseWalk:.25,phaseTrot:.5,far:false}];
const svgLine=(points,color,width)=>`<polyline points="${points.map(p=>p.join(',')).join(' ')}" fill="none" stroke="${color}" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round"/>`;
for(const gait of ['walk','trot']){
 let svg=`<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="1520" viewBox="0 0 1200 1520"><rect width="1200" height="1520" fill="#fff"/>`;
 for(let i=0;i<8;i++){
  const ox=i%2*cw,oy=Math.floor(i/2)*ch,phase=i/8,duty=gait==='walk'?.72:.55;
  svg+=`<g transform="translate(${ox},${oy})"><text x="20" y="26" font-family="sans-serif" font-size="19" fill="#555">${i}: ${gait} — face LEFT</text><line x1="42" y1="${ground}" x2="558" y2="${ground}" stroke="#ddd" stroke-width="2"/>`;
  svg+=svgLine([[142,130],[187,149],[230,163],[390,170],[442,157],[480,168],[518,180]],'#888',15);
  svg+=`<ellipse cx="163" cy="124" rx="37" ry="27" fill="none" stroke="#888" stroke-width="8"/><path d="M143 99 L147 76 L159 102 M172 100 L180 79 L187 107" stroke="#888" stroke-width="7" fill="none"/><circle cx="146" cy="123" r="4" fill="#555"/>`;
  for(const l of limbs){
   const ph=((phase-(gait==='walk'?l.phaseWalk:l.phaseTrot))%1+1)%1;
   const root=[l.x,l.name.includes('fore')?169:178];
   let tx,ty;
   if(ph<duty){tx=root[0]-66+132*ph/duty;ty=ground;}
   else{const u=(ph-duty)/(1-duty);tx=root[0]+66-132*(u*u*(3-2*u));ty=ground-(gait==='walk'?44:65)*Math.sin(Math.PI*u);}
   const midX=(root[0]+tx)/2+(l.name.includes('fore')?21:-23),midY=(root[1]+ty)/2-4;
   svg+=svgLine([root,[midX,midY],[tx,ty]],l.color,l.far?9:12)+`<circle cx="${root[0]}" cy="${root[1]}" r="5" fill="${l.color}"/><line x1="${tx-13}" y1="${ty}" x2="${tx+9}" y2="${ty}" stroke="${l.color}" stroke-width="10" stroke-linecap="round"/>`;
  }
  svg+=`<text x="32" y="361" font-size="14" font-family="sans-serif" fill="#ef7516">orange=near fore</text><text x="196" y="361" font-size="14" font-family="sans-serif" fill="#266dd1">blue=far fore</text><text x="326" y="361" font-size="14" font-family="sans-serif" fill="#9236b3">purple=near hind</text><text x="466" y="361" font-size="14" font-family="sans-serif" fill="#398347">green=far hind</text></g>`;
 }
 svg+='</svg>';fs.writeFileSync(path.join(out,gait+'-pose-guide.svg'),svg);await sharp(Buffer.from(svg)).png().toFile(path.join(out,gait+'-pose-guide.png'));
}
console.log('Private colored-leg pose guides saved. These are not animation frames.');
