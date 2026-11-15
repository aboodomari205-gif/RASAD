"""Read original daily ZIPs independently; compare projected occupancy to HTTP API.
No importer, grid or API implementation code is imported.
"""
import csv, io, json, math, os, urllib.request, zipfile
from pathlib import Path
import sys
sys.path.insert(0, str(Path('.checkpoints/south-america/python').resolve()))
from shapely.geometry import shape, Point

root=Path(__file__).resolve().parents[1]
origin=os.environ.get('RASAD_TEST_ORIGIN','http://localhost:4174')
boundary=json.loads((root/'public/south-america-countries.geojson').read_text())
brazil=shape(next(f['geometry'] for f in boundary['features'] if f['properties']['id']=='bra'))
day='2026-11-13'
points={'MODIS':[], 'VIIRS':[]}
for name in ['MOIDS.zip','viirs.zip','viirs1.zip']:
    with zipfile.ZipFile(root/'server/data/incoming'/name) as archive:
        for member in archive.namelist():
            if not member.lower().endswith(('.csv','.txt')): continue
            with archive.open(member) as raw:
                for row in csv.DictReader(io.TextIOWrapper(raw,encoding='utf-8-sig')):
                    if row.get('acq_date')!=day: continue
                    lon,lat=float(row['longitude']),float(row['latitude'])
                    if not brazil.covers(Point(lon,lat)): continue
                    sensor='MODIS' if row['satellite'] in ('A','T','Terra','Aqua') else 'VIIRS'
                    points[sensor].append((lon,lat))
def cell(lon,lat,size):
    # Formula independently transcribed from the declared method, in metres.
    return (math.floor(6371007.1809*math.radians(lon)*math.cos(math.pi/6)/size),
            math.floor(6371007.1809*math.sin(math.radians(lat))/math.cos(math.pi/6)/size))
url=origin+'/api/south-america/grid?mode=brazil&from='+day+'&to='+day+'&size=2000'
actual=json.load(urllib.request.urlopen(url,timeout=120))
checks=[]
for size in (1000,2000,5000):
    m={cell(x,y,size) for x,y in points['MODIS']}
    v={cell(x,y,size) for x,y in points['VIIRS']}
    expected={'sizeM':size,'modisCells':len(m),'viirsCells':len(v),'intersectionCells':len(m&v),'unionCells':len(m|v)}
    got=next(e for e in actual['sensitivity'] if e['sizeM']==size)
    assert all(got[k]==value for k,value in expected.items()),(expected,got)
    checks.append(expected)
assert actual['coverage']=='unknown' and actual['calibration']=='NOT_CALIBRATED'
csv_url=origin+'/api/observations.csv?mode=brazil&from='+day+'&to='+day
rows=list(csv.DictReader(io.StringIO(urllib.request.urlopen(csv_url,timeout=120).read().decode('utf-8-sig'))))
assert len(rows)==sum(r['count'] for r in actual['rows'])
assert len({r['observation_id'] for r in rows})==len(rows)
assert all(r['timestamp_utc'].startswith(day) and r['processing']=='nrt' and r['source_sha256'] and r['country']=='bra' for r in rows)
assert all(brazil.covers(Point(float(r['longitude']),float(r['latitude']))) for r in rows)
result={'generation':actual['generation'],'method':'Independent original ZIP csv reader, GEOS polygon, mathematical floor projection and HTTP export reconciliation','day':day,'region':'brazil','gridSensitivity':checks,'exportRows':len(rows),'passed':True}
(root/'.checkpoints/rasad/independent-grid.json').write_text(json.dumps(result,indent=2))
print(json.dumps(result,indent=2))
