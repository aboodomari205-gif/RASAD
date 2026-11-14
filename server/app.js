import express from 'express';
import cors from 'cors';
import { registerObservations } from './observations.js';
async function boundedText(response, maxBytes = 8 * 1024 * 1024) {
  if (!response.body) return '';
  const reader = response.body.getReader(); const chunks = []; let bytes = 0;
  try { for (;;) { const { value, done } = await reader.read(); if (done) break; bytes += value.byteLength; if (bytes > maxBytes) throw new Error('Response too large'); chunks.push(value); } }
  catch (error) { await reader.cancel().catch(() => {}); throw error; }
  finally { reader.releaseLock(); }
  return Buffer.concat(chunks).toString('utf8');
}
/** No listener, dotenv or credentials at import time; works locally and as a Function. */
export function createApp({ fetchImpl = fetch, key = () => process.env.FIRMS_MAP_KEY, remoteOrigin = () => process.env.FIREPULSE_DATA_API_ORIGIN, timeoutMs = 8000, load } = {}) {
  const app = express(); app.disable('x-powered-by');
  app.use(cors({ origin: /^http:\/\/(localhost|127\.0\.0\.1):\d+$/ }));
  app.use('/api', (_req, res, next) => { res.set('Cache-Control', 'no-store'); res.set('X-Content-Type-Options', 'nosniff'); next(); });
  app.get('/api/health', (_req, res) => res.json({ status: 'ok', project: 'FIREPULSE', message: 'Backend is running', schemaVersion: 'firepulse.observations/v1', archiveStorage: remoteOrigin() ? 'external-service-configured-not-verified' : 'local-or-unavailable' }));
  app.use(async (req, res, next) => {
    if (!/^\/api\/(observations|(?:intelligence|history)\/(datasets|observations|aggregates|coverage|comparison))$/.test(req.path) || !remoteOrigin()) return next();
    if (req.method !== 'GET') return res.status(405).json({ error: 'Read-only data API' });
    try {
      const origin = new URL(remoteOrigin());
      if (origin.protocol !== 'https:' || origin.username || origin.password || origin.pathname !== '/' || origin.search || origin.hash) throw new Error('Invalid service origin');
      const response = await fetchImpl(new URL(req.originalUrl, origin), { signal: AbortSignal.timeout(timeoutMs), redirect: 'error', headers: { Accept: 'application/json' } });
      const parsed = JSON.parse(await boundedText(response)); return res.status(response.status).json(parsed);
    } catch { return res.status(503).json({ error: 'Persistent observation service is unavailable. Retry or narrow the requested scope.' }); }
  });
  registerObservations(app, load ? { load } : undefined);
  app.get('/api/hotspots', async (_req, res) => {
    const credential = key();
    if (!credential) return res.status(503).json({ error: 'FIRMS_MAP_KEY is not configured' });
    try {
      const url = `https://firms.modaps.eosdis.nasa.gov/api/area/csv/${encodeURIComponent(credential)}/VIIRS_NOAA20_NRT/35.59,32.17,35.90,32.42/5`;
      const response = await fetchImpl(url, { signal: AbortSignal.timeout(timeoutMs), redirect: 'error' });
      if (!response.ok) return res.status(502).json({ error: 'NASA FIRMS request failed', status: response.status });
      const csv = await boundedText(response, 2 * 1024 * 1024);
      if (!/^latitude,longitude,/i.test(csv.trimStart())) return res.status(502).json({ error: 'NASA FIRMS returned an unsupported response' });
      return res.type('text/csv').send(csv);
    } catch { return res.status(502).json({ error: 'Unable to retrieve NASA FIRMS data' }); }
  });
  app.use('/api', (_req, res) => res.status(404).json({ error: 'Unknown API route' }));
  app.use((error, _req, res, _next) => { void error; res.status(500).json({ error: 'Request could not be completed safely' }); });
  return app;
}
export default createApp();
