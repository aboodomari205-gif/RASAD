import type {Observation,RegionId} from './model.ts';
/** Delivered-record summaries only. No row is created for an unobserved period. */
export function historicalSummary(records:readonly Observation[],region:RegionId){
 const buckets=new Map<string,{datasetId:string;sensor:string;platform:string|null;product:string|null;version:string|null;processing:string;source:string;confidenceScheme:string;period:string;count:number;frpSum:number|null;frpReported:number;coverage:'unknown'}>();
 const unique=new Map<string,Observation>();for(const o of records){if(unique.has(o.id)&&JSON.stringify(unique.get(o.id))!==JSON.stringify(o))throw new RangeError('Conflicting summary identity');unique.set(o.id,o);}
 for(const o of [...unique.values()].sort((a,b)=>a.id.localeCompare(b.id))){if(o.regionId!==region)throw new RangeError('Historical summary region mismatch');for(const period of [o.utcDate,o.utcDate.slice(0,7),o.utcDate.slice(0,4)]){
  const context={datasetId:o.datasetId,sensor:o.sensor,platform:o.platform,product:o.provenance.product,version:o.provenance.version,processing:o.provenance.processing,source:o.source,confidenceScheme:o.confidence.scheme,period};const key=JSON.stringify(context);const bucket=buckets.get(key)??{...context,count:0,frpSum:null,frpReported:0,coverage:'unknown' as const};bucket.count++;if(o.frp!==null){bucket.frpReported++;bucket.frpSum=(bucket.frpSum??0)+o.frp;}buckets.set(key,bucket);
 }}
 return {schema:'firepulse.historical-summary/v1',region,unfiltered:true,coverage:'unknown',meaning:'Source-separated delivered observations; no missing dates are zero-filled',series:[...buckets].sort(([a],[b])=>a.localeCompare(b)).map(([,row])=>row)};
}
