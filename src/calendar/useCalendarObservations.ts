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
  const key = JSON.stringify([region,retry,scope.sensor,year,endYear,scope.calendarMonth,scope.calendarDay,scope.processing,scope.platform,scope.confidenceRaw,scope.frpMin,scope.frpMax,scope.dayNight,scope.startDate,scope.endDate]);
  useEffect(() => {
    const controller = new AbortController();
    const month=scope.calendarMonth;
    const last=new Date(Date.UTC(Number(month.slice(0,4)),Number(month.slice(5,7)),0)).toISOString().slice(0,10);
    const from=scope.startDate&&scope.startDate>month+'-01'?scope.startDate:month+'-01';const to=scope.endDate&&scope.endDate<last?scope.endDate:last;
    const query=new URLSearchParams({mode:region,summary:'day',from,to,sensor:scope.sensor});
    if(scope.confidenceRaw&&scope.confidenceRaw!=='all')query.set('confidence',scope.confidenceRaw);if(scope.frpMin!==undefined)query.set('frpMin',String(scope.frpMin));if(scope.frpMax!==undefined)query.set('frpMax',String(scope.frpMax));if(scope.dayNight)query.set('daynight',scope.dayNight);
    if(scope.processing)query.set('processing',scope.processing);if(scope.platform)query.set('platform',scope.platform);
    const evidenceDate=scope.calendarDay&&(!scope.startDate||scope.calendarDay>=scope.startDate)&&(!scope.endDate||scope.calendarDay<=scope.endDate)?scope.calendarDay:undefined;
    Promise.all([fetchObservationCollection(region, controller.signal,year,endYear,{from:evidenceDate??scope.startDate,to:evidenceDate??scope.endDate,filters:scope}),fetch('/api/observations?'+query,{signal:controller.signal}).then(async r=>{if(!r.ok)throw Error('Calendar summary unavailable');return r.json();})]).then(([data,summary]) => {
      if(summary.generation&&summary.generation!==data.metadata?.activationRevision)throw Error('Import generation changed; retry the source.');
      if(summary.region!==region)throw Error('Calendar summary scope mismatch');
      data={...data,metadata:{...data.metadata,dailySummary:summary.series}};
      if (!controller.signal.aborted) setResult({ key, collection: data, error: null });
    }).catch(error => { if (!controller.signal.aborted) setResult({ key, collection: EMPTY, error: error instanceof Error && /^(Select at most|Narrow the UTC)/.test(error.message)?error.message: 'The observation service could not be read. Retry the connection; missing data is never treated as zero activity.' }); });
    return () => controller.abort();
  }, [region, key, year,endYear]);
  const current = result?.key === key ? result : null;
  return { availability: current?.collection.metadata?.availability ?? null, collection: current?.collection ?? EMPTY, status: !current ? 'loading' as const : current.error ? 'error' as const : 'ready' as const, error: current?.error, retry: () => setRetry(value => value + 1) };
}
