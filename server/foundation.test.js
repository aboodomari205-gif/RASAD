const unconfiguredLoad = (region,options)=>{if(options?.datasetId){const e=new Error('Unknown dataset');e.code='DATASET_NOT_FOUND';throw e;}return ({type:'FeatureCollection',features:[],metadata:{mode:region,region:region==='ajloun'?'Ajloun, Jordan':'Northern Jordan',datasets:[],developmentFixture:false,coverage:[],availability:{state:'unavailable',fixture:false,quality:'complete',coverage:'unknown',reasons:['Isolated test source unavailable']}}});};
import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import { ingestFirmsCSV } from './firmsArchive.js';
import { readArchiveCSV, loadArchiveCollection } from './dataCatalog.js';
import { registerObservations } from './observations.js';
const dataset = { id: 'test-archive', title: 'Test-only archive', regionId: 'ajloun', kind: 'archive', source: 'Test-only NASA FIRMS', sensor: 'VIIRS', platform: 'N20', product: 'VIIRS_375m', version: '2.0', processing: 'standard' };
const boundary = { type: 'Polygon', coordinates: [[[35, 32], [36, 32], [36, 33], [35, 33], [35, 32]]] };
const header = 'latitude,longitude,acq_date,acq_time,satellite,instrument,confidence,frp,version';
const row = '32.33,35.75,2026-11-07,5,N20,VIIRS,n,0,2.0';
test('archive adapter validates schema, reports malformed rows, clips region, deduplicates and normalizes UTC', () => {
  const csv = [header, row, row, ',35.75,2026-11-07,1715,N20,VIIRS,n,4,2.0', '32.33,35.75,2026-11-07,1715', '32.33,35.75,2026-02-30,1715,N20,VIIRS,n,4,2.0', '-9,-62,2026-11-07,1715,N20,VIIRS,n,4,2.0'].join('\n');
  const result = ingestFirmsCSV(csv, { dataset, boundary });
  assert.equal(result.diagnostics.inputRecords, 6); assert.equal(result.diagnostics.acceptedRecords, 2); assert.equal(result.diagnostics.rejectedRecords, 3); assert.equal(result.diagnostics.regionExcluded, 1); assert.equal(result.diagnostics.duplicatesRemoved, 1);
  assert.equal(result.observations.length, 1); assert.equal(result.observations[0].acquiredAt, '2026-11-07T00:05:00.000Z'); assert.equal(result.observations[0].frp, 0); assert.equal(result.availability.state, 'partial');
  assert.equal(result.diagnostics.issues.some(issue => issue.row === 5 && issue.code === 'COLUMN_COUNT'), true);
  assert.equal(result.dataset.checksum.length, 64);
  assert.equal(result.observations[0].feature.properties.version, '2.0');
});
test('archive schema/provenance failures are explicit; quoted syntax is never guessed or raw data exposed', () => {
  assert.throws(() => ingestFirmsCSV('latitude,longitude\n1,2', { dataset, boundary }), { code: 'CSV_SCHEMA' });
  assert.throws(() => ingestFirmsCSV('latitude,latitude,longitude,acq_date,acq_time\n1,1,2,2026-11-07,1715', { dataset, boundary }), { code: 'CSV_SCHEMA' });
  assert.throws(() => ingestFirmsCSV(header + '\n"unclosed', { dataset, boundary }), { code: 'CSV_SYNTAX' });
  assert.throws(() => ingestFirmsCSV(header, { dataset }), { code: 'REGION_BOUNDARY_REQUIRED' });
  assert.throws(() => ingestFirmsCSV(header, { dataset: { ...dataset, kind: 'fixture' }, boundary }), { code: 'FIXTURE_ISOLATION' });
  const mixed = ingestFirmsCSV(header + '\n' + row.replace(',2.0', ',2.0NRT'), { dataset, boundary }); assert.equal(mixed.observations.length, 0); assert.equal(mixed.diagnostics.rejectedRecords, 1);
});
test('null/malformed FRP remains a detection; sensor/processing conflicts are rejected', () => {
  const result = ingestFirmsCSV([header, row.replace(',0,2.0', ',,2.0'), row.replace(',0,2.0', ',bad,2.0'), row.replace(',VIIRS,', ',MODIS,')].join('\n'), { dataset, boundary });
  assert.equal(result.observations.length, 2); assert.equal(result.observations.every(o => o.frp === null), true); assert.equal(result.diagnostics.rejectedRecords, 1); assert.equal(result.diagnostics.issues.some(issue => issue.code === 'INVALID_FRP'), true);
});
test('known archive product metadata can supply sensor/platform; absent context never fabricates them', () => {
  const csv = 'latitude,longitude,acq_date,acq_time,confidence,frp\n32.33,35.75,2026-11-07,5,n,4';
  const result = ingestFirmsCSV(csv, { dataset, boundary });
  assert.equal(result.observations[0].sensor, 'VIIRS'); assert.equal(result.observations[0].platform, 'N20'); assert.equal(result.observations[0].sensorRaw, null); assert.equal(result.observations[0].platformRaw, null);
  assert.throws(() => ingestFirmsCSV(csv, { dataset: { ...dataset, sensor: undefined }, boundary }), { code: 'ARCHIVE_PROVENANCE' });
});
test('archive path guards reject traversal and secret/non-CSV names before any file read', () => {
  for (const file of ['../.env', '.env', 'other.json', 'subdir/test.csv', 'C:\\outside.csv']) assert.throws(() => readArchiveCSV(file), { code: 'DATASET_PATH' });
});
async function withAPI(work, options) {
  const app = express(); registerObservations(app, { load: unconfiguredLoad, ...options }); const server = app.listen(0, '127.0.0.1'); await new Promise(resolve => server.once('listening', resolve));
  try { await work(`http://127.0.0.1:${server.address().port}`); } finally { await new Promise(resolve => server.close(resolve)); }
}
test('versioned Jordan APIs preserve explicit unavailable data and reject invalid filters', async()=>{await withAPI(async base=>{for(const region of ['ajloun','northern-jordan']){const body=await(await fetch(base+'/api/intelligence/observations?region='+region)).json();assert.equal(body.availability.state,'unavailable');assert.equal(body.availability.fixture,false);assert.deepEqual(body.observations,[]);assert.deepEqual(body.coverage,[]);}for(const query of ['from=2026-02-30','from=2027-01-01&to=2026-01-01','sensor=fire','region=brazil-test','bbox=1,,3,4','confidenceX=n'])assert.equal((await fetch(base+'/api/intelligence/observations?'+query)).status,400);assert.equal((await fetch(base+'/api/intelligence/observations?region=northern-jordan&datasetId=unknown')).status,404);});});
test('versioned errors are typed and sanitized, while existing endpoint keeps its failure status', async () => {
  await withAPI(async base => {
    const response = await fetch(base + '/api/intelligence/observations'); const body = await response.json();
    assert.equal(response.status, 503); assert.equal(body.availability.state, 'error'); assert.equal(body.error.code, 'DATA_UNAVAILABLE'); assert.equal(body.error.message.includes('internal detail'), false);
    assert.equal((await fetch(base + '/api/observations')).status, 503);
  }, { load() { throw new Error('internal detail must not leak'); } });
});

