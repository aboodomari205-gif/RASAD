import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {decodePilotPacket} from '../shared/pilotPacket.js';
import {harmonizationLab} from '../shared/harmonizationLab.js';
import {researchRows,southCollection,southHarmonization} from '../server/southAmerica.js';

test('committed static pilot conserves every authentic indexed coordinate, source, UTC, native confidence and FRP',()=>{
 const bytes=fs.readFileSync('deployment/pilot/evidence.json'),manifest=JSON.parse(fs.readFileSync('deployment/pilot/manifest.json','utf8')),snapshot=decodePilotPacket(JSON.parse(bytes.toString()));
 assert.equal(createHash('sha256').update(bytes).digest('hex'),manifest.sha256);assert.ok(bytes.length<1024*1024);assert.equal(snapshot.rows.length,6876);
 const query={mode:'brazil',from:'2024-08-01',to:'2024-08-31',bbox:'-57,-14,-55,-12'},original=[...researchRows(query).rows],byId=new Map(original.map(r=>[r.id,r]));
 assert.equal(byId.size,snapshot.rows.length);
 for(const row of snapshot.rows){const real=byId.get(row.id);assert.ok(real);for(const key of ['lon','lat','timestamp','frp'])assert.equal(row[key],real[key]);assert.equal(row.raw.confidence,real.raw.confidence);assert.equal(row.dataset.id,real.dataset.id);assert.equal(row.delivery.sha256,real.delivery.sha256);}
 const page=southCollection({...query,limit:'3000'}),features=new Map(snapshot.features.map(f=>[f.id,f]));
 for(const real of page.features){const actual=features.get(real.id);assert.ok(actual);assert.deepEqual(actual.geometry,real.geometry);for(const key of ['date','time','acquiredAt','confidence','frp','datasetId','source_sha256','source_line','source_version'])assert.equal(actual.properties[key],real.properties[key]);}
 for(const support of ['h3','equal-area']){const actual=harmonizationLab(snapshot.rows,{support}),real=southHarmonization({...query,support});assert.deepEqual(actual.overlap,real.overlap);assert.equal(actual.count,real.count);}
});

test('static packet rejects missing rows and records outside the declared authentic pilot',()=>{
 const packet=JSON.parse(fs.readFileSync('deployment/pilot/evidence.json','utf8'));
 assert.throws(()=>decodePilotPacket({...packet,observations:packet.observations.slice(1)}),/count mismatch/);
 packet.observations[0][1]=0;assert.throws(()=>decodePilotPacket(packet),/pilot scope/);
});
