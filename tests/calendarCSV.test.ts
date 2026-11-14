import test from 'node:test';
import assert from 'node:assert/strict';
import {calendarCSV} from '../src/calendar/combined.ts';
import {aggregateDailyObservations,dailyActivity} from '../src/calendar/aggregation.ts';
import type {ObservationCollection} from '../shared/model.ts';
import {loadRegionCollection} from '../server/dataCatalog.js';
import {normalizeCollection} from '../shared/observations.ts';
import {createRequire} from 'node:module';
const {parse}=createRequire(new URL('../server/package.json',import.meta.url))('csv-parse/sync');
const feature=(instrument:string,date:string,time:string,frp:number|null)=>({type:'Feature' as const,geometry:{type:'Point' as const,coordinates:[35.7,32.3]},properties:{source:'SYNTHETIC TEST ONLY',instrument,satellite:instrument==='MODIS'?'Aqua':'SNPP',date,time,confidence:instrument==='MODIS'?80:'n',frp}});
const collection:ObservationCollection={type:'FeatureCollection',metadata:{mode:'ajloun'},features:[feature('MODIS','2020-01-01','2359',null),feature('VIIRS','2020-01-02','0000',0),feature('MODIS','2020-01-01','2359',null)]};
test('source separated UTC date union preserves midnight, duplicates, missing dates and null FRP',()=>{
 const m=aggregateDailyObservations(collection,{region:'ajloun',instrument:'MODIS'}),v=aggregateDailyObservations(collection,{region:'ajloun',instrument:'VIIRS'});
 assert.deepEqual([...new Set([...m.days.keys(),...v.days.keys()])].sort(),['2020-01-01','2020-01-02']);
 assert.equal(m.days.get('2020-01-01')!.count,1);assert.equal(m.days.get('2020-01-01')!.frpSum,null);assert.equal(v.days.get('2020-01-02')!.frpSum,0);assert.equal(dailyActivity(m.days,'2020-01-02').status,'unavailable');
});
test('calendar CSV deterministic rows retain original IDs, missing FRP and exact scope without invented empty dates',()=>{
 const csv=calendarCSV(collection,{region:'ajloun',sensor:'all'},'2020-01');
 assert.equal(csv,calendarCSV({...collection,features:[...collection.features].reverse()},{region:'ajloun',sensor:'all'},'2020-01'));
 assert.equal(csv.split('\r\n').length,3);assert.ok(csv.includes('"unknown"'));assert.ok(csv.includes('"missing"'));assert.ok(csv.includes('"modis-percent"'));assert.ok(csv.includes('"viirs-categorical"'));
 assert.equal(calendarCSV(collection,{region:'ajloun',sensor:'MODIS'},'2020-01').split('\r\n').length,2);
 assert.equal(calendarCSV(collection,{region:'ajloun',sensor:'all',startDate:'2020-01-02'},'2020-01').split('\r\n').length,2);
 assert.equal(calendarCSV(collection,{region:'northern-jordan'},'2020-01').split('\r\n').length,1);
});
test('real Ajloun displayed months export exact 5 MODIS / 31 VIIRS canonical IDs without observation changes',()=>{
 const real=loadRegionCollection('ajloun',{baseline:true}),normalized=normalizeCollection(real,{region:'ajloun'});
 const months=[...new Set(normalized.observations.map(o=>o.utcDate.slice(0,7)))];
 const rows=months.flatMap(month=>parse(calendarCSV(real,{region:'ajloun',sensor:'all'},month),{columns:true}));
 assert.equal(rows.filter(r=>r.sensor==='MODIS').length,5);assert.equal(rows.filter(r=>r.sensor==='VIIRS').length,31);
 assert.deepEqual(rows.map(r=>r.observation_id).sort(),normalized.observations.map(o=>o.id).sort());
 assert.ok(rows.every(r=>r.coverage_status==='unknown'));
 const partial={...collection,metadata:{...collection.metadata,availability:{state:'partial' as const,fixture:false,quality:'partial' as const,coverage:'unknown' as const,reasons:['test-only missing partition']}}};
 assert.equal(dailyActivity(aggregateDailyObservations(partial,{region:'ajloun',instrument:'MODIS'}).days,'2020-01-02').status,'unavailable');
});
