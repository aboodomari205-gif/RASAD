# Final challenge acceptance

2026-11-14 (Asia/Amman). Local implementation and verification only. No deployment, push, cloud migration, release ZIP, original-observation edit, import, region change or scientific matching-algorithm change.

## Explicit acceptance decision

**GO for the demonstrated regional research prototype; PARTIAL for the substantive harmonization ambition; UNVERIFIED for complete official challenge acceptance.**

Independently retrieved official-domain indexed content establishes the broad web/calendar/harmonization/AOI purpose. Full live details/resources could not be retrieved. OFFICIAL_REQUIREMENTS_TRACEABILITY.md records exactly which content is official-indexed, supplied, secondary or unavailable. No calibrated equivalence, prediction or validated anomaly score is asserted to be a separately verified mandatory artifact.

The web Calendar/region/date/download demonstration works with real evidence. Structural/source-aware UTC harmonization and exploratory comparisons are implemented. A scientifically sensor-independent record is **not** established. If the strict interpretation in the secondary detailed reproduction is binding, this is a genuine remaining challenge-critical scientific gap. It must not be hidden by calling raw source totals equivalent. Whether that depth is a mandatory minimum still requires the full official statement or challenge-author guidance.

Earlier GO decisions in FINAL_SCIENTIFIC_ACCEPTANCE.md refer to bounded descriptive prototype acceptance, not proof of complete NASA challenge compliance. This review makes that distinction explicit rather than repeating an overbroad success claim.

## Implemented in this pass

- Added downloadable actual filtered-month SVG visualization in Burning Calendar, beside existing CSV; counts/FRP, source-separated sensor values, UTC weekday placement, Arabic labels/RTL placement, unknown missing cells, no external resources and embedded provenance/revision/scope/IDs.
- Added original geographic coordinates and available raw sensor/platform/acquisition/daynight plus activation revision to month CSV. Existing fields/order retained; safe string quoting retained, numeric coordinates not converted to formula-safe text.
- Reused one canonical export selection routine and validated export month syntax. No source records, calibration, scientific thresholds, event interpretation or anomaly behavior changed.
- Added deterministic tests and independent Python CSV/XML reconciliation, plus actual English/Arabic browser SVG download, parse and image-decode assertions. Existing assertions remain.
- Preserved the limited official indexed excerpt and a source/retrieval evidence manifest; did not fabricate an official full-text snapshot.

## Actual data and reproduced results

| Evidence | Actual result |
|---|---|
| Ajloun activated catalog | 143; earliest 2006-12-03T10:34:00.000Z; latest 2026-09-04T10:43:00.000Z |
| Northern Jordan catalog | 6859; earliest 2001-05-20T20:03:00.000Z; latest 2026-11-10T10:30:00.000Z |
| July 2023 exports | Ajloun 18 = 2 MODIS + 16 VIIRS; North 120 = 12 + 108 |
| Ajloun selected July 14 | 2 MODIS + 11 VIIRS; not confirmed events |
| Guided Ajloun 2023 | 22 records; 1 km/60 min 12 candidate edges / 13 participating IDs / 1 group; 1 km/7 min 5/6/1 |
| Whole-history baseline | Ajloun 15/18/3; North 245/272/52 |
| Existing matched-month comparison | 2021 vs 2023: Ajloun one eligible source-month; North 24. Ajloun S-NPP July 1 vs 5, descriptive +4, anomaly null |
| Existing independent comparison check | 42 comparisons, source/month counts/FRP/missingness preserved |

Extents are first/last delivered detections, not continuous verified acquisition periods. Ajloun is nested in North; totals are not additive. Unknown coverage remains unknown. Canonical identities, raw confidence schemes, standard/NRT strata and NOAA-20/21 lineage caveats are retained.

Read-only SQLite SHA256 remains b1e19d095190b7c6116a284080a87cd702c0927260f183d85ff9ef1a1747533e. Revision remains f3cb30006dd2f0ff02df206024189da7757d40cd02e6708c2e5374f03a73910f. Existing scientific audit confirms delivery hashes and polygons; original archives were not rewritten.

## Executed checks

All 16 final commands exited zero; .checkpoints/challenge-alignment/acceptance.json and corresponding logs record exact outcomes. The stricter independent duplicate/length assertions were rerun successfully afterward.

