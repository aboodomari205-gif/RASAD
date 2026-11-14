const unconfiguredLoad = region => ({type:'FeatureCollection',features:[],metadata:{mode:region,region:region==='ajloun'?'Ajloun, Jordan':'Northern Jordan',datasets:[],developmentFixture:false,coverage:[],availability:{state:'unavailable',fixture:false,quality:'complete',coverage:'unknown',reasons:['Isolated test source unavailable']}}});
import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import { parseNASAData, loadNASAData, observationCollection } from './processData.js';
import { registerObservations } from './observations.js';
const header = 'latitude,longitude,acq_date,acq_time,satellite,instrument,confidence,frp';
test('validates coordinates, dates, UTC time and preserves raw metadata', () => {
  const data = parseNASAData(header + '\n-9,-62,2026-11-07,5,N20,VIIRS,n,0\n,-62,2026-11-07,1715,N20,VIIRS,n,3\n91,0,2026-11-07,1715,N20,VIIRS,n,3\n1,2,2026-02-30,1715,N20,VIIRS,n,3\n1,2,2026-11-07,2460,N20,VIIRS,n,3\n1,2,2026-11-07,1715,Terra,MODIS,85,invalid');
  assert.equal(data.validRecords, 2);
  assert.equal(data.rejectedRecords, 4);
  assert.equal(data.observations[0].acquiredAt, '2026-11-07T00:05:00.000Z');
  assert.equal(data.observations[0].frp, 0);
  assert.equal(data.observations[1].confidence, '85');
  assert.equal(data.observations[1].frp, null);
  assert.deepEqual(observationCollection(data).features[0].geometry.coordinates, [-62, -9]);
  assert.throws(() => parseNASAData('latitude,longitude\n1,2'));
  assert.equal(parseNASAData(header + '\n').validRecords, 0);
  assert.throws(() => loadNASAData('../anything'));
});
test('HTTP modes isolate Ajloun from unavailable Northern Jordan and reject unsupported modes', async () => {
  const app = express(); registerObservations(app, { load: unconfiguredLoad });
  const server = app.listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  try {
    const ajloun = await (await fetch(base + '/api/observations')).json();
    assert.deepEqual(ajloun.features, []);
    assert.equal(ajloun.metadata.mode, 'ajloun');
    assert.equal((await fetch(base + '/api/observations?mode=unknown')).status, 400);
    const brazil = await (await fetch(base + '/api/observations?mode=northern-jordan')).json();
    assert.equal(brazil.metadata.region,'Northern Jordan');assert.deepEqual(brazil.features,[]);assert.equal(brazil.metadata.availability.state,'unavailable');assert.equal(brazil.metadata.developmentFixture,false);assert.equal((await fetch(base+'/api/observations?mode=brazil-test')).status,400);
  } finally { await new Promise(resolve => server.close(resolve)); }
});
