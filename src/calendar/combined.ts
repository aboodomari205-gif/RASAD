import { normalizeCollection, filterObservations, validUTCDate } from '../../shared/observations.ts';
import type { ObservationCollection, ObservationFilter } from '../../shared/model.ts';
/** Observation-level rows avoid conflating raw counts across source strata. */
export function calendarExportRecords(collection:ObservationCollection,filter:ObservationFilter,month:string){
 if(!/^\d{4}-(0[1-9]|1[0-2])$/.test(month)||!validUTCDate(month+'-01'))throw new RangeError('Invalid UTC export month');
 const normalized=normalizeCollection(collection,{region:filter.region??'ajloun'});
 const records=filterObservations(normalized.observations,filter).filter(o=>o.utcDate.startsWith(month)).sort((a,b)=>a.id.localeCompare(b.id));
 return {normalized,records};
}
export function calendarCSV(collection:ObservationCollection,filter:ObservationFilter,month:string){
 const {normalized,records}=calendarExportRecords(collection,filter,month);
 const quote=(value:unknown)=>'"'+(typeof value==='string'?value.replace(/^[=+@-]/,"'$&"):String(value??'')).replaceAll('"','""')+'"';
 const header=['utc_date','sensor','platform','dataset_id','product','product_version','processing','availability_state','source','observation_id','acquired_at_utc','timestamp_precision','confidence_raw','confidence_scheme','frp_mw','frp_reported','reported_count','frp_complete','record_status','coverage_status','fixture','scope_json','latitude','longitude','sensor_raw','platform_raw','acquisition_date_raw','acquisition_time_raw','daynight_raw','activation_revision'];
 return [header,...records.map(o=>[o.utcDate,o.sensor,o.platform,o.datasetId,o.provenance.product,o.provenance.version,o.provenance.processing,normalized.availability.state,o.source,o.id,o.acquiredAt,o.timestampPrecision,o.confidence.raw,o.confidence.scheme,o.frp,o.frp===null?'missing':'reported',1,o.frp!==null,'observed','unknown',o.provenance.fixture,JSON.stringify({month,...filter}),o.latitude,o.longitude,o.sensorRaw,o.platformRaw,o.feature.properties?.archiveRaw?.acq_date??null,o.feature.properties?.archiveRaw?.acq_time??null,o.feature.properties?.archiveRaw?.daynight??o.feature.properties?.daynight??null,collection.metadata?.activationRevision??null])].map(row=>row.map(quote).join(',')).join('\r\n');
}


