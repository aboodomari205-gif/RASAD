import type { Availability, Observation } from './model.ts';
import { validUTCDate } from './observations.ts';
export type MatchOptions = { distanceKm: number; minutes: number };
export const DEFAULT_MATCH: MatchOptions = { distanceKm: 1, minutes: 60 };
export function distanceKm(a: Observation, b: Observation) {
  const rad = Math.PI / 180;
  const h = Math.sin((b.latitude-a.latitude)*rad/2)**2 + Math.cos(a.latitude*rad)*Math.cos(b.latitude*rad)*Math.sin((b.longitude-a.longitude)*rad/2)**2;
  return 6371.0088 * 2 * Math.asin(Math.sqrt(Math.min(1,h)));
}
function unique(records: readonly Observation[]) {
  const ids = new Map<string, Observation>(); let duplicates = 0;
  for (const o of records) {
    if (ids.has(o.id)) { if (JSON.stringify(ids.get(o.id)) !== JSON.stringify(o)) throw new RangeError('Conflicting observation identity'); duplicates++; }
    else ids.set(o.id,o);
  }
  return { records: [...ids.values()], duplicates };
}
export type CandidatePair = { modisId: string; viirsId: string; distanceKm: number; deltaMinutes: number; status: 'candidate'; region: string };
/** Connected components of a bipartite candidate graph, not independent events.
 * A path is transitive; its endpoint observations need not meet matching thresholds.
 */
