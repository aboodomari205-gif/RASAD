import type {RegionId} from './model';
export const ACTIVE_REGIONS = [
  {id:'brazil',name:'Brazil',country:'bra'},
] as const;
export const regionName=(id:RegionId)=>ACTIVE_REGIONS.find(r=>r.id===id)?.name??'Unsupported region';
export function activeRegion(id:unknown):id is typeof ACTIVE_REGIONS[number]['id'] {return ACTIVE_REGIONS.some(r=>r.id===id);}
