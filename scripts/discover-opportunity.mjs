// Public catalog metadata only; no tokens, observation downloads or coverage inference.
import fs from 'node:fs';import {createHash}from'node:crypto';
const out='.checkpoints/scientific-completion';fs.mkdirSync(out,{recursive:true});
const shape=JSON.parse(fs.readFileSync('public/jordan-adm1.geojson')).features.find(f=>f.properties.shapeName==='Ajloun').geometry;
const points=shape.coordinates.flat(shape.type==='MultiPolygon'?2:1);const bbox=[Math.min(...points.map(p=>p[0])),Math.min(...points.map(p=>p[1])),Math.max(...points.map(p=>p[0])),Math.max(...points.map(p=>p[1]))];
async function small(url){const r=await fetch(url,{signal:AbortSignal.timeout(30000),redirect:'error'});if(!r.ok)throw Error('CMR HTTP '+r.status);const reader=r.body.getReader();let bytes=0;const chunks=[];for(;;){const x=await reader.read();if(x.done)break;bytes+=x.value.length;if(bytes>2*1024*1024){await reader.cancel();throw Error('Metadata exceeds 2 MiB budget');}chunks.push(x.value);}return Buffer.concat(chunks);}
const evidence={method:'public-cmr-granule-discovery/v1',scope:'Ajloun bounding-box search only; NOT verified polygon coverage or valid pixels',date:'2023-07-14',bbox,products:[],coverage:null,sensitivityCalibration:null};
for(const [shortName,version,platform]of[['MYD14','061','Aqua'],['VNP14IMG','002','S-NPP']]){
 const query=new URL('https://cmr.earthdata.nasa.gov/search/granules.json');for(const[k,v]of Object.entries({short_name:shortName,version,temporal:'2023-07-14T00:00:00Z,2023-07-14T23:59:59Z',bounding_box:bbox.join(','),page_size:'50',sort_key:'start_date'}))query.searchParams.set(k,v);
 const raw=await small(query);fs.writeFileSync(out+'/'+shortName+'-cmr.json',raw);const b=JSON.parse(raw);const entries=b.feed.entry;const product={shortName,version,platform,url:query.href,sha256:createHash('sha256').update(raw).digest('hex'),bytes:raw.length,granules:entries.map(e=>({id:e.id,title:e.title,start:e.time_start,end:e.time_end,sizeMB:e.granule_size,polygons:e.polygons,links:e.links.filter(l=>l.rel?.includes('/data#')).map(l=>({href:l.href,type:l.type}))}))};
 const link=product.granules.flatMap(g=>g.links).find(l=>l.href.startsWith('https://')&&!l.href.includes('s3credentials'));
 if(link){try{const r=await fetch(link.href,{method:'HEAD',redirect:'manual',signal:AbortSignal.timeout(15000)});product.unauthenticatedProbe={status:r.status,contentType:r.headers.get('content-type'),contentLength:r.headers.get('content-length'),redirectedToLogin:(r.headers.get('location')??'').includes('urs.earthdata')};await r.body?.cancel();}catch{product.unauthenticatedProbe={error:'Public HEAD unavailable; no data downloaded'};}}
 if(link){try{const r=await fetch(link.href,{headers:{Range:'bytes=0-63'},signal:AbortSignal.timeout(15000)});product.rangeProbe={status:r.status,host:new URL(r.url).host,contentType:r.headers.get('content-type')};await r.body?.cancel();}catch{product.rangeProbe={error:'Unauthenticated range probe unavailable'};}}
 evidence.products.push(product);console.log(shortName,raw.length,'metadata bytes',product.granules.length,'catalog granules',JSON.stringify(product.rangeProbe));
}
const geolocation=[];
for(const [shortName,version,time]of[['MYD03','6.1','10:40:00Z,2023-07-14T10:44:59Z'],['VNP03IMG','2','10:36:00Z,2023-07-14T10:41:59Z']]){
 const query=new URL('https://cmr.earthdata.nasa.gov/search/granules.json');for(const[k,v]of Object.entries({short_name:shortName,version,temporal:'2023-07-14T'+time,bounding_box:bbox.join(','),page_size:'20'}))query.searchParams.set(k,v);
 const raw=await small(query);fs.writeFileSync(out+'/'+shortName+'-cmr.json',raw);const rows=JSON.parse(raw).feed.entry;
 geolocation.push({shortName,version,url:query.href,sha256:createHash('sha256').update(raw).digest('hex'),granules:rows.map(g=>({id:g.id,title:g.title,start:g.time_start,end:g.time_end,sizeMB:g.granule_size}))});
 console.log(shortName,'metadata only',JSON.stringify(geolocation.at(-1).granules));
}
fs.writeFileSync(out+'/geolocation-discovery.json',JSON.stringify(geolocation,null,2));
fs.writeFileSync(out+'/opportunity-discovery.json',JSON.stringify(evidence,null,2));console.log('No masks downloaded; coverage and sensitivity remain null.');
