import fs from'node:fs/promises';import{build}from'vite';
import {pagesWorkerSource} from './api-proxy.mjs';
import {prepareDemo} from './prepare-demo.mjs';
const value=process.env.RASAD_DATA_API_ORIGIN??process.env.FIREPULSE_DATA_API_ORIGIN;
const origin=value?new URL(value):null;if(origin&&(origin.protocol!=='https:'||origin.username||origin.password||origin.pathname!=='/'||origin.search||origin.hash))throw Error('Use a plain HTTPS data API origin');
await build({envPrefix:[],define:{__RASAD_LIMITED_DEMO__:JSON.stringify(!origin)},build:{outDir:'dist',emptyOutDir:true}});
if(origin)await fs.writeFile('dist/_worker.js',pagesWorkerSource(origin.origin));
else {
 await prepareDemo();
 await build({configFile:false,publicDir:false,build:{outDir:'.checkpoints/pages-worker',emptyOutDir:true,lib:{entry:'deployment/cloudflare/demo-worker.js',formats:['es'],fileName:()=> '_worker.js'},minify:true}});
 await fs.copyFile('.checkpoints/pages-worker/_worker.js','dist/_worker.js');
}
await fs.writeFile('dist/_routes.json',JSON.stringify({version:1,include:['/api/*'],exclude:[]}));
console.log(`Pages ${origin?'remote read-only API':'authentic limited-data demo'} prepared; no deployment performed.`);
