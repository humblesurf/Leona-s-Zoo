import fs from 'node:fs';
import {createRequire} from 'node:module';
const require=createRequire('C:/Users/XTIA/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/package.json'),sharp=require('sharp');
const dir='geo/assets/animation/v4-12-gait/source';
const colors={NH:'#c84545',NF:'#df8d29',FH:'#486bbb',FF:'#418a73'};
const offsets={NH:0,NF:.25,FH:.5,FF:.75};
const phases=[0,.085,.17,.25,.375,.5,.585,.67,.75,.875];
function leg(key,p){const phase=(p-offsets[key]+1)%1,near=key.startsWith('N'),front=key.endsWith('F'),hip=front?190:440,ground=near?328:308,swing=phase<.25,q=swing?phase/.25:(phase-.25)/.75,x=hip+(swing?70-130*(q*q*(3-2*q)):-60+130*q),y=ground-(swing?Math.sin(q*Math.PI)*64:0);return{key,phase,swing,foot:[x,y],hip:[hip,180],knee:[hip+(front?12:-34),235-(swing?18:0)],hock:[hip+(front?-3:16)+(x-hip)*.30,280-(swing?32:0)],ground};}
const records=phases.map((phase,frame)=>({frame,phase,legs:['FH','FF','NH','NF'].map(key=>leg(key,phase))}));
for(const r of records){
  const lines=r.legs.map(l=>{
    const near=l.key.startsWith('N'),shift=near?8:-8;
    const pts=[l.hip,l.knee,l.hock,l.foot].map(([x,y],i)=>[x+(i===0?shift:0),y]);
    return `<path d="M${pts.join(' L')}" stroke="${colors[l.key]}" stroke-width="${near?15:10}" fill="none" stroke-linecap="round"/><ellipse cx="${l.foot[0]}" cy="${l.foot[1]}" rx="16" ry="6" fill="${colors[l.key]}"/><circle cx="${pts[0][0]}" cy="${pts[0][1]}" r="8" fill="${colors[l.key]}"/>`;
  }).join('');
  const footlabels=r.legs.map((l,i)=>`<text x="24" y="${395+i*26}" font-size="19" fill="${colors[l.key]}">${l.key==='NH'?'NEAR HIND (closest to camera)':l.key==='FH'?'FAR HIND (behind near hind)':l.key==='NF'?'NEAR FRONT (closest)': 'FAR FRONT (behind near front)'}: ${l.swing?'LIFT / SWING LEFT':'PLANTED'} - foot X ${Math.round(l.foot[0])}</text>`).join('');
  const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="650" height="505" viewBox="0 0 650 505"><rect width="650" height="505" fill="#fffdf7"/><text x="24" y="32" font-size="23" font-weight="bold">ONE complete animal pose ${r.frame+1} / 10</text><text x="24" y="61" font-size="18">FOUR-BEAT WALK - Facing LEFT - no trot / run</text><path d="M24 328H620M24 308H620" stroke="#d2cfc5" stroke-width="2"/><ellipse cx="325" cy="160" rx="164" ry="58" fill="#e0ddd2"/><path d="M183 135L112 95L81 150L148 178Z" fill="#e0ddd2"/><path d="M489 151Q529 166 555 210" fill="none" stroke="#c4bfaf" stroke-width="8"/>${lines}<text x="24" y="366" font-size="16">Colored planning limbs only. Final animal uses reference material/colors.</text>${footlabels}</svg>`;
  await sharp(Buffer.from(svg)).png().toFile(`${dir}/pose-guide-${r.frame}.png`);
}
fs.writeFileSync(dir+'/single-gait-guide.json',JSON.stringify({phases,records},null,2));
console.log('10 single-pose planning guides saved');
