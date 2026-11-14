import test from 'node:test';import assert from 'node:assert/strict';
import type {Observation} from '../shared/model.ts';
import {associateSensors,distanceKm} from '../shared/evidence.ts';
import {scientificHarmonization,utcSeason} from '../shared/scientificEngine.ts';
import {loadRegionCollection,loadAjlounGeometry} from '../server/dataCatalog.js';
import {normalizeCollection,pointInRegion} from '../shared/observations.ts';
const row=(id:string,sensor:'MODIS'|'VIIRS',date='2020-01-01T00:00:00Z',lat=32.3,lon=35.7):Observation=>({id,datasetId:sensor,regionId:'ajloun',utcDate:date.slice(0,10),acquiredAt:date,timestampPrecision:'instant',latitude:lat,longitude:lon,sensor,sensorRaw:sensor,platform:sensor==='MODIS'?'Aqua':'S-NPP',platformRaw:sensor,frp:null,confidence:{raw:sensor==='MODIS'?80:'n',scheme:sensor==='MODIS'?'modis-percent':'viirs-categorical',category:null,valid:true},source:'SYNTHETIC SCIENTIFIC TEST ONLY',provenance:{fixture:false,product:sensor,version:'TEST',processing:'standard'},feature:{type:'Feature',geometry:{type:'Point',coordinates:[lon,lat]},properties:{}}});
const edges=(pairs:{modisId:string;viirsId:string}[])=>pairs.map(p=>p.modisId+'/'+p.viirsId).sort();
function brute(records:Observation[],km:number,minutes:number){return records.filter(o=>o.sensor==='MODIS').flatMap(m=>records.filter(v=>v.sensor==='VIIRS'&&v.regionId===m.regionId&&v.provenance.processing===m.provenance.processing&&m.acquiredAt&&v.acquiredAt&&Math.abs(Date.parse(m.acquiredAt)-Date.parse(v.acquiredAt))<=minutes*60000&&distanceKm(m,v)<=km).map(v=>({modisId:m.id,viirsId:v.id})));}

