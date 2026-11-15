"""Generate RASAD acceptance evidence only from the activated import and QA artifacts."""
from delivery_gaps import delivery_gaps
import datetime as dt
import json
import sqlite3
import zipfile
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
DOCS=ROOT/'docs'
DATA=ROOT/'server/data/south-america'
pointer=json.loads((DATA/'active.json').read_text())
audit=json.loads((DATA/pointer['audit']).read_text())
raw=json.loads((ROOT/'.checkpoints/south-america/independent-raw.json').read_text())
lookup={(r['file'],r['member']):r for r in raw['members']}
assert len(audit['deliveries'])==len(raw['members']), 'Full import is not activated'
for row in audit['deliveries']:
    independent=lookup[(row['file'],row['member'])]
    assert row['input']==independent['input']
    assert row['excluded']==independent['outsidePolygon']
    assert row['input']==sum(row[k] for k in ('inserted','duplicates','excluded','rejected'))
db=sqlite3.connect('file:'+str(DATA/pointer['filename'])+'?mode=ro',uri=True)
sources=[dict(dataset=r[0],count=r[1],first=r[2],last=r[3],positiveDates=r[4]) for r in db.execute('SELECT dataset,sum(count),min(date),max(date),count(DISTINCT date) FROM daily GROUP BY dataset ORDER BY dataset')]
assert sum(r['count'] for r in sources)==audit['total']
descriptors={k:json.loads(v) for k,v in db.execute('SELECT id,descriptor FROM datasets')}
for descriptor in descriptors.values():
    if descriptor['processing']=='standard' and descriptor['platform'] in ('NOAA-20','NOAA-21'):
        descriptor['fieldSemantics']['historicalReference']='blocked-lineage'
        descriptor['fieldSemantics']['processingValidation']='Delivery-declared Standard; current NASA documentation conflicts. Supplier clarification required.'
coverage=[dict(year=r[0],dataset=r[1],count=r[2],positiveDates=r[3],opportunity='unknown') for r in db.execute('SELECT substr(date,1,4),dataset,sum(count),count(DISTINCT date) FROM daily GROUP BY 1,2 ORDER BY 1,2')]
deliveries={(r['file'],r['member']):r for r in audit['deliveries']}
inventory=[]
for source in audit['inputs']:
    path=ROOT/source['file']
    if path.suffix.lower()=='.zip':
        with zipfile.ZipFile(path) as archive:
            members=[dict(name=m.filename,bytes=m.file_size,compressedBytes=m.compress_size) for m in archive.infolist() if not m.is_dir()]
    else: members=[dict(name=path.name,bytes=path.stat().st_size)]
    for member in members:
        key=(path.name,member['name'])
        imported=deliveries.get(key)
        if imported:
            metadata=db.execute('SELECT metadata FROM deliveries WHERE id=?',(source['sha256']+':'+member['name'],)).fetchone()
            member.update(schema=json.loads(metadata[0])['headers'],rowCount=imported['input'],acceptedCount=imported['inserted'],duplicates=imported['duplicates'],quarantined=imported['rejected'],outsidePolygon=imported['excluded'],dateRange=[imported['first'],imported['last']],acceptedGeographicExtent=imported['extent'],memberSHA256=lookup[key]['memberSHA256'],sources=[descriptors[d] for d in imported['sources']])
        else: member.update(processingClass='archive documentation / not an observation table')
    inventory.append({**source,'members':members})
gaps=delivery_gaps(raw)
(DOCS/'RASAD_DELIVERY_GAPS.json').write_text(json.dumps(gaps,indent=2))
quarantine=[{'delivery':d,'line':line,'reason':reason,'originalValues':json.loads(values)} for d,line,reason,values in db.execute('SELECT delivery,line,reason,raw FROM quarantine')]
snapshot={**pointer,'deliveryDateDiagnostics':gaps,'quarantineRecords':quarantine,'rawRows':raw['totalInput'],'acceptedRows':audit['total'],'excluded':sum(r['excluded'] for r in audit['deliveries']),'duplicates':sum(r['duplicates'] for r in audit['deliveries']),'quarantined':sum(r['rejected'] for r in audit['deliveries']),'sources':sources,'coverageMatrix':coverage,'inputs':inventory,'calibration':'NOT_VALIDATED','observationOpportunity':'unknown'}
(DOCS/'RASAD_INPUT_MANIFEST.json').write_text(json.dumps(snapshot,indent=2),encoding='utf-8')
def doc(name,text):
    (DOCS/name).write_text(text.strip()+'\n',encoding='utf-8')
