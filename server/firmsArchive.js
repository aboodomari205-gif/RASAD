import { parse } from 'csv-parse/sync';
import { acquisitionUTC, digest, normalizeCollection, pointInRegion, sensorOf, validDataset } from '../shared/observations.ts';
import { validateProfile, profileRowIssue, canonicalPlatform } from './archiveProfiles.js';
import { requireVerifiedExportSemantics } from './productVerification.js';

export class IngestionError extends Error {
  constructor(code, message) { super(message); this.code = code; }
}
/** No network, credentials, file writes or implicit region/sensor inference. */
export function ingestFirmsCSV(csv, { dataset, boundary, deduplicate = true, inferMetadata = true, rowNumbers } = {}) {
  if (!validDataset(dataset)) throw new IngestionError('DATASET_METADATA', 'Explicit dataset ID, source and region are required.');
  if (dataset.regionId === 'ajloun' && dataset.kind === 'fixture') throw new IngestionError('FIXTURE_ISOLATION', 'Development fixtures cannot enter the Ajloun pilot.');
  if (dataset.kind === 'archive' && (!dataset.sensor || !dataset.product || !dataset.version || !['standard', 'nrt'].includes(dataset.processing))) throw new IngestionError('ARCHIVE_PROVENANCE', 'Archive ingestion requires sensor, product, collection version and processing stage.');
  if (dataset.kind === 'archive' && !boundary) throw new IngestionError('REGION_BOUNDARY_REQUIRED', 'Archive ingestion requires the selected region polygon.');
  const checksum = digest(csv);
  if (dataset.checksum && dataset.checksum !== checksum) throw new IngestionError('CHECKSUM_MISMATCH', 'Archive bytes do not match the pinned dataset checksum.');
  let rows;
  try { rows = parse(csv, { columns: false, skip_empty_lines: true, bom: true, trim: true, relax_column_count: true, info: true }); }
  catch { throw new IngestionError('CSV_SYNTAX', 'CSV syntax could not be parsed safely. No records were imported.'); }
  if (!rows.length) throw new IngestionError('CSV_SCHEMA', 'CSV header is missing.');
  const headers = rows[0].record.map(field => field.toLowerCase().trim());
  const required = ['latitude', 'longitude', 'acq_date', 'acq_time', ...(dataset.sensor ? [] : ['instrument'])];
  if (new Set(headers).size !== headers.length || required.some(field => !headers.includes(field))) throw new IngestionError('CSV_SCHEMA', 'Missing required or duplicate FIRMS CSV headers.');
  requireVerifiedExportSemantics(dataset, headers);
  const profile = dataset.archiveProfile ? validateProfile(dataset, headers) : null;
  const features = []; const featureLines = []; const issues = []; let rejectedRecords = 0; let regionExcluded = 0;
  for (const [index, row] of rows.slice(1).entries()) {
    const line = rowNumbers?.[index] ?? row.info.lines;
    const reject = (code, field, message) => { rejectedRecords++; issues.push({ row: line, code, field, severity: 'error', message }); };
    if (row.record.length !== headers.length) { reject('COLUMN_COUNT', undefined, 'Row has a different number of fields from the header.'); continue; }
    const record = Object.fromEntries(headers.map((name, index) => [name, row.record[index]]));
    // An unverified version/field mapping is a delivery-level blocker, not a bad row
    // to discard while committing or activating the rest of an archive.
    requireVerifiedExportSemantics(dataset, headers, record);
    if (profile) { const issue = profileRowIssue(record, profile); if (issue) { reject(...issue); continue; } }
    const numeric = value => typeof value === 'string' && /^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?$/.test(value) ? Number(value) : NaN;
    const latitude = numeric(record.latitude);
    const longitude = numeric(record.longitude);
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude) || Math.abs(latitude) > 90 || Math.abs(longitude) > 180) { reject('COORDINATES', 'latitude/longitude', 'Coordinates are blank, non-finite or outside WGS84 ranges.'); continue; }
    const sensor = (dataset.archiveProfile === 'viirs-snpp-firms-export'||dataset.deliveryProfile==='SNPP') && record.instrument === 'SNPP' ? 'VIIRS' : record.instrument || dataset.sensor;
    if (!['VIIRS', 'MODIS'].includes(sensorOf(sensor)) || (dataset.sensor && sensorOf(sensor) !== dataset.sensor)) { reject('SENSOR', 'instrument', 'Instrument is missing, unsupported or conflicts with declared dataset provenance.'); continue; }
    if (dataset.platform && record.satellite && (profile ? canonicalPlatform(record.satellite) !== canonicalPlatform(dataset.platform) : record.satellite !== dataset.platform)) { reject('PLATFORM', 'satellite', 'Satellite conflicts with declared dataset provenance.'); continue; }
    const temporary = { type: 'Feature', geometry: { type: 'Point', coordinates: [longitude, latitude] }, properties: { date: record.acq_date, time: record.acq_time } };
    const acquisition = acquisitionUTC(temporary);
    if (!acquisition?.acquiredAt) { reject('UTC_ACQUISITION', 'acq_date/acq_time', 'A valid acquisition date and HHMM UTC time are required.'); continue; }
    if (dataset.kind === 'archive' && record.version && !(profile?.rawVersions ?? [dataset.version]).includes(record.version)) { reject('COLLECTION_VERSION', 'version', 'Row version conflicts with the declared archive collection.'); continue; }
    if (dataset.kind === 'archive' && record.version && /NRT/i.test(record.version) !== (dataset.processing === 'nrt')) { reject('PROCESSING_STAGE', 'version', 'NRT and standard products cannot be silently combined.'); continue; }
    if (boundary && !pointInRegion(longitude, latitude, boundary)) { regionExcluded++; continue; }
    const rawFrp = numeric(record.frp);
    const frp = Number.isFinite(rawFrp) && rawFrp >= 0 ? rawFrp : null;
    if (record.frp != null && record.frp !== '' && frp === null) issues.push({ row: line, field: 'frp', code: 'INVALID_FRP', severity: 'warning', message: 'Invalid FRP excluded from numeric summaries; detection retained.' });
    const properties = { latitude, longitude, source: record.source || dataset.source, date: acquisition.date, time: record.acq_time, acquiredAt: acquisition.acquiredAt, satellite: record.satellite || dataset.platform || null, instrument: sensorOf(sensor), confidence: record.confidence || null, frp };
    properties.rawInstrument = record.instrument || null;
    properties.rawSatellite = record.satellite || null;
    if (profile) properties.archiveRaw = record;
    if (profile) properties.satellite = canonicalPlatform(record.satellite);
    // Preserve additional FIRMS archive fields (scan/track, version, type, daynight...).
    const known = new Set(['latitude', 'longitude', 'source', 'acq_date', 'acq_time', 'satellite', 'instrument', 'confidence', 'frp']);
    for (const [key, value] of Object.entries(record)) if (!known.has(key)) properties[Object.hasOwn(properties, key) ? 'raw_' + key : key] = value || null;
    if (record.frp != null && record.frp !== '' && frp === null) properties.rawFrp = record.frp;
    features.push({ type: 'Feature', id: features.length, geometry: temporary.geometry, properties });
    featureLines.push(line);
  }
  const only = values => values.length && values.every(value => value != null && value !== '' && value === values[0]) ? values[0] : undefined;
  const descriptor = { ...dataset, sensor: dataset.sensor ?? (inferMetadata ? only(features.map(feature => feature.properties.instrument)) : undefined), platform: dataset.platform ?? (inferMetadata ? only(features.map(feature => feature.properties.satellite)) : undefined), version: dataset.version ?? (inferMetadata ? only(features.map(feature => feature.properties.version)) : undefined), checksum, partial: Boolean(dataset.partial || rejectedRecords || issues.length) };
  const rawCollection = { type: 'FeatureCollection', metadata: { mode: dataset.regionId, developmentFixture: dataset.kind === 'fixture', datasets: [descriptor] }, features };
  const normalized = normalizeCollection(rawCollection, { region: dataset.regionId });
  const diagnostics = { ...normalized.diagnostics, inputRecords: rows.length - 1, acceptedRecords: features.length, rejectedRecords: rejectedRecords + normalized.diagnostics.rejectedRecords, regionExcluded, issues: [...issues, ...normalized.diagnostics.issues.map(issue => ({ ...issue, row: issue.row ? featureLines[issue.row - 1] : undefined }))] };
  const collection = { ...rawCollection, features: deduplicate ? normalized.observations.map(o => ({ ...o.feature, id: o.id })) : features };
  return { collection, rawCollection, dataset: descriptor, observations: normalized.observations, availability: normalized.availability, diagnostics };
}
