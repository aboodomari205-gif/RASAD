import { normalizeCollection } from './observations.ts';
import type { ObservationCollection, ObservationFilter, RegionId } from './model.ts';

export type RegionalScope = ObservationFilter & { region: RegionId; sensor: string; calendarMonth: string; calendarDay?: string | null; seasonYears?: string[] };
/** Called only on a region transition, never on ordinary filtering within a region.
 * Retain compatible choices; detection extents are not asserted to be coverage.
 */
export function reconcileRegionScope<T extends RegionalScope>(scope: T, collection: ObservationCollection): T {
  const normalized = normalizeCollection(collection, { region: scope.region });
  if (normalized.regionMismatch || ['error', 'unavailable'].includes(normalized.availability.state)) return scope;
  const records = normalized.observations;
  const next = { ...scope };
  const historical=collection.metadata?.historical===true;
  if (next.sensor !== 'all' && !records.some(o => o.sensor === next.sensor) && !(historical&&normalized.datasets.some(d=>d.sensor===next.sensor))) next.sensor = 'all';
  const sensorRecords = records.filter(o => next.sensor === 'all' || o.sensor === next.sensor);
  if (next.sensor === 'all' || !sensorRecords.some(o => String(o.confidence.raw) === next.confidenceRaw)) next.confidenceRaw = 'all';
  if (next.platform && !sensorRecords.some(o => o.platform === next.platform)) next.platform = undefined;
  if (next.datasetIds) {
    const ids = next.datasetIds.filter(id => normalized.datasets.some(d => d.id === id));
    next.datasetIds = ids.length ? ids : undefined;
  }
  if (next.fixture === 'only' && !normalized.availability.fixture || next.fixture === 'exclude' && normalized.availability.fixture) next.fixture = undefined;
  if (next.bbox && !records.some(o => o.longitude >= next.bbox![0] && o.latitude >= next.bbox![1] && o.longitude <= next.bbox![2] && o.latitude <= next.bbox![3])) next.bbox = undefined;
  if ((next.frpMin !== undefined || next.frpMax !== undefined) && !sensorRecords.some(o => o.frp !== null && o.frp >= (next.frpMin ?? 0) && o.frp <= (next.frpMax ?? Infinity))) { next.frpMin = undefined; next.frpMax = undefined; }
  const extent=collection.metadata?.observedExtent;
  const dates = historical&&Array.isArray(extent)&&extent.length===2?extent.map(String).sort():records.map(o => o.utcDate).sort();
  if (dates.length) {
    const first = dates[0], last = dates.at(-1)!;
    // Preserve partially overlapping and intentionally empty windows inside the extent.
    if (!historical && (next.startDate && next.startDate > last || next.endDate && next.endDate < first)) { next.startDate = undefined; next.endDate = undefined; }
    const timestamps = records.flatMap(o => o.acquiredAt ? [Date.parse(o.acquiredAt)] : []).sort((a,b) => a-b);
    if (timestamps.length && (next.startTime && Date.parse(next.startTime) > timestamps.at(-1)! || next.endTime && Date.parse(next.endTime) < timestamps[0])) { next.startTime = undefined; next.endTime = undefined; }
    if (!historical && (next.calendarMonth < first.slice(0,7) || next.calendarMonth > last.slice(0,7))) next.calendarMonth = last.slice(0,7);
    if (next.calendarDay && !records.some(o=>o.utcDate===next.calendarDay)) next.calendarDay = null;
    if (next.seasonYears) { const years = new Set(historical&&Array.isArray(collection.metadata?.availableYears)?collection.metadata.availableYears.map(String):dates.map(d => d.slice(0,4))); const selected = next.seasonYears.filter(y => years.has(y)); next.seasonYears = selected.length ? selected : undefined; }
  } else { next.startDate = undefined; next.endDate = undefined; next.startTime = undefined; next.endTime = undefined; next.calendarDay = null; next.seasonYears = undefined; }
  return next;
}
