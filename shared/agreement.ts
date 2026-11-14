import type { Availability, Dataset, Observation } from './model.ts';
import { associateSensors, DEFAULT_MATCH, type MatchOptions } from './evidence.ts';

export const SENSITIVITY_SETTINGS: readonly MatchOptions[] = [
  {distanceKm:.25,minutes:6},{distanceKm:.5,minutes:7},{distanceKm:1,minutes:7},
  DEFAULT_MATCH,{distanceKm:2,minutes:120},
];
export function sensitivitySeries(records: readonly Observation[], settings = SENSITIVITY_SETTINGS) {
  return settings.map(options => {
    const result=associateSensors(records,options);
    return {...options,pairs:result.pairs.length,observations:result.uniqueObservationCount,groups:result.groupCount};
  });
}
export function coverageGate(records: readonly Observation[], availability: Availability) {
  // Reuse canonical identity validation and fixture/time exclusions from the matcher.
  const matching=associateSensors(records);
  const real=[...new Map(records.filter(o=>!o.provenance.fixture).map(o=>[o.id,o])).values()];
  const accessible=!['error','unavailable','fixture'].includes(availability.state) && !availability.fixture;
  const eligible=real.filter(o=>!matching.excludedIds.includes(o.id));
  const comparable=new Map<string,Set<string>>();
  for(const o of real) {
    const key=JSON.stringify([o.regionId,o.sensor,o.platform,o.datasetId,o.source,o.provenance]);
    const years=comparable.get(key)??new Set<string>();years.add(o.utcDate.slice(0,4));comparable.set(key,years);
  }
  const viirsStrata=new Set(eligible.filter(o=>o.sensor==='VIIRS').map(o=>JSON.stringify([o.regionId,o.provenance.processing])));
  const both=eligible.some(o=>o.sensor==='MODIS'&&viirsStrata.has(JSON.stringify([o.regionId,o.provenance.processing])));
  return [
    {id:'description',claim:'Descriptive summaries',status:accessible&&real.length?(availability.quality==='partial'||availability.state==='partial'?'provisional':'supported'):'unavailable',reason:'Only delivered observations; raw sensor counts remain separate.'},
    {id:'association',claim:'Cross-sensor associations',status:accessible&&both?'provisional':'unavailable',reason:'Exact UTC and compatible source processing required. Proximity is not event confirmation.'},
    {id:'history',claim:'Historical comparisons',status:accessible&&[...comparable.values()].some(years=>years.size>=2)?'provisional':'unavailable',reason:'Source-separated observed years only; unknown sampling prevents normalized trends.'},
    {id:'zero',claim:'Verified zero activity',status:'unavailable',reason:'No scoped acquisition-coverage proof is supplied to this analysis.'},
    {id:'anomaly',claim:'Validated anomaly claims',status:'unavailable',reason:'No independently validated baseline or calibration is available.'},
  ];
}
export function comparisonBrief(records: readonly Observation[], datasets: readonly Dataset[], availability: Availability, thresholds: MatchOptions) {
  const sorted=[...records].sort((a,b)=>a.id.localeCompare(b.id));
  const matching=associateSensors(sorted,thresholds);
  const observations=[...new Map(sorted.map(o=>[o.id,o])).values()];
  return {schema:'firepulse.scientific-comparison/v1',thresholds:{...thresholds},exploratoryBaseline:DEFAULT_MATCH,
    methodology:matching.methodology,availability,gate:coverageGate(observations,availability),
    datasets:datasets.filter(d=>observations.some(o=>o.datasetId===d.id)).sort((a,b)=>a.id.localeCompare(b.id)),
    observations,matching,sensitivity:sensitivitySeries(observations),
    limitations:['Candidate pairs and connected groups are not confirmed fires or independent events.',
      'Thresholds are exploratory, not calibrated. Transitive endpoints may exceed direct matching bounds.',
      'Unmatched observations do not prove sensor failure. Unknown coverage cannot establish zero activity.',
      'Raw sensor counts and confidence scales are not equivalent. No validated anomaly is calculated.']};
}
