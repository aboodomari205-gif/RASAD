import test from 'node:test';
import assert from 'node:assert/strict';
import { acquisitionUTC, aggregateDailyObservations, dailyActivity, monthDates } from '../src/calendar/aggregation.ts';
import type { ObservationCollection, VerifiedDayCoverage } from '../src/calendar/aggregation.ts';
const observation = (properties: Record<string, unknown> = {}, id = 1) => ({ type: 'Feature' as const, id, geometry: { type: 'Point' as const, coordinates: [-62, -9] }, properties: { source: 'NASA FIRMS test', satellite: 'N20', instrument: 'VIIRS', date: '2026-11-07', time: '1715', acquiredAt: '2026-11-07T17:15:00Z', confidence: 'n', frp: 12, ...properties } });
const collection = (...features: ReturnType<typeof observation>[]): ObservationCollection => ({ type: 'FeatureCollection', metadata: { mode: 'northern-jordan', developmentFixture: true }, features });
const options = { region: 'northern-jordan' as const, instrument: 'VIIRS' as const };
test('missing days are unavailable; empty collection never establishes coverage', () => {
  const result = aggregateDailyObservations(collection(observation()), options);
  assert.equal(dailyActivity(result.days, '2026-11-07').status, 'observed');
  assert.equal(dailyActivity(result.days, '2026-11-08').status, 'unavailable');
  assert.equal(dailyActivity(aggregateDailyObservations(collection(), options).days, '2026-11-07').status, 'unavailable');
});
test('zero requires explicit, complete, verified, region/sensor-scoped coverage with provenance', () => {
  const covered: VerifiedDayCoverage = { date: '2026-11-07', region: 'northern-jordan', instrument: 'VIIRS', complete: true, verified: true, source: 'Test-only coverage ledger' };
  const result = aggregateDailyObservations(collection(), { ...options, coverage: [covered, { ...covered, date: '2026-11-08', instrument: 'MODIS' }, { ...covered, date: '2026-11-09', source: '' }, { ...covered, date: '2026-11-10', region: 'ajloun' }] });
  assert.equal(dailyActivity(result.days, covered.date).status, 'verified-zero');
  for (const date of ['2026-11-08', '2026-11-09', '2026-11-10']) assert.equal(dailyActivity(result.days, date).status, 'unavailable');
  assert.equal(dailyActivity(result.days, covered.date).frpSum, null);
});
test('acquisition grouping uses UTC across offset, midnight and year boundaries', () => {
  assert.equal(acquisitionUTC(observation({ acquiredAt: '2026-11-08T00:30:00+03:00' }))?.date, '2026-11-07');
  assert.equal(acquisitionUTC(observation({ acquiredAt: '2026-12-31T23:30:00-02:00' }))?.date, '2027-01-01');
  assert.equal(acquisitionUTC(observation({ acquiredAt: '2026-11-08T00:00:00Z' }))?.date, '2026-11-08');
  assert.equal(acquisitionUTC(observation({ acquiredAt: null, time: '5' }))?.acquiredAt, '2026-11-07T00:05:00.000Z');
  assert.equal(acquisitionUTC(observation({ acquiredAt: '2026-11-07T12:00:00' })), null);
  assert.equal(acquisitionUTC(observation({ acquiredAt: '2026-02-30T12:00:00Z' })), null);
  assert.equal(acquisitionUTC(observation({ acquiredAt: '2026-11-07T24:00:00Z' })), null);
  assert.equal(acquisitionUTC(observation({ acquiredAt: null, date: '2026-02-30' })), null);
  assert.equal(acquisitionUTC(observation({ acquiredAt: null, time: '2460' })), null);
});
test('MODIS and VIIRS count/FRP stay separate with original confidence', () => {
  const data = collection(observation(), observation({ instrument: 'MODIS', satellite: 'Terra', confidence: '85', frp: 40 }));
  const viirs = aggregateDailyObservations(data, options).days.get('2026-11-07')!;
  const modis = aggregateDailyObservations(data, { ...options, instrument: 'MODIS' }).days.get('2026-11-07')!;
  assert.equal(viirs.count, 1); assert.equal(viirs.frpSum, 12);
  assert.equal(modis.count, 1); assert.equal(modis.frpSum, 40);
  assert.equal(modis.observations[0].feature.properties?.confidence, '85');
});
test('exact duplicates ignore feature ID/property order but retain distinct sources, satellites and acquisitions', () => {
  const original = observation();
  const duplicate = { ...observation({}, 99), properties: Object.fromEntries(Object.entries(original.properties).reverse()) };
  const result = aggregateDailyObservations(collection(original, duplicate, observation({ satellite: 'N21' }), observation({ time: '1716', acquiredAt: '2026-11-07T17:16:00Z' }), observation({ source: 'Another product' }), observation({ _revealOrder: .5 }, 77), observation({ _granule: 'different-source-record' })), options);
  assert.equal(result.duplicatesRemoved, 2);
  assert.equal(result.days.get('2026-11-07')?.count, 5);
});
test('FRP sums reported values, preserves zero, and exposes missing/invalid contributions', () => {
  const values = [0, 1.5, 2.25, null, '', -3, NaN, Infinity];
  const data = collection(...values.map((frp, index) => observation({ frp, time: String(1700 + index), acquiredAt: `2026-11-07T17:${String(index).padStart(2, '0')}:00Z` })));
  const day = aggregateDailyObservations(data, options).days.get('2026-11-07')!;
  assert.equal(day.count, 8); assert.equal(day.frpReported, 3); assert.equal(day.frpSum, 3.75); assert.equal(day.frpComplete, false);
  const missing = aggregateDailyObservations(collection(observation({ frp: null })), options).days.get('2026-11-07')!;
  assert.equal(missing.frpSum, null); assert.equal(missing.status, 'observed');
  const zero = aggregateDailyObservations(collection(observation({ frp: 0 })), options).days.get('2026-11-07')!;
  assert.equal(zero.frpSum, 0); assert.equal(zero.frpComplete, true); assert.equal(zero.status, 'observed');
});
test('region guards prevent Brazil fixture observations and coverage entering Ajloun', () => {
  const result = aggregateDailyObservations(collection(observation()), { region: 'ajloun', instrument: 'VIIRS', coverage: [{ date: '2026-11-07', region: 'ajloun', instrument: 'VIIRS', complete: true, verified: true, source: 'Test coverage' }] });
  assert.equal(result.regionMismatch, true); assert.equal(result.days.size, 0);
});
test('calendar dates handle leap years and omit fabricated missing records', () => {
  assert.equal(monthDates(2024, 1).length, 29); assert.equal(monthDates(2026, 1).length, 28);
  assert.equal(monthDates(2026, 11).at(-1), '2026-12-31');
  assert.throws(() => monthDates(2026, 12));
});

test('incomplete or unverified coverage never establishes a zero day', () => {
  const coverage = [
    { date: '2026-11-07', region: 'northern-jordan', instrument: 'VIIRS', complete: false, verified: true, source: 'Incomplete test ledger' },
    { date: '2026-11-08', region: 'northern-jordan', instrument: 'VIIRS', complete: true, verified: false, source: 'Unverified test ledger' },
  ] as unknown as VerifiedDayCoverage[];
  const result = aggregateDailyObservations(collection(), { ...options, coverage });
  assert.equal(result.days.size, 0);
});
test('future region-scoped historical collections use the same aggregation schema', () => {
  const data: ObservationCollection = { type: 'FeatureCollection', metadata: { mode: 'ajloun', developmentFixture: false }, features: [{ ...observation({ date: '2024-02-29', acquiredAt: '2024-02-29T23:59:00Z', instrument: 'MODIS', satellite: 'Terra' }), geometry: { type: 'Point', coordinates: [35.75, 32.33] } }] };
  const day = aggregateDailyObservations(data, { region: 'ajloun', instrument: 'MODIS' }).days.get('2024-02-29')!;
  assert.equal(day.status, 'observed'); assert.equal(day.count, 1); assert.equal(day.coverageSources.length, 0);
});
