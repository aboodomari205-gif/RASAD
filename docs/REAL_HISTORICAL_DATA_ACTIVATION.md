# Real historical data activation

Audit date: 2026-11-13. Local implementation and verification only; no deployment, publication or release package.

## Activated observations

| Region | Standard | NRT | Total | First / last actual UTC acquisition |
|---|---:|---:|---:|---|
| ajloun | 135 | 8 | 143 | 2006-12-03T10:34:00.000Z / 2026-09-04T10:43:00.000Z |
| northern-jordan | 6594 | 265 | 6859 | 2001-05-20T20:03:00.000Z / 2026-11-10T10:30:00.000Z |

These are delivered detections, not confirmed fires, independent events or acquisition coverage. Ajloun is a subset: never add 143 to 6,859. Default raw window is 2026: Ajloun 10 (2 standard / 8 NRT), North 803 (538 standard / 265 NRT). All historical years remain selectable.

## Inputs and integrity

Actual complete input folder: `server/data/incoming`, rather than the requested `data/incoming`. A further IDE tab may point at `server/incoming`; staging requires exactly one complete four-ZIP folder and fails on ambiguity. Originals were read only. Byte-identical CSV members were staged separately. No credentials/environment files are used.

| Original ZIP | SHA-256 |
|---|---|
| DL_FIRE_J1V-C2_844721.zip | `212179d1760c25169f3c1643f5b29ad65006f79c4cccfb69fb88af28b72cda29` |
| DL_FIRE_J2V-C2_844723.zip | `3c1ec57d7901c5c6cca065e4473344277e7c904d67b9dbfa7d781b9d889c9074` |
| DL_FIRE_M-C61_844700.zip | `5ba45b30cbecc513ecf02a95151dccf92d217796a724d2250370a778ac26bffb` |
| DL_FIRE_SV-C2_844716.zip | `256f76801ba2f63e5370082858e390dab5207dee4cb80737ad1a15270038d679` |

| CSV member | Input | First / last detection date | Raw satellites | Raw versions | SHA-256 |
|---|---:|---|---|---|---|
| fire_archive_J1V-C2_844721.csv | 5753 | 2018-04-03 / 2026-07-31 | {"N20": 5753} | {"2": 5753} | `ca11dfed48ec5e6d8ff4b399fcd21e87c2e8b5b4cd184f5deefa0c99ee83791f` |
| fire_nrt_J1V-C2_844721.csv | 200 | 2026-08-01 / 2026-11-11 | {"N20": 200} | {"2.0NRT": 200} | `babc1e15112c4e337835885d86f895b9e91ccdff3a373b72d1ce84a47d3d42d5` |
| fire_archive_J2V-C2_844723.csv | 2227 | 2023-03-01 / 2026-07-31 | {"N21": 2227} | {"2": 2227} | `1617d127793115166d140b51290470293ac4aac1a43850c6a98082bb32d8facd` |
| fire_nrt_J2V-C2_844723.csv | 221 | 2026-08-01 / 2026-11-12 | {"N21": 221} | {"2.0NRT": 221} | `1d89fc2203f3e000ee252bd3dbf69a52e3cc128b76264227347506e6a789b0d0` |
| fire_archive_M-C61_844700.csv | 1793 | 2000-11-24 / 2026-08-29 | {"Terra": 921, "Aqua": 872} | {"6.03": 1405, "61.03": 388} | `a4372d8056dec95bb19c4dd5b0d7e4c03853170468a86ad495a6058fc2792d10` |
| fire_nrt_M-C61_844700.csv | 23 | 2026-09-05 / 2026-11-11 | {"Terra": 18, "Aqua": 5} | {"6.1NRT": 23} | `370ca8b6e5412d2d31dba5972d0f806b5af8cdf4535ad79afa7144f376536980` |
| fire_archive_SV-C2_844716.csv | 8902 | 2012-01-20 / 2026-07-31 | {"SNPP": 8902} | {"2": 8902} | `b3685882f50c5603491160e1e1214af18690acb2eea0291632271161cb61fe7c` |
| fire_nrt_SV-C2_844716.csv | 205 | 2026-08-01 / 2026-11-02 | {"SNPP": 205} | {"2.0NRT": 205} | `247e9cd7f832ca1bb3a3b8dd7e876f86cb8e8f064f4b2714dbbfd393813e920e` |

