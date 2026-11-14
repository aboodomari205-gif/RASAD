import test from 'node:test';
import assert from 'node:assert/strict';
import type { ObservationCollection } from '../shared/model.ts';
import { reconcileRegionScope, type RegionalScope } from '../shared/regionScope.ts';
const collection=(region:'ajloun'|'northern-jordan',sensor='VIIRS'):ObservationCollection=>({type:'FeatureCollection',metadata:{mode:region,developmentFixture:region==='northern-jordan',datasets:[{id:region,title:'SYNTHETIC ONLY',source:'SYNTHETIC',regionId:region,kind:region==='northern-jordan'?'fixture':'archive',sensor:sensor as 'VIIRS'|'MODIS'}]},features:['01','18'].map(day=>({type:'Feature',geometry:{type:'Point',coordinates:region==='ajloun'?[35.7,32.3]:[-62,-9]},properties:{date:(region==='ajloun'?'2025-10-':'2026-11-')+day,time:'1200',instrument:sensor,satellite:'S-NPP',confidence:'n',frp:10}}))});
const scope:RegionalScope={region:'northern-jordan',sensor:'MODIS',calendarMonth:'2025-10',startDate:'2020-08-02',endDate:'2025-10-18',startTime:'2020-08-02T00:00:00Z',endTime:'2025-10-18T23:59:00Z',confidenceRaw:'88',calendarDay:'2025-10-18',seasonYears:['2025'],platform:'Aqua',datasetIds:['ajloun'],bbox:[35,32,36,33],fixture:'exclude',frpMin:999};
test('region transition removes incompatible dates, sensor/source/quality filters and adapts calendar, without changing metric choices',()=>{
 const result=reconcileRegionScope({...scope,metric:'frp'},collection('northern-jordan'));
 assert.equal(result.sensor,'all');assert.equal(result.startDate,undefined);assert.equal(result.endDate,undefined);assert.equal(result.endTime,undefined);assert.equal(result.confidenceRaw,'all');assert.equal(result.platform,undefined);assert.equal(result.datasetIds,undefined);assert.equal(result.bbox,undefined);assert.equal(result.fixture,undefined);assert.equal(result.frpMin,undefined);assert.equal(result.calendarMonth,'2026-11');assert.equal(result.calendarDay,null);assert.equal(result.seasonYears,undefined);assert.equal(result.metric,'frp');
 const back=reconcileRegionScope({...result,region:'ajloun',startDate:'2026-11-07',endDate:'2026-11-07'},collection('ajloun'));
 assert.equal(back.startDate,undefined);assert.equal(back.calendarMonth,'2025-10');assert.equal(scope.sensor,'MODIS');
});
test('compatible sensor, confidence, FRP and overlapping or empty-but-in-range date choices survive reconciliation',()=>{
 const valid:RegionalScope={region:'northern-jordan',sensor:'VIIRS',confidenceRaw:'n',frpMin:5,frpMax:20,startDate:'2026-11-02',endDate:'2026-11-10',calendarMonth:'2026-11'};
 assert.deepEqual(reconcileRegionScope(valid,collection('northern-jordan')),valid);
 const partial={...valid,startDate:'2020-01-01'};assert.deepEqual(reconcileRegionScope(partial,collection('northern-jordan')),partial);
});
test('unavailable, wrong-region and failed collections never reconcile a destination using unrelated data',()=>{
 assert.equal(reconcileRegionScope(scope,collection('ajloun')),scope);
 const unavailable:ObservationCollection={type:'FeatureCollection',features:[],metadata:{mode:'northern-jordan',availability:{state:'error',fixture:true,coverage:'unknown',quality:'partial',reasons:[]}}};
 assert.equal(reconcileRegionScope(scope,unavailable),scope);
});
