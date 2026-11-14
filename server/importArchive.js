import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { Transform } from 'node:stream';
import { parse } from 'csv-parse';
import { ingestFirmsCSV, IngestionError } from './firmsArchive.js';
import { validateProfile, ARCHIVE_PROFILES } from './archiveProfiles.js';
import { ArchiveStore, DEFAULT_ARCHIVE_STORE } from './archiveStore.js';
import { loadAjlounGeometry } from './dataCatalog.js';
import { digest } from '../shared/observations.ts';

const encode = fields => fields.map(value => '"' + String(value).replaceAll('"', '""') + '"').join(',');
/** Bounded parser + canonical batch adapter. Caller owns atomic storage transaction. */
export async function importArchiveStream(input, { dataset, boundary, store, batchSize = 1000, activate = false, signal, deliveryName = null } = {}) {
  if (!Number.isInteger(batchSize) || batchSize < 1 || batchSize > 10000) throw new RangeError('Batch size must be 1–10000');
  if (!['ajloun','northern-jordan'].includes(dataset?.regionId) || dataset?.kind !== 'archive' || !dataset.archiveProfile || !boundary || !['Polygon', 'MultiPolygon'].includes(boundary.type)) throw new IngestionError('ARCHIVE_SCOPE', 'Archive import requires explicit Ajloun provenance, an archive profile and pilot polygon.');
  // Validate metadata before opening a transaction; header-specific checks follow.
  const checksum = createHash('sha256');
  const hashStream = new Transform({ transform(chunk, encoding, done) { checksum.update(chunk); done(null, chunk); } });
  const parser = parse({ bom: true, trim: true, skip_empty_lines: true, relax_column_count: true, info: true, max_record_size: 1024 * 1024 });
  const fail = error => parser.destroy(error);
  input.on('error', fail); hashStream.on('error', fail);
  const abort = () => parser.destroy(new IngestionError('IMPORT_ABORTED', 'Archive import cancelled; no changes committed.'));
  signal?.addEventListener('abort', abort, { once: true });
  let importId; let headers; let batch = [];
  const report = { deliveryName, boundaryChecksum: digest(JSON.stringify(boundary)), boundaryMethod: 'WGS84 point-in-polygon; outer boundary included, holes excluded', inputRecords: 0, acceptedRecords: 0, insertedRecords: 0, duplicatesRemoved: 0, rejectedRecords: 0, regionExcluded: 0, issueCount: 0, maxBatchRecords: 0 };
  const flush = () => {
    if (!batch.length) return;
    const result = ingestFirmsCSV([encode(headers), ...batch.map(row => encode(row.record))].join('\n'), { dataset: { ...dataset, checksum: undefined }, boundary, inferMetadata: false, rowNumbers: batch.map(row => row.info.lines) });
    const issues = result.diagnostics.issues;
    const inserted = store.write(importId, result.observations, issues);
    report.inputRecords += batch.length; report.acceptedRecords += result.diagnostics.acceptedRecords;
    report.insertedRecords += inserted; report.duplicatesRemoved += result.diagnostics.acceptedRecords - inserted;
    report.rejectedRecords += result.diagnostics.rejectedRecords; report.regionExcluded += result.diagnostics.regionExcluded;
    report.issueCount += issues.length; report.maxBatchRecords = Math.max(report.maxBatchRecords, batch.length); batch = [];
  };
  try {
    if (signal?.aborted) throw new IngestionError('IMPORT_ABORTED', 'Archive import cancelled.');
    input.pipe(hashStream).pipe(parser);
    for await (const row of parser) {
      if (!headers) {
        headers = row.record.map(value => value.toLowerCase().trim()); validateProfile(dataset, headers);
        // Shared adapter also validates duplicate headers and complete dataset schema.
        ingestFirmsCSV(encode(headers), { dataset: { ...dataset, checksum: undefined }, boundary });
        importId = store.begin(dataset); continue;
      }
      batch.push(row); if (batch.length >= batchSize) flush();
    }
    if (!headers) throw new IngestionError('CSV_SCHEMA', 'CSV header is missing.');
    flush(); const hash = checksum.digest('hex');
    if (dataset.checksum && dataset.checksum !== hash) throw new IngestionError('CHECKSUM_MISMATCH', 'Archive checksum does not match the pinned delivery.');
    store.finish(importId, dataset, hash, report, activate);
    return { importId, datasetId: dataset.id, checksum: hash, ...report };
  } catch (error) {
    if (importId !== undefined) store.rollback();
    if (error instanceof IngestionError || error instanceof RangeError) throw error;
    if (String(error.code).startsWith('CSV_')) throw new IngestionError('CSV_SYNTAX', `CSV syntax failed${Number.isSafeInteger(error.lines) ? ' near physical line ' + error.lines : ''}; the entire delivery was rolled back.`);
    throw new IngestionError('CSV_IMPORT', 'CSV stream could not be imported safely; the entire delivery was rolled back.');
  } finally {
    signal?.removeEventListener('abort', abort); input.removeListener('error', fail);
    input.unpipe(hashStream); hashStream.unpipe(parser); input.destroy(); hashStream.destroy(); parser.destroy();
  }
}

