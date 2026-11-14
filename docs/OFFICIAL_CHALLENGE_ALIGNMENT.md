# Official challenge alignment gate

13 November 2026. Review-only decision for the remaining submission window. No application code, NASA observations or release packages were changed.

## Basis and revised decision

This gate uses the five explicit official objectives supplied by the project owner in the current request. They supersede the earlier uncertainty about the substantive challenge objectives in `FINAL_MISSION_REVIEW.md`. Independent retrieval of the complete official page, submission rules and platform obligations remains unverified; the supplied objectives are the basis for this assessment, not a claim that the previously failing URL was retrieved.

**GO for a bounded improvement to the existing calendar: one UTC calendar displaying separate source contributions side by side, with a shared downloadable daily table. NO-GO for claiming calibrated sensor-equivalent burning activity.** Finish the core bridge from the existing alignment engine into the calendar rather than adding another analytical module.

Early-2000s-to-present coverage and a historical median are envisioned capabilities under the supplied text, not individual mandatory acceptance conditions for this regional demonstration. Drawing AOIs, particular color ramps and CSV are suggested considerations. Region/date selection and downloadable analytics are core; the app already has these, although calendar integration is incomplete. Accessibility remains a product-quality obligation even when a particular ramp is not prescribed.

## A. What is actually harmonized

| Layer | Actual implementation | Meaning and boundary |
| --- | --- | --- |
| Schema and identity | `shared/model.ts`, `shared/observations.ts`, explicit FIRMS export adapters | Canonical IDs, coordinates, source datasets, sensor/platform, raw confidence, nullable FRP and provenance; exact replay handling does not merge nearby detections |
| Acquisition time | UTC parsing, instant/day precision, shared date/time filters | Consistent civil UTC dates and precise timestamps where supplied; day-only records cannot support exact-time matching |
| Sensor context | `shared/harmonization.ts`, `shared/research.ts` | Nominal specifications and observed metadata retained separately; original confidence schemes are not converted |
| Calendar aggregation | `aggregateDays`, `aggregatePeriods`, source-separated series | Consistent daily/monthly/yearly buckets, original source strata, explicit missingness and FRP reporting completeness |
| Cross-source alignment | `compareSensors` in `shared/harmonization.ts` | Common UTC periods across provenance-separated series; `conversionFactor:null`, `validatedNormalization:false`, `crossSensorCountTotal:null` |
| Candidate matching | `associateSensors` in `shared/evidence.ts` | Inclusive great-circle radius and absolute UTC tolerance, exact-time/non-fixture eligibility and same-region/processing checks; many-to-many candidate edges |
| Association interpretation | Connected components, sensitivity and robustness | Direct edges, participating source IDs and transitive groups are distinct; no independent-event count |
| Research outputs | Scientific comparison and Research Brief | Reproducible source observations, threshold settings, methodology, graphs, limitations and provenance gaps |

Current available Ajloun sample is 36 detections: 5 MODIS and 31 VIIRS, observed inside the existing polygon between 2020-08-02 and 2025-10-18. These limits describe delivered detections, not continuous acquisition coverage. Default 1 km / 60 min matching produces 5 pairs, 6 participating observations and 1 connected group. Across existing tested settings there are 9 possible edges, all sensitive to at least one setting. These are software results on the current sample.

## B. What is not scientifically harmonized

- Detection sensitivity has no fitted or independently validated equivalence model. Nominal pixel dimensions cannot supply a count conversion.
- Acquisition opportunity, swath geometry, valid pixels, clouds, smoke and sampling completeness are not established. A missing detection day is unknown.
- Unequal overpass schedules remain actual acquisition differences; UTC alignment does not equalize sampling.
- Confidence values retain original meanings; MODIS numeric confidence and VIIRS categories have no shared probability scale.
- FRP is retained and summarized as reported MW with missingness, without asserting interchangeable retrieval behavior, fire energy or exposure-normalized intensity.
- Spatial/temporal proximity is not event truth. Connected groups can have transitive endpoints outside direct thresholds. No confirmed-fire count or cross-sensor event deduplication is validated.
- No independently validated climatology, historical median, unusual-condition score, critical-period forecast or anomaly model is supplied.

The honest term is **source-aware temporal harmonization with exploratory correspondence**, not calibrated reconstruction of true burning incidence.

## Precise objective gap table

