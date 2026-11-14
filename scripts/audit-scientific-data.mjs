import fs from 'node:fs';import {createHash} from 'node:crypto';import assert from 'node:assert/strict';
import {loadRegionCollection,loadAjlounGeometry} from '../server/dataCatalog.js';
import {normalizeCollection,pointInRegion} from '../shared/observations.ts';
import {scientificHarmonization} from '../shared/scientificEngine.ts';
const digest=value=>createHash('sha256').update(value).digest('hex');
const pointer=JSON.parse(fs.readFileSync('server/data/active-history.json','utf8'));
const db='server/data/'+pointer.filename,before=digest(fs.readFileSync(db));
const north=JSON.parse(fs.readFileSync('public/northern-jordan.geojson','utf8')).features[0].geometry;
const boundarySource=JSON.parse(fs.readFileSync('public/jordan-adm1.geojson','utf8'));
const report={schema:'firepulse.scientific-data-audit/v1',activation:pointer,coverage:'unknown',databaseSHA256:before,regions:{},sourceChecksums:{},boundaryChecksums:{ajloun:digest(JSON.stringify(loadAjlounGeometry())),north:digest(JSON.stringify(north))}};
for(const region of ['ajloun','northern-jordan']){
 const collection=loadRegionCollection(region),normalized=normalizeCollection(collection,{region}),records=normalized.observations;
 assert.equal(normalized.diagnostics.rejectedRecords,0);assert.equal(new Set(records.map(o=>o.id)).size,records.length);
 const geometry=region==='ajloun'?loadAjlounGeometry():north;assert.ok(records.every(o=>pointInRegion(o.longitude,o.latitude,geometry)));
 const science=scientificHarmonization(records,normalized.datasets,region);
 for(const length of [4,7,10])assert.equal(science.temporal.series.filter(s=>s.period.length===length).reduce((n,s)=>n+s.count,0),records.length);
 assert.equal(science.seasonal.reduce((n,s)=>n+s.count,0),records.length);
 const platforms=[...new Set(records.map(o=>o.platform))].sort();
 const possibleDuplicates=new Map();for(const o of records){const k=JSON.stringify([o.sensor,o.platform,o.provenance.processing,o.acquiredAt,o.longitude,o.latitude]);const ids=possibleDuplicates.get(k)??[];ids.push(o.id);possibleDuplicates.set(k,ids);}
 const histogram=key=>Object.fromEntries([...new Set(records.map(key))].sort().map(k=>[k,records.filter(o=>key(o)===k).length]));
 report.regions[region]={rawMetadata:{satellites:histogram(o=>String(o.platformRaw)),instruments:histogram(o=>String(o.sensorRaw)),confidence:histogram(o=>JSON.stringify([o.sensor,o.confidence.scheme,o.confidence.raw])),daynight:histogram(o=>String(o.feature.properties?.archiveRaw?.daynight??'missing')),type:histogram(o=>String(o.feature.properties?.archiveRaw?.type??'missing'))},uniqueDelivered:records.length,diagnostics:normalized.diagnostics,platforms,governorates:Object.fromEntries(boundarySource.features.filter(f=>['Ajloun','Irbid','Jerash','Mafraq'].includes(f.properties.shapeName)).map(f=>[f.properties.shapeName,records.filter(o=>pointInRegion(o.longitude,o.latitude,f.geometry)).length])),coordinateTimeRepeats:[...possibleDuplicates].filter(([,ids])=>ids.length>1).map(([signature,ids])=>({signature:JSON.parse(signature),ids,meaning:'Possible repeated observation; original measurements/IDs retained, not event deduplication'})),idsSHA256:digest(records.map(o=>o.id).sort().join('\n')),science};
 for(const d of normalized.datasets)for(const p of d.provenanceFiles??[]){const path='server/data/incoming/'+p.zip;const sha=digest(fs.readFileSync(path));assert.equal(sha,p.zipSHA256);report.sourceChecksums[p.zip]=sha;}
}
const signature=o=>JSON.stringify([o.source,o.provenance.product,o.provenance.processing,o.feature.properties.archiveRaw]);
const northKeys=new Set(normalizeCollection(loadRegionCollection('northern-jordan'),{region:'northern-jordan'}).observations.map(signature));
const ajlounRecords=normalizeCollection(loadRegionCollection('ajloun'),{region:'ajloun'}).observations;const subsetCount=ajlounRecords.filter(o=>northKeys.has(signature(o))).length;assert.equal(subsetCount,ajlounRecords.length);
report.subsetVerification={ajlounRowsPresentInNorth:subsetCount,meaning:'Ajloun is a subset; never add region totals'};
assert.equal(Object.values(report.regions['northern-jordan'].governorates).reduce((n,c)=>n+c,0),report.regions['northern-jordan'].uniqueDelivered);
assert.equal(digest(fs.readFileSync(db)),before);
fs.writeFileSync('docs/SCIENTIFIC_DATA_AUDIT.json',JSON.stringify(report,null,2));
console.log(JSON.stringify(Object.fromEntries(Object.entries(report.regions).map(([region,r])=>[region,{count:r.uniqueDelivered,platforms:r.platforms,baselinePairs:r.science.association.pairs.length,participating:r.science.association.participatingObservations,groups:r.science.association.groups.length,sensitivity:r.science.sensitivity}]))));
