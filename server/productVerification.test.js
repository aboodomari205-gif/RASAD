// SYNTHETIC SCHEMA ROWS ONLY. No delivered NASA archive is asserted to be validated.
import test from 'node:test';
import assert from 'node:assert/strict';
import { Readable } from 'node:stream';
import { ingestFirmsCSV } from './firmsArchive.js';
import { importArchiveStream } from './importArchive.js';
import { requireVerifiedExportSemantics } from './productVerification.js';

const header = 'latitude,longitude,brightness,scan,track,acq_date,acq_time,satellite,instrument,confidence,version,bright_t31,frp,daynight,type';
const row = version => `32.33,35.75,330,1,1,2020-02-29,2359,T,MODIS,88,${version},290,3.5,N,0`;
const boundary = { type: 'Polygon', coordinates: [[[35,32],[36,32],[36,33],[35,33],[35,32]]] };
const dataset = { id: 'synthetic-product-review', title: 'SYNTHETIC TEST ONLY', source: 'SYNTHETIC TEST ONLY', kind: 'archive', regionId: 'ajloun', sensor: 'MODIS', product: 'MCD14ML', version: '6.1', processing: 'standard', archiveProfile: 'modis-c61' };
test('MODIS 6.03 and 61.03 are stopped for review, never rewritten or called malformed', () => {
  for (const version of ['6.03', '61.03']) {
    const csv = header + '\n' + row(version);
    assert.throws(() => ingestFirmsCSV(csv, { dataset, boundary }), { code: 'PRODUCT_VERIFICATION_REQUIRED' });
    assert.throws(() => ingestFirmsCSV(csv, { dataset: { ...dataset, version }, boundary }), { code: 'PRODUCT_VERIFICATION_REQUIRED' });
    assert.ok(csv.includes(',' + version + ','));
  }
  const result = ingestFirmsCSV(header + '\n' + row('6.1'), { dataset, boundary });
  assert.equal(result.observations[0].feature.properties.archiveRaw.version, '6.1');
});
test('shared VIIRS export headers block both profile and generic archive paths without guessing channels', () => {
  const csv = header + '\n' + row('2.0').replace('T,MODIS,88', 'N,VIIRS,n');
  for (const archiveProfile of ['viirs-snpp', undefined]) assert.throws(() => ingestFirmsCSV(csv, { dataset: { ...dataset, sensor: 'VIIRS', product: 'VNP14IMGML', version: '2.0', archiveProfile }, boundary }), { code: 'PRODUCT_VERIFICATION_REQUIRED' });
  assert.doesNotThrow(() => requireVerifiedExportSemantics({ kind: 'fixture', sensor: 'VIIRS' }, header.split(',')));
  assert.throws(() => requireVerifiedExportSemantics({ kind: 'archive', sensor: 'VIIRS' }, ['brightness', 'bright_ti5']), { code: 'PRODUCT_VERIFICATION_REQUIRED' });
  // Match the inspected export's raw encoding, still using invented test coordinates.
  const deliveredSchema = header + '\n' + row('2').replace('T,MODIS,88', 'SNPP,SNPP,n');
  assert.throws(() => ingestFirmsCSV(deliveredSchema, { dataset: { ...dataset, sensor: 'VIIRS', product: 'VNP14IMGTML', version: '2', archiveProfile: 'viirs-snpp' }, boundary }), { code: 'PRODUCT_VERIFICATION_REQUIRED' });
});
test('unverified MODIS semantics discovered after a flushed batch roll back and never activate', async () => {
  const calls = []; let writes = 0;
  const store = { begin() { calls.push('begin'); return 1; }, write(_id, records) { writes += records.length; return records.length; }, rollback() { calls.push('rollback'); }, finish() { calls.push('finish'); } };
  await assert.rejects(importArchiveStream(Readable.from([header + '\n' + row('6.1') + '\n' + row('61.03')]), { dataset, boundary, store, batchSize: 1, activate: true }), { code: 'PRODUCT_VERIFICATION_REQUIRED' });
  assert.equal(writes, 1); assert.deepEqual(calls, ['begin', 'rollback']);
});
