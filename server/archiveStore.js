import { DatabaseSync } from 'node:sqlite';
import { canonical, filterObservations, validateFilter } from '../shared/observations.ts';
import { IngestionError } from './firmsArchive.js';

export const DEFAULT_ARCHIVE_STORE = new URL('./data/history.sqlite', import.meta.url);
const identity = d => JSON.stringify(canonical({ id: d.id, regionId: d.regionId, kind: d.kind, sensor: d.sensor, platform: d.platform ?? null, source: d.source, product: d.product, version: d.version, processing: d.processing, archiveProfile: d.archiveProfile }));
/** Local persistent adapter. One writer, atomic file imports, indexed bounded queries. */
export class ArchiveStore {
  constructor(filename, { readOnly = false } = {}) {
    this.db = new DatabaseSync(filename, { readOnly });
    this.db.exec('PRAGMA busy_timeout=5000');
    const version = this.db.prepare('PRAGMA user_version').get().user_version;
    if (version !== 1 && (readOnly || version !== 0)) { this.close(); throw new IngestionError('STORE_VERSION', 'Unsupported archive store schema.'); }
    if (!readOnly) this.db.exec(`PRAGMA journal_mode=WAL;
      CREATE TABLE IF NOT EXISTS datasets (id TEXT PRIMARY KEY, identity TEXT NOT NULL, descriptor TEXT NOT NULL, active INTEGER NOT NULL DEFAULT 0);
      CREATE TABLE IF NOT EXISTS observations (id TEXT PRIMARY KEY, dataset_id TEXT NOT NULL, utc_date TEXT NOT NULL, sensor TEXT NOT NULL, observation TEXT NOT NULL);
      CREATE INDEX IF NOT EXISTS observation_scope ON observations(dataset_id, utc_date, sensor, id);
      CREATE TABLE IF NOT EXISTS imports (id INTEGER PRIMARY KEY, dataset_id TEXT NOT NULL, checksum TEXT NOT NULL, report TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS issues (import_id INTEGER NOT NULL, row_number INTEGER, issue TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS observation_deliveries (observation_id TEXT NOT NULL, import_id INTEGER NOT NULL, PRIMARY KEY(observation_id, import_id));
      PRAGMA user_version=1;`);
    if (this.db.prepare('PRAGMA user_version').get().user_version !== 1) { this.close(); throw new IngestionError('STORE_VERSION', 'Unsupported archive store schema.'); }
  }
  close() { this.db.close(); }
  begin(dataset) {
    this.db.exec('BEGIN IMMEDIATE');
    const existing = this.db.prepare('SELECT identity FROM datasets WHERE id=?').get(dataset.id);
    if (existing && existing.identity !== identity(dataset)) { this.rollback(); throw new IngestionError('DATASET_CONFLICT', 'Incremental deliveries must retain the same dataset provenance; use a new ID for a different product, collection or sensor.'); }
    this.db.prepare('INSERT OR IGNORE INTO datasets(id,identity,descriptor) VALUES(?,?,?)').run(dataset.id, identity(dataset), JSON.stringify(dataset));
    const result = this.db.prepare("INSERT INTO imports(dataset_id,checksum,report) VALUES(?,'pending','{}')").run(dataset.id);
    return Number(result.lastInsertRowid);
  }
  write(importId, observations, issues) {
    const insert = this.db.prepare('INSERT OR IGNORE INTO observations VALUES(?,?,?,?,?)');
    let inserted = 0;
    const link = this.db.prepare('INSERT OR IGNORE INTO observation_deliveries VALUES(?,?)');
    for (const o of observations) { inserted += Number(insert.run(o.id, o.datasetId, o.utcDate, o.sensor, JSON.stringify(o)).changes); link.run(o.id, importId); }
    const issueInsert = this.db.prepare('INSERT INTO issues VALUES(?,?,?)');
    for (const issue of issues) issueInsert.run(importId, issue.row ?? null, JSON.stringify(issue));
    return inserted;
  }
  finish(importId, dataset, checksum, report, activate) {
    const previous = JSON.parse(this.db.prepare('SELECT descriptor FROM datasets WHERE id=?').get(dataset.id).descriptor);
    const descriptor = { ...dataset, filename: undefined, checksum: dataset.deliveryProfile?checksum:undefined,checksumScope:dataset.deliveryProfile?'Latest member; complete lineage in provenanceFiles':undefined,provenanceFiles:dataset.deliveryProfile?[...new Map([...(previous.provenanceFiles??[]),...(dataset.provenanceFiles??[])].map(f=>[f.csvSHA256,f])).values()]:dataset.provenanceFiles, partial: Boolean(previous.partial || report.rejectedRecords || report.issueCount), importedAt: new Date().toISOString() };
    if (activate) this.db.prepare('UPDATE datasets SET active=0 WHERE id<>? AND json_extract(descriptor,\'$.sensor\')=? AND json_extract(descriptor,\'$.regionId\')=? AND json_extract(descriptor,\'$.processing\')=? AND json_extract(descriptor,\'$.platform\') IS ?').run(dataset.id,dataset.sensor,dataset.regionId,dataset.processing,dataset.platform??null);
    this.db.prepare('UPDATE datasets SET descriptor=?, active=CASE WHEN ? THEN 1 ELSE active END WHERE id=?').run(JSON.stringify(descriptor), activate ? 1 : 0, dataset.id);
    this.db.prepare('UPDATE imports SET checksum=?,report=? WHERE id=?').run(checksum, JSON.stringify({ ...report, checksum, datasetId: dataset.id, importedAt: descriptor.importedAt }), importId);
    this.db.exec('COMMIT');
  }
  rollback() { this.db.exec('ROLLBACK'); }
  catalog({ activeOnly = false } = {}) {
    return this.db.prepare(`SELECT descriptor FROM datasets ${activeOnly ? 'WHERE active=1' : ''} ORDER BY id`).all().map(row => JSON.parse(row.descriptor));
  }
  reports(datasetId, limit = 100) {
    return this.db.prepare('SELECT id,report FROM imports WHERE dataset_id=? ORDER BY id DESC LIMIT ?').all(datasetId, limit).map(row => ({ importId: row.id, ...JSON.parse(row.report) }));
  }
  issues(importId, { limit = 100, offset = 0 } = {}) {
    if (!Number.isSafeInteger(limit) || limit < 1 || limit > 1000 || !Number.isSafeInteger(offset) || offset < 0) throw new RangeError('Invalid issue page');
    return this.db.prepare('SELECT issue FROM issues WHERE import_id=? ORDER BY rowid LIMIT ? OFFSET ?').all(importId, limit, offset).map(row => JSON.parse(row.issue));
  }
  query(filter = {}, { limit = 50000 } = {}) {
    validateFilter(filter);
    if (!Number.isSafeInteger(limit) || limit < 1 || limit > 50000) throw new RangeError('Query limit must be 1–50000');
    const clauses = []; const params = [];
    if (filter.datasetIds?.length) { clauses.push(`dataset_id IN (${filter.datasetIds.map(() => '?').join(',')})`); params.push(...filter.datasetIds); }
    if (filter.startDate) { clauses.push('utc_date>=?'); params.push(filter.startDate); }
    if (filter.endDate) { clauses.push('utc_date<=?'); params.push(filter.endDate); }
    if (filter.sensor && filter.sensor.toUpperCase() !== 'ALL') { clauses.push('sensor=?'); params.push(filter.sensor.toUpperCase()); }
    const statement = this.db.prepare(`SELECT observation FROM observations ${clauses.length ? 'WHERE ' + clauses.join(' AND ') : ''} ORDER BY utc_date,id`);
    const result = [];
    for (const row of statement.iterate(...params)) {
      const observation = JSON.parse(row.observation);
      if (!filterObservations([observation], filter).length) continue;
      if (result.length >= limit) throw new IngestionError('QUERY_TOO_LARGE', 'Query exceeds 50000 detections. Narrow the date, dataset or sensor scope; no partial result was returned.');
      result.push(observation);
    }
    return result;
  }
}
