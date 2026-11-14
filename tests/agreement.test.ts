import test from 'node:test';
import assert from 'node:assert/strict';
import { comparisonBrief, coverageGate, sensitivitySeries } from '../shared/agreement.ts';
import type { Availability, Observation } from '../shared/model.ts';
const availability:Availability={state:'loaded',fixture:false,quality:'complete',coverage:'unknown',reasons:[]};
const observation=(id:string,sensor:'MODIS'|'VIIRS',year='2020'):Observation=>({id,datasetId:sensor,regionId:'ajloun',utcDate:`${year}-01-01`,acquiredAt:`${year}-01-01T00:00:00Z`,timestampPrecision:'instant',longitude:35.7,latitude:32.3,sensor,sensorRaw:sensor,platform:sensor,platformRaw:sensor,frp:null,confidence:{raw:sensor==='MODIS'?80:'n',scheme:sensor==='MODIS'?'modis-percent':'viirs-categorical',category:null,valid:true},source:'EXPLICIT SYNTHETIC TEST',provenance:{fixture:false,product:sensor,processing:'standard',version:'original'},feature:{type:'Feature',geometry:{type:'Point',coordinates:[35.7,32.3]},properties:{}}});
test('sensitivity settings use inclusive deltas and distinguish pairs, unique records and transitive groups',()=>{
 const m=observation('m','MODIS'),v={...observation('v','VIIRS'),acquiredAt:'2020-01-01T00:07:00Z'},m2={...observation('m2','MODIS'),acquiredAt:'2020-01-01T00:14:00Z'};
 const result=sensitivitySeries([m,v,m2,m],[{distanceKm:1,minutes:6},{distanceKm:1,minutes:7}]);
 assert.deepEqual(result.map(r=>[r.pairs,r.observations,r.groups]),[[0,0,0],[2,3,1]]);
 assert.throws(()=>sensitivitySeries([m],[{distanceKm:0,minutes:1}]),RangeError);
});
test('gate distinguishes available descriptions from provisional historical evidence and blocked anomaly/zero claims',()=>{
 const records=[observation('m','MODIS'),observation('v','VIIRS'),observation('m2','MODIS','2021')];
 const gate=coverageGate(records,availability);assert.deepEqual(gate.map(g=>g.status),['supported','provisional','provisional','unavailable','unavailable']);
 assert.equal(coverageGate(records,{...availability,quality:'partial',state:'partial'})[0].status,'provisional');
 assert.ok(coverageGate(records,{...availability,state:'error'}).every(g=>g.status==='unavailable'));
 assert.ok(coverageGate(records.map(o=>({...o,provenance:{...o.provenance,fixture:true}})),{...availability,fixture:true,state:'fixture'}).every(g=>g.status==='unavailable'));
 assert.equal(coverageGate(records,{...availability,coverage:'verified'})[3].status,'unavailable','availability flag alone is not scoped coverage proof');
});
test('gate excludes missing timestamps, incompatible processing and incomparable historical source years',()=>{
 const m=observation('m','MODIS'),v={...observation('v','VIIRS'),acquiredAt:null,timestampPrecision:'day' as const};
 assert.equal(coverageGate([m,v],availability)[1].status,'unavailable');
 assert.equal(coverageGate([m,{...observation('v','VIIRS'),provenance:{...m.provenance,processing:'nrt'}}],availability)[1].status,'unavailable');
 assert.equal(coverageGate([m,{...observation('m2','MODIS','2021'),datasetId:'different-source'}],availability)[2].status,'unavailable');
});
test('scientific brief is reproducible under input order, traces raw provenance and rejects conflicting IDs',()=>{
 const a=observation('a','MODIS'),b=observation('b','VIIRS');
 const options={distanceKm:1,minutes:60};
 const first=comparisonBrief([b,a],[],availability,options),second=comparisonBrief([a,b],[],availability,options);
 assert.deepEqual(first,second);assert.deepEqual(first.observations.map(o=>o.confidence.raw),[80,'n']);
 assert.equal(first.methodology.validated,false);assert.equal(first.methodology.eventCount,null);
 assert.equal(first.matching.groups[0].confirmedEvent,false);assert.equal(first.observations[0].source,'EXPLICIT SYNTHETIC TEST');
 assert.equal(comparisonBrief([a,a,b],[],availability,options).observations.length,2);
 assert.throws(()=>comparisonBrief([a,{...a,frp:20}],[],availability,options),/Conflicting/);
});
