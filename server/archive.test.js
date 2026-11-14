// All CSV rows in this suite are SYNTHETIC SCHEMA FIXTURES, never scientific observations.
import test from 'node:test';
import assert from 'node:assert/strict';
import { Readable } from 'node:stream';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { DatabaseSync } from 'node:sqlite';
import express from 'express';
import { ingestFirmsCSV } from './firmsArchive.js';
import { importArchiveStream, importArchiveFiles } from './importArchive.js';
import { ArchiveStore } from './archiveStore.js';
import { storedCollection, loadAjlounGeometry } from './dataCatalog.js';
import { registerObservations } from './observations.js';
import { compareSensors } from '../shared/harmonization.ts';
import { normalizeCollection, pointInRegion, aggregatePeriods } from '../shared/observations.ts';
import { aggregateDailyObservations } from '../src/calendar/aggregation.ts';

const boundary = { type: 'Polygon', coordinates: [[[35, 32], [36, 32], [36, 33], [35, 33], [35, 32]]] };
const viirs = { id: 'synthetic-snpp', title: 'SYNTHETIC schema test ONLY', regionId: 'ajloun', kind: 'archive', source: 'SYNTHETIC SCHEMA FIXTURE - NOT NASA OBSERVATIONS', sensor: 'VIIRS', product: 'VNP14IMGML', version: '2.0', processing: 'standard', archiveProfile: 'viirs-snpp' };
const modis = { ...viirs, id: 'synthetic-modis', sensor: 'MODIS', product: 'MCD14ML', version: '6.1', archiveProfile: 'modis-c61' };
const header = 'latitude,longitude,acq_date,acq_time,satellite,instrument,confidence,frp,version,scan,track,daynight,bright_ti4,bright_ti5';
const row = '32.33,35.75,2020-02-29,2359,N,VIIRS,n,3.5,2.0,0.4,0.4,N,330,290';
const modisHeader = header.replace('bright_ti4,bright_ti5', 'brightness,bright_t31');
const modisRow = row.replace('N,VIIRS,n', 'T,MODIS,88').replace(',2.0,', ',6.1,');
const csv = (...rows) => [header, ...rows].join('\n');
const ingest = (text, dataset = viirs) => ingestFirmsCSV(text, { dataset, boundary, inferMetadata: false });
async function withStore(work) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'firepulse-archive-test-'));
  const filename = path.join(directory, 'test.sqlite'); const store = new ArchiveStore(filename);
  try { await work(store, directory, filename); } finally { store.close(); fs.rmSync(directory, { recursive: true, force: true }); }
}
const streamImport = (store, text, options = {}) => importArchiveStream(Readable.from([text]), { dataset: viirs, boundary, store, ...options });

test('archive profiles preserve raw acquisition/provenance and normalize UTC/platform without converting confidence', () => {
  const v = ingest(csv(row)).observations[0]; const m = ingest(modisHeader + '\n' + modisRow, modis).observations[0];
  assert.equal(v.acquiredAt, '2020-02-29T23:59:00.000Z'); assert.equal(v.platform, 'S-NPP'); assert.equal(v.platformRaw, 'N');
  assert.equal(v.feature.properties.archiveRaw.acq_time, '2359'); assert.equal(v.feature.properties.daynight, 'N');
  assert.equal(v.confidence.scheme, 'viirs-categorical'); assert.equal(m.confidence.scheme, 'modis-percent'); assert.equal(m.confidence.raw, '88'); assert.equal(m.platform, 'Terra');
  assert.throws(() => ingest(csv(row), { ...viirs, archiveProfile: 'modis-c61' }), { code: 'ARCHIVE_PROFILE' });
  assert.throws(() => ingest(csv(row).replace(',scan', ',unknown')), { code: 'CSV_SCHEMA' });
});

