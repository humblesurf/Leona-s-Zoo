const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'Leonas-Zoo-v8.3.html'), 'utf8');
const noop = () => {};
const node = () => new Proxy({style:{},dataset:{},classList:{add:noop,remove:noop,toggle:noop},append:noop,appendChild:noop,setAttribute:noop,addEventListener:noop}, {get:(o,k)=>k in o?o[k]:noop});
const context = {console,URLSearchParams,Image:class{}, Audio:class{}, matchMedia:()=>({matches:false,addEventListener:noop}), document:{createElement:node,createElementNS:node,head:node(),addEventListener:noop},addEventListener:noop, setTimeout:noop,clearTimeout:noop,requestAnimationFrame:noop,cancelAnimationFrame:noop,performance:{now:()=>0}};
context.window=context; context.globalThis=context;
vm.createContext(context);
for (const match of html.matchAll(/<script src="([^"?]+)(?:\?[^"]*)?"/g)) {
  if (/assets\/game(?:-v8-[23])?\.js$/.test(match[1])) break;
  vm.runInContext(fs.readFileSync(path.join(root,match[1]),'utf8'),context,{filename:match[1]});
}
if(process.argv[2]==='all') console.log(JSON.stringify({order:context.GAME_SCENE_ORDER,scenes:context.GAME_SCENES,animations:context.ANIMAL_ANIMATIONS,dialogue:context.GAME_DIALOGUE,recordings:context.CALL_RECORDINGS},null,2));
else for(const id of process.argv.slice(2))console.log(JSON.stringify({id,...context.GAME_SCENES[id],backgroundHerds:undefined},null,2));
