# Final alignment with the complete supplied NASA objectives

2026-11-14. This is the current scientific acceptance decision, superseding the bounded A-G verdict in NASA_CHALLENGE_CORE_FINAL.md. The complete challenge statement supplied by the owner in this task is the authoritative specification for this assessment. It is no longer assessed merely against a search snippet. Independent retrieval of the entire official challenge page was unsuccessful in earlier passes; that source-authentication limitation is separate from the now explicit supplied objectives. No claims about submission administration or NASA endorsement follow.

## Decision first

**NO-GO for declaring the full scientific challenge objective completed.** The application provides working source-aware structural integration and a useful multi-channel UTC history. It does **not** establish sensor-independent continuity in which detection origin ceases to dominate interpretation. Unknown exposure, detection sensitivity and source-lineage discrepancies prevent estimating a defensible calibrated transfer between MODIS and VIIRS from these deliveries alone. Passing software tests does not remove that core limitation.

**GO for an honestly scoped working demonstration** of the web/calendar/region/date/download requirements, descriptive history, candidate associations, sensitivity, observed peak/unusual periods and the newly implemented source-specific descriptive historical median. No algorithmic substitute is labeled sensor calibration. No code path supplies corrected fire counts, a validated anomaly, verified zero days or predictions.

## Complete supplied statement: compliance matrix

Quoted requirements below are from the owner's complete supplied NASA statement, treated as the authoritative task specification. The [official challenge address](https://www.spaceappschallenge.org/2026/challenges/modis-and-viirs-hot-spots/) remains the cited challenge location, not a claim that this pass independently authenticated its full text.

| Exact supplied objective | Category | Implementation and acceptance evidence | Status / decision |
|---|---|---|---|
| "Develop a harmonized burning activity calendar using active-fire hotspots, combining the historical MODIS series with VIIRS continuity and detail to provide a consistent time series of hotspot activity." | Central core | `shared/observations.ts`, `shared/scientificEngine.ts`, `shared/historySummary.ts`, Calendar: shared UTC/source model and time axis, original provenance, multi-channel sensor series. Real 143 / 6,859 records and original IDs independently checked. | **PARTIAL / NO-GO for complete objective**: consistent structure/time bins exist, calibrated cross-sensor continuity does not. |
| "MODIS and VIIRS cannot be compared directly because spatial resolution, sensitivity and observation schedules differ." | Core scientific constraint | Exact-stratum comparisons, distinct confidence schemes, explicit integration-vs-calibration status in scientific output and explorer; no conversion. Tests assert calibrated-equivalent counts remain null. | **PASS / GO** as a constraint; not a solved calibration. |
| "The first part is harmonization so that sensor origin no longer dominates interpretation." | Core desired scientific outcome | Candidate matching, uncertainty, exact time/distance and processing screens help inspect coincidences. `harmonizationStatus.sensorIndependentSeries='unavailable'` explicitly reports the unsolved objective. | **NOT ESTABLISHED / NO-GO**: no exposure/sensitivity evidence identifies a sensor-neutral activity quantity. |
| "The second part is a web app where users select a region and date range and download analytics and visualizations." | Core functional objective | `src/App.tsx`, `src/FireMap.tsx`, `src/calendar/BurningCalendar.tsx`, `src/calendar/combined.ts`, `src/calendar/visualization.ts`; two verified AOIs, date/year filters, CSV, self-contained SVG, evidence/research JSON. API/browser and independent export tests. | **PASS / GO**, for predefined Ajloun/Northern Jordan. |
| "The calendar should support historical examination of seasonal patterns, critical periods and unusual conditions." | Core functional/scientific exploration | `shared/historyComparison.ts`, `shared/observedPeriods.ts`, HistoryOverview, MonthComparison, seasonal clock, ObservedPeriodExplorer. Actual source-stratified history, prior-maximum comparison, same-month median, peak ranking; Calendar/Atlas/source handoffs tested. | **PASS / GO for descriptive delivered activity**; no validated anomaly or forecast claimed. |
| "The early-2000s-to-present calendar and historical-median example are desirable challenge outcomes, but do not fabricate completeness or comparable medians where observations are missing." | Desirable outcomes + binding honesty constraint | North has delivered MODIS detections from 2001 and S-NPP from 2012, not continuous acquisition evidence. NEW conditional descriptive median uses eligible prior observed same-month exact-stratum samples only; insufficient history -> null. | **PARTIAL / GO for eligible descriptive median**, **NO-GO for claiming complete continuous history**. |
| "AOI drawing, coordinates, accessible color ramps and specific indices are potential considerations, not mandatory standalone requirements." | Suggested considerations | Existing predefined authoritative polygons, exported coordinates and accessible labeled source distinctions retained. No arbitrary AOI drawing or invented index added. | **Not standalone completion blockers**; no optional feature substituted for the core scientific gap. |

