# Scientific validation results

Executed locally on 2026-11-13. Numerical software/data checks, not independent scientific calibration or public-deployment verification.

## Reconciliation and sensitivity

The source-aware audit verifies unique canonical IDs, unchanged SQLite/ZIP hashes, exact region membership and source-separated daily/monthly/yearly/seasonal reconciliation. Ajloun is a subset of North; region totals are not additive. No exact-ID or same-platform/time/coordinate duplicates were found in the active catalog. Current records have no missing FRP or exact UTC; synthetic fixtures cover those cases.

Whole-history 1km/60min results: Ajloun 15 candidate edges / 18 participating IDs / 3 connected groups; North 245 / 272 / 52. These are not confirmed fires or independent events. The smaller existing Ajloun 2023 guide remains 22 source records and 12 edges / 13 participating IDs / 1 group. All scopes are explicit.

Machine evidence:

- [SCIENTIFIC_DATA_AUDIT.json](SCIENTIFIC_DATA_AUDIT.json): full source-separated series, provenance, counts, graph and sensitivity.
- [SCIENTIFIC_INDEPENDENT_CHECK.json](SCIENTIFIC_INDEPENDENT_CHECK.json): independent calculations and real observed-period checks.

## Independent calculations

Python opens the active SQLite generation with mode=ro, without using the JS aggregators. It recomputes every actual source/platform/processing/version day/month/year count and reported-FRP count/sum using math.fsum and numerical tolerance. It independently assigns DJF/MAM/JJA/SON seasonal contributions. It does not zero-fill missing periods.

An exhaustive Python Haversine/UTC implementation reproduces all 15 Ajloun baseline edges and all 53 North 2023 edges. Independent checks also cover eight real region/month scopes, including October 2020, July 2021, July 2023 and September 2026. This verifies computation consistency, not detection truth or fire confirmation.

## Deterministic fixtures and preserved baseline

Nine new scientific tests augment the preserved 105-test baseline: 114 tests total. Fixtures are explicitly synthetic test objects and never enter the application catalog.

Covered scenarios include exact distance/time boundaries, UTC midnight, poles and antimeridian, deterministic multi-platform/processing exhaustive equivalence, sparse-index pruning, dense-output limits, December-to-next-DJF assignment, missing versus zero FRP, absent timestamps, unknown processing, fixtures, repeated/conflicting IDs, unobserved dates, source introduction versus first delivered year, nonoverlap, NRT separation, reproducibility and real-region reconciliation. Existing polygon/multipolygon/hole/shared-boundary, transitive-group and provenance tests remain intact.

The sparse synthetic case contains 500 MODIS and 500 VIIRS records at identical times but spatially separated. It requires 0 exact-distance evaluations instead of a 250000-pair spatial scan. This is a deterministic software test, not a hardware timing or universal runtime claim. Dense output still has explicit caps.

## Actual-browser evidence

The new suite ran on actual localhost:5173 and verified:

- Ajloun 2023: 22 source observations, 12 baseline candidate edges.
- Changing thresholds to 0.25km/6min updates the scientific export consistently with the current Agreement Lab result.
- Research Brief includes the same harmonization methodology, source ZIP/member provenance and unsupported metrics as null.
- Calendar July 2023 exports only its 18 actual observations, distinct from the annual scope.
- Existing Fire Season Clock, Fire DNA and Sensor Intelligence contain the integrated scoped section.
- Arabic 320px and reduced motion produce no horizontal page overflow or unhandled exceptions.

Screenshots: .checkpoints/science-evidence-desktop.png and .checkpoints/science-ar-mobile.png. The Arabic mobile screenshot was visually inspected. Browser tests use local Chrome and emulated viewport sizes, not physical phones. Existing E2E, bilingual, historical and layout suites also ran.

## Exact changed files

