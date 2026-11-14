// GitHub/Cloudflare build: only frontend dependencies plus reviewed, pre-generated JSON.
import fs from'node:fs/promises';import{build}from'vite';import{verifyPrepared}from'./prepared.mjs';
await verifyPrepared('deployment/static-data');let replaced=false;
await build({envPrefix:[],build:{outDir:'dist',emptyOutDir:true},plugins:[{name:'immutable-public-observation-transport',enforce:'pre',transform(code,id){if(id.replaceAll('\\','/').endsWith('/src/data/observations.ts')){const before='`/api/observations?mode=${encodeURIComponent(region)}`';if(!code.includes(before))throw Error('Observation transport changed; static adapter requires review');replaced=true;return code.replace(before,'`/archive-data/${encodeURIComponent(region)}.json?static=1`');}}}]});
if(!replaced)throw Error('Static transport not compiled');await fs.cp('deployment/static-data/archive-data','dist/archive-data',{recursive:true});await fs.copyFile('deployment/static-data/index.json','dist/archive-data-index.json');
await fs.writeFile('dist/_headers','/archive-data/*\n  Cache-Control: public, max-age=0, must-revalidate\n  X-Content-Type-Options: nosniff\n/archive-data-index.json\n  Cache-Control: no-cache\n');
await verifyPrepared('dist',{index:'archive-data-index.json'});console.log('Pages-ready: dist; immutable historical JSON; no server, credentials, Functions or Worker runtime.');
