import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
const local=process.env.RASAD_TEST_ORIGIN??'http://localhost:4175';
const nativeFetch=globalThis.fetch;
const source=await fs.readFile('.checkpoints/rasad/pages-worker.js','utf8');
const calls=[];
globalThis.fetch=async(target,options)=>{
  const url=new URL(target);assert.equal(url.origin,'https://rasad-api.invalid');calls.push(url.pathname);
  return nativeFetch(local+url.pathname+url.search,options);
};
let worker;
try{worker=(await import('data:text/javascript,'+encodeURIComponent(source))).default;}finally{globalThis.fetch=nativeFetch;}
const assets={ASSETS:{fetch:async()=>new Response(await fs.readFile('dist/index.html'),{headers:{'Content-Type':'text/html'}})}};
const request=path=>worker.fetch(new Request('https://rasad.pages.dev'+path),assets);
const manifest=await(await request('/api/observations?manifest=1')).json();
assert.ok(manifest.metadata.availableYears.includes('2000'));assert.equal(manifest.features.length,0);
const summary=await(await request('/api/observations?mode=brazil&summary=year')).json();
const reference=await(await nativeFetch(local+'/api/observations?mode=brazil&summary=year')).json();assert.deepEqual(summary,reference);
const grid=await(await request('/api/south-america/grid?mode=brazil&from=2026-11-13&to=2026-11-13')).json();assert.equal(grid.calibration,'NOT_CALIBRATED');assert.equal(grid.sensitivity.length,3);
const response=await request('/api/observations.csv?mode=brazil&sensor=MODIS&from=2026-11-13&to=2026-11-13');
assert.equal(response.status,200);assert.match(response.headers.get('Content-Disposition'),/rasad-/);const csv=await response.text();assert.match(csv,/source_sha256/);assert.doesNotMatch(csv,/ajloun|jordan/i);
assert.equal((await request('/api/observations?mode=ajloun')).status,400);
assert.match(await(await request('/')).text(),/RASAD/);
const result={generation:manifest.metadata.activationRevision,localWorkerExecution:true,hostedCloudflareValidation:false,totalDelivered:manifest.metadata.totalDelivered,yearlySummaryRows:summary.series.length,streamedModisCSVBytes:Buffer.byteLength(csv),routes:calls,passed:true};
await fs.writeFile('.checkpoints/rasad/pages-proof.json',JSON.stringify(result,null,2));console.log(JSON.stringify(result,null,2));
