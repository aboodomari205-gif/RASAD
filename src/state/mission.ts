import { createContext, useContext } from 'react';
import type { ObservationFilter, RegionId } from '../../shared/model';
export type MissionScope = ObservationFilter & { region: RegionId; sensor: string; metric: 'count' | 'frp'; calendarMonth: string; activatedArchive?: string; historicalData?:boolean; regionalYears?:Partial<Record<RegionId,string>>; calendarDay?: string | null; seasonYears?: string[] };
export const MODULES = ['Intelligence Map', 'Burning Calendar', 'Fire Season Clock', 'Sensor Intelligence', 'Evidence Engine', 'Fire DNA', 'Anomaly Detection', 'Decision Brief', 'Trust the Signal'] as const;
/** Five public destinations; older deep links remain valid within each section. */
export const NAVIGATION = [
  { name: 'Mission Atlas', module: 'Intelligence Map' },
  { name: 'Burning Calendar', module: 'Burning Calendar' },
  { name: 'Activity Intelligence', module: 'Anomaly Detection' },
  { name: 'Sensor Harmonization', module: 'Sensor Intelligence' },
  { name: 'Research & Export', module: 'Trust the Signal' },
] as const;
export function sectionName(module: string) {
  if (['Fire Season Clock', 'Fire DNA', 'Burning Calendar'].includes(module)) return 'Burning Calendar';
  if (module === 'Anomaly Detection') return 'Activity Intelligence';
  if (['Sensor Intelligence', 'Evidence Engine'].includes(module)) return 'Sensor Harmonization';
  if (['Decision Brief', 'Trust the Signal'].includes(module)) return 'Research & Export';
  return 'Mission Atlas';
}
export function moduleHash(name: string) { return '#' + (name === 'Intelligence Map' ? 'mission-atlas' : name.toLowerCase().replaceAll(' ', '-')); }
export function readModuleHash(): typeof MODULES[number] { return MODULES.find(name => moduleHash(name) === window.location.hash) ?? 'Intelligence Map'; }
export const MissionContext = createContext<{ scope: MissionScope; update: (patch: Partial<MissionScope>) => void } | null>(null);
export function useMission() { const value = useContext(MissionContext); if (!value) throw new Error('Mission scope provider missing'); return value; }
