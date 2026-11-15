"""Bounded, resumable FIRMS ingestion. Install numpy/shapely; originals never modified.
Stores compressed 2,000-row chunks, exact identity index and source-stratified summaries.
No raster opportunity, zero observations, calibration or fires are inferred.
"""
import argparse, csv, datetime as dt, hashlib, io, json, math, sqlite3, sys, zipfile, zlib
from collections import defaultdict, Counter
from pathlib import Path

sys.path.insert(0, str(Path('.checkpoints/south-america/python').resolve()))
import numpy as np
import shapely
from shapely.geometry import shape

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'server/data/south-america'
BATCH = 2000
R = 6371007.1809  # authalic sphere; cylindrical equal area, standard parallel 30 degrees

def sha(path):
    h = hashlib.sha256()
    with path.open('rb') as f:
        for b in iter(lambda: f.read(1024*1024), b''): h.update(b)
    return h.hexdigest()

def dumps(value): return json.dumps(value, separators=(',', ':'), ensure_ascii=True)

def main():
    global ROOT, OUT
    ap = argparse.ArgumentParser(); ap.add_argument('--nrt-only', action='store_true'); ap.add_argument('--workspace',type=Path); args = ap.parse_args()
    if args.workspace: ROOT=args.workspace.resolve(); OUT=ROOT/'server/data/south-america'
    OUT.mkdir(parents=True, exist_ok=True)
    boundary = ROOT / 'public/south-america-countries.geojson'
    features = json.loads(boundary.read_text())['features']
    polygons = [(f['properties']['id'], shape(f['geometry'])) for f in features]
    for _,polygon in polygons: shapely.prepare(polygon)
    files = []
    for base in [ROOT/'data/incoming', ROOT/'server/data/incoming']:
        if not base.exists(): continue
        for p in sorted(base.rglob('*')):
            if not p.is_file() or p.suffix.lower() not in ('.zip','.csv','.txt'): continue
            if 'historical' in p.parts:
                if not args.nrt_only: files.append(p)
            elif p.name in ('MOIDS.zip','viirs.zip','viirs1.zip') or 'South_America' in p.name: files.append(p)
    inventory = [{'file': str(p.relative_to(ROOT)).replace('\\','/'), 'sha256':sha(p), 'bytes':p.stat().st_size} for p in files]
    generation = hashlib.sha256(dumps({'inputs':inventory,'boundary':sha(boundary),'schema':2}).encode()).hexdigest()[:16]
    pointer=OUT/'active.json'
    if pointer.exists():
        active=json.loads(pointer.read_text())
        if active.get('generation')==generation and (OUT/active['filename']).is_file() and (OUT/active['audit']).is_file():
            print('UNCHANGED',generation,'input SHA-256 and boundary match active generation',flush=True)
            return
    # Dedicated generation; never opens or mutates a previous Jordan database.
    target=OUT/(generation+'.sqlite')
    if not target.exists() and pointer.exists():
        previous=json.loads(pointer.read_text());previous_audit=json.loads((OUT/previous['audit']).read_text())
        before={(r['file'],r['sha256']) for r in previous_audit['inputs']};after={(r['file'],r['sha256']) for r in inventory}
        if before.issubset(after) and previous_audit.get('boundarySHA256')==sha(boundary):
            with sqlite3.connect(OUT/previous['filename']) as source, sqlite3.connect(target) as destination:
                source.backup(destination,pages=16384)
            print('REUSED unchanged verified deliveries from',previous['generation'],flush=True)
    db = sqlite3.connect(target)
    db.executescript('''PRAGMA journal_mode=WAL; PRAGMA synchronous=NORMAL; PRAGMA cache_size=-1048576;
      CREATE TABLE IF NOT EXISTS seen(id BLOB PRIMARY KEY) WITHOUT ROWID;
      CREATE TABLE IF NOT EXISTS datasets(id TEXT PRIMARY KEY, descriptor TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS deliveries(id TEXT PRIMARY KEY, metadata TEXT NOT NULL, report TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS chunks(id INTEGER PRIMARY KEY, dataset TEXT, date TEXT, country TEXT, count INTEGER, payload BLOB);
      CREATE INDEX IF NOT EXISTS chunk_scope ON chunks(date,country,dataset);
      CREATE TABLE IF NOT EXISTS quarantine(delivery TEXT,line INTEGER,reason TEXT,raw TEXT);
      CREATE TABLE IF NOT EXISTS daily(dataset TEXT,date TEXT,country TEXT,count INTEGER,frp REAL,frp_reported INTEGER,grid1 INTEGER,grid2 INTEGER,grid5 INTEGER,PRIMARY KEY(dataset,date,country)) WITHOUT ROWID;
    ''')
    known_datasets=set(r[0] for r in db.execute('SELECT id FROM datasets'))
    report = {'schema':'firepulse.south-america-audit/v2','generation':generation,'inputs':inventory,'boundarySHA256':sha(boundary),'deliveries':[], 'coverage':'unknown','calibration':'NOT_CALIBRATED'}
    for path, inv in zip(files, inventory):
        archive = zipfile.ZipFile(path) if path.suffix.lower()=='.zip' else None
        members = [m.filename for m in archive.infolist() if not m.is_dir() and m.filename.lower().endswith(('.csv','.txt'))] if archive else [path.name]
        for member in members:
            if Path(member).name.lower().startswith('readme'): continue
            key = inv['sha256']+':'+member
            old = db.execute('SELECT report FROM deliveries WHERE id=?',(key,)).fetchone()
            if old: report['deliveries'].append(json.loads(old[0])); print('RESUME',member,flush=True); continue
            stream = archive.open(member) if archive else path.open('rb')
            signature=stream.read(4);stream.seek(0)
            encoding='utf-16' if signature.startswith((b'\xff\xfe',b'\xfe\xff')) else 'utf-8-sig'
            # Detect documented Unicode BOMs. Other invalid encodings fail atomically, never replacement-decode.
            text = io.TextIOWrapper(stream,encoding=encoding,newline='')
            reader = csv.DictReader(text)
            headers = reader.fieldnames or []
            required = {'latitude','longitude','acq_date','acq_time','satellite','confidence','version','frp'}
            if not required.issubset(headers): raise ValueError('Unsupported schema: '+member)
            delivery = {'source_file':path.name,'member':member,'sha256':inv['sha256'],'headers':headers,'encoding':encoding,'generation':generation}
            stats = {'file':path.name,'member':member,'input':0,'inserted':0,'duplicates':0,'excluded':0,'rejected':0,'first':None,'last':None,'extent':[180,90,-180,-90],'sources':{},'dates':[]}
            member_hash=hashlib.sha256(); dates=set(); source_counts=Counter()
            db.execute('BEGIN')
            def process(batch):
                validated=[]
                for line, raw in batch:
                    stats['input']+=1
                    try:
                        if None in raw or any(v is None for v in raw.values()): raise ValueError('column count')
                        lon,lat=float(raw['longitude']),float(raw['latitude'])
                        if not math.isfinite(lon+lat) or abs(lon)>180 or abs(lat)>90: raise ValueError('coordinates')
                        date=dt.date.fromisoformat(raw['acq_date']).isoformat()
                        hhmm=raw['acq_time'].replace(':','').zfill(4)
                        if len(hhmm)!=4 or int(hhmm[:2])>23 or int(hhmm[2:])>59: raise ValueError('UTC time')
                        platform={'T':'Terra','A':'Aqua','N':'S-NPP','SNPP':'S-NPP','N20':'NOAA-20','N21':'NOAA-21'}.get(raw['satellite'],raw['satellite'])
                        if platform not in ('Terra','Aqua','S-NPP','NOAA-20','NOAA-21'): raise ValueError('platform')
                        sensor='MODIS' if platform in ('Terra','Aqua') else 'VIIRS'
                        if raw.get('instrument',sensor) not in (sensor,'SNPP'): raise ValueError('sensor conflict')
                        processing='nrt' if 'NRT' in raw['version'].upper() else 'standard'
                        if raw['version'] not in (('6.1NRT','6.03','61.03') if sensor=='MODIS' else ('2','2.0','2.0NRT')): raise ValueError('unsupported collection')
                        if sensor=='MODIS':
                            conf=float(raw['confidence'])
                            if not 0<=conf<=100: raise ValueError('confidence')
                        elif raw['confidence'].lower() not in ('l','n','h','low','nominal','high'): raise ValueError('confidence')
                        frp=float(raw['frp']) if raw['frp'] else None
                        if frp is not None and (not math.isfinite(frp) or frp<0): raise ValueError('FRP')
                        if raw.get('daynight') not in (None,'','D','N'): raise ValueError('daynight')
                        family={'Terra':'MODIS','Aqua':'MODIS','S-NPP':'SNPP','NOAA-20':'N20','NOAA-21':'N21'}[platform]
                        product=({'MODIS':'MCD14DL_NRT','SNPP':'VNP14IMGTDL_NRT','N20':'VJ114IMGTDL_NRT','N21':'VJ214IMGTDL_NRT'} if processing=='nrt' else {'MODIS':'FIRMS M-C61 archive','SNPP':'FIRMS SV-C2 archive','N20':'FIRMS J1V-C2 archive','N21':'FIRMS J2V-C2 archive'})[family]
                        ds='sa-'+family.lower()+'-'+platform.lower().replace('-','')+'-'+processing
                        descriptor={'id':ds,'title':platform+' '+sensor+' '+processing,'regionId':'south-america','kind':'archive','source':'NASA FIRMS','sensor':sensor,'platform':platform,'product':product,'version':'6.1' if sensor=='MODIS' else '2','processing':processing,'deliveryProfile':family,'partial':False,'fieldSemantics':{'brightness':'Preserved original column label; export channel aliases are not assumed','collection':'Delivery family M-C61 or VIIRS C2; raw version separately preserved'}}
                        if ds not in known_datasets:
                            db.execute('INSERT OR IGNORE INTO datasets VALUES(?,?)',(ds,dumps(descriptor)));known_datasets.add(ds)
                        timestamp=date+'T'+hhmm[:2]+':'+hhmm[2:]+':00.000Z'
                        # Exact raw values excluding channel aliases and delivery location; normalized confidence only for identity.
                        identity=[sensor,platform,processing,descriptor['version'],timestamp,lon,lat,(raw['confidence'] if sensor=='MODIS' else raw['confidence'].lower()[0]),frp,raw.get('scan'),raw.get('track'),raw.get('daynight'),raw.get('bright_ti4',raw.get('brightness')),raw.get('bright_ti5',raw.get('bright_t31'))]
                        oid=hashlib.sha256(dumps(identity).encode()).digest()[:20]
                        validated.append((line,raw,lon,lat,date,timestamp,ds,oid,frp,platform))
                    except (ValueError,TypeError,OverflowError) as error:
                        stats['rejected']+=1;db.execute('INSERT INTO quarantine VALUES(?,?,?,?)',(key,line,str(error),dumps(raw)))
                if not validated:return
                points=shapely.points(np.array([[r[2],r[3]] for r in validated]))
                countries=[None]*len(validated)
                for country,polygon in polygons:
                    mask=shapely.covers(polygon,points)
                    for i in np.flatnonzero(mask):
                        if countries[i] is None: countries[i]=country
                grouped=defaultdict(list)
                for r,country in zip(validated,countries):
                    line,raw,lon,lat,date,timestamp,ds,oid,frp,platform=r
                    if country is None:stats['excluded']+=1;continue
                    inserted=db.execute('INSERT OR IGNORE INTO seen VALUES(?)',(oid,)).rowcount
                    if not inserted:stats['duplicates']+=1;continue
                    stats['inserted']+=1;dates.add(date);source_counts[ds]+=1
                    stats['first']=min(stats['first'] or date,date);stats['last']=max(stats['last'] or date,date)
                    ext=stats['extent'];ext[0]=min(ext[0],lon);ext[1]=min(ext[1],lat);ext[2]=max(ext[2],lon);ext[3]=max(ext[3],lat)
                    grouped[(ds,date,country)].append([oid.hex(),lon,lat,timestamp,[raw.get(h,'') for h in headers],key,line])
                for (ds,date,country),rows in grouped.items():
                    db.execute('INSERT INTO chunks(dataset,date,country,count,payload) VALUES(?,?,?,?,?)',(ds,date,country,len(rows),zlib.compress(dumps(rows).encode(),3)))
            batch=[]
            try:
                for line,raw in enumerate(reader,2):
                    batch.append((line,raw))
                    if len(batch)>=BATCH:
                        process(batch);batch=[]
                        if stats['input']%200000==0:print(member,stats['input'],'accepted',stats['inserted'],flush=True)
                process(batch)
                stats['sources']=dict(source_counts);stats['dates']=sorted(dates)
                db.execute('INSERT INTO deliveries VALUES(?,?,?)',(key,dumps(delivery),dumps(stats)));db.commit()
                report['deliveries'].append(stats);print('IMPORTED',member,dumps(stats),flush=True)
            except BaseException:db.rollback();raise
            finally:text.close()
        if archive:archive.close()
    # Recompute daily exact unique cells with bounded memory (one UTC day at a time).
    delivery_headers={k:json.loads(v)['headers'] for k,v in db.execute('SELECT id,metadata FROM deliveries')}
    days=[r[0] for r in db.execute('SELECT DISTINCT date FROM chunks ORDER BY date')]
    dirty=[r[0] for r in db.execute('SELECT date FROM chunks GROUP BY date HAVING sum(count) != coalesce((SELECT sum(count) FROM daily WHERE daily.date=chunks.date),0) ORDER BY date')]
    for day in dirty:
        db.execute('DELETE FROM daily WHERE date=?',(day,))
        groups={}
        for ds,country,payload in db.execute('SELECT dataset,country,payload FROM chunks WHERE date=?',(day,)):
            g=groups.setdefault((ds,country),[0,0.,0,set(),set(),set()])
            for row in json.loads(zlib.decompress(payload)):
                _,lon,lat,_,values,delivery,_=row;raw=dict(zip(delivery_headers[delivery],values));g[0]+=1
                if raw['frp']:g[1]+=float(raw['frp']);g[2]+=1
                x=R*math.radians(lon)*math.cos(math.pi/6);y=R*math.sin(math.radians(lat))/math.cos(math.pi/6)
                for i,size in enumerate((1000,2000,5000)):g[i+3].add((math.floor(x/size),math.floor(y/size)))
        db.executemany('INSERT INTO daily VALUES(?,?,?,?,?,?,?,?,?)',[(ds,day,c,g[0],g[1] if g[2] else None,g[2],len(g[3]),len(g[4]),len(g[5])) for (ds,c),g in groups.items()]);db.commit()
    report['total']=db.execute('SELECT count(*) FROM seen').fetchone()[0]
    report['sourceCounts']={d:c for d,c in db.execute('SELECT dataset,sum(count) FROM chunks GROUP BY dataset')}
    report['historicalSNPPSupplied']=any('snpp' in d for d in report['sourceCounts'])
    report['observedExtent']=[days[0],days[-1]] if days else []
    report['missingInputPeriods']='Detection dates do not establish complete deliveries or observation opportunity.'
    db.execute('PRAGMA wal_checkpoint(TRUNCATE)');db.close()
    (OUT/(generation+'-audit.json')).write_text(json.dumps(report,indent=2))
    (OUT/'active.json.tmp').write_text(dumps({'generation':generation,'filename':generation+'.sqlite','audit':generation+'-audit.json'}))
    (OUT/'active.json.tmp').replace(OUT/'active.json')
    print('ACTIVATED',generation,report['total'],flush=True)

if __name__=='__main__':main()
