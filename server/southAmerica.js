import fs from 'node:fs';
import {DatabaseSync} from 'node:sqlite';
import {inflateSync} from 'node:zlib';
import {ACTIVE_REGIONS,activeRegion} from '../shared/regions.ts';
import {normalizeCollection,validateFilter} from '../shared/observations.ts';
import {equalAreaCell,GRID_METHOD} from '../shared/equalArea.ts';
import {once} from 'node:events';
import {Worker} from 'node:worker_threads';
import {pilotEvidence} from '../shared/pilot.js';
import {pilotOptions,environmentalStatus} from './pilot.js';
import {harmonizationLab} from '../shared/harmonizationLab.js';
const root=new URL('./data/south-america/',import.meta.url);
const availability={state:'loaded',fixture:false,quality:'complete',coverage:'unknown',reasons:['Detection-only deliveries do not establish clear-sky observation opportunity. NRT is provisional.']};
let retained=null;
const gridCache=new Map();let activeGridJobs=0;
async function gridOffThread(query){
 const key=JSON.stringify([store().generation,query]);if(query.task!=='pilot'&&gridCache.has(key))return gridCache.get(key);
 if(activeGridJobs>=2)throw Error('Grid workers busy; retry');activeGridJobs++;
 try{return await new Promise((resolve,reject)=>{
  const worker=new Worker(new URL('./southAmericaWorker.js',import.meta.url),{execArgv:[],workerData:{query:Object.fromEntries(Object.entries(query))}});
  const timer=setTimeout(()=>{worker.terminate();reject(Error('Grid analysis timed out; narrow UTC window'));},60000);
  worker.once('message',message=>{clearTimeout(timer);if(message.error){reject(message.invalid?new RangeError(message.error):Error(message.error));return;}gridCache.set(key,message.value);if(gridCache.size>8)gridCache.delete(gridCache.keys().next().value);resolve(message.value);});worker.once('error',e=>{clearTimeout(timer);reject(e);});
 });}finally{activeGridJobs--;}
}
function store(){
 const pointer=JSON.parse(fs.readFileSync(new URL('active.json',root),'utf8'));
 if(!/^[a-f0-9]{16}\.sqlite$/.test(pointer.filename))throw Error('Invalid generation');
 if(retained?.generation===pointer.generation)return retained;
 retained?.db.close();const db=new DatabaseSync(new URL(pointer.filename,root),{readOnly:true});
 const datasets=db.prepare('SELECT descriptor FROM datasets ORDER BY id').all().map(r=>JSON.parse(r.descriptor)).map(d=>d.processing==='standard'&&['N20','N21'].includes(d.deliveryProfile)?{...d,fieldSemantics:{...d.fieldSemantics,historicalReference:'blocked-lineage',processingValidation:'Archive member declares standard, but NASA FIRMS Readme states NOAA-20/21 standard quality is not yet available. Supplier clarification required; original values preserved.'}}:d);
 const deliveries=new Map(db.prepare('SELECT id,metadata FROM deliveries').all().map(r=>[r.id,JSON.parse(r.metadata)]));
 return retained={db,datasets,deliveries,generation:pointer.generation};
}
function scope(query){
 for(const value of Object.values(query))if(typeof value!=='string')throw new RangeError('Query values must be scalar');
 for(const key of ['mode','region'])if(query[key]!==undefined&&!activeRegion(query[key]))throw new RangeError('Unsupported study region');
 const region=query.mode??query.region??'brazil';if(!activeRegion(region))throw new RangeError('Unsupported study region');
 const from=query.from,to=query.to;
 for(const v of[from,to])if(v!==undefined&&(!/^\d{4}-\d{2}-\d{2}$/.test(v)||new Date(v+'T00:00:00Z').toISOString().slice(0,10)!==v))throw new RangeError('Invalid UTC date');
 if(from&&to&&from>to)throw new RangeError('Invalid UTC range');
 const number=name=>{if(query[name]===undefined)return undefined;if(!query[name].trim())throw new RangeError('Empty numeric filter');return Number(query[name]);};
 validateFilter({region,startDate:from,endDate:to,sensor:query.sensor,processing:query.processing,platform:query.platform,confidenceRaw:query.confidence,frpMin:number('frpMin'),frpMax:number('frpMax')});
 if(query.daynight&&!['D','N'].includes(query.daynight))throw new RangeError('Day/night must be D or N');
 const country=ACTIVE_REGIONS.find(r=>r.id===region).country;
 return {region,country,from,to};
}
function context(s){const state=store();return {...state,datasets:state.datasets.map(d=>({...d,regionId:s.region}))};}
function predicates(s,query={},alias=''){const clauses=[],values=[];const p=alias?alias+'.':'';
 if(s.country){clauses.push(p+'country=?');values.push(s.country);}
 if(s.from){clauses.push(p+'date>=?');values.push(s.from);}if(s.to){clauses.push(p+'date<=?');values.push(s.to);}
 if(query.sensor&&query.sensor!=='all'){clauses.push("json_extract(d.descriptor,'$.sensor')=?");values.push(query.sensor);}
 if(query.platform){clauses.push("json_extract(d.descriptor,'$.platform')=?");values.push(query.platform);}
 if(query.processing){if(!['nrt','standard'].includes(query.processing))throw new RangeError('Unsupported processing');clauses.push("json_extract(d.descriptor,'$.processing')=?");values.push(query.processing);}
 if(query.datasetId){clauses.push(p+'dataset=?');values.push(query.datasetId);}
 return {where:clauses.length?'WHERE '+clauses.join(' AND '):'',values};}
