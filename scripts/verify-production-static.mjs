// Local build experiment only: no release directory, ZIP, account or deployment.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {spawn,spawnSync} from 'node:child_process';
const output='.checkpoints/production-static-audit';
const build=spawnSync(process.execPath,['deployment/cloudflare/build-static.mjs',output],{windowsHide:true,encoding:'utf8',timeout:180000});
fs.writeFileSync('.checkpoints/production-static-build.log',(build.stdout??'')+(build.stderr??''));assert.equal(build.status,0,'Local static build failed');
for(const[region,total]of[['ajloun',143],['northern-jordan',6859]]){
 const m=JSON.parse(fs.readFileSync(output+'/archive-data/'+region+'.json'));assert.equal(m.metadata.totalDelivered,total);assert.equal(m.features.length,0);
 let count=0;const ids=new Set();for(const [year,route]of Object.entries(m.metadata.yearPaths)){const j=JSON.parse(fs.readFileSync(output+route));assert.equal(j.features.length,m.metadata.yearCounts[year]);for(const f of j.features){assert.ok(!ids.has(f.id));ids.add(f.id);assert.ok(f.properties.date.startsWith(year));}count+=j.features.length;}assert.equal(count,total);
}
const server=spawn(process.execPath,['deployment/cloudflare/serve-static.mjs',output],{windowsHide:true,stdio:'ignore'});
try{let ready=false;for(let i=0;i<100;i++){try{if((await fetch('http://127.0.0.1:5179/')).ok){ready=true;break;}}catch{}await new Promise(r=>setTimeout(r,100));}assert.ok(ready);
 const run=spawnSync(process.execPath,['scripts/verify-claim-audit.mjs','--origin','http://127.0.0.1:5179'],{windowsHide:true,encoding:'utf8',timeout:180000});fs.writeFileSync('.checkpoints/production-static-browser.log',(run.stdout??'')+(run.stderr??''));assert.equal(run.status,0,'Local immutable static browser failed');
 console.log('PASS local static-only build, 143/6859 unique archived IDs across all years, real Calendar CSV/candidate sensitivity/Research JSON/English/Arabic browser path without Express.');
}finally{server.kill();}
