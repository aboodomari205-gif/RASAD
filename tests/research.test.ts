import test from 'node:test';
import assert from 'node:assert/strict';
import { matchingRobustness, researchBrief, sensorDifferences } from '../shared/research.ts';
import type { Observation,Availability,Dataset } from '../shared/model.ts';
import { distanceKm } from '../shared/evidence.ts';
const availability:Availability={state:'loaded',fixture:false,quality:'complete',coverage:'unknown',reasons:[]};
const row=(id:string,sensor:'MODIS'|'VIIRS',minutes=0):Observation=>({id,sensor,datasetId:sensor,regionId:'ajloun',utcDate:'2020-01-01',acquiredAt:`2020-01-01T00:${String(minutes).padStart(2,'0')}:00Z`,timestampPrecision:'instant',latitude:32.3,longitude:35.7,sensorRaw:sensor,platform:sensor,platformRaw:sensor,frp:null,confidence:{raw:sensor==='MODIS'?80:'n',scheme:sensor==='MODIS'?'modis-percent':'viirs-categorical',category:null,valid:true},source:'SYNTHETIC TEST ONLY',provenance:{fixture:false,product:sensor,version:'original',processing:'standard'},feature:{type:'Feature',geometry:{type:'Point',coordinates:[35.7,32.3]},properties:{}}});
test('robustness distinguishes stable and sensitive edges and exact additions/removals',()=>{
 const records=[row('m','MODIS'),row('stable','VIIRS'),row('sensitive','VIIRS',7)];
 const r=matchingRobustness(records,[{distanceKm:1,minutes:0},{distanceKm:1,minutes:7},{distanceKm:1,minutes:6}]);
 assert.equal(r.stable,1);assert.equal(r.sensitive,1);
 assert.deepEqual(r.edges.find(e=>e.viirsId==='sensitive')?.present,[false,true,false]);
 assert.deepEqual(r.configurations[1].added,[JSON.stringify(['m','sensitive'])]);assert.deepEqual(r.configurations[2].removed,r.configurations[1].added);
 assert.equal(r.configurations[1].observationCount,3);assert.equal(r.configurations[1].groupCount,1);
});
test('robustness preserves inclusive spatial boundaries, transitive groups and repeated identities',()=>{
 const a=row('a','MODIS'),b={...row('b','VIIRS'),longitude:35.705},c={...row('c','MODIS'),longitude:35.71};
 const boundary=Math.max(distanceKm(a,b),distanceKm(b,c));
 const r=matchingRobustness([c,a,b,a],[{distanceKm:boundary,minutes:0},{distanceKm:boundary+.01,minutes:1}]);
 assert.equal(r.stable,2);assert.equal(r.edges.length,2);assert.ok(!r.edges.some(e=>e.modisId==='a'&&e.viirsId==='c'));
 assert.equal(r.configurations[0].groupCount,1);assert.equal(r.configurations[0].observationCount,3);
 const outside=matchingRobustness([a,b],[{distanceKm:distanceKm(a,b)-1e-8,minutes:0},{distanceKm:distanceKm(a,b),minutes:0}]);assert.deepEqual(outside.edges[0].present,[false,true]);
 assert.throws(()=>matchingRobustness([a],[{distanceKm:1,minutes:0}]),RangeError);
 assert.throws(()=>matchingRobustness([a],[{distanceKm:1,minutes:0},{distanceKm:1,minutes:0}]),RangeError);
});
test('missing exact times, fixtures and incompatible processing never create candidate robustness',()=>{
 const a=row('a','MODIS'),b={...row('b','VIIRS'),acquiredAt:null,timestampPrecision:'day' as const},c={...row('c','VIIRS'),provenance:{...a.provenance,processing:'nrt' as const}},d={...row('d','VIIRS'),provenance:{...a.provenance,fixture:true}};
 const r=matchingRobustness([a,b,c,d]);assert.equal(r.edges.length,0);assert.deepEqual(r.excludedIds,['b','d']);assert.deepEqual(r.unmatchedAcrossAll,['a','c']);
});
test('sensor differences preserve source, platform, confidence schemes, UTC precision and sparse months',()=>{
 const a=row('a','MODIS'),b=row('b','VIIRS'),c={...row('c','MODIS'),utcDate:'2020-03-01',acquiredAt:null,timestampPrecision:'day' as const};
 const r=sensorDifferences([b,c,a,a]);assert.equal(r.length,2);const modis=r.find(g=>g.sensor==='MODIS')!;
 assert.equal(modis.count,2);assert.equal(modis.exactTimes,1);assert.deepEqual(modis.months.map(m=>m.month),['2020-01','2020-03']);assert.equal(modis.observations[0].confidence.raw,80);
 assert.equal(r.find(g=>g.sensor==='VIIRS')!.observations[0].confidence.raw,'n');
 assert.equal(sensorDifferences([a,{...a,id:'other',platform:'another platform'}]).length,2);
});
test('research export is reproducible, preserves provenance and treats incomplete evidence conservatively',()=>{
 const a=row('a','MODIS'),b=row('b','VIIRS');const datasets:Dataset[]=[{id:'MODIS',title:'Synthetic',source:'SYNTHETIC TEST ONLY',kind:'archive',regionId:'ajloun',checksum:'test-checksum'}];
 const first=researchBrief([b,a],datasets,availability,{distanceKm:1,minutes:60}),second=researchBrief([a,b],datasets,availability,{distanceKm:1,minutes:60});
 assert.equal(JSON.stringify(first),JSON.stringify(second));const roundtrip=JSON.parse(JSON.stringify(first));assert.equal(roundtrip.comparison.datasets[0].checksum,'test-checksum');assert.equal(roundtrip.comparison.observations[0].confidence.raw,80);assert.equal(roundtrip.comparison.methodology.validated,false);
 assert.equal(researchBrief([],[],{...availability,state:'unavailable'},{distanceKm:1,minutes:60}).comparison.gate.every(g=>g.status==='unavailable'),true);
 assert.equal(first.questions.length,3);assert.deepEqual(first.provenanceGaps,[{datasetId:'VIIRS',missing:'datasetMetadata'}]);assert.ok(first.comparison.gate.filter(g=>['zero','anomaly'].includes(g.id)).every(g=>g.status==='unavailable'));
 assert.throws(()=>researchBrief([a,{...a,frp:5}],datasets,availability,{distanceKm:1,minutes:60}),/Conflicting/);
});
