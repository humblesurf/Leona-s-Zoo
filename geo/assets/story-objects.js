/* Vector-authored dimensional produce. Cut surfaces are separate geometry,
   revealed by a continuous open/hold/close timeline; no bitmap deformation. */
(function(g){
'use strict';
const TAU=Math.PI*2,clamp=x=>Math.max(0,Math.min(1,x)),ease=x=>{x=clamp(x);return x*x*x*(x*(x*6-15)+10);};
const fruits={
 apple:{skin:'#ce4542',light:'#f07b57',inside:'#f5dfaa',path:'M150 70C109 42 45 61 41 132C36 207 74 268 120 259Q150 246 176 259C224 270 269 198 262 128C256 61 193 40 150 70Z'},
 pear:{skin:'#a3b85b',light:'#d1d278',inside:'#f6e7b9',path:'M150 46C122 43 116 80 108 117C95 147 44 166 49 217C55 275 242 280 251 218C261 165 204 139 196 111C185 76 185 42 150 46Z'},
 orange:{skin:'#ed992e',light:'#ffc155',inside:'#f2a642',path:'M264 168C264 229 215 272 150 272C84 272 38 227 38 168C38 102 89 57 150 58C215 57 264 104 264 168Z'},
 watermelon:{skin:'#4e8155',light:'#81a55d',inside:'#dc5b58',path:'M280 175C280 231 225 267 150 268C75 268 20 230 20 175C20 115 79 80 150 80C222 80 280 115 280 175Z'},
 tomato:{skin:'#da5748',light:'#f68a54',inside:'#e87950',path:'M264 179C264 235 214 270 150 267C85 271 35 235 36 179C33 116 74 69 151 75C219 67 266 117 264 179Z'},
 carrot:{skin:'#e89b45',light:'#f9c56e',inside:'#f4ae56',path:'M98 94Q150 72 204 96L166 256Q155 282 143 256Z'},
 banana:{skin:'#ebc850',light:'#fff08b',inside:'#faedbe',path:'M66 56C51 145 105 219 210 235L228 204C145 183 109 132 111 66Z'}
};
function fill(ctx,path,color){ctx.fillStyle=color;ctx.fill(path);}
function surface(ctx,path,colors){const rgb=colors.skin.match(/[a-f\d]{2}/gi).map(v=>parseInt(v,16)),dark=colors.dark||'#'+rgb.map(v=>Math.round(v*.72).toString(16).padStart(2,'0')).join('');const grad=ctx.createLinearGradient(60,60,265,240);grad.addColorStop(0,colors.light);grad.addColorStop(.40,colors.skin);grad.addColorStop(1,dark);fill(ctx,path,grad);ctx.save();ctx.clip(path);
 const shades=['#ffffff16','#00000008','#ffffff09','#0000000c'];for(let y=55,row=0;y<280;y+=48,row++)for(let x=18,col=0;x<290;x+=55,col++){const p=new Path2D(`M${x} ${y}L${x+55} ${y+11}L${x+23} ${y+57}Z`);fill(ctx,p,shades[(row*3+col)%4]);}ctx.restore();}
function stem(ctx,id){ctx.strokeStyle='#876747';ctx.lineWidth=8;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(150,id==='pear'?55:77);ctx.quadraticCurveTo(142,40,158,30);ctx.stroke();const leaf=new Path2D('M152 49Q185 12 212 36Q202 65 152 49');surface(ctx,leaf,{skin:'#729c52',light:'#aac268'});}
function seeds(ctx,points,color='#80563f'){ctx.fillStyle=color;for(const [x,y,a]of points){ctx.save();ctx.translate(x,y);ctx.rotate(a||0);ctx.beginPath();ctx.ellipse(0,0,3.5,7,0,0,TAU);ctx.fill();ctx.restore();}}
function flesh(ctx,id,path){ctx.save();ctx.clip(path);const f=fruits[id];ctx.fillStyle=f.inside;ctx.fillRect(0,0,300,300);
 if(id==='apple'||id==='pear'){ctx.fillStyle='#efcf92';ctx.beginPath();ctx.ellipse(150,174,id==='pear'?22:27,52,0,0,TAU);ctx.fill();seeds(ctx,[[140,155,-.3],[160,155,.3],[140,182,-.3],[160,182,.3]]);}
 if(id==='orange'){ctx.strokeStyle='#ffe3aa';ctx.lineWidth=6;for(let i=0;i<10;i++){const a=i*TAU/10;ctx.beginPath();ctx.moveTo(150,167);ctx.lineTo(150+106*Math.cos(a),167+106*Math.sin(a));ctx.stroke();}ctx.fillStyle='#ffe8b8';ctx.beginPath();ctx.arc(150,167,10,0,TAU);ctx.fill();}
 if(id==='watermelon'){seeds(ctx,[[73,158,-.5],[107,124,.3],[143,174,.1],[181,122,-.1],[224,166,.5],[118,223,.1],[198,222,-.4]],'#654849');}
 if(id==='tomato'){for(let i=0;i<5;i++){const a=i*TAU/5;ctx.save();ctx.translate(150+48*Math.cos(a),177+48*Math.sin(a));ctx.rotate(a);ctx.fillStyle='#db4e40';ctx.beginPath();ctx.ellipse(0,0,25,35,0,0,TAU);ctx.fill();ctx.fillStyle='#f6c67c';for(let j=0;j<3;j++){ctx.beginPath();ctx.ellipse(j*7-7,0,2,4,0,0,TAU);ctx.fill();}ctx.restore();}ctx.fillStyle='#f3b879';ctx.beginPath();ctx.arc(150,177,15,0,TAU);ctx.fill();}
 if(id==='carrot'){ctx.fillStyle='#cf893d';ctx.beginPath();ctx.ellipse(150,116,22,15,0,0,TAU);ctx.fill();}
 ctx.restore();ctx.strokeStyle=id==='watermelon'?'#a4bf77':'#f2d4a1';ctx.lineWidth=id==='watermelon'?12:6;ctx.stroke(path);
}
function draw(ctx,id,p,w,h){const f=fruits[id];if(!f)return;ctx.save();ctx.scale(w/300,h/300);const path=new Path2D(f.path),open=ease((p-.12)/.22)*ease((1-p)/.20);
 if(id==='banana'){surface(ctx,path,f);ctx.save();ctx.clip(path);ctx.globalAlpha=open;fill(ctx,path,f.inside);ctx.restore();if(open){for(const side of [-1,1]){ctx.save();ctx.translate(147,160);ctx.rotate(side*.40*open);ctx.translate(-147,-160);surface(ctx,new Path2D(side<0?'M64 110Q40 210 91 264L121 253Q65 206 84 119Z':'M174 201Q229 188 260 243L248 261Q218 222 181 227Z'),f);ctx.restore();}}}
 else{for(const side of [-1,1]){ctx.save();ctx.translate(side*24*open,0);ctx.beginPath();ctx.rect(side<0?0:150,0,150,300);ctx.clip();surface(ctx,path,f);if(open){ctx.globalAlpha=open;flesh(ctx,id,path);ctx.globalAlpha=1;}ctx.restore();}}
 ctx.save();if(id!=='banana')ctx.translate(-24*open,0);
 if(['apple','pear','orange'].includes(id))stem(ctx,id);
 if(id==='tomato'){const leaves=new Path2D('M150 87L109 66L131 92L103 108L143 105L159 125L166 101L201 108L178 91L190 72L162 82L155 60Z');surface(ctx,leaves,{skin:'#63884d',light:'#9cb55c'});}
 if(id==='carrot'){for(const [x,y]of [[100,36],[147,19],[189,39]]){ctx.strokeStyle='#638c50';ctx.lineWidth=9;ctx.beginPath();ctx.moveTo(150,96);ctx.lineTo(x,y);ctx.stroke();}for(const x of [110,156,185]){ctx.fillStyle='#91b369';ctx.beginPath();ctx.ellipse(x,41,10,28,.3,0,TAU);ctx.fill();}}
 ctx.restore();
 if(id==='watermelon'&&open<1){ctx.save();ctx.clip(path);ctx.globalAlpha=1-open;ctx.strokeStyle='#346846';ctx.lineWidth=13;for(const x of [60,113,174,231]){ctx.beginPath();ctx.moveTo(x,68);ctx.bezierCurveTo(x-22,130,x+23,204,x-3,280);ctx.stroke();}ctx.restore();}
 ctx.restore();
}
g.StoryObjects={fruits,draw,opening:p=>ease((p-.12)/.22)*ease((1-p)/.20),poster(id){const c=document.createElement('canvas');c.width=c.height=720;draw(c.getContext('2d'),id,0,720,720);return c.toDataURL('image/png');}};
})(window);
