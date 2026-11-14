import test from 'node:test';
import assert from 'node:assert/strict';
import type { Observation } from '../shared/model.ts';
import { associateSensors,comparePeriods,thermalFingerprint,evidenceVerdicts } from '../shared/evidence.ts';
const row=(id:string,sensor:'MODIS'|'VIIRS',time:string|null,longitude=35.7):Observation=>({id,datasetId:'synthetic-'+sensor,regionId:'ajloun',utcDate:time?.slice(0,10)??'2020-01-01',acquiredAt:time,timestampPrecision:time?'instant':'day',longitude,latitude:32.3,sensor,sensorRaw:sensor,platform:sensor==='MODIS'?'Aqua':'S-NPP',platformRaw:null,frp:null,confidence:{raw:sensor==='MODIS'?80:'n',scheme:sensor==='MODIS'?'modis-percent':'viirs-categorical',category:null,valid:true},source:'SYNTHETIC TEST',provenance:{fixture:false,product:sensor,processing:'standard',version:'raw'},feature:{type:'Feature',geometry:{type:'Point',coordinates:[longitude,32.3]},properties:{}}});
test('matching uses exact UTC across midnight, inclusive temporal bounds and source IDs',()=>{
 const m=row('m','MODIS','2020-01-01T23:50:00Z'),v=row('v','VIIRS','2020-01-02T00:10:00Z');
 const r=associateSensors([m,v],{distanceKm:1,minutes:20});assert.equal(r.pairs.length,1);assert.equal(r.pairs[0].deltaMinutes,20);assert.equal(r.pairs[0].modisId,'m');assert.equal(r.methodology.validated,false);assert.equal(r.methodology.eventCount,null);
 assert.equal(associateSensors([m,v],{distanceKm:1,minutes:19}).pairs.length,0);
 assert.equal(associateSensors([m,row('late','VIIRS','2020-01-01T01:00:00Z')]).pairs.length,0);
});
test('many-to-many candidates are not merged; duplicates, fixtures, missing instants and regions remain explicit',()=>{
 const m=row('m','MODIS','2020-01-01T00:00:00Z'),v=row('v','VIIRS',m.acquiredAt),v2=row('v2','VIIRS',m.acquiredAt),missing=row('missing','VIIRS',null),fixture={...v,id:'fixture',provenance:{...v.provenance,fixture:true}},other={...v,id:'other',regionId:'northern-jordan' as const};
 const r=associateSensors([m,m,v,v2,missing,fixture,other]);assert.equal(r.duplicatesRemoved,1);assert.equal(r.pairs.length,2);assert.deepEqual(r.excludedIds,['missing','fixture']);assert.ok(r.unmatchedIds.includes('other'));assert.equal(m.confidence.raw,80);assert.equal(v.confidence.raw,'n');
 assert.throws(()=>associateSensors([m,{...m,frp:99}]),/Conflicting/);
 assert.throws(()=>associateSensors([m],{distanceKm:NaN,minutes:30}),RangeError);
});
test('distance, processing stage and date-line geography are respected',()=>{
 const m=row('m','MODIS','2020-01-01T00:00:00Z',179.999),v=row('v','VIIRS',m.acquiredAt,-179.999);
 assert.equal(associateSensors([m,v],{distanceKm:1,minutes:0}).pairs.length,1);
 assert.equal(associateSensors([m,{...v,provenance:{...v.provenance,processing:'nrt'}}]).pairs.length,0);
 assert.equal(associateSensors([m,{...v,longitude:35}]).pairs.length,0);
});
test('historical comparison keeps unknown periods and null FRP, sensor provenance and traceability',()=>{
 const a=row('a','MODIS','2020-01-01T00:00:00Z'),b={...row('b','VIIRS','2025-12-31T23:59:00Z'),frp:0};
 const r=comparePeriods([a,b,a],{from:'2020-01-01',to:'2020-12-31'},{from:'2025-01-01',to:'2025-12-31'});
 assert.equal(r.groups.length,2);assert.equal(r.groups[0].a.count,1);assert.equal(r.groups[0].a.frpSum,null);assert.equal(r.groups[0].b.count,null);assert.equal(r.groups[1].b.frpSum,0);assert.equal(r.groups[1].b.coverage,'unknown');assert.equal(r.anomaly,null);assert.deepEqual(r.groups[0].a.ids,['a']);
 assert.throws(()=>comparePeriods([a],{from:'2020-02-30',to:'2020-03-01'},{from:'2025-01-01',to:'2025-12-31'}));
 const fp=thermalFingerprint([a,b]);assert.equal(fp.cells.length,2);assert.deepEqual(fp.years,['2020','2025']);
 const verdicts=evidenceVerdicts([a,b],{state:'loaded',fixture:false,quality:'complete',coverage:'unknown',reasons:[]},[{modisId:'a',viirsId:'b'}]);assert.equal(verdicts[1].status,'provisional');assert.equal(verdicts[2].status,'insufficient');
});

