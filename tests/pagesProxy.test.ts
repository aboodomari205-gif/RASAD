import test from 'node:test';
import assert from 'node:assert/strict';
import {createPagesProxy,pagesWorkerSource} from '../deployment/cloudflare/api-proxy.mjs';

test('Pages Worker preserves API filters and streamed CSV without forwarding browser credentials',async()=>{
 let target='',options:RequestInit|undefined;
 const worker=createPagesProxy('https://rasad-api.example/',{fetchImpl:async(url:URL,init:RequestInit)=>{target=String(url);options=init;return new Response(new ReadableStream({start(c){c.enqueue(new TextEncoder().encode('source,count\n'));c.enqueue(new TextEncoder().encode('MODIS,12\n'));c.close();}}),{headers:{'Content-Type':'text/csv','Content-Disposition':'attachment; filename="rasad.csv"'}});}});
 const response=await worker.fetch(new Request('https://rasad.pages.dev/api/observations.csv?mode=brazil&from=2026-11-13',{headers:{Cookie:'private=secret',Authorization:'Bearer private',Accept:'text/csv'}}),{});
 assert.equal(target,'https://rasad-api.example/api/observations.csv?mode=brazil&from=2026-11-13');
 assert.deepEqual(options?.headers,{Accept:'text/csv'});assert.equal(options?.redirect,'manual');
 assert.equal(await response.text(),'source,count\nMODIS,12\n');assert.equal(response.headers.get('Content-Disposition'),'attachment; filename="rasad.csv"');assert.equal(response.headers.get('Cache-Control'),'no-store');
});
test('Pages Worker handles static assets, read-only requests and failures without fallback data',async()=>{
 let calls=0,target='';const worker=createPagesProxy('https://api.example',{fetchImpl:async(url:URL)=>{calls++;target=String(url);throw Error('private upstream detail');}});
 assert.equal((await worker.fetch(new Request('https://rasad.pages.dev/api/south-america/grid',{method:'POST'}),{})).status,405);assert.equal(calls,0);
 assert.equal((await worker.fetch(new Request('https://rasad.pages.dev/api/observations?mode=argentina'),{})).status,400);assert.equal(calls,0);
 const failed=await worker.fetch(new Request('https://rasad.pages.dev/api/observations'),{});assert.equal(failed.status,503);assert.doesNotMatch(await failed.text(),/private|ajloun|jordan/i);
 assert.equal(target,'https://api.example/api/observations?mode=brazil');
 const asset=await worker.fetch(new Request('https://rasad.pages.dev/assets/main.js'),{ASSETS:{fetch:async()=>new Response('asset')}});assert.equal(await asset.text(),'asset');
 for(const origin of ['http://api.example','https://a:b@api.example','https://api.example/path','https://api.example/?secret=1'])assert.throws(()=>createPagesProxy(origin));
});
test('emitted Pages advanced-mode module is self-contained and routes through ASSETS',async()=>{
 const source=pagesWorkerSource('https://api.example');assert.doesNotMatch(source,/node:|sqlite|_redirects/);
 const {default:worker}=await import('data:text/javascript,'+encodeURIComponent(source));
 const response=await worker.fetch(new Request('https://rasad.pages.dev/'),{ASSETS:{fetch:async()=>new Response('RASAD')}});assert.equal(await response.text(),'RASAD');
});
