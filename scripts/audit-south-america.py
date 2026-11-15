"""Independent reader: CSV positional parser + vectorized polygon union, no importer code.
Reconciles original rows, geographic exclusions, dates and checksums with committed reports.
Run after import for final reconciliation; --inventory permits concurrent raw inspection.
"""
import csv, datetime as dt, hashlib, io, json, sys, zipfile
from pathlib import Path
sys.path.insert(0,str(Path('.checkpoints/south-america/python').resolve()))
import numpy as np
import shapely
from shapely.geometry import shape
root=Path(__file__).resolve().parents[1]
polygons=[shape(f['geometry']) for f in json.loads((root/'public/south-america-countries.geojson').read_text())['features']]
continent=shapely.union_all(polygons);shapely.prepare(continent)
result={'schema':'firepulse.independent-south-america-audit/v1','members':[],'method':'Independent csv.reader, GEOS union containment and streamed SHA-256; importer code is not imported.'}
paths=[]
for base in [root/'data/incoming',root/'server/data/incoming']:
 if base.exists():
  paths += [p for p in base.rglob('*') if p.is_file() and p.suffix.lower() in ('.zip','.csv','.txt') and ('historical' in p.parts or p.name in ('MOIDS.zip','viirs.zip','viirs1.zip') or 'South_America' in p.name)]
for path in sorted(paths):
 archive=zipfile.ZipFile(path) if path.suffix.lower()=='.zip' else None
 members=[m.filename for m in archive.infolist() if not m.is_dir() and m.filename.lower().endswith(('.csv','.txt')) and not Path(m.filename).name.lower().startswith('readme')] if archive else [path.name]
 for member in members:
  stream=archive.open(member) if archive else path.open('rb')
  reader=csv.reader(io.TextIOWrapper(stream,encoding='utf-8-sig',newline=''));header=next(reader);index={h:i for i,h in enumerate(header)}
  count=excluded=0;dates=set();sources={};batch=[]
  def consume(batch):
   global count,excluded
   coordinates=np.array([[float(r[index['longitude']]),float(r[index['latitude']])] for r in batch]);inside=shapely.covers(continent,shapely.points(coordinates));excluded+=len(batch)-int(np.count_nonzero(inside));count+=len(batch)
   for r in batch:
    dates.add(r[index['acq_date']]);k=r[index['satellite']]+'/'+r[index['version']];sources[k]=sources.get(k,0)+1
  for row in reader:
   if not row:continue
   batch.append(row)
   if len(batch)>=20000:consume(batch);batch=[]
  if batch:consume(batch)
  stream=archive.open(member) if archive else path.open('rb');h=hashlib.sha256()
  with stream:
   for b in iter(lambda:stream.read(1024*1024),b''):h.update(b)
  row={'file':path.name,'member':member,'input':count,'outsidePolygon':excluded,'memberSHA256':h.hexdigest(),'first':min(dates) if dates else None,'last':max(dates) if dates else None,'availableDates':sorted(dates),'sources':sources}
  result['members'].append(row);print(path.name,member,count,excluded,flush=True)
 if archive:archive.close()
result['totalInput']=sum(r['input'] for r in result['members']);result['totalOutsidePolygon']=sum(r['outsidePolygon'] for r in result['members'])
out=root/'.checkpoints/south-america/independent-raw.json';out.write_text(json.dumps(result,indent=2))
if '--inventory' not in sys.argv:
 pointer=json.loads((root/'server/data/south-america/active.json').read_text());audit=json.loads((root/'server/data/south-america'/pointer['audit']).read_text());lookup={(r['file'],r['member']):r for r in result['members']}
 for r in audit['deliveries']:
  raw=lookup[(r['file'],r['member'])];assert raw['input']==r['input'],r;assert raw['outsidePolygon']==r['excluded'],r;assert r['input']==r['inserted']+r['duplicates']+r['rejected']+r['excluded'],r
 assert len(audit['deliveries'])==len(result['members'])
 result['reconciledGeneration']=pointer['generation'];out.write_text(json.dumps(result,indent=2));print('INDEPENDENT RECONCILIATION PASS',result['totalInput'])
