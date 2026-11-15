import {activeRegion} from '../../shared/regions';
import {selectAtlasYear,selectedAtlasYear} from '../../shared/atlasTemporal';
import { reconcileRegionScope } from '../../shared/regionScope';
import { archiveActivation } from '../../shared/activation';
import { fetchObservationCollection, subscribeObservationCollections } from '../data/observations';
import { useEffect, useCallback, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { MissionContext } from './mission';
import type { MissionScope } from './mission';
import { validateFilter, validUTCDate } from '../../shared/observations';
const initial: MissionScope = { region: 'brazil', sensor: 'all', metric: 'count', confidenceRaw: 'all', calendarMonth:'2024-08',startDate:'2024-08-01',endDate:'2024-08-31',selectedUTCDate:'2024-08-24',bbox:[-57,-14,-55,-12] };
function restore(): MissionScope { try { const saved = JSON.parse(sessionStorage.getItem('rasad.brazil-scope.v1') ?? 'null'); if (saved && activeRegion(saved.region) && ['all', 'VIIRS', 'MODIS'].includes(saved.sensor) && ['count', 'frp'].includes(saved.metric) && /^(19\d{2}|20\d{2}|2100)-(0[1-9]|1[0-2])$/.test(saved.calendarMonth) && (saved.calendarDay == null || validUTCDate(saved.calendarDay)) && (saved.seasonYears === undefined || (Array.isArray(saved.seasonYears) && saved.seasonYears.every((year: unknown) => typeof year === 'string' && /^\d{4}$/.test(year))))) { validateFilter(saved); return { ...saved, ...initial,metric:saved.metric,activatedArchive:saved.activatedArchive,historicalData:saved.historicalData,platform:undefined,processing:undefined,frpMin:undefined,frpMax:undefined,dayNight:undefined,startTime:undefined,endTime:undefined,seasonYears:undefined,regionalYears:undefined }; } } catch { /* Private browsing or stale/invalid state: use the Brazil default. */ } return initial; }
export function MissionProvider({ children }: { children: ReactNode }) {
  const [scope, setScope] = useState<MissionScope>(restore);
  useEffect(()=>{try{sessionStorage.setItem('rasad.brazil-scope.v1',JSON.stringify(scope));}catch{/* Keep normalized scope in memory. */}},[scope]);
  const current = useRef(scope);
  const pendingRegion = useRef(false);
  const update = useCallback((patch: Partial<MissionScope>) => { const previous = current.current; const remembered=patch.region&&patch.region!==previous.region&&patch.startDate===undefined&&patch.endDate===undefined?previous.regionalYears?.[patch.region]:undefined; const next = { ...previous,...(remembered&&remembered!==selectedAtlasYear(previous)?selectAtlasYear(remembered,patch.region!,previous.regionalYears):{}), ...patch }; if(patch.selectedUTCDate===undefined&&(patch.startDate!==undefined||patch.endDate!==undefined)){if(next.startDate===next.endDate)next.selectedUTCDate=next.startDate;else if(next.selectedUTCDate&&((next.startDate&&next.selectedUTCDate<next.startDate)||(next.endDate&&next.selectedUTCDate>next.endDate)))next.selectedUTCDate=undefined;} if (patch.calendarMonth === undefined && patch.startDate && validUTCDate(patch.startDate)) next.calendarMonth = patch.startDate.slice(0, 7); validateFilter(next); if (JSON.stringify(next) !== JSON.stringify(previous)) { if (previous.region !== next.region) pendingRegion.current = true; current.current = next; setScope(next); try { sessionStorage.setItem('rasad.brazil-scope.v1', JSON.stringify(next)); } catch { /* Scope still works in memory when storage is unavailable. */ } } }, []);
  useEffect(() => {
    const accept = (collection: Awaited<ReturnType<typeof fetchObservationCollection>>) => {
      if (collection.metadata?.mode !== current.current.region) return;
      if(collection.metadata?.historical&&!current.current.historicalData)update({historicalData:true});
      const activation = archiveActivation(collection, current.current);
      if (activation) update({activatedArchive:activation.activatedArchive,historicalData:true});
      if (pendingRegion.current && !['error', 'unavailable'].includes(collection.metadata?.availability?.state ?? 'unavailable')) {
        const next = reconcileRegionScope(current.current, collection);
        pendingRegion.current = false;
        update(next);
      }
    };
    return subscribeObservationCollections(accept);
  }, [update]);
  useEffect(() => {
    const controller = new AbortController();
    const requested=current.current;
    const first=Number((requested.startDate??requested.calendarMonth).slice(0,4));
    fetchObservationCollection(scope.region, controller.signal,first,Number(requested.endDate?.slice(0,4)??first)).catch(() => { /* View retries also notify the shared reconciler. */ });
    return () => controller.abort();
  }, [scope.region]);
  const value = useMemo(() => ({ scope, update }), [scope, update]);
  return <MissionContext value={value}>{children}</MissionContext>;
}