| Supplied objective | Current evidence | Gap | Submission interpretation |
| --- | --- | --- | --- |
| Consistent MODIS/VIIRS time series acknowledging sensor differences | Canonical UTC/source model and aligned period series exist | Calendar renders one selected instrument rather than both aligned contributions | Partial core delivery; a unified source-separated calendar materially strengthens it |
| Web app, burning calendar, region/date scope, downloads | Working Calendar, shared scope, Atlas handoff, Decision Brief CSV and scientific JSON | No direct combined daily calendar export; Calendar silently interprets shared `sensor:all` as VIIRS | Functional foundation; clarify this semantic mismatch rather than imply both sensors are already visible |
| Historical patterns and comparisons where justified | Source-separated periods, Season Clock, historical comparison, descriptive Fire DNA | Sparse sample and unknown sampling prohibit normalized trend/anomaly conclusions | Demonstrate observed dates and provisional comparisons; keep scoring unavailable |
| Early-2000s-to-present and median examples | Not available | No broad history or justified median | Clearly scope to current Ajloun deliveries; do not invent these examples or treat them as verified mandatory requirements |
| Suggested AOI drawing/ramp/CSV considerations | Fixed Ajloun polygon, explicit Brazil fixture, text/status legends and CSV elsewhere | No drawn AOI; further physical-device/accessibility validation remains | No new AOI editor justified by the supplied objectives before submission |

Specific code evidence for the calendar gap: `src/calendar/BurningCalendar.tsx` chooses `scope.sensor === 'MODIS' ? 'MODIS' : 'VIIRS'`; its radio controls expose only one instrument. `src/calendar/aggregation.ts` accepts a single `Instrument`. Thus shared `all` scope currently shows VIIRS in Calendar, not a combined calendar. This is an integration limitation, not evidence that the underlying canonical records are absent.

## C. Feasible improvement decisions

Estimates are engineering judgment for one engineer familiar with this repository, not delivery guarantees. They include meaningful tests and regression time; leave at least half a day for acceptance and presentation rehearsal.

| Change | Effort | Scientific/engineering risk | Recommendation |
| --- | --- | --- | --- |
| Add **Both sources / separate contributions** mode to existing Calendar, reusing UTC source aggregation | 5–8 h | Moderate UI/filter risk; low scientific risk if raw counts remain distinct | **GO — highest priority** |
| Add daily source-separated table export from the same calendar scope | 2–3 h, or 1–2 h incremental with the calendar work | Low if missingness, UTC and original dataset IDs are explicit | **GO — include in bounded slice** |
| Add selected-day link into existing Evidence Engine with that day's original observations | 1–2 h | Midnight-crossing associations may require a clearly labeled context window | **SHOULD GO only after core acceptance**; retain original acquisition dates, never reassign observations to a matched day |
| Connect existing documented archive/boundary hashes to export provenance manifest | 2–4 h | Risk of binding the wrong bytes or stale metadata | **GO if hashes are independently rechecked**; otherwise keep gap explicit |
| Update contradictory README/scientific/demo documentation and short script | 2–3 h | Low | **GO — submission prerequisite** |
| Resolution-based count multiplier or merged equivalent-fire count | Not defensibly bounded | High scientific risk; no validation data | **NO-GO** |
| Overpass/clear-sky exposure correction | At least several days plus external evidence/review | High; observation opportunities absent | **NO-GO before submission** |
| Historical median, anomalies or critical-period score from current sparse detections | Coding could be short; scientific validation cannot | High; absent dates would bias statistics | **NO-GO** |
| New 2000–present ingestion campaign or additional platforms | Uncertain external delivery and audit time | High scope/review risk | **NO-GO for this window**, unless explicitly required by subsequently verified rules |
| AOI drawing, new visual system or another dashboard | 1–3+ days with regression | High opportunity cost, no immediate harmonization gain | **NO-GO for this window** |

Recommended hard cap: **one focused 8–12 hour implementation slice** for combined calendar, shared export and documentation, followed by acceptance. If it exceeds that cap, ship the working separate-sensor view with explicit scope and do not rush an untested scientific transformation.

## D. A useful combined view without false equivalence

Use a **vector time series** per UTC day, not a scalar “equivalent fires” series:

`date → { MODIS: source-specific observation buckets, VIIRS: source-specific observation buckets, coverage status }`

