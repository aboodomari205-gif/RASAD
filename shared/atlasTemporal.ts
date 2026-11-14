import type {ObservationCollection,ObservationFilter,RegionId} from './model.ts';
export function selectedAtlasYear(scope:ObservationFilter & {calendarMonth:string}) {return (scope.startDate??scope.calendarMonth).slice(0,4);}
export function selectAtlasYear(year:string,region:RegionId,previous:Partial<Record<RegionId,string>>={}) {
 if(!/^(19\d{2}|20\d{2}|2100)$/.test(year))throw new RangeError('Invalid UTC year');
 return {startDate:year+'-01-01',endDate:year+'-12-31',startTime:undefined,endTime:undefined,calendarMonth:year+'-01',calendarDay:null,seasonYears:undefined,regionalYears:{...previous,[region]:year}};
}
export function observedAtlasDates(collection:ObservationCollection,scope:ObservationFilter & {region:RegionId},filter:(c:ObservationCollection,f:ObservationFilter & {region:RegionId})=>ObservationCollection){
 return [...new Set(filter(collection,{...scope,startDate:undefined,endDate:undefined,startTime:undefined,endTime:undefined}).features.map(f=>String(f.properties?.date)).filter(d=>/^\d{4}-\d{2}-\d{2}$/.test(d)))].sort();
}
