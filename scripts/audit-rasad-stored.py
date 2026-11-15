"""Independent full scan of activated compressed records and daily summaries.
Uses no importer/API modules. Bounded by one stored chunk plus daily counters.
"""
import collections, json, math, sqlite3, sys, zlib
from pathlib import Path
sys.path.insert(0,str(Path('.checkpoints/south-america/python').resolve()))
import shapely
from shapely.geometry import shape

root=Path(__file__).resolve().parents[1]
data=root/'server/data/south-america'
active=json.loads((data/'active.json').read_text())
audit=json.loads((data/active['audit']).read_text())
assert all(any(Path(r['file']).name==name for r in audit['inputs']) for name in ['DL_FIRE_J1V-C2_847873old.zip','DL_FIRE_J2V-C2_847874old.zip','DL_FIRE_M-C61_847869old.zip']),'Full historical generation must be active'
db=sqlite3.connect('file:'+str(data/active['filename'])+'?mode=ro',uri=True)
polygons={f['properties']['id']:shape(f['geometry']) for f in json.loads((root/'public/south-america-countries.geojson').read_text())['features']}
for p in polygons.values(): shapely.prepare(p)
headers={k:{h:i for i,h in enumerate(json.loads(v)['headers'])} for k,v in db.execute('SELECT id,metadata FROM deliveries')}
datasets={k:json.loads(v) for k,v in db.execute('SELECT id,descriptor FROM datasets')}
counts=collections.Counter();frp=collections.defaultdict(float);reported=collections.Counter()
total=0;jordan=0;extent=[180,90,-180,-90]
for dataset,date,country,count,payload in db.execute('SELECT dataset,date,country,count,payload FROM chunks ORDER BY id'):
    rows=json.loads(zlib.decompress(payload));assert len(rows)==count
    points=shapely.points([(r[1],r[2]) for r in rows]);assert bool(shapely.covers(polygons[country],points).all()),(dataset,date,country)
    key=(dataset,date,country);counts[key]+=count
    for identifier,lon,lat,timestamp,values,delivery,line in rows:
        h=headers[delivery];assert values[h['acq_date']]==date==timestamp[:10]
        assert float(values[h['longitude']])==lon and float(values[h['latitude']])==lat
        assert values[h['acq_time']].replace(':','').zfill(4)==timestamp[11:16].replace(':','')
        assert len(identifier)==40 and line>=2
        assert ('NRT' in values[h['version']].upper())==(datasets[dataset]['processing']=='nrt')
        if values[h['frp']]:frp[key]+=float(values[h['frp']]);reported[key]+=1
        # Jordan's full geographic extent is positive longitude; also assert
        # continent membership independently above, rather than using a bbox.
        if 34<=lon<=40 and 29<=lat<=34:jordan+=1
        extent=[min(extent[0],lon),min(extent[1],lat),max(extent[2],lon),max(extent[3],lat)]
    total+=count
    if total%1000000<count:print('VERIFIED',total,flush=True)
daily=list(db.execute('SELECT dataset,date,country,count,frp,frp_reported FROM daily'))
assert len(daily)==len(counts)
for dataset,date,country,n,power,reported_count in daily:
    key=(dataset,date,country);assert n==counts[key];assert reported_count==reported[key]
    assert (power is None)==(reported_count==0)
    if power is not None:assert math.isclose(power,frp[key],rel_tol=1e-10,abs_tol=1e-7)
assert total==audit['total']==db.execute('SELECT count(*) FROM seen').fetchone()[0]
assert jordan==0
overlap=[]
for platform in {d['platform'] for d in datasets.values()}:
    a={date for ds,date,_ in counts if datasets[ds]['platform']==platform and datasets[ds]['processing']=='standard'}
    b={date for ds,date,_ in counts if datasets[ds]['platform']==platform and datasets[ds]['processing']=='nrt'}
    if a&b:overlap.append({'platform':platform,'dates':sorted(a&b)})
assert not overlap,'Processing overlap requires lineage reconciliation before combined accounting'
result={'generation':active['generation'],'storedRows':total,'dailyGroups':len(counts),'activeJordanRows':jordan,'geographicExtent':extent,'standardNrtOverlapDates':overlap,'polygonClipping':'Every stored row independently checked against its assigned country polygon','utcAndRawCoordinates':'Every stored row checked against its preserved source values','dailyCountsAndFrp':'All daily groups reconciled from actual stored rows','passed':True}
(root/'.checkpoints/rasad/stored-audit.json').write_text(json.dumps(result,indent=2))
print(json.dumps(result,indent=2))
