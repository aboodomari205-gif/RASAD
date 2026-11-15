import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {pointInRegion} from '../shared/observations.ts';
const boundaries=JSON.parse(fs.readFileSync(fileURLToPath(new URL('../public/south-america-countries.geojson',import.meta.url)),'utf8'));
const brazil=boundaries.features.find(feature=>feature.properties?.id==='bra')?.geometry;
if(!brazil)throw Error('Brazil boundary unavailable for environmental input validation');
export const PRODUCTS={
 'MOD13Q1.061':{ndvi:[-0.2,1,'1'],evi:[-0.2,1,'1']},
 'MCD12Q1.061':{land_cover:[1,17,'IGBP']},
 'NASADEM_HGT.001':{elevation:[-500,9000,'m']},
 'ERA5-Land':{temperature:[180,340,'K'],dewpoint:[150,340,'K'],wind_u:[-150,150,'m/s'],wind_v:[-150,150,'m/s']},
 'CHIRPS-2.0':{precipitation:[0,2000,'mm/day']},
};
export function validateEnvironment(input){
 if(!input||input.schema!=='rasad.environment-input/v1'||!Array.isArray(input.indicators)||input.indicators.length>10000)throw Error('Expected rasad.environment-input/v1 and at most 10000 indicators');
 return input.indicators.map(r=>{
  const rule=PRODUCTS[r.product]?.[r.variable];
  if(!rule||r.units!==rule[2])throw Error('Unsupported product / variable / units');
  if(r.value!==null&&(!Number.isFinite(r.value)||r.value<rule[0]||r.value>rule[1]||r.variable==='land_cover'&&!Number.isInteger(r.value)))throw Error('Invalid physical value; preserve missing as null');
  if(!Array.isArray(r.coordinates)||r.coordinates.length!==2||!r.coordinates.every(Number.isFinite)||r.coordinates[0]<-180||r.coordinates[0]>180||r.coordinates[1]<-90||r.coordinates[1]>90||r.crs!=='EPSG:4326'||!pointInRegion(r.coordinates[0],r.coordinates[1],brazil))throw Error('Expected WGS84 point coordinates inside Brazil');
  if(!/^https:\/\//.test(r.sourceURL??'')||!r.sourceFile||!/^\w[\w ./-]*$/.test(r.sourceFile)||!r.method||!r.nativeResolution||!r.qa||!['accepted','missing','rejected'].includes(r.qa.status)||!r.qa.description)throw Error('Missing provenance, native resolution, extraction method or QA');
  if(r.qa.status!=='accepted'&&r.value!==null)throw Error('Rejected/missing QA must have null value');
  if(!r.startUTC||!r.endUTC||!Number.isFinite(Date.parse(r.startUTC))||!Number.isFinite(Date.parse(r.endUTC))||Date.parse(r.startUTC)>Date.parse(r.endUTC)||!r.startUTC.endsWith('Z')||!r.endUTC.endsWith('Z'))throw Error('Invalid UTC validity interval');
  if(r.scaleApplied!==true)throw Error('Explicitly acknowledge product scale/fill/QA applied before ingestion');
  return {...r,kind:r.product==='ERA5-Land'?'reanalysis':'observed-derived'};
 });
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const filename=process.argv[2];if(!filename)throw Error('Usage: node scripts/import-environment.mjs <extracted-input.json>');
 const raw=fs.readFileSync(filename),indicators=validateEnvironment(JSON.parse(raw));
 const root=fileURLToPath(new URL('../',import.meta.url));
 for(const row of indicators){const source=path.resolve(root,row.sourceFile);if(!source.startsWith(root+path.sep)||!fs.statSync(source).isFile())throw Error('Source file must exist inside the repository');row.sourceSHA256=createHash('sha256').update(fs.readFileSync(source)).digest('hex');}
 const dir=path.join(root,'data/processed');fs.mkdirSync(dir,{recursive:true});const dest=path.join(dir,'environment.json');
 if(fs.existsSync(dest))throw Error('Non-destructive import refuses to overwrite environment.json; archive the previous manifest first');
 fs.writeFileSync(dest,JSON.stringify({schema:'rasad.environment/v1',importedAt:new Date().toISOString(),inputSHA256:createHash('sha256').update(raw).digest('hex'),indicators,limitations:['Extraction QA is supplier-declared, not independent validation. Point values are not AOI averages. No environmental concern probability is calibrated.']},null,2),{flag:'wx'});
 console.log('Imported',indicators.length,'provenance-bearing indicators; original files unchanged');
}