test('profile validation reports numeric, confidence, platform, UTC, day/night and column errors without raw row output', () => {
  const result = ingest(csv(row.replace('2020-02-29', '2021-02-29'), row.replace(',2359,', ',2400,'), row.replace('N,VIIRS,n', 'N20,VIIRS,n'), row.replace('VIIRS,n', 'VIIRS,90'), row.replace(',0.4,0.4,', ',-1,0.4,'), row.replace(',N,330,', ',X,330,'), row + ',extra'));
  assert.equal(result.diagnostics.rejectedRecords, 7); assert.equal(result.observations.length, 0);
  assert.deepEqual(result.diagnostics.issues.map(i => i.row), [2, 3, 4, 5, 6, 7, 8]);
  assert.ok(result.diagnostics.issues.every(i => !i.message.includes('32.33')));
  const m = ingest(modisHeader + '\n' + modisRow.replace('MODIS,88', 'MODIS,h'), modis); assert.equal(m.diagnostics.rejectedRecords, 1);
});

test('FRP null/zero/malformed are distinct, raw invalid values survive and summaries expose incomplete reporting', () => {
  const result = ingest(csv(row.replace(',3.5,', ',,'), row.replace(',3.5,', ',0,'), row.replace(',3.5,', ',bad,')));
  assert.deepEqual(result.observations.map(o => o.frp), [null, 0, null]);
  assert.equal(result.observations[2].feature.properties.archiveRaw.frp, 'bad');
  const comparison = compareSensors(result.observations, { filter: { region: 'ajloun' }, datasets: [viirs], availability: result.availability });
  assert.equal(comparison.sensors[0].frpSum, 0); assert.equal(comparison.sensors[0].frpReported, 1); assert.equal(comparison.sensors[0].frpComplete, false);
});

test('streaming incrementally deduplicates across batches/files and survives reopen with import provenance', async () => withStore(async (store, directory, filename) => {
  const one = await streamImport(store, csv(row, row), { batchSize: 1, activate: true });
  assert.equal(one.insertedRecords, 1); assert.equal(one.duplicatesRemoved, 1);
  const next = row.replace('2020-02-29,2359', '2020-03-01,0000');
  const two = await streamImport(store, csv(row, next), { batchSize: 2 });
  assert.equal(two.insertedRecords, 1); assert.equal(two.duplicatesRemoved, 1); assert.equal(store.query().length, 2);
  const replay = await streamImport(store, csv(row, next)); assert.equal(replay.insertedRecords, 0);
  assert.equal(store.catalog({ activeOnly: true }).length, 1); assert.equal(store.reports(viirs.id).length, 3);
  const reader = new ArchiveStore(pathToFileURL(filename), { readOnly: true });
  try { assert.equal(reader.query({ startDate: '2020-03-01' })[0].acquiredAt, '2020-03-01T00:00:00.000Z'); } finally { reader.close(); }
  const file = path.join(directory, 'delivery.csv'); fs.writeFileSync(file, csv(next));
  assert.equal((await importArchiveFiles({ files: [file, file], dataset: viirs, store, boundary }))[0].insertedRecords, 0);
  await assert.rejects(importArchiveFiles({ files: [path.join(directory, '.env')], dataset: viirs, store, boundary }), { code: 'DATASET_PATH' });
}));

test('mixed Terra/Aqua batch composition cannot change identities, and changed raw FRP is retained', async () => withStore(async store => {
  const aqua = modisRow.replace('T,MODIS', 'A,MODIS');
  const importModis = (rows, batchSize) => streamImport(store, [modisHeader, ...rows].join('\n'), { dataset: modis, batchSize });
  await importModis([modisRow, aqua], 1);
  const replay = await importModis([aqua, modisRow], 2); assert.equal(replay.insertedRecords, 0); assert.equal(replay.duplicatesRemoved, 2);
  const changed = await importModis([modisRow.replace(',3.5,', ',3.6,')], 1); assert.equal(changed.insertedRecords, 1);
  const normalized = normalizeCollection(storedCollection('ajloun', store.catalog(), store.query()), { region: 'ajloun' });
  assert.deepEqual(new Set(normalized.observations.map(o => o.id)), new Set(store.query().map(o => o.id)));
}));

