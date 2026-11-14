import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ingestFirmsCSV, IngestionError } from './firmsArchive.js';
import { ArchiveStore, DEFAULT_ARCHIVE_STORE } from './archiveStore.js';
const dataRoot = fileURLToPath(new URL('./data/', import.meta.url));
function readLocalFile(filename, directory) {
  const file = path.resolve(directory, filename);
  const root = fs.realpathSync(directory);
  const real = fs.realpathSync(file);
  if (!real.startsWith(root + path.sep) || path.extname(real).toLowerCase() !== path.extname(filename).toLowerCase()) throw new IngestionError('DATASET_PATH', 'Configured data path is outside its data directory.');
  return fs.readFileSync(real, 'utf8');
}
function manifest() {
  if (!fs.existsSync(path.join(dataRoot, 'archive-manifest.json'))) return { datasets: [], active: [] };
  let value;
  try { value = JSON.parse(readLocalFile('archive-manifest.json', dataRoot)); } catch { throw new IngestionError('MANIFEST', 'Archive manifest is invalid or unreadable.'); }
  if (!Array.isArray(value.datasets) || !Array.isArray(value.active) || value.datasets.some(d => !d.id || d.regionId !== 'ajloun' || d.kind !== 'archive' || !['VIIRS', 'MODIS'].includes(d.sensor) || !d.filename || path.basename(d.filename) !== d.filename || !/^[^.][\w.-]*\.csv$/i.test(d.filename)) || new Set(value.datasets.map(d => d.id)).size !== value.datasets.length || value.active.some(id => typeof id !== 'string' || !value.datasets.some(d => d.id === id))) throw new IngestionError('MANIFEST', 'Archive manifest requires unique, explicitly scoped archive datasets and safe CSV basenames.');
  return value;
}
export function readArchiveCSV(filename) {
  if (typeof filename !== 'string' || path.basename(filename) !== filename || !/^[^.][\w.-]*\.csv$/i.test(filename)) throw new IngestionError('DATASET_PATH', 'Archive file must be a safe CSV basename.');
  return readLocalFile(filename, path.join(dataRoot, 'archives'));
}
export function loadAjlounGeometry() {
  const boundaries = JSON.parse(fs.readFileSync(new URL('../public/jordan-adm1.geojson', import.meta.url), 'utf8'));
  return boundaries.features.find(feature => feature.properties?.shapeName === 'Ajloun')?.geometry;
}
export function loadRegionCollection(region, { allDatasets = false, datasetId, filter, baseline = false } = {}) {
  const pointer=new URL('./data/active-history.json',import.meta.url);
  if(!baseline&&fs.existsSync(pointer)){
   const active=JSON.parse(fs.readFileSync(pointer,'utf8'));if(!/^[\w-]+\.sqlite$/.test(active.filename))throw new IngestionError('STORE_PATH','Invalid active store');
   const store=new ArchiveStore(new URL('./data/'+active.filename,import.meta.url),{readOnly:true});try{const datasets=store.catalog({activeOnly:true}).filter(d=>d.regionId===region&&(!datasetId||d.id===datasetId));if(datasetId&&!datasets.length)throw new IngestionError('DATASET_NOT_FOUND','Unknown dataset');const result=storedCollection(region,datasets,store.query({...filter,region,datasetIds:datasets.map(d=>d.id)}),datasets.flatMap(d=>store.reports(d.id)));result.metadata.activationRevision=active.revision;return result;}finally{store.close();}
  }
  if(region==='northern-jordan'&&datasetId)throw new IngestionError('DATASET_NOT_FOUND','No archive is registered in this region.');
  if(region==='northern-jordan')return {type:'FeatureCollection',features:[],metadata:{mode:region,region:'Northern Jordan',developmentFixture:false,datasets:[],coverage:[],availability:{state:'unavailable',fixture:false,quality:'complete',coverage:'unknown',reasons:['Northern Jordan archive import is not activated. Existing Ajloun data do not establish region-wide coverage.']}}};
  if(region!=='ajloun')throw new IngestionError('REGION','Unsupported region');
  const configured = manifest();
  if (fs.existsSync(DEFAULT_ARCHIVE_STORE)) {
    const store = new ArchiveStore(DEFAULT_ARCHIVE_STORE, { readOnly: true });
    try {
      const stored = store.catalog({ activeOnly: !allDatasets && !datasetId }).filter(d => d.regionId === region && (!datasetId || d.id === datasetId));
      if (stored.length) {
        if (configured.datasets.some(d => stored.some(s => s.id === d.id))) throw new IngestionError('DATASET_CONFLICT', 'A dataset cannot be registered in both CSV and persistent catalogs.');
        if (configured.datasets.some(d => (allDatasets || configured.active.includes(d.id)) && (!datasetId || d.id === datasetId))) throw new IngestionError('CATALOG_SELECTION', 'Migrate the CSV catalog before activating persistent archives; mixed catalog reads are not silently combined.');
        const observations = store.query({ ...filter, region, datasetIds: stored.map(d => d.id) });
        return storedCollection(region, stored, observations, stored.flatMap(d => store.reports(d.id)));
      }
    } finally { store.close(); }
  }
  const selected = configured.datasets.filter(dataset => dataset.regionId === region && (datasetId ? dataset.id === datasetId : allDatasets || configured.active.includes(dataset.id)));
  if (datasetId && !selected.length) throw new IngestionError('DATASET_NOT_FOUND', 'Dataset is not registered in this region.');
  if (!allDatasets && !datasetId && new Set(selected.map(d => d.sensor)).size !== selected.length) throw new IngestionError('DATASET_SELECTION_REQUIRED', 'The legacy view requires at most one explicitly active dataset per sensor.');
  if (!selected.length) return { type: 'FeatureCollection', features: [], metadata: { mode: region, region: 'Ajloun, Jordan', developmentFixture: false, message: 'Ajloun observations are not connected.', datasets: [], coverage: [], availability: { state: 'unavailable', fixture: false, quality: 'complete', coverage: 'unknown', reasons: ['No archive is configured for this region.'] } } };
  return loadArchiveCollection(region, selected);
}

