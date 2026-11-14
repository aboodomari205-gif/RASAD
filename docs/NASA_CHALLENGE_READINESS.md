# NASA challenge readiness — 13 November 2026

## Decision

**GO for an honestly bounded local scientific demonstration. Official challenge/submission compliance remains UNVERIFIED.** No known local functional blocker remains in the checks below. This is a descriptive thermal-detection prototype with exploratory cross-sensor associations, not calibrated fire-event inference. No deployment or public URL was verified in this review.

## Evidence reviewed

Read the scientific harmonization implementation, SCIENTIFIC_HARMONIZATION_ENGINE.md, SCIENTIFIC_VALIDATION_RESULTS.md, SCIENTIFIC_DATA_AUDIT.json, SCIENTIFIC_INDEPENDENT_CHECK.json, prior data/product audits, and the supplied-objective alignment documentation. Reviewed shared models, filtering, aggregations, matching, research exports and active scientific UI copy. Earlier reports describing 36 Ajloun records are historical snapshots, not the current activated catalog.

The active database revision is f3cb30006dd2f0ff02df206024189da7757d40cd02e6708c2e5374f03a73910f. Read-only audit and independent Python checks reconcile aggregation and selected matching results; they establish computational consistency, not scientific calibration. Source observations were not changed or reimported.

| Scope | Delivered detections | MODIS / VIIRS | Standard / NRT | Exploratory 1 km / 60 min: pairs / participating observations / groups |
|---|---:|---:|---:|---:|
| Ajloun, full activated history | 143 | 11 / 132 | 135 / 8 | 15 / 18 / 3 |
| Northern Jordan, full activated history | 6859 | 352 / 6507 | 6594 / 265 | 245 / 272 / 52 |
| Ajloun, 2023 guided scope | 22 | 2 / 20 | 22 / 0 | 12 / 13 / 1 |

Ajloun is a subset of Northern Jordan: these region totals must not be added. Catalog totals differ from the map's selected-year/date/filter totals. July 2023 Ajloun contains 18 observations (2 MODIS, 16 VIIRS); July 14 contains 2 MODIS and 11 VIIRS. These are delivered detections, not independent fires or complete acquisition coverage.

## User-facing claim audit and corrections

| Experience | Audit conclusion / targeted correction |
|---|---|
| Landing and mission entry | Existing problem/solution framing retained; no new calibration or prediction claim introduced. |
| Atlas | Corrected Northern Jordan editorial region label and selected-observation kicker that incorrectly said Ajloun. Counts describe displayed detections. |
| Burning Calendar | Preserved source-separated counts, missing-data cells and FRP semantics. Corrected Northern Jordan single-sensor day accessibility labels. Unobserved days are not verified zero. |
| Fire Season Clock | Descriptive distributions of delivered detections only; unknown periods remain unknown. Seasonal bins do not establish climatology or predict a fire season. |
| Fire DNA | Clarified that the two-year standard source/platform/product/version gate is a software screening rule, not validated recurrence or complete coverage. |
| Sensor Intelligence | Clarified that absent detections cannot establish absent activity. Raw confidence schemes, source/platform and nominal sensor facts remain separate. |
| Agreement Lab / robustness | Candidate edges, unique participating IDs and transitive connected groups remain distinct. Threshold stability is stability across tested settings, not probability or calibrated confidence. |
| Evidence Engine | Retained unknown-coverage gates and exploratory methodology. Added visible NOAA-20/21 source-lineage warning and clarified first delivered dates are scope-specific, not satellite introduction dates. |
| Anomaly Detection | Explicitly states missing acquisition coverage and independently validated baseline methodology. Numerical anomaly scoring remains disabled. |
| Decision / Research Brief | Corrected outdated denial of historical comparison: delivered source-separated comparisons exist; calibrated trends, validated anomalies and operational alerts do not. Standard and NRT both exist and remain separated. Export retains unvalidated methodology and null unsupported baseline/anomaly outputs. |

Arabic translations were added for changed scientific wording. No algorithms, thresholds, regions, source observations, intro behavior or layout were redesigned.

## Official sources and compliance boundary

