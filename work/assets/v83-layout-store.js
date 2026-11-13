/* Layout data is shared by the play and edit entrances; scenery is immutable. */
(function(g){
 'use strict';
 const key='leonas-zoo-v8.3-layout-v1',scenes=g.GAME_SCENES,order=g.GAME_SCENE_ORDER;
 const clone=x=>JSON.parse(JSON.stringify(x));
 const defaults=Object.fromEntries(order.map(sid=>[sid,clone(scenes[sid].animals)]));
 const templates={};for(const list of Object.values(defaults))for(const a of list)if(!a.embedded&&!templates[a.id])templates[a.id]=clone(a);
 for(const sid of order)scenes[sid].fixedEnvironment=clone(defaults[sid].filter(a=>a.browseTree||a.support||(!a.dryShore&&['otter','flamingo'].includes(a.id))));
 function snapshot(){return {format:'leonas-zoo-v8-layout',version:1,edition:'8.3',scenes:Object.fromEntries(order.map(sid=>[sid,scenes[sid].animals.map(a=>({id:a.id,instance:a.instance,template:a.template,u:a.u,h:a.h,feetY:a.feetY,flip:!!a.flip,userSized:!!a.userSized,habitat:a.habitat||'auto'}))]))};}
 function decode(input){
  if(input?.format!=='leonas-zoo-v8-layout'||input.version!==1||!input.scenes)throw Error('这不是 V8 布局文件');
  const result={};for(const [sid,list]of Object.entries(input.scenes)){
   if(!order.includes(sid))continue;if(!Array.isArray(list)||list.length>300)throw Error('布局里的动物数量不正确');
   const ids=new Set();result[sid]=list.map(row=>{
    const original=Object.values(defaults).flat().find(a=>a.instance===(row.template||row.instance)),base=original?.id===row.id?original:templates[row.id];
    if(!base||typeof row.instance!=='string'||row.instance.length>120||ids.has(row.instance))throw Error('布局里有不认识或重复的动物');
    for(const [name,min,max]of [['u',0,1],['h',.005,.8],['feetY',.05,1]])if(!Number.isFinite(row[name])||row[name]<min||row[name]>max)throw Error('布局里的位置或大小不正确');
    ids.add(row.instance);return {...clone(base),id:row.id,instance:row.instance,u:row.u,h:row.h,feetY:row.feetY,flip:!!row.flip,userSized:row.userSized===true,habitat:['auto','land','water'].includes(row.habitat)?row.habitat:'auto',layoutPosition:true};
   });
   if(input.edition!=='8.3')result[sid].push(...clone(defaults[sid].filter(a=>a.instance.startsWith('v83-'))));
  }return result;
 }
 const editing=document.documentElement?.dataset.layoutEditor==='true'||new URLSearchParams(g.location?.search||'').get('edit')==='1';
 if(editing&&document.documentElement)document.documentElement.dataset.layoutEditor='true';
 let loadError='',lastSavedAt='';
 if(editing){try{const saved=localStorage.getItem(key);if(saved)lastSavedAt=JSON.parse(saved).savedAt||'';if(saved)for(const [sid,list]of Object.entries(decode(JSON.parse(saved))))scenes[sid].animals=list;}catch(e){loadError='保存的布局未能读取，已显示原布局。';}}
 else if(g.V8_OFFICIAL_LAYOUT){try{for(const [sid,list]of Object.entries(decode(g.V8_OFFICIAL_LAYOUT)))scenes[sid].animals=list;}catch(e){loadError='正式布局未能读取，已显示原布局。';}}
 g.V8LayoutStore={key,defaults,templates,clone,decode,snapshot,loadError,editing,lastSavedAt,
  normalizeRendered(){for(const sid of order)for(const a of scenes[sid].animals)if(!a.layoutPosition){a.u=a.renderU??a.u;a.layoutPosition=true;}},
  save(){const savedAt=new Date().toISOString(),data=JSON.stringify({...snapshot(),savedAt});localStorage.setItem(key,data);if(localStorage.getItem(key)!==data)throw Error('保存校验失败');this.lastSavedAt=savedAt;return {savedAt};}
 };
})(window);
