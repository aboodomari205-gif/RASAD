"""Independent read-only SQLite/stdlib reconciliation; no JS aggregation reuse."""
import json,sqlite3,hashlib,math
from collections import Counter
from pathlib import Path
pointer=json.loads(Path('server/data/active-history.json').read_text())
with sqlite3.connect((Path('server/data')/pointer['filename']).resolve().as_uri()+'?mode=ro',uri=True) as db:
 rows=[json.loads(r[0]) for r in db.execute('SELECT observation FROM observations o JOIN datasets d ON d.id=o.dataset_id WHERE d.active=1')]
reference=json.loads(Path('docs/SCIENTIFIC_DATA_AUDIT.json').read_text())
results={}
for region,result in reference['regions'].items():
 selected=[o for o in rows if o['regionId']==region]
 assert len(selected)==result['uniqueDelivered']
 for length in [4,7,10]:
  expected=Counter((o['datasetId'],o['sensor'],o['platform'],o['provenance']['processing'],o['provenance']['version'],o['utcDate'][:length]) for o in selected)
  actual=Counter({(s['datasetId'],s['sensor'],s['platform'],s['processing'],s['version'],s['period']):s['count'] for s in result['science']['temporal']['series'] if len(s['period'])==length})
  assert expected==actual
  frp={}
  for o in selected:
   key=(o['datasetId'],o['sensor'],o['platform'],o['provenance']['processing'],o['provenance']['version'],o['utcDate'][:length]);frp.setdefault(key,[])
   if o['frp'] is not None:frp[key].append(o['frp'])
  for bucket in result['science']['temporal']['series']:
   if len(bucket['period'])!=length:continue
   key=(bucket['datasetId'],bucket['sensor'],bucket['platform'],bucket['processing'],bucket['version'],bucket['period']);values=frp[key]
   assert bucket['frpReported']==len(values)
   assert bucket['frpSum'] is None if not values else math.isclose(bucket['frpSum'],math.fsum(values),rel_tol=1e-10,abs_tol=1e-8)

 expected_seasons=Counter()
 for o in selected:
  y=int(o['utcDate'][:4]);m=int(o['utcDate'][5:7]);season='DJF' if m==12 or m<=2 else 'MAM' if m<=5 else 'JJA' if m<=8 else 'SON';period=str(y+1 if m==12 else y)+'-'+season
  stratum=(o['regionId'],o['datasetId'],o['source'],o['sensor'],o['platform'],o['provenance']['product'],o['provenance']['version'],o['provenance']['processing'],o['confidence']['scheme'])
  expected_seasons[(stratum,period)]+=1
 assert expected_seasons==Counter({(tuple(json.loads(b['stratum'])),b['period']):b['count'] for b in result['science']['seasonal']})
 periods={}
 for month in ['2020-10','2021-07','2023-07','2026-09']:
  samples=[o for o in selected if o['utcDate'].startswith(month)]
  periods[month]={'delivered':len(samples),'bySensor':dict(Counter(o['sensor'] for o in samples)),'byProcessing':dict(Counter(o['provenance']['processing'] for o in samples))}
 # Independent exhaustive verification on actual Ajloun and selected North years.
 samples=selected if region=='ajloun' else [o for o in selected if o['utcDate'].startswith('2023')]
 from datetime import datetime
 def stamp(o):return datetime.fromisoformat(o['acquiredAt'].replace('Z','+00:00')).timestamp() if o['acquiredAt'] else None
 def distance(a,b):
  p,q=math.radians(a['latitude']),math.radians(b['latitude']);h=math.sin((q-p)/2)**2+math.cos(p)*math.cos(q)*math.sin(math.radians(b['longitude']-a['longitude'])/2)**2
  return 6371.0088*2*math.asin(math.sqrt(min(1,h)))
 brute=[]
 for a in [o for o in samples if o['sensor']=='MODIS']:
  for b in [o for o in samples if o['sensor']=='VIIRS']:
   if a['provenance']['processing']==b['provenance']['processing'] and stamp(a) is not None and stamp(b) is not None and abs(stamp(a)-stamp(b))<=3600 and distance(a,b)<=1:brute.append((a['id'],b['id']))
 sample_ids={o['id'] for o in samples}
 actual={(p['modisId'],p['viirsId']) for p in result['science']['association']['pairs'] if p['modisId'] in sample_ids and p['viirsId'] in sample_ids}
 assert actual==set(brute)
 results[region]={'count':len(selected),'selectedObservedMonths':periods,'independentBaselinePairCheck':len(brute),'checkedScope':'all delivered' if region=='ajloun' else '2023'}
Path('docs/SCIENTIFIC_INDEPENDENT_CHECK.json').write_text(json.dumps({'method':'Python stdlib counters and exhaustive Haversine/UTC matching; detection-only','regions':results},indent=2))
print(json.dumps(results))
