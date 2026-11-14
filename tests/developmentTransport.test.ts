import test from 'node:test';
import assert from 'node:assert/strict';
import {createServer} from 'vite';

test('development same-origin API serves activated regions without a standalone backend',async()=>{
 const vite=await createServer({envDir:false,cacheDir:'.checkpoints/runtime-dev-fix/vite-unit-cache',server:{host:'127.0.0.1',port:0,strictPort:false}});
 try{
  await vite.listen();
  const port=(vite.httpServer!.address() as {port:number}).port;
  for(const [region,total,latest]of [['ajloun',143,10],['northern-jordan',6859,803]] as const){
   for(const [suffix,count]of [['manifest=1',0],['year=2026',latest]] as const){
    const response=await fetch(`http://127.0.0.1:${port}/api/observations?mode=${region}&${suffix}`);
    assert.equal(response.status,200);assert.match(response.headers.get('content-type')!,/application\/json/);
    const json=await response.json();assert.equal(json.metadata.mode,region);assert.equal(json.metadata.totalDelivered,total);assert.equal(json.features.length,count);assert.equal(json.metadata.availability.state,'loaded');assert.equal(json.metadata.availability.coverage,'unknown');
    if(!count)assert.match(json.metadata.yearPaths['2021'],/\/api\/observations\?mode=/);
   }
  }
  const response=await fetch(`http://127.0.0.1:${port}/api/observations?mode=northern-jordan&year=2021`);const json=await response.json();assert.equal(json.features.length,591);assert.ok(json.features.some(f=>f.properties.date==='2021-07-01'));
 }finally{await vite.close();}
});