test('unknown store versions are rejected without rewriting schema version', async () => withStore(async (_store, directory) => {
  const filename = path.join(directory, 'future.sqlite'); const future = new DatabaseSync(filename); future.exec('PRAGMA user_version=99'); future.close();
  assert.throws(() => new ArchiveStore(filename), { code: 'STORE_VERSION' });
  const reader = new DatabaseSync(filename, { readOnly: true }); try { assert.equal(reader.prepare('PRAGMA user_version').get().user_version, 99); } finally { reader.close(); }
}));

test('empty datasets and failed imports do not activate a fixture or infer coverage', async () => withStore(async store => {
  await assert.rejects(streamImport(store, csv(row), { dataset: { ...viirs, kind: 'fixture' } }), { code: 'ARCHIVE_SCOPE' });
  await assert.rejects(streamImport(store, csv(row), { dataset: { ...viirs, version: '2.0NRT' } }), { code: 'ARCHIVE_PROFILE' });
  const report = await streamImport(store, header); assert.equal(report.inputRecords, 0); assert.equal(store.catalog({ activeOnly: true }).length, 0);
  const result = compareSensors([], { filter: { region: 'ajloun', startDate: '2020-02-29', endDate: '2020-03-01' }, datasets: store.catalog(), availability: { state: 'loaded', fixture: false, quality: 'complete', coverage: 'unknown', reasons: [] } });
  assert.ok(result.series[0].periods.every(p => p.status === 'unavailable'));
}));

test('syntax/checksum/source conflict and cancellation roll back the entire file, preserving previous imports', async () => withStore(async store => {
  await streamImport(store, csv(row));
  await assert.rejects(streamImport(store, csv(row.replace(',3.5,', ',4,')) + '\n"unclosed', { batchSize: 1 }), { code: 'CSV_SYNTAX' });
  await assert.rejects(streamImport(store, csv(row), { dataset: { ...viirs, checksum: 'wrong' } }), { code: 'CHECKSUM_MISMATCH' });
  await assert.rejects(streamImport(store, csv(row), { dataset: { ...viirs, product: 'different' } }), { code: 'DATASET_CONFLICT' });
  const controller = new AbortController(); controller.abort(); await assert.rejects(streamImport(store, csv(row), { signal: controller.signal }), { code: 'IMPORT_ABORTED' });
  assert.equal(store.query().length, 1); assert.equal(store.reports(viirs.id).length, 1);
}));

test('large synthetic stream retains bounded batches, exact duplicate accounting and persistent issue reports', async () => withStore(async store => {
  const count = 12000;
  async function* delivery() { yield header + '\n'; for (let i = 0; i < count; i++) yield row.replace(',3.5,', ',' + i + ',') + '\n'; yield row + ',extra\n'; }
  const report = await importArchiveStream(Readable.from(delivery()), { dataset: viirs, boundary, store, batchSize: 127 });
  assert.equal(report.inputRecords, count + 1); assert.equal(report.insertedRecords, count); assert.equal(report.rejectedRecords, 1); assert.equal(report.maxBatchRecords, 127);
  assert.equal(store.issues(report.importId)[0].row, count + 2); assert.equal(store.catalog()[0].partial, true);
  assert.throws(() => store.query({}, { limit: 10 }), { code: 'QUERY_TOO_LARGE' });
  assert.equal(store.query({ startDate: '2020-03-01' }).length, 0);
}));

test('polygon edges, holes and MultiPolygon parts clip geometrically; actual Ajloun boundary is available', () => {
  const hole = [[35.2, 32.2], [35.4, 32.2], [35.4, 32.4], [35.2, 32.4], [35.2, 32.2]];
  const geometry = { type: 'MultiPolygon', coordinates: [[...boundary.coordinates, hole], [[[37, 32], [38, 32], [38, 33], [37, 33], [37, 32]]]] };
  assert.equal(pointInRegion(35, 32.5, geometry), true); assert.equal(pointInRegion(35.3, 32.3, geometry), false); assert.equal(pointInRegion(35.2, 32.3, geometry), false);
  assert.equal(pointInRegion(37.5, 32.5, geometry), true); assert.equal(pointInRegion(36.5, 32.5, geometry), false);
  const result = ingestFirmsCSV(csv(row, row.replace('35.75', '36.5')), { dataset: viirs, boundary: geometry }); assert.equal(result.diagnostics.regionExcluded, 1);
  assert.ok(['Polygon', 'MultiPolygon'].includes(loadAjlounGeometry().type));
});