Each calendar cell can display two labeled lines or bands: `MODIS: n delivered detections` and `VIIRS: n delivered detections`. Expand to dataset/platform/revision strata and original source IDs. Keep separate FRP values and reporting completeness; do not sum them across sensors as a unified physical quantity. No pair/group count should replace raw daily observations.

Rules for useful interpretation:

1. Both-source view must genuinely consume both source collections under the same region/date scope. Explicit MODIS/VIIRS modes stay available and valid confidence filters remain sensor-specific.
2. A date with either source observed can be marked **observations delivered**, while the other contribution can remain **unknown**. Neither-source absence stays **unknown**, not zero or an absence-of-fire claim.
3. A union of observed dates is a useful chronological discovery index, not proof of more complete coverage. “Observed by both” means delivered detections from both on that UTC day, not simultaneous acquisition or the same event.
4. Separate labeled counts remain readable without color. Source-specific scale labels must make clear that color/height is not cross-sensor intensity or fire severity.
5. Preserve original timestamps and sources when inspecting or opening Atlas. Do not force a paired observation across midnight into the other source's date.
6. Export the exact displayed scope as rows keyed by UTC date, sensor, platform, dataset, product, raw revision and source, with observed/unknown status, reported FRP completeness, coverage unknown and traceable IDs. Missing observations should use null/status rather than an unlabeled zero.

This makes the calendar itself the interface to the existing harmonization foundation. It does not resolve sensitivity or sampling; it communicates them while enabling real historical exploration.

## E. Minimum honest demonstration

NASA's two-part objective should be shown as **harmonize the records**, then **explore them through the calendar and downloadable analytics**.

1. **Problem and scope (10–15 s):** MODIS and VIIRS sample differently. We align original observations in UTC while retaining source identity; the demonstration uses actual Ajloun deliveries, not complete global coverage.
2. **Calendar first (20–25 s):** select region/date range, inspect a real observed day and both source contributions if the bounded enhancement is accepted. Otherwise switch explicitly between the two source views and state that simultaneous calendar display is not yet implemented.
3. **Evidence (20–25 s):** inspect one candidate pair and original timestamps, then change a threshold. Explain that proximity and robustness describe assumptions, not validated event truth.
4. **Research value (15–20 s):** show an actual source-separated historical comparison, unknown coverage and the missing evidence required for stronger claims. Export the same scoped analytics with methodology and original IDs.

Skip Earth replay, optional modules and anomaly pages during the essential story. The existing cinematic opening remains available. These times are rehearsal targets, not a measured novice 90-second result.

## Acceptance gate for the recommended change

- [ ] Known small synthetic schema fixtures verify union dates, sensor-separated counts, null FRP, duplicate identities, UTC midnight and partial/unknown source availability. Fixtures remain test-only.
- [ ] Real full Ajloun scope retains exactly 5 MODIS and 31 VIIRS records. Combined mode shows both without producing a sensor-equivalent total.
- [ ] `sensor:all` is visibly both-source; switching to either sensor produces the corresponding unchanged observations. Region round-trip, confidence and date reset regressions pass.
- [ ] Missing source/date cells are unknown. No verified zero appears without explicit complete scoped coverage.
- [ ] Daily details, keyboard focus, Arabic RTL, mobile labels and Atlas handoff preserve sensor/source identity.
- [ ] Export round-trip matches displayed original IDs, UTC dates, source strata, missingness and scope; repeated export is deterministic.
- [ ] Existing build, lint, 86-test baseline, E2E/language/release checks and static archive browser verification pass with the added cases.
- [ ] Documentation describes source-aware descriptive harmonization, unresolved calibration and the actual limited archive extent.

## Final recommendation

**GO:** finish the source-separated combined calendar/export bridge, reconcile submission documentation, rehearse a calendar-centered demonstration, and freeze features after acceptance.

**NO-GO:** claim detection-sensitivity normalization, complete sampling, validated anomalies, historical medians, global/early-2000s coverage or confirmed fires. The supplied objectives do not justify manufacturing these to appear more complete.

The substantive alignment assessment in the prior final review is therefore updated: core challenge alignment is demonstrable but currently split between separate calendar and evidence interfaces. A small integration improvement can materially strengthen it. Full scientific calibration remains outside the available evidence and the submission window. This document is a recommendation only; no enhancement was implemented in this gate.
