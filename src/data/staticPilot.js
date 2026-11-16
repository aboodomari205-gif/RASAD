import demo from '../../deployment/cloudflare/demo-worker.js';
import {requireJSONResponse,readJSONResponse} from '../../shared/jsonResponse.js';
// Same read-only scientific adapter as Pages, executed locally in the browser.
// Static builds never issue API requests; full backend builds retain native fetch.
export function installStaticPilot(){
 const originalFetch=globalThis.fetch.bind(globalThis);
 const assets={fetch:async request=>{
  const response=await originalFetch(request,{cache:'no-store'});
  if(new URL(request.url).pathname!=='/rasad-data/brazil-pilot-aug2024.json')return response;
  requireJSONResponse(response,'/rasad-data/brazil-pilot-aug2024.json');
  const bytes=await response.arrayBuffer(),manifestResponse=await originalFetch('/rasad-data/manifest.json',{cache:'no-store'});
  const manifest=await readJSONResponse(manifestResponse,'/rasad-data/manifest.json'),digest=await crypto.subtle.digest('SHA-256',bytes),hash=Array.from(new Uint8Array(digest),b=>b.toString(16).padStart(2,'0')).join('');
  if(hash!==manifest.sha256)throw Error('Pilot checksum mismatch');
  return new Response(bytes,{headers:{'Content-Type':'application/json'}});
 }};
 globalThis.fetch=async(input,init)=>{
  const request=new Request(new URL(typeof input==='string'?input:input instanceof URL?input.href:input.url,location.href),input instanceof Request?input:init);
  if(new URL(request.url).origin!==location.origin||!new URL(request.url).pathname.startsWith('/api/'))return originalFetch(input,init);
  if(request.signal.aborted)throw new DOMException('Aborted','AbortError');
  const response=await demo.fetch(request,{ASSETS:assets});
  if(request.signal.aborted)throw new DOMException('Aborted','AbortError');
  return response;
 };
}