## Actual data and scientific investigation

The active SQLite generation and archive integrity were rechecked without editing observations. Scope counts remain Ajloun **143** (11 MODIS, 132 VIIRS) and North **6,859** (352 MODIS, 6,507 VIIRS). Ajloun is a subset, not an additional contribution to the north. All active records have exact UTC timestamps and reported FRP in this delivery; that does not establish sampling completeness. The coordinate/time repeat diagnostic finds no exact signature repeats in either scope, but it is not independent fire-event identification.

Selected exact delivered strata (counts are detections, not events):

| Scope | Sensor/platform/raw version/processing | Count | Actual delivered date extent |
|---|---|---:|---|
| Ajloun | MODIS Aqua / 6.03 / standard | 7 | 2006-12-03 .. 2021-06-24 |
| Ajloun | MODIS Aqua / 61.03 / standard | 3 | 2023-07-14 .. 2025-07-02 |
| Ajloun | MODIS Terra / 6.03 / standard | 1 | 2010-11-30 |
| Ajloun | VIIRS S-NPP / 2 / standard | 49 | 2014-09-21 .. 2026-07-20 |
| North | MODIS Aqua / 6.03 / standard | 129 | 2002-08-29 .. 2022-12-17 |
| North | MODIS Terra / 6.03 / standard | 139 | 2001-05-20 .. 2022-07-31 |
| North | MODIS Aqua / 61.03 / standard | 37 | 2023-07-11 .. 2026-08-03 |
| North | MODIS Terra / 61.03 / standard | 44 | 2023-01-24 .. 2026-08-03 |
| North | VIIRS S-NPP / 2 / standard | 3,172 | 2012-01-20 .. 2026-07-31 |
| North | VIIRS NOAA-20 / 2 / standard | 2,258 | 2018-04-13 .. 2026-07-28 |
| North | VIIRS NOAA-21 / 2 / standard | 815 | 2023-03-01 .. 2026-07-31 |

Other Ajloun contributions: NOAA-20 standard 58, NOAA-21 standard 17, and 8 NRT observations across VIIRS platforms. North additionally has 265 NRT observations (3 MODIS, 262 VIIRS). Standard/NRT and raw versions are separate; no original version strings were rewritten. Earlier reports restricted to five Ajloun MODIS Aqua records concern an older 2020-2025 delivery, not this expanded active history; the current Ajloun scope really includes one Terra record.

### Authoritative sensor facts versus delivered evidence