export async function importArchiveFiles({ files, dataset, store, boundary, activate = false, batchSize, signal }) {
  const reports = [];
  // Each file is atomic. Previously committed deliveries survive a later file failure.
  for (const filename of files) {
    if (typeof filename !== 'string' || !/^[^.][\w.-]*\.csv$/i.test(path.basename(filename))) throw new IngestionError('DATASET_PATH', 'Only explicitly named non-hidden CSV archive files may be imported.');
    const real = fs.realpathSync(filename);
    if (path.extname(real).toLowerCase() !== '.csv' || !fs.statSync(real).isFile()) throw new IngestionError('DATASET_PATH', 'Archive input must resolve to a regular CSV file.');
    reports.push(await importArchiveStream(fs.createReadStream(real), { dataset, boundary, store, activate, batchSize, signal, deliveryName: path.basename(filename) }));
  }
  return reports;
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  let store;
  try {
    const args = process.argv.slice(2); const options = {}; const files = [];
    for (let index = 0; index < args.length; index++) {
      const name = args[index];
      if (name === '--activate') { options.activate = true; continue; }
      if (!['--file', '--id', '--profile', '--version', '--product', '--store', '--checksum'].includes(name) || !args[index + 1] || args[index + 1].startsWith('--')) throw new IngestionError('CLI', 'Use documented archive import arguments.');
      const value = args[++index]; if (name === '--file') files.push(value); else options[name.slice(2)] = value;
    }
    if (!files.length || !options.id || !options.profile || !options.version || !options.product) throw new IngestionError('CLI', 'Required: --file, --id, --profile, --version and --product.');
    const dataset = { id: options.id, title: 'Ajloun FIRMS archive', regionId: 'ajloun', kind: 'archive', source: 'NASA FIRMS', sensor: ARCHIVE_PROFILES[options.profile]?.sensor, product: options.product, version: options.version, processing: 'standard', archiveProfile: options.profile, ...(options.profile.endsWith('firms-export') ? { fieldSemantics: { rawVersion: 'Opaque original export value; not decoded or rewritten', brightness: 'Original export value retained; not used in harmonization', bright_t31: 'Original export value retained; no VIIRS channel alias inferred', collection: options.profile === 'modis-firms-export' ? '6.1 (M-C61 delivery)' : '2 (SV-C2 delivery)', identityEvidence: 'https://firms.modaps.eosdis.nasa.gov/download/Readme.txt' } } : {}), ...(options.checksum ? { checksum: options.checksum } : {}) };
    const location = options.store ? path.resolve(options.store) : fileURLToPath(DEFAULT_ARCHIVE_STORE);
    if (path.extname(location) !== '.sqlite') throw new IngestionError('STORE_PATH', 'Archive store must use a dedicated .sqlite filename.');
    fs.mkdirSync(path.dirname(location), { recursive: true }); store = new ArchiveStore(location);
    console.log(JSON.stringify(await importArchiveFiles({ files, dataset, store, boundary: loadAjlounGeometry(), activate: options.activate === true }), null, 2));
  } catch (error) { console.error(JSON.stringify({ code: error instanceof IngestionError ? error.code : 'IMPORT_FAILED', message: error instanceof IngestionError ? error.message : 'Archive import failed safely. Check input paths and store availability.' })); process.exitCode = 1; }
  finally { store?.close(); }
}
