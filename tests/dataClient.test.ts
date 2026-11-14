import test from 'node:test';
import assert from 'node:assert/strict';
import { fetchObservationCollection } from '../src/data/observations.ts';
import { fetchIntelligenceData, DataFoundationError } from '../src/data/intelligence.ts';
const feature = { type: 'Feature', id: 1, geometry: { type: 'Point', coordinates: [-62, -9] }, properties: { instrument: 'VIIRS', satellite: 'N20', acquiredAt: '2026-11-07T17:15:00Z', date: '2026-11-07', time: '1715', confidence: 'n', frp: null } };
test('shared frontend loader enforces region/fixture isolation and exact duplicate consistency', async () => {
  const original = globalThis.fetch;
  try {
    globalThis.fetch = async () => new Response(JSON.stringify({ type: 'FeatureCollection', metadata: { mode: 'northern-jordan', developmentFixture: true }, features: [feature, { ...feature, id: 99 }] }));
    const data = await fetchObservationCollection('northern-jordan'); assert.equal(data.features.length, 1); assert.equal(data.metadata?.availability?.state, 'fixture'); assert.equal((data.metadata?.canonicalDiagnostics as { duplicatesRemoved: number } | undefined)?.duplicatesRemoved, 1);
    await assert.rejects(fetchObservationCollection('ajloun'), /scope/);
    globalThis.fetch = async () => new Response(JSON.stringify({ type: 'FeatureCollection', metadata: { mode: 'ajloun', developmentFixture: true }, features: [feature] }));
    await assert.rejects(fetchObservationCollection('ajloun'), /scope/);
  } finally { globalThis.fetch = original; }
});
test('typed Intelligence client validates scopes and exposes error availability without inventing empty success', async () => {
  const original = globalThis.fetch;
  try {
    globalThis.fetch = async () => new Response(JSON.stringify({ error: { message: 'Source unavailable' }, availability: { state: 'error', fixture: false, quality: 'partial', coverage: 'unknown', reasons: [] } }), { status: 503 });
    await assert.rejects(fetchIntelligenceData('observations', { region: 'ajloun' }), error => error instanceof DataFoundationError && error.availability.state === 'error');
    await assert.rejects(fetchIntelligenceData('observations', { startDate: '2026-02-30' }), RangeError);
    globalThis.fetch = async () => new Response(JSON.stringify({ schemaVersion: 'unsupported', resource: 'observations', datasets: [], availability: { state: 'loaded' } }));
    await assert.rejects(fetchIntelligenceData('observations', { region: 'ajloun' }), /Unsupported/);
  } finally { globalThis.fetch = original; }
});

test('legacy client rejects ambiguous same-sensor datasets instead of silently adding them', async () => {
  const original = globalThis.fetch;
  try {
    const d = { title: 'Test-only source', regionId: 'northern-jordan', kind: 'fixture', source: 'Test-only FIRMS', sensor: 'VIIRS' };
    globalThis.fetch = async () => new Response(JSON.stringify({ type: 'FeatureCollection', metadata: { mode: 'northern-jordan', datasets: [{ ...d, id: 'a' }, { ...d, id: 'b' }] }, features: [{ ...feature, properties: { ...feature.properties, datasetId: 'a' } }, { ...feature, properties: { ...feature.properties, datasetId: 'b' } }] }));
    await assert.rejects(fetchObservationCollection('northern-jordan'), /dataset selection/);
  } finally { globalThis.fetch = original; }
});

test('legacy unconnected-pilot metadata remains unavailable during a rolling backend restart', async () => {
  const original = globalThis.fetch;
  try {
    globalThis.fetch = async () => new Response(JSON.stringify({ type: 'FeatureCollection', metadata: { mode: 'ajloun', developmentFixture: false, message: 'Ajloun observations are not connected.' }, features: [] }));
    const data = await fetchObservationCollection('ajloun'); assert.equal(data.metadata?.availability?.state, 'unavailable');
  } finally { globalThis.fetch = original; }
});