export function associationGroups(pairs: readonly CandidatePair[], observations: readonly Observation[]) {
  const records = new Map(unique(observations).records.map(o => [o.id, o]));
  const parent = new Map<string, string>();
  function find(id: string): string {
    if (!parent.has(id)) parent.set(id, id);
    let root = id;
    while (parent.get(root) !== root) root = parent.get(root)!;
    while (parent.get(id) !== id) { const next = parent.get(id)!; parent.set(id, root); id = next; }
    return root;
  }
  const seen = new Set<string>();
  const edges = pairs.filter(p => {
    if (!records.has(p.modisId) || !records.has(p.viirsId)) throw new RangeError('Association source is missing');
    const key = JSON.stringify([p.modisId, p.viirsId]);
    if (seen.has(key)) return false;
    seen.add(key);
    const a = find(p.modisId), b = find(p.viirsId);
    if (a !== b) parent.set(a < b ? b : a, a < b ? a : b);
    return true;
  });
  const grouped = new Map<string, CandidatePair[]>();
  for (const edge of edges) { const root = find(edge.modisId); const group = grouped.get(root) ?? []; group.push(edge); grouped.set(root, group); }
  return [...grouped].sort(([a],[b]) => a.localeCompare(b)).map(([id, groupEdges]) => {
    const memberIds = [...new Set(groupEdges.flatMap(p => [p.modisId, p.viirsId]))].sort();
    const members = memberIds.map(member => records.get(member)!);
    return { id, memberIds, members, pairs: groupEdges, pairCount: groupEdges.length, observationCount: members.length,
      sensorCounts: { MODIS: members.filter(o => o.sensor === 'MODIS').length, VIIRS: members.filter(o => o.sensor === 'VIIRS').length },
      maxEdgeDistanceKm: Math.max(...groupEdges.map(p => p.distanceKm)), maxEdgeMinutes: Math.max(...groupEdges.map(p => p.deltaMinutes)),
      confirmedEvent: false as const };
  });
}
/** Exploratory many-to-many proximity associations, never event deduplication or calibrated matching. */
export function associateSensors(input: readonly Observation[], options: MatchOptions = DEFAULT_MATCH) {
  if (!Number.isFinite(options.distanceKm) || options.distanceKm <= 0 || options.distanceKm > 10 || !Number.isFinite(options.minutes) || options.minutes < 0 || options.minutes > 1440) throw new RangeError('Matching bounds: (0,10] km and [0,1440] minutes');
  const {records, duplicates} = unique(input);
  const eligible = records.filter(o => !o.provenance.fixture && ['standard','nrt'].includes(o.provenance.processing) && Number.isFinite(o.latitude) && Math.abs(o.latitude)<=90 && Number.isFinite(o.longitude) && Math.abs(o.longitude)<=180 && o.timestampPrecision === 'instant' && o.acquiredAt && Number.isFinite(Date.parse(o.acquiredAt)) && ['MODIS','VIIRS'].includes(o.sensor));
  const ordered=(sensor:string)=>eligible.filter(o=>o.sensor===sensor).sort((a,b)=>Date.parse(a.acquiredAt!)-Date.parse(b.acquiredAt!)||a.id.localeCompare(b.id));
  const viirs=ordered('VIIRS'),modis=ordered('MODIS');
  const windowMs=options.minutes*60000;
  // Unit-sphere Cartesian cells avoid longitude discontinuities and polar singularities.
  // If great-circle distance <= r, each Cartesian coordinate differs by <= chord(r).
  const cellSize=2*Math.sin(options.distanceKm/(2*6371.0088))*(1+1e-12);
  const cell=(o:Observation)=>{const lat=o.latitude*Math.PI/180,lon=o.longitude*Math.PI/180;return [Math.floor(Math.cos(lat)*Math.cos(lon)/cellSize),Math.floor(Math.cos(lat)*Math.sin(lon)/cellSize),Math.floor(Math.sin(lat)/cellSize)];};
  const key=(o:Observation,t:number,x:number,y:number,z:number)=>JSON.stringify([o.regionId,o.provenance.processing,t,x,y,z]);
  const bins=new Map<string,Observation[]>();
  for(const v of viirs){const [x,y,z]=cell(v),ms=Date.parse(v.acquiredAt!),t=windowMs?Math.floor(ms/windowMs):ms,k=key(v,t,x,y,z);const group=bins.get(k)??[];group.push(v);bins.set(k,group);}
  const pairs:CandidatePair[]=[];let comparisons=0;
  for(const m of modis){
    const time=Date.parse(m.acquiredAt!),t=windowMs?Math.floor(time/windowMs):time,[x,y,z]=cell(m),candidates:Observation[]=[];
    for(const dt of windowMs?[-1,0,1]:[0])for(const dx of [-1,0,1])for(const dy of [-1,0,1])for(const dz of [-1,0,1])candidates.push(...(bins.get(key(m,t+dt,x+dx,y+dy,z+dz))??[]));
    candidates.sort((a,b)=>Date.parse(a.acquiredAt!)-Date.parse(b.acquiredAt!)||a.id.localeCompare(b.id));
    for(const v of candidates){
      const delta=Math.abs(time-Date.parse(v.acquiredAt!));if(delta>windowMs)continue;
      if(++comparisons>2_000_000)throw new RangeError('Narrow the date window before matching this collection');
      const km=distanceKm(m,v);if(km>options.distanceKm)continue;
      if(pairs.length>=10000)throw new RangeError('Too many candidate associations; narrow the matching scope');
      pairs.push({modisId:m.id,viirsId:v.id,distanceKm:km,deltaMinutes:delta/60000,status:'candidate',region:m.regionId});
    }
  }
  const eligibleIds = new Set(eligible.map(o=>o.id));
  const matched = new Set(pairs.flatMap(p=>[p.modisId,p.viirsId]));
  const groups = associationGroups(pairs, records);
  return {methodology:{id:'firepulse.proximity-association/v1',...options,distance:'Haversine great-circle distance, mean Earth radius 6371.0088 km',time:'Absolute UTC acquisition difference; inclusive thresholds',selection:'All qualifying pairs; many-to-many; same region and known processing stage',index:'Unit-sphere Cartesian spatial hash plus UTC time buckets; exact Haversine and UTC final predicates',grouping:'Connected components of candidate edges; transitive links are not event confirmation',validated:false,eventCount:null},pairs,groups,indexDiagnostics:{exactDistanceEvaluations:comparisons,indexBuckets:bins.size},uniqueObservationCount:matched.size,groupCount:groups.length,duplicatesRemoved:duplicates,excludedIds:records.filter(o=>!eligibleIds.has(o.id)).map(o=>o.id),unmatchedIds:eligible.filter(o=>!matched.has(o.id)).map(o=>o.id)};
}
export type EvidencePeriod = { from: string; to: string };
const groupKey = (o: Observation) => JSON.stringify([o.datasetId,o.sensor,o.platform,o.source,o.provenance.product,o.provenance.processing,o.provenance.version]);
export function comparePeriods(input: readonly Observation[], a: EvidencePeriod, b: EvidencePeriod) {
  for(const period of [a,b]) if(!validUTCDate(period.from)||!validUTCDate(period.to)||period.from>period.to) throw new RangeError('Select valid ordered UTC comparison periods');
  const records=unique(input).records.filter(o=>!o.provenance.fixture);
  const groups=new Map<string,Observation[]>();
  for(const o of records){const key=groupKey(o);const group=groups.get(key)??[];group.push(o);groups.set(key,group);}
  const bucket=(observations:Observation[],period:EvidencePeriod)=>{const rows=observations.filter(o=>o.utcDate>=period.from&&o.utcDate<=period.to);const frp=rows.filter(o=>o.frp!==null);return {period,status:rows.length?'observed' as const:'unavailable' as const,count:rows.length||null,frpSum:frp.length?frp.reduce((sum,o)=>sum+o.frp!,0):null,frpReported:frp.length,ids:rows.map(o=>o.id),coverage:'unknown' as const};};
  return {methodology:'firepulse.descriptive-period-comparison/v1',overlapping:a.from<=b.to&&b.from<=a.to,groups:[...groups].map(([key,rows])=>({key,sensor:rows[0].sensor,platform:rows[0].platform,datasetId:rows[0].datasetId,version:rows[0].provenance.version,a:bucket(rows,a),b:bucket(rows,b)})),normalizedDifference:null,anomaly:null};
}
export function thermalFingerprint(input:readonly Observation[]) {
  const records=unique(input).records.filter(o=>!o.provenance.fixture);
  const cells=new Map<string,{key:string;sensor:string;datasetId:string;west:number;south:number;ids:string[];dates:string[]}>();
  for(const o of records){const west=Math.floor(o.longitude/0.02)*0.02,south=Math.floor(o.latitude/0.02)*0.02;const key=groupKey(o)+':'+west+':'+south;const cell=cells.get(key)??{key,sensor:o.sensor,datasetId:o.datasetId,west,south,ids:[],dates:[]};cell.ids.push(o.id);if(!cell.dates.includes(o.utcDate))cell.dates.push(o.utcDate);cells.set(key,cell);}
  return {methodology:'firepulse.descriptive-spatial-bins/v1',cellSizeDegrees:0.02,meaning:'Fixed longitude/latitude bins, not fire perimeters, geolocation accuracy or equal-area density',cells:[...cells.values()].sort((a,b)=>b.ids.length-a.ids.length),years:[...new Set(records.map(o=>o.utcDate.slice(0,4)))].sort()};
}
export function evidenceVerdicts(records: readonly Observation[], availability: Availability, pairs: readonly {modisId:string;viirsId:string}[]) {
  return [
    {status:availability.state==='error'||availability.state==='unavailable'?'unavailable':records.some(o=>!o.provenance.fixture)?'supported':'insufficient',claim:'Delivered thermal detections',ids:records.filter(o=>!o.provenance.fixture).map(o=>o.id)},
    {status:pairs.length?'provisional':'insufficient',claim:'Cross-sensor correspondence',ids:[...new Set(pairs.flatMap(p=>[p.modisId,p.viirsId]))]},
    {status:'insufficient',claim:'Complete acquisition coverage',ids:[] as string[]},
    {status:'unavailable',claim:'Confirmed fire events or calibrated anomaly scores',ids:[] as string[]},
  ];
}
