"""Verify fixed incoming deliveries and stage byte-identical CSV members. No database activation."""
import csv, hashlib, io, json, zipfile
from collections import Counter
from pathlib import Path

EXPECTED = {'DL_FIRE_M-C61_844700.zip': (1793, 23), 'DL_FIRE_SV-C2_844716.zip': (8902, 205), 'DL_FIRE_J1V-C2_844721.zip': (5753, 200), 'DL_FIRE_J2V-C2_844723.zip': (2227, 221)}
candidates = [Path('data/incoming'), Path('server/data/incoming'), Path('server/incoming')]
folders = [p for p in candidates if all((p / name).is_file() for name in EXPECTED)]
if len(folders) != 1:
    raise SystemExit('Expected exactly one complete input directory. Missing paths: ' + ', '.join(str(p / name) for p in candidates for name in EXPECTED if not (p / name).is_file()))
stage = Path('server/data/historical-staging')
pending = []
for filename, counts in EXPECTED.items():
    archive = folders[0] / filename
    with zipfile.ZipFile(archive) as bundle:
        members = [n for n in bundle.namelist() if n.endswith('.csv')]
        if len(members) != 2:
            raise ValueError('Expected one standard and one NRT CSV: ' + filename)
        for member in members:
            if Path(member).name != member or bundle.getinfo(member).file_size > 16 * 1024 * 1024:
                raise ValueError('Unsafe CSV member')
            raw = bundle.read(member)
            rows = list(csv.DictReader(io.StringIO(raw.decode('utf-8-sig'))))
            nrt = member.startswith('fire_nrt_')
            if not (nrt or member.startswith('fire_archive_')) or len(rows) != counts[int(nrt)]:
                raise ValueError('Processing/member count mismatch: ' + member)
            required = {'latitude', 'longitude', 'acq_date', 'acq_time', 'satellite', 'instrument', 'confidence', 'frp', 'version', 'scan', 'track', 'brightness', 'bright_t31', 'daynight'}
            if not rows or not required.issubset(rows[0]) or any(None in row or any(v is None for v in row.values()) for row in rows):
                raise ValueError('Malformed export schema')
            pending.append((member, raw, {'zip': filename, 'zipSHA256': hashlib.sha256(archive.read_bytes()).hexdigest(), 'member': member, 'csvSHA256': hashlib.sha256(raw).hexdigest(), 'rows': len(rows), 'headers': list(rows[0]), 'satellites': dict(Counter(r['satellite'] for r in rows)), 'versions': dict(Counter(r['version'] for r in rows)), 'first': min(r['acq_date'] for r in rows), 'last': max(r['acq_date'] for r in rows)}))
assert sum(item[2]['rows'] for item in pending) == 19324
stage.mkdir(parents=True, exist_ok=True)
for member, raw, _ in pending:
    target = stage / member
    if target.exists() and target.read_bytes() != raw:
        raise ValueError('Existing staging bytes differ; preserve and review: ' + member)
    if not target.exists():
        target.write_bytes(raw)
report = sorted((item[2] for item in pending), key=lambda d: (d['zip'], d['member']))
(stage / 'delivery-audit.json').write_text(json.dumps(report, indent=2), encoding='utf-8')
print('Verified and staged 8 original CSV members, 19324 input records; no database activated.')
