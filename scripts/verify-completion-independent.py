# Independent stdlib verification: no JavaScript methods imported.
import json,sqlite3,hashlib,datetime,math
from pathlib import Path
from collections import Counter
folder=Path('.checkpoints/scientific-completion');r=json.loads((folder/'completion-results.json').read_text(encoding='utf-8-sig'));e=json.loads((folder/'opportunity-discovery.json').read_text(encoding='utf-8-sig'))
pointer=json.loads(Path('server/data/active-history.json').read_text());dbpath=Path('server/data')/pointer['filename'];before=hashlib.sha256(dbpath.read_bytes()).hexdigest()
with sqlite3.connect(dbpath.resolve().as_uri()+'?mode=ro',uri=True)as db: rows=[json.loads(x[0])for x in db.execute('SELECT observation FROM observations o JOIN datasets d ON d.id=o.dataset_id WHERE d.active=1')]
key=lambda o:(o['datasetId'],o['source'],o['sensor'],o['platform'],o['provenance']['product'],o['provenance']['version'],o['provenance']['processing'],o['confidence']['scheme'])
audit=json.loads(Path('docs/SCIENTIFIC_DATA_AUDIT.json').read_text())
comparisons_checked=0
def verify_comparison(c,selected):
 global comparisons_checked
 counts=Counter((key(o),o['utcDate'][:7])for o in selected)
 for s in c['strata']:
  k=tuple(s[n]for n in ['datasetId','source','sensor','platform','product','version','processing','confidenceScheme'])
  for m in s['months']:
   a=counts.get((k,c['first']+'-'+m['month']));b=counts.get((k,c['second']+'-'+m['month']))
   assert (m['first']['count']if m['first']else None)==a;assert(m['second']['count']if m['second']else None)==b
   eligible=k[6]=='standard'and bool(k[3]and k[4]and k[5]and k[1]and k[7]in ['modis-percent','viirs-categorical'])
   assert m['descriptiveDifference']==(b-a if a is not None and b is not None and eligible else None)
   for year,side in [(c['first'],'first'),(c['second'],'second')]:
    actual=m[side];values=[o['frp'] for o in selected if key(o)==k and o['utcDate'][:7]==year+'-'+m['month'] and o['frp']is not None]
    if actual is not None:
     assert actual['frpReported']==len(values)
     assert actual['frpSum']is None if not values else math.isclose(actual['frpSum'],math.fsum(values),rel_tol=1e-10,abs_tol=1e-8)
   assert m['normalizedRate']is None
 assert c['anomaly']is None;comparisons_checked+=1
for region,item in r['regions'].items():
 selected=[o for o in rows if o['regionId']==region];assert len(selected)==item['count']
 verify_comparison(item['comparison'],selected)
 for comparison in audit['regions'][region]['science']['matchedCalendarMonths']:verify_comparison(comparison,selected)
for p in e['products']:
 raw=(folder/(p['shortName']+'-cmr.json')).read_bytes();assert hashlib.sha256(raw).hexdigest()==p['sha256'];original=json.loads(raw)['feed']['entry'];assert {x['id']for x in original}=={g['id']for g in p['granules']}
 for g in p['granules']:
  a=next(x for x in original if x['id']==g['id']);assert(a['time_start'],a['time_end'],a['title'])==(g['start'],g['end'],g['title'])
parse=lambda s:datetime.datetime.fromisoformat(s.replace('Z','+00:00'))
for linked in r['catalog']['observations']:
 o=next(x for x in rows if x['id']==linked['id']);expected=sorted(g['id']for p in e['products']if p['platform']==o['platform']and o['provenance']['processing']=='standard'for g in p['granules']if parse(g['start'])<=parse(o['acquiredAt'])<parse(g['end']))
 assert expected==linked['candidateGranuleIds'];assert linked['lineageVerified']is False
assert hashlib.sha256(dbpath.read_bytes()).hexdigest()==before
(folder/'independent.json').write_text(json.dumps({'passed':True,'sqliteSHA256':before,'catalogRows':len(r['catalog']['observations']),'coverage':None,'sensitivityCalibration':None,'anomaly':None,'comparisonRegions':list(r['regions']),'comparisonsChecked':comparisons_checked},indent=2))
print('PASS independent actual CMR/hash/UTC interval joins and every real 2021/2023 source-month comparison; SQLite unchanged; no opportunity or anomaly invented.')
