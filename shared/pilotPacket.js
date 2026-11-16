// Lossless expansion of the bounded original-row pilot packet. No locations are inferred.
export function decodePilotPacket(packet){
 if(packet.schema!=='rasad.static-pilot/v1')return packet;
 const {metadata,deliveries,observations,generation,model,prototype}=packet;
 if(observations.length!==metadata.totalDelivered)throw Error('Pilot count mismatch');
 const rows=[],features=[];
 for(const [id,lon,lat,timestamp,datasetIndex,deliveryIndex,confidence,frp,daynight,line,sourceVersion] of observations){
  const dataset=metadata.datasets[datasetIndex],delivery=deliveries[deliveryIndex];
  if(!dataset||!delivery||lon< -57||lon> -55||lat< -14||lat> -12||!timestamp.startsWith('2024-08-'))throw Error('Invalid authentic pilot scope');
  rows.push({id,lon,lat,timestamp,raw:{confidence,daynight},frp,dataset,delivery});
  features.push({type:'Feature',id,geometry:{type:'Point',coordinates:[lon,lat]},properties:{datasetId:dataset.id,source:'NASA FIRMS',instrument:dataset.sensor,satellite:dataset.platform,product:dataset.product,processing:dataset.processing,version:dataset.version,source_version:sourceVersion,collectionVersion:dataset.version,date:timestamp.slice(0,10),time:timestamp.slice(11,16).replace(':',''),acquiredAt:timestamp,timestamp_utc:timestamp,confidence,frp,daynight,latitude:lat,longitude:lon,country:'bra',source_file:delivery.source_file,source_member:delivery.member,source_sha256:delivery.sha256,source_line:line,import_generation:generation,confidence_scheme:dataset.sensor==='MODIS'?'modis-percent':'viirs-categorical',frp_units:'MW',quality_flags:['observation-opportunity-unknown',...(dataset.fieldSemantics?.historicalReference==='blocked-lineage'?['processing-lineage-unverified']:[])]}});
 }
 return {generation,metadata,rows,features,model,prototype};
}
