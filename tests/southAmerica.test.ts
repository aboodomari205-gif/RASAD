import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {ACTIVE_REGIONS,activeRegion} from '../shared/regions.ts';
import {equalAreaPoint,equalAreaCell,GRID_METHOD} from '../shared/equalArea.ts';
import {pointInRegion} from '../shared/observations.ts';
import {southManifest,southCollection,southSummary,southGrid} from '../server/southAmerica.js';
import {createApp} from '../server/app.js';
import type {RegionGeometry} from '../shared/model.ts';
import {PRODUCTS,validateEnvironment} from '../scripts/import-environment.mjs';

test('active region registry is Brazil-only and excludes retired study areas',()=>{
 assert.deepEqual(ACTIVE_REGIONS.map(r=>r.id),['brazil']);assert.equal(activeRegion('south-america'),false);assert.equal(activeRegion('argentina'),false);assert.equal(activeRegion('ajloun'),false);assert.equal(activeRegion('northern-jordan'),false);
 const boundaries=JSON.parse(fs.readFileSync('public/south-america-countries.geojson','utf8'));
 for(const region of ACTIVE_REGIONS)if(region.country)assert.ok(boundaries.features.some((f:{properties:{id:string}})=>f.properties.id===region.country));
 const inside=(id:string,x:number,y:number)=>{const f=boundaries.features.find((f:{properties:{id:string}})=>f.properties.id===id);return pointInRegion(x,y,f.geometry as RegionGeometry);};
 assert.ok(inside('bra',-47.9,-15.8));assert.ok(!inside('bra',35.75,32.33));assert.ok(inside('guf',-52.33,4.93));
});
test('equal-area grid has declared metre units, origin, negative-cell floor and conserved spherical patch area',()=>{
 assert.deepEqual(equalAreaPoint(0,0),[0,0]);assert.equal(equalAreaCell(0,0,1000),'0:0');assert.equal(equalAreaCell(-0.00001,-0.00001,1000),'-1:-1');
 assert.throws(()=>equalAreaCell(0,0,375));assert.throws(()=>equalAreaPoint(181,0));
 const a=equalAreaPoint(-61,-20),b=equalAreaPoint(-60,-19);
 const area=(b[0]-a[0])*(b[1]-a[1]);
 const reference=GRID_METHOD.radiusM**2*(Math.PI/180)*(Math.sin(-19*Math.PI/180)-Math.sin(-20*Math.PI/180));
 assert.ok(Math.abs(area/reference-1)<1e-12);
});
test('environmental ingestion accepts only provenance-complete WGS84 points inside Brazil',()=>{
 const valid={product:'MOD13Q1.061',variable:'ndvi',units:PRODUCTS['MOD13Q1.061'].ndvi[2],value:0.5,coordinates:[-47.9,-15.8],crs:'EPSG:4326',sourceURL:'https://example.test/ndvi',sourceFile:'environment/sample.tif',method:'QA-filtered native pixel',nativeResolution:'250 m',qa:{status:'accepted',description:'Source QA passed'},startUTC:'2025-01-01T00:00:00Z',endUTC:'2025-01-16T00:00:00Z',scaleApplied:true};
 assert.equal(validateEnvironment({schema:'rasad.environment-input/v1',indicators:[valid]}).length,1);
 for(const coordinates of [[-52.33,4.93],[35.75,32.33]])assert.throws(()=>validateEnvironment({schema:'rasad.environment-input/v1',indicators:[{...valid,coordinates}]}),/inside Brazil/);
});
const available=fs.existsSync('server/data/south-america/active.json');
test('real activated delivery conserves counts and preserves provenance with bounded evidence pages',{skip:!available},()=>{
 const m=southManifest();assert.equal(m.metadata.mode,'brazil');assert.ok(m.metadata.totalDelivered>0);assert.equal(m.features.length,0);
 const summary=southSummary({mode:'brazil',summary:'year'});assert.equal(summary.series.reduce((n:number,r:{count:number})=>n+r.count,0),m.metadata.totalDelivered);
 const first=southCollection({mode:'brazil',limit:'20'}),next=southCollection({mode:'brazil',limit:'20',offset:'20'});
 const ids=new Set(first.features.map((f:{id:string})=>f.id));assert.ok(next.features.every((f:{id:string})=>!ids.has(f.id)));
 for(const f of first.features){assert.ok(f.geometry.coordinates[0]<0);assert.ok(f.properties.source_file);assert.ok(f.properties.source_sha256);assert.ok(f.properties.import_generation);assert.ok(f.properties.brightness_original);assert.equal(f.properties.frp_units,'MW');}
 assert.ok(first.features.every((f:{properties:{country:string}})=>f.properties.country==='bra'));
 assert.throws(()=>southManifest({mode:'south-america'}),RangeError);assert.throws(()=>southManifest({mode:'argentina'}),RangeError);assert.throws(()=>southCollection({mode:'ajloun'}),RangeError);assert.throws(()=>southCollection({frpMin:'100',frpMax:'10'}),RangeError);
 assert.throws(()=>southGrid({from:'2020-01-01',to:'2021-01-01'}),RangeError);
});
test('same-origin production API serves South America and never falls back to Jordan',{skip:!available},async()=>{
 const app=createApp({key:()=>undefined,remoteOrigin:()=>undefined});const server=app.listen(0,'127.0.0.1');await new Promise<void>(r=>server.once('listening',r));
 try{const base='http://127.0.0.1:'+(server.address() as {port:number}).port;
  for(const mode of ['ajloun','northern-jordan'])assert.equal((await fetch(base+'/api/observations?mode='+mode)).status,400);
  const r=await fetch(base+'/api/observations?manifest=1');assert.equal(r.status,200);assert.equal((await r.json()).metadata.mode,'brazil');
  for(const mode of ['south-america','argentina'])assert.equal((await fetch(base+'/api/observations?mode='+mode)).status,400);
  const grid=await fetch(base+'/api/south-america/grid?mode=brazil&size=2000');assert.equal(grid.status,200);assert.equal((await grid.json()).calibration,'NOT_CALIBRATED');
  const csv=await fetch(base+'/api/observations.csv?mode=brazil');assert.equal(csv.status,200);const text=await csv.text();assert.match(text,/source_sha256/);assert.doesNotMatch(text,/ajloun|northern-jordan/i);
 }finally{await new Promise<void>(r=>server.close(()=>r()));}
});
