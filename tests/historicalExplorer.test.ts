import test from 'node:test';
import assert from 'node:assert/strict';
import {selectedAtlasYear,selectAtlasYear,observedAtlasDates} from '../shared/atlasTemporal.ts';
import {compareDeliveredYears} from '../shared/historyComparison.ts';
import {historicalSummary} from '../shared/historySummary.ts';
import {normalizeCollection} from '../shared/observations.ts';
import {loadRegionCollection} from '../server/dataCatalog.js';
import {reconcileRegionScope} from '../shared/regionScope.ts';
import {filterObservationCollection} from '../src/data/observations.ts';

test('Atlas year changes bound one UTC shard, clear incompatible day/time and preserve independent region years',()=>{
 const scope=selectAtlasYear('2006','ajloun',{'northern-jordan':'2021'});
 assert.equal(scope.startDate,'2006-01-01');assert.equal(scope.endDate,'2006-12-31');assert.equal(scope.calendarDay,null);assert.equal(scope.startTime,undefined);assert.deepEqual(scope.regionalYears,{ajloun:'2006','northern-jordan':'2021'});
 assert.equal(selectedAtlasYear({...scope,calendarMonth:'2026-01'}),'2006');assert.throws(()=>selectAtlasYear('20266','ajloun'),/Invalid/);
});
test('Atlas dates respect sensor and processing while ignoring the single selected date',()=>{
 const collection=loadRegionCollection('northern-jordan',{filter:{startDate:'2021-01-01',endDate:'2021-12-31'}});
 const scope={region:'northern-jordan' as const,sensor:'MODIS',processing:'standard' as const,startDate:'2021-07-01',endDate:'2021-07-01'};
 const expected=[...new Set(normalizeCollection(collection,{region:scope.region}).observations.filter(o=>o.sensor==='MODIS'&&o.provenance.processing==='standard').map(o=>o.utcDate))].sort();
 assert.deepEqual(observedAtlasDates(collection,scope,filterObservationCollection),expected);assert.ok(expected.length>1);
});
test('An unavailable historical year is retained explicitly, never silently reset to the latest year',()=>{
 const collection=loadRegionCollection('ajloun',{filter:{startDate:'2001-01-01',endDate:'2001-12-31'}});collection.metadata={...collection.metadata,historical:true,observedExtent:['2006-12-03','2026-09-04'],availableYears:['2006','2026']};
 const scope={region:'ajloun' as const,sensor:'all',calendarMonth:'2001-07',startDate:'2001-07-01',endDate:'2001-07-01'};const next=reconcileRegionScope(scope,collection);
 assert.equal(next.startDate,scope.startDate);assert.equal(next.calendarMonth,scope.calendarMonth);
});
test('Historical comparison separates platform, revision and processing; missing contributions stay null',()=>{
 const rows=normalizeCollection(loadRegionCollection('ajloun'),{region:'ajloun'}).observations;
 const summary=historicalSummary(rows,'ajloun'),result=compareDeliveredYears(summary,'2021','2026');
 assert.equal(result.rows.reduce((n,r)=>n+(r.first??0),0),13);assert.equal(result.rows.reduce((n,r)=>n+(r.second??0),0),10);assert.ok(result.rows.some(r=>r.first===null));assert.equal(result.coverage,'unknown');assert.equal(result.calibrated,false);
 assert.deepEqual(result,compareDeliveredYears({...summary,series:[...summary.series].reverse()},'2021','2026'));
});
