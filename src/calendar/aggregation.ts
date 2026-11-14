import type { Feature } from 'geojson';
import { acquisitionUTC, aggregateDays, emptyDay, normalizeCollection, validUTCDate } from '../../shared/observations.ts';
import type { ObservationCollection, RegionId, Instrument, VerifiedDayCoverage } from '../../shared/model.ts';
export { acquisitionUTC, validUTCDate };
export type { ObservationCollection, Instrument, VerifiedDayCoverage };
export type ObservationRegion = RegionId;
export type CalendarMetric = 'count' | 'frp';
export type DailyObservation = { feature: Feature<GeoJSON.Point>; date: string; acquiredAt: string | null; instrument: Instrument; frp: number | null };
export type DailyActivity = { date: string; status: 'observed' | 'verified-zero' | 'unavailable'; observations: DailyObservation[]; count: number; frpSum: number | null; frpReported: number; frpComplete: boolean; coverageSources: string[]; contributions?: {key:string;label:string;count:number;frpSum:number|null;frpReported:number}[] };
export type CalendarMapSelection = { id: number; region: ObservationRegion; date: string; sensor: Instrument; observationId?: string };
export function aggregateDailyObservations(collection: ObservationCollection, options: { region: ObservationRegion; instrument: Instrument; coverage?: readonly VerifiedDayCoverage[] }) {
  const normalized = normalizeCollection(collection, { region: options.region, sensor: options.instrument });
  const ids=[...new Set(normalized.observations.map(o=>o.datasetId))];
  const reviewed=normalized.datasets.every(d=>d.kind==='archive'&&d.source==='NASA FIRMS'&&typeof (d as unknown as Record<string,unknown>).deliveryProfile==='string');
  const groups=ids.length>1&&reviewed?ids.map(id=>aggregateDays(normalized.observations.filter(o=>o.datasetId===id),{region:options.region,sensor:options.instrument,availability:normalized.availability,coverage:[],datasetIds:[id]})): [aggregateDays(normalized.observations,{region:options.region,sensor:options.instrument,availability:normalized.availability,coverage:normalized.regionMismatch?[]:options.coverage,datasetIds:normalized.datasets.map(d=>d.id)})];
  const buckets=new Map<string,import('../../shared/model').DayBucket>();
  for(const group of groups)for(const [date,day]of group){const previous=buckets.get(date);if(!previous)buckets.set(date,{...day,observations:[...day.observations]});else{previous.observations.push(...day.observations);previous.status='observed';const reported=previous.observations.filter(o=>o.frp!==null);previous.count=previous.observations.length;previous.frpSum=reported.length?reported.reduce((n,o)=>n+o.frp!,0):null;previous.frpReported=reported.length;previous.frpComplete=reported.length===previous.count;previous.coverageSources=[];}}
  const days = new Map<string, DailyActivity>([...buckets].map(([date, day]) => [date, { ...day, contributions:[...new Set(day.observations.map(o=>JSON.stringify([o.datasetId,o.platform,o.provenance.product,o.provenance.processing,o.provenance.version,o.confidence.scheme])))].map(key=>{const rows=day.observations.filter(o=>JSON.stringify([o.datasetId,o.platform,o.provenance.product,o.provenance.processing,o.provenance.version,o.confidence.scheme])===key);const reports=rows.filter(o=>o.frp!==null);return {key,label:JSON.parse(key).join(' / '),count:rows.length,frpSum:reports.length?reports.reduce((n,o)=>n+o.frp!,0):null,frpReported:reports.length};}), observations: day.observations.map(observation => ({ feature: observation.feature, date: observation.utcDate, acquiredAt: observation.acquiredAt, instrument: options.instrument, frp: observation.frp })) }]));
  return { days, duplicatesRemoved: normalized.diagnostics.duplicatesRemoved, rejectedRecords: normalized.diagnostics.rejectedRecords, sensorExcluded: normalized.diagnostics.sensorExcluded, regionMismatch: normalized.regionMismatch };
}
export function dailyActivity(days: ReadonlyMap<string, DailyActivity>, date: string): DailyActivity { return days.get(date) ?? { ...emptyDay(date), observations: [] }; }
export function monthDates(year: number, month: number): string[] {
  if (!Number.isInteger(year) || year < 1900 || year > 2100 || !Number.isInteger(month) || month < 0 || month > 11) throw new RangeError('Calendar month out of range');
  const length = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  return Array.from({ length }, (_, index) => `${year}-${String(month + 1).padStart(2, '0')}-${String(index + 1).padStart(2, '0')}`);
}
