import { createContext, useContext } from 'react';
import type { ObservationFilter, RegionId } from '../../shared/model';
export type MissionScope = ObservationFilter & { region: RegionId; sensor: string; metric: 'count' | 'frp'; calendarMonth: string; activatedArchive?: string; historicalData?:boolean; regionalYears?:Partial<Record<RegionId,string>>; calendarDay?: string | null; seasonYears?: string[] };
export const MODULES = ['Intelligence Map', 'Burning Calendar', 'Fire Season Clock', 'Sensor Intelligence', 'Evidence Engine', 'Fire DNA', 'Anomaly Detection', 'Decision Brief', 'Trust the Signal'] as const;
export function moduleHash(name: string) { return '#' + (name === 'Intelligence Map' ? 'mission-atlas' : name.toLowerCase().replaceAll(' ', '-')); }
export function readModuleHash(): typeof MODULES[number] { return MODULES.find(name => moduleHash(name) === window.location.hash) ?? 'Intelligence Map'; }
export const MissionContext = createContext<{ scope: MissionScope; update: (patch: Partial<MissionScope>) => void } | null>(null);
export function useMission() { const value = useContext(MissionContext); if (!value) throw new Error('Mission scope provider missing'); return value; }
