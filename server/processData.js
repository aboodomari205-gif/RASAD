import { ingestFirmsCSV } from './firmsArchive.js';
export const TEST_DATASET = Object.freeze({ id: 'test-only-viirs', title: 'Synthetic test-only schema', regionId: 'northern-jordan', kind: 'fixture', source: 'SYNTHETIC TEST ONLY', filename: 'synthetic-test.csv', processing: 'unknown' });
export function parseNASAData(csv, filename = 'synthetic-test.csv') {
  const result = ingestFirmsCSV(csv, { dataset: { ...TEST_DATASET, filename }, deduplicate: false });
  return { filename, totalRecords: result.diagnostics.inputRecords, validRecords: result.rawCollection.features.length, rejectedRecords: result.diagnostics.rejectedRecords, observations: result.rawCollection.features.map(feature => feature.properties), foundation: result };
}
export function loadNASAData() { throw new Error('Development fixture file loading has been retired.'); }
export function observationCollection(data) {
  return { type: 'FeatureCollection', metadata: { mode: 'northern-jordan', developmentFixture: true, region: 'Test-only region', filename: data.filename, totalRecords: data.totalRecords, validRecords: data.validRecords, rejectedRecords: data.rejectedRecords,
    ...(data.foundation ? { schemaVersion: 'firepulse.observations/v1', datasets: [data.foundation.dataset], availability: data.foundation.availability, diagnostics: data.foundation.diagnostics, coverage: [] } : {}) },
    features: data.observations.map((observation, id) => ({ type: 'Feature', id, geometry: { type: 'Point', coordinates: [observation.longitude, observation.latitude] }, properties: observation })) };
}
