import { SCHEMA_VERSION, validateFilter } from '../../shared/observations.ts';
import type { Availability, ObservationFilter, Period } from '../../shared/model.ts';
import type { IntelligenceResponse, IntelligenceResource } from '../../shared/contracts.ts';
export type { IntelligenceResponse, IntelligenceResource };
export class DataFoundationError extends Error {
  readonly availability: Availability;
  constructor(message: string, availability: Availability) { super(message); this.availability = availability; }
}
/** Typed entry point for Intelligence Lab modules. No baseline or anomaly is invented. */
export async function fetchIntelligenceData<R extends IntelligenceResource>(resource: R, filter: ObservationFilter, options: { period?: Period; signal?: AbortSignal } = {}): Promise<Extract<IntelligenceResponse, { resource: R }>> {
  validateFilter(filter);
  const query = new URLSearchParams({ region: filter.region ?? 'brazil' });
  if (filter.datasetIds && filter.datasetIds.length > 1) throw new RangeError('Request one explicit dataset per client call, or query the scoped catalog');
  const values = { frpMin: filter.frpMin?.toString(), frpMax: filter.frpMax?.toString(), sensor: filter.sensor,processing:filter.processing, platform: filter.platform, datasetId: filter.datasetIds?.[0], from: filter.startDate, to: filter.endDate, fromTime: filter.startTime, toTime: filter.endTime, fixture: filter.fixture, confidence: filter.confidenceRaw, bbox: filter.bbox?.join(','), period: options.period };
  for (const [key, value] of Object.entries(values)) if (value !== undefined) query.set(key, value);
  const failed = (message: string) => new DataFoundationError(message, { state: 'error', fixture: false, quality: 'partial', coverage: 'unknown', reasons: [message] });
  let response: Response;
  try { response = await fetch(`/api/intelligence/${resource}?${query}`, { signal: options.signal }); } catch (error) { if (options.signal?.aborted || (error as Error).name === 'AbortError') throw error; throw failed('Data source could not be reached'); }
  let body;
  try { body = await response.json(); } catch { throw failed('Unsupported data API response; verify or restart the backend'); }
  if (!response.ok) throw new DataFoundationError(body.error?.message ?? 'Observation source unavailable', body.availability ?? { state: 'error', fixture: false, quality: 'partial', coverage: 'unknown', reasons: ['Request failed'] });
  if (body.schemaVersion !== SCHEMA_VERSION || body.resource !== resource || !Array.isArray(body.datasets) || !['loaded', 'partial', 'unavailable', 'error', 'fixture'].includes(body.availability?.state)) throw failed('Unsupported data foundation response');
  if ((resource === 'observations' && (!Array.isArray(body.observations) || !Array.isArray(body.sensorSummaries))) || (resource === 'aggregates' && (!Array.isArray(body.series) || !['day', 'month', 'year'].includes(body.period))) || !Array.isArray(body.coverage)) throw failed('Incomplete data foundation response');
  if ((resource === 'comparison' && (body.comparison?.methodology?.id !== 'firepulse.sensor-alignment/v1' || !Array.isArray(body.comparison?.series))) || (resource === 'coverage' && (body.coverageStatus !== 'unknown' || !Array.isArray(body.datasetCoverage)))) throw failed('Incomplete scientific context response');
  return body;
}
