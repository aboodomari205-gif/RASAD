// Local-only export of already activated regional observations. Never imported by the cloud build.
import fs from'node:fs/promises';import{spawnSync}from'node:child_process';import{createHash}from'node:crypto';
const temp='.checkpoints/pages-data-export',destination='deployment/static-data';await fs.mkdir('.checkpoints',{recursive:true});
const r=spawnSync(process.execPath,['deployment/cloudflare/build-static.mjs',temp],{windowsHide:true,stdio:'inherit'});if(r.status!==0)throw Error('Local archive export failed');
await fs.mkdir(destination,{recursive:true});await fs.cp(temp+'/archive-data',destination+'/archive-data',{recursive:true});
const files={};async function list(dir){for(const e of await fs.readdir(dir,{withFileTypes:true})){const p=dir+'/'+e.name;if(e.isDirectory())await list(p);else{const b=await fs.readFile(p);files[p.slice(destination.length+1)]={bytes:b.length,sha256:createHash('sha256').update(b).digest('hex')};}}}await list(destination+'/archive-data');
const manifests=await Promise.all(['ajloun','northern-jordan'].map(async region=>JSON.parse(await fs.readFile(destination+'/archive-data/'+region+'.json','utf8'))));
if(new Set(manifests.map(m=>m.metadata.activationRevision)).size!==1)throw Error('Mixed revisions');
await fs.writeFile(destination+'/index.json',JSON.stringify({schema:'firepulse.static-snapshot/v1',revision:manifests[0].metadata.activationRevision,regions:Object.fromEntries(manifests.map(m=>[m.metadata.mode,m.metadata.totalDelivered])),files},null,2));
console.log('Prepared public regional JSON only. Review and include deployment/static-data in the future Git commit; raw archives/SQLite stay local.');