test('sensor alignment never merges counts, collections, platforms or confidence and marks gaps unknown', () => {
  const v = ingest(csv(row)); const m = ingest(modisHeader + '\n' + modisRow, modis);
  const result = compareSensors([...v.observations, ...m.observations], { filter: { region: 'ajloun', sensor: 'all', startDate: '2020-02-28', endDate: '2020-03-01' }, datasets: [viirs, modis], availability: v.availability });
  assert.equal(result.series.length, 2); assert.equal(result.methodology.crossSensorCountTotal, null); assert.equal(result.methodology.validatedNormalization, false);
  assert.equal(result.alignment.length, 3); assert.equal(result.series[0].periods[0].status, 'unavailable'); assert.equal(result.series[0].periods[1].count, 1);
  assert.equal(result.datasetContext[0].semantics.nominalResolutionM, 375); assert.equal(result.datasetContext[1].semantics.nominalResolutionM, 1000);
  const empty = compareSensors([], { filter: { region: 'ajloun', sensor: 'all', startDate: '2020-02-29', endDate: '2020-03-01' }, datasets: [viirs, modis], availability: v.availability });
  assert.equal(empty.series.length, 2); assert.ok(empty.series.every(s => s.periods.every(p => p.status === 'unavailable')));
});

test('stored observations feed unchanged map/calendar adapters and historical API contracts with UTC filtering', async () => withStore(async store => {
  await streamImport(store, csv(row, row.replace('2020-02-29,2359', '2020-03-01,0000')), { activate: true });
  const load = (region, options = {}) => region === 'ajloun' ? storedCollection(region, store.catalog(), store.query({ ...options.filter, region })) : { type: 'FeatureCollection', features: [], metadata: { mode: region, datasets: [] } };
  const collection = load('ajloun');
  const canonical = normalizeCollection(collection, { region: 'ajloun' });
  assert.equal(canonical.observations[0].id, store.query()[0].id);
  const { days } = aggregateDailyObservations(collection, { region: 'ajloun', instrument: 'VIIRS' }); assert.equal(days.get('2020-02-29').count, 1);
  assert.equal(aggregatePeriods(canonical.observations, { period: 'month' })[0].periods[0].count, 1);
  assert.equal(store.query({ region: 'northern-jordan' }).length, 0);
  const app = express(); registerObservations(app, { load }); const server = app.listen(0, '127.0.0.1'); await new Promise(resolve => server.once('listening', resolve));
  try {
    const base = `http://127.0.0.1:${server.address().port}`;
    const observations = await (await fetch(base + '/api/history/observations?from=2020-03-01&to=2020-03-01')).json(); assert.equal(observations.observations.length, 1);
    const coverage = await (await fetch(base + '/api/history/coverage')).json(); assert.equal(coverage.coverageStatus, 'unknown'); assert.deepEqual(coverage.coverage, []);
    const comparison = await (await fetch(base + '/api/intelligence/comparison?from=2020-02-28&to=2020-03-01')).json(); assert.equal(comparison.comparison.series[0].periods.length, 3);
    const monthly = await (await fetch(base + '/api/history/aggregates?period=month')).json(); assert.equal(monthly.series[0].periods.length, 2);
    const legacy = await (await fetch(base + '/api/observations')).json(); assert.equal(legacy.features.length, 2);
    assert.equal((await fetch(base + '/api/history/comparison?period=decade')).status, 400);
  } finally { await new Promise(resolve => server.close(resolve)); }
}));
