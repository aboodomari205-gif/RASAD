"""Independent period/rank verification from immutable raw SQLite, not JS summaries."""
import json,sqlite3,hashlib,math,statistics
from collections import defaultdict
from pathlib import Path
pointer=json.loads(Path('server/data/active-history.json').read_text());file=Path('server/data')/pointer['filename'];before=hashlib.sha256(file.read_bytes()).hexdigest()
with sqlite3.connect(file.resolve().as_uri()+'?mode=ro',uri=True)as db:
 records=[json.loads(r[0])for r in db.execute('SELECT observation FROM observations o JOIN datasets d ON d.id=o.dataset_id WHERE d.active=1')]
 datasets={json.loads(r[0])['id']:json.loads(r[0])for r in db.execute('SELECT descriptor FROM datasets WHERE active=1')}
audit=json.loads(Path('docs/SCIENTIFIC_DATA_AUDIT.json').read_text())
reference=json.loads(Path('.checkpoints/core-completion/periods.json').read_text());results={};checks=0
for region,value in reference.items():
 status=audit['regions'][region]['science']['harmonizationStatus'];assert status['structuralIntegration']=='implemented';assert status['sensorIndependentSeries']=='unavailable';assert status['equivalentActivity']is None;assert status['calibrated']is False
 audit_periods={(s['key'],p['period']):p for s in audit['regions'][region]['science']['observedPeriodExploration']['strata']for p in s['periods']}
 selected=[o for o in records if o['regionId']==region];assert len(selected)==value['count'];groups=defaultdict(lambda:defaultdict(list))
 for o in selected:
  k=(o['datasetId'],o['source'],o['sensor'],o['platform'],o['provenance']['product'],o['provenance']['version'],o['provenance']['processing'],o['confidence']['scheme']);groups[k][o['utcDate'][:7]].append(o)
 for setting,analysis in value['settings'].items():
  minimum=int(setting);assert analysis['parameters']['minimumReferenceYears']==minimum;assert analysis['calibrated']is False;assert analysis['validatedAnomaly']is None;assert analysis['coverage']=='unknown';assert analysis['forecast']is None
  assert len(analysis['strata'])==len(groups)
  for s in analysis['strata']:
   k=tuple(json.loads(s['key']));periods=groups[k];d=datasets.get(k[0]);eligible=bool(k[6]=='standard'and d and d['regionId']==region and d['kind']=='archive'and d['source']==k[1]and d.get('sensor')==k[2]and d.get('processing')==k[6]and d.get('product')==k[4]and(not d.get('platform')or d['platform']==k[3])and all(k[i]for i in[1,3,4,5])and((k[2]=='MODIS'and k[7]=='modis-percent')or(k[2]=='VIIRS'and k[7]=='viirs-categorical')))
   assert s['eligible']==eligible;assert s['observedMonthCount']==len(periods);assert s['observedYears']==sorted(set(p[:4]for p in periods));assert len(s['periods'])==len(periods)
   for p in s['periods']:
    period=p['period'];rows=periods[period];n=len(rows);assert p['count']==n;values=[o['frp']for o in rows if o['frp']is not None];assert p['frpReported']==len(values);assert p['frpSum']is None if not values else math.isclose(p['frpSum'],math.fsum(values),rel_tol=1e-10,abs_tol=1e-8)
    ref=[{'period':x,'count':len(periods[x])}for x in sorted(periods)if x<period and x[5:]==period[5:]];assert p['reference']==ref;assert p['referenceCount']==len(ref)
    known=set(int(x['period'][:4])for x in ref);assert p['unrepresentedPriorYears']==[y for y in range(min(int(x[:4])for x in periods),int(period[:4]))if y not in known]
    maximum=max((x['count']for x in ref),default=None);supported=eligible and len(ref)>=minimum;assert p['referenceMaximum']==maximum
    median=statistics.median(x['count']for x in ref)if supported else None;assert p['referenceMedian']==median;assert p['differenceFromReferenceMedian']==(n-median if supported else None);assert p['medianSupport']==(len(ref)if supported else None)
    if minimum==3:
     exported=audit_periods[s['key'],period];assert exported['referenceMedian']==median;assert exported['differenceFromReferenceMedian']==(n-median if supported else None)
    assert p['rank']==(1+sum(x['count']>n for x in ref)if supported else None);assert p['rankDenominator']==(len(ref)+1 if supported else None);assert p['tiedReferenceCount']==sum(x['count']==n for x in ref)
    assert p['higherThanPriorObservedMaximum']==bool(supported and n>maximum);assert p['differenceFromReferenceMaximum']==(n-maximum if supported else None)
    assert p['criticalRank']==(1+sum(len(x)>n for x in periods.values())if eligible else None);assert p['criticalDenominator']==(len(periods)if eligible else None);assert p['validatedAnomaly']is None;checks+=1
 base=value['analysis'];results[region]={'observations':len(selected),'sourceStrata':len(groups),'supportedMonths':sum(p['status']=='descriptive-supported'for s in base['strata']for p in s['periods']),'higherMonths':sum(p['higherThanPriorObservedMaximum']for s in base['strata']for p in s['periods'])}
assert hashlib.sha256(file.read_bytes()).hexdigest()==before
Path('.checkpoints/core-completion/independent.json').write_text(json.dumps({'passed':True,'monthlyChecks':checks,'minimumSettings':[3,4,5,6],'sqliteSHA256':before,'unchanged':True,'regions':results},indent=2));print('PASS independent actual source/month counts, FRP, prior references, ties, ranks, eligibility, odd/even descriptive medians and exported scientific status, null anomalies and four support policies:',checks)
