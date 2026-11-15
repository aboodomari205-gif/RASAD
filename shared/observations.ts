import {COMPATIBILITY_REGIONS} from './regionCompatibility.ts';
import { ACTIVE_REGIONS } from './regions.ts';
import { sha256 } from '@noble/hashes/sha2.js';
import { bytesToHex, utf8ToBytes } from '@noble/hashes/utils.js';
import type { Feature, Point } from 'geojson';
import type { Availability, CoverageDay, Dataset, DayBucket, Diagnostics, NormalizedCollection, Observation, ObservationCollection, ObservationFilter, Period, RegionGeometry, RegionId, Sensor, VerifiedDayCoverage } from './model.ts';
export type * from './model.ts';
export { SCHEMA_VERSION } from './model.ts';
export function digest(value: string): string { return bytesToHex(sha256(utf8ToBytes(value))); }
export function canonical(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).filter(([key]) => !['_revealOrder', 'datasetId', 'observationId'].includes(key)).sort(([a], [b]) => a.localeCompare(b)).map(([key, item]) => [key, canonical(item)]));
  return value;
}
export function validUTCDate(date: unknown): date is string {
  if (typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return false;
  const parsed = Date.parse(date + 'T00:00:00Z');
  return Number.isFinite(parsed) && new Date(parsed).toISOString().slice(0, 10) === date;
}
export function acquisitionUTC(feature: Feature<Point>): { date: string; acquiredAt: string | null } | null {
  const p = feature.properties ?? {};
  if (p.acquiredAt != null && p.acquiredAt !== '') {
    if (typeof p.acquiredAt !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?(Z|[+-]\d{2}:\d{2})$/i.test(p.acquiredAt) || !validUTCDate(p.acquiredAt.slice(0, 10)) || Number(p.acquiredAt.slice(11, 13)) > 23 || Number(p.acquiredAt.slice(14, 16)) > 59) return null;
    const parsed = Date.parse(p.acquiredAt);
    if (!Number.isFinite(parsed)) return null;
    const acquiredAt = new Date(parsed).toISOString();
    return { date: acquiredAt.slice(0, 10), acquiredAt };
  }
  if (!validUTCDate(p.date)) return null;
  if (p.time == null || p.time === '') return { date: p.date, acquiredAt: null };
  const raw = String(p.time);
  if (!/^\d{1,4}$/.test(raw)) return null;
  const time = raw.padStart(4, '0');
  if (Number(time.slice(0, 2)) > 23 || Number(time.slice(2)) > 59) return null;
  return { date: p.date, acquiredAt: `${p.date}T${time.slice(0, 2)}:${time.slice(2)}:00.000Z` };
}
export function sensorOf(raw: unknown): Sensor { const value = String(raw ?? '').toUpperCase(); return value === 'VIIRS' || value === 'MODIS' ? value : 'UNKNOWN'; }
export function confidenceMetadata(raw: unknown, sensor: Sensor): Observation['confidence'] {
  const original = typeof raw === 'string' || typeof raw === 'number' ? raw : null;
  if (sensor === 'VIIRS') {
    const names = { l: 'low', low: 'low', n: 'nominal', nominal: 'nominal', h: 'high', high: 'high' } as const;
    const category = names[String(raw ?? '').toLowerCase() as keyof typeof names] ?? null;
    return { raw: original, scheme: 'viirs-categorical', category, valid: original == null || original === '' ? null : category !== null };
  }
  if (sensor === 'MODIS') { const number = typeof original === 'number' ? original : typeof original === 'string' && /^\d+(?:\.\d+)?$/.test(original) ? Number(original) : NaN; return { raw: original, scheme: 'modis-percent', category: null, valid: original == null || original === '' ? null : Number.isFinite(number) && number >= 0 && number <= 100 }; }
  return { raw: original, scheme: 'unknown', category: null, valid: null };
}
export function validDataset(value: unknown): value is Dataset {
  if (!value || typeof value !== 'object') return false;
  const d = value as Dataset;
  return typeof d.id === 'string' && d.id.length > 0 && d.id.length <= 128 && typeof d.title === 'string' && Boolean(d.title.trim()) && typeof d.source === 'string' && Boolean(d.source.trim()) && [...COMPATIBILITY_REGIONS, ...ACTIVE_REGIONS.map(r=>r.id)].includes(d.regionId) && ['fixture', 'archive', 'nrt', 'unknown'].includes(d.kind) && (d.sensor === undefined || ['VIIRS', 'MODIS'].includes(d.sensor)) && (d.processing === undefined || ['nrt', 'standard', 'unknown'].includes(d.processing)) && (d.platform == null || typeof d.platform === 'string') && (d.version == null || typeof d.version === 'string') && (d.product == null || typeof d.product === 'string');
}
export function datasetForCollection(collection: ObservationCollection, region: RegionId): Dataset[] {
  if (Array.isArray(collection.metadata?.datasets)) { if (!collection.metadata.datasets.every(validDataset) || new Set(collection.metadata.datasets.map(d => d.id)).size !== collection.metadata.datasets.length) throw new TypeError('Invalid dataset provenance descriptors'); return collection.metadata.datasets; }
  return [{ id: `legacy:${collection.metadata?.mode ?? region}:${collection.metadata?.filename ?? 'collection'}`, title: collection.metadata?.region ?? region,
    regionId: (collection.metadata?.mode ?? region) as RegionId, kind: collection.metadata?.developmentFixture === true || false ? 'fixture' : 'unknown', source: 'NASA FIRMS', filename: collection.metadata?.filename, processing: 'unknown' }];
}
export function availabilityFor(datasets: readonly Dataset[], diagnostics: Diagnostics, supplied?: Availability): Availability {
  const fixture = datasets.some(dataset => dataset.kind === 'fixture');
  const partial = diagnostics.rejectedRecords > 0 || diagnostics.issues.length > 0 || datasets.some(dataset => dataset.partial) || supplied?.state === 'partial' || supplied?.quality === 'partial';
  const state = supplied?.state === 'error' ? 'error' : supplied?.state === 'unavailable' ? 'unavailable' : fixture ? 'fixture' : partial ? 'partial' : 'loaded';
  return { state, fixture, quality: partial ? 'partial' : 'complete', coverage: 'unknown', reasons: [...new Set([...(supplied?.reasons ?? []), ...(partial ? ['Input validation warnings, rejected records or an explicitly partial source limit this collection.'] : []), 'Loaded records do not establish satellite coverage.'])] };
}
export function normalizeCollection(collection: ObservationCollection, options: { region: RegionId; sensor?: string; deduplicate?: boolean }): NormalizedCollection {
  const datasets = datasetForCollection(collection, options.region);
  const diagnostics: Diagnostics = { inputRecords: collection.features.length, acceptedRecords: 0, uniqueRecords: 0, duplicatesRemoved: 0, rejectedRecords: 0, sensorExcluded: 0, issues: [] };
  const mismatch = Boolean((collection.metadata?.mode && collection.metadata.mode !== options.region) || (options.region === COMPATIBILITY_REGIONS[0] && collection.metadata?.developmentFixture === true) || datasets.some(dataset => dataset.regionId !== options.region || (options.region === COMPATIBILITY_REGIONS[0] && dataset.kind === 'fixture')));
  const observations: Observation[] = [];
  const seen = new Set<string>();
  if (mismatch) diagnostics.issues.push({ code: 'REGION_MISMATCH', severity: 'error', message: 'Dataset region or fixture provenance does not match the requested scope.' });
  for (const [index, feature] of (mismatch ? [] : collection.features).entries()) {
    const p = feature?.properties ?? {};
    const sensor = sensorOf(p.instrument);
    if (options.sensor && options.sensor !== 'all' && sensor !== options.sensor.toUpperCase()) { diagnostics.sensorExcluded++; continue; }
    const dataset = p.datasetId ? datasets.find(item => item.id === p.datasetId) : datasets.length === 1 ? datasets[0] : undefined;
    const acquisition = feature?.type === 'Feature' ? acquisitionUTC(feature) : null;
    const coords = feature?.geometry?.type === 'Point' ? feature.geometry.coordinates : [];
    if (!dataset || !acquisition || coords.length < 2 || !Number.isFinite(coords[0]) || !Number.isFinite(coords[1]) || Math.abs(coords[0]) > 180 || Math.abs(coords[1]) > 90 || (dataset.sensor && sensor !== dataset.sensor)) {
      diagnostics.rejectedRecords++; diagnostics.issues.push({ code: !dataset ? 'DATASET_PROVENANCE_MISSING' : 'INVALID_OBSERVATION', row: index + 1, severity: 'error', message: 'Record requires valid region-scoped provenance, coordinates, sensor and UTC acquisition.' }); continue;
    }
    diagnostics.acceptedRecords++;
    const identity = JSON.stringify(canonical({ namespace: { source: dataset.source, product: dataset.product ?? null, processing: dataset.processing ?? 'unknown', version: dataset.version ?? null, sensor: dataset.sensor ?? null, platform: dataset.platform ?? null }, geometry: feature.geometry, properties: p }));
    const id = `fp1:${dataset.id}:${digest(identity)}`;
    const duplicate = seen.has(id);
    if (duplicate) { diagnostics.duplicatesRemoved++; if (options.deduplicate !== false) continue; }
    seen.add(id);
    const frp = typeof p.frp === 'number' && Number.isFinite(p.frp) && p.frp >= 0 ? p.frp : null;
    const confidence = confidenceMetadata(p.confidence, sensor);
    if (confidence.valid === false) diagnostics.issues.push({ code: 'CONFIDENCE_SEMANTICS', row: index + 1, field: 'confidence', severity: 'warning', message: 'Raw confidence retained; value is outside the documented default sensor scale.' });
    if (p.frp != null && p.frp !== '' && frp === null) diagnostics.issues.push({ code: 'INVALID_FRP', row: index + 1, field: 'frp', severity: 'warning', message: 'Invalid FRP retained in raw metadata and excluded from numeric summaries.' });
    const version = p.version == null || p.version === '' ? dataset.version ?? null : String(p.version);
    observations.push({ id, datasetId: dataset.id, regionId: dataset.regionId, utcDate: acquisition.date, acquiredAt: acquisition.acquiredAt, timestampPrecision: acquisition.acquiredAt ? 'instant' : 'day', longitude: coords[0], latitude: coords[1], sensor, sensorRaw: Object.hasOwn(p, 'rawInstrument') ? p.rawInstrument : p.instrument == null ? null : String(p.instrument), platformRaw: Object.hasOwn(p, 'rawSatellite') ? p.rawSatellite : p.satellite == null ? null : String(p.satellite), platform: p.satellite == null || p.satellite === '' ? dataset.platform ?? null : String(p.satellite), frp, confidence, source: typeof p.source === 'string' && p.source ? p.source : dataset.source,
      provenance: { fixture: dataset.kind === 'fixture', product: dataset.product ?? null, processing: dataset.processing && dataset.processing !== 'unknown' ? dataset.processing : version?.toUpperCase().includes('NRT') ? 'nrt' : 'unknown', version }, feature });
  }
  diagnostics.uniqueRecords = seen.size;
  const legacyUnavailable: Availability | undefined = typeof collection.metadata?.message === 'string' && collection.metadata.message.endsWith(' observations are not connected.') && !collection.features.length ? { state: 'unavailable', fixture: false, quality: 'complete', coverage: 'unknown', reasons: ['Legacy API explicitly reports an unconnected pilot source.'] } : undefined;
  return { observations, datasets, diagnostics, regionMismatch: mismatch, availability: availabilityFor(datasets, diagnostics, mismatch ? { state: 'error', fixture: false, quality: 'partial', coverage: 'unknown', reasons: ['Region isolation rejected the collection.'] } : collection.metadata?.availability ?? legacyUnavailable) };
}
export function validateFilter(filter: ObservationFilter): void {
  if (filter.region && ![...COMPATIBILITY_REGIONS, ...ACTIVE_REGIONS.map(r=>r.id)].includes(filter.region)) throw new RangeError('Unsupported observation region');
  if(filter.processing&&!['standard','nrt','unknown'].includes(filter.processing))throw new RangeError('Unsupported processing stratum');
  if (filter.sensor && !['ALL', 'VIIRS', 'MODIS', 'UNKNOWN'].includes(filter.sensor.toUpperCase())) throw new RangeError('Unsupported observation sensor');
  for (const value of [filter.frpMin, filter.frpMax]) if (value !== undefined && (!Number.isFinite(value) || value < 0)) throw new RangeError('FRP bounds must be finite nonnegative MW');
  if (filter.frpMin !== undefined && filter.frpMax !== undefined && filter.frpMin > filter.frpMax) throw new RangeError('FRP minimum exceeds maximum');
  if (filter.fixture && !['include', 'exclude', 'only'].includes(filter.fixture)) throw new RangeError('Unsupported fixture policy');
  if (filter.datasetIds && (!Array.isArray(filter.datasetIds) || filter.datasetIds.some(id => typeof id !== 'string' || !id))) throw new RangeError('Dataset IDs must be nonempty strings');
  for (const value of [filter.startDate, filter.endDate]) if (value !== undefined && !validUTCDate(value)) throw new RangeError('Dates must be valid YYYY-MM-DD UTC dates');
  if (filter.startDate && filter.endDate && filter.startDate > filter.endDate) throw new RangeError('Start date must not follow end date');
  for (const value of [filter.startTime, filter.endTime]) if (value !== undefined && !acquisitionUTC({ type: 'Feature', geometry: { type: 'Point', coordinates: [0, 0] }, properties: { acquiredAt: value } })) throw new RangeError('Timestamp filters require an explicit valid timezone');
  if (filter.startTime && filter.endTime && Date.parse(filter.startTime) > Date.parse(filter.endTime)) throw new RangeError('Start timestamp must not follow end timestamp');
  if (filter.bbox) { const [w, s, e, n] = filter.bbox; if (filter.bbox.length !== 4 || ![w, s, e, n].every(Number.isFinite) || Math.abs(w) > 180 || Math.abs(e) > 180 || Math.abs(s) > 90 || Math.abs(n) > 90 || s > n) throw new RangeError('Invalid WGS84 bounding box'); }
}
export function filterObservations(observations: readonly Observation[], filter: ObservationFilter = {}): Observation[] {
  validateFilter(filter);
  if (filter.sensor?.toUpperCase() === 'ALL') filter = { ...filter, sensor: 'all' };
  return observations.filter(o => (!filter.dayNight||o.feature.properties?.daynight===filter.dayNight)&& (!filter.processing||o.provenance.processing===filter.processing)&& (filter.frpMin === undefined || (o.frp !== null && o.frp >= filter.frpMin)) && (filter.frpMax === undefined || (o.frp !== null && o.frp <= filter.frpMax)) && (!filter.region || o.regionId === filter.region) && !(filter.region === COMPATIBILITY_REGIONS[0] && o.provenance.fixture) && (!filter.sensor || filter.sensor === 'all' || o.sensor === filter.sensor.toUpperCase()) && (!filter.platform || o.platform === filter.platform) && (!filter.datasetIds || filter.datasetIds.includes(o.datasetId)) && (!filter.startDate || o.utcDate >= filter.startDate) && (!filter.endDate || o.utcDate <= filter.endDate) && (!filter.startTime || Boolean(o.acquiredAt && Date.parse(o.acquiredAt) >= Date.parse(filter.startTime))) && (!filter.endTime || Boolean(o.acquiredAt && Date.parse(o.acquiredAt) <= Date.parse(filter.endTime))) && (!filter.confidenceRaw || filter.confidenceRaw === 'all' || String(o.confidence.raw ?? '') === filter.confidenceRaw) && (filter.fixture !== 'exclude' || !o.provenance.fixture) && (filter.fixture !== 'only' || o.provenance.fixture) && (!filter.bbox || (o.latitude >= filter.bbox[1] && o.latitude <= filter.bbox[3] && (filter.bbox[0] <= filter.bbox[2] ? o.longitude >= filter.bbox[0] && o.longitude <= filter.bbox[2] : o.longitude >= filter.bbox[0] || o.longitude <= filter.bbox[2]))));
}
export function pointInRegion(longitude: number, latitude: number, geometry: RegionGeometry): boolean {
  const inRing = (ring: number[][]) => {
    let inside = false;
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
      const [xi, yi] = ring[i]; const [xj, yj] = ring[j];
      const cross = (longitude - xi) * (yj - yi) - (latitude - yi) * (xj - xi);
      if (Math.abs(cross) < 1e-10 && longitude >= Math.min(xi, xj) && longitude <= Math.max(xi, xj) && latitude >= Math.min(yi, yj) && latitude <= Math.max(yi, yj)) return true;
      if ((yi > latitude) !== (yj > latitude) && longitude < (xj - xi) * (latitude - yi) / (yj - yi) + xi) inside = !inside;
    }
    return inside;
  };
  return (geometry.type === 'Polygon' ? [geometry.coordinates] : geometry.coordinates).some(rings => rings.length && inRing(rings[0]) && !rings.slice(1).some(inRing));
}
export function summarizeObservations(observations: readonly Observation[]) {
  const reported = observations.filter(o => o.frp !== null);
  return { count: observations.length, frpSum: reported.length ? reported.reduce((sum, o) => sum + o.frp!, 0) : null, frpReported: reported.length, frpComplete: observations.length > 0 && reported.length === observations.length };
}
export function aggregateDays(observations: readonly Observation[], options: { region: RegionId; sensor: string; coverage?: readonly VerifiedDayCoverage[]; datasetIds?: readonly string[]; availability?: Availability }): Map<string, DayBucket> {
  const records = filterObservations(observations, { region: options.region, sensor: options.sensor, datasetIds: options.datasetIds });
  const ids = new Set(records.map(o => o.datasetId));
  if (ids.size > 1) throw new RangeError('Daily aggregation requires an explicit single dataset; incompatible sources cannot be silently combined');
  const days = new Map<string, DayBucket>();
  const ensure = (date: string): DayBucket => { let day = days.get(date); if (!day) { day = { date, status: 'unavailable', observations: [], count: 0, frpSum: null, frpReported: 0, frpComplete: false, coverageSources: [] }; days.set(date, day); } return day; };
  for (const observation of records) { const day = ensure(observation.utcDate); day.observations.push(observation); day.status = 'observed'; }
  for (const proof of options.coverage ?? []) if (options.availability?.quality !== 'partial' && !['error', 'unavailable'].includes(options.availability?.state ?? '') && proof.region === options.region && proof.instrument === options.sensor && proof.verified === true && proof.complete === true && typeof proof.source === 'string' && proof.source.trim() && validUTCDate(proof.date) && (!proof.datasetId || ids.has(proof.datasetId) || options.datasetIds?.includes(proof.datasetId))) {
    const day = ensure(proof.date); if (!day.coverageSources.includes(proof.source)) day.coverageSources.push(proof.source); if (!day.observations.length) day.status = 'verified-zero';
  }
  for (const day of days.values()) { Object.assign(day, summarizeObservations(day.observations)); day.observations.sort((a, b) => (a.acquiredAt ?? a.utcDate).localeCompare(b.acquiredAt ?? b.utcDate)); }
  return days;
}
export function emptyDay(date: string): DayBucket { return { date, status: 'unavailable', observations: [], count: 0, frpSum: null, frpReported: 0, frpComplete: false, coverageSources: [] }; }
function groupKey(o: Observation) { return JSON.stringify([o.datasetId, o.sensor, o.platform, o.provenance.product, o.provenance.processing, o.provenance.version, o.confidence.scheme, o.source]); }
export function sensorSummaries(observations: readonly Observation[]) {
  const groups = new Map<string, Observation[]>();
  for (const o of observations) { const key = groupKey(o); const group = groups.get(key) ?? []; group.push(o); groups.set(key, group); }
  return [...groups.values()].map(records => ({ datasetId: records[0].datasetId, sensor: records[0].sensor, platform: records[0].platform, ...records[0].provenance, confidenceScheme: records[0].confidence.scheme, source: records[0].source, ...summarizeObservations(records) }));
}
export function aggregatePeriods(observations: readonly Observation[], options: { period: Period; filter?: ObservationFilter; coverage?: readonly CoverageDay[]; datasets?: readonly Dataset[]; availability?: Availability }) {
  const records = filterObservations(observations, options.filter);
  const groups = new Map<string, Observation[]>();
  for (const o of records) { const key = groupKey(o); const group = groups.get(key) ?? []; group.push(o); groups.set(key, group); }
  // Explicit dataset/sensor context allows fully covered zero-only series without inventing a platform.
  for (const dataset of options.datasets ?? []) if (dataset.sensor && dataset.availability?.state !== 'error' && dataset.availability?.state !== 'unavailable' && !(dataset.regionId === COMPATIBILITY_REGIONS[0] && dataset.kind === 'fixture') && !(options.filter?.fixture === 'exclude' && dataset.kind === 'fixture') && !(options.filter?.fixture === 'only' && dataset.kind !== 'fixture') && ![...groups.values()].some(group => group[0]?.datasetId === dataset.id) && (!options.filter?.datasetIds || options.filter.datasetIds.includes(dataset.id)) && (!options.filter?.region || options.filter.region === dataset.regionId) && (!options.filter?.sensor || options.filter.sensor.toUpperCase() === 'ALL' || options.filter.sensor.toUpperCase() === dataset.sensor)) groups.set('empty:' + dataset.id, []);
  return [...groups.entries()].map(([key, group]) => {
    const exemplar = group[0]; const dataset = exemplar ? options.datasets?.find(d => d.id === exemplar.datasetId) : options.datasets?.find(d => key === 'empty:' + d.id);
    const datasetId = exemplar?.datasetId ?? dataset!.id; const sensor = exemplar?.sensor ?? dataset!.sensor!; const region = exemplar?.regionId ?? dataset!.regionId; const platform = exemplar?.platform ?? options.filter?.platform ?? dataset?.platform ?? null;
    const dates = [...group.map(o => o.utcDate), ...(options.coverage ?? []).filter(c => c.datasetId === datasetId && c.instrument === sensor).map(c => c.date)].sort();
    let start = options.filter?.startDate ?? dates[0]; let end = options.filter?.endDate ?? dates.at(-1);
    if (start && !options.filter?.startDate && options.period !== 'day') start = options.period === 'year' ? start.slice(0, 4) + '-01-01' : start.slice(0, 7) + '-01';
    if (end && !options.filter?.endDate && options.period !== 'day') { const d = new Date(end + 'T00:00:00Z'); end = options.period === 'year' ? end.slice(0, 4) + '-12-31' : new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)).toISOString().slice(0, 10); }
    const periods = new Map<string, { dates: string[]; observations: Observation[] }>();
    if (start && end) { let cursor = new Date(start + 'T00:00:00Z'); const limit = Date.parse(end + 'T00:00:00Z'); if ((limit - cursor.getTime()) / 86400000 > 40000) throw new RangeError('Aggregation range exceeds 40000 days'); while (cursor.getTime() <= limit) { const date = cursor.toISOString().slice(0, 10); const label = date.slice(0, options.period === 'day' ? 10 : options.period === 'month' ? 7 : 4); const bucket = periods.get(label) ?? { dates: [], observations: [] }; bucket.dates.push(date); periods.set(label, bucket); cursor.setUTCDate(cursor.getUTCDate() + 1); } }
    for (const o of group) { const label = o.utcDate.slice(0, options.period === 'day' ? 10 : options.period === 'month' ? 7 : 4); periods.get(label)?.observations.push(o); }
    return { datasetId, sensor, platform, product: exemplar?.provenance.product ?? dataset?.product ?? null, processing: exemplar?.provenance.processing ?? dataset?.processing ?? 'unknown', version: exemplar?.provenance.version ?? dataset?.version ?? null, source: exemplar?.source ?? dataset?.source ?? null,
      periods: [...periods].map(([period, bucket]) => { const proofs = (options.coverage ?? []).filter(c => c.datasetId === datasetId && c.region === region && c.instrument === sensor && c.verified === true && c.complete === true && typeof c.source === 'string' && c.source.trim() && (!c.platform || c.platform === platform)); const covered = bucket.dates.filter(date => proofs.some(proof => proof.date === date)).length; const scopedComplete = covered === bucket.dates.length && bucket.dates.length > 0; const first = new Date(bucket.dates[0] + 'T00:00:00Z'); const periodDays = options.period === 'day' ? 1 : options.period === 'month' ? new Date(Date.UTC(first.getUTCFullYear(), first.getUTCMonth() + 1, 0)).getUTCDate() : (Date.UTC(first.getUTCFullYear() + 1, 0, 1) - Date.UTC(first.getUTCFullYear(), 0, 1)) / 86400000; const fullPeriod = bucket.dates.length === periodDays && !options.filter?.startTime && !options.filter?.endTime; const complete = scopedComplete && fullPeriod && !dataset?.partial && dataset?.availability?.quality !== 'partial' && options.availability?.quality !== 'partial' && !['error', 'unavailable'].includes(options.availability?.state ?? ''); return { period, ...summarizeObservations(bucket.observations), status: bucket.observations.length ? 'observed' : complete ? 'verified-zero' : 'unavailable', scopeDays: bucket.dates.length, fullPeriod, periodDays, scopedCoverageComplete: scopedComplete, verifiedCoverageDays: covered, unknownCoverageDays: bucket.dates.length - covered, coverageComplete: complete, startDate: bucket.dates[0], endDate: bucket.dates.at(-1) }; }) };
  });
}

export type PeriodAggregationOptions = Omit<Parameters<typeof aggregatePeriods>[1], 'period'>;
export function aggregateDailySeries(observations: readonly Observation[], options: PeriodAggregationOptions = {}) { return aggregatePeriods(observations, { ...options, period: 'day' }); }
export function aggregateMonthlySeries(observations: readonly Observation[], options: PeriodAggregationOptions = {}) { return aggregatePeriods(observations, { ...options, period: 'month' }); }
export function aggregateYearlySeries(observations: readonly Observation[], options: PeriodAggregationOptions = {}) { return aggregatePeriods(observations, { ...options, period: 'year' }); }