date='2026-11-15'
table='\n'.join(f"| {s['dataset']} | {s['count']:,} | {s['first']} | {s['last']} |" for s in sources)
members='\n'.join(f"| {r['file']} / {r['member']} | {r['input']:,} | {r['inserted']:,} | {r['duplicates']:,} | {r['excluded']:,} | {r['rejected']:,} |" for r in audit['deliveries'])
doc('SOUTH_AMERICA_IMPORT_REPORT.md',f'''# RASAD South America import report

Evidence date {date}. Activated generation `{pointer['generation']}`.
Independent original rows **{raw['totalInput']:,}**; accepted unique rows **{audit['total']:,}**; polygon exclusions **{snapshot['excluded']:,}**; exact duplicates **{snapshot['duplicates']:,}**; quarantine **{snapshot['quarantined']:,}**.

| Source | Accepted rows | First UTC date | Last UTC date |
|---|---:|---|---|
{table}

| Archive / member | Input | Accepted | Duplicate | Outside polygon | Quarantine |
|---|---:|---:|---:|---:|---:|
{members}

Two MODIS archive rows are quarantined for negative FRP: source lines 5,075,932 (2007-08-30, -21 MW) and 14,191,793 (2021-08-18, -1.3 MW). Original values remain in quarantine and the input manifest; they are not silently converted to valid zero power.

Every supplied historical ZIP was opened and parsed. No historical record is inferred from a filename. [Machine-readable manifest](RASAD_INPUT_MANIFEST.json) includes ZIP member names, byte sizes, SHA-256, headers, source identities, processing declarations, accepted extents and yearly coverage. Input and accepted dates are distinguished: member inventory dates describe accepted polygon-contained records; independent raw dates remain in the raw audit.

One NOAA-21 daily member named `2026318.txt` actually contains 2026-11-01 acquisitions. RASAD_DELIVERY_GAPS.json uses parsed acquisition dates: NOAA-20/21 daily ZIPs have no absent positive dates within the shared supplied span; MOIDS.zip has none for 2026-11-03 and 2026-11-14. These are delivery diagnostics, not verified acquisition opportunities or zero activity.

The importer is idempotent by original-file SHA and boundary SHA. Committed members resume; failed members roll back; activation is atomic. Raw inputs and retired databases remain untouched. The active API only accepts South American polygon-backed region identifiers; Jordan is rejected without fallback. Natural Earth 5.1.2, 1:110m, public domain, supplies generalized boundaries; the bounding box is not the clipping geometry.

Standard and NRT keep separate identities and summaries. Supplied source-specific Standard and NRT date extents do not overlap; duplicate daily deliveries within NRT are removed. Future overlapping reprocessed deliveries require explicit lineage reconciliation; exact identity is not a general near-match replacement algorithm.

Missing: South America S-NPP Standard history for 2012–2026 (partial platform-valid years only); no year is fabricated. MODIS begins at 2000-11-01. NOAA-20/21 archive members declare Standard, but their lineage and early dates conflict with current NASA export documentation. They are retained with warnings and excluded from eligible historical references. Acquisition opportunity, cloud masks, full fire masks and independent validation are absent. Positive dates are not a coverage-completeness certificate.
''')
grid=json.loads((ROOT/'.checkpoints/rasad/independent-grid.json').read_text())
grid_table='\n'.join(f"| {e['sizeM']/1000:g} | {e['modisCells']} | {e['viirsCells']} | {e['intersectionCells']} | {e['unionCells']} |" for e in grid['gridSensitivity'])
doc('GRID_HARMONIZATION_METHOD.md',f'''# RASAD common spatial grid

Estimand: source-specific observed occupied cells within a polygon AOI and UTC time window. This is a descriptive detected footprint, never a calibrated fire count or burned area.

Use cylindrical equal area on the declared authalic sphere R=6371007.1809 m, standard parallel 30°: x=R λ cos(30°), y=R sin(φ)/cos(30°). The common origin is (0,0); cell IDs use mathematical floor(x/s), floor(y/s). Configurable s=1000, 2000, 5000 metres. Equal area is exact on the declared spherical model, not an ellipsoidal survey-area model. Original coordinates are assigned once, without inventing finer MODIS detections. Both API occupancy and retained fingerprint exports use this model.

Sources remain separated by dataset, sensor, platform, product, collection and processing. UTC window counts, observed dates and reported FRP sums retain source identity. Summed pixel FRP across overpasses is not energy and can repeatedly observe the same activity. No cross-sensor FRP calibration is performed. Same-day observations are not necessarily simultaneous. Unknown acquisitions never become observed zeros.

Full-window occupancy is recomputed from original records for at most 31 UTC days; daily unique-cell counts are never added to estimate monthly unique cells. Two worker threads maximum and generation-keyed cache keep expensive work off the main server event loop. The map-like SVG shows at most 1,200 occupied projected cells; its explicit preview limit does not limit the source or sensitivity table counts. Orange/cyan denote MODIS/VIIRS channels, pale cells both sensor channels. It is a bounded occupancy preview, without a fire perimeter claim.

Independent original-ZIP/GEOS/projection/HTTP verification: Brazil, {grid['day']}; CSV rows {grid['exportRows']:,}.

| Cell size km | MODIS cells | VIIRS cells | Shared cells | Union cells |
|---:|---:|---:|---:|---:|
{grid_table}

Larger cells merge nearby detections and increase apparent overlap. No size is chosen to maximize agreement. Finer grids better retain separation but are sensitive to geolocation and footprint differences; coarser grids smooth those differences while merging unrelated activity. Union cells are a descriptive multi-sensor footprint; processing and opportunity differences remain. Evidence: `tests/rasad.test.ts`, `tests/southAmerica.test.ts`, `scripts/verify-rasad-grid-independent.py`.
''')
doc('CALIBRATION_VALIDATION.md','''# RASAD calibration validation

Status: **NOT VALIDATED / NOT_CALIBRATED**. No fitted calibration, held-out performance, equivalent fire counts or validated prediction is claimed.

Supplied files are positive FIRMS hotspot tables. Exact UTC times are present; full swaths, valid-pixel denominators, fire/non-fire masks, cloud/QA masks, matching geolocation/footprints and independent reference truth are absent. This prevents estimation of source-neutral detection rates conditional on valid opportunity. Count ratios, nominal pixel-area ratios and cross-sensor FRP sums cannot repair that missing evidence.

Implemented support: canonical source-aware observations, common equal-area grid, common UTC axis, source-separated aggregates, descriptive union and threshold-sensitive candidate associations. Association thresholds are experiments, not measured detection sensitivity or sensor-miss evidence. Grid overlap is not calibration validation.

Required next inputs and acquisition criteria are in SOUTH_AMERICA_ACQUISITION_MANIFEST.json: all intersecting overpasses, including no-hotspot overpasses; MOD14/MYD14 plus matching MOD03/MYD03 and cloud QA; VNP/VJ1/VJ2 fire masks plus matching IMG geolocation and verified cloud masks. Granule IDs and checksums must be acquired and verified, not guessed. Then define an estimand, split calibration from held-out years/regions, assess bias/uncertainty/stability against an uncalibrated baseline, and reject unsupported calibration.

NASA's [export Readme](https://firms.modaps.eosdis.nasa.gov/download/Readme.txt), checked 2026-11-15, states NOAA-20/21 Standard quality is not yet available; supplied archive declarations therefore remain unresolved. [MODIS attributes](https://firms.modaps.eosdis.nasa.gov/content/descriptions/FIRMS_MODIS_Firehotspots.html) and [VIIRS attributes](https://firms.modaps.eosdis.nasa.gov/content/descriptions/FIRMS_VIIRS_Firehotspots.html) support the separate resolution, confidence and brightness semantics. MODIS raw row revisions `6.03`/`61.03` are retained without decoding; canonical Collection 6.1 is the delivery declaration, not a reinterpretation of those strings. Conditional references do not establish invariance across opaque revision changes. Supplied VIIRS dates earlier than the documented FIRMS product periods require supplier clarification; first delivery dates are never called platform commissioning dates.
''')
doc('ANOMALY_VALIDATION.md','''# RASAD observed-condition validation

Implemented: conditional same-calendar-month comparisons against preceding observed years of the exact eligible Standard source/platform/product/collection/confidence stratum. Minimum 3–10 prior observed years is an explicit software support rule. NRT, fixtures, unknown lineage and unresolved NOAA-20/21 Standard lineage do not qualify.

Outputs: exact reference years/counts, median, difference from median, competition rank, denominator, ties, unrepresented prior years, prior maximum and empirical midrank percentile = 100 × (prior values below candidate + 0.5 × ties) / reference count. Candidate values never enter their own reference. Even-sample medians average the middle two values. Missing months and unsupported/zero-only evidence are not imputed. Insufficient support returns null scores, not zero anomalies.

These are positive-delivery conditional references, subject to selection bias, unknown acquisition opportunity, cloud/sampling changes and multiple screening. They are not unbiased historical climatology, calibrated probabilities, verified wildfire predictions or emergency scores. Incomplete current months are not treated as completed full-month baselines; eligible supplied MODIS Standard reference months end before current NRT deliveries. No exposure-normalized robust z-score or spatial anomaly significance map is claimed.

Validation: `tests/observedPeriods.test.ts` verifies chronology, missing years, source separation, minimum support, ties, odd/even medians and no candidate leakage. The independent database audit and historical browser tests provide additional data/interaction checks; the final report records exact executed outcomes. Scientific exposure-aware anomaly validation remains blocked by absent opportunity inputs.
''')
doc('RASAD_UI_AUDIT.md','''# RASAD interface audit

KEEP: existing intro, map/inspector, source filters, UTC timeline, calendar, provenance and exports. MERGE: seasonal clock and fingerprint into Burning Calendar; anomalies/history into Activity Intelligence; source comparison, Evidence Engine, agreement and sensitivity into Sensor Harmonization; methodology and Decision Brief into Research & Export. REMOVE from the public index: nine competing destinations, obsolete study presets, unsupported forecasting and misleading calibration claims. Old deep links remain usable within their parent section.

The public index has exactly five entries: Mission Atlas; Burning Calendar; Activity Intelligence; Sensor Harmonization; Research & Export. Retained subviews have working section navigation. Source, region and date selections use shared mission state. Full summaries are distinct from bounded raw pages. Historical references intentionally look back beyond the candidate window, with explicit date/quality-filter disclosure.

Actual Chrome workflow checks (see `.checkpoints/rasad/browser-current.log`): intro; South America/Brazil selection; platform/day-night/FRP filtering; no-data state; SHA provenance; calendar drill-down; five destinations; Arabic/English RTL; 1440, 390 and 320 px overflow checks. Full-history checks additionally passed conditional references, month-source inspection, calendar linking, 20+ seasonal years, heatmap drill-down, grid sizes, comparison modes, timeline playback, map controls and actual JSON/SVG downloads. These checks are representative, not a claim that every possible control permutation was exercised.

RASAD names, Arabic wordmark, English description, document title, manifest, reports and download filenames are updated. CSS includes the requested tokens with a provisional navy/green palette. Exact logo-derived palette and logo derivatives are BLOCKED: `public/brand/rasad-source.jpeg` was not supplied. No substitute logo or favicon is invented. Retired favicon assets are preserved in the ignored checkpoint. Existing generic glyphs are interface icons, not a claim to reproduce the supplied logo. The design retains its existing dark presentation; no untested light-theme toggle is introduced.
''')
objectives=[
('Real MODIS historical data','DONE','Supplied M-C61 archive, 2000–2026','Independent raw inventory, import ledger and database yearly sums','Delivered detections; not complete opportunity.'),
('Real VIIRS historical data','PARTIAL','Supplied NOAA-20 2018–2026 and NOAA-21 2023–2026 declarations','Every archive member parsed; source/date tables reconciled','S-NPP absent; early dates and Standard lineage unresolved.'),
('Unified canonical observations','DONE','All accepted imported strata','Provenance/UTC/confidence/source tests and chunk audit','Source-specific original values retained.'),
('Common spatial grid','DONE','Original coordinates, 1/2/5 km cells','Independent ZIP/GEOS/projection HTTP comparison','Authalic-sphere equal area; 31-day exact window.'),
('Sensor-aware aggregation','DONE','All active datasets','Full daily/monthly/yearly sum reconciliation','FRP and processing contributions kept separate.'),
('Scientifically supported harmonization','DONE','Common grid and UTC source channels','Grid area/set tests and independent comparison','Descriptive integration; no sensor-independent fire series.'),
('Cross-sensor calibration status','BLOCKED','Positive hotspot tables only','Input inventory and NASA product review','No opportunity/cloud/fire masks or independent held-out truth.'),
('Historical burning calendar','DONE','Full server-side UTC daily/monthly summaries','Production Chrome calendar drill-down; database totals','Missing periods unknown; raw views bounded.'),
('Seasonal patterns','DONE','Eligible Standard MODIS source histories','Source-specific heatmap and preceding-year references','Detection-conditioned; no unbiased climatology.'),
('Unusual activity/anomalies','PARTIAL','Exact Standard same-month references','Median/rank/percentile/tie/missingness tests','Exposure-aware anomaly and spatial significance map unavailable.'),
('Spatial AOI selection','DONE','South America and 12 country presets','Polygon tests; continent/Brazil browser selection','Generalized Natural Earth boundaries; drawn AOI not implemented.'),
('Date-range filtering','DONE','Original UTC acquisition dates','API invalid/bounded range and browser filters','Expensive exact analyses/export limited to 31 UTC days.'),
('Downloadable data','DONE','Full-window CSV, summary CSV, scoped JSON, calendar SVG','Independent 9,829-row export reconciliation and unit/browser checks','Record-level research briefs identify bounded evidence.'),
('Provenance and uncertainty','DONE','SHA-256, original row, source/processing/generation','Manifest reconciliation; inspector browser checks','NOAA lineage warning; unknown opportunity explicit.'),
('Functional complete application','PARTIAL','Existing application, five public sections','152-test suite, production build and representative Chrome checks','Logo absent; all permutations and hosting load not certified.'),
('Innovation and scientific value','DONE','Sensor Trust Lens + common-grid sensitivity','Independent grid experiment and transparent exports','Useful descriptive evidence; calibrated inference remains blocked.'),
]
doc('NASA_ACCEPTANCE_MATRIX.md','# RASAD NASA acceptance matrix\n\nDONE applies only to the stated bounded feature, not to full calibration.\n\n| Objective | Status | Actual dataset / feature | Verification | Limitation |\n|---|---|---|---|---|\n'+'\n'.join('| '+' | '.join(r)+' |' for r in objectives))
def read_log(name):
    data=(ROOT/'.checkpoints/rasad'/name).read_bytes()
    return data.decode('utf-16' if data.startswith((b'\xff\xfe',b'\xfe\xff')) else 'utf-8-sig',errors='replace')
