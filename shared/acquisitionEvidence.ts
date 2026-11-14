import type {Observation} from './model.ts';
import {validUTCDate} from './observations.ts';
const utcInstant=(value:string)=>/^\d{4}-\d{2}-\d{2}T(?:[01]\d|2[0-3]):[0-5]\d:[0-5]\d(?:\.\d{1,3})?Z$/.test(value)&&validUTCDate(value.slice(0,10));
export type CatalogGranule={id:string;title:string;start:string;end:string};
export type CatalogProduct={shortName:'MYD14'|'VNP14IMG';version:string;platform:string;sha256:string;granules:CatalogGranule[]};
/** Catalog-time corroboration only: does NOT establish footprint intersection,
 * valid-pixel opportunity, identical reprocessing lineage or a matched event. */
export function catalogAcquisitionAudit(records:readonly Observation[],products:readonly CatalogProduct[]){
 const ids=new Set<string>();for(const p of products){if(!['MYD14','VNP14IMG'].includes(p.shortName)||p.platform!==(p.shortName==='MYD14'?'Aqua':'S-NPP')||p.version!==(p.shortName==='MYD14'?'061':'002')||!/^[a-f0-9]{64}$/.test(p.sha256))throw new RangeError('Unsupported catalog source identity');
  for(const g of p.granules){if(ids.has(g.id))throw new RangeError('Duplicate catalog granule');ids.add(g.id);if(!g.id||!g.title.startsWith(p.shortName+'.')||!utcInstant(g.start)||!utcInstant(g.end)||Date.parse(g.end)<=Date.parse(g.start))throw new RangeError('Invalid catalog UTC interval');}}
 const seen=new Map<string,Observation>();for(const o of records){if(seen.has(o.id)&&JSON.stringify(seen.get(o.id))!==JSON.stringify(o))throw new RangeError('Conflicting observation identity');seen.set(o.id,o);}
 return {schema:'firepulse.catalog-acquisition-audit/v1',coverage:null,validPixelOpportunity:null,sensitivityCalibration:null,anomaly:null,
  meaning:'Temporal catalog candidates only; no granule-level lineage, polygon intersection, pixel validity or detection efficiency is established.',
  sources:products.map(p=>({shortName:p.shortName,version:p.version,platform:p.platform,metadataSHA256:p.sha256})),
  observations:[...seen.values()].sort((a,b)=>a.id.localeCompare(b.id)).map(o=>{const candidates=products.filter(p=>p.platform===o.platform&&o.sensor===(p.shortName==='MYD14'?'MODIS':'VIIRS')&&o.provenance.processing==='standard'&&!o.provenance.fixture);
   const exact=o.timestampPrecision==='instant'&&o.acquiredAt!==null&&utcInstant(o.acquiredAt);
   return {id:o.id,platform:o.platform,datasetId:o.datasetId,acquiredAt:o.acquiredAt,candidateGranuleIds:exact?candidates.flatMap(p=>p.granules.filter(g=>Date.parse(o.acquiredAt!)>=Date.parse(g.start)&&Date.parse(o.acquiredAt!)<Date.parse(g.end)).map(g=>g.id)).sort():[],status:!exact?'missing-exact-utc':!candidates.length?'unsupported-source-stratum':'catalog-interval-check',lineageVerified:false};})};
}
