import { createContext, useContext } from 'react';
import type { ObservationFilter, RegionId } from '../../shared/model';
export type MissionScope = ObservationFilter & { region: RegionId; sensor: string; metric: 'count' | 'frp'; calendarMonth: string; activatedArchive?: string; historicalData?:boolean; regionalYears?:Partial<Record<RegionId,string>>; calendarDay?: string | null; seasonYears?: string[] };
export const MODULES = ['Harmonization Lab','AI Research Lab','Evidence & Methods','Intelligence Map', 'Burning Calendar', 'Fire Season Clock', 'Sensor Intelligence', 'Evidence Engine', 'Fire DNA', 'Anomaly Detection', 'Decision Brief', 'Trust the Signal'] as const;
/** Four focused public destinations. Legacy routes redirect without exposing retired pages. */
export const NAVIGATION = [
  { name: 'Harmonization Lab', module: 'Harmonization Lab' },
  { name: 'Burning Calendar', module: 'Burning Calendar' },
  { name: 'AI Research Lab', module: 'AI Research Lab' },
  { name: 'Evidence & Methods', module: 'Evidence & Methods' },
] as const;
export function sectionName(module: string) {
  if (['Fire Season Clock', 'Fire DNA', 'Burning Calendar'].includes(module)) return 'Burning Calendar';
  if (['Anomaly Detection','AI Research Lab'].includes(module)) return 'AI Research Lab';
  if (['Decision Brief', 'Trust the Signal','Evidence & Methods'].includes(module)) return 'Evidence & Methods';
  return 'Harmonization Lab';
}
export function moduleHash(name: string) { const section=sectionName(name);return section==='Evidence & Methods'?'#evidence-methods':'#'+section.toLowerCase().replaceAll(' ','-'); }
export function readModuleHash(): typeof MODULES[number] { const hash=window.location.hash;const found=NAVIGATION.find(({module})=>moduleHash(module)===hash);if(found)return found.module;const legacy=MODULES.find(name=>'#'+name.toLowerCase().replaceAll(' ','-')===hash);return (legacy?sectionName(legacy):hash==='#mission-atlas'?'Harmonization Lab':'Harmonization Lab') as typeof MODULES[number]; }
export const MissionContext = createContext<{ scope: MissionScope; update: (patch: Partial<MissionScope>) => void } | null>(null);
export function useMission() { const value = useContext(MissionContext); if (!value) throw new Error('Mission scope provider missing'); return value; }
