import { aggregatePeriods, filterObservations, sensorSummaries } from './observations.ts';
import type { Availability, CoverageDay, Dataset, Observation, ObservationFilter } from './model.ts';

export function monthlyActivity(observations: readonly Observation[], filter: ObservationFilter, datasets: readonly Dataset[] = [], availability?: Availability) {
  return aggregatePeriods(observations, { period: 'month', filter, datasets, availability });
}
/** Eligibility is separate from scoring. No independently validated scoring method is shipped. */
export function baselineEligibility(observations: readonly Observation[], options: { filter: ObservationFilter; coverage?: readonly CoverageDay[]; availability: Availability; validatedMethod?: { id: string; independentlyValidated: boolean } }) {
  const records = filterObservations(observations, options.filter);
  const groups = sensorSummaries(records);
  const years = [...new Set(records.map(o => o.utcDate.slice(0, 4)))].sort();
  const reasons: string[] = [];
  if (!records.length) reasons.push('No observations in the selected scope.');
  if (records.some(o => o.provenance.fixture)) reasons.push('Development fixtures cannot establish a historical baseline.');
  if (years.length < 3) reasons.push('Fewer than three observed years; the exploratory history prerequisite is unmet. Three years alone would not validate a baseline.');
  if (groups.length !== 1) reasons.push('Select one comparable sensor/platform/product/collection before constructing a baseline.');
  if (options.availability.quality === 'partial' || ['error', 'unavailable'].includes(options.availability.state)) reasons.push('Dataset availability is incomplete or unavailable.');
  const coverage = options.coverage ?? [];
  if (!coverage.length || records.some(o => !coverage.some(c => c.verified && c.complete && c.date === o.utcDate && c.datasetId === o.datasetId && c.region === o.regionId && c.instrument === o.sensor && c.platform === o.platform))) reasons.push('Comparable, region/platform-specific acquisition and valid-pixel coverage has not been established.');
  if (!options.validatedMethod?.independentlyValidated) reasons.push('No independently validated baseline/scoring methodology is configured.');
  // Coverage for observation dates alone does not prove a full baseline window.
  reasons.push('Full baseline-window sampling, seasonality and missing-day eligibility require scientific review.');
  return { eligible: false as const, score: null, baseline: null, years, reasons, methodology: 'firepulse.baseline-eligibility/v1', numericalScoring: 'disabled' as const };
}
export function fingerprintEligibility(observations: readonly Observation[]) {
  const archives = observations.filter(o => !o.provenance.fixture && o.provenance.processing === 'standard');
  const years = [...new Set(archives.map(o => o.utcDate.slice(0, 4)))].sort();
  const key = (o: Observation) => JSON.stringify([o.datasetId, o.sensor, o.platform, o.provenance.product, o.provenance.version, o.source]);
  const groups = new Map<string, Set<string>>();
  for (const o of archives) { const group = groups.get(key(o)) ?? new Set<string>(); group.add(o.utcDate.slice(0, 4)); groups.set(key(o), group); }
  const records = archives.filter(o => groups.get(key(o))!.size >= 2);
  return { eligible: records.length > 0, years, records, reason: !records.length ? 'At least two observed years of one comparable real standard-processing sensor/platform/product series are required for a descriptive year-to-year fingerprint. No recurrence or risk is inferred.' : 'Descriptive detections only: observed years do not establish complete annual coverage or a validated recurrence model.' };
}
const csvCell = (value: unknown) => { let text = value == null ? '' : String(value); if (typeof value !== 'number' && /^[\s]*[=+\-@\t\r]/.test(text)) text = "'" + text; return '"' + text.replaceAll('"', '""') + '"'; };
export function observationsCSV(observations: readonly Observation[]) {
  const keys = ['id', 'datasetId', 'regionId', 'acquiredAt', 'longitude', 'latitude', 'sensor', 'platform', 'frpMW', 'confidenceRaw', 'confidenceScheme', 'source', 'product', 'processing', 'version', 'developmentFixture','sourceFile','zipMember','sourceSHA256','sourceLine','importGeneration','rawVersion','brightnessOriginal','scan','track','dayNight','regionMembership'];
  return '\uFEFF' + [keys.map(csvCell).join(','), ...observations.map(o => [o.id, o.datasetId, o.regionId, o.acquiredAt, o.longitude, o.latitude, o.sensor, o.platform, o.frp, o.confidence.raw, o.confidence.scheme, o.source, o.provenance.product, o.provenance.processing, o.provenance.version, o.provenance.fixture,o.feature.properties?.source_file,o.feature.properties?.source_member,o.feature.properties?.source_sha256,o.feature.properties?.source_line,o.feature.properties?.import_generation,o.feature.properties?.source_version??o.feature.properties?.version,JSON.stringify(o.feature.properties?.brightness_original??{}),o.feature.properties?.scan,o.feature.properties?.track,o.feature.properties?.daynight,JSON.stringify(o.feature.properties?.region_membership??[])].map(csvCell).join(','))].join('\r\n');
}
export function decisionSummary(observations: readonly Observation[], filter: ObservationFilter, availability: Availability, generatedAt: string) {
  const summaries = sensorSummaries(filterObservations(observations, filter));
  return ['RASAD — descriptive observation brief', `Region: ${filter.region ?? 'unspecified'}; UTC window: ${filter.startDate ?? 'available start'} to ${filter.endDate ?? 'available end'}.`, `Generated: ${generatedAt}. Dataset state: ${availability.state}; coverage: ${availability.coverage}.`, ...summaries.map(s => `${s.sensor} / ${s.platform ?? 'unknown platform'} / ${s.datasetId}: ${s.count} thermal detections; reported FRP ${s.frpSum ?? 'unavailable'} MW (${s.frpReported}/${s.count} reported).`), ...(summaries.length ? [] : ['No observations loaded for this scope; this does not establish zero activity.']), 'Thermal detections are not confirmed wildfires. MODIS/VIIRS raw counts are not equivalent fire-event counts. FRP is reported pixel power, not daily energy.', 'No validated historical baseline, anomaly score, prediction or operational recommendation is provided.', availability.fixture ? 'DEVELOPMENT FIXTURE — not live observations.' : 'Coverage and sampling uncertainty must be reviewed before drawing conclusions.'].join('\n');
}