On this review, the [provided official challenge URL](https://www.spaceappschallenge.org/2026/challenges/modis-and-viirs-hot-spots/), [2026 index](https://www.spaceappschallenge.org/2026/), [challenge index](https://www.spaceappschallenge.org/2026/challenges/) and [legal page](https://www.spaceappschallenge.org/legal/) returned 502; an alternative challenge slug timed out. Therefore full official challenge requirements, judging rubric, submission deadline/timezone, eligibility and publication requirements are **unverified**. Owner-supplied objectives in OFFICIAL_CHALLENGE_ALIGNMENT.md are explicitly a conditional alignment basis, not independently retrieved rules.

The accessible [NASA event announcement](https://science.nasa.gov/universe/nasa-welcomes-all-ages-experience-levels-for-space-apps-challenge/) identifies November 14–15, 2026 as the event dates. This does not establish this project's exact submission deadline or eligibility.

Against the supplied objectives, demonstrated contributions are canonical schema/UTC/source preservation; source-separated calendar/time series; selected regions and dates; downloadable analytics; and transparent exploratory associations with sensitivity. Detection sensitivity, acquisition opportunity, sampling and radiometric calibration are **not** harmonized. Early-2000s-to-present completeness, historical medians and validated unusual-condition detection are not demonstrated. Do not present suggested examples in supplied text as verified mandatory rules.

## NOAA-20/21 unresolved source lineage

The [official FIRMS download README](https://firms.modaps.eosdis.nasa.gov/download/Readme.txt) identifies M-C61, SV-C2, J1V-C2 and J2V-C2 families, but still states NOAA-20/21 standard processing is unavailable. Actual delivered J1V/J2V fire_archive files declare version 2 and archive processing. Consequently their standard classification is **delivery-declared**, not independently resolved upstream processing lineage.

| Platform | Earliest actual full-input archive detection | Earliest Northern Jordan / Ajloun detection | Current FIRMS web-layer documented start |
|---|---|---|---|
| NOAA-20 | 2018-04-03 | 2018-04-13 / 2018-06-09 | 2020-01-01 |
| NOAA-21 | 2023-03-01 | 2023-03-01 / 2023-06-18 | 2024-01-17 |

The [official VIIRS description](https://firms.modaps.eosdis.nasa.gov/content/descriptions/FIRMS_VIIRS_Firehotspots.html) documents the web-layer dates. A difference between delivery dates and web-layer documentation is an unresolved scope/lineage issue, not proof of corruption or permission to rewrite dates. Preserve raw versions, coordinates, timestamps and confidence. MODIS 6.03/61.03 and VIIRS 2/2.0NRT remain original values. Do not invent NOAA upstream monthly product names, verified operational start dates, calibration or provider endorsement. Request delivery-specific processing documentation, requested UTC/AOI scope and an explanation of earlier records from the supplier before stronger lineage claims.

## Verification executed

All commands below exited 0. Exact logs and exit codes are in .checkpoints/readiness-acceptance.json and readiness-*.log.

| Command | Result |
|---|---|
| npm run build | PASS |
| npm run lint | PASS |
| npm test | PASS: 114 tests, 0 failed/skipped |
| node scripts/audit-scientific-data.mjs | PASS; read-only integrity and spatial/data audit |
| python scripts/verify-scientific-independent.py | PASS; independent period/FRP/selected exhaustive matching reconciliation |
| npm run test:e2e | PASS |
| npm run test:language | PASS |
| node scripts/verify-claim-audit.mjs | PASS; actual localhost:5173, current data, English/Arabic, export assertions |
| node scripts/verify-historical-explorer.mjs | PASS |
| node scripts/verify-scientific-browser.mjs | PASS; actual development-browser scientific workflow |
| node scripts/verify-atlas-layout.mjs | PASS |
| node scripts/verify-exploration-panel.mjs | PASS |
| npm run verify:release | PASS; assets/worker/configuration, not deployment |

Legacy E2E/language suites intentionally use a controlled older pilot baseline. Current-history/scientific/claim suites separately verify activated history; do not treat isolated baseline assertions as current catalog counts. New browser regression verifies North labels, Arabic lineage warning at 320 px, disabled anomaly scoring, Ajloun July CSV (18 rows), 2023 candidate change 12/13/1 to 5/6/1, and research export with 22 records, five edges and unvalidated/null scientific outputs. Screenshot: [.checkpoints/readiness-evidence.png](../.checkpoints/readiness-evidence.png). No runtime exceptions were collected by that regression.

## Exact changes

- src/FireMap.tsx
- src/components/AtlasInspector.tsx
- src/calendar/BurningCalendar.tsx
- src/intelligence/IntelligenceWorkspace.tsx
- src/components/ScientificContext.tsx
- src/i18n/evidence-ar.ts
- scripts/verify-claim-audit.mjs (new regression)
- docs/NASA_CHALLENGE_READINESS.md
- docs/JUDGING_EVIDENCE_MATRIX.md
- docs/THREE_MINUTE_DEMO.md

Audit JSON reports were regenerated by their existing read-only scripts; local logs/screenshots/checkpoints are verification artifacts. No source data import or deployment occurred.

## Critical blockers and acceptance

1. **Administrative compliance unverified:** team must obtain official current challenge/rules, deadline/timezone, eligibility (including any pre-existing-work policy), and required submission assets before claiming submission readiness. No rule violation is inferred from unavailable pages.
2. **Scientific claim boundary:** unresolved NOAA lineage and unknown acquisition coverage block stronger processing/calibration, verified-zero, anomaly, recurrence and incidence claims. They do not prevent this disclosed descriptive prototype demonstration.
3. **Local functionality:** no known blocking failure in executed checks. A timed human rehearsal is still needed; the three-minute script is a target, not a measured first-time usability result. Public deployment is outside this review.

Final acceptance: run the listed commands, follow THREE_MINUTE_DEMO.md, inspect selected region/year and export IDs, retain source caveats, and confirm official administrative requirements separately. Do not expand the data or algorithms to conceal these limitations.

