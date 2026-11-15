import test from 'node:test';
import assert from 'node:assert/strict';
import {createServer} from 'vite';

test('development same-origin API serves Brazil only without a standalone backend',async()=>{
 const vite=await createServer({envDir:false,cacheDir:'.checkpoints/runtime-dev-fix/vite-unit-cache',server:{host:'127.0.0.1',port:0,strictPort:false}});
 try{
  await vite.listen();const port=(vite.httpServer!.address() as {port:number}).port;
  for(const region of ['brazil']){
   const response=await fetch(`http://127.0.0.1:${port}/api/observations?mode=${region}&manifest=1`);
   assert.equal(response.status,200);const manifest=await response.json();assert.equal(manifest.metadata.mode,region);assert.ok(manifest.metadata.totalDelivered>0);assert.equal(manifest.features.length,0);assert.equal(manifest.metadata.scalable,true);
   const year=manifest.metadata.availableYears[0];const evidence=await(await fetch(`http://127.0.0.1:${port}/api/observations?mode=${region}&year=${year}&limit=5`)).json();assert.ok(evidence.features.length<=5);assert.ok(evidence.features.every((f:{properties:{date:string}})=>f.properties.date.startsWith(year)));assert.equal(evidence.metadata.activationRevision,manifest.metadata.activationRevision);
  }
  assert.equal((await fetch(`http://127.0.0.1:${port}/api/observations?mode=south-america&manifest=1`)).status,400);
  assert.equal((await fetch(`http://127.0.0.1:${port}/api/observations?mode=ajloun`)).status,400);
 }finally{await vite.close();}
});
