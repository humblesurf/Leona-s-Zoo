import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
const root=process.cwd();
const previewPort=Number(process.argv[2]||4173);
if(!Number.isInteger(previewPort)||previewPort<1024||previewPort>65535)throw Error('Invalid preview port');
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json','.webp':'image/webp','.png':'image/png','.jpg':'image/jpeg','.mp3':'audio/mpeg','.ogg':'audio/ogg'};
http.createServer((req,res)=>{
  let p;try{p=path.resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname));}catch{res.writeHead(400);res.end();return;}
  if(!p.startsWith(root+path.sep)&&p!==root){res.writeHead(403);res.end();return;}
  if(fs.existsSync(p)&&fs.statSync(p).isDirectory())p=path.join(p,'index.html');
  if(!fs.existsSync(p)){res.writeHead(404);res.end('Not found');return;}
  const stat=fs.statSync(p);res.setHeader('Content-Type',mime[path.extname(p)]||'application/octet-stream');res.setHeader('Accept-Ranges','bytes');
  const range=req.headers.range?.match(/bytes=(\d+)-(\d*)/);
  if(range){const start=+range[1],end=range[2]?Math.min(+range[2],stat.size-1):stat.size-1;if(start>=stat.size){res.writeHead(416);res.end();return;}res.writeHead(206,{'Content-Range':`bytes ${start}-${end}/${stat.size}`,'Content-Length':end-start+1});fs.createReadStream(p,{start,end}).pipe(res);}
  else{res.writeHead(200,{'Content-Length':stat.size});fs.createReadStream(p).pipe(res);}
}).listen(previewPort,'127.0.0.1',()=>console.log(`Leona's ZOO preview http://127.0.0.1:${previewPort}/`));