test('indexed matches equal independent exhaustive predicates at poles, antimeridian and exact boundaries',()=>{
 const records=[row('m','MODIS','2020-01-01T23:59:00Z',89.99,179.99),row('v','VIIRS','2020-01-02T00:01:00Z',89.99,-179.99),row('equator-m','MODIS','2020-01-01T00:00:00Z',0,179.999),row('equator-v','VIIRS','2020-01-01T00:00:00Z',0,-179.999)];
 for(const [km,minutes]of [[.25,0],[1,2],[2,60]])assert.deepEqual(edges(associateSensors(records,{distanceKm:km,minutes}).pairs),edges(brute(records,km,minutes)));
 const km=distanceKm(records[0],records[1]);assert.equal(associateSensors(records.slice(0,2),{distanceKm:km,minutes:2}).pairs.length,1);assert.equal(associateSensors(records.slice(0,2),{distanceKm:km*.999,minutes:2}).pairs.length,0);
});
test('spatial/time index agrees with exhaustive matching on deterministic multi-platform fixtures',()=>{
 let seed=42;const random=()=>((seed=(seed*1664525+1013904223)>>>0)/4294967296);
 const records=Array.from({length:180},(_,i)=>{const o=row(String(i),i%4===0?'MODIS':'VIIRS',new Date(Date.UTC(2020,0,1,0,Math.floor(random()*180))).toISOString(),32+random()*.1,35+random()*.1);if(i%7===0)o.provenance.processing='nrt';if(i%9===0)o.platform='NOAA-20';return o;});
 for(const [km,minutes]of [[.25,6],[1,60],[2,120]])assert.deepEqual(edges(associateSensors(records,{distanceKm:km,minutes}).pairs),edges(brute(records,km,minutes)));
});
test('sparse simultaneous records avoid the quadratic spatial scan; dense candidate limits remain explicit',()=>{
 const records=Array.from({length:500},(_,i)=>[row('m'+i,'MODIS',undefined,0,-170+i*.6),row('v'+i,'VIIRS',undefined,5,-170+i*.6)]).flat();
 assert.equal(associateSensors(records).indexDiagnostics.exactDistanceEvaluations,0);
 const dense=Array.from({length:101},(_,i)=>[row('m'+i,'MODIS'),row('v'+i,'VIIRS')]).flat();assert.throws(()=>associateSensors(dense),/Too many candidate/);
});
test('seasonal contributions preserve UTC midnight, December winter year, null and zero FRP',()=>{
 assert.equal(utcSeason('2020-12-31'),'2021-DJF');assert.equal(utcSeason('2021-01-01'),'2021-DJF');assert.equal(utcSeason('2021-03-01'),'2021-MAM');
 const a=row('a','MODIS','2020-12-31T23:59:00Z'),b={...row('b','MODIS','2021-01-01T00:00:00Z'),frp:0};
 const r=scientificHarmonization([a,b],[],'ajloun');assert.equal(r.seasonal.length,1);assert.deepEqual([r.seasonal[0].count,r.seasonal[0].frpSum,r.seasonal[0].frpReported],[2,0,1]);assert.equal(r.temporal.series.filter(s=>s.period.length===10).length,2);
});
test('unknown processing, missing UTC, fixtures and different regions cannot create associations',()=>{
 const m=row('m','MODIS'),v=row('v','VIIRS');v.provenance.processing='unknown';assert.equal(associateSensors([m,v]).pairs.length,0);m.provenance.processing='unknown';assert.equal(associateSensors([m,v]).pairs.length,0);m.provenance.processing='standard';
 v.provenance.processing='standard';v.acquiredAt=null;v.timestampPrecision='day';assert.equal(associateSensors([m,v]).pairs.length,0);
 v.provenance.fixture=true;assert.equal(scientificHarmonization([v],[],'ajloun').uniqueDelivered,0);
 assert.throws(()=>scientificHarmonization([m,{...v,regionId:'northern-jordan'}],[],'ajloun'),/one independent region/);
});
test('duplicate identity, source-specific gaps and unavailable baselines remain explicit and reproducible',()=>{
 const a=row('a','MODIS','2020-01-01T00:00:00Z'),b=row('b','MODIS','2020-01-03T00:00:00Z');
 const r=scientificHarmonization([a,b,a],[],'ajloun');assert.equal(r.uniqueDelivered,2);assert.equal(r.exactDuplicatesRemoved,1);assert.equal(r.strata[0].unobservedDatesWithinDetectionExtent,1);assert.equal(r.gates.historicalMedian,null);assert.equal(r.gates.anomaly,null);assert.equal(r.fingerprint.eligible,false);
 const empty=scientificHarmonization([],[],'ajloun');assert.equal(empty.gates.descriptive,'unavailable');assert.equal(empty.gates.coverage,'unknown');assert.deepEqual(empty.temporal.series,[]);
 assert.deepEqual(r,scientificHarmonization([a,a,b],[],'ajloun'));assert.throws(()=>scientificHarmonization([a,{...a,frp:99}],[],'ajloun'),/Conflicting/);
});
test('source-stratum detection-overlap windows do not mix NRT or imply acquisition opportunity',()=>{
 const a=row('a','MODIS'),b=row('b','VIIRS'),c={...row('c','VIIRS'),provenance:{...b.provenance,processing:'nrt' as const}};
 const r=scientificHarmonization([a,b,c],[],'ajloun');assert.equal(r.detectionExtentOverlap.comparisons.length,1);assert.equal(r.detectionExtentOverlap.comparisons[0].viirsIds.length,1);assert.equal(r.gates.calibratedEquivalentCounts,null);
});
test('real Ajloun/North results reconcile to independent period counts without adding subset totals',()=>{
 for(const region of ['ajloun','northern-jordan'] as const){const c=loadRegionCollection(region),n=normalizeCollection(c,{region}),r=scientificHarmonization(n.observations,n.datasets,region);assert.equal(r.uniqueDelivered,n.observations.length);assert.equal(r.seasonal.reduce((s,b)=>s+b.count,0),n.observations.length);
  const sample=n.observations.filter(o=>o.utcDate.startsWith('2023'));assert.deepEqual(edges(associateSensors(sample).pairs),edges(brute(sample,1,60)));
  if(region==='ajloun')assert.ok(n.observations.every(o=>pointInRegion(o.longitude,o.latitude,loadAjlounGeometry())));
 }
});

test('first delivered source year is not an operational start and nonoverlap never becomes verified zero',()=>{
 const r=scientificHarmonization([row('m','MODIS','2001-01-01T00:00:00Z'),row('v','VIIRS','2012-01-01T00:00:00Z')],[],'ajloun');
 assert.equal(r.strata.find(s=>s.sensor==='VIIRS')!.firstDeliveredYear,'2012');assert.equal(r.strata.find(s=>s.sensor==='VIIRS')!.operationalStart,null);
 assert.equal(r.detectionExtentOverlap.comparisons[0].window,null);assert.equal(r.detectionExtentOverlap.comparisons[0].status,'unavailable');assert.equal(r.gates.coverage,'unknown');
});
