// Local real-data acceptance and timing; credentials and the server entrypoint are not used.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createApp} from '../server/app.js';
const app=createApp({key:()=>undefined,remoteOrigin:()=>undefined});
const server=app.listen(0,'127.0.0.1');await new Promise(resolve=>server.once('listening',resolve));
const origin='http://127.0.0.1:'+server.address().port;
const results=[];
try {
 for(const [region,total,latest] of [['ajloun',143,10],['northern-jordan',6859,803]]) {
  for(const [suffix,expected] of [['&manifest=1',0],['&year=2026',latest],['',latest]]) {
   const path='/api/observations?mode='+region+suffix,times=[];let json;
   for(let i=0;i<10;i++){const before=performance.now(),response=await fetch(origin+path);assert.equal(response.status,200);json=await response.json();times.push(performance.now()-before);}
   assert.equal(json.features.length,expected);assert.equal(json.metadata.totalDelivered,total);assert.equal(json.metadata.availability.coverage,'unknown');
   times.sort((a,b)=>a-b);results.push({path,count:expected,totalDelivered:total,medianMs:times[5],minMs:times[0],maxMs:times.at(-1)});
  }
  const response=await fetch(origin+'/api/history/aggregates?region='+region+'&from=2026-01-01&to=2026-12-31&period=year');
  assert.equal(response.status,200);const body=await response.json();assert.ok(body.series.length);assert.ok(body.series.every(s=>s.periods.every(p=>p.status==='observed'||p.status==='unavailable')));
 }
 fs.writeFileSync('.checkpoints/historical-api-performance.json',JSON.stringify(results,null,2));
 console.log('PASS actual HTTP JSON: Ajloun 143 / default 10; Northern Jordan 6859 / default 803; manifests, indexed UTC years, source-separated aggregates; coverage unknown.');
} finally {await new Promise(resolve=>server.close(resolve));}
