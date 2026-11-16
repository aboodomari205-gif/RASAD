import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
const root=path.resolve(process.argv[2]??'releases/cloudflare-static-v4-final');
let worker;if(!process.argv.includes('--assets-only'))try{worker=(await import(pathToFileURL(path.join(root,'_worker.js')).href)).default;}catch(e){if(e.code!=='ERR_MODULE_NOT_FOUND')throw e;}
const port=Number(process.env.PORT??5179);
const types={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.json':'application/json','.geojson':'application/geo+json','.css':'text/css','.png':'image/png','.svg':'image/svg+xml','.woff2':'font/woff2'};
async function asset(request){try{const pathname=decodeURIComponent(new URL(request.url).pathname),file=path.resolve(root,'.'+(pathname==='/'?'/index.html':pathname));if(!file.startsWith(root+path.sep))throw Error();return new Response(await fs.readFile(file),{headers:{'Content-Type':types[path.extname(file)]??'application/octet-stream'}});}catch{return new Response('Not found',{status:404});}}
http.createServer(async(req,res)=>{try{const request=new Request(new URL(req.url,'http://127.0.0.1:'+port),{method:req.method});const response=worker?await worker.fetch(request,{ASSETS:{fetch:asset}}):await asset(request);res.writeHead(response.status,Object.fromEntries(response.headers));res.end(Buffer.from(await response.arrayBuffer()));}catch{res.writeHead(500);res.end('Preview failed');}}).listen(port,'127.0.0.1');
