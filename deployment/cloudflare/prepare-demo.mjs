// Publish only the authentic, bounded research pilot, never the private archive.
import fs from 'node:fs/promises';
import {createHash} from 'node:crypto';
export async function prepareArchiveDemo(root='dist/demo') {
 const {researchRows,southCollection,southManifest}=await import('../../server/southAmerica.js');
 const {researchPrototype}=await import('../../server/research.js');
 const query={mode:'brazil',from:'2024-08-01',to:'2024-08-31',bbox:'-57,-14,-55,-12'};
 const {generation,rows:stream}=researchRows(query),rows=[...stream].map(r=>({id:r.id,lon:r.lon,lat:r.lat,timestamp:r.timestamp,frp:r.frp,raw:{confidence:r.raw.confidence,daynight:r.raw.daynight},dataset:{id:r.dataset.id,sensor:r.dataset.sensor,platform:r.dataset.platform,product:r.dataset.product,version:r.dataset.version,processing:r.dataset.processing,source:r.dataset.source,fieldSemantics:r.dataset.fieldSemantics},delivery:{source_file:r.delivery.source_file,member:r.delivery.member,sha256:r.delivery.sha256}}));
 const features=[];
 for(let offset=0;;){const page=southCollection({...query,limit:'3000',offset:String(offset)});features.push(...page.features);if(!page.metadata.truncated)break;offset+=page.features.length;}
 const artifact=JSON.parse(await fs.readFile('models/brazil-frp-model.json','utf8'));
 if(generation!==artifact.generation||rows.length!==artifact.evaluation.inputRows||features.length!==rows.length)throw Error('Pilot/model generation or count mismatch');
 const metadata=southManifest({mode:'brazil'}).metadata;
 const dates=[...new Set(rows.map(r=>r.timestamp.slice(0,10)))].sort();
 Object.assign(metadata,{limitedDataDemo:true,totalDelivered:rows.length,availableDates:dates,availableYears:['2024'],yearCounts:{2024:rows.length},defaultDate:'2024-08-24',defaultYear:2024,observedExtent:[dates[0],dates.at(-1)]});
 const payload={generation,rows,features,metadata,model:artifact.model,prototype:{...researchPrototype(),archiveAvailable:false}};
 const bytes=JSON.stringify(payload);
 if(Buffer.byteLength(bytes)>24*1024*1024)throw Error('Demo exceeds Pages asset limit');
 await fs.mkdir(root,{recursive:true});await fs.writeFile(root+'/evidence.json',bytes);
 await fs.writeFile(root+'/manifest.json',JSON.stringify({scope:query,count:rows.length,generation,sha256:createHash('sha256').update(bytes).digest('hex'),limitations:'Limited-data demo: actual Mato Grosso pilot only, August 2024; unknown observation opportunity.'},null,2));
 console.log(`Prepared ${rows.length} authentic pilot observations (${Buffer.byteLength(bytes)} bytes), generation ${generation}`);
}
export async function prepareDemo(root='dist/rasad-data'){
 const bytes=await fs.readFile('deployment/pilot/evidence.json'),manifest=JSON.parse(await fs.readFile('deployment/pilot/manifest.json','utf8'));
 if(createHash('sha256').update(bytes).digest('hex')!==manifest.sha256)throw Error('Authentic pilot checksum mismatch; refusing substitute data');
 const packet=JSON.parse(bytes),artifact=JSON.parse(await fs.readFile('models/brazil-frp-model.json','utf8'));
 if(packet.generation!==artifact.generation||packet.observations.length!==artifact.evaluation.inputRows||packet.observations.length!==manifest.count)throw Error('Pilot/model scope mismatch');
 await fs.mkdir(root,{recursive:true});await fs.writeFile(root+'/evidence.json',bytes);await fs.writeFile(root+'/brazil-pilot-aug2024.json',bytes);await fs.writeFile(root+'/manifest.json',JSON.stringify(manifest,null,2));console.log(`Prepared checked static pilot: ${manifest.count} observations, ${bytes.length} bytes; no local archive required`);
}