- shared/evidence.ts - indexed exact-predicate matching, deterministic order and unknown-processing exclusion.
- shared/agreement.ts - linear processing/sensor eligibility lookup.
- shared/model.ts - explicit optional archive-delivery provenance types.
- shared/research.ts - additive harmonization export.
- shared/scientificEngine.ts (new).
- src/components/ScientificContext.tsx (new).
- src/components/ScientificContext.css (new).
- src/intelligence/IntelligenceWorkspace.tsx.
- src/intelligence/EvidenceEngine.tsx.
- src/calendar/BurningCalendar.tsx.
- src/i18n/evidence-ar.ts.
- scripts/audit-scientific-data.mjs (new).
- scripts/verify-scientific-independent.py (new).
- scripts/verify-scientific-browser.mjs (new).
- tests/scientificEngine.test.ts (new).
- docs/SCIENTIFIC_HARMONIZATION_ENGINE.md (new).
- docs/SCIENTIFIC_VALIDATION_RESULTS.md (new).
- docs/SCIENTIFIC_DATA_AUDIT.json (generated audit, new).
- docs/SCIENTIFIC_INDEPENDENT_CHECK.json (generated audit, new).

Affected core checkpoints are in .checkpoints/science-before/. Original observations and IDs were not rewritten. The full machine audit is about 9MB because it includes detailed series and traceable IDs; it is not a browser payload or release package. No dependencies were installed.

## Remaining scientific limits

GO for bounded source-aware harmonization, descriptive historical comparison and exploratory research. NO-GO for calibrated equivalence, complete observation coverage, independent fire-event counts or validated anomalies. NOAA source-lineage/date discrepancies require supplier review. Missing coverage/calibration cannot be replaced by nominal resolution, detected-day counts or coefficients from other products. Official challenge-page retrieval returned 502; full official compliance is unverified.

## Actual sensitivity tables

| Region | km / minutes | Candidate edges | Participating IDs | Connected groups |
|---|---|---:|---:|---:|
| ajloun | 0.25 / 6 | 1 | 2 | 1 |
| ajloun | 0.5 / 7 | 2 | 3 | 1 |
| ajloun | 1 / 7 | 7 | 9 | 2 |
| ajloun | 1 / 60 | 15 | 18 | 3 |
| ajloun | 2 / 120 | 33 | 28 | 5 |
| northern-jordan | 0.25 / 6 | 7 | 13 | 6 |
| northern-jordan | 0.5 / 7 | 29 | 42 | 13 |
| northern-jordan | 1 / 7 | 75 | 87 | 19 |
| northern-jordan | 1 / 60 | 245 | 272 | 52 |
| northern-jordan | 2 / 120 | 464 | 410 | 67 |

## Independent observed-period counts

| Region / UTC month | Delivered | MODIS | VIIRS | Standard | NRT |
|---|---:|---:|---:|---:|---:|
| ajloun / 2020-10 | 2 | 1 | 1 | 2 | 0 |
| ajloun / 2021-07 | 1 | 0 | 1 | 1 | 0 |
| ajloun / 2023-07 | 18 | 2 | 16 | 18 | 0 |
| ajloun / 2026-09 | 5 | 0 | 5 | 0 | 5 |
| northern-jordan / 2020-10 | 67 | 7 | 60 | 67 | 0 |
| northern-jordan / 2021-07 | 67 | 2 | 65 | 67 | 0 |
| northern-jordan / 2023-07 | 120 | 12 | 108 | 120 | 0 |
| northern-jordan / 2026-09 | 111 | 3 | 108 | 0 | 111 |

Zeros in this inventory mean no rows from that source/month, never verified zero thermal activity.

## Exact executed results

| Command | Result |
|---|---|
| `npm run build` | PASS |
| `npm run lint` | PASS |
| `npm test` | PASS - 114 tests, zero failed/skipped |
| `node scripts/audit-scientific-data.mjs` | PASS |
| `python scripts/verify-scientific-independent.py` | PASS |
| `npm run test:e2e` | PASS |
| `npm run test:language` | PASS |
| `node scripts/verify-historical-explorer.mjs` | PASS |
| `node scripts/verify-scientific-browser.mjs` | PASS |
| `node scripts/verify-atlas-layout.mjs` | PASS |
| `npm run verify:release` | PASS |

All eleven exit codes were 0: .checkpoints/science-acceptance.json. Logs: .checkpoints/science-<name>.log. Lint has no warnings. Build retains existing large Three/MapLibre chunk warnings. No assertions were weakened. No deployment, Git push or release ZIP was created.
