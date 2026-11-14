# Official requirements traceability

Audit date: 2026-11-14 (Asia/Amman). Evidence preservation: [OFFICIAL_REQUIREMENTS_EVIDENCE.json](OFFICIAL_REQUIREMENTS_EVIDENCE.json). This report supersedes blanket statements that no official content could be verified: an official-domain indexed summary was retrieved in this pass, but the full live challenge and resource list were not.

## Source authority and retrieval result

| Source | Actual retrieval | Authority / permissible use |
|---|---|---|
| [Requested official URL](https://www.spaceappschallenge.org/2026/challenges/modis-and-viirs-hot-spots/) | Search-index summary/title retrieved; direct web open 502; local direct Node fetch failed with TypeError | Official-domain indexed summary verifies the broad objective, not a complete current live statement. A short exact excerpt is preserved in the evidence JSON. |
| [Alternative official slug](https://www.spaceappschallenge.org/2026/challenges/harmonization-of-modis-and-viirs-hot-spots/) | Indexed title; direct 502 and local fetch failure | Does not resolve full details. |
| Wayback CDX lookup | Not accessible through the web tool; no successful snapshot retrieved | No archive content is claimed verified or complete. |
| [HackAthlone reproduction](https://hackathlone.com/challenges/modis-and-viirs-hot-spots) | Details, objectives, considerations and one resource listing readable | Local-event secondary reproduction. Its publisher says the official page is authoritative. It is not promoted to verbatim authenticated official detail. |
| [Space Data Atlas](https://spacedata.swapniltamse.com/challenges/modis-viirs-hot-spots/) | Readable | Explicitly unofficial dataset suggestions; excluded as an official resource list. |
| Staging Space Apps search results / other teams / old-year guides | Examined as alternatives | Excluded: staging content mismatches and team interpretations/previous-year terms cannot establish current technical requirements. |

No successful full official HTML response was obtained to preserve. The local retrieval manifest at .checkpoints/challenge-alignment/retrieval.json records failures, not fabricated snapshots. The evidence JSON preserves the actual limited official excerpt, URL, retrieval method, missing sections and source hierarchy. The full description/resources are **not preserved or authenticated**; that task remains externally blocked. No third-party full text was copied into an alleged official statement.

## Requirement-by-requirement matrix

Here mandatory-core means a challenge objective, not a separately verified legal eligibility rule. IDs are this project's traceability labels, not NASA numbering. Owner-supplied details remain distinguishable from independently verified official summary content.

| ID | Objective / consideration | Classification and verification | Implementation / data evidence | Status and limitation |
|---|---|---|---|---|
| R1 | Web application | Mandatory core; official indexed summary verified | React/Vite app, browser mission entry and navigation | Implemented locally; no public verification claimed. |
| R2 | Reconcile MODIS/VIIRS observations | Mandatory core; official indexed summary verified; exact scientific acceptance criterion ambiguous | shared model/UTC/region/source normalization; shared/harmonization.ts, scientificEngine.ts, evidence.ts; actual archives | **Partial substantive harmonization:** structural/calendar consistency and exploratory associations work; sensor-independent calibrated time series does not exist. |
| R3 | Burning-activity calendar based on hotspots | Mandatory core; official indexed summary verified | BurningCalendar, dailyActivity, calendarCSV, source-separated combined view | Implemented with delivered detections, explicit unknown dates. |
| R4 | Selected area | Mandatory core; official indexed summary verified | Exact Ajloun and Northern Jordan polygons; shared region filtering | Implemented for two documented presets; no global or arbitrary-AOI claim. |
| R5 | Historical examination / unusual and critical periods | Purpose in official summary; exact required quantitative outputs ambiguous | Historical source summaries, season bins, matched-month comparison, Evidence gate | Descriptive history implemented; validated anomaly/prediction/critical-period inference unavailable. |
| R6 | User-selected date window | Supplied detail, corroborated by secondary reproduction; full official detail unverified | Shared filters, year/date controls, bounded raw windows | Implemented; raw evidence limited to three consecutive years/3000 records; full-history source summaries separate. |
| R7 | Download numerical and visual results | Supplied detail, secondary corroboration; full official detail unverified | CSV/JSON existed; this pass adds actual monthly SVG and coordinate-complete CSV | Implemented for the displayed month/scoped reports. Not an unlimited all-history export. |
| R8 | Sensor-origin-independent interpretation | Strong aspiration in secondary objectives; binding status unverified | No calibrated conversion or exposure correction exists | **Missing if interpreted strictly.** Retaining provenance is necessary but is not by itself scientific equivalence. Do not claim this requirement solved. |
| R9 | Early-2000s-to-present continuity / median examples | Supplied envisioned capability; secondary corroboration; exact official status unverified | North first delivered detection 2001-05-20; Ajloun 2006-12-03; uneven delivery history | Partial temporal extent only; complete coverage/median not established. |
| R10 | Drawn AOIs, color ramps, specific CSV suggestion | Suggested/optional in supplied text and secondary considerations; full official detail unverified | Fixed polygon selection; existing accessible labels/legends and CSV | No AOI editor added. Not treated as an individually mandatory deliverable. |
| R11 | NASA FIRMS resource | Used by actual implementation; secondary lists FIRMS | Product verification, delivery hashes, canonical observations | NASA resource identity verified separately; its exact inclusion in official challenge resource tab remains unverified. |
| R12 | Calibrated equivalence / predictive model / validated anomaly score as an explicit mandatory artifact | Not established by retrieved official content | No such claims or enabled scores | Do not invent a requirement, but do not declare the broader harmonization ambition fulfilled either. |

The secondary reproduction's phrase about sensor origin ceasing to matter is material: it prevents equating a shared schema with a scientifically sensor-independent record. A specific calibration technique is not thereby prescribed. An authenticated full statement or challenge-author clarification is still required to resolve the minimum acceptable harmonization depth.

## Evidence mapping

- Canonical/UTC/provenance: shared/model.ts, shared/observations.ts, server ingestion/store; foundation, archive and historicalActivation tests.
- Region/date/Calendar: shared/regionScope.ts, atlasTemporal.ts, calendar aggregation and combined exports; region, calendar, historical browser suites.
- Correspondence/sensitivity: shared/evidence.ts, agreement.ts, research.ts; deterministic edge/group tests and independent Python reference calculations.
- Descriptive comparison: shared/historyComparison.ts and scientificEngine.ts; 42 independent comparisons, no rates or anomalies.
- Downloads: calendar/combined.ts and visualization.ts; challengeExports tests, independent CSV/XML checks and actual English/Arabic browser downloads.
- Integrity: read-only scientific audit and independent checks; actual counts 143/6859 and unchanged database SHA256. See FINAL_CHALLENGE_ACCEPTANCE.md for executed results, not inferred passes.

## Acceptance position

The broad web/calendar/selected-region components are demonstrated. The strongest scientifically defensible statement is **partial harmonization solution with transparent source-aware descriptive history**, not full calibrated harmonization or verified complete challenge compliance. No new score is justified by the missing text. The genuine unresolved technical depth is source-independent interpretation; whether that is a submission-critical threshold must be resolved against the unavailable full official statement/author guidance.