test('inclusive spatial threshold, zero-time matching and transitive groups preserve exact source provenance',async()=>{
 const {distanceKm,associationGroups}=await import('../shared/evidence.ts');
 const time='2020-01-01T00:00:00Z';
 const a=row('a','MODIS',time,35.700),b=row('b','VIIRS',time,35.705),c=row('c','MODIS',time,35.710);
 const boundary=distanceKm(a,b);
 assert.equal(associateSensors([a,b],{distanceKm:boundary,minutes:0}).pairs.length,1);
 assert.equal(associateSensors([a,b],{distanceKm:boundary-1e-9,minutes:0}).pairs.length,0);
 const radius=Math.max(distanceKm(a,b),distanceKm(b,c));
 const result=associateSensors([a,b,c,a],{distanceKm:radius,minutes:0});
 assert.equal(result.pairs.length,2);assert.equal(result.uniqueObservationCount,3);assert.equal(result.groupCount,1);assert.equal(result.duplicatesRemoved,1);
 assert.ok(distanceKm(a,c)>radius);assert.deepEqual(result.groups[0].memberIds,['a','b','c']);assert.equal(result.groups[0].confirmedEvent,false);
 assert.deepEqual(result.groups[0].members.find(o=>o.id==='a')?.confidence,a.confidence);assert.deepEqual(result.groups[0].members.find(o=>o.id==='b')?.provenance,b.provenance);
 assert.equal(associationGroups([...result.pairs,...result.pairs],[a,b,c])[0].pairCount,2);
 assert.deepEqual(associateSensors([c,b,a],{distanceKm:radius,minutes:0}).groups[0].memberIds,['a','b','c']);
 const missing=row('missing-time','VIIRS',null,35.705);
 assert.deepEqual(associateSensors([a,missing]).excludedIds,['missing-time']);assert.equal(associateSensors([a,missing]).groupCount,0);
 const distant=row('other','VIIRS',time,36.7);assert.equal(associateSensors([a,b,c,distant],{distanceKm:radius,minutes:0}).groupCount,1);
 assert.throws(()=>associationGroups(result.pairs,[a]),/source is missing/);
});

test('temporal chains and separate components count source observations once, not pair endpoints',()=>{
 const records=[row('m0','MODIS','2020-01-01T00:00:00Z'),row('v7','VIIRS','2020-01-01T00:07:00Z'),row('m14','MODIS','2020-01-01T00:14:00Z'),row('m-far','MODIS','2020-01-02T00:00:00Z',36),row('v-far','VIIRS','2020-01-02T00:00:00Z',36)];
 const snapshot=JSON.stringify(records);
 const result=associateSensors([...records,records[1]],{distanceKm:1,minutes:7});
 assert.equal(result.pairs.length,3);assert.equal(result.uniqueObservationCount,5);assert.equal(result.groupCount,2);assert.equal(result.duplicatesRemoved,1);
 const chain=result.groups.find(g=>g.memberIds.includes('m0'))!;
 assert.deepEqual(chain.memberIds,['m0','m14','v7']);assert.equal(chain.maxEdgeMinutes,7);assert.deepEqual(chain.sensorCounts,{MODIS:2,VIIRS:1});
 assert.equal(associateSensors(records,{distanceKm:1,minutes:6}).groupCount,1);
 assert.equal(JSON.stringify(records),snapshot);
});
