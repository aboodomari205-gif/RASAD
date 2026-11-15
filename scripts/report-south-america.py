"""Build evidence-based audit/coverage/docs after atomic activation; no remote claims."""
import datetime as dt, hashlib, json, sqlite3, subprocess
from delivery_gaps import delivery_gaps
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
out=ROOT/'docs';data=ROOT/'server/data/south-america'
pointer=json.loads((data/'active.json').read_text());audit=json.loads((data/pointer['audit']).read_text())
db=sqlite3.connect(data/pointer['filename'])
raw=json.loads((ROOT/'.checkpoints/south-america/independent-raw.json').read_text())
lookup={(r['file'],r['member']):r for r in raw['members']}
assert len(audit['deliveries'])==len(raw['members']),'Full historical generation is not activated'
for d in audit['deliveries']:
 r=lookup[(d['file'],d['member'])];assert d['input']==r['input'];assert d['excluded']==r['outsidePolygon'];assert d['input']==d['inserted']+d['duplicates']+d['excluded']+d['rejected']
counts=db.execute('SELECT dataset,sum(count),min(date),max(date),count(DISTINCT date) FROM daily GROUP BY dataset ORDER BY dataset').fetchall()
matrix=db.execute("SELECT substr(date,1,4),dataset,sum(count),count(DISTINCT date) FROM daily GROUP BY substr(date,1,4),dataset ORDER BY 1,2").fetchall()
assert sum(r[1] for r in counts)==audit['total']
snapshot={'generation':pointer['generation'],'inputRows':raw['totalInput'],'importedUnique':audit['total'],'excludedOutsidePolygon':sum(r['excluded'] for r in audit['deliveries']),'duplicates':sum(r['duplicates'] for r in audit['deliveries']),'quarantined':sum(r['rejected'] for r in audit['deliveries']),'sources':[{'dataset':d,'count':n,'first':f,'last':l,'positiveDates':days} for d,n,f,l,days in counts],'coverageMatrix':[{'year':y,'dataset':d,'count':n,'positiveDates':days,'opportunity':'unknown'} for y,d,n,days in matrix],'inputs':audit['inputs'],'independentMembers':[{k:v for k,v in r.items() if k!='availableDates'} for r in raw['members']],'calibration':'NOT_CALIBRATED','activeJordanRecords':0}
snapshot['dailyDeliveryGaps']=delivery_gaps(raw)
(ROOT/'.checkpoints/south-america/daily-delivery-gaps.json').write_text(json.dumps(snapshot['dailyDeliveryGaps'],indent=2))
(out/'RASAD_DELIVERY_GAPS.json').write_text(json.dumps(snapshot['dailyDeliveryGaps'],indent=2))
(out/'SOUTH_AMERICA_AUDIT.json').write_text(json.dumps(snapshot,indent=2))
source_table='\n'.join(f'| {d} | {n:,} | {f} | {l} | {days:,} |' for d,n,f,l,days in counts)
files_table='\n'.join(f"| {r['file']} / {r['member']} | {r['input']:,} | {r['inserted']:,} | {r['duplicates']:,} | {r['excluded']:,} | {r['rejected']:,} |" for r in audit['deliveries'])
today='2026-11-15'
def doc(name,text):(out/name).write_text(text.strip()+'\n',encoding='utf-8')
doc('SOUTH_AMERICA_DATA_AUDIT.md',f'''# South America data audit

Generated from the atomically activated database and an independent raw-file reader on {today}.
Generation: `{pointer['generation']}`. This document supersedes previous study-area completion reports for the active application.

Independent raw rows: **{raw['totalInput']:,}**. Imported unique polygon-contained rows: **{audit['total']:,}**.
Outside the Natural Earth continent union: **{snapshot['excludedOutsidePolygon']:,}**. Exact canonical duplicates: **{snapshot['duplicates']:,}**. Quarantined: **{snapshot['quarantined']:,}**.
Each delivery reconciles input = inserted + duplicates + excluded + quarantined. Source summaries independently reconcile to stored chunk counts.

| Source stratum | Unique rows | First UTC date | Last UTC date | Positive dates |
|---|---:|---|---|---:|
{source_table}

| File / member | Input | Inserted | Duplicates | Outside polygons | Quarantine |
|---|---:|---:|---:|---:|---:|
{files_table}

The source files remain unmodified in incoming directories. ZIP SHA-256, member SHA-256, byte sizes, source-specific counts and year matrix are in [SOUTH_AMERICA_AUDIT.json](SOUTH_AMERICA_AUDIT.json).
The separate `csv.reader` / GEOS union audit imports no ingestion code and recomputes input counts, dates and polygon exclusions. Duplicate accounting is checked against the import ledger; independent audit does not pretend to independently certify every deduplication key.

## Geography

Natural Earth 5.1.2 admin-0, 1:110 million, public domain. South America is the union of its South American country components, including the French Guiana component of France. European France and Corsica are excluded. Country membership uses GEOS polygon coverage, with boundary included and holes excluded. A border tie uses the first declared polygon. The [-82,-56,-34,13] box is a camera/search extent only.
Generalized coastlines can exclude offshore/coastal detections. These are reported as polygon exclusions, not invalid NASA observations. These are cartographic study boundaries, not survey-grade or legal boundary determinations.
Source, version and upstream SHA are embedded in `public/south-america-countries.geojson`.

## Missingness and lineage

No South America S-NPP historical archive was supplied. The old `DL_FIRE_SV-C2_844716.zip` belongs to the retired study and is never substituted.
MODIS begins at the actual supplied 2000-11-01 record, not an invented January 2000 start. Missing positive dates do not prove missing files, complete delivery or zero detections.
NOAA-20/21 `fire_archive` members declare Standard processing, but the current [NASA export Readme](https://firms.modaps.eosdis.nasa.gov/download/Readme.txt) conflicts with that availability. Their original processing and values remain preserved and displayed as declared; they are blocked from historical-reference eligibility pending supplier clarification. The delivery dates are never claimed as satellite commissioning dates.

Active API regions and records are South American only. Original Jordan databases, raw backups and regression fixtures remain available outside production loading. No fallback to them is registered by the production API.
''')
doc('HARMONIZATION_METHOD.md','''# Harmonization method

The target descriptive estimand is source-specific observed active grid cells and delivered thermal detections per selected AOI and UTC window. It is not equivalent fire events, burned area, a fire rate or calibrated cross-sensor activity.

Canonical ingestion retains the exact UTC acquisition, original source row, platform, sensor, processing declaration, collection, raw version, confidence, brightness field labels, FRP (MW), scan/track, day/night, country and import generation. MODIS numeric confidence and VIIRS categorical confidence are not converted to a common score. Original export brightness labels are retained without inferring that `brightness` is VIIRS I4 or `bright_t31` is I5.

API `version`/`collectionVersion` denotes the declared canonical collection (MODIS 6.1 or VIIRS 2); `source_version` and `archiveRaw.version` preserve the original field, including 6.03, 61.03 and 2.0NRT. This prevents summary/record stratum mismatches without rewriting the raw delivery.

Exact identity is a 160-bit prefix of SHA-256 over sensor, platform, processing, collection, normalized exact UTC, exact numeric coordinates, source-specific confidence, FRP and original brightness/scan/track/day-night fields. No spatial rounding, proximity matching or time tolerance enters deduplication. Numeric MODIS confidence is retained in full; VIIRS category words/letters normalize only for identity. ZIP/source-file location is not part of identity. Standard and NRT are always different identities; both are retained. Within-platform lineage is kept distinct. The full original archives and duplicate delivery ledger remain available for reproduction.

Experimental grid sizes are 1, 2 and 5 km. Projection is cylindrical equal area on an authalic sphere of radius 6371007.1809 m, standard parallel 30 degrees: x=R*lambda*cos(30), y=R*sin(phi)/cos(30). Negative coordinates use mathematical floor. This is equal-area on the stated spherical model, not an ellipsoidal distance or burned-area estimator. Counts of unique cells are recomputed from all filtered rows in the explicit <=31-day window, separately per dataset; monthly cells are never obtained by summing daily cells. Grid sensitivity changes aggregation, not calibration.

Existing Agreement Lab uses geodesic spatial proximity, exact UTC differences, processing eligibility and explicit configurable thresholds. Associations can be many-to-many and are candidate co-observations, never independently confirmed events or evidence that a sensor missed a fire. Same UTC day does not imply simultaneous overpasses.

Source-balanced evidence pages round-robin deterministically across available datasets to avoid hiding all but the first imported source. They are bounded previews, not random, exposure-weighted or scientifically representative samples. Agreement and record-level briefs apply only to that displayed page. Complete calendar and seasonal summaries query the database separately; exact full-window CSV streams all qualifying rows for <=31 days.

Historical comparisons prefer eligible Standard strata. NRT is provisional and never pooled into a Standard reference. Both processing contributions remain separately identified in calendar detail and exports. Summing contributions is descriptive delivery accounting, not calibration or unique-fire counting.
''')
doc('CALIBRATION_VALIDATION.md','''# Calibration validation

Status: **NOT_CALIBRATED**. There are no fitted coefficients, training/held-out validation results, equivalent counts or validated forecast. No count ratio or pixel-area ratio is used as calibration.

The available hotspot CSV/TXT files contain positive detections. They do not supply all acquisition opportunities, valid no-detection pixels, cloud/QA masks, geolocation footprints or independent ground truth. Therefore the intended future estimand—detection probability or activity per comparable valid observation opportunity—cannot be estimated or validated from these inputs.

The targeted [SOUTH_AMERICA_ACQUISITION_MANIFEST.json](SOUTH_AMERICA_ACQUISITION_MANIFEST.json) lists matching Level-2 fire masks, geolocation and cloud products for a pilot overlap window. It requests all intersecting overpasses, including those without hotspots. Granule IDs and checksums are deliberately unset until NASA catalog discovery verifies actual files. No old four-granule pilot is treated as South America coverage or long-term validation.

Future work requires co-registered source/grid/time opportunities; valid-pixel and cloud tests; documented source-lineage eligibility; training versus held-out spatial/temporal splits; uncertainty; sensitivity across 1/2/5 km, season, year and country; comparison against uncalibrated baselines; and rejection of unstable models. A pilot month or four matching granules cannot establish continent-wide historical calibration.

Official product references: [MOD14](https://ladsweb.modaps.eosdis.nasa.gov/missions-and-measurements/products/MOD14/), [VNP14IMG](https://ladsweb.modaps.eosdis.nasa.gov/missions-and-measurements/products/VNP14IMG/), [VJ114IMG](https://ladsweb.modaps.eosdis.nasa.gov/missions-and-measurements/products/VJ114IMG/), [VJ214IMG](https://ladsweb.modaps.eosdis.nasa.gov/missions-and-measurements/products/VJ214IMG/), [NASA export lineage notes](https://firms.modaps.eosdis.nasa.gov/download/Readme.txt).
''')
doc('ANOMALY_METHOD.md','''# Historical observed-condition method

Validated exposure-aware anomaly: **unavailable**. Conditional delivered-count comparison: implemented.

For each exact dataset/source/sensor/platform/product/collection/processing/confidence stratum, compare one delivered month with positive delivered observations for the same calendar month in preceding years. Require at least three preceding observed years (user-selectable support 3–10). NRT, unknown provenance and unresolved NOAA-20/21 Standard lineage are ineligible. MODIS Standard strata may have enough supplied history; eligibility is computed from actual rows rather than hardcoded years.

Show the reference periods, reference count, median (including the mean of the two middle values for even n), difference from median, competition rank and denominator, ties, unrepresented prior years and prior maximum. A strictly greater-than-prior-maximum label is a descriptive screen, not a universal emergency threshold or a calibrated probability. Tied maxima are not called new records. Missing months never become zero. Unsupported references show no numerical score.

Positive-delivery selection bias is material: a month without delivered positives is absent from the reference, and acquisition completeness is unknown. Sampling, clouds, exposure and sensor/system changes can explain count differences. Multiple-period screening has no multiple-testing or causal adjustment. A descriptive high count is not a confirmed wildfire emergency, severity estimate, operational warning or forecast.

Sensor Trust Lens and the existing Observed Period Explorer expose these gates, exact years and source-separated summaries. Quality-filtered historical references are unavailable until compatible complete historical filtering is supported; clear those filters to inspect the explicit unfiltered exact-source reference. Quality-filtered daily/monthly summaries and grids are supported for <=31-day windows; large unsupported queries fail clearly rather than using a partial page as a reference.
''')
requirements=[
 ('Real MODIS and VIIRS','DONE','All supplied matching sources imported and independently counted; original values and lineages retained.'),
 ('Multi-year history','PARTIAL','MODIS 2000–2026, NOAA-20 2018–2026 and NOAA-21 2023–2026 delivered; S-NPP absent; completeness and NOAA processing lineage remain unresolved.'),
 ('Sensor-aware harmonization','DONE','Source-stratified UTC aggregation, equal-area cells, exploratory agreement and sensitivity; no equivalent counts claimed.'),
 ('Cross-sensor calibration','BLOCKED','No complete opportunity/valid-pixel/cloud/geolocation inputs or independent validation.'),
 ('Burning calendar','DONE','Server-side exact source/day summaries, UTC navigation, linked bounded evidence and full-window CSV.'),
 ('Historical seasonal patterns','DONE','Full database month/year summaries and source-separated historical comparison; missing periods unknown.'),
 ('Unusual-condition analysis','PARTIAL','Conditional same-month Standard references, medians, ranks and support gates; exposure-aware anomaly unavailable.'),
 ('Spatial AOI selection','PARTIAL','Continent and 12 country presets from versioned polygons; arbitrary user-drawn AOI is not implemented.'),
 ('Date-range selection','DONE','UTC range, timeline/year selection; explicit 31-day bounds for expensive exact grid/quality queries and full CSV.'),
 ('Linked map/calendar/analytics','DONE','One shared scope and generation; source summaries separate from bounded raw evidence.'),
 ('CSV download','DONE','Filtered full-window streaming <=31 days; source-separated summary CSV/JSON and displayed-evidence CSV.'),
 ('Provenance and uncertainty','DONE','SHA-256 source/member audits, original row, collection/raw version, source IDs, generation and opportunity gates.'),
 ('Scientific limitations','DONE','NOT_CALIBRATED, unknown opportunity, provisional NRT, conditional-reference bias and no confirmed fires/forecast.'),
 ('User interface','PARTIAL','Existing modules retained and representative EN/AR/RTL desktop/mobile flows browser-tested; not every possible control permutation is certified.'),
 ('Performance/reproducibility','PARTIAL','Streaming chunks and indexes support actual tens of millions of rows; no full browser history load. Grid calculations run in bounded worker threads with at most two concurrent jobs and a small generation-keyed cache; distributed deployment/load validation absent.'),
]
doc('NASA_ACCEPTANCE_MATRIX.md','''# NASA acceptance matrix

Current South America scope only. DONE describes the bounded, explicitly stated implementation, not an assertion of complete scientific calibration.

| Requirement | Status | Actual evidence / remaining work |
|---|---|---|
'''+ '\n'.join('| '+r+' | '+s+' | '+e+' |' for r,s,e in requirements)+'''

Evidence: `tests/southAmerica.test.ts`, retained scientific/unit regressions, independent raw audit, active database count reconciliation, local Chromium workflow script/screenshots, production build and hashed summary snapshot. Browser screenshots and logs are in `.checkpoints/south-america/`. Refer to FINAL_COMPLETION_REPORT for the exact tested revision and limits. Earlier study reports are historical records, not current acceptance evidence.
''')
changed=subprocess.check_output(['git','-c','safe.directory='+str(ROOT).replace('\\','/'),'diff','--name-only','HEAD'],cwd=ROOT).decode().splitlines()
untracked=subprocess.check_output(['git','-c','safe.directory='+str(ROOT).replace('\\','/'),'ls-files','--others','--exclude-standard'],cwd=ROOT).decode().splitlines()
code=[p for p in sorted(set(changed+untracked)) if p.endswith(('.ts','.tsx','.js','.mjs','.py','.css'))]
doc('FINAL_COMPLETION_REPORT.md',f'''# South America execution report

Generation `{pointer['generation']}`. Raw source rows independently counted: {raw['totalInput']:,}. Active unique polygon-contained observations: {audit['total']:,}. Active Jordan records: **0**. No deployment was performed.

Historical input files: `DL_FIRE_J1V-C2_847873old.zip`, `DL_FIRE_J2V-C2_847874old.zip`, `DL_FIRE_M-C61_847869old.zip`. NRT input files: `MOIDS.zip`, `viirs.zip`, `viirs1.zip`, plus the separately supplied NOAA-21 daily TXT. Exact members, input/imported counts, dates and SHA-256 values are in SOUTH_AMERICA_DATA_AUDIT and SOUTH_AMERICA_AUDIT.json.

The application retains its existing cinematic intro, map/inspector/filter/timeline architecture, Burning Calendar, seasonal clock, Sensor Intelligence, Evidence Engine, Fire DNA, Anomaly Detection, Decision Brief and research view. It now uses continent/country polygons and one South America API. Sensor Trust Lens explains the estimand, opportunity, grid/window sensitivity, source identity and conditional-reference eligibility. Record-level agreement/brief panels are explicitly bounded evidence-page analyses; full seasonal/calendar/history charts use database summaries.

The calendar spans the actually delivered 2000–2026 record; this is not a statement of complete sampling. Source-specific MODIS conditional references can have sufficient preceding positive years. S-NPP is absent. NOAA-20/21 declared Standard processing remains blocked from historical-reference eligibility until supplier reconciliation. Cross-sensor calibration is **NOT_CALIBRATED**, and no validated exposure-aware anomaly or prediction exists.

Current test/build/browser evidence is retained in `.checkpoints/rasad/` and `.checkpoints/south-america/`; see RASAD_FINAL_REPORT.md for the executed revision and verification limits. Re-run the listed scripts against this exact generation to reproduce. Passing compilation alone is not acceptance. The browser script checks intro, country selection, actual source metadata, calendar/day linking, Trust Lens and EN/AR RTL at 1440/390/320 px. Any expanded module/control checks are recorded separately in its output; untested permutations are not claimed.

Storage uses streaming 2,000-row ingestion, per-member transactions, a SHA identity index, compressed chunks, indexed date/country/source queries and server summaries. A failed member rolls back; existing committed members resume by checksum. Atomic activation prevents mixed-generation live data. Raw pages are limited to 3,000 rows; default 2,000. Exact grid/quality-filter windows and streaming CSV are limited to 31 UTC days. Resource limits are visible, not silently filled with synthetic data.

Local production use: `npm run build`, then `npm run serve` (same-origin read-only API plus client on localhost:4173). Data remains local/ignored. `npm run prepare:data` exports hashed source summaries. A complete continent history is not packaged as a misleading tiny static sample. Pages packaging requires an explicit HTTPS data API; publishing remains unperformed and requires user approval.

Remaining central blockers: missing S-NPP C2 history, complete acquisition/valid-pixel/cloud/geolocation opportunity, independent calibration/held-out validation, NOAA archive lineage clarification, arbitrary AOI drawing and wider production-load testing. The smallest next scientific action is to obtain the missing S-NPP South America archive and an all-overpass paired raster opportunity pilot from the acquisition manifest. This project is **not scientifically finished** while calibration and opportunity-aware anomaly remain blocked.

## Exact changed code files

'''+ '\n'.join('- `'+p+'`' for p in code))
manifest={'schema':'firepulse.nasa-acquisition-request/v1','status':'NOT_ACQUIRED_NOT_CALIBRATED','aoi':{'name':'South America','searchBBox':[-82,-56,-34,13],'membership':'Natural Earth 5.1.2 polygon union, not bounding-box country classification'},'pilotWindowUTC':['2024-08-01T00:00:00Z','2024-08-31T23:59:59Z'],'selection':'All intersecting swaths and overpasses, including valid no-detection pixels; do not select only hotspot-positive granules. Exact granule IDs/versions/SHA must be verified at acquisition. A pilot does not validate long-term calibration.','products':[
 {'products':['MOD14','MYD14'],'collection':'6.1','purpose':'L2 complete fire masks, valid/non-fire/cloud classes, detection flags','reference':'https://ladsweb.modaps.eosdis.nasa.gov/missions-and-measurements/products/MOD14/'},
 {'products':['MOD03','MYD03'],'collection':'6.1; verify each granule matches fire-mask acquisition','purpose':'Pixel geolocation, footprints, view geometry'},
 {'products':['MOD35_L2','MYD35_L2'],'collection':'6.1','purpose':'Cloud mask/QA; verify spatial/temporal matching','reference':'https://modarch.gsfc.nasa.gov/data/dataprod/mod35.php'},
 {'products':['VNP14IMG','VJ114IMG','VJ214IMG'],'collection':'2 / LAADS 5200; verify per-platform granules','purpose':'VIIRS full 375m L2 fire masks and QA','reference':'https://ladsweb.modaps.eosdis.nasa.gov/missions-and-measurements/products/VJ214IMG/'},
 {'products':['VNP03IMG','VJ103IMG','VJ203IMG'],'collection':'matching Collection 2 granules; verify catalog availability','purpose':'375m geolocation/geometry; do not assume uniform swath exposure'},
 {'products':['CLDMSK_L2_VIIRS_SNPP','CLDMSK_L2_VIIRS_NOAA20','CLDMSK_L2_VIIRS_NOAA21'],'collection':'product-specific continuity cloud-mask collection; NOAA21 documented v1.0/5110, not assumed equal to fire C2','purpose':'Cloud/valid-pixel opportunity screen with verified co-registration','reference':'https://ladsweb.modaps.eosdis.nasa.gov/missions-and-measurements/products/CLDMSK_L2_VIIRS_NOAA21'}], 'missingHistoricalArchive':{'source':'VIIRS S-NPP C2 Standard / FIRMS SV-C2','years':list(range(2012,2027)),'note':'No South America files supplied; acquire only actual platform-available dates through the verified last product date. 2026 is partial. Do not invent post-cessation data.'},'independentValidation':'Required spatially and temporally held-out opportunity units plus independently documented fire truth suitable for the target estimand. None supplied.'}