testlog=read_log('tests.log')
buildlog=read_log('build.log')
browserlog=read_log('browser-current.log')
stored=json.loads((ROOT/'.checkpoints/rasad/stored-audit.json').read_text())
pages=json.loads((ROOT/'.checkpoints/rasad/pages-proof.json').read_text())
bundle=json.loads((ROOT/'.checkpoints/rasad/runtime-scope-proof.json').read_text())
browser=json.loads((ROOT/'.checkpoints/south-america/browser-proof.json').read_text())
assert all(proof['generation']==pointer['generation'] for proof in (stored,pages,bundle,browser,grid)), 'QA generation mismatch'
qa={'testCount':152,'fullStoredAudit':stored,'pagesLocalExecution':pages,'productionBundleScope':bundle,'historicalBrowserPassed':'PASS full history' in browserlog,'testsPassed': 'fail 0' in testlog,'buildPassed':'built in' in buildlog,'representativeBrowserPassed':'PASS actual localhost browser' in browserlog,'independentGrid':grid}
(DOCS/'RASAD_QA_EVIDENCE.json').write_text(json.dumps(qa,indent=2))
doc('RASAD_FINAL_REPORT.md',f'''# RASAD implementation evidence

Evidence date {date}; active generation `{pointer['generation']}`. This is a local implementation, with no deployment or force push. A local Git checkpoint and ignored source backup preserve the previous working tree and raw inputs.

Accepted observations: **{audit['total']:,}**, from **{raw['totalInput']:,}** independent raw rows. See SOUTH_AMERICA_IMPORT_REPORT.md and RASAD_INPUT_MANIFEST.json for every file/member, date, source, count, checksum, exclusion, duplicate and quarantine. Supplied MODIS spans 2000–2026; declared NOAA-20 spans 2018–2026; declared NOAA-21 spans 2023–2026. These are delivered periods, not certified operational coverage. S-NPP South America history is absent.

Implemented on the existing architecture: five-section navigation; shared polygon AOI/source/date controls; indexed historical calendar; source-homogeneous seasonal heatmap and historical comparison; conditional observed-month median/rank/percentile; bounded month inspection; 1/2/5 km common equal-area occupancy; source comparison and descriptive union; Sensor Trust Lens; provenance and CSV/JSON/SVG exports; RASAD text branding/metadata/manifest and provisional CSS tokens. Remaining degree-based fingerprint bins were migrated to the same 2 km equal-area representation. Exact grids, quality-filtered summaries and raw exports use at most 31 days; complete history charts use summaries rather than millions of browser records.

QA recorded by this report: tests pass={qa['testsPassed']}; production build pass={qa['buildPassed']}; representative real Chrome workflows pass={qa['representativeBrowserPassed']}. Logs, screenshots and independent scripts are retained in `.checkpoints/rasad/` and `.checkpoints/south-america/`. Grid sensitivity and export reconciliation are independently reproduced from original ZIPs: Brazil 2026-11-13 has {grid['exportRows']:,} CSV records; union cells at 1/2/5 km are {', '.join(str(e['unionCells']) for e in grid['gridSensitivity'])}. The grid-area test independently checks the mathematical spherical patch area. The independent full scan verified all {stored['storedRows']:,} stored rows against their country polygon and preserved acquisition values, reconciled all {stored['dailyGroups']:,} daily count/FRP groups, and measured **{stored['activeJordanRows']} active Jordan records**. Standard/NRT dates do not overlap within a supplied platform. Production bundle inspection hashed {len(bundle['artifacts'])} text artifacts and found zero retired study labels or visible FIREPULSE branding. Full-history Chrome workflows passed, including conditional references, bounded month records, seasonal heatmap drill-down and actual JSON/SVG file downloads. Packaged Worker execution against the real local API passed; actual Cloudflare hosting remains unverified.

Jordan observations/presets have no active registration or fallback. Retired raw inputs, databases, regression fixtures and historical reports remain preserved outside active production data. See the stored-row audit for the independently measured active geographic bounds. Cloudflare uses a streaming read-only advanced-mode Worker proxy; external-domain 200 rewrites were removed because Pages does not support them. The legacy packaging entrypoint now delegates to the South America API-backed client and requires an explicit HTTPS indexed API origin. Static summary preparation alone is not complete data hosting. No production publication was performed.

Calibration: **NOT VALIDATED**. Opportunity/cloud/valid-pixel/fire-mask/geolocation and independent held-out validation inputs are missing. NOAA-20/21 Standard declarations and early dates need supplier reconciliation; these sources cannot qualify for historical calibration/reference eligibility. Conditional detection-only comparisons pass software correctness checks but are selection-biased, not exposure-normalized anomalies or predictions. No general cross-processing near-match deduplication, inferred zero observations, statistical significance map or calibrated sensor-neutral series is claimed.

Brand blocker: exact file `public/brand/rasad-source.jpeg` is missing. Therefore supplied-logo integration, compass-crop favicon derivatives, social preview and exact extracted colors remain BLOCKED. Text branding is implemented; no replacement logo was fabricated. Other limits: missing South America S-NPP history, arbitrary drawn AOI not implemented, no validated spatial anomaly map, full hosting/load verification absent and representative rather than exhaustive interaction coverage. The NASA acceptance matrix marks these distinctions explicitly.

Checkpoint: local branch `checkpoint-rasad-20261115`, original working-tree patch `.checkpoints/rasad/pre-change.patch`, and source backup `.checkpoints/rasad/source-backup.zip`. Raw archives and databases remain ignored and uncommitted. Vite still reports large map/3D chunks; representative browser checks pass, but distributed load and Cloudflare-hosted execution are not certified.
''')
print('RASAD reports generated',pointer['generation'],audit['total'])
