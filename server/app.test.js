import test from 'node:test';
import assert from 'node:assert/strict';
import { createApp } from './app.js';
async function withAPI(options, work) { const server = createApp({ key: () => undefined, remoteOrigin: () => undefined, ...options }).listen(0, '127.0.0.1'); await new Promise(resolve => server.once('listening', resolve)); try { await work(`http://127.0.0.1:${server.address().port}`); } finally { await new Promise(resolve => server.close(resolve)); } }
test('production app keeps health/fixture/contracts and validates canonical FRP queries', async () => withAPI({}, async base => {
  assert.equal((await fetch(base + '/api/health')).status, 200);
  assert.equal((await fetch(base + '/api/hotspots')).status, 503);
  const response = await fetch(base + '/api/history/observations?region=northern-jordan&frpMin=10'); const body = await response.json();
  assert.equal(response.status, 200); assert.ok(body.observations.every(o => o.frp >= 10)); assert.equal(body.availability.state, 'loaded'); assert.ok(body.observations.length>0); assert.ok(body.observations.every(o=>o.regionId==='northern-jordan'&&!o.provenance.fixture));
  assert.equal((await fetch(base + '/api/history/observations?frpMin=20&frpMax=10')).status, 400);
  assert.equal((await fetch(base + '/api/history/observations?frpMin=')).status, 400);
  assert.equal((await fetch(base + '/api/unknown')).status, 404);
}));
test('NASA failures and rejected bodies never leak request URLs or credential sentinels', async () => {
  for (const fetchImpl of [async () => { throw new Error('SYNTHETIC_CREDENTIAL_URL'); }, async () => new Response('Invalid key SYNTHETIC_CREDENTIAL_URL')]) {
    await withAPI({ key: () => 'SYNTHETIC_CREDENTIAL_URL', fetchImpl }, async base => { const response = await fetch(base + '/api/hotspots'); assert.equal(response.status, 502); assert.equal((await response.text()).includes('SYNTHETIC_CREDENTIAL_URL'), false); });
  }
});
test('NASA timeout aborts upstream and valid CSV preserves the existing endpoint contract', async () => {
  await withAPI({ key: () => 'SYNTHETIC_TEST', timeoutMs: 5, fetchImpl: (_url, options) => new Promise((_resolve, reject) => options.signal.addEventListener('abort', () => reject(new Error('timeout')), { once: true })) }, async base => assert.equal((await fetch(base + '/api/hotspots')).status, 502));
  await withAPI({ key: () => 'SYNTHETIC_TEST', fetchImpl: async () => new Response('latitude,longitude,acq_date\n32,35,2020-01-01') }, async base => { const response = await fetch(base + '/api/hotspots'); assert.equal(response.status, 200); assert.match(response.headers.get('content-type'), /text\/csv/); });
});
test('persistent-service proxy accepts only HTTPS origins, retains scope and sanitizes network errors', async () => {
  let seen;
  await withAPI({ remoteOrigin: () => 'https://example.test', fetchImpl: async url => { seen = String(url); return Response.json({ type: 'FeatureCollection', features: [] }); } }, async base => { assert.equal((await fetch(base + '/api/observations?mode=ajloun')).status, 200); assert.equal(seen, 'https://example.test/api/observations?mode=ajloun'); });
  for (const origin of ['http://example.test', 'https://user:secret@example.test', 'https://example.test/path']) await withAPI({ remoteOrigin: () => origin, fetchImpl: () => { throw new Error('must not fetch'); } }, async base => assert.equal((await fetch(base + '/api/observations')).status, 503));
});
