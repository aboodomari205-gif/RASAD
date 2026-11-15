import {calendarSVG} from '../src/calendar/visualization.ts';
import {includesWholeUTCMonth} from '../shared/observedPeriods.ts';
import test from 'node:test';
import assert from 'node:assert/strict';
import {NAVIGATION, sectionName} from '../src/state/mission.ts';
import {southGrid, southCollection, southSummary} from '../server/southAmerica.js';
import {existsSync} from 'node:fs';

test('five public RASAD sections retain scientific subview membership',()=>{
 assert.deepEqual(NAVIGATION.map(n=>n.name),['Mission Atlas','Burning Calendar','Activity Intelligence','Sensor Harmonization','Research & Export']);
 assert.equal(sectionName('Fire DNA'),'Burning Calendar');
 assert.equal(sectionName('Evidence Engine'),'Sensor Harmonization');
 assert.equal(sectionName('Decision Brief'),'Research & Export');
});
test('real grid sensitivity reconciles source occupancy and set identities', {skip:!existsSync('server/data/south-america/active.json')},()=>{
 const g=southGrid({mode:'brazil',from:'2026-11-13',to:'2026-11-13',size:'2000'});
 assert.match(g.generation,/^[a-f0-9]{16}$/);
 assert.deepEqual(g.sensitivity.map(e=>e.sizeM),[1000,2000,5000]);
 for(const e of g.sensitivity){assert.equal(e.unionCells,e.modisCells+e.viirsCells-e.intersectionCells);assert.ok(e.intersectionCells<=Math.min(e.modisCells,e.viirsCells));}
 for(const row of g.rows){assert.equal(g.sensitivity[1].sources.find(s=>s.datasetId===row.datasetId)?.activeCells,row.activeCells);assert.ok(row.activeCells<=row.count);}
 assert.ok(g.cellPreview.cells.length<=1200);assert.equal(g.coverage,'unknown');assert.equal(g.calibration,'NOT_CALIBRATED');
 const only=southGrid({mode:'brazil',from:'2026-11-13',to:'2026-11-13',sensor:'MODIS'});
 assert.ok(only.sensitivity.every(e=>e.viirsCells===0&&e.intersectionCells===0));
 const empty=southGrid({from:'1990-01-01',to:'1990-01-01'});assert.deepEqual(empty.rows,[]);assert.equal(empty.coverage,'unknown');
});
test('bounded source preview preserves original UTC and processing identities',{skip:!existsSync('server/data/south-america/active.json')},()=>{
 const c=southCollection({from:'2026-11-13',to:'2026-11-13',sensor:'MODIS',limit:'10'});
 assert.ok(c.features.length>0);assert.ok(c.features.every(f=>f.properties.instrument==='MODIS'&&f.properties.processing==='nrt'&&f.properties.date==='2026-11-13'));
});

test('partial month selections cannot use full-month reference scores, including leap February',()=>{
 assert.ok(includesWholeUTCMonth('2024-02','2024-02-01','2024-02-29'));
 assert.ok(!includesWholeUTCMonth('2024-02','2024-02-01','2024-02-28'));
 assert.ok(!includesWholeUTCMonth('2023-02','2023-02-02','2023-02-28'));
 assert.ok(includesWholeUTCMonth('2023-02','2023-01-01','2023-03-01'));
 assert.throws(()=>includesWholeUTCMonth('2024-13'));
});

test('scalable SVG metadata uses complete daily summaries rather than bounded evidence counts',{skip:!existsSync('server/data/south-america/active.json')},()=>{
 const query={mode:'brazil',from:'2026-11-13',to:'2026-11-13',sensor:'MODIS'};
 const c=southCollection({...query,limit:'10'});const summary=southSummary({...query,summary:'day'});c.metadata.dailySummary=summary.series;
 const svg=calendarSVG(c,{region:'brazil',sensor:'MODIS'},'2026-11','count',{title:'Calendar',region:'Brazil',unknown:'Unknown',caveat:'Not fires',coverage:'Unknown',utc:'UTC',records:'Records',frpNote:'MW',weekdays:['M','T','W','T','F','S','S'],direction:'ltr'});
 const encoded=svg.match(/<metadata>(.*?)<\/metadata>/)![1];const data=JSON.parse(encoded.replaceAll('&quot;','"').replaceAll('&apos;',"'").replaceAll('&lt;','<').replaceAll('&gt;','>').replaceAll('&amp;','&'));
 const day=data.days.find((d:{date:string})=>d.date==='2026-11-13');assert.equal(day.sources[0].count,summary.series.reduce((n,r)=>n+r.count,0));assert.ok(day.sources[0].count>c.features.length);assert.equal(data.evidenceIsBounded,true);
});
