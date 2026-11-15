// Source-separated summary snapshot. Full evidence stays in the indexed local API.
import fs from 'node:fs/promises';import path from 'node:path';import{createHash}from'node:crypto';
import{southManifest,southSummary}from'../../server/southAmerica.js';
const root='deployment/static-data',dir=path.resolve(root,'archive-data');
if(path.dirname(dir)!==path.resolve(root))throw Error('Unexpected snapshot target');
await fs.mkdir('.checkpoints/south-america',{recursive:true});
try{await fs.cp(dir,'.checkpoints/south-america/previous-static-archive',{recursive:true});}catch(e){if(e.code!=='ENOENT')throw e;}
await fs.rm(dir,{recursive:true,force:true});await fs.mkdir(dir,{recursive:true});
const files={},regions={};let revision;
for(const region of ['south-america','brazil']){
 const manifest=southManifest({mode:region});revision??=manifest.metadata.activationRevision;if(revision!==manifest.metadata.activationRevision)throw Error('Mixed generations');regions[region]=manifest.metadata.totalDelivered;
 const outputs={[region+'.json']:manifest};for(const period of['year','month','day'])outputs[region+'/summaries-'+period+'.json']=southSummary({mode:region,summary:period});
 for(const[name,value]of Object.entries(outputs)){const target=path.join(dir,name);await fs.mkdir(path.dirname(target),{recursive:true});const bytes=Buffer.from(JSON.stringify(value));await fs.writeFile(target,bytes);files['archive-data/'+name]={bytes:bytes.length,sha256:createHash('sha256').update(bytes).digest('hex')};}
}
await fs.writeFile(root+'/index.json',JSON.stringify({schema:'firepulse.static-snapshot/v2',purpose:'Summaries only; interactive evidence requires the indexed same-origin API.',revision,regions,files},null,2));console.log('Prepared South America summaries; no Jordan records or raw archives.');
