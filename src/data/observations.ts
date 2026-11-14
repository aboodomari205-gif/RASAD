import { filterObservations, normalizeCollection } from '../../shared/observations.ts';
import type { ObservationCollection, ObservationFilter, RegionId } from '../../shared/model.ts';
const collectionListeners = new Set<(collection: ObservationCollection) => void>();
export function subscribeObservationCollections(listener: (collection: ObservationCollection) => void) {
  collectionListeners.add(listener); return () => { collectionListeners.delete(listener); };
}
const normalizedCache = new WeakMap<ObservationCollection, ReturnType<typeof normalizeCollection>>();
export function filterObservationCollection(collection: ObservationCollection, filter: ObservationFilter & { region: RegionId }): ObservationCollection {
  let normalized = normalizedCache.get(collection);
  if (!normalized || normalized.datasets.some(dataset => dataset.regionId !== filter.region)) {
    normalized = normalizeCollection(collection, { region: filter.region, deduplicate: true });
    if (!normalized.regionMismatch) normalizedCache.set(collection, normalized);
  }
  return { ...collection, features: filterObservations(normalized.observations, filter).map(observation => observation.feature) };
}
export async function fetchObservationCollection(region: RegionId, signal?: AbortSignal, year?: number, endYear?: number): Promise<ObservationCollection> {
  const response = await fetch(`/api/observations?mode=${encodeURIComponent(region)}`+'&manifest=1', { signal });
  if (!response.ok) throw new Error('Observation source unavailable');
  let collection: ObservationCollection = await response.json();
  if(collection.metadata?.historical){
    const metadata=collection.metadata,paths=metadata.yearPaths as Record<string,string>;const first=year??Number(metadata.defaultYear),last=endYear??first;
    if(last<first||last-first>2)throw new Error('Select at most three consecutive UTC years; full-history summaries remain separate from raw evidence.');
    const counts=metadata.yearCounts as Record<string,number>|undefined;let requested=0;for(let y=first;y<=last;y++)requested+=counts?.[String(y)]??0;if(requested>3000)throw new Error('Narrow the UTC window: raw evidence view is limited to 3000 observations.');
    const windows:ObservationCollection[]=[];
    for(let selected=first;selected<=last;selected++){const target=paths[String(selected)];if(!target)continue;const part=await fetch(target,{signal});if(!part.ok)throw new Error('Historical window unavailable');const window:ObservationCollection=await part.json();if(window.metadata?.mode!==region)throw new Error('Historical region mismatch');if(counts&&window.features.length!==counts[String(selected)])throw new Error('Historical shard count mismatch');windows.push(window);}
    const features=windows.flatMap(w=>w.features);if(features.length>3000)throw new Error('Narrow the UTC window: raw evidence view is limited to 3000 observations.');
    collection={...collection,features,metadata:{...metadata,windowYear:first,windowThroughYear:last}};
  }

  if (collection.type !== 'FeatureCollection' || !Array.isArray(collection.features) || collection.metadata?.mode !== region || (region === 'ajloun' && collection.metadata?.developmentFixture === true)) throw new Error('Unexpected observation collection scope');
  const normalized = normalizeCollection(collection, { region, deduplicate: true });
  if (normalized.regionMismatch || normalized.availability.state === 'error') throw new Error('Observation provenance or source is unavailable');
  // Legacy UI has one source choice per sensor; ambiguous same-sensor datasets need
  // explicit catalog selection instead of an invisible concatenation.
  const bySensor=new Map<string,Set<string>>();for(const o of normalized.observations){const ids=bySensor.get(o.sensor)??new Set<string>();ids.add(o.datasetId);bySensor.set(o.sensor,ids);}
  if([...bySensor.values()].some(ids=>ids.size>1)&&!normalized.datasets.every(d=>d.kind==='archive'&&d.source==='NASA FIRMS'&&typeof (d as unknown as Record<string,unknown>).deliveryProfile==='string'))throw new Error('Explicit dataset selection required');
  const accepted = { ...collection, metadata: { ...collection.metadata, availability: normalized.availability, canonicalDiagnostics: normalized.diagnostics }, features: normalized.observations.map(observation => observation.feature) };
  normalizedCache.set(accepted, normalized);
  for (const listener of collectionListeners) listener(accepted);
  return accepted;
}
