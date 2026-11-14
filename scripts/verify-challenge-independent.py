import csv,json,sqlite3,hashlib,xml.etree.ElementTree as ET,math
from pathlib import Path
p=json.loads(Path('server/data/active-history.json').read_text());db=Path('server/data')/p['filename'];before=hashlib.sha256(db.read_bytes()).hexdigest()
with sqlite3.connect(db.resolve().as_uri()+'?mode=ro',uri=True)as c: allrows=[json.loads(r[0])for r in c.execute('SELECT observation FROM observations o JOIN datasets d ON d.id=o.dataset_id WHERE d.active=1')]
checked=[]
for region in ['ajloun','northern-jordan']:
 for sensor in ['all','MODIS','VIIRS']:
  stem=Path('.checkpoints/challenge-alignment')/(region+'-'+sensor)
  with stem.with_suffix('.csv').open(encoding='utf-8',newline='')as f: rows=list(csv.DictReader(f))
  expected={o['id']:o for o in allrows if o['regionId']==region and o['utcDate'].startswith('2023-07')and(sensor=='all'or o['sensor']==sensor)}
  assert len(rows)==len(expected);assert set(r['observation_id']for r in rows)==set(expected)
  for r in rows:
   o=expected[r['observation_id']];assert float(r['latitude'])==o['latitude'];assert float(r['longitude'])==o['longitude'];assert r['platform_raw']==str(o['platformRaw']);assert r['activation_revision']==p['revision'];assert r['confidence_raw']==str(o['confidence']['raw'])
  root=ET.parse(stem.with_suffix('.svg')).getroot();m=json.loads(root.find('{http://www.w3.org/2000/svg}metadata').text);assert len(m['sourceIds'])==len(expected);assert set(m['sourceIds'])==set(expected);assert m['coverage']=='unknown';assert len(m['days'])==31
  for d in m['days']:
   for s in d['sources']:
    actual=[o for o in expected.values()if o['utcDate']==d['date']and o['sensor']==s['sensor']];assert s['count']==(len(actual)or None);values=[o['frp']for o in actual if o['frp']is not None];assert s['frpReported']==len(values);assert s['frpSum']is None if not values else math.isclose(s['frpSum'],math.fsum(values),rel_tol=1e-10,abs_tol=1e-8)
  checked.append({'region':region,'sensor':sensor,'rows':len(rows)})
assert hashlib.sha256(db.read_bytes()).hexdigest()==before
Path('.checkpoints/challenge-alignment/independent.json').write_text(json.dumps({'passed':True,'sqliteUnchanged':True,'sha256':before,'scopes':checked},indent=2));print('PASS independent CSV coordinates/IDs/confidence/revision and parsed SVG daily source counts/FRP/missingness for six real scopes; SQLite unchanged.')
