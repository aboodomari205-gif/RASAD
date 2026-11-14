import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {Readable} from 'node:stream';
import {ArchiveStore} from '../server/archiveStore.js';
import {importArchiveStream} from '../server/importArchive.js';
import {ingestFirmsCSV} from '../server/firmsArchive.js';
import {loadRegionCollection} from '../server/dataCatalog.js';
import {normalizeCollection,filterObservations} from '../shared/observations.ts';
import {associateSensors} from '../shared/evidence.ts';
import {historicalSummary} from '../shared/historySummary.ts';
import {aggregateDailyObservations} from '../src/calendar/aggregation.ts';
import {fetchObservationCollection} from '../src/data/observations.ts';
import {reconcileRegionScope} from '../shared/regionScope.ts';

test('independent input audit reconciles 19324 rows and both active regions without adding subset totals',()=>{
 const audit=JSON.parse(fs.readFileSync('server/data/historical-independent-audit.json','utf8'));
 assert.equal(audit.inputCount,19324);
 for(const [region,total,standard,nrt]of [['ajloun',143,135,8],['northern-jordan',6859,6594,265]] as const){
  const collection=loadRegionCollection(region),records=normalizeCollection(collection,{region}).observations;
  assert.equal(records.length,total);assert.equal(records.length,audit.regions[region].count);assert.equal(new Set(records.map(o=>o.id)).size,total);
  assert.equal(filterObservations(records,{processing:'standard'}).length,standard);assert.equal(filterObservations(records,{processing:'nrt'}).length,nrt);
  assert.ok(records.every(o=>o.regionId===region&&!o.provenance.fixture));
 }
 assert.equal(loadRegionCollection('ajloun',{baseline:true}).features.length,36,'original pilot is retained independently');
});
const dataset={id:'test-history-snpp',regionId:'northern-jordan',title:'SYNTHETIC SCHEMA TEST',kind:'archive',source:'NASA FIRMS',sensor:'VIIRS',platform:'S-NPP',product:'VNP14IMGTML',version:'2',processing:'standard',archiveProfile:'firms-delivery-v1',deliveryProfile:'SNPP'};
const header='latitude,longitude,brightness,scan,track,acq_date,acq_time,satellite,instrument,confidence,version,bright_t31,frp,daynight,type';
const row='32.3,35.7,330,.4,.4,2020-01-01,2359,SNPP,SNPP,n,2,290,,N,0';
const boundary={type:'Polygon',coordinates:[[[35,32],[36,32],[36,33],[35,33],[35,32]]]};
test('explicit delivery profiles retain raw identity and reject stage/version mismatches',()=>{
 const result=ingestFirmsCSV(header+'\n'+row,{dataset,boundary});assert.equal(result.observations.length,1);const o=result.observations[0];
 assert.equal(o.platform,'S-NPP');assert.equal(o.platformRaw,'SNPP');assert.equal(o.sensorRaw,'SNPP');assert.equal(o.confidence.raw,'n');assert.equal(o.frp,null);assert.equal(o.acquiredAt,'2020-01-01T23:59:00.000Z');assert.equal(o.feature.properties.archiveRaw.bright_t31,'290');
 assert.equal(ingestFirmsCSV(header+'\n'+row.replace(',n,2,',',n,2.0NRT,'),{dataset,boundary}).diagnostics.rejectedRecords,1);
});
test('incremental imports are idempotent and a late CSV syntax failure rolls back the entire member',async()=>{
 const directory=fs.mkdtempSync(path.join(os.tmpdir(),'firepulse-history-test-'));const store=new ArchiveStore(path.join(directory,'history.sqlite'));
 try{
  const csv=header+'\n'+row;
  const first=await importArchiveStream(Readable.from([csv]),{dataset,boundary,store,batchSize:1});assert.equal(first.insertedRecords,1);
  const replay=await importArchiveStream(Readable.from([csv]),{dataset,boundary,store,batchSize:1});assert.equal(replay.insertedRecords,0);assert.equal(replay.duplicatesRemoved,1);
  await assert.rejects(importArchiveStream(Readable.from([csv+'\n"unterminated']),{dataset,boundary,store,batchSize:1}));assert.equal(store.query({region:'northern-jordan'}).length,1);
 }finally{store.close();fs.rmSync(directory,{recursive:true,force:true});}
});
test('preaggregates preserve processing/platform strata, missing FRP and deterministic replay without invented zero periods',()=>{
 const record=ingestFirmsCSV(header+'\n'+row,{dataset,boundary}).observations[0];const nrt={...record,id:'nrt-test',datasetId:'nrt-test',frp:0,provenance:{...record.provenance,processing:'nrt' as const}};
 const summary=historicalSummary([record,nrt,record],'northern-jordan');assert.deepEqual(summary,historicalSummary([nrt,record],'northern-jordan'));
 const annual=summary.series.filter(r=>r.period.length===4);assert.equal(annual.length,2);assert.ok(annual.every(r=>r.count===1&&r.coverage==='unknown'));assert.equal(annual.find(r=>r.processing==='standard')!.frpSum,null);assert.equal(annual.find(r=>r.processing==='nrt')!.frpSum,0);
 assert.throws(()=>historicalSummary([record,{...record,frp:10}],'northern-jordan'),/Conflicting/);
});
test('Calendar supports reviewed multi-platform deliveries with explicit daily source contributions',()=>{
 const collection=loadRegionCollection('northern-jordan',{filter:{startDate:'2026-01-01',endDate:'2026-12-31'}});
 const result=aggregateDailyObservations(collection,{region:'northern-jordan',instrument:'VIIRS'});assert.equal([...result.days.values()].reduce((n,d)=>n+d.count,0),783);
 assert.ok([...result.days.values()].some(d=>d.contributions!.length>1));assert.ok([...result.days.values()].every(d=>d.status==='observed'&&d.coverageSources.length===0));
});
test('matching preserves processing compatibility with exact real scoped historical results',()=>{
 const observations=normalizeCollection(loadRegionCollection('ajloun'),{region:'ajloun'}).observations.filter(o=>o.utcDate.startsWith('2023'));
 const result=associateSensors(observations);assert.deepEqual([observations.length,result.pairs.length,result.uniqueObservationCount,result.groupCount],[22,12,13,1]);
 const byId=new Map(observations.map(o=>[o.id,o]));assert.ok(result.pairs.every(p=>byId.get(p.modisId)!.provenance.processing===byId.get(p.viirsId)!.provenance.processing));assert.equal(result.methodology.validated,false);
});
test('browser loader rejects oversized windows before fetching raw shards',async()=>{
 const original=globalThis.fetch;let calls=0;
 try{globalThis.fetch=async()=>{calls++;return Response.json({type:'FeatureCollection',features:[],metadata:{mode:'northern-jordan',historical:true,defaultYear:2026,yearPaths:{2026:'/test/2026.json'},yearCounts:{2026:6000}}});};
 await assert.rejects(fetchObservationCollection('northern-jordan',undefined,2020,2026),/three consecutive/);assert.equal(calls,1);
 await assert.rejects(fetchObservationCollection('northern-jordan',undefined,2026),/3000/);assert.equal(calls,2);
 }finally{globalThis.fetch=original;}
});

test('region reconciliation preserves an older valid historical window using catalog extents rather than latest-year rows',()=>{
 const collection=loadRegionCollection('northern-jordan',{filter:{startDate:'2026-01-01',endDate:'2026-12-31'}});
 collection.metadata={...collection.metadata,historical:true,observedExtent:['2001-05-20','2026-11-10'],availableYears:['2006','2023','2026']};
 const scope={region:'northern-jordan' as const,sensor:'MODIS',calendarMonth:'2023-07',startDate:'2023-01-01',endDate:'2023-12-31',seasonYears:['2023'],confidenceRaw:'all'};
 const next=reconcileRegionScope(scope,collection);
 assert.equal(next.startDate,scope.startDate);assert.equal(next.endDate,scope.endDate);assert.equal(next.calendarMonth,scope.calendarMonth);assert.deepEqual(next.seasonYears,['2023']);assert.equal(next.sensor,'MODIS');
});
