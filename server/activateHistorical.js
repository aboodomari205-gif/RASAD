import {backup} from 'node:sqlite';
import {historicalSummary} from '../shared/historySummary.ts';
import {associateSensors} from '../shared/evidence.ts';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {ArchiveStore} from './archiveStore.js';
import {importArchiveStream} from './importArchive.js';
import {pointInRegion} from '../shared/observations.ts';
const root=new URL('./data/historical-staging/',import.meta.url);
const deliveries=JSON.parse(fs.readFileSync(new URL('delivery-audit.json',root),'utf8'));
if(deliveries.reduce((n,d)=>n+d.rows,0)!==19324)throw Error('Input count reconciliation failed');
const boundaryCollection=JSON.parse(fs.readFileSync(new URL('./legacy-geography/jordan-adm1.geojson',import.meta.url),'utf8'));
const north=JSON.parse(fs.readFileSync(new URL('./legacy-geography/northern-jordan.geojson',import.meta.url),'utf8')).features[0].geometry;
const ajloun=boundaryCollection.features.find(f=>f.properties.shapeName==='Ajloun').geometry;
const generation=createHash('sha256').update(JSON.stringify(deliveries)).digest('hex');
const candidateName='history-'+generation.slice(0,16)+'.sqlite';
const filename=new URL('./data/'+candidateName,import.meta.url);
const pointerFile=new URL('./data/active-history.json',import.meta.url);
if(!fs.existsSync(filename)&&fs.existsSync(pointerFile)){const active=JSON.parse(fs.readFileSync(pointerFile,'utf8'));if(!/^[\w-]+\.sqlite$/.test(active.filename))throw Error('Unsafe baseline path');const previous=new ArchiveStore(new URL('./data/'+active.filename,import.meta.url),{readOnly:true});try{await backup(previous.db,filename);}finally{previous.close();}}

const store=new ArchiveStore(filename);
const report={schema:'firepulse.historical-activation/v1',deliveries,regions:{},processingPolicy:'standard and NRT separate; no cross-stage deduplication',coverage:'unknown'};
try{
 for(const [regionId,boundary]of [['ajloun',ajloun],['northern-jordan',north]]){
  const imports=[];
  for(const delivery of deliveries){
   const file=new URL(delivery.member,root),bytes=fs.readFileSync(file);
   if(createHash('sha256').update(bytes).digest('hex')!==delivery.csvSHA256)throw Error('Staging checksum mismatch');
   const platform=delivery.member.includes('M-C61')?'MODIS':delivery.member.includes('SV-C2')?'SNPP':delivery.member.includes('J1V')?'N20':'N21';
   const processing=delivery.member.startsWith('fire_nrt')?'nrt':'standard';
   const dataset={id:`${regionId}-${platform.toLowerCase()}-${processing}-c${platform==='MODIS'?'61':'2'}`,regionId,title:`${regionId} ${platform} ${processing} FIRMS delivery`,kind:'archive',source:'NASA FIRMS',sensor:platform==='MODIS'?'MODIS':'VIIRS',platform:platform==='MODIS'?null:platform==='SNPP'?'S-NPP':platform==='N20'?'NOAA-20':'NOAA-21',product:platform==='MODIS'?(processing==='standard'?'MCD14ML':'MCD14DL'):platform==='SNPP'?(processing==='standard'?'VNP14IMGTML':'VNP14IMGTDL'):`FIRMS:${platform==='SNPP'?'SV':platform==='N20'?'J1V':'J2V'}-C2:${processing}`,version:platform==='MODIS'?'6.1':'2',processing,archiveProfile:'firms-delivery-v1',deliveryProfile:platform,checksum:delivery.csvSHA256,fieldSemantics:{rawVersion:'Original opaque row revision retained',brightness:'Original field; no automatic channel alias',bright_t31:'Original field; no automatic VIIRS channel alias'},provenanceFiles:[delivery]};
   imports.push(await importArchiveStream(fs.createReadStream(file),{dataset,boundary,store,batchSize:500,activate:false,deliveryName:delivery.member}));
  }
  if(imports.some(r=>r.rejectedRecords>0))throw Error('Rejected rows block activation; candidate store remains isolated');
  const all=store.query({region:regionId});
  // query() without dataset IDs still applies region filtering to parsed observations.
  fs.writeFileSync(new URL('./data/historical-summary-'+generation.slice(0,16)+'-'+regionId+'.json',import.meta.url),JSON.stringify(historicalSummary(all,regionId)));
  const exampleYear=Object.keys(Object.fromEntries(all.map(o=>[o.utcDate.slice(0,4),true]))).sort().reverse().find(year=>associateSensors(all.filter(o=>o.utcDate.startsWith(year))).pairs.length>0)??null;
  const tally=(rows,key)=>Object.fromEntries([...new Set(rows.map(key))].sort().map(k=>[k,rows.filter(o=>key(o)===k).length]));
  report.regions[regionId]={exampleYear,imports,count:all.length,byPlatform:tally(all,o=>o.platform),byYear:tally(all,o=>o.utcDate.slice(0,4)),byProcessing:tally(all,o=>o.provenance.processing),byStratum:tally(all,o=>[o.platform,o.provenance.processing,o.utcDate.slice(0,4)].join('/')),governorates:Object.fromEntries(boundaryCollection.features.filter(f=>['Irbid','Ajloun','Jerash','Mafraq'].includes(f.properties.shapeName)).map(f=>[f.properties.shapeName,all.filter(o=>pointInRegion(o.longitude,o.latitude,f.geometry)).length])),first:all.map(o=>o.acquiredAt).sort()[0],last:all.map(o=>o.acquiredAt).sort().at(-1)};
 }
 // All delivery transactions succeeded; only then expose the new store via an atomic pointer.
 store.db.exec('BEGIN IMMEDIATE; UPDATE datasets SET active=1; COMMIT;');
 const reportFile='historical-activation-'+generation.slice(0,16)+'.json';fs.writeFileSync(new URL('./data/'+reportFile,import.meta.url),JSON.stringify(report,null,2));
 const pointer=new URL('./data/active-history.json',import.meta.url),temporary=new URL('./data/active-history.json.pending',import.meta.url);
 fs.writeFileSync(temporary,JSON.stringify({filename:candidateName,reportFile,summaryPrefix:'historical-summary-'+generation.slice(0,16)+'-',revision:createHash('sha256').update(JSON.stringify(deliveries)).digest('hex')}));
 fs.renameSync(temporary,pointer);
 fs.writeFileSync(new URL('./data/historical-activation-report.json',import.meta.url),JSON.stringify(report,null,2));
 console.log(JSON.stringify(Object.fromEntries(Object.entries(report.regions).map(([key,value])=>[key,{count:value.count,first:value.first,last:value.last,processing:value.byProcessing,imports:value.imports.map(r=>({input:r.inputRecords,accepted:r.acceptedRecords,rejected:r.rejectedRecords,duplicates:r.duplicatesRemoved,excluded:r.regionExcluded}))}]))));
}finally{store.close();}
