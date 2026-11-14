import { IngestionError } from './firmsArchive.js';
import { requireVerifiedExportSemantics } from './productVerification.js';

// Archive profiles are explicit opt-ins. Generic/local fixture ingestion remains compatible.
export const ARCHIVE_PROFILES = Object.freeze({
  'modis-firms-export': { sensor: 'MODIS', product: 'MCD14ML', versions: ['6.1'], rawVersions: ['6.03', '61.03'], platforms: ['Aqua', 'Terra'], fields: ['brightness', 'bright_t31'], nominalResolutionM: 1000 },
  'viirs-snpp-firms-export': { sensor: 'VIIRS', product: 'VNP14IMGTML', versions: ['2'], rawVersions: ['2'], platforms: ['SNPP'], fields: ['brightness', 'bright_t31'], nominalResolutionM: 375 },
  'modis-c61': { sensor: 'MODIS', product: 'MCD14ML', versions: ['6.1'], platforms: ['A', 'T', 'Aqua', 'Terra'], fields: ['brightness', 'bright_t31'], nominalResolutionM: 1000 },
  'viirs-snpp': { sensor: 'VIIRS', product: 'VNP14IMGML', versions: ['1.0', '2.0'], platforms: ['N', 'S-NPP', 'Suomi NPP'], fields: ['bright_ti4', 'bright_ti5'], nominalResolutionM: 375 },
});
export function deliveryProfile(dataset){
 const config=dataset.deliveryProfile;if(!config)return null;
 const families={MODIS:{sensor:'MODIS',platforms:['Terra','Aqua'],fields:['brightness','bright_t31'],versions:dataset.processing==='nrt'?['6.1NRT']:['6.03','61.03']},SNPP:{sensor:'VIIRS',platforms:['SNPP'],fields:['brightness','bright_t31'],versions:dataset.processing==='nrt'?['2.0NRT']:['2']},N20:{sensor:'VIIRS',platforms:['N20'],fields:['brightness','bright_t31'],versions:dataset.processing==='nrt'?['2.0NRT']:['2']},N21:{sensor:'VIIRS',platforms:['N21'],fields:['brightness','bright_t31'],versions:dataset.processing==='nrt'?['2.0NRT']:['2']}};
 const profile=families[config];if(!profile||dataset.sensor!==profile.sensor||!['standard','nrt'].includes(dataset.processing)||dataset.source!=='NASA FIRMS'||dataset.kind!=='archive')throw new IngestionError('ARCHIVE_PROFILE','Explicit supported delivery provenance required');return {...profile,rawVersions:profile.versions};
}
export function validateProfile(dataset, headers) {
  const explicit=deliveryProfile(dataset);if(explicit){const required=['latitude','longitude','acq_date','acq_time','satellite','instrument','confidence','version','frp','scan','track','daynight',...explicit.fields];if(required.some(k=>!headers.includes(k)))throw new IngestionError('CSV_SCHEMA','Incomplete explicit delivery schema');return explicit;}
  requireVerifiedExportSemantics(dataset, headers);
  const profile = ARCHIVE_PROFILES[dataset.archiveProfile];
  if (!profile || dataset.kind !== 'archive' || dataset.processing !== 'standard' || dataset.sensor !== profile.sensor || !profile.versions.includes(dataset.version) || !dataset.product || (profile.rawVersions && dataset.product !== profile.product)) throw new IngestionError('ARCHIVE_PROFILE', 'Select a supported archive profile, sensor, standard collection version and actual source product.');
  const required = ['latitude', 'longitude', 'acq_date', 'acq_time', 'satellite', 'confidence', 'version', 'frp', 'scan', 'track', 'daynight', ...profile.fields];
  if (required.some(field => !headers.includes(field))) throw new IngestionError('CSV_SCHEMA', 'Archive profile requires the documented FIRMS columns, including acquisition and provenance metadata.');
  return profile;
}
export function profileRowIssue(record, profile) {
  if (profile.rawVersions && !profile.rawVersions.includes(record.version)) return ['COLLECTION_VERSION', 'version', 'Raw version is outside this explicitly supported export profile.'];
  if (!profile.platforms.includes(record.satellite)) return ['PLATFORM', 'satellite', 'Satellite does not belong to the selected archive profile.'];
  if (!['D', 'N'].includes(record.daynight)) return ['DAYNIGHT', 'daynight', 'Expected documented D or N acquisition flag.'];
  for (const field of ['scan', 'track', ...profile.fields]) if (!/^(?:\d+(?:\.\d*)?|\.\d+)$/.test(record[field]) || !Number.isFinite(Number(record[field])) || Number(record[field]) <= 0) return ['NUMERIC_VALUE', field, 'Expected a finite positive pixel dimension or brightness temperature.'];
  const validConfidence = profile.sensor === 'VIIRS' ? /^[lnh]$/.test(record.confidence) : /^\d+(?:\.\d+)?$/.test(record.confidence) && Number(record.confidence) <= 100;
  if (!validConfidence) return ['CONFIDENCE', 'confidence', 'Confidence is outside the selected sensor archive schema.'];
  return null;
}
export function canonicalPlatform(raw) { return ({ A: 'Aqua', T: 'Terra', N: 'S-NPP', SNPP: 'S-NPP', N20:'NOAA-20', N21:'NOAA-21', 'Suomi NPP': 'S-NPP' })[raw] ?? raw; }
