// Explicit, local-only export. Cloud builds consume the committed, checksum-verified packet.
import fs from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {prepareArchiveDemo} from './prepare-demo.mjs';
await prepareArchiveDemo('.checkpoints/pilot-export');
const original=JSON.parse(await fs.readFile('.checkpoints/pilot-export/evidence.json','utf8'));
const sourceIds=new Set(original.rows.map(r=>r.dataset.id));
const metadata={...original.metadata,datasets:original.metadata.datasets.filter(d=>sourceIds.has(d.id)),yearPaths:{2024:'/api/observations?mode=brazil&year=2024'}};
const deliveries=[],deliveryIndices=new Map(),featureById=new Map(original.features.map(f=>[f.id,f]));
const observations=original.rows.map(r=>{
 const deliveryKey=JSON.stringify(r.delivery);if(!deliveryIndices.has(deliveryKey)){deliveryIndices.set(deliveryKey,deliveries.length);deliveries.push(r.delivery);}
 const properties=featureById.get(r.id).properties;
 return [r.id,r.lon,r.lat,r.timestamp,metadata.datasets.findIndex(d=>d.id===r.dataset.id),deliveryIndices.get(deliveryKey),r.raw.confidence,r.frp,r.raw.daynight,properties.source_line,properties.source_version];
});
const packet={schema:'rasad.static-pilot/v1',generation:original.generation,metadata,deliveries,observations,model:original.model,prototype:original.prototype};
const bytes=JSON.stringify(packet),manifest={schema:packet.schema,generation:packet.generation,count:observations.length,bytes:Buffer.byteLength(bytes),sha256:createHash('sha256').update(bytes).digest('hex'),scope:{mode:'brazil',from:'2024-08-01',to:'2024-08-31',bbox:[-57,-14,-55,-12]},limitations:'Authentic delivered pilot detections only; observation opportunity unknown; not complete or live Brazil coverage.'};
for(const root of ['deployment/pilot','public/rasad-data']){await fs.mkdir(root,{recursive:true});await fs.writeFile(root+'/evidence.json',bytes);if(root==='public/rasad-data')await fs.writeFile(root+'/brazil-pilot-aug2024.json',bytes);await fs.writeFile(root+'/manifest.json',JSON.stringify(manifest,null,2));}console.log(manifest);
