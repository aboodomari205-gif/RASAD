import {useMission} from '../state/mission';
import { fetchObservationCollection } from '../data/observations';
import { useEffect, useState } from 'react';
import type { ObservationCollection, ObservationRegion } from './aggregation';
const EMPTY: ObservationCollection = { type: 'FeatureCollection', features: [] };
type Result = { key: string; collection: ObservationCollection; error: string | null };
export function useCalendarObservations(region: ObservationRegion) {
  const {scope}=useMission();
  const year=Number((scope.startDate??scope.calendarMonth).slice(0,4));const endYear=Number(scope.endDate?.slice(0,4)??year);
  const [retry, setRetry] = useState(0);
  const [result, setResult] = useState<Result | null>(null);
  const key = `${region}:${retry}:${year}:${endYear}`;
  useEffect(() => {
    const controller = new AbortController();
    fetchObservationCollection(region, controller.signal,year,endYear).then(data => {
      if (!controller.signal.aborted) setResult({ key, collection: data, error: null });
    }).catch(error => { if (!controller.signal.aborted) setResult({ key, collection: EMPTY, error: error instanceof Error && /^(Select at most|Narrow the UTC)/.test(error.message)?error.message: 'The observation service could not be read. Retry the connection; missing data is never treated as zero activity.' }); });
    return () => controller.abort();
  }, [region, key, year,endYear]);
  const current = result?.key === key ? result : null;
  return { availability: current?.collection.metadata?.availability ?? null, collection: current?.collection ?? EMPTY, status: !current ? 'loading' as const : current.error ? 'error' as const : 'ready' as const, error: current?.error, retry: () => setRetry(value => value + 1) };
}