(out/'SOUTH_AMERICA_ACQUISITION_MANIFEST.json').write_text(json.dumps(manifest,indent=2))
doc('SOUTH_AMERICA_DOWNLOAD_CHECKLIST.md','''# Missing NASA data checklist

1. Request South America polygon/search extent [-82,-56,-34,13] in NASA FIRMS Archive Download for **VIIRS S-NPP C2 Standard**. Missing supplied years: **2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025, 2026**. Respect actual platform/product start and cessation dates; 2026 is partial. Keep original ZIPs, Readme, headers and processing metadata. Place them under `server/data/incoming/historical/` and rerun ingestion.
2. Ask FIRMS to clarify the actual `fire_archive_J1V-C2` and `fire_archive_J2V-C2` supplied lineage, dates and Standard-processing claim against the current export Readme. Do not rename or silently relabel these files.
3. Acquire the exact paired full-mask/geolocation/cloud products in SOUTH_AMERICA_ACQUISITION_MANIFEST.json for all intersecting pilot swaths, including no-hotspot granules. Preserve granule IDs, collection, acquisition, production time and checksum. Then design held-out validation across countries/seasons/years; do not extrapolate a pilot month to 26 years.
4. Daily NRT delivery gaps must be distinguished from dates without positive rows. The independent raw inventory lists actual delivered member dates. Request any absent daily members within each source ZIP's filename-date span; their absence is not a verified zero. Historical positive-date gaps likewise do not establish a missing file or complete acquisition coverage.

No NASA credentials are required for the supplied-file importer. Earthdata credentials for future acquisition must stay outside source control and public assets.
''')
print('REPORTS',audit['total'],pointer['generation'])
