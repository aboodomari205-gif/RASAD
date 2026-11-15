import fs from'node:fs/promises';import{build}from'vite';
import {pagesWorkerSource} from './api-proxy.mjs';
const value=process.env.RASAD_DATA_API_ORIGIN??process.env.FIREPULSE_DATA_API_ORIGIN;if(!value)throw Error('Brazil requires its indexed read-only API. Use npm run build && npm run serve locally, or configure RASAD_DATA_API_ORIGIN for Pages. No legacy fallback is packaged.');
const origin=new URL(value);if(origin.protocol!=='https:'||origin.username||origin.password||origin.pathname!=='/'||origin.search||origin.hash)throw Error('Use a plain HTTPS data API origin');
await build({envPrefix:[],build:{outDir:'dist',emptyOutDir:true}});
await fs.writeFile('dist/_worker.js',pagesWorkerSource(origin.origin));
await fs.writeFile('dist/_routes.json',JSON.stringify({version:1,include:['/api/*'],exclude:[]}));
console.log('Pages client and streaming read-only API Worker prepared; no deployment performed.');
