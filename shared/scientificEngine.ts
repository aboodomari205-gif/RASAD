import {describeObservedPeriods} from './observedPeriods.ts';
import type {Availability,Dataset,Observation,RegionId} from './model.ts';
import {associateSensors,DEFAULT_MATCH,thermalFingerprint,type MatchOptions} from './evidence.ts';
import {sensitivitySeries} from './agreement.ts';
import {historicalSummary} from './historySummary.ts';
import {compareDeliveredMonths} from './historyComparison.ts';
import {fingerprintEligibility} from './analytics.ts';

export const SCIENTIFIC_METHOD='firepulse.source-aware-harmonization/v1';
const stratumKey=(o:Observation)=>JSON.stringify([o.regionId,o.datasetId,o.source,o.sensor,o.platform,o.provenance.product,o.provenance.version,o.provenance.processing,o.confidence.scheme]);
export function utcSeason(date:string){const y=Number(date.slice(0,4)),m=Number(date.slice(5,7));return `${m===12?y+1:y}-${m===12||m<=2?'DJF':m<=5?'MAM':m<=8?'JJA':'SON'}`;}
/** Detection-only harmonization. No opportunity denominator is inferred from timestamps. */
export function scientificHarmonization(input:readonly Observation[],datasets:readonly Dataset[],region:RegionId,thresholds:MatchOptions=DEFAULT_MATCH){
 if(input.some(o=>o.regionId!==region))throw new RangeError('Scientific scope must contain one independent region');
 const matching=associateSensors(input,thresholds); // shared identity and eligibility validation
 const records=[...new Map(input.filter(o=>!o.provenance.fixture).map(o=>[o.id,o])).values()].sort((a,b)=>a.id.localeCompare(b.id));
 const grouped=new Map<string,Observation[]>();for(const o of records){const k=stratumKey(o),g=grouped.get(k)??[];g.push(o);grouped.set(k,g);}
 const strata=[...grouped].sort(([a],[b])=>a.localeCompare(b)).map(([key,rows])=>{
  const o=rows[0],dates=[...new Set(rows.map(r=>r.utcDate))].sort(),span=(Date.parse(dates.at(-1)!)-Date.parse(dates[0]))/86400000+1;
  return {key,region,datasetId:o.datasetId,source:o.source,sensor:o.sensor,platform:o.platform,product:o.provenance.product,version:o.provenance.version,processing:o.provenance.processing,confidenceScheme:o.confidence.scheme,count:rows.length,ids:rows.map(r=>r.id),firstDelivered:dates[0],lastDelivered:dates.at(-1)!,firstDeliveredYear:dates[0].slice(0,4),observedDates:dates.length,unobservedDatesWithinDetectionExtent:span-dates.length,missingFRP:rows.filter(r=>r.frp===null).length,missingExactUTC:rows.filter(r=>!r.acquiredAt||r.timestampPrecision!=='instant').length,invalidConfidence:rows.filter(r=>r.confidence.valid===false).length,operationalStart:null,opportunity:'unknown' as const};
 });
 const seasonal=new Map<string,{stratum:string;period:string;firstDelivered:string;lastDelivered:string;ids:string[];count:number;frpSum:number|null;frpReported:number;coverage:'unknown'}>();
 for(const o of records){const period=utcSeason(o.utcDate),stratum=stratumKey(o),k=JSON.stringify([stratum,period]),bucket=seasonal.get(k)??{stratum,period,firstDelivered:o.utcDate,lastDelivered:o.utcDate,ids:[],count:0,frpSum:null,frpReported:0,coverage:'unknown' as const};bucket.ids.push(o.id);bucket.firstDelivered=bucket.firstDelivered<o.utcDate?bucket.firstDelivered:o.utcDate;bucket.lastDelivered=bucket.lastDelivered>o.utcDate?bucket.lastDelivered:o.utcDate;bucket.count++;if(o.frp!==null){bucket.frpSum=(bucket.frpSum??0)+o.frp;bucket.frpReported++;}seasonal.set(k,bucket);}
 const overlaps=[];
 for(const m of strata.filter(s=>s.sensor==='MODIS'))for(const v of strata.filter(s=>s.sensor==='VIIRS')){
  if(m.processing!==v.processing||!['standard','nrt'].includes(m.processing))continue;
  const from=m.firstDelivered>v.firstDelivered?m.firstDelivered:v.firstDelivered,to=m.lastDelivered<v.lastDelivered?m.lastDelivered:v.lastDelivered;
  if(from>to){overlaps.push({modisStratum:m.key,viirsStratum:v.key,window:null,modisIds:[],viirsIds:[],coDetectedDates:[],status:'unavailable' as const});continue;}
  const selected=(k:string)=>(grouped.get(k)??[]).filter(o=>o.utcDate>=from&&o.utcDate<=to),a=selected(m.key),b=selected(v.key),dates=new Set(b.map(o=>o.utcDate));
  overlaps.push({modisStratum:m.key,viirsStratum:v.key,window:{from,to},modisIds:a.map(o=>o.id),viirsIds:b.map(o=>o.id),coDetectedDates:[...new Set(a.filter(o=>dates.has(o.utcDate)).map(o=>o.utcDate))].sort(),status:a.length&&b.length?'descriptive' as const:'unavailable' as const});
 }
 const fingerprint=fingerprintEligibility(records);
 const temporal=historicalSummary(records,region);
 const years=[...new Set(records.map(o=>o.utcDate.slice(0,4)))].sort();
 return {schema:SCIENTIFIC_METHOD,region,scopeIds:records.map(o=>o.id),inputCount:input.length,uniqueDelivered:records.length,exactDuplicatesRemoved:matching.duplicatesRemoved,fixturesExcluded:input.filter(o=>o.provenance.fixture).length,
  datasets:datasets.filter(d=>records.some(o=>o.datasetId===d.id)).sort((a,b)=>a.id.localeCompare(b.id)),strata,
  harmonizationStatus:{structuralIntegration:'implemented',method:'Source-stratified UTC calendar plus exploratory spatiotemporal associations; no count conversion',sensorIndependentSeries:'unavailable',calibrated:false,reason:'Unknown acquisition exposure and detection sensitivity prevent a validated sensor-neutral activity series',equivalentActivity:null},
  temporal,observedPeriodExploration:describeObservedPeriods(temporal,datasets),matchedCalendarMonths:years.slice(1).map((year,i)=>compareDeliveredMonths(temporal,years[i],year)),seasonal:[...seasonal].sort(([a],[b])=>a.localeCompare(b)).map(([,b])=>b),
  detectionExtentOverlap:{method:'Intersection of delivered detection date extents in the same region and processing stage; not verified acquisition overlap',comparisons:overlaps},
  association:{methodology:matching.methodology,indexDiagnostics:matching.indexDiagnostics,pairs:matching.pairs,groups:matching.groups.map(g=>({id:g.id,memberIds:g.memberIds,pairCount:g.pairCount,observationCount:g.observationCount,confirmedEvent:false})),participatingObservations:matching.uniqueObservationCount,unmatchedIds:matching.unmatchedIds,excludedIds:matching.excludedIds},
  sensitivity:sensitivitySeries(records),fingerprint:{eligible:fingerprint.eligible,reason:fingerprint.reason,spatial:fingerprint.eligible?thermalFingerprint(fingerprint.records):null},
  gates:{descriptive:records.length?'supported':'unavailable',coverage:'unknown',operationalAvailability:'not-established-from-deliveries',calibratedEquivalentCounts:null,historicalMedian:null,anomaly:null,confirmedFireEvents:null},
  methodology:{historicalReference:'The historicalMedian gate denotes an unavailable exposure-normalized baseline; conditional descriptive prior-month medians are separate in observedPeriodExploration',utc:'UTC day/month/year; meteorological DJF/MAM/JJA/SON seasons; December assigned to following DJF year',spatial:'Verified region membership and source-separated 2 km cylindrical equal-area cells on an authalic sphere; cells are not independent fire events',comparison:'Raw per-source/platform/version/processing contributions in matched detection-extent windows; no opportunity correction',normalization:'Unavailable: acquisition, valid-pixel/cloud masks and independent calibration are missing',introduction:'First delivered year is a delivery fact, never a satellite introduction or operational availability claim'},
  limitations:['Thermal detections and candidate groups are not confirmed fires.','Unknown acquisition coverage cannot establish zero activity or sensor misses.','Confidence schemes and sensor sensitivities are not interchangeable.','Processing-stage agreement is an eligibility screen, not proof of calibrated product equivalence.','NOAA-20/21 archive processing lineage and early-date documentation differences require supplier review.','Missing periods, FRP or opportunities are never replaced with zero.']};
}
export type ScientificHarmonization=ReturnType<typeof scientificHarmonization>;
export function scientificScopeStatus(availability:Availability){return ['error','unavailable','fixture'].includes(availability.state)?'unavailable':'descriptive-only';}
