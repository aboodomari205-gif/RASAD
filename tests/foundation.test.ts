import test from 'node:test';
import assert from 'node:assert/strict';
import { aggregateDays, aggregatePeriods, confidenceMetadata, filterObservations, normalizeCollection, pointInRegion, sensorSummaries, digest } from '../shared/observations.ts';
import { filterObservationCollection } from '../src/data/observations.ts';
import type { CoverageDay, Dataset, ObservationCollection } from '../shared/model.ts';
const dataset: Dataset = { id: 'test-viirs', title: 'Test-only observations', regionId: 'northern-jordan', kind: 'fixture', source: 'Test-only FIRMS', sensor: 'VIIRS', platform: 'N20', product: 'VIIRS_375m', processing: 'nrt', version: '2.0NRT' };
const feature = (properties: Record<string, unknown> = {}, id = 1) => ({ type: 'Feature' as const, id, geometry: { type: 'Point' as const, coordinates: [-62, -9] }, properties: { instrument: 'VIIRS', satellite: 'N20', acquiredAt: '2024-02-29T23:59:00Z', date: '2024-02-29', time: '2359', confidence: 'n', frp: 4, ...properties } });
const collection = (...features: ReturnType<typeof feature>[]): ObservationCollection => ({ type: 'FeatureCollection', metadata: { mode: 'northern-jordan', developmentFixture: true, datasets: [dataset] }, features });
const normalize = (data: ObservationCollection) => normalizeCollection(data, { region: 'northern-jordan' });
test('stable SHA-256 IDs preserve provenance, confidence, nullable FRP and original geometry', () => {
  assert.equal(digest('abc'), 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
  const first = feature(); const reordered = { ...first, id: 999, properties: Object.fromEntries(Object.entries(first.properties).reverse()) };
  const result = normalize(collection(first, reordered));
  assert.equal(result.observations.length, 1); assert.equal(result.diagnostics.duplicatesRemoved, 1);
  const o = result.observations[0]; assert.equal(o.utcDate, '2024-02-29'); assert.equal(o.sensor, 'VIIRS'); assert.equal(o.platform, 'N20'); assert.equal(o.provenance.fixture, true); assert.equal(o.confidence.category, 'nominal'); assert.equal(o.confidence.raw, 'n'); assert.equal(o.id, normalize(collection(reordered)).observations[0].id);
  const changedDataset = { ...collection(first), metadata: { mode: 'northern-jordan', datasets: [{ ...dataset, id: 'different-product' }] } };
  assert.notEqual(o.id, normalize(changedDataset).observations[0].id);
  assert.deepEqual(o.feature.geometry.coordinates, [-62, -9]);
});
test('shared UTC filters handle offset/year boundaries, inclusive dates, timestamps and null FRP', () => {
  const model = normalize(collection(feature({ acquiredAt: '2024-03-01T00:30:00+03:00', frp: null }), feature({ acquiredAt: '2024-12-31T23:30:00-02:00', frp: 0 }, 2)));
  assert.deepEqual(model.observations.map(o => o.utcDate), ['2024-02-29', '2025-01-01']);
  assert.equal(filterObservations(model.observations, { startDate: '2024-02-29', endDate: '2024-02-29' }).length, 1);
  assert.equal(filterObservations(model.observations, { startTime: '2025-01-01T00:00:00Z', endTime: '2025-01-01T02:00:00Z' })[0].frp, 0);
  assert.throws(() => filterObservations(model.observations, { startDate: '2024-02-30' }));
  assert.throws(() => filterObservations(model.observations, { startDate: '2025-01-01', endDate: '2024-01-01' }));
  assert.throws(() => filterObservations(model.observations, { startTime: '2024-01-01T00:00:00' }));
});
test('confidence scales are sensor-specific and never normalized into a common score', () => {
  assert.deepEqual(confidenceMetadata('85', 'MODIS'), { raw: '85', scheme: 'modis-percent', category: null, valid: true });
  assert.equal(confidenceMetadata('85', 'VIIRS').valid, false);
  assert.equal(confidenceMetadata('n', 'MODIS').valid, false);
  assert.equal(confidenceMetadata(null, 'VIIRS').valid, null);
});
test('sensor summaries and periods separate dataset/product/platform and reject implicit daily source mixing', () => {
  const modis = { ...dataset, id: 'test-modis', sensor: 'MODIS' as const, product: 'MODIS', processing: 'standard' as const, version: '6.1' };
  const data: ObservationCollection = { type: 'FeatureCollection', metadata: { mode: 'northern-jordan', datasets: [dataset, modis] }, features: [feature({ datasetId: dataset.id }), feature({ datasetId: modis.id, instrument: 'MODIS', satellite: 'Terra', confidence: '85', version: '6.1', frp: 20 })] };
  const model = normalize(data); assert.equal(sensorSummaries(model.observations).length, 2);
  const series = aggregatePeriods(model.observations, { period: 'month', datasets: model.datasets }); assert.equal(series.length, 2); assert.equal(series.every(s => s.periods[0].count === 1), true);
  const second = { ...model.observations[0], datasetId: 'another-viirs-product', id: 'other' };
  assert.throws(() => aggregateDays([...model.observations, second], { region: 'northern-jordan', sensor: 'VIIRS' }), /explicit single dataset/);
});
test('fixture/region guards and point geometry filtering isolate the pilot, including polygon holes', () => {
  assert.equal(normalizeCollection(collection(feature()), { region: 'ajloun' }).observations.length, 0);
  const model = normalize(collection(feature())); assert.equal(filterObservations(model.observations, { region: 'ajloun' }).length, 0); assert.equal(filterObservations(model.observations, { fixture: 'exclude' }).length, 0);
  assert.equal(filterObservations(model.observations, { bbox: [-63, -10, -61, -8] }).length, 1);
  assert.equal(filterObservations(model.observations, { bbox: [170, -20, -170, 20] }).length, 0);
  const polygon = { type: 'Polygon' as const, coordinates: [[[0, 0], [10, 0], [10, 10], [0, 10], [0, 0]], [[2, 2], [4, 2], [4, 4], [2, 4], [2, 2]]] };
  assert.equal(pointInRegion(1, 1, polygon), true); assert.equal(pointInRegion(3, 3, polygon), false); assert.equal(pointInRegion(11, 1, polygon), false);
});
test('monthly/yearly gaps remain unknown, including leap days and missing FRP', () => {
  const model = normalize(collection(feature({ frp: null })));
  const series = aggregatePeriods(model.observations, { period: 'month', filter: { startDate: '2024-02-01', endDate: '2024-03-31' }, datasets: model.datasets })[0];
  assert.equal(series.periods[0].scopeDays, 29); assert.equal(series.periods[0].status, 'observed'); assert.equal(series.periods[0].frpSum, null); assert.equal(series.periods[0].coverageComplete, false);
  assert.equal(series.periods[1].status, 'unavailable'); assert.equal(series.periods[1].frpSum, null);
  const annual = aggregatePeriods(model.observations, { period: 'year', filter: { startDate: '2024-01-01', endDate: '2025-12-31' }, datasets: model.datasets })[0];
  assert.equal(annual.periods[0].scopeDays, 366); assert.equal(annual.periods[1].status, 'unavailable');
});
test('only complete verified daily evidence establishes full-month zero; a clipped query does not', () => {
  const coverage: CoverageDay[] = Array.from({ length: 29 }, (_, i) => ({ date: `2024-02-${String(i + 1).padStart(2, '0')}`, region: 'northern-jordan', instrument: 'VIIRS', complete: true, verified: true, source: 'Test-only coverage', datasetId: dataset.id }));
  const base = { period: 'month' as const, filter: { region: 'northern-jordan' as const, startDate: '2024-02-01', endDate: '2024-02-29' }, datasets: [dataset] };
  assert.equal(aggregatePeriods([], { ...base, coverage })[0].periods[0].status, 'verified-zero');
  assert.equal(aggregatePeriods([], { ...base, coverage: coverage.slice(1) })[0].periods[0].status, 'unavailable');
  const clipped = aggregatePeriods([], { ...base, coverage, filter: { ...base.filter, endDate: '2024-02-02' } })[0].periods[0];
  assert.equal(clipped.scopedCoverageComplete, true); assert.equal(clipped.fullPeriod, false); assert.equal(clipped.status, 'unavailable');
});
test('availability distinguishes fixture, loaded, partial, unavailable and errors from coverage', () => {
  assert.equal(normalize(collection(feature())).availability.state, 'fixture');
  const regular = { ...collection(feature()), metadata: { mode: 'northern-jordan', datasets: [{ ...dataset, kind: 'archive' as const }] } };
  assert.equal(normalize(regular).availability.state, 'loaded');
  const broken = { ...regular, features: [...regular.features, feature({ acquiredAt: 'bad' })] };
  assert.equal(normalize(broken).availability.state, 'partial');
  assert.equal(normalize(broken).availability.coverage, 'unknown');
  const unavailable = { ...regular, metadata: { ...regular.metadata, availability: { state: 'unavailable' as const, fixture: false, quality: 'complete' as const, coverage: 'unknown' as const, reasons: [] } } };
  assert.equal(normalize(unavailable).availability.state, 'unavailable');
  assert.equal(normalizeCollection(collection(feature()), { region: 'ajloun' }).availability.state, 'error');
});
test('map adapter and canonical/calendar normalization agree on duplicates and UTC date filtering', () => {
  const data = collection(feature({ acquiredAt: '2024-03-01T00:30:00+03:00' }), feature({ acquiredAt: '2024-03-01T00:30:00+03:00' }, 99));
  const map = filterObservationCollection(data, { region: 'northern-jordan', sensor: 'VIIRS', startDate: '2024-02-29', endDate: '2024-02-29' });
  assert.equal(map.features.length, normalize(data).observations.length); assert.equal(map.features.length, 1);
});

test('full-year zero requires all leap-year coverage days and fixture exclusion cannot seed artificial zeros', () => {
  const coverage: CoverageDay[] = Array.from({ length: 366 }, (_, index) => { const date = new Date(Date.UTC(2024, 0, 1 + index)).toISOString().slice(0, 10); return { date, region: 'northern-jordan', instrument: 'VIIRS', complete: true, verified: true, source: 'Test-only annual coverage', datasetId: dataset.id }; });
  const options = { period: 'year' as const, datasets: [dataset], coverage, filter: { region: 'northern-jordan' as const, startDate: '2024-01-01', endDate: '2024-12-31' } };
  assert.equal(aggregatePeriods([], options)[0].periods[0].status, 'verified-zero');
  assert.equal(aggregatePeriods([], { ...options, coverage: coverage.slice(1) })[0].periods[0].status, 'unavailable');
  assert.deepEqual(aggregatePeriods([], { ...options, filter: { ...options.filter, fixture: 'exclude' } }), []);
  assert.throws(() => normalize({ ...collection(), metadata: { mode: 'northern-jordan', datasets: [null] as unknown as Dataset[] } }), /Invalid dataset/);
});

test('partial delivery or timestamp-restricted queries cannot establish a whole-period zero', () => {
  const coverage: CoverageDay[] = Array.from({ length: 29 }, (_, i) => ({ date: `2024-02-${String(i + 1).padStart(2, '0')}`, region: 'northern-jordan', instrument: 'VIIRS', complete: true, verified: true, source: 'Test-only coverage', datasetId: dataset.id }));
  const base = { period: 'month' as const, datasets: [dataset], coverage, filter: { region: 'northern-jordan' as const, startDate: '2024-02-01', endDate: '2024-02-29' } };
  const partial = { state: 'partial' as const, fixture: false, quality: 'partial' as const, coverage: 'unknown' as const, reasons: ['Test rejected records'] };
  assert.equal(aggregatePeriods([], { ...base, availability: partial })[0].periods[0].status, 'unavailable');
  assert.equal(aggregatePeriods([], { ...base, filter: { ...base.filter, startTime: '2024-02-01T12:00:00Z' } })[0].periods[0].status, 'unavailable');
  assert.equal(aggregateDays([], { region: 'northern-jordan', sensor: 'VIIRS', coverage, availability: partial }).size, 0);
});
