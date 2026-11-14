import fs from 'node:fs';
import { loadRegionCollection } from './dataCatalog.js';
import { aggregatePeriods, filterObservations, normalizeCollection, SCHEMA_VERSION, sensorSummaries, validateFilter } from '../shared/observations.ts';
import { compareSensors } from '../shared/harmonization.ts';
const caveats = [
  'Satellite thermal detections are not confirmed fires.',
  'MODIS and VIIRS raw counts are not equivalent fire intensity.',
  'FRP sums describe reported detections in MW, not daily energy or burned area.',
  'Unknown coverage cannot establish zero activity.',
  'No validated baseline or sensor-normalized anomaly is supplied.',
];
function scope(query) {
  const allowed = new Set(['region', 'sensor','processing', 'fixture', 'from', 'to', 'fromTime', 'toTime', 'platform', 'datasetId', 'bbox', 'confidence', 'period', 'frpMin', 'frpMax']);
  if (Object.keys(query).some(key => !allowed.has(key))) throw new RangeError('Unsupported query parameter');
  const scalar = (name, fallback) => { const value = query[name] ?? fallback; if (value !== undefined && typeof value !== 'string') throw new RangeError('Query parameters must be single strings'); return value; };
  const region = scalar('region', 'ajloun'); const sensor = scalar('sensor'); const fixture = scalar('fixture', 'include');
  if (!['ajloun', 'northern-jordan'].includes(region) || (sensor && !['VIIRS', 'MODIS', 'UNKNOWN', 'all'].includes(sensor)) || !['include', 'exclude', 'only'].includes(fixture)) throw new RangeError('Unsupported region, sensor or fixture scope');
  const bbox = scalar('bbox'); const datasetId = scalar('datasetId');
  if (datasetId !== undefined && !datasetId) throw new RangeError('Dataset ID must not be empty');
  if (bbox && bbox.split(',').some(value => !value.trim())) throw new RangeError('Invalid WGS84 bounding box');
  const numeric = name => { const value = scalar(name); if (value !== undefined && !value.trim()) throw new RangeError('Empty numeric filter'); return value === undefined ? undefined : Number(value); };
  const filter = { region, sensor, processing:scalar('processing'),fixture, frpMin: numeric('frpMin'), frpMax: numeric('frpMax'), confidenceRaw: scalar('confidence'), startDate: scalar('from'), endDate: scalar('to'), startTime: scalar('fromTime'), endTime: scalar('toTime'), platform: scalar('platform'), datasetIds: datasetId ? [datasetId] : undefined, bbox: bbox ? bbox.split(',').map(Number) : undefined };
  validateFilter(filter); return { region, datasetId, filter };
}
export function registerObservations(app, { load = loadRegionCollection } = {}) {
  // Backward-compatible GeoJSON endpoint: the feature schema and existing modes survive.
  app.get('/api/observations', (req, res) => {
    const mode = req.query.mode ?? 'ajloun';
    if (!['ajloun', 'northern-jordan'].includes(mode)) return res.status(400).json({ error: 'Unsupported observation mode' });
    try {
      if(['1','year','month','day'].includes(req.query.summary)){const active=JSON.parse(fs.readFileSync(new URL('./data/active-history.json',import.meta.url),'utf8'));if(!/^historical-summary-[a-f0-9]+-$/.test(active.summaryPrefix))throw Error('Invalid summary pointer');const summary=new URL('./data/'+active.summaryPrefix+mode+'.json',import.meta.url);if(fs.existsSync(summary)){const value=JSON.parse(fs.readFileSync(summary,'utf8'));if(req.query.summary!=='1')value.series=value.series.filter(row=>row.period.length===({year:4,month:7,day:10})[req.query.summary]);return res.json(value);}return res.status(404).json({error:'Historical summaries unavailable'});}
      const year=req.query.year===undefined?null:Number(req.query.year);if(year!==null&&(!Number.isInteger(year)||year<1900||year>2100))return res.status(400).json({error:'Invalid UTC year'});
      const pointer=new URL('./data/active-history.json',import.meta.url);const active=fs.existsSync(pointer)?JSON.parse(fs.readFileSync(pointer,'utf8')):null;if(active?.reportFile&&!/^historical-activation-[a-f0-9]+\.json$/.test(active.reportFile))throw Error('Invalid report pointer');const statsFile=new URL('./data/'+(active?.reportFile??'historical-activation-report.json'),import.meta.url);const stats=load===loadRegionCollection&&fs.existsSync(statsFile)?JSON.parse(fs.readFileSync(statsFile,'utf8')).regions?.[mode]:null;
      const selectedYear=year??(stats?Number(stats.last.slice(0,4)):null);
      const collection = load(mode,selectedYear?{filter:{startDate:selectedYear+'-01-01',endDate:selectedYear+'-12-31'}}:{});
      const allDates=collection.features.map(f=>String(f.properties.date)).sort();
      if(collection.metadata?.datasets?.some(d=>d.deliveryProfile)){
       const years=stats?Object.keys(stats.byYear).sort():[...new Set(allDates.map(d=>d.slice(0,4)))].sort(),defaultYear=Number(years.at(-1));
       collection.metadata={...collection.metadata,historical:true,defaultYear,availableYears:years,observedExtent:stats?[stats.first.slice(0,10),stats.last.slice(0,10)]:[allDates[0],allDates.at(-1)],totalDelivered:stats?.count,yearCounts:stats?.byYear,exampleYears:fs.existsSync(statsFile)?Object.fromEntries(Object.entries(JSON.parse(fs.readFileSync(statsFile,'utf8')).regions).map(([r,v])=>[r,v.exampleYear])):{},summaryPath:'/api/observations?mode='+mode+'&summary=year',yearPaths:Object.fromEntries(years.map(y=>[y,'/api/observations?mode='+mode+'&year='+y]))};
       if(req.query.manifest==='1')collection.features=[];
       else if(!year)collection.features=collection.features.filter(f=>String(f.properties.date).startsWith(String(defaultYear)));
      }
      if (collection.metadata?.availability?.state === 'error') return res.status(503).json({ error: 'Observation source is unavailable.' });
      return res.json(collection);
    } catch { return res.status(503).json({ error: 'Regional archive configuration or data is unavailable.' }); }
  });
  for (const resource of ['datasets', 'observations', 'aggregates', 'coverage', 'comparison']) app.get([`/api/intelligence/${resource}`, `/api/history/${resource}`], (req, res) => {
    let request;
    try { request = scope(req.query); if (req.query.period !== undefined && !['day', 'month', 'year'].includes(req.query.period)) throw new RangeError('Unsupported aggregation period'); }
    catch (error) { return res.status(400).json({ schemaVersion: SCHEMA_VERSION, availability: { state: 'error', fixture: false, quality: 'partial', coverage: 'unknown', reasons: ['Invalid scope'] }, error: { code: 'INVALID_QUERY', message: error.message } }); }
    try {
      const collection = load(request.region, { allDatasets: true, datasetId: request.datasetId, filter: request.filter });
      const normalized = normalizeCollection(collection, { region: request.region });
      const observations = filterObservations(normalized.observations, request.filter);
      const datasets = normalized.datasets.filter(dataset => !request.datasetId || dataset.id === request.datasetId);
      const availability = normalized.availability;
      const response = { schemaVersion: SCHEMA_VERSION, resource, scope: request.filter, availability, datasets, diagnostics: normalized.diagnostics, ingestionReports: collection.metadata?.ingestion ?? (collection.metadata?.diagnostics ? [{ datasetId: datasets[0]?.id, ...collection.metadata.diagnostics }] : []), coverage: [], caveats,
        capabilities: { temporalAggregation: true, validatedBaseline: false, sensorNormalizedComparison: false, normalizedAnomalies: false, decisionBrief: 'descriptive-only' } };
      if (resource === 'observations') Object.assign(response, { observations, sensorSummaries: sensorSummaries(observations) });
      if (resource === 'aggregates') Object.assign(response, { period: req.query.period ?? 'day', series: aggregatePeriods(observations, { period: req.query.period ?? 'day', filter: request.filter, datasets, availability, coverage: [] }) });
      if (resource === 'coverage') Object.assign(response, { coverageStatus: 'unknown', evidence: 'Detection-only CSV archives do not establish clear-sky, valid-pixel or acquisition coverage.', datasetCoverage: datasets.map(d => ({ datasetId: d.id, sensor: d.sensor ?? 'UNKNOWN', platform: d.platform ?? null, status: 'unknown', verifiedDays: [] })) });
      if (resource === 'comparison') Object.assign(response, { comparison: compareSensors(observations, { filter: request.filter, datasets, availability, period: req.query.period ?? 'day', coverage: [] }) });
      return res.status(availability.state === 'error' || normalized.regionMismatch ? 503 : 200).json(response);
    } catch (error) {
      const notFound = error.code === 'DATASET_NOT_FOUND';
      const tooLarge = error.code === 'QUERY_TOO_LARGE';
      return res.status(notFound ? 404 : tooLarge ? 413 : error instanceof RangeError ? 400 : 503).json({ schemaVersion: SCHEMA_VERSION, resource, scope: request.filter, availability: { state: 'error', fixture: false, quality: 'partial', coverage: 'unknown', reasons: ['Observation source could not be loaded safely.'] }, datasets: [], observations: [], coverage: [], error: { code: notFound ? 'DATASET_NOT_FOUND' : tooLarge ? 'QUERY_TOO_LARGE' : 'DATA_UNAVAILABLE', message: notFound ? 'Dataset is not registered in this region.' : tooLarge ? 'Narrow date, dataset or sensor scope; query exceeds 50000 detections.' : 'Data could not be loaded for this scope.' }, caveats });
    }
  });
}
