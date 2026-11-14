// Run against scripts/serve-production-audit.mjs, never a public deployment.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
const origin='http://127.0.0.1:5187';const results=[];
const pointer=JSON.parse(fs.readFileSync('server/data/active-history.json','utf8'));
const db='server/data/'+pointer.filename;
const digest=()=>createHash('sha256').update(fs.readFileSync(db)).digest('hex');const before=digest();
const leak=/(?:[A-Z]:[\\/](?:Users|home)[\\/]|file:\/\/\/|\/Users\/|\/home\/[^ /"\\]+\/|FIRMS_MAP_KEY\s*[:=]\s*["'][^"']{12,})/i;
async function get(route,{status=200,json=true}={}){const t=performance.now();const r=await fetch(origin+route,{redirect:'error'});const raw=await r.text();results.push({route,status:r.status,bytes:Buffer.byteLength(raw),milliseconds:performance.now()-t});assert.equal(r.status,status,route);if(json){assert.match(r.headers.get('content-type'),/json/);assert.ok(!leak.test(raw),'Internal path or credential-shaped output: '+route);return JSON.parse(raw);}return raw;}
assert.match(await get('/',{json:false}),/<div id="root">/);assert.match(await get('/mission',{json:false}),/<div id="root">/);
const html=await get('/mission-atlas',{json:false});for(const asset of [...html.matchAll(/(?:src|href)="(\/assets\/[^"?]+)"/g)].map(m=>m[1]))await get(asset,{json:false});
assert.equal((await get('/api/health')).project,'FIREPULSE');assert.equal((await get('/jordan-adm1.geojson')).type,'FeatureCollection');
for(const [region,total,latest]of [['ajloun',143,10],['northern-jordan',6859,803]]){
 const manifest=await get('/api/observations?mode='+region+'&manifest=1');assert.equal(manifest.metadata.totalDelivered,total);assert.equal(manifest.features.length,0);assert.equal(manifest.metadata.activationRevision,pointer.revision);assert.equal(manifest.metadata.availability.coverage,'unknown');
 let count=0;for(const [year,p]of Object.entries(manifest.metadata.yearPaths)){const shard=await get(p);assert.equal(shard.features.length,manifest.metadata.yearCounts[year]);assert.ok(shard.features.every(f=>f.properties.date.startsWith(year)));count+=shard.features.length;}assert.equal(count,total);
 assert.equal((await get('/api/observations?mode='+region)).features.length,latest);
 for(const sensor of ['MODIS','VIIRS']){
  const rows=await get('/api/history/observations?region='+region+'&sensor='+sensor+'&from=2023-01-01&to=2023-12-31');assert.ok(rows.observations.length);assert.ok(rows.observations.every(o=>o.sensor===sensor));
 }
 for(const resource of ['datasets','coverage','comparison','aggregates']){const x=await get('/api/history/'+resource+'?region='+region+'&from=2023-01-01&to=2023-12-31');assert.equal(x.availability.coverage,'unknown');if(resource==='coverage')assert.equal(x.coverageStatus,'unknown');}
 for(const period of ['year','month','day'])assert.ok((await get('/api/observations?mode='+region+'&summary='+period)).series.length);
 // Deliberately measure broad canonical response: may exceed a serverless body limit.
 await get('/api/history/observations?region='+region);
}
await get('/api/history/observations?region=../../etc/passwd',{status:400});await get('/api/history/observations?region=ajloun&unexpected=1',{status:400});await get('/api/observations?mode=ajloun&year=oops',{status:400});await get('/api/unknown',{status:404});
await get('/server/data/active-history.json',{status:404,json:false});await get('/docs/SCIENTIFIC_DATA_AUDIT.json',{status:404,json:false});await get('/.env',{status:404,json:false});
assert.equal((await fetch(origin+'/api/history/observations',{headers:{Origin:'https://untrusted.invalid'}})).headers.get('access-control-allow-origin'),null);
assert.equal(digest(),before,'SQLite changed during production requests');
fs.mkdirSync('.checkpoints',{recursive:true});fs.writeFileSync('.checkpoints/production-http.json',JSON.stringify({node:process.version,revision:pointer.revision,sqliteBytes:fs.statSync(db).size,sqliteSHA256:before,unchanged:true,results},null,2));
console.log('PASS local production API/SPA/assets, every activated year and exact totals, filters, summaries, coverage, validation, output path scan and immutable SQLite hash.');