Standard input 18,675; NRT 649; total 19,324. Standard CSVs contain 15 columns; NRT 14 (no `type`). Columns: `latitude, longitude, brightness, scan, track, acq_date, acq_time, satellite, instrument, confidence, version, bright_t31, frp, daynight[, type]`.

## Exact geographic reconciliation

Unchanged WGS84 GeoBoundaries ADM1 geometries in `public/jordan-adm1.geojson`; unchanged dissolved union `public/northern-jordan.geojson`. Existing boundary-source documentation: [Jordan region restructure](JORDAN_REGIONS_RESTRUCTURE_REPORT.md). Polygon/multipolygon holes remain respected; outer boundaries are included. Union inclusion counts each observation once. Independent Python ray casting reconciled all 19,324 raw inputs against the JavaScript importer. Current actual points have no double-governorate memberships; synthetic boundary/hole tests cover edge behavior.

| Governorate within Northern Jordan | Delivered records |
|---|---:|
| Mafraq | 4484 |
| Irbid | 1943 |
| Ajloun | 143 |
| Jerash | 289 |

Mafraq has 4,484 delivered observations in these new files. Older reports describing no activated Northern Jordan observations are historical snapshots, superseded by this activation.

| Region | Platform | Standard | NRT |
|---|---|---:|---:|
| ajloun | Aqua | 10 | 0 |
| ajloun | NOAA-20 | 58 | 3 |
| ajloun | NOAA-21 | 17 | 4 |
| ajloun | S-NPP | 49 | 1 |
| ajloun | Terra | 1 | 0 |
| northern-jordan | Aqua | 166 | 1 |
| northern-jordan | NOAA-20 | 2258 | 87 |
| northern-jordan | NOAA-21 | 815 | 92 |
| northern-jordan | S-NPP | 3172 | 83 |
| northern-jordan | Terra | 183 | 2 |

| UTC year | Ajloun standard | Ajloun NRT | North standard | North NRT |
|---|---:|---:|---:|---:|
| 2001 | 0 | 0 | 2 | 0 |
| 2002 | 0 | 0 | 2 | 0 |
| 2003 | 0 | 0 | 11 | 0 |
| 2004 | 0 | 0 | 10 | 0 |
| 2005 | 0 | 0 | 7 | 0 |
| 2006 | 2 | 0 | 15 | 0 |
| 2007 | 0 | 0 | 8 | 0 |
| 2008 | 0 | 0 | 12 | 0 |
| 2009 | 0 | 0 | 6 | 0 |
| 2010 | 1 | 0 | 11 | 0 |
| 2011 | 0 | 0 | 19 | 0 |
| 2012 | 1 | 0 | 246 | 0 |
| 2013 | 0 | 0 | 235 | 0 |
| 2014 | 1 | 0 | 195 | 0 |
| 2015 | 5 | 0 | 261 | 0 |
| 2016 | 3 | 0 | 158 | 0 |
| 2017 | 2 | 0 | 180 | 0 |
| 2018 | 3 | 0 | 342 | 0 |
| 2019 | 14 | 0 | 510 | 0 |
| 2020 | 6 | 0 | 665 | 0 |
| 2021 | 13 | 0 | 591 | 0 |
| 2022 | 3 | 0 | 454 | 0 |
| 2023 | 22 | 0 | 647 | 0 |
| 2024 | 30 | 0 | 856 | 0 |
| 2025 | 27 | 0 | 613 | 0 |
| 2026 | 2 | 8 | 538 | 265 |

Displayed zero counts in this reconciliation table mean no rows in these specific files/year/stratum, never verified zero thermal activity. Full per-governorate/platform/year/processing cross-tabulation, dates and input checksums are available as aggregate-only [HISTORICAL_ACTIVATION_COUNTS.json](HISTORICAL_ACTIVATION_COUNTS.json).

## Import, duplicates and rollback

