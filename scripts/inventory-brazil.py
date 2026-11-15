"""Read-only, Brazil-only summary inventory; no raw dataset rewrite."""
import json
import sqlite3
from pathlib import Path

root = Path(__file__).resolve().parents[1]
store = root / 'server/data/south-america'
active = json.loads((store / 'active.json').read_text())
db = sqlite3.connect('file:' + (store / active['filename']).as_posix() + '?mode=ro', uri=True)
sources = [dict(zip(['dataset', 'count', 'firstUTC', 'lastUTC'], row)) for row in db.execute("SELECT dataset,sum(count),min(date),max(date) FROM daily WHERE country='bra' GROUP BY dataset")]
years = [dict(zip(['year', 'dataset', 'count'], row)) for row in db.execute("SELECT substr(date,1,4),dataset,sum(count) FROM daily WHERE country='bra' GROUP BY 1,2")]
result = {'scope':'Brazil only', 'generation':active['generation'], 'count':sum(r['count'] for r in sources), 'sources':sources, 'years':years, 'method':'Indexed country-filtered daily summaries; not a new independent raw-row audit', 'limitations':['Acquisition opportunity unknown', 'NOAA-20/21 Standard lineage unresolved', 'No activated S-NPP history']}
(root/'docs/RASAD_BRAZIL_INVENTORY.json').write_text(json.dumps(result, indent=2), encoding='utf-8')
table = '\n'.join('| {dataset} | {count:,} | {firstUTC} | {lastUTC} |'.format(**r) for r in sources)
(root/'docs/RASAD_BRAZIL_INVENTORY.md').write_text(f"# Brazil-only active inventory\n\nGeneration `{active['generation']}`. Brazil observations: **{result['count']:,}**. Read-only indexed daily-summary reconciliation; no re-ingestion or independent raw scan. Full by-year values: RASAD_BRAZIL_INVENTORY.json.\n\n| Source | Detections | First UTC | Last UTC |\n|---|---:|---|---|\n{table}\n\nSource IDs preserve original archive naming. They do not expand the active geographic scope. Observation opportunity is unknown. NOAA-20/21 Standard lineage requires supplier clarification. No activated S-NPP Brazil history.\n", encoding='utf-8')
print(json.dumps(result, indent=2)[:2500])