The [NASA FIRMS MODIS description](https://firms.modaps.eosdis.nasa.gov/content/descriptions/FIRMS_MODIS_Firehotspots.html) was retrieved successfully this pass: nominal 1 km fire pixels, acquisition UTC, platform-specific or combined Terra/Aqua products, numerical confidence, and processing-source version semantics. Scan/track varies actual pixel size; nominal size does not give acquisition footprints. Pixel centers need not locate an individual fire. These facts do not decode undocumented raw subversion components such as `.03`; opaque originals remain intact.

The [NASA FIRMS VIIRS description](https://firms.modaps.eosdis.nasa.gov/content/descriptions/FIRMS_VIIRS_Firehotspots.html) was also retrieved: nominal 375 m detections, better response to small fires/nighttime, categorical confidence and UTC, with a different FRP retrieval. Its brightness alias documentation does not license replacing original delivered columns silently. Nominal orbital schedules cannot prove local swath/cloud/valid-pixel coverage. Current documentation lists NOAA-20 availability from 2020 and NOAA-21 from 2024, while delivered records predate these dates. This unresolved upstream lineage discrepancy remains warned in UI and exports; records, dates and versions were not corrected by assumption.

### Options evaluated against available evidence

| Option | What existing evidence supports | Decision |
|---|---|---|
| Canonical UTC multi-channel series retaining exact source/product/platform/version/processing/confidence | Reproducible calendar and descriptive comparisons, independent of inconsistent CSV column names; preserves sensor interpretation | **Implemented and retained**. This is structural integration, not a calibrated scalar series. |
| Spatiotemporal candidate association using actual acquisition times | Existing Haversine distance/time deltas, source IDs, processing screens and threshold sensitivity; real same-window observations | **Retained exploratory only**. Correspondence candidates and transitive groups are not ground truth or equivalent counts. |
| Fit a MODIS/VIIRS count ratio in observed overlapping years | Both sensor records exist in some years, but missing acquisitions and small/unequal samples confound ratios with sensitivity, exposure and actual activity | **Rejected** as an unidentifiable calibration. No coefficient or backcast introduced. |
| Coarsen VIIRS nominal points to a MODIS-sized grid | Can describe occupied bins, but no pixel footprints/PSF, exposure masks or comparable sampling; several real fires can occupy one bin | **Not a calibrated solution**. Existing descriptive occupancy is not relabeled harmonized intensity or unique events. |
| Use overpass time or nominal twice-daily frequency as an exposure denominator | Acquisition timestamps exist for detections only; they omit non-detection/cloud/swath opportunity | **Rejected**. Actual timestamps improve candidate matching, not inferred missing passes or sensor misses. |
| Convert confidence/brightness/FRP to a common intensity | Different algorithms, bands, scales, saturation and retrieval; no local validation references | **Rejected**. Preserve original semantics; no numerical confidence mapping or energy inference. |
| Same-source same-month reference and descriptive median | Repeated positive delivered months in exact stable source strata, with disclosed missingness/support | **Implemented**. Useful conditional description, never cross-sensor normalization, climatology or calibrated anomaly. |
| Pool NRT/standard/raw versions or NOAA lineage silently to increase sample size | More apparent support without demonstrated processing comparability | **Rejected**. Identity strata stay separate; unresolved lineage visible. |

Existing date-extent overlaps are explicitly intersections of detection extents, not verified acquisition-overlap windows. Example Ajloun Aqua 61.03 versus S-NPP standard overlaps delivered extents 2023-07-14..2025-07-02 with 3 MODIS / 20 S-NPP observations in that interval. It supplies candidates, not a sensitivity reference. The existing 1 km / 60 min exploratory threshold and all matching algorithms remain unchanged. No paired-detection count estimates false negatives or calibrated transfer. Threshold sensitivity describes changes in candidate associations, not physical detection-sensitivity calibration.

## Implemented descriptive historical median

Reuses `describeObservedPeriods`, its validated monthly aggregation and exact eligibility rules; no new data adapter or duplicated temporal engine. For candidate month `y-m`, reference counts R are from **prior observed years** of month m with identical region, dataset, source, sensor, platform, product, opaque raw version, processing and confidence scheme. Candidate/future years are excluded.

Support requires the selected minimum number of prior observed years (default 3; UI 3/4/5/6). This is a disclosed software screening policy, not scientific sufficiency or a NASA-defined sample size. Known archive identity and delivery-declared standard processing are required; NRT/fixtures/unknown sources cannot provide support. Missing and zero-delivery rows are never imputed as verified zero months. The reference is conditioned on positive delivered observations and is biased accordingly.

Sort the n supported reference counts: `x1 <= ... <= xn`.

- Odd n: median = `x[(n+1)/2]` (one-based).
- Even n: median = `(x[n/2] + x[n/2+1])/2`.
- Difference = candidate delivered count minus this median.
- `medianSupport = n`. Insufficient/ineligible references yield **null** median, difference and median support; reference count and raw references remain visible.

No standardized anomaly, percentage risk, significance or forecast is produced. Ties, prior maximum and competition ranking keep their existing definitions. Peak rank describes highest raw months in one source stratum and does not use the median as a hazard indicator. Multiple screening, unequal exposure, unknown valid pixels and changing sampling prevent inferential claims.

### Real examples shown and exported

| Region / source | Candidate | Prior same-month samples | Descriptive median | Difference |
|---|---|---|---:|---:|
| Ajloun / S-NPP version 2 standard | May 2025 = 2 | May 2018 = 1; 2021 = 1; 2022 = 1 | 1 (n=3) | +1 |
| North / S-NPP version 2 standard | June 2020 = 80 | June 2012..2019: 33,31,20,63,27,48,11,31 | 31 (n=8) | +49 |

Raising the Ajloun minimum to 4 returns null, not a numeric anomaly. These medians do not pool NOAA, Aqua, Terra, different versions or NRT. Ajloun's tied S-NPP peak months July 2023 / June 2024 remain 5 detections each; July all-source Calendar is 2 MODIS / 16 VIIRS. Monthly FRP sums are sums of reported per-detection MW, not regional radiant energy or calibrated cross-sensor severity.

## User-facing and export integration

- Existing Calendar -> **Explore unusual and peak observed periods** opens the existing Intelligence view; no page or visual redesign added.
- The explorer now explicitly states source integration is implemented but a calibrated sensor-independent series is unavailable. Selected-period evidence shows median, difference, actual/required reference count and detection-conditioned missingness warning in English/Arabic.
- Exact record drilldown still reconciles source count and activation revision. Calendar/Atlas period navigation explicitly opens all sources after clearing incompatible quality filters; single-record handoff preserves the original ID/location.
- New additive period fields: `referenceMedian`, `differenceFromReferenceMedian`, `medianSupport`; method parameters document the median formula. Existing JSON includes actual references, raw input rows, source descriptors, original selected records, source revision, limitations and digest.
- Existing scientific/Research Brief JSON now includes `harmonizationStatus` with structural integration implemented, sensor-independent series unavailable, calibrated false, equivalent activity null and an explicit reason. The descriptive median is nested in `observedPeriodExploration`; the original `gates.historicalMedian`, `gates.anomaly` and `gates.calibratedEquivalentCounts` remain **null**. That gate denotes the unavailable scientifically comparable/calibrated baseline, not the new conditional descriptive statistic.
- Calendar CSV/SVG and all existing provenance/scientific exports remain supported; no API contract was removed or changed. No combined total is called a unique fire-event count.

## Exact changes this pass

1. `shared/observedPeriods.ts`: supported prior same-month descriptive median/difference/sample size and transparent exported formula.
2. `shared/scientificEngine.ts`: explicit structural-versus-calibrated harmonization result status.
3. `src/intelligence/ObservedPeriodExplorer.tsx`: median and support, missingness explanation, truthful harmonization status in existing UI.
4. `src/i18n/evidence-ar.ts`: Arabic translation of the new scientific wording.
5. `src/components/ScientificContext.tsx`: correct unavailable-median wording to exposure-normalized median, preserving the available descriptive statistic.
6. `tests/observedPeriods.test.ts`: four new deterministic tests (odd/even, null/ineligible, actual-source examples, scientific-export separation).
7. `scripts/verify-observed-periods-independent.py`: independent `statistics.median` from original read-only SQLite, all support settings, audit-export/status reconciliation.
8. `scripts/verify-observed-period-browser.mjs`: actual median display/export/null behavior, existing native-keyboard/RTL/mobile/region/date/Calendar/Atlas checks, Research Brief status/export acceptance.
9. `docs/SCIENTIFIC_DATA_AUDIT.json`: regenerated existing scientific evidence, not source observations.
10. `docs/NASA_CHALLENGE_CORE_FINAL.md`: historical supersession note correcting the scope of its earlier bounded GO.
11. `docs/NASA_OFFICIAL_OBJECTIVES_FINAL.md`: current compliance and acceptance report.

Pre-edit copies of the period utility and explorer were checkpointed under `.checkpoints/official-objectives`; earlier local checkpoints are retained. No source observations, archive hashes, region geometries, map worker, matching algorithm, dependencies or deployment code were changed.

## Executed verification

Final complete rerun: **23/23 local acceptance commands PASS**, including **136/136 unit/backend tests**, zero failures/skips. Four new tests extend the 132-test baseline. Build/lint passed; the pre-existing large Earth/MapLibre chunk warning remains, not a build error. No dependencies were installed. A stray interior BOM in the extended test file was removed; lint and all 136 tests were rerun cleanly afterward.

| Executed command | Final result |
|---|---|
| `npm run build` | PASS |
| `npm run lint` | PASS |
| `npm test` | PASS (136 tests) |
| `node scripts/audit-scientific-data.mjs` | PASS |
| `python scripts/verify-scientific-independent.py` | PASS |
| `node scripts/verify-scientific-completion.mjs` | PASS |
| `python scripts/verify-completion-independent.py` | PASS |
| `node scripts/verify-challenge-exports.mjs` | PASS |
| `python scripts/verify-challenge-independent.py` | PASS |
| `node scripts/verify-historical-api.mjs` | PASS |
| `npm run test:filters` | PASS |
| `node scripts/verify-claim-audit.mjs` | PASS |
| `node scripts/verify-historical-explorer.mjs` | PASS |
| `node scripts/verify-scientific-browser.mjs` | PASS |
| `node scripts/verify-atlas-layout.mjs` | PASS |
| `node scripts/verify-exploration-panel.mjs` | PASS |
| `node scripts/verify-final-workflows.mjs` | PASS |
| `npm run test:e2e` | PASS |
| `npm run test:language` | PASS |
| `npm run verify:release` | PASS |
| `node scripts/verify-observed-periods.mjs` | PASS |
| `python scripts/verify-observed-periods-independent.py` | PASS |
| `node scripts/verify-observed-period-browser.mjs` | PASS |

The independent Python check verifies **2,284 real monthly calculation cases** across minimum-support settings 3/4/5/6, including odd/even medians, exact prior reference counts, null insufficient/NRT results, exported scientific statuses and the unchanged database hash. Unit tests additionally cover a fractional even median (3.5), ties, missing years, candidate/future exclusion, conflicting duplicates, source/platform/version separation, fixture and nested-region isolation.

Actual Chrome at **localhost:5173** verifies visible English median 1/difference 1 and North median 31/difference 49, null values after raising support requirements, actual-source JSON reconciliation, candidate-year filtering, NRT ineligibility, native Enter activation, Calendar 2 MODIS / 16 VIIRS, Atlas 18 with the same canvas, exact source-ID popup handoff, progressive source lists, and Research Brief export reporting sensor-independent activity unavailable. Arabic RTL at 320x740 shows the translated median with the same real numbers; reduced motion, focus and no page overflow are asserted. Existing layout/browser suites verify other supported desktop/mobile sizes and preserved workflows.

Screenshots captured locally by the executed script: `.checkpoints/core-completion/period-desktop.png` (English 1440x1000) and `.checkpoints/core-completion/period-ar320.png` (Arabic 320x740); both were visually inspected. They are not evidence of public deployment.

The first strengthened browser run exposed a test-harness expression error, `SyntaxError: Unexpected token ';'`, in a CDP screenshot scroll expression. It was corrected to an expression/IIFE; the failure logs remain in `.checkpoints/official-objectives/period-browser-before-fix.log` and the earlier acceptance snapshot. The final **entire** suite was rerun and passes; the screenshot-only scroll check was then strengthened to assert the Arabic median lies inside the actual viewport and the full feature browser script passed again; no scientific or browser assertion was removed or weakened. Actual reference sample size and selected minimum were also separated in the UI to avoid suggesting that a support display such as 8/3 was the median's mathematical denominator.

Machine-readable final outcomes and logs: `.checkpoints/official-objectives/acceptance.json` and adjacent per-command logs. Independent calculation evidence: `.checkpoints/core-completion/independent.json` and `periods.json`. `verify:release` only performed existing local asset/configuration assertions; no release/deployment/package was created. No public URL or cloud transport was verified. Expected blocked-texture/no-WebGL recovery cases in existing E2E diagnostics are intentional negative tests, not hidden unexpected failures.


Database SHA256 remains `b1e19d095190b7c6116a284080a87cd702c0927260f183d85ff9ef1a1747533e`; active generation `f3cb30006dd2f0ff02df206024189da7757d40cd02e6708c2e5374f03a73910f`. Independent validation reads the unchanged SQLite, not JS reference calculations, and uses Python's standard-library median including even-sized references. Tests validate implementation arithmetic and reproducibility, not sensor calibration or official endorsement.

## Local review and final acceptance

If needed, run `npm run dev -- --host localhost --port 5173 --strictPort`, then open `http://localhost:5173/#mission-atlas`.

1. Ajloun -> Burning Calendar -> July 2023 -> distinguish MODIS 2 / VIIRS 16; inspect July 14 and download CSV/SVG.
2. Explore unusual/peak periods -> S-NPP -> May 2025 -> references, median 1, candidate 2. Minimum 4 -> unavailable comparison; restore 3 -> reproducible JSON.
3. Peak delivered periods -> July 2023 -> source composition -> all-source Calendar/Atlas -> original observation popup.
4. Northern Jordan -> S-NPP -> June 2020 -> median 31, count 80, eight prior samples -> original source evidence/export.
5. Evidence Engine -> Agreement Lab -> change existing thresholds -> inspect candidate provenance/sensitivity -> Research Brief. Export explicitly reports sensor-independent series unavailable.
6. Switch Arabic, keyboard navigation, 320px view and reduced motion; dates/IDs/math stay unchanged.

**Genuine unresolved core blocker:** a sensor-independent consistent activity estimate cannot be justified from detections alone. Closing it requires demonstrably compatible platform/product lineage, actual swath/valid-pixel/cloud opportunity denominators, a specified common estimand and independent reference/held-out evaluation. Metadata-only catalog timing and positive detection ratios do not supply these. No massive/authenticated data download, source rewrite or invented calibration was attempted to make this report look complete.

The practical implementation gap for a descriptive historical median is closed. The web-app workflows work. The core sensor-neutrality requirement is **not established**, and this report therefore does not label the entire challenge scientifically complete. A judge-ready bounded prototype may be demonstrated honestly; a claim of full cross-sensor harmonization completion is **NO-GO** pending the missing evidence.
