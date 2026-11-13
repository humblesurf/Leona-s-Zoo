const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict'),{execFileSync}=require('node:child_process');
const root=path.resolve(__dirname,'..'),data=JSON.parse(execFileSync(process.execPath,[path.join(__dirname,'inspect-data.cjs'),'all'],{maxBuffer:20e6}));
const code=fs.readFileSync(path.join(root,'assets/v83-layout-store.js'),'utf8'),key='leonas-zoo-v8.3-layout-v1',memory=new Map();let fail=false;
const storage={getItem:k=>memory.get(k)||null,setItem(k,v){if(fail)throw Error('QuotaExceededError');memory.set(k,v);}};
function load(){const context={GAME_SCENES:structuredClone(data.scenes),GAME_SCENE_ORDER:data.order,localStorage:storage,URLSearchParams,document:{documentElement:{dataset:{layoutEditor:'true'}}},location:{search:''}};context.window=context;vm.createContext(context);vm.runInContext(code,context);return context;}
let c=load(),a=c.GAME_SCENES.savanna.animals[0];a.h=.42;a.flip=true;a.userSized=true;const saved=c.V8LayoutStore.save();assert(saved.savedAt);assert.equal(JSON.parse(memory.get(key)).scenes.savanna[0].h,.42);
c=load();a=c.GAME_SCENES.savanna.animals[0];assert.equal(a.h,.42);assert.equal(a.flip,true);assert.equal(a.userSized,true);assert(c.V8LayoutStore.lastSavedAt);
const prior=memory.get(key);fail=true;assert.throws(()=>c.V8LayoutStore.save(),/QuotaExceeded/);assert.equal(memory.get(key),prior);fail=false;
const old=JSON.parse(prior);delete old.savedAt;for(const list of Object.values(old.scenes))for(const row of list)delete row.userSized;memory.set(key,JSON.stringify(old));c=load();assert.equal(c.GAME_SCENES.savanna.animals[0].h,.42);assert.equal(c.GAME_SCENES.savanna.animals[0].userSized,false);assert.equal(c.V8LayoutStore.loadError,'');
console.log('PASS: existing V8.3 layouts remain readable; direct-resize geometry and flip survive save/reload; failed writes preserve the previous layout.');
