# Final scientific acceptance

2026-11-13. Local scientific completion pass; no deployment, Git push, cloud migration, source observation import/edit, boundary change or matching-algorithm change. Reversible pre-edit copies are retained under .checkpoints/scientific-completion. No .env or credential was read. No science granule was downloaded.

## Verdict

**GO: bounded source-aware descriptive harmonization prototype and judging demonstration.** The supplied two-part core is addressed: consistent source-preserving MODIS/VIIRS temporal representation, and a working region/date burning-activity calendar with downloadable analytics. Existing exploratory associations and sensitivity remain useful, with explicit limitations.

**NO-GO: claiming calibrated sensor equivalence, quantified valid-pixel opportunity, exposure-adjusted historical anomalies, continuous verified coverage or confirmed fires.** Scientific completion here means finishing the strongest supportable regional demonstration, not pretending that outstanding research evidence exists. Detailed official 2026 compliance remains independently unverified because the supplied challenge page returned 502; this verdict uses the owner's supplied description.

## Closed or narrowed gaps

1. **Historical comparison support made explicit.** Added exact-source same-calendar-month comparisons with null missing months, separate FRP completeness and delivery-declared processing strata. Only eligible standard-source pairs emit a descriptive count difference. Incomplete provenance/NRT never silently mixes into that result. Observed-month selection bias remains visible.
2. **Existing experience and exports integrated.** The existing Delivered history disclosure uses its year selectors and current API/static month summaries, offers an adjacent disclosure and JSON export carrying activation revision and original dataset provenance. Shared scientific JSON/Research Brief gain additive matchedCalendarMonths for adjacent available years. No separate page or redesign.
3. **Opportunity feasibility tested against real NASA metadata.** Public CMR discovery found exact Aqua/S-NPP catalog candidates for Ajloun on 2023-07-14. The new catalog audit links real observation IDs to compatible UTC intervals without claiming clear pixels, exact reprocessing lineage or coverage. Bounded file access probes actually returned Earthdata HTTP 401. Metadata availability was not substituted for masks.
4. **Independent numerical checks extended.** Python independently verifies raw metadata hashes/fields, UTC interval links and all 42 actual historical comparison results, including missing support, FRP sums/counts and signed differences. Source hashes and existing candidate results remain unchanged.

## Actual numerical evidence

| Scope / calculation | Verified result | Interpretation |
|---|---|---|
| Ajloun activated catalog | 143; MODIS 11 / VIIRS 132; standard 135 / NRT 8 | Delivered detections, not coverage or independent fires |
| Northern Jordan activated catalog | 6859; MODIS 352 / VIIRS 6507; standard 6594 / NRT 265 | Ajloun is nested; totals are not additive |
| Whole-history baseline 1 km / 60 min | Ajloun 15 edges / 18 participating IDs / 3 groups; North 245 / 272 / 52 | Same existing exploratory matching; no new thresholds |
| Ajloun 2023 guide | 22 observations; baseline 12 / 13 / 1; 1 km / 7 min 5 / 6 / 1 | Sensitivity to assumptions, not validation of the narrower setting |
| Ajloun July 2023 Calendar | 18 delivered records: 2 MODIS / 16 VIIRS | Monthly CSV retains 18 rows; missing days unknown |
| New Ajloun 2021 vs 2023 comparison | One eligible source-month: S-NPP standard raw version 2, July 1 vs 5, descriptive difference +4 | No exposure denominator, incidence trend or anomaly inferred |
| New North 2021 vs 2023 comparison | 24 eligible source-month comparisons | Per-platform/product/version strata retained |
| Catalog pilot, July 14 Ajloun | 13 records: 2 Aqua + 4 S-NPP have temporal catalog candidates; 7 NOAA-20 unsupported by this pilot | No observations dropped; no polygon/pixel coverage inferred |
| Independent new comparison checks | 42 results: 40 adjacent-delivered-year comparisons plus 2 selected 2021/2023 comparisons | All strata/month counts/FRP/nullable differences checked independently |

SQLite SHA256 remains b1e19d095190b7c6116a284080a87cd702c0927260f183d85ff9ef1a1747533e. Active revision remains f3cb30006dd2f0ff02df206024189da7757d40cd02e6708c2e5374f03a73910f. Existing read-only scientific audit checks original delivery hashes and polygons; no source data was rewritten. Canonical identities are preserved. Generated report timestamps may vary; scientific results and input hashes are the reproducibility target.

## Executed acceptance

All final commands below exited zero. Exact command/status/log records are under .checkpoints/scientific-completion/acceptance.json and the named logs. The independent extension was rerun after extending it to all 42 comparisons; independent.json records that count. Initial compilation and translation failures were corrected, not hidden: the year-selector optional type was narrowed through the existing comparison result, and two source labels corrupted by a text-edit encoding were restored from the pre-edit UTF-8 copy. No assertion was removed or weakened.

