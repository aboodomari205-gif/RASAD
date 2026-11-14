import test from 'node:test';
import assert from 'node:assert/strict';
import { ingestFirmsCSV } from './firmsArchive.js';
const header='latitude,longitude,brightness,scan,track,acq_date,acq_time,satellite,instrument,confidence,version,bright_t31,frp,daynight,type';
const boundary={type:'Polygon',coordinates:[[[35,32],[36,32],[36,33],[35,33],[35,32]]]};
const dataset={id:'synthetic-export',title:'SYNTHETIC SCHEMA TEST ONLY',source:'SYNTHETIC',kind:'archive',regionId:'ajloun',sensor:'VIIRS',product:'VNP14IMGTML',version:'2',processing:'standard',archiveProfile:'viirs-snpp-firms-export'};
test('explicit export keeps SNPP instrument and temperatures opaque while canonicalizing UTC and sensor',()=>{
 const row='32.3,35.7,330,0.4,0.4,2020-02-29,0001,SNPP,SNPP,n,2,290,,N,0';
 const result=ingestFirmsCSV(header+'\n'+row+'\n'+row,{dataset,boundary});
 assert.equal(result.observations.length,1);
 const o=result.observations[0];assert.equal(o.sensor,'VIIRS');assert.equal(o.sensorRaw,'SNPP');assert.equal(o.platform,'S-NPP');assert.equal(o.acquiredAt,'2020-02-29T00:01:00.000Z');assert.equal(o.frp,null);assert.equal(o.provenance.version,'2');assert.equal(o.confidence.scheme,'viirs-categorical');
 assert.equal(o.feature.properties.archiveRaw.bright_t31,'290');assert.equal(o.feature.properties.bright_ti5,undefined);
 assert.equal(ingestFirmsCSV(header+'\n'+row.replace(',2,290',',99,290'),{dataset,boundary}).diagnostics.rejectedRecords,1);
});
test('MODIS export preserves distinct original version strings and numerical confidence',()=>{
 const d={...dataset,sensor:'MODIS',product:'MCD14ML',version:'6.1',archiveProfile:'modis-firms-export'};
 const row=v=>`32.3,35.7,330,1,1,2020-02-29,2359,Aqua,MODIS,88,${v},290,3,N,0`;
 const result=ingestFirmsCSV(header+'\n'+row('6.03')+'\n'+row('61.03'),{dataset:d,boundary});
 assert.deepEqual(result.observations.map(o=>o.provenance.version),['6.03','61.03']);assert.ok(result.observations.every(o=>o.confidence.scheme==='modis-percent'));
 assert.throws(()=>ingestFirmsCSV(header,{dataset:{...d,product:'wrong'},boundary}),{code:'ARCHIVE_PROFILE'});
});
