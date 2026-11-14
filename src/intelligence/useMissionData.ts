import { useMemo } from 'react';
import { useCalendarObservations } from '../calendar/useCalendarObservations';
import { filterObservations, normalizeCollection } from '../../shared/observations';
import { useMission } from '../state/mission';
import type { Availability } from '../../shared/model';
export function useMissionData() {
  const { scope } = useMission();
  const result = useCalendarObservations(scope.region);
  const normalized = useMemo(() => normalizeCollection(result.collection, { region: scope.region }), [result.collection, scope.region]);
  const records = useMemo(() => filterObservations(normalized.observations, scope), [normalized, scope]);
  const availability: Availability = result.status === 'error' ? { state: 'error', quality: 'partial', coverage: 'unknown', fixture: false, reasons: [result.error ?? 'Source unavailable'] } : result.status === 'loading' ? { state: 'unavailable', quality: 'complete', coverage: 'unknown', fixture: false, reasons: ['Observation source is loading.'] } : normalized.availability;
  return { ...result, ...normalized, availability, records, scope };
}
