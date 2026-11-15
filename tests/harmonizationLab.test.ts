import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
// @ts-ignore Node runtime JS.
import {southHarmonization,southCollection} from '../server/southAmerica.js';
// @ts-ignore Shared runtime JS.
import {harmonizationLab} from '../shared/harmonizationLab.js';
test('same-cell different-date detections do not create a same-day pair, null FRP stays unknown',()=>{
 const row=(id:string,date:string,frp:number|null)=>({id:id+date,lon:-56,lat:-13,timestamp:date+'T12:00:00Z',frp,raw:{confidence:id==='m'?80:'n'},dataset:{id,sensor:id==='m'?'MODIS':'VIIRS',platform:id}});
 const result=harmonizationLab([row('m','2024-08-01',null),row('v','2024-08-02',0)]);
 assert.equal(result.count,2);assert.equal(result.activeCells,1);assert.equal(result.overlap.pairs[0].coDetectedCellDays,0);assert.equal(result.overlap.pairs[0].modisOnlyDelivered,1);assert.equal(result.sources[0].frpSum,null);assert.equal(result.sources[1].frpSum,0);
 assert.equal(result.points.MODIS[0].lon,-56);assert.equal(result.points.MODIS[0].confidence,80);assert.equal(result.opportunity,'UNKNOWN');
 assert.throws(()=>harmonizationLab([],{support:'invalid'}));assert.throws(()=>harmonizationLab([],{size:375}));
});
test('real interactive H3 worked example exactly reconciles with checked source-pair artifact', {skip:!fs.existsSync('server/data/south-america/active.json')},()=>{
 const real=southHarmonization({mode:'brazil',from:'2024-08-01',to:'2024-08-31'});
 const expected=JSON.parse(fs.readFileSync('models/brazil-frp-evaluation.json','utf8')).overlap.pairs;
 assert.equal(real.count,6876);assert.equal(real.activeCells,152);assert.equal(real.sources.reduce((n:number,s:{count:number})=>n+s.count,0),6876);
 for(let i=0;i<4;i++){for(const field of ['coDetectedCellDays','modisOnlyDelivered','viirsOnlyDelivered','deliveredJaccard'])assert.equal(real.overlap.pairs[i][field],expected[i][field]);}
 assert.equal(real.cellDays.length,988);assert.ok(real.points.MODIS.length<=600);assert.ok(real.points.VIIRS.length<=600);
});
test('real equal-area support conserves counts, declared areas and country/date bounds', {skip:!fs.existsSync('server/data/south-america/active.json')},()=>{
 const real=southHarmonization({mode:'brazil',from:'2024-08-01',to:'2024-08-02',support:'equal-area',size:'5000'});
 assert.ok(real.count>0);assert.ok(real.cells.every((c:{areaKm2:number})=>c.areaKm2===25));assert.equal(real.cellDays.reduce((n:number,r:{count:number})=>n+r.count,0),real.count);
 assert.throws(()=>southHarmonization({mode:'jordan',from:'2024-08-01',to:'2024-08-01'}));assert.throws(()=>southHarmonization({from:'2024-08-01',to:'2024-09-01'}));
});
test('restored map native API clips original positions to pilot bbox and preserves sensor filtering',{skip:!fs.existsSync('server/data/south-america/active.json')},()=>{
 const query={mode:'brazil',from:'2024-08-24',to:'2024-08-24',bbox:'-57,-14,-55,-12'};
 for(const sensor of ['MODIS','VIIRS']){const data=southCollection({...query,sensor});assert.ok(data.features.length>0);assert.ok(data.features.every((f:{geometry:{coordinates:number[]};properties:{instrument:string}})=>f.properties.instrument===sensor&&f.geometry.coordinates[0]>=-57&&f.geometry.coordinates[0]<=-55&&f.geometry.coordinates[1]>=-14&&f.geometry.coordinates[1]<=-12));}
 assert.throws(()=>southCollection({...query,bbox:'invalid'}));
});