| Region | Member | Input | Accepted | Spatially excluded | Rejected | Replay duplicates |
|---|---|---:|---:|---:|---:|---:|
| ajloun | fire_archive_J1V-C2_844721.csv | 5753 | 58 | 5695 | 0 | 58 |
| ajloun | fire_nrt_J1V-C2_844721.csv | 200 | 3 | 197 | 0 | 3 |
| ajloun | fire_archive_J2V-C2_844723.csv | 2227 | 17 | 2210 | 0 | 17 |
| ajloun | fire_nrt_J2V-C2_844723.csv | 221 | 4 | 217 | 0 | 4 |
| ajloun | fire_archive_M-C61_844700.csv | 1793 | 11 | 1782 | 0 | 11 |
| ajloun | fire_nrt_M-C61_844700.csv | 23 | 0 | 23 | 0 | 0 |
| ajloun | fire_archive_SV-C2_844716.csv | 8902 | 49 | 8853 | 0 | 49 |
| ajloun | fire_nrt_SV-C2_844716.csv | 205 | 1 | 204 | 0 | 1 |
| northern-jordan | fire_archive_J1V-C2_844721.csv | 5753 | 2258 | 3495 | 0 | 2258 |
| northern-jordan | fire_nrt_J1V-C2_844721.csv | 200 | 87 | 113 | 0 | 87 |
| northern-jordan | fire_archive_J2V-C2_844723.csv | 2227 | 815 | 1412 | 0 | 815 |
| northern-jordan | fire_nrt_J2V-C2_844723.csv | 221 | 92 | 129 | 0 | 92 |
| northern-jordan | fire_archive_M-C61_844700.csv | 1793 | 349 | 1444 | 0 | 349 |
| northern-jordan | fire_nrt_M-C61_844700.csv | 23 | 3 | 20 | 0 | 3 |
| northern-jordan | fire_archive_SV-C2_844716.csv | 8902 | 3172 | 5730 | 0 | 3172 |
| northern-jordan | fire_nrt_SV-C2_844716.csv | 205 | 83 | 122 | 0 | 83 |

The first successful isolated generation inserted 143 Ajloun / 6,859 North records. Replaying accepted records inserts **0**, reporting 143 / 6,859 exact duplicates. Input processing is independent per region; do not add their accepted counts as distinct global observations. All final rows rejected: 0. Earlier isolated validation attempts exposed a raw `SNPP` instrument/platform mismatch and were never activated; the explicit profile now handles it without altering raw values.

All 19 old MODIS input rows and 128 old S-NPP input rows are byte-field-identical to rows in the enlarged deliveries (independent audit assertions). The previous 36-observation pilot is retained in the original `server/data/history.sqlite`, not concatenated with the new catalog. Dataset namespaces and resulting IDs differ from the retired pilot; legacy bookmarks/exports keep their original IDs and must not be joined by ID across generations without an explicit crosswalk. New source files use stable per-region/platform/stage dataset IDs for incremental imports. Raw-identical overlap within a dataset is deduplicated; nearby observations, distinct platforms and standard/NRT records are not collapsed into fire events.

Source checkpoint: `.checkpoints/historical-before/`. Current pointer: `server/data/active-history.json`; active generation `history-f3cb30006dd2f0ff.sqlite`. The original database and ZIPs remain intact. New generations use a separate candidate database, member-level transactions and an atomic pointer rename only after all members validate. On a member syntax failure its transaction rolls back; rejected rows block publication. Generation-named reports/summaries stay tied to the pointer. For maintenance rollback, stop the local server and move the pointer aside to restore the original catalog; retain both databases and restore the pointer to reactivate. No rollback was performed against the working application.

Reproduce from the repository root (Node supports `node:sqlite`, Python 3 required):

```powershell
python scripts/stage-historical-deliveries.py
python scripts/audit-historical-geography.py
node server/activateHistorical.js
node scripts/verify-historical-api.mjs
```

The delivery activation script intentionally pins these four deliveries and 19,324 rows. Future differently shaped deliveries require reviewing the expected manifest/schema; the reusable streaming importer remains available. Batch size: 500; a staged CSV member is capped at 16 MiB. This is bounded batch ingestion, not unbounded large-ZIP ingestion. SQLite and the pointer require persistent storage for a production Node backend; no writes to an ephemeral Cloudflare filesystem are assumed.

## Product identity and scientific harmonization

