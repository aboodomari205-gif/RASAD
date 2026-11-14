import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeCollection, filterObservations } from '../shared/observations.ts';
import { baselineEligibility, fingerprintEligibility, monthlyActivity, observationsCSV, decisionSummary } from '../shared/analytics.ts';
import type { Availability, Dataset, ObservationCollection } from '../shared/model.ts';
const availability: Availability = { state: 'loaded', fixture: false, quality: 'complete', coverage: 'unknown', reasons: [] };
const dataset: Dataset = { id: 'synthetic-only', title: 'SYNTHETIC TEST ONLY', regionId: 'ajloun', kind: 'archive', source: 'SYNTHETIC TEST ONLY', sensor: 'VIIRS', platform: 'S-NPP', processing: 'standard', product: 'test', version: '2.0' };
function records(dates = ['2020-02-29', '2021-02-28', '2022-02-28']) {
  const collection: ObservationCollection = { type: 'FeatureCollection', metadata: { mode: 'ajloun', datasets: [dataset] }, features: dates.map((date, i) => ({ type: 'Feature', geometry: { type: 'Point', coordinates: [35.75, 32.33] }, properties: { instrument: 'VIIRS', satellite: 'S-NPP', date, time: '2359', confidence: 'n', frp: i === 0 ? null : i === 1 ? 0 : 12 } })) };
  return normalizeCollection(collection, { region: 'ajloun' }).observations;
}
test('canonical FRP bounds retain reported zero, exclude nulls, and reject invalid ranges', () => {
  assert.equal(filterObservations(records(), { frpMin: 0, frpMax: 0 }).length, 1);
  assert.equal(filterObservations(records(), { frpMin: 1 }).length, 1);
  assert.equal(filterObservations(records(), { sensor: 'ALL' }).length, 3);
  assert.throws(() => filterObservations(records(), { frpMin: 5, frpMax: 4 }), RangeError);
  assert.throws(() => filterObservations(records(), { frpMin: NaN }), RangeError);
});
test('monthly activity uses UTC leap dates and missing months remain unavailable', () => {
  const series = monthlyActivity(records(), { region: 'ajloun', startDate: '2020-01-01', endDate: '2020-03-31' }, [dataset], availability);
  assert.equal(series[0].periods[0].status, 'unavailable'); assert.equal(series[0].periods[1].count, 1); assert.equal(series[0].periods[1].frpSum, null);
  assert.equal(series[0].periods[1].unknownCoverageDays, 29);
});
test('anomaly eligibility never supplies numerical output without validated full-window evidence', () => {
  const result = baselineEligibility(records(), { filter: { region: 'ajloun' }, availability });
  assert.equal(result.eligible, false); assert.equal(result.score, null); assert.equal(result.baseline, null);
  assert.ok(result.reasons.some(reason => reason.includes('methodology'))); assert.ok(result.reasons.some(reason => reason.includes('coverage')));
  const fixture = records().map(o => ({ ...o, provenance: { ...o.provenance, fixture: true } }));
  assert.ok(baselineEligibility(fixture, { filter: {}, availability }).reasons.some(reason => reason.includes('fixtures')));
});
test('Fire DNA excludes fixtures/NRT and never merges one-year incompatible series into a historical fingerprint', () => {
  assert.equal(fingerprintEligibility(records()).eligible, true);
  assert.equal(fingerprintEligibility(records(['2020-02-29'])).eligible, false);
  assert.equal(fingerprintEligibility(records().map(o => ({ ...o, provenance: { ...o.provenance, fixture: true } }))).eligible, false);
  assert.equal(fingerprintEligibility(records().map((o, i) => ({ ...o, datasetId: String(i) }))).eligible, false);
  assert.equal(fingerprintEligibility(records().map(o => ({ ...o, provenance: { ...o.provenance, processing: 'nrt' as const } }))).eligible, false);
});
test('CSV preserves nulls/provenance, escapes quotes/newlines and neutralizes spreadsheet formula injection', () => {
  const rows = records(); rows[0] = { ...rows[0], source: '=HYPERLINK("unsafe")\nsecond line' };
  const csv = observationsCSV(rows);
  assert.ok(csv.startsWith('\uFEFF')); assert.ok(csv.includes('"\'=HYPERLINK(""unsafe"")\nsecond line"'));
  assert.ok(csv.includes('"confidenceScheme"')); assert.ok(csv.includes('"viirs-categorical"')); assert.ok(csv.includes('"standard"'));
  assert.ok(csv.includes('"2020-02-29T23:59:00.000Z"'));
  assert.ok(observationsCSV([{ ...rows[1], longitude: -62.5 }]).includes('"-62.5"'));
  assert.ok(!observationsCSV([{ ...rows[1], longitude: -62.5 }]).includes('"\'-62.5"'));
});
test('brief distinguishes generation/acquisition, empty unknown coverage and fixture data', () => {
  const empty = decisionSummary([], { region: 'ajloun' }, availability, '2026-11-11T00:00:00Z');
  assert.ok(empty.includes('does not establish zero')); assert.ok(empty.includes('No validated historical baseline'));
  const fixture = decisionSummary(records(), { region: 'ajloun' }, { ...availability, fixture: true, state: 'fixture' }, '2026-11-11T00:00:00Z');
  assert.ok(fixture.includes('DEVELOPMENT FIXTURE')); assert.ok(fixture.includes('2026-11-11T00:00:00Z'));
});