export function storedCollection(region, datasets, observations, reports = []) {
  const partial = datasets.some(d => d.partial);
  return { type: 'FeatureCollection', metadata: { schemaVersion: 'firepulse.observations/v1', mode: region, developmentFixture: false, datasets, coverage: [], ingestion: reports, availability: { state: partial ? 'partial' : 'loaded', fixture: false, quality: partial ? 'partial' : 'complete', coverage: 'unknown', reasons: ['Archive detections do not establish acquisition coverage.'] } }, features: observations.map(o => ({ ...o.feature, id: o.id, properties: { ...o.feature.properties, datasetId: o.datasetId } })) };
}

// Dependency injection keeps catalog failure/partial-load tests outside real data files.
export function loadArchiveCollection(region, selected, { read = readArchiveCSV, geometry = loadAjlounGeometry } = {}) {
  const boundary = geometry();
  const results = []; const failures = [];
  for (const dataset of selected) {
    try { results.push(ingestFirmsCSV(read(dataset.filename), { dataset, boundary })); }
    catch (error) { failures.push({ datasetId: dataset.id, code: error.code ?? 'ARCHIVE_READ', message: 'Configured archive could not be loaded safely.' }); }
  }
  const partial = failures.length > 0 || results.some(result => result.availability.quality === 'partial');
  const state = !results.length ? 'error' : partial ? 'partial' : 'loaded';
  const descriptors = selected.map(dataset => { const result = results.find(item => item.dataset.id === dataset.id); return result ? { ...result.dataset, availability: result.availability } : { ...dataset, availability: { state: 'error', quality: 'partial', fixture: false, coverage: 'unknown', reasons: ['Configured archive is unavailable.'] } }; });
  return { type: 'FeatureCollection', metadata: { mode: region, region: 'Ajloun, Jordan', developmentFixture: false, schemaVersion: 'firepulse.observations/v1', datasets: descriptors, coverage: [], availability: { state, quality: partial ? 'partial' : 'complete', fixture: false, coverage: 'unknown', reasons: ['Archive loading does not establish satellite coverage.', ...(failures.length ? ['Some configured archives could not be loaded.'] : [])] }, datasetErrors: failures, ingestion: results.map(result => ({ datasetId: result.dataset.id, ...result.diagnostics })) },
    features: results.flatMap(result => result.collection.features.map(feature => ({ ...feature, properties: { ...feature.properties, datasetId: result.dataset.id } }))) };
}