function* scopedRows(query,s=scope(query),state=context(s)){
 const {where,values}=predicates(s,query,'a');
 if(!query.datasetId){
  const sources=state.db.prepare(`SELECT DISTINCT a.dataset FROM chunks a JOIN datasets d ON d.id=a.dataset ${where} ORDER BY a.dataset`).all(...values);
  const iterators=sources.map(r=>scopedRows({...query,datasetId:r.dataset},s,state));
  try{while(iterators.length){for(let i=0;i<iterators.length;){const next=iterators[i].next();if(next.done)iterators.splice(i,1);else{yield next.value;i++;}}}}finally{for(const iterator of iterators)iterator.return();}
  return;
 }
 for(const chunk of state.db.prepare(`SELECT a.dataset,a.country,a.payload FROM chunks a JOIN datasets d ON d.id=a.dataset ${where} ORDER BY a.date,a.id`).iterate(...values)){
  const dataset=state.datasets.find(d=>d.id===chunk.dataset);
  for(const [id,lon,lat,timestamp,rawValues,deliveryKey,line] of JSON.parse(inflateSync(chunk.payload))){
   const delivery=state.deliveries.get(deliveryKey),raw=Object.fromEntries(delivery.headers.map((h,i)=>[h,rawValues[i]]));
   const frp=raw.frp===''?null:Number(raw.frp);
   if(query.confidence&&query.confidence!=='all'&&query.confidence!==raw.confidence)continue;
   if(query.daynight&&query.daynight!==raw.daynight)continue;
   if(query.frpMin!==undefined&&(frp===null||frp<Number(query.frpMin))||query.frpMax!==undefined&&(frp===null||frp>Number(query.frpMax)))continue;
   yield {id,lon,lat,timestamp,raw,delivery,line,dataset,country:chunk.country,frp};
  }
 }
}
function boundedScope(query){const s=scope(query);const last=southManifest(query).metadata.defaultDate;s.from=s.from??s.to??last;s.to=s.to??s.from;if(!s.from||Date.parse(s.to)-Date.parse(s.from)>30*86400000)throw new RangeError('Select at most 31 UTC days');return s;}
/** Read-only bounded original-row stream for offline reproducible research. */
export function researchRows(query={}){const s=boundedScope(query),state=context(s);return {generation:state.generation,rows:scopedRows(query,s,state)};}
export function southHarmonization(query={}){const s=boundedScope(query),state=context(s);return {...harmonizationLab(scopedRows(query,s,state),{support:query.support??'h3',resolution:Number(query.resolution??6),size:Number(query.size??2000)}),generation:state.generation,from:s.from,to:s.to};}
export function southPilot(query={}){
 const options=pilotOptions(query),s=boundedScope(query),state=context(s);
 return {...pilotEvidence(scopedRows(query,s,state),{...options,from:s.from,to:s.to}),generation:state.generation,region:'brazil',generatedAt:new Date().toISOString(),environment:environmentalStatus({...options,from:s.from,to:s.to}),model:{status:'NOT VALIDATED',trainingSamples:0,holdoutMetrics:null,reason:'No matched valid-pixel opportunity or independent year/geography holdouts. Downscaling and historical reconstruction disabled.'},responseIntegrations:{crews:'unavailable',evacuation:'unavailable',dispatch:'unavailable'}};
}
export function southGrid(query={}){
 const s=boundedScope(query),state=context(s),size=Number(query.size??2000),groups=new Map();
 equalAreaCell(0,0,size);
 const sensitivity=GRID_METHOD.sizesM.map(sizeM=>({sizeM,sources:new Map(),sensors:new Map()}));
 for(const row of scopedRows(query,s,state)){
  const g=groups.get(row.dataset.id)??{datasetId:row.dataset.id,count:0,cells:new Set(),dates:new Set(),frpSum:null};g.count++;g.cells.add(equalAreaCell(row.lon,row.lat,size));g.dates.add(row.timestamp.slice(0,10));if(row.frp!==null)g.frpSum=(g.frpSum??0)+row.frp;groups.set(row.dataset.id,g);
  for(const experiment of sensitivity){
   const cell=equalAreaCell(row.lon,row.lat,experiment.sizeM);
   for(const [map,key] of [[experiment.sources,row.dataset.id],[experiment.sensors,row.dataset.sensor]]){const cells=map.get(key)??new Set();cells.add(cell);map.set(key,cells);}
  }
 }
 const displayCells=new Map();for(const g of groups.values())for(const cell of g.cells){if(!displayCells.has(cell)&&displayCells.size>=1200)continue;const sources=displayCells.get(cell)??[];sources.push(g.datasetId);displayCells.set(cell,sources);}
 return {schema:'firepulse.equal-area-occupancy/v1',generation:state.generation,region:s.region,from:s.from,to:s.to,grid:{...GRID_METHOD,sizeM:size},calibration:'NOT_CALIBRATED',coverage:'unknown',rows:[...groups.values()].map(g=>({datasetId:g.datasetId,count:g.count,activeCells:g.cells.size,observedDates:g.dates.size,frpSum:g.frpSum})),
 sensitivity:sensitivity.map(e=>{const modis=e.sensors.get('MODIS')??new Set(),viirs=e.sensors.get('VIIRS')??new Set(),intersection=[...modis].filter(c=>viirs.has(c)).length;return {sizeM:e.sizeM,sources:[...e.sources].map(([datasetId,cells])=>({datasetId,activeCells:cells.size})),modisCells:modis.size,viirsCells:viirs.size,intersectionCells:intersection,unionCells:new Set([...modis,...viirs]).size,interpretation:'Descriptive window occupancy; acquisitions are not necessarily simultaneous. Unknown opportunity prevents detection-rate or calibration inference.'};}),
 cellPreview:{limit:1200,truncated:[...groups.values()].some(g=>[...g.cells].some(c=>!displayCells.has(c))),cells:[...displayCells].map(([id,sources])=>({id,sources}))},
 meaning:'Source-specific observed-cell occupancy, not fire events, burned area or calibrated activity'};
}
export function southSummary(query={}){
 const s=scope(query),state=context(s);const {where,values}=predicates(s,query,'a');
 const period={year:4,month:7,day:10}[query.summary??query.period??'month'];if(!period)throw new RangeError('Unsupported period');
 if(query.confidence&&query.confidence!=='all'||query.frpMin!==undefined||query.frpMax!==undefined||query.daynight){
  if(!s.from||!s.to)throw new RangeError('Quality-filtered summaries require an explicit UTC window of at most 31 days');
  const bounded=boundedScope(query),groups=new Map();
  for(const row of scopedRows(query,bounded,state)){const p=row.timestamp.slice(0,period),k=row.dataset.id+':'+p,g=groups.get(k)??{datasetId:row.dataset.id,sensor:row.dataset.sensor,platform:row.dataset.platform,product:row.dataset.product,version:row.dataset.version,processing:row.dataset.processing,source:row.dataset.source,confidenceScheme:row.dataset.sensor==='MODIS'?'modis-percent':'viirs-categorical',period:p,count:0,frpSum:null,frpReported:0,coverage:'unknown'};g.count++;if(row.frp!==null){g.frpSum=(g.frpSum??0)+row.frp;g.frpReported++;}groups.set(k,g);}
  return {schema:'firepulse.historical-summary/v1',generation:state.generation,region:s.region,unfiltered:false,coverage:'unknown',series:[...groups.values()]};
 }
 // Daily observed-cell counts are not summed into monthly unique cells.
 const rows=state.db.prepare(`SELECT a.dataset,substr(a.date,1,${period}) period,sum(a.count) count,sum(a.frp) frp,sum(a.frp_reported) reported FROM daily a JOIN datasets d ON d.id=a.dataset ${where} GROUP BY a.dataset,period ORDER BY period,a.dataset`).all(...values);
 return {schema:'firepulse.historical-summary/v1',region:s.region,unfiltered:!s.from&&!s.to,coverage:'unknown',generation:state.generation,meaning:'Source-stratified delivered detections; absent periods are unknown, not zero',series:rows.map(r=>{const d=state.datasets.find(d=>d.id===r.dataset);return {datasetId:d.id,sensor:d.sensor,platform:d.platform,product:d.product,version:d.version,processing:d.processing,source:d.source,confidenceScheme:d.sensor==='MODIS'?'modis-percent':'viirs-categorical',lineageStatus:d.fieldSemantics?.historicalReference==='blocked-lineage'?'delivery-declared-unverified':'delivery-declared',period:r.period,count:r.count,frpSum:r.frp,frpReported:r.reported,coverage:'unknown'};})};
}
export function southManifest(query={}){
 const s=scope(query),state=context(s),{where,values}=predicates({...s,from:undefined,to:undefined},query,'a');
 const stats=state.db.prepare(`SELECT substr(a.date,1,4) year,sum(a.count) count,min(a.date) first,max(a.date) last FROM daily a JOIN datasets d ON d.id=a.dataset ${where} GROUP BY year ORDER BY year`).all(...values);
 const yearCounts=Object.fromEntries(stats.map(r=>[r.year,r.count]));
 const first=stats[0]?.first,last=stats.at(-1)?.last;
 const dates=state.db.prepare(`SELECT DISTINCT a.date FROM daily a JOIN datasets d ON d.id=a.dataset ${where} ORDER BY a.date`).all(...values).map(r=>r.date);
 return {type:'FeatureCollection',features:[],metadata:{mode:s.region,region:ACTIVE_REGIONS.find(r=>r.id===s.region).name,developmentFixture:false,datasets:state.datasets,availability,historical:true,scalable:true,activationRevision:state.generation,availableYears:stats.map(r=>r.year),yearCounts,defaultYear:Number(last?.slice(0,4)),defaultDate:last,observedExtent:first?[first,last]:[],availableDates:dates,totalDelivered:stats.reduce((n,r)=>n+r.count,0),summaryPath:`/api/observations?mode=${s.region}&summary=year`,yearPaths:Object.fromEntries(stats.map(r=>[r.year,`/api/observations?mode=${s.region}&year=${r.year}`])),calibrationStatus:'NOT_CALIBRATED'}};
}
export function southCollection(query={}){
 const s=scope(query),state=context(s),manifest=southManifest(query);
 let year=query.year;if(year!==undefined&&(!/^\d{4}$/.test(String(year))||Number(year)<1900||Number(year)>2100))throw new RangeError('Invalid UTC year');
 // Default is one delivered UTC day. Broad requests return an explicit bounded preview.
 if(!s.from&&!s.to){const dates=manifest.metadata.availableDates.filter(d=>!year||d.startsWith(String(year)));s.from=s.to=dates.at(-1)??'1900-01-01';}
 const limit=Number(query.limit??2000),offset=Number(query.offset??0);
 if(!Number.isSafeInteger(limit)||limit<1||limit>3000||!Number.isSafeInteger(offset)||offset<0)throw new RangeError('Invalid evidence page');
 const features=[];let matched=0,more=false;
 for(const row of scopedRows(query,s,state)){
   const {id,lon,lat,timestamp,raw,delivery,line,dataset:ds,country}=row;
   const properties={...raw,version:ds.version,source_version:raw.version,collectionVersion:ds.version,timestamp_utc:timestamp,product:ds.product,processing:ds.processing,quality_flags:[ds.processing==='nrt'?'provisional-nrt':'delivery-declared-standard','observation-opportunity-unknown',...(ds.fieldSemantics?.historicalReference==='blocked-lineage'?['processing-lineage-unverified']:[]),...(ds.platform==='NOAA-20'&&timestamp<'2020-01-01'||ds.platform==='NOAA-21'&&timestamp<'2024-01-17'?['earlier-than-currently-documented-firms-product-period']:[]),...(['6.03','61.03'].includes(raw.version)?['opaque-original-row-version-not-decoded']:[])],latitude:lat,longitude:lon,date:timestamp.slice(0,10),time:timestamp.slice(11,16).replace(':',''),acquiredAt:timestamp,source:'NASA FIRMS',datasetId:ds.id,instrument:ds.sensor,satellite:ds.platform,rawSatellite:raw.satellite,rawInstrument:raw.instrument??null,frp:raw.frp===''?null:Number(raw.frp),observation_id:id,country,source_file:delivery.source_file,source_member:delivery.member,source_sha256:delivery.sha256,source_line:line,import_generation:state.generation,region_membership:[country],confidence_scheme:ds.sensor==='MODIS'?'modis-percent':'viirs-categorical',brightness_original:Object.fromEntries(Object.entries(raw).filter(([k])=>/^bright/.test(k))),brightness_channel:'Original field labels; no cross-sensor channel equivalence',frp_units:'MW',archiveRaw:raw};
   if(matched++<offset)continue;
   if(features.length===limit){more=true;break;}
   features.push({type:'Feature',id,geometry:{type:'Point',coordinates:[lon,lat]},properties});
 }
 return {...manifest,features,metadata:{...manifest.metadata,windowFrom:s.from,windowTo:s.to,truncated:more,evidencePage:{order:'Deterministic source round-robin; not a random or exposure-weighted sample',offset,limit,nextOffset:more?offset+features.length:null},availability:more?{...availability,state:'partial',quality:'partial',reasons:[...availability.reasons,'Bounded evidence page; use next page or narrow UTC dates. Full-history summaries are separate.']}:availability}};
}
export function registerSouthAmerica(app){
 const handle=(fn)=>(req,res)=>{try{res.json(fn(req.query));}catch(e){res.status(e instanceof RangeError?400:503).json({error:e instanceof RangeError?e.message:'Brazil observation generation unavailable; no substitute observations returned.'});}};
 app.get('/api/observations',handle(q=>q.summary?southSummary(q):q.manifest==='1'?southManifest(q):southCollection(q)));
 app.get('/api/history/coverage',handle(q=>{const m=southManifest(q);return {region:m.metadata.mode,coverage:'unknown',datasets:m.metadata.datasets,availableDates:m.metadata.availableDates,calibration:'NOT_CALIBRATED'};}));
 app.get('/api/history/datasets',handle(q=>{const m=southManifest(q);return {datasets:m.metadata.datasets,generation:m.metadata.activationRevision};}));
 app.get('/api/history/aggregates',handle(q=>southSummary({...q,summary:q.period??'month'})));
 app.get('/api/history/observations',handle(q=>{const c=southCollection(q);return {collection:c,...normalizeCollection(c,{region:c.metadata.mode})};}));
 app.get('/api/south-america/audit',handle(()=>{const a=JSON.parse(fs.readFileSync(new URL('active.json',root),'utf8'));return JSON.parse(fs.readFileSync(new URL(a.audit,root),'utf8'));}));
 app.get('/api/south-america/grid',async(req,res)=>{try{res.json(await gridOffThread(req.query));}catch(e){res.status(e instanceof RangeError?400:503).json({error:e instanceof RangeError?e.message:'Brazil grid evidence unavailable. Narrow the UTC window or retry.'});}});
 app.get('/api/south-america/pilot',async(req,res)=>{try{res.json(await gridOffThread({...req.query,task:'pilot'}));}catch(e){res.status(e instanceof RangeError?400:503).json({error:e instanceof RangeError?e.message:'Brazil pilot evidence unavailable; narrow the UTC window or retry.'});}});
 app.get('/api/research/harmonization',async(req,res)=>{try{res.json(await gridOffThread({...req.query,task:'harmonization'}));}catch(e){res.status(e instanceof RangeError?400:503).json({error:e instanceof RangeError?e.message:'Real harmonization evidence unavailable; narrow the UTC window or retry.'});}});
 app.get('/api/south-america/summary.csv',(req,res)=>{
  try{const summary=southSummary({...req.query,summary:req.query.period??'month'});const keys=['period','datasetId','sensor','platform','product','version','processing','source','count','frpSum','frpReported','coverage','lineageStatus'];const cell=v=>'"'+String(v??'').replaceAll('"','""')+'"';res.type('text/csv').set('Content-Disposition',`attachment; filename="rasad-${summary.region}-source-summaries.csv"`).send('\uFEFF'+[['region',...keys],...summary.series.map(r=>[summary.region,...keys.map(k=>r[k])])].map(row=>row.map(cell).join(',')).join('\r\n'));}catch(e){res.status(e instanceof RangeError?400:503).json({error:'Source summary export unavailable.'});}
 });
 app.get('/api/observations.csv',async(req,res)=>{
  try{
   const s=boundedScope(req.query),state=context(s);
   res.type('text/csv').set('Content-Disposition',`attachment; filename="rasad-${s.region}-${s.from}-${s.to}.csv"`);
   const cell=v=>'"'+String(v??'').replaceAll('"','""')+'"';
   res.write('\uFEFF'+['observation_id','timestamp_utc','longitude','latitude','region','country','sensor','platform','product','collection','processing','confidence_original','confidence_scheme','frp_mw','source_file','source_member','source_sha256','source_line','import_generation','opportunity_status','calibration_status','lineage_status','raw_values_json'].join(',')+'\r\n');
   let count=0;for(const r of scopedRows(req.query,s,state)){
    const line=[r.id,r.timestamp,r.lon,r.lat,s.region,r.country,r.dataset.sensor,r.dataset.platform,r.dataset.product,r.dataset.version,r.dataset.processing,r.raw.confidence,r.dataset.sensor==='MODIS'?'modis-percent':'viirs-categorical',r.frp,r.delivery.source_file,r.delivery.member,r.delivery.sha256,r.line,state.generation,'unknown','NOT_CALIBRATED',r.dataset.fieldSemantics?.historicalReference==='blocked-lineage'?'delivery-declared-unverified':'delivery-declared',JSON.stringify(r.raw)].map(cell).join(',')+'\r\n';
    if(!res.write(line))await once(res,'drain');if(res.destroyed)break;if(++count%1000===0)await new Promise(resolve=>setImmediate(resolve));
   }res.end();
  }catch(e){if(!res.headersSent)res.status(e instanceof RangeError?400:503).json({error:'Exact export unavailable. Select at most 31 UTC days.'});else res.destroy(e);}
 });
}
