// Local-only production simulation. Never loads dotenv or serves the repository.
import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import handler from '../api/[...path].js';
const root=path.resolve(fileURLToPath(new URL('../dist/',import.meta.url)));
const types={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.json':'application/json','.geojson':'application/geo+json','.css':'text/css','.png':'image/png','.svg':'image/svg+xml','.woff2':'font/woff2'};
const server=http.createServer(async(req,res)=>{
 if(req.url?.split('?')[0].startsWith('/api/'))return handler(req,res);
 try {
  const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
  const file=path.resolve(root,'.'+(pathname==='/'?'/index.html':pathname));
  if(!file.startsWith(root+path.sep))throw Error('Outside static root');
  let bytes;let ext=path.extname(file);
  try{bytes=await fs.readFile(file);}catch(error){if(error.code!=='ENOENT'||ext||pathname.includes('.'))throw error;bytes=await fs.readFile(path.join(root,'index.html'));ext='.html';}
  res.writeHead(200,{'Content-Type':types[ext]??'application/octet-stream','X-Content-Type-Options':'nosniff'});res.end(bytes);
 } catch {res.writeHead(404,{'Content-Type':'text/plain'});res.end('Not found');}
});
server.listen(5187,'127.0.0.1',()=>console.log('Local production simulation http://127.0.0.1:5187 (dist + actual API entrypoint; not Vercel emulation)'));
for(const signal of ['SIGINT','SIGTERM'])process.on(signal,()=>server.close(()=>process.exit()));


