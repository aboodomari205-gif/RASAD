"""Read-only inventory of activated data; never rescans or rewrites raw archives."""
import json, sqlite3, zipfile, subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
checkpoint = ROOT/'.checkpoints/rasad/full-implementation'
checkpoint.mkdir(parents=True, exist_ok=True)
# Preserve all source, including pre-existing untracked work, without copying datasets.
files = subprocess.check_output(['git','-c','safe.directory='+ROOT.as_posix(),'ls-files','-co','--exclude-standard','-z'], cwd=ROOT).decode().split('\0')
backup = checkpoint/'source-before.zip'
if not backup.exists():
    with zipfile.ZipFile(backup,'w',zipfile.ZIP_DEFLATED) as archive:
        for name in sorted(set(files)):
            path = ROOT/name
            if name and path.is_file() and not name.startswith(('deployment/static-data/',)):
                archive.write(path,name)
p = ROOT/'server/data/south-america'
active = json.loads((p/'active.json').read_text())
db = sqlite3.connect('file:'+(p/active['filename']).as_posix()+'?mode=ro',uri=True)
rows = [dict(zip(['dataset','count','first','last'],r)) for r in db.execute('SELECT dataset,sum(count),min(date),max(date) FROM daily GROUP BY dataset')]
years = [dict(zip(['year','dataset','count'],r)) for r in db.execute('SELECT substr(date,1,4),dataset,sum(count) FROM daily GROUP BY 1,2')]
inputs = [{'path':str(f.relative_to(ROOT)), 'bytes':f.stat().st_size} for f in (ROOT/'server/data/incoming').rglob('*') if f.is_file()]
environment = [str(f.relative_to(ROOT)) for folder in [ROOT/'data/incoming',ROOT/'server/data/incoming'] if folder.exists() for f in folder.rglob('*') if f.suffix.lower() in ['.tif','.tiff','.hdf','.h5','.hdf5','.nc','.grib']]
result = dict(active=active, acceptedRows=sum(r['count'] for r in rows), sources=rows, yearly=years, files=inputs, environmentalRasterFiles=environment, databaseBytes=(p/active['filename']).stat().st_size, rawBytes=sum(i['bytes'] for i in inputs), logoPresent=(ROOT/'public/brand/rasad-source.jpeg').is_file())
(ROOT/'docs/RASAD_CURRENT_INVENTORY.json').write_text(json.dumps(result,indent=2),encoding='utf-8')
table='\n'.join(f"| {r['dataset']} | {r['count']:,} | {r['first']} | {r['last']} |" for r in rows)
(ROOT/'docs/RASAD_DATA_INVENTORY.md').write_text(f'''# Current local inventory

Read directly from activated SQLite daily summaries, generation `{active['generation']}`. Accepted detections: {result['acceptedRows']:,}. This verifies summary totals, not a new independent raw-row scan. Prior member checksums, quarantine and duplicates: RASAD_INPUT_MANIFEST.json.

| Dataset | Detections | First UTC | Last UTC |
|---|---:|---|---|
{table}

Database: {result['databaseBytes']:,} bytes. Incoming archives: {result['rawBytes']:,} bytes. Exact paths, yearly coverage and byte sizes: RASAD_CURRENT_INVENTORY.json. Original archives remain at their existing paths; no copies or re-ingestion. Environmental raster files discovered: {len(environment)}. S-NPP is absent from the activated South America datasets; the small incoming S-NPP archive is not evidence of South America history. Logo present: {result['logoPresent']}.

Positive detections do not establish observation opportunity. NOAA-20/21 Standard lineage remains unresolved. Calendar gaps remain unknown. Full original-source reconciliation evidence is historical, not rerun by this inventory.
''',encoding='utf-8')
print(json.dumps({k:v for k,v in result.items() if k not in ['files','yearly','sources']},indent=2))