test('archive catalog preserves successful datasets and reports partial/error source availability', () => {
  const missing = { ...dataset, id: 'missing-modis', sensor: 'MODIS', filename: 'missing.csv' };
  const sources = [{ ...dataset, filename: 'valid.csv' }, missing];
  const dependencies = { geometry: () => boundary, read(filename) { if (filename === 'missing.csv') throw new Error('internal path'); return header + '\n' + row; } };
  const partial = loadArchiveCollection('ajloun', sources, dependencies);
  assert.equal(partial.metadata.availability.state, 'partial'); assert.equal(partial.features.length, 1); assert.equal(partial.metadata.datasetErrors.length, 1); assert.equal(partial.metadata.datasets[1].availability.state, 'error');
  assert.equal(JSON.stringify(partial.metadata.datasetErrors).includes('internal path'), false);
  const failed = loadArchiveCollection('ajloun', [missing], dependencies); assert.equal(failed.metadata.availability.state, 'error'); assert.equal(failed.features.length, 0);
});
test('platform and checksum validation prevent misattribution; extra CSV columns cannot shadow UTC fields', () => {
  const mismatch = ingestFirmsCSV(header + '\n' + row.replace('N20', 'N21'), { dataset, boundary }); assert.equal(mismatch.diagnostics.rejectedRecords, 1);
  assert.throws(() => ingestFirmsCSV(header, { dataset: { ...dataset, checksum: 'incorrect' }, boundary }), { code: 'CHECKSUM_MISMATCH' });
  const hex = ingestFirmsCSV(header + '\n' + row.replace('32.33', '0x20'), { dataset, boundary }); assert.equal(hex.observations.length, 0);
  const extra = ingestFirmsCSV(header + ',date,time\n' + row + ',2099-01-01,2359', { dataset, boundary });
  assert.equal(extra.observations[0].feature.properties.date, '2026-11-07'); assert.equal(extra.observations[0].feature.properties.raw_date, '2099-01-01'); assert.equal(extra.observations[0].acquiredAt, '2026-11-07T00:05:00.000Z');
});
