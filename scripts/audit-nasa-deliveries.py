"""Read-only audit of the two supplied ZIPs. Never imports/extracts/rewrites observations.

Run from the repository root: python scripts/audit-nasa-deliveries.py
Add --write-report to save aggregate audit metadata (not CSV rows) under docs/.
Only the explicitly named CSV members are read; no credentials or environment files.
"""
import collections
import csv
import hashlib
import io
import json
import math
from pathlib import Path
import subprocess
import sys
import zipfile

ROOT = Path(__file__).resolve().parent.parent
DELIVERIES = [
    ('DL_FIRE_M-C61_842987.zip', 'fire_archive_M-C61_842987.csv'),
    ('DL_FIRE_SV-C2_842985.zip', 'fire_archive_SV-C2_842985.csv'),
]
EXPECTED = 'latitude,longitude,brightness,scan,track,acq_date,acq_time,satellite,instrument,confidence,version,bright_t31,frp,daynight,type'.split(',')
NODE_AUDIT = """
import {pointInRegion,acquisitionUTC,digest} from './shared/observations.ts';
import {loadAjlounGeometry} from './server/dataCatalog.js';
let text='';for await(const chunk of process.stdin)text+=chunk;
const rows=JSON.parse(text), boundary=loadAjlounGeometry();
const utc=[],insideUTC=[];let invalidUTC=0,within=0;
for(const row of rows){
 const acquisition=acquisitionUTC({type:'Feature',geometry:{type:'Point',coordinates:row.coordinates},properties:{date:row.date,time:row.time}});
 if(acquisition?.acquiredAt)utc.push(acquisition.acquiredAt);else invalidUTC++;
 if(row.coordinates.every(Number.isFinite)&&pointInRegion(...row.coordinates,boundary)){within++;if(acquisition?.acquiredAt)insideUTC.push(acquisition.acquiredAt);}
}
utc.sort();insideUTC.sort();
console.log(JSON.stringify({invalidUTC,utcRange:utc.length?[utc[0],utc.at(-1)]:null,withinAjloun:within,outsideAjloun:rows.length-within,withinAjlounUTCRange:insideUTC.length?[insideUTC[0],insideUTC.at(-1)]:null,boundaryGeometry:boundary.type,boundaryChecksum:digest(JSON.stringify(boundary))}));
"""


def audit(archive_name, member):
    archive = ROOT / 'server/data/archives' / archive_name
    with zipfile.ZipFile(archive) as bundle:
        info = bundle.getinfo(member)
        if info.file_size > 16 * 1024 * 1024:
            raise ValueError('This small-delivery audit is limited to 16 MiB CSV members.')
        raw = bundle.read(member)
    reader = csv.DictReader(io.StringIO(raw.decode('utf-8-sig')))
    if reader.fieldnames != EXPECTED:
        raise ValueError('Delivery schema differs; review before continuing.')
    rows = list(reader)
    if any(None in row or any(value is None for value in row.values()) for row in rows):
        raise ValueError('Malformed CSV column count.')
    coords = [[float(row['longitude']), float(row['latitude'])] for row in rows]
    malformed_coordinates = sum(not all(map(math.isfinite, pair)) or not (-180 <= pair[0] <= 180 and -90 <= pair[1] <= 90) for pair in coords)
    if malformed_coordinates:
        raise ValueError('Invalid WGS84 coordinates; no bounds reported.')
    numeric = {}
    for field in ['brightness', 'scan', 'track', 'bright_t31', 'frp']:
        values = []
        invalid = 0
        for row in rows:
            if not row[field].strip():
                continue
            try:
                value = float(row[field])
                if not math.isfinite(value):
                    raise ValueError()
                values.append(value)
            except ValueError:
                invalid += 1
        numeric[field] = {'missing': sum(not row[field].strip() for row in rows), 'nonFiniteOrInvalid': invalid, 'negative': sum(v < 0 for v in values), 'zero': values.count(0), 'range': [min(values), max(values)] if values else None}
    node_input = [{'coordinates': pair, 'date': row['acq_date'], 'time': row['acq_time']} for row, pair in zip(rows, coords)]
    spatial = json.loads(subprocess.check_output(['node', '--input-type=module', '-e', NODE_AUDIT], input=json.dumps(node_input).encode(), cwd=ROOT))
    return {
        'archive': archive_name, 'archiveSHA256': hashlib.sha256(archive.read_bytes()).hexdigest(),
        'csvMember': member, 'csvSHA256': hashlib.sha256(raw).hexdigest(), 'headers': reader.fieldnames,
        'rowCount': len(rows), 'exactDuplicateRows': len(rows) - len({tuple(row.values()) for row in rows}),
        'observedDateRange': [min(row['acq_date'] for row in rows), max(row['acq_date'] for row in rows)] if rows else None,
        'distinctObservedDates': len({row['acq_date'] for row in rows}),
        'observedBoundsWestSouthEastNorth': [min(c[0] for c in coords), min(c[1] for c in coords), max(c[0] for c in coords), max(c[1] for c in coords)] if coords else None,
        'rawValueDistributions': {key: dict(sorted(collections.Counter(row[key] for row in rows).items())) for key in ['instrument', 'satellite', 'version', 'confidence', 'daynight', 'type']},
        'numericSyntaxOnly': numeric, 'sharedUTCAndPolygonAudit': spatial,
        'requestedDateRange': None, 'requestedAOI': None, 'verifiedCoverage': False,
        'importApproved': False, 'scientificValidation': 'not performed',
    }


if __name__ == '__main__':
    if any(arg != '--write-report' for arg in sys.argv[1:]):
        raise SystemExit('Supported option: --write-report')
    result = {'audit': 'firepulse.delivery-inspection/v1', 'inspectionDate': '2026-11-12', 'method': 'Immutable ZIP/CSV hashes, exact raw-row duplicate check, shared acquisitionUTC and Ajloun pointInRegion; no import, channel mapping or cross-sensor association.', 'deliveries': [audit(*delivery) for delivery in DELIVERIES]}
    output = json.dumps(result, indent=2, ensure_ascii=True) + '\n'
    if '--write-report' in sys.argv:
        (ROOT / 'docs/NASA_ARCHIVE_AUDIT.json').write_text(output, encoding='utf-8')
    print(output)