Verified against official [FIRMS delivery README](https://firms.modaps.eosdis.nasa.gov/download/Readme.txt), [MODIS attributes](https://firms.modaps.eosdis.nasa.gov/content/descriptions/FIRMS_MODIS_Firehotspots.html), [VIIRS attributes](https://firms.modaps.eosdis.nasa.gov/content/descriptions/FIRMS_VIIRS_Firehotspots.html) and [VIIRS Collection 2 guide](https://www.earthdata.nasa.gov/s3fs-public/2024-07/VIIRS_C2_AF-375m_User_Guide_1.0.pdf). These are active thermal detections, not burned-area products. Documentation was retrieved in this task.

- MODIS standard: MCD14ML Collection 6.1 delivery; NRT MCD14DL. Terra and Aqua retain their actual row platforms. `6.03` and `61.03` remain unchanged opaque raw revision strings, not corrected or treated as errors. Dataset collection 6.1 and row revision are separate concepts.
- S-NPP standard: VNP14IMGTML C2; NRT VNP14IMGTDL C2. Delivered raw `SNPP` satellite/instrument identifiers are retained; canonical sensor VIIRS and platform S-NPP are explicit mappings.
- NOAA-20 / NOAA-21: official delivery families J1V-C2 / J2V-C2, raw N20/N21, canonical NOAA-20/NOAA-21. Source-declared `fire_archive` stage and row version `2` are preserved. The live FIRMS README still says standard NOAA-20/21 data are unavailable, conflicting with these actual delivered archive members. Upstream monthly-product short names are therefore **not invented**: opaque delivery-family product identifiers are used. Exact upstream processing lineage remains NEEDS REVIEW with the supplier. No calibrated inter-product equivalence is asserted.
- VIIRS documentation describes I4 brightness, but shared delivery column names remain original `brightness` and `bright_t31`; no blind MODIS channel interpretation or automatic TI4/TI5 relabeling is performed. The documentation lists NOAA temporal availability later than some actual delivered records; actual timestamps are preserved, and this discrepancy needs supplier review before strong historical comparability claims.
- Implemented: validated WGS84 positions, UTC acquisition timestamps, sensor/platform normalization with original fields, confidence semantics, nullable FRP, processing/source/version-separated daily/monthly/yearly summaries, aligned observed-date calendar and exploratory threshold matching.
- Existing exploratory baseline remains 1 km / 60 minutes with processing compatibility, candidate pairs, distinct participating observations and transitive connected groups clearly separated. Ajloun 2023 guide example: 22 source observations (2 MODIS / 20 VIIRS), 12 candidate pairs, 13 participating observations, 1 connected group. These are not probabilities or independent events.
- Not established: harmonized sensitivity, acquisition exposure, cloud masks, true misses, fire-event truth, calibrated confidence, burned area, recurrence baseline or validated anomalies. MODIS percentages and VIIRS categorical confidence remain different schemes. FRP sums are reported pixel power, not energy or interchangeable fire intensity.
- Physical normalization is intentionally **not implemented**: delivered hotspot tables do not supply the coverage/exposure and validation needed to justify a conversion factor. Source-aware descriptive comparisons are defensible within the selected UTC scope.

## Product integration and API

Both regions use the same canonical source, filters and processing control in Atlas, Calendar and Intelligence. Calendar retains source/platform/stage/version/confidence contributions, even with multiple VIIRS platforms. The single-dataset safety guard remains for unreviewed legacy inputs. All current numbers are scoped calculations; the judge guide explicitly selects a real data-bearing example year. Unknown dates remain unavailable, not verified zero.

API contracts preserved, with additive query/metadata support:

- `/api/observations?mode=ajloun` or `mode=northern-jordan`: default **latest observed UTC year**, features 10 / 803; no whole-history raw transfer.
- Add `&manifest=1`: zero features with `historical`, `defaultYear`, `availableYears`, `observedExtent`, `totalDelivered`, `yearCounts`, `yearPaths`, `summaryPath`, `exampleYears`, `activationRevision`.
- Add `&year=2023`: raw bounded year through the existing GeoJSON contract.
- Add `&summary=year` (also day/month): source-separated preaggregates.
- Existing `/api/history/{observations,aggregates,coverage,comparison}` and `/api/intelligence/...` remain; `processing=standard|nrt` is additive. Acquisition coverage remains unknown.

The local static transport uses `/archive-data/<region>.json` manifests, `/archive-data/<region>/<year>.json`, and separate summary JSON. No Express server is needed. Raw browser evidence is limited to three consecutive UTC years and 3,000 source observations, checked before shard download. Whole-history source-separated annual summaries are explicitly unfiltered regional overviews, not current-filter statistics. Full daily/monthly summaries are available separately on demand. Browser requests inspected in acceptance loaded year shards only (2026, 2006, 2023), never all 6,859 North rows together.

## Verification and performance

Detailed final execution status and measured results are appended below after all gates finish.

## Local review

```powershell
npm run build
node deployment/cloudflare/build-static.mjs .checkpoints/historical-static
node deployment/cloudflare/serve-static.mjs .checkpoints/historical-static
```

Open `http://127.0.0.1:5179`. Skip/enter the unchanged Earth intro. Ajloun defaults to 2026 (10). Switch to North (803); compare Standard 538 / NRT 265. Open Calendar and select Ajloun December 2006 (2), inspect a day and export CSV. Open Evidence Engine, start the guide to select 2023 (22), inspect candidate pairs and source handoff, export Research Brief. Switch North/Ajloun while keeping a compatible date/sensor. Review English/Arabic, 390px width, reduced motion and the annual overview. Screenshots: `.checkpoints/historical-desktop.png`, `.checkpoints/historical-ar-mobile.png`.

## Remaining blockers / next scientific task

GO for an honestly scoped local historical-detection demonstration. NO-GO for calibrated cross-sensor intensity, continuous historical coverage or operational fire alerts. Highest-priority next scientific task: obtain authoritative acquisition/valid-pixel/cloud coverage and reconcile NOAA-20/21 standard processing lineage, then design an independently validated exposure-aware comparability method. Do not add a universal sensor conversion or fill missing dates with zero.

No public URL was tested. No deployment, publishing, pushing or release ZIP was performed.

## Final executed acceptance results

All following commands completed with exit code 0 in the final sequential acceptance run. Evidence: `.checkpoints/historical-acceptance.json`; logs `.checkpoints/history-<name>.log`.

| Command | Result |
|---|---|
| `npm run build` | PASS |
| `npm run lint` | PASS |
| `npm test` | PASS ? 100 tests, 0 failed, 0 skipped |
| `npm run verify:release` | PASS |
| `node deployment/cloudflare/build-static.mjs .checkpoints/historical-static` | PASS |
| `node deployment/cloudflare/build-static.mjs .checkpoints/historical-baseline-static --baseline` | PASS |
| `npm run test:e2e` | PASS |
| `npm run test:language` | PASS |
| `node scripts/verify-historical-browser.mjs .checkpoints/historical-static` | PASS |
| `node scripts/verify-static-archives.mjs .checkpoints/historical-baseline-static` | PASS |
| `node scripts/verify-historical-api.mjs` | PASS |

Independent staging and geography commands also passed; original and active SQLite `PRAGMA integrity_check` both returned `ok`. The old 36-record test baseline is explicitly injected into existing E2E/language/static regression suites to retain their original exact assertions. The additional real-history browser/API suites separately verify 143/6,859 totals, actual current windows and activated North behavior; no baseline assertion was replaced with a weaker number.

New deterministic coverage includes explicit product/raw identifiers, UTC boundary, NRT rejection in a standard profile, transactional late-row rollback, idempotent imports, deterministic source-separated periods, null/zero FRP, conflicting IDs, reviewed multi-platform Calendar contributions, exact actual candidate results, oversized-window rejection before download and historical region/date reconciliation. Existing boundary/hole, malformed input, threshold sensitivity, transitive groups, CSV integrity, bilingual and judge-guide tests remain.

Actual history browser acceptance additionally exercised all five Intelligence modules, regional Standard/NRT windows, Ajloun December 2006 CSV, 2023 guide matching (12/13/1), repeated same-scope source popup handoff, original source ZIP/member provenance in Research Brief, older-year MODIS selection retained on North/Ajloun round-trip, Arabic 390px RTL without horizontal overflow, reduced motion and the same MapLibre canvas. Reviewed actual desktop and Arabic mobile screenshots.

Fixed regressions found during this work: retained-map region race; unavailable/multi-platform Calendar handling; stale North-unavailable copy; latest-year reconciliation discarding older valid dates; and an asynchronous source-popup handoff that could be cleared by filter/data effects. Tests now explicitly repeat a same-scope source handoff. Earlier browser runs failed `Browser condition timed out: !!document.querySelector(".atlas-popup-title") && !document.querySelector(".evidence-engine")`; final E2E and both static suites pass after the fix.

Environment interruption: a repeated acceptance run hit `ENOSPC: no space left on device, write` and SQLite `database or disk is full`. Test execution was stopped; only test-created `firepulse-motion-*` temporary Chrome profiles were removed after path validation. A truncated map source was restored from the reversible source checkpoint, the historical changes reapplied, both database integrity checks passed, original ZIP/member hashes rechecked, and **all final gates were rerun successfully**. NASA inputs and the original baseline were preserved.

## Measured local performance

Ten HTTP+JSON samples per endpoint, including local Express/indexed SQLite access; timings are environment-specific, not deployment latency.

| Endpoint | Features | Median ms | Min / max ms |
|---|---:|---:|---:|
| `/api/observations?mode=ajloun&manifest=1` | 0 | 7.59 | 5.90 / 47.68 |
| `/api/observations?mode=ajloun&year=2026` | 10 | 5.53 | 4.96 / 6.80 |
| `/api/observations?mode=ajloun` | 10 | 5.22 | 4.95 / 5.69 |
| `/api/observations?mode=northern-jordan&manifest=1` | 0 | 17.15 | 14.91 / 35.99 |
| `/api/observations?mode=northern-jordan&year=2026` | 803 | 23.77 | 21.72 / 25.53 |
| `/api/observations?mode=northern-jordan` | 803 | 22.11 | 21.47 / 23.51 |

Local production static browser load event: 364.0 ms; DOMContentLoaded: 363.0 ms. Post-workflow JS heap 49,344,448 bytes (47.1 MiB), allocated heap 95,100,928 bytes; cumulative task time 3.295 s. No forced GC, low-end hardware, real mobile or WebGL GPU benchmark was performed. Remote map tile readiness is not represented by the document load event.

Largest North raw year shard: 2024, 856 observations, 799262 bytes. Full-history North yearly summary: 24539 bytes. Replaced the initially larger mixed-resolution overview payload with the dedicated yearly summary. No unsupported before/after hardware-performance claim is made.

Production bundle warnings remain for the existing Three/EarthScene and MapLibre chunks (approximately 924 kB and 1,103 kB minified); initial app chunk approximately 471 kB. Bundled MapLibre worker remains approximately 519 kB. No dependencies were installed or architecture replaced. These are local asset measurements, not proof of submission-host performance.

## Exact source files changed relative to the task checkpoint

- `src/App.css`
- `src/FireMap.tsx`
- `src/calendar/aggregation.ts`
- `src/calendar/BurningCalendar.tsx`
- `src/calendar/CalendarDayDetails.tsx`
- `src/calendar/useCalendarObservations.ts`
- `src/components/AtlasFilters.tsx`
- `src/components/ProcessingScope.tsx`
- `src/components/RegionExplorer.tsx`
- `src/i18n/evidence-ar.ts`
- `src/intelligence/EvidenceEngine.tsx`
- `src/intelligence/HistoryOverview.tsx`
- `src/intelligence/IntelligenceWorkspace.tsx`
- `src/intelligence/JudgeGuide.tsx`
- `src/state/MissionContext.tsx`
- `shared/activation.ts`
- `shared/historySummary.ts`
- `shared/model.ts`
- `shared/observations.ts`
- `shared/regionScope.ts`
- `server/activateHistorical.js`
- `server/app.test.js`
- `server/archiveProfiles.js`
- `server/archiveStore.js`
- `server/dataCatalog.js`
- `server/firmsArchive.js`
- `server/foundation.test.js`
- `server/importArchive.js`
- `server/observations.js`
- `server/observations.test.js`
- `server/productVerification.js`
- `scripts/audit-historical-geography.py`
- `scripts/audit-nasa-deliveries.py`
- `scripts/stage-historical-deliveries.py`
- `scripts/verify-historical-api.mjs`
- `scripts/verify-historical-browser.mjs`
- `scripts/verify-language.mjs`
- `scripts/verify-motion.mjs`
- `scripts/verify-static-archives.mjs`
- `deployment/cloudflare/build-static.mjs`
- `tests/calendarCSV.test.ts`
- `tests/historicalActivation.test.ts`
- `tests/jordanRegions.test.ts`
- `.gitignore`
- `docs/REAL_HISTORICAL_DATA_ACTIVATION.md`
- `docs/HISTORICAL_ACTIVATION_COUNTS.json`

Generated local data: staged CSV copies and delivery audit, generation SQLite/pointer/import report, independent reconciliation and source-separated summary JSON under ignored `server/data/`. Generated static browser-only test builds and screenshots remain under ignored `.checkpoints/`. No datasets or secrets were committed, and no release package was created.
