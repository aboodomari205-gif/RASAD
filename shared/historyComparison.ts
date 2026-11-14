import type {historicalSummary} from './historySummary.ts';
type Summary=ReturnType<typeof historicalSummary>;
/** Descriptive delivery comparisons, never exposure-normalized fire activity. */
export function compareDeliveredYears(summary:Summary,first:string,second:string){
 const groups=new Map<string,{key:string;source:string;sensor:string;platform:string|null;processing:string;product:string|null;version:string|null;datasetId:string;first:number|null;second:number|null}>();
 for(const row of summary.series){if(row.period!==first&&row.period!==second)continue;
 const key=JSON.stringify([row.datasetId,row.source,row.sensor,row.platform,row.product,row.version,row.processing,row.confidenceScheme]);
 const group=groups.get(key)??{key,source:row.source,sensor:row.sensor,platform:row.platform,processing:row.processing,product:row.product,version:row.version,datasetId:row.datasetId,first:null,second:null};
 if(row.period===first)group.first=(group.first??0)+row.count;if(row.period===second)group.second=(group.second??0)+row.count;groups.set(key,group);
 }
 return {method:'source-separated delivered counts',coverage:'unknown',calibrated:false,first,second,rows:[...groups.values()].sort((a,b)=>a.key.localeCompare(b.key))};
}

/** Compare identical calendar months within an unchanged source stratum.
 * A missing monthly row stays null, never zero. Conditioning on observed months
 * is selection-biased and cannot estimate a climatology, rate or anomaly.
 */
export function compareDeliveredMonths(summary:Summary,first:string,second:string){
 if(!/^\d{4}$/.test(first)||!/^\d{4}$/.test(second)||first===second)throw new RangeError('Choose two distinct UTC years');
 const groups=new Map<string,{key:string;datasetId:string;source:string;sensor:string;platform:string|null;product:string|null;version:string|null;processing:string;confidenceScheme:string;months:Map<string,{first:Summary['series'][number]|null;second:Summary['series'][number]|null}>}>();
 for(const row of summary.series){if(!/^\d{4}-(0[1-9]|1[0-2])$/.test(row.period)||![first,second].includes(row.period.slice(0,4)))continue;
  const key=JSON.stringify([row.datasetId,row.source,row.sensor,row.platform,row.product,row.version,row.processing,row.confidenceScheme]);
  const group=groups.get(key)??{key,datasetId:row.datasetId,source:row.source,sensor:row.sensor,platform:row.platform,product:row.product,version:row.version,processing:row.processing,confidenceScheme:row.confidenceScheme,months:new Map()};
  const month=row.period.slice(5),bucket=group.months.get(month)??{first:null,second:null},side=row.period.startsWith(first)?'first':'second';
  if(bucket[side])throw new RangeError('Duplicate monthly summary stratum');
  if(!Number.isSafeInteger(row.count)||row.count<1||!Number.isSafeInteger(row.frpReported)||row.frpReported<0||row.frpReported>row.count||(row.frpSum!==null&&(!Number.isFinite(row.frpSum)||row.frpSum<0))||(row.frpReported===0)!==(row.frpSum===null))throw new RangeError('Invalid observed monthly summary');
  bucket[side]=row;group.months.set(month,bucket);groups.set(key,group);
 }
 return {schema:'firepulse.matched-delivery-months/v1',region:summary.region,first,second,coverage:'unknown',calibrated:false,anomaly:null,method:'Same calendar month and exact dataset/source/sensor/platform/product/version/processing/confidence stratum; observed support only',
  limitations:['Months missing on either side remain unknown, not zero.','Selecting months with detections in both years introduces selection bias.','Equal calendar months do not establish equal sampling, acquisition coverage or sensitivity.','Raw FRP sums are reported MW, not energy or comparable fire intensity.'],
  strata:[...groups.values()].sort((a,b)=>a.key.localeCompare(b.key)).map(({months,...g})=>({...g,months:Array.from({length:12},(_,i)=>{const month=String(i+1).padStart(2,'0'),pair=months.get(month),a=pair?.first??null,b=pair?.second??null;
   const eligible=g.processing==='standard'&&Boolean(g.product&&g.version&&g.platform&&g.source&&['modis-percent','viirs-categorical'].includes(g.confidenceScheme));
   return {month,first:a?{count:a.count,frpSum:a.frpSum,frpReported:a.frpReported}:null,second:b?{count:b.count,frpSum:b.frpSum,frpReported:b.frpReported}:null,status:a&&b?(eligible?'matched-observed-support':'processing-or-provenance-ineligible'):'unknown-support',descriptiveDifference:a&&b&&eligible?b.count-a.count:null,normalizedRate:null};})}))};
}

