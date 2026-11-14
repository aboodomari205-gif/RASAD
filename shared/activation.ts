import type { ObservationCollection, ObservationFilter } from './model.ts';
/** One-time migration when a new archive delivery becomes available. Never reset ongoing user filtering. */
export function archiveActivation(collection: ObservationCollection, scope: ObservationFilter & { activatedArchive?: string }) {
  if(collection.metadata?.mode!==scope.region)return null;
  const datasets = collection.metadata?.datasets?.filter(d => d.regionId === scope.region && d.kind === 'archive') ?? [];
  if (!datasets.length) return null;
  const revision = typeof collection.metadata?.activationRevision==='string'?collection.metadata.activationRevision:JSON.stringify(datasets.map(d => [d.id, d.importedAt ?? d.checksum ?? '']).sort());
  if (revision === scope.activatedArchive) return null;
  const dates = collection.features.map(f => String(f.properties?.date ?? '')).filter(d => /^\d{4}-\d{2}-\d{2}$/.test(d)).sort();
  if(collection.metadata?.historical){const year=Number(collection.metadata.defaultYear);return {...clearObservationFilters,historicalData:true,startDate:year+'-01-01',endDate:year+'-12-31',calendarMonth:Array.isArray(collection.metadata.observedExtent)?String(collection.metadata.observedExtent[1]).slice(0,7):year+'-01',calendarDay:null,seasonYears:undefined,activatedArchive:revision};}
  if (!dates.length) return null;
  return { ...clearObservationFilters, startDate: dates[0], endDate: dates.at(-1)!, calendarMonth: dates.at(-1)!.slice(0, 7), calendarDay: null, seasonYears: undefined, activatedArchive: revision };
}
export const clearObservationFilters = { processing:undefined,sensor: 'all', confidenceRaw: 'all', startDate: undefined, endDate: undefined, startTime: undefined, endTime: undefined, platform: undefined, datasetIds: undefined, frpMin: undefined, frpMax: undefined, bbox: undefined, fixture: undefined } satisfies ObservationFilter;

