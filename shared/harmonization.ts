import { aggregatePeriods, filterObservations, sensorSummaries } from './observations.ts';
import type { Availability, CoverageDay, Dataset, Observation, ObservationFilter, Period } from './model.ts';

export const SENSOR_METHODS = {
  MODIS: { nominalResolutionM: 1000, confidence: 'Original 0–100 detection confidence; not an inter-sensor probability.', acquisition: 'Terra morning / Aqua afternoon nominal equatorial crossings; actual timestamps retained.' },
  VIIRS: { nominalResolutionM: 375, confidence: 'Original low / nominal / high categorical detection confidence.', acquisition: 'S-NPP nominal 01:30/13:30 equatorial crossings; actual timestamps retained. Other platforms have different orbits.' },
  UNKNOWN: { nominalResolutionM: null, confidence: 'Unknown sensor semantics.', acquisition: 'Unknown.' },
} as const;
/** Alignment only: no spatial clustering, count conversion, fire-event inference or baseline. */
export function compareSensors(observations: readonly Observation[], options: { filter: ObservationFilter; datasets: readonly Dataset[]; availability: Availability; period?: Period; coverage?: readonly CoverageDay[] }) {
  const filtered = filterObservations(observations, options.filter);
  const series = aggregatePeriods(filtered, { ...options, datasets: [...options.datasets], period: options.period ?? 'day' });
  const keys = [...new Set(series.flatMap(group => group.periods.map(bucket => bucket.period)))].sort();
  return {
    methodology: { id: 'firepulse.sensor-alignment/v1', operation: 'UTC calendar alignment of raw provenance-separated detections', period: options.period ?? 'day', region: options.filter.region ?? null, crossSensorCountTotal: null, conversionFactor: null, validatedNormalization: false, fireEventClustering: false },
    sensors: sensorSummaries(filtered),
    series,
    alignment: keys.map(period => ({ period, groups: series.map((group, index) => { const bucket = group.periods.find(bucket => bucket.period === period); return { seriesIndex: index, status: bucket?.status ?? 'unavailable', coverage: bucket?.coverageComplete ? 'verified' : 'unknown', bucket: bucket ?? null }; }) })),
    datasetContext: options.datasets.map(d => ({ datasetId: d.id, sensor: d.sensor ?? 'UNKNOWN', platform: d.platform ?? null, product: d.product ?? null, collection: d.version ?? null, processing: d.processing ?? 'unknown', profile: d.archiveProfile ?? null, availability: d.availability ?? options.availability, observedRange: (() => { const dates = filtered.filter(o => o.datasetId === d.id).map(o => o.utcDate).sort(); return dates.length ? { first: dates[0], last: dates.at(-1)! } : null; })(), semantics: SENSOR_METHODS[d.sensor ?? 'UNKNOWN'] })),
    limitations: ['Thermal detections are not confirmed fires or unique fire events.', 'Different pixel footprints, overpass times, cloud/smoke obscuration and detection algorithms affect counts.', 'Nominal resolution is not geolocation accuracy; scan/track describe variable pixel dimensions.', 'FRP is pixel-integrated MW, not energy; VIIRS retrieval uses 375/750 m information and is not a count conversion.', 'Observed date ranges are not acquisition coverage or product operational lifetimes.', 'No coverage evidence is inferred from archive delivery, a missing row or a matching date.', 'No validated baseline, universal conversion or sensor-normalized anomaly is supplied.'],
  };
}
export type SensorComparison = ReturnType<typeof compareSensors>;
