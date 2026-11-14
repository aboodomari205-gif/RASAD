import {scientificHarmonization} from './scientificEngine.ts';
import type { Availability, Dataset, Observation } from './model.ts';
import { associateSensors, type MatchOptions } from './evidence.ts';
import { comparisonBrief, SENSITIVITY_SETTINGS } from './agreement.ts';

const edgeId=(m:string,v:string)=>JSON.stringify([m,v]);
export function matchingRobustness(records:readonly Observation[], settings:readonly MatchOptions[]=SENSITIVITY_SETTINGS) {
  if(settings.length<2 || settings.length>20)throw new RangeError('Compare 2–20 distinct threshold configurations');
  if(new Set(settings.map(s=>JSON.stringify([s.distanceKm,s.minutes]))).size!==settings.length)throw new RangeError('Duplicate threshold configuration');
  const sorted=[...records].sort((a,b)=>a.id.localeCompare(b.id));
  const runs=settings.map(options=>associateSensors(sorted,options));
  const edges=new Map<string,{id:string;modisId:string;viirsId:string;distanceKm:number;deltaMinutes:number;present:boolean[]}>();
  runs.forEach((run,index)=>run.pairs.forEach(p=>{
    const id=edgeId(p.modisId,p.viirsId),edge=edges.get(id)??{id,modisId:p.modisId,viirsId:p.viirsId,distanceKm:p.distanceKm,deltaMinutes:p.deltaMinutes,present:settings.map(()=>false)};
    edge.present[index]=true;edges.set(id,edge);
  }));
  const classified=[...edges.values()].sort((a,b)=>a.id.localeCompare(b.id)).map(e=>({...e,classification:e.present.every(Boolean)?'stable' as const:'threshold-sensitive' as const}));
  return {methodology:'firepulse.tested-edge-robustness/v1',meaning:'Stability only across the explicitly tested settings; not probability, calibration or validation.',
    configurations:settings.map((s,i)=>({...s,pairCount:runs[i].pairs.length,observationCount:runs[i].uniqueObservationCount,groupCount:runs[i].groupCount,
      added:i?classified.filter(e=>e.present[i]&&!e.present[i-1]).map(e=>e.id):[],removed:i?classified.filter(e=>!e.present[i]&&e.present[i-1]).map(e=>e.id):[]})),
    edges:classified,stable:classified.filter(e=>e.classification==='stable').length,sensitive:classified.filter(e=>e.classification==='threshold-sensitive').length,
    excludedIds:runs[0].excludedIds,unmatchedAcrossAll:sorted.filter(o=>!runs[0].excludedIds.includes(o.id)&&!classified.some(e=>e.modisId===o.id||e.viirsId===o.id)).map(o=>o.id).filter((id,i,a)=>a.indexOf(id)===i)};
}
export function sensorDifferences(records:readonly Observation[]) {
  // Canonical identity checks are shared with matching, never a second deduplication policy.
  associateSensors(records);
  const unique=[...new Map(records.map(o=>[o.id,o])).values()].sort((a,b)=>a.id.localeCompare(b.id));
  const groups=new Map<string,Observation[]>();
  for(const o of unique){const key=JSON.stringify([o.regionId,o.sensor,o.platform,o.datasetId,o.source,o.confidence.scheme,o.provenance.product,o.provenance.version,o.provenance.processing,o.provenance.fixture]);const rows=groups.get(key)??[];rows.push(o);groups.set(key,rows);}
  return [...groups].sort(([a],[b])=>a.localeCompare(b)).map(([key,rows])=>{
    const months=[...new Set(rows.map(o=>o.utcDate.slice(0,7)))].sort().map(month=>({month,count:rows.filter(o=>o.utcDate.startsWith(month)).length,ids:rows.filter(o=>o.utcDate.startsWith(month)).map(o=>o.id)}));
    return {key,sensor:rows[0].sensor,platform:rows[0].platform,datasetId:rows[0].datasetId,source:rows[0].source,confidenceScheme:rows[0].confidence.scheme,provenance:rows[0].provenance,count:rows.length,exactTimes:rows.filter(o=>o.timestampPrecision==='instant'&&o.acquiredAt&&Number.isFinite(Date.parse(o.acquiredAt))).length,months,observations:rows};
  });
}
export const RESEARCH_QUESTIONS=[
  {question:'Was the region actually observed on missing dates?',required:'Acquire platform-specific overpass, swath, cloud and quality masks with documented UTC coverage.',next:'Join verified coverage to the exact region and dates before interpreting absent detections.'},
  {question:'Do nearby detections represent the same physical event?',required:'Obtain independent event evidence, pixel footprints and geolocation uncertainty.',next:'Review candidate edges against independent evidence; retain unmatched and transitive cases.'},
  {question:'Can historical differences support a trend or anomaly?',required:'Obtain comparable multi-year sampling and an independently reviewed baseline methodology.',next:'Validate source-specific comparability before calculating normalized trends or anomalies.'},
];
export function researchBrief(records:readonly Observation[],datasets:readonly Dataset[],availability:Availability,thresholds:MatchOptions){
  const comparison=comparisonBrief(records,datasets,availability,thresholds);
  return {schema:'firepulse.research-brief/v1',harmonization:records.length?scientificHarmonization(records,datasets,records[0].regionId,thresholds):null,comparison,robustness:matchingRobustness(comparison.observations),sensorDifferences:sensorDifferences(comparison.observations),questions:RESEARCH_QUESTIONS,
    provenanceGaps:[...new Set(comparison.observations.map(o=>o.datasetId))].sort().flatMap(datasetId=>{const source=comparison.datasets.find(d=>d.id===datasetId);return !source?[{datasetId,missing:'datasetMetadata'}]:!source.checksum?[{datasetId,missing:'archiveChecksum'}]:[];}),
    specificationStatus:'Sensor specifications are external documentation facts, not measurements derived from these detections.',operationalUse:'Research verification only; no operational fire alerts or confirmed event claims.'};
}
