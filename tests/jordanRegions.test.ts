import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {pointInRegion} from '../shared/observations.ts';
import {loadRegionCollection} from '../server/dataCatalog.js';
const source=JSON.parse(fs.readFileSync('server/legacy-geography/jordan-adm1.geojson','utf8'));
const members=source.features.filter(f=>['Irbid','Ajloun','Jerash','Mafraq'].includes(f.properties.shapeName));
const union=JSON.parse(fs.readFileSync('server/legacy-geography/northern-jordan.geojson','utf8')).features[0].geometry;
test('Northern Jordan union matches exact member inclusion across a deterministic geographic grid',()=>{
 assert.equal(members.length,4);assert.equal(union.type,'MultiPolygon');
 for(let x=35.4;x<39.4;x+=.07)for(let y=31.8;y<33.5;y+=.07)assert.equal(pointInRegion(x,y,union),members.some(f=>pointInRegion(x,y,f.geometry)),`${x},${y}`);
 for(const p of union.coordinates)for(const ring of p)assert.deepEqual(ring[0],ring.at(-1));
});
test('Jordan catalog retains real Ajloun identity, never copies it into Northern Jordan, and rejects retired region',()=>{
 const ajloun=loadRegionCollection('ajloun',{baseline:true}),north=loadRegionCollection('northern-jordan',{baseline:true});
 assert.equal(ajloun.features.length,36);assert.equal(ajloun.features.filter(f=>f.properties.instrument==='MODIS').length,5);
 assert.deepEqual(north.features,[]);assert.deepEqual(north.metadata.datasets,[]);assert.equal(north.metadata.availability.state,'unavailable');assert.equal(north.metadata.availability.fixture,false);
 assert.throws(()=>loadRegionCollection('brazil-test'));
});
test('shared governorate boundary is included once by the selected region geometry',()=>{
 const a=members.find(f=>f.properties.shapeName==='Ajloun').geometry;
 const vertices=(g)=>g.type==='Polygon'?g.coordinates.flat():g.coordinates.flat(2);
 const adjacent=members.filter(f=>f.properties.shapeName!=='Ajloun').flatMap(f=>vertices(f.geometry));
 const common=vertices(a).find(p=>adjacent.some(q=>p[0]===q[0]&&p[1]===q[1]));assert.ok(common,'exact source boundary vertex');assert.equal(pointInRegion(common[0],common[1],union),true);
 assert.ok(members.filter(f=>pointInRegion(common[0],common[1],f.geometry)).length>=2,'source vertex is shared by governorates');
});