| Command | Executed outcome |
|---|---|
| npm run build | PASS; existing large-chunk warning remains |
| npm run lint | PASS |
| npm test | PASS: 120 tests, 0 failures/skips; prior 114 retained plus 6 deterministic scientific tests |
| node scripts/verify-scientific-completion.mjs | PASS: real Ajloun/North comparison and catalog audit output |
| python scripts/verify-completion-independent.py | PASS: 42 source-month comparisons, 13 catalog rows, original metadata and unchanged SQLite |
| node scripts/audit-scientific-data.mjs | PASS: current whole-history audit and additive scientific output |
| python scripts/verify-scientific-independent.py | PASS: existing independent period/FRP/season/matching checks |
| node scripts/verify-historical-api.mjs | PASS: real HTTP manifests/years/aggregates, 143/6859 totals |
| node scripts/verify-claim-audit.mjs | PASS: current data, CSV, sensitivity, Research JSON and Arabic claims |
| node scripts/verify-historical-explorer.mjs | PASS: added live matched-month UI/export assertions and exact Arabic label at 320 px, plus previous region/year/map tests |
| node scripts/verify-scientific-browser.mjs | PASS: Calendar, Agreement/Research scope, unsupported null metrics, module integration and reduced motion |
| npm run test:e2e | PASS |
| npm run test:language | PASS |
| npm run verify:release | PASS: local consistency safeguard only; no publishing or release package |

The public metadata discovery script also executed successfully: small catalog responses, reported file sizes, anonymous HEAD/Range probes; no protected science file retrieval. Saved collection metadata separately confirms Aqua 061 and S-NPP 002, with source-specific use-constraint findings documented in OBSERVATION_OPPORTUNITY_FEASIBILITY.md.

### New deterministic test scenarios

- Same UTC calendar month across leap dates; null missing periods and nullable versus zero FRP.
- Signed differences only within exact unchanged source/platform/dataset/product/version/processing/confidence strata.
- NRT/incomplete provenance exclusion, invalid counts/FRP consistency and repeated summary rejection.
- Input-order reproducibility and exact real-region matched-support counts.
- Half-open catalog UTC boundaries, duplicate granules, conflicting observation identity and invalid intervals.
- Missing exact timestamps, another platform, NRT and fixture observations remain uncorroborated; coverage/calibration/anomaly outputs remain null.

The browser confirms Ajloun July 2021/2023 cells 07 / 1 / 5 / 4 and exported uncalibrated/null anomaly state, revision and original source-file provenance. Arabic/mobile screenshot .checkpoints/scientific-completion/comparison-ar320.png was inspected: new disclosure, warning and export action are readable; wide source tables use the existing internal horizontal scroll. This does not claim a new full visual audit of unrelated screens.

## Local demonstration of the addition

```powershell
npm run dev
```

Open http://localhost:5173/#mission-atlas, Start Mission, choose Ajloun and 2023, then Evidence Engine. Expand Delivered history, select reference 2021 and comparison 2023, then expand Same-month source comparison / descriptive only. Locate S-NPP / July: 1, 5 and +4; export JSON and inspect null normalized rates/anomaly plus original dataset provenance. Switch to Northern Jordan and repeat; the known-source matched month count is 24 for the same years. The history view is explicitly unfiltered regional history, whereas raw map/evidence remains the selected bounded observation window. These scopes must not be narrated as identical.

For the actual catalog-time audit use the three commands in OBSERVATION_OPPORTUNITY_FEASIBILITY.md. It is an offline scientific audit, not a new live map coverage layer.

## Exact files changed

New:

- shared/acquisitionEvidence.ts
- src/intelligence/MonthComparison.tsx
- scripts/discover-opportunity.mjs
- scripts/verify-scientific-completion.mjs
- scripts/verify-completion-independent.py
- tests/scientificCompletion.test.ts
- docs/SCIENTIFIC_COMPLETION_GAP_ANALYSIS.md
- docs/OBSERVATION_OPPORTUNITY_FEASIBILITY.md
- docs/FINAL_SCIENTIFIC_ACCEPTANCE.md

Modified:

- shared/historyComparison.ts
- shared/scientificEngine.ts
- src/intelligence/HistoryOverview.tsx
- src/i18n/evidence-ar.ts
- scripts/verify-historical-explorer.mjs
- docs/SCIENTIFIC_DATA_AUDIT.json (regenerated, includes additive matched-month output)
- docs/SCIENTIFIC_INDEPENDENT_CHECK.json (regenerated by existing read-only verifier)

Local raw public metadata, SHA evidence, comparison results, screenshots, backups and logs are under .checkpoints/scientific-completion; these are not source observations or public release assets. No backend contract, scientific matching algorithm, source IDs, original CSV/ZIP or SQLite generation was modified.

## Unclosed priorities and stop condition

Acquisition opportunity is **not** sensitivity calibration. Exact granules/QA/geolocation, authenticated or manual access and independent pixel/geometry checks are needed for even a narrowly quantified opportunity pilot. Calibration additionally needs independent fire/no-fire reference evidence and uncertainty. Anomaly validation additionally needs a comparable historical exposure inventory and out-of-sample evaluation; a single clear-sky day would not suffice.

No validated anomaly, historical median, calibrated confidence, confirmed-fire count, trend, risk score or prediction is now enabled. The 1 km / 60 minute baseline is not NASA-prescribed or calibrated. Catalog timing cannot choose an optimal radius or resolve independent event identity. Unresolved NOAA-20/21 lineage is disclosed, not repaired by invented dates or versions.

Further authenticated one-day opportunity work could materially improve the scientific evidence, but completion before submission cannot be promised with the current blocked data access and missing independent reference. Further detection-only scoring would not improve scientific validity. Accept the bounded prototype and communicate these limits; do not claim the two high-priority research gaps are closed.

Reported FIRMS acquisition times have minute resolution in these deliveries. Normalized UTC strings ending in :00 do not establish sub-minute acquisition accuracy. Catalog interval linkage uses the reported time and remains candidate corroboration only.
