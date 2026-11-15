import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync} from 'node:fs';
// @ts-ignore Shared runtime JavaScript module.
import {PILOT,pilotEvidence,validatePolygon} from '../shared/pilot.js';
// @ts-ignore Node API module.
import {southPilot} from '../server/southAmerica.js';

test('pilot H3 progression preserves sources, unknown opportunity, null FRP and date gaps',()=>{
 const row=(id:string,date:string,frp:number|null)=>({lon:-56,lat:-13,timestamp:date+'T12:00:00Z',frp,dataset:{id,sensor:id==='modis'?'MODIS':'VIIRS',platform:id,processing:'standard'}});
 const result=pilotEvidence([row('modis','2024-08-01',null),row('viirs','2024-08-01',0),row('modis','2024-08-04',2),{...row('modis','2024-08-04',5),lon:-60}],{from:'2024-08-01',to:'2024-08-31'});
 assert.equal(result.count,3);assert.equal(result.activeCells,1);assert.ok(result.cells[0].areaKm2>0);assert.equal(result.cells[0].sources.length,2);
 assert.equal(result.daily[0].frpSum,null);assert.equal(result.daily[1].frpSum,0);
 assert.equal(result.daily[2].repeatedFromPriorObservedDate,1);assert.equal(result.daily[2].priorObservedDate,'2024-08-01');assert.equal(result.daily[2].newInWindowCells,0);
 assert.ok(result.daily.every((r:{coverage:string})=>r.coverage==='unknown'));assert.equal(result.calibration,'NOT VALIDATED');
 assert.deepEqual(result.cells[0].observedDates,['2024-08-01','2024-08-04']);
 assert.throws(()=>validatePolygon({type:'Polygon',coordinates:[[[0,0],[1,0],[0,1],[0,0]]]}));
 assert.deepEqual(validatePolygon(PILOT.polygon),PILOT.polygon);
});

test('real Brazil pilot has MODIS/VIIRS detected overlap, rejects retired scope and bounds expensive queries',{skip:!existsSync('server/data/south-america/active.json')},()=>{
 assert.throws(()=>southPilot({mode:'south-america',from:'2024-08-01',to:'2024-08-02'}));
 assert.throws(()=>southPilot({mode:'brazil',region:'ajloun',from:'2024-08-01',to:'2024-08-02'}));
 assert.throws(()=>southPilot({mode:'brazil',from:'2024-01-01',to:'2024-08-31'}));
 const result=southPilot({mode:'brazil',from:'2024-08-01',to:'2024-08-02'});
 assert.ok(result.count>0);assert.ok(result.daily.some((r:{sensor:string})=>r.sensor==='MODIS'));assert.ok(result.daily.some((r:{sensor:string})=>r.sensor==='VIIRS'));
 assert.ok(result.cells.some((c:{sources:string[]})=>c.sources.length>1));
 assert.equal(result.model.trainingSamples,0);assert.equal(result.model.holdoutMetrics,null);assert.equal(result.region,'brazil');
});
