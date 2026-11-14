"""Independent Python ray-casting reconciliation of staged CSVs; no imports or source writes."""
import csv, hashlib, json
from collections import Counter
from pathlib import Path

def ring_contains(x, y, ring):
    inside = False
    for (ax, ay), (bx, by) in zip(ring, ring[1:] + ring[:1]):
        cross = (x-ax)*(by-ay)-(y-ay)*(bx-ax)
        if abs(cross) < 1e-12 and min(ax,bx)-1e-12 <= x <= max(ax,bx)+1e-12 and min(ay,by)-1e-12 <= y <= max(ay,by)+1e-12:
            return True
        if (ay > y) != (by > y) and x < (bx-ax)*(y-ay)/(by-ay)+ax:
            inside = not inside
    return inside

def contains(x, y, geometry):
    polygons = [geometry['coordinates']] if geometry['type'] == 'Polygon' else geometry['coordinates']
    return any(ring_contains(x,y,p[0]) and not any(ring_contains(x,y,h) for h in p[1:]) for p in polygons)

members = {f['properties']['shapeName']: f['geometry'] for f in json.loads(Path('public/jordan-adm1.geojson').read_text())['features'] if f['properties']['shapeName'] in ['Irbid','Ajloun','Jerash','Mafraq']}
north = json.loads(Path('public/northern-jordan.geojson').read_text())['features'][0]['geometry']
regions = {'ajloun': members['Ajloun'], 'northern-jordan': north}
result = {region: {'count':0, 'platformYearProcessing':Counter(), 'governorates':Counter(), 'governoratePlatformYearProcessing':Counter(), 'dates':[], 'members':[]} for region in regions}
input_count = 0
for delivery in json.loads(Path('server/data/historical-staging/delivery-audit.json').read_text()):
    raw = (Path('server/data/historical-staging') / delivery['member']).read_bytes()
    assert hashlib.sha256(raw).hexdigest() == delivery['csvSHA256']
    rows = list(csv.DictReader(raw.decode('utf-8-sig').splitlines()))
    assert len(rows) == delivery['rows']
    input_count += len(rows)
    processing = 'nrt' if delivery['member'].startswith('fire_nrt') else 'standard'
    for region, geometry in regions.items():
        selected = [r for r in rows if contains(float(r['longitude']),float(r['latitude']),geometry)]
        result[region]['members'].append({'member':delivery['member'],'input':len(rows),'inside':len(selected),'excluded':len(rows)-len(selected)})
        result[region]['count'] += len(selected)
        for row in selected:
            result[region]['platformYearProcessing'][row['satellite']+'/'+row['acq_date'][:4]+'/'+processing] += 1
            result[region]['dates'].append(row['acq_date'])
            for governorate, boundary in members.items():
                if contains(float(row['longitude']),float(row['latitude']),boundary):
                    result[region]['governorates'][governorate] += 1
                    result[region]['governoratePlatformYearProcessing'][governorate+'/'+row['satellite']+'/'+row['acq_date'][:4]+'/'+processing] += 1
for value in result.values():
    dates = value.pop('dates');value['firstDate']=min(dates);value['lastDate']=max(dates)
assert input_count == 19324
assert result['ajloun']['count'] == 143 and result['northern-jordan']['count'] == 6859
assert sum(result['northern-jordan']['governorates'].values()) == result['northern-jordan']['count']
overlap = {}
for family, expected in [('M-C61',19), ('SV-C2',128)]:
    previous = list(Path('server/data/archives').glob('fire_archive_'+family+'_*.csv'))
    assert len(previous) == 1
    old_rows = list(csv.DictReader(previous[0].read_text(encoding='utf-8-sig').splitlines()))
    current = next(Path('server/data/historical-staging').glob('fire_archive_'+family+'_*.csv'))
    new_rows = list(csv.DictReader(current.read_text(encoding='utf-8-sig').splitlines()))
    signature = lambda row: tuple(sorted(row.items()))
    signatures = set(map(signature,new_rows))
    matched = sum(signature(row) in signatures for row in old_rows)
    assert matched == len(old_rows) == expected
    overlap[previous[0].name] = {'inputRows':len(old_rows),'identicalRowsInNewDelivery':matched}
Path('server/data/historical-independent-audit.json').write_text(json.dumps({'inputCount':input_count,'previousDeliveryOverlap':overlap,'regions':result},indent=2),encoding='utf-8')
print('Independent reconciliation PASS: 19324 inputs; Ajloun 143; Northern Jordan 6859.')