| Command | Outcome |
|---|---|
| npm run build | PASS; existing large-chunk warning remains |
| npm run lint | PASS, no warnings in final lint log |
| npm test | PASS: 123 tests, 0 failed/skipped; prior 120 plus 3 export tests |
| node scripts/verify-challenge-exports.mjs | PASS: six real region/sensor CSV+SVG evidence scopes |
| python scripts/verify-challenge-independent.py | PASS: original IDs/coordinates/confidence/revision; XML metadata source/day/FRP/missingness and row uniqueness; unchanged SQLite |
| node scripts/audit-scientific-data.mjs | PASS |
| python scripts/verify-scientific-independent.py | PASS |
| node scripts/verify-scientific-completion.mjs | PASS |
| python scripts/verify-completion-independent.py | PASS |
| node scripts/verify-historical-api.mjs | PASS |
| node scripts/verify-claim-audit.mjs | PASS: actual local English/Arabic SVG action, valid XML and image decode; existing CSV/guide/research assertions preserved |
| node scripts/verify-historical-explorer.mjs | PASS |
| node scripts/verify-scientific-browser.mjs | PASS |
| npm run test:e2e | PASS |
| npm run test:language | PASS |
| npm run verify:release | PASS: consistency check only, not packaging/public verification |

Three new deterministic tests cover identical CSV/SVG/source ID sets, real coordinates/raw metadata, filtered date/sensor behavior, null missing dates, deterministic order, invalid month, safe XML escaping, missing FRP and RTL generation. Browser checks prove the actual download actions, not just function output. Existing language/E2E suites use their controlled older pilot; actual-data export/scientific suites independently verify the activated catalog. A mobile Arabic Calendar screenshot was inspected for context; that is not a claim that every existing text-layout issue was newly resolved.

An initial standalone test failed because extensionless TypeScript imports cannot resolve under Node; imports were corrected to .ts. An intentional XML-control-character regex produced a lint warning and was replaced with character filtering. Final checks passed; no assertions were weakened.

## Exact changes

New:

- src/calendar/visualization.ts
- tests/challengeExports.test.ts
- scripts/verify-challenge-exports.mjs
- scripts/verify-challenge-independent.py
- docs/OFFICIAL_REQUIREMENTS_EVIDENCE.json
- docs/OFFICIAL_REQUIREMENTS_TRACEABILITY.md
- docs/CHALLENGE_GAP_CLOSURE.md
- docs/ADVANCED_SCIENCE_DATA_REQUIREMENTS.md
- docs/FINAL_CHALLENGE_ACCEPTANCE.md

Modified:

- src/calendar/combined.ts
- src/calendar/BurningCalendar.tsx
- src/i18n/evidence-ar.ts
- scripts/verify-claim-audit.mjs

Existing scientific audit JSON reports were regenerated by their read-only commands. Local backups, retrieval failure manifest, exported evidence and logs are under .checkpoints/challenge-alignment. No backend contract, data generation, secret file or matching rule was changed.

## Local review

Run `npm run dev`; open http://localhost:5173/#mission-atlas. Enter Mission, select Ajloun/2023, open Burning Calendar and July. Download displayed-month CSV and SVG. The latter opens as a standalone source-separated calendar; its metadata contains the same 18 IDs. Switch to FRP to inspect reported-value completeness, then Arabic to inspect translated export/caveats. Repeat with North: 120 July rows. Sensor/date filters must affect both outputs identically. Unknown cells must never become verified zero. Existing Research Brief and Agreement Lab continue to use the selected bounded raw evidence, while unfiltered history summaries are labeled separately.

## Remaining actions: fixable versus research-dependent

The practical export gaps identified here are closed. No known missing independently verified mandatory numerical score is established by retrieved text. Complete live official details/resources remain an external verification blocker. Sensor-independent harmonization remains a substantive scientific gap, not a cosmetic missing feature.

ADVANCED_SCIENCE_DATA_REQUIREMENTS.md lists the exact four candidate native files and safe browser-only manual procedure for one Aqua/S-NPP acquisition pair. Actual masks/QA/geolocation, exact input-pointer lineage, independent decoding/polygon validation and a defined estimand are prerequisites to any opportunity estimate. Independent co-temporal reference labels are additionally required for calibration. Multi-period exposure and held-out validation are additionally required for an anomaly baseline. The existing CMR metadata pilot supplies none of these by itself.

Therefore: present the functioning source-aware prototype honestly. Do not describe it as a validated sensor-neutral historical reconstruction or complete official acceptance. Obtain the full authoritative statement/clarification and the specific independent scientific evidence before making stronger claims. No deployment work is part of this decision.
