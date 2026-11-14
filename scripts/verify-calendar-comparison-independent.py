import json,sqlite3,hashlib,statistics
from pathlib import Path
from collections import defaultdict
p=json.loads(Path('server/data/active-history.json').read_text());f=Path('server/data')/p['filename'];before=hashlib.sha256(f.read_bytes()).hexdigest()
with sqlite3.connect(f.resolve().as_uri()+'?mode=ro',uri=True)as db:records=[json.loads(r[0])for r in db.execute('SELECT observation FROM observations o JOIN datasets d ON d.id=o.dataset_id WHERE d.active=1')];datasets={json.loads(r[0])['id']:json.loads(r[0])for r in db.execute('SELECT descriptor FROM datasets WHERE active=1')}
x=json.loads(Path('.checkpoints/harmonization-final/comparisons.json').read_text());checks=0
for region,reports in x.items():
 groups=defaultdict(lambda:defaultdict(int))
 for o in records:
  if o['regionId']!=region:continue
  k=(o['datasetId'],o['source'],o['sensor'],o['platform'],o['provenance']['product'],o['provenance']['version'],o['provenance']['processing'],o['confidence']['scheme']);groups[k][o['utcDate'][:7]]+=1
 for report in reports:
  assert report['sensorIndependentActivity']is None and report['sensorAttributedChange']is None and report['calibrated']is False
  assert len(report['rows'])==len(groups)
  for r in report['rows']:
   k=tuple(json.loads(r['key']));months=groups[k];period=report['period'];assert r['count']==months.get(period);refs=[{'period':m,'count':n}for m,n in sorted(months.items())if m<period and m[5:]==period[5:]]if period in months else [];assert r['reference']==refs
   d=datasets[k[0]];eligible=k[6]=='standard'and d['kind']=='archive'and d['source']==k[1]and d['regionId']==region and d.get('sensor')==k[2]and d.get('product')==k[4]and d.get('processing')==k[6]and(not d.get('platform')or d['platform']==k[3])and all(k[i]for i in [1,3,4,5])and k[7]==('modis-percent'if k[2]=='MODIS'else'viirs-categorical');status='unknown-period'if period not in months else'ineligible-source'if not eligible else'descriptive-supported'if len(refs)>=3 else'insufficient-history';assert r['status']==status;assert r['referenceCount']==(len(refs)if period in months else None)
   expected=statistics.median(p['count']for p in refs)if status=='descriptive-supported'else None;assert r['referenceMedian']==expected;assert r['differenceFromReferenceMedian']==(months[period]-expected if expected is not None else None)
   annual=defaultdict(int)
   for m,n in months.items():annual[m[:4]]+=n
   assert r['peakYears']==([{'year':y,'count':n}for y,n in sorted(annual.items())if n==max(annual.values())]if eligible else[])
   assert r['peakPeriods']==([{'period':m,'count':n}for m,n in sorted(months.items())if n==max(months.values())]if eligible else[])
   checks+=1
assert hashlib.sha256(f.read_bytes()).hexdigest()==before
print('PASS independent calendar source/month counts, prior medians, missingness, yearly/monthly peaks and null attribution:',checks,'rows; SQLite unchanged',before)
