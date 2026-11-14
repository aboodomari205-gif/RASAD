# Scientific completion gap analysis

2026-11-13. Scientific implementation and local validation only. No original observation, boundary, matching threshold/algorithm, deployment architecture or source archive was changed. No credential was read and no science granule was downloaded.

## Decision

**GO for completion of the bounded, source-aware descriptive challenge solution. NO-GO for claiming observation-opportunity normalization, sensitivity calibration or validated historical anomalies.** These are different decisions. The supplied core objectives are addressed at a regional prototype level; independently verified complete official compliance remains unavailable. There is no scientific basis to enable an anomaly score merely to make the interface look complete.

## Requirement basis

Reviewed OFFICIAL_CHALLENGE_ALIGNMENT.md, SCIENTIFIC_HARMONIZATION_ENGINE.md, SCIENTIFIC_VALIDATION_RESULTS.md, JUDGING_EVIDENCE_MATRIX.md, the independent audit, shared scientific/matching/history code, and existing Calendar/Intelligence/export integration. The alignment document is a historical review: its 36-record sample and calendar gaps predate later implementation. Current verified totals are Ajloun 143 and Northern Jordan 6859; the combined source-separated Calendar and CSV already exist.

The [provided official challenge page](https://www.spaceappschallenge.org/2026/challenges/modis-and-viirs-hot-spots/) again returned 502 during this investigation. The project owner's supplied description is the substantive assessment basis; detailed current official rules, eligibility and judging compliance are not independently verified. No requirement is invented from a module name or suggested example.

| Objective / gap | Status before this pass | Scientific effect | Result / priority |
|---|---|---|---|
| Consistent MODIS/VIIRS temporal representation | Implemented canonical IDs, UTC, region and exact source strata; shared aggregations and source-preserving calendar | Reproducible comparison without sensor equivalence | Preserved; supplied structural core satisfied. |
| Region/date Calendar and downloadable analytics | Implemented and browser-tested | Directly usable regional demonstration | Preserved; supplied web-app core satisfied. |
| Source-consistent historical comparison | Annual counts and seasonal/source strata implemented; unequal month support could remain implicit | Raw year totals can reflect different calendar support | **Improved:** identical-calendar-month source comparisons, explicit unsupported/missing months and downloadable audit. |
| Actual acquisition/valid-pixel/cloud opportunity | No input masks or exhaustive swath inventory | Blocks any denominator, verified zero or inferred sensor misses | **Investigated with real catalog pilot:** authoritative metadata found, protected science data access returned 401. Coverage remains null. |
| Detection sensitivity calibration | No independent local reference labels or exposure-matched truth | Cannot estimate probability of detection or transfer raw counts | Not closed; catalog timestamps cannot substitute for calibration. |
| Validated historical anomaly | No exposure-aware baseline or out-of-sample reference validation | A detection-conditioned median or z-score would be misleading | Correctly remains unavailable; no new score. |
| Spatiotemporal correspondence | Exact Haversine/UTC matching, provenance/processing screens, sensitivity and transitive groups implemented | Many-to-many exploratory associations only | Added catalog-time corroboration audit, NOT a new exclusion rule or calibrated radius. |
| Early-2000s-to-present complete calendar / median | Envisioned under supplied description, not established for all dates/platforms | More detection files alone would not supply opportunities | No scope expansion or invented baseline. |
| Drawn AOIs / other suggested extras | Optional under supplied description | Less material than evidence gaps | No work added. |

## Implemented scientific improvement: matched observed months

shared/historyComparison.ts now exports compareDeliveredMonths(summary, yearA, yearB). Identity is the exact tuple dataset ID, source, sensor, platform, product, original version, processing and original confidence scheme. Region remains the summary's single declared scope. Each calendar month has separate nullable values for each year. Missing source/month contributions remain null, never zero. NRT, unknown platform/product/version and unknown confidence provenance cannot produce an eligible descriptive difference. Standard is the delivery-declared processing status, not independently authenticated upstream lineage.

For eligible strata with observations in both corresponding months, the only derived change is D = nB - nA. It is a difference in delivered detection counts. There is no percentage, normalized rate, p-value, anomaly, probability or event count. Both source FRP sums and reported-value denominators remain available in JSON with null/zero distinctions. The twelve-month representation exposes absent support rather than dropping missing months silently. Selecting months with detections in both years introduces selection bias; equal months do not establish equal observation opportunity.

Integration uses the existing Delivered history section in Evidence/Intelligence, the existing year selectors and native table styles. Year and month summaries are loaded from the existing API/static contracts. A collapsed matched-month disclosure and JSON export include selected years, exact strata, missingness, activation revision and original dataset provenance. No page or unrelated layout was added. The shared scientific engine also includes additive matchedCalendarMonths for adjacent delivered years in its scoped JSON, inherited by Research Brief harmonization output. Adjacent means adjacent available years, not necessarily consecutive calendar years; selected year labels remain explicit.

### Actual results

For 2021 versus 2023:

- Ajloun: one eligible source-month comparison, S-NPP standard raw version 2 in July: 1 versus 5 delivered detections, D=+4. This is not evidence of increased true incidence or an anomaly.
- Northern Jordan: 24 eligible source-month comparisons across exact strata; no platform pooling or NRT-to-standard mixing.
- Whole activated source counts remain 143 and 6859. Ajloun is nested within North; totals are not additive.

A new independent Python implementation validates all 42 comparison results in the audit (40 adjacent-delivered-year comparisons across the two regions plus the two explicit 2021/2023 comparisons), including every monthly count, nullable support, FRP value/count and eligible difference. This establishes computational consistency, not ecological significance or calibration.

## New catalog audit, not a coverage estimate

shared/acquisitionEvidence.ts implements provenance-constrained, exact-UTC interval corroboration against real NASA CMR metadata. It emits candidate granule IDs, metadata hashes and original observation IDs. Missing exact UTC, another platform, NRT and fixtures do not get corroborated by this standard Aqua/S-NPP pilot. It never changes observation eligibility in the existing association engine; absent catalog linkage cannot be interpreted as a missed or invalid detection. Full method, measured access result and failure conditions are in OBSERVATION_OPPORTUNITY_FEASIBILITY.md.

## Remaining scientifically unsupported claims

Neither new method establishes complete acquisitions, cloud-free area, effective detection opportunity, calibrated MODIS/VIIRS equivalence, confidence conversion, climatology, fire incidence, burned area, prediction or independently confirmed events. The 1 km/60 minute baseline remains explicitly exploratory. NOAA-20/21 lineage discrepancies are untouched. Nominal pixel sizes or granule extents are never used to fabricate coverage or a conversion coefficient.

## What would materially improve the science next?

A small authenticated/manual delivery of the exact Aqua/S-NPP fire-mask, QA and geolocation granules for the pilot day would permit a real opportunity-method validation, if lineage and polygon clipping are independently verified. That would improve one day's evidence, not create a historical baseline. Sensitivity calibration additionally needs independent, temporally aligned fire/no-fire reference evidence. Anomaly work needs a longer source-consistent opportunity inventory, a justified model and held-out validation. These are substantive research/data tasks; adding a detection-only anomaly formula now would lower credibility. Stop adding scores before submission and present the bounded result honestly.
