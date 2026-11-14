import fs from'node:fs';import{spawn,spawnSync}from'node:child_process';
const env={NODE_ENV:'production'};for(const k of['SystemRoot','WINDIR','PATH','Path','TEMP','TMP'])if(process.env[k])env[k]=process.env[k];
const server=spawn(process.execPath,['scripts/serve-production-audit.mjs'],{env,windowsHide:true,stdio:'ignore'});const results=[];
try{let ready=false;for(let i=0;i<100;i++){try{if((await fetch('http://127.0.0.1:5187/api/health')).ok){ready=true;break;}}catch{}await new Promise(r=>setTimeout(r,100));}if(!ready)throw Error('Production API failed to start');
for(const[name,command]of[['http','node scripts/verify-production-audit.mjs'],['activation-http','npm run verify:deployment -- http://127.0.0.1:5187'],['claims','node scripts/verify-claim-audit.mjs --origin http://127.0.0.1:5187 --refresh'],['workflows','node scripts/verify-final-workflows.mjs --origin http://127.0.0.1:5187']]){const r=spawnSync(command,{shell:true,windowsHide:true,encoding:'utf8',timeout:180000,maxBuffer:16*1024*1024});fs.writeFileSync('.checkpoints/final-sprint/production-'+name+'.log',(r.stdout??'')+(r.stderr??''));results.push({name,command,exitCode:r.status});console.log(name,r.status===0?'PASS':'FAIL');}
fs.writeFileSync('.checkpoints/final-sprint/production.json',JSON.stringify(results,null,2));if(results.some(r=>r.exitCode!==0))process.exitCode=1;
}finally{server.kill();}
