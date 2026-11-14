# NASA challenge core final acceptance

> Historical bounded acceptance: superseded for the complete owner-supplied challenge specification by [NASA_OFFICIAL_OBJECTIVES_FINAL.md](NASA_OFFICIAL_OBJECTIVES_FINAL.md). Structural source integration is working, but calibrated sensor-independent continuity remains an unresolved core limitation; the earlier bounded A-G GO below is not a full-objective completion claim.

2026-11-14. Local implementation and acceptance only. No deployment, Git operation, release package, observation import, source-data edit or scientific calibration was performed. Reversible source checkpoints: `.checkpoints/core-completion/*.before.*`.

## Requirement provenance and scope of this verdict

The [official challenge URL](https://www.spaceappschallenge.org/2026/challenges/modis-and-viirs-hot-spots/) returned HTTP 502 during this pass. The previously retrieved official-domain search summary contains the exact phrase **"web application that harmonizes these records into a burning activity calendar"**. Its retrieval limits are preserved in `docs/OFFICIAL_REQUIREMENTS_EVIDENCE.json`. Full official details and the resource list remain **UNCONFIRMED**. A secondary reproduction and the owner's supplied challenge description are supporting context, not independently authenticated mandatory text.

A-G below are the supplied core-objective decomposition, not seven invented verbatim NASA requirements. PASS means an executed local demonstration of that bounded capability. It does not establish 100% official compliance, calibrated equivalence, complete acquisition coverage or NASA endorsement. Early-2000s-to-present completeness, historical medians, drawing arbitrary AOIs, forecasts and sensitivity calibration are not asserted independently verified mandatory requirements.

## Objective-to-feature acceptance

| Objective and requirement status | Actual implementation and source files | Real-data acceptance evidence | Decision |
|---|---|---|---|
| A. Web application; corroborated by official summary | Existing React/MapLibre application, `src/App.tsx`, `src/FireMap.tsx`; no replacement architecture | Local Chrome on `http://localhost:5173/#mission-atlas`, original observation clicks, playback and region switching; E2E | PASS / GO |
| B. Harmonize MODIS/VIIRS; corroborated structurally by official summary | `shared/observations.ts`, `shared/scientificEngine.ts`, `shared/historySummary.ts`, `shared/evidence.ts`, `shared/agreement.ts`: canonical IDs, UTC, preserved metadata, processing-aware aggregation, exploratory matching and sensitivity | Real 143 Ajloun / 6,859 Northern observations; independent SQLite/source checks, source/month comparisons and threshold browser tests | PASS / GO for source-aware structural harmonization; calibrated sensor-neutral counts NOT implemented or claimed |
| C. Burning-activity calendar; corroborated by official summary | `src/calendar/BurningCalendar.tsx`, `src/calendar/aggregation.ts`, `src/calendar/combined.ts`, `src/calendar/visualization.ts` | Ajloun July 2023: 2 MODIS / 16 VIIRS detections, daily source details, CSV/SVG with original IDs/coordinates/revision; Python verifies both regions and three sensor scopes | PASS / GO |
| D. Selected AOI; supplied objective, full official wording unconfirmed | Existing verified Ajloun and Northern Jordan polygons, shared region/date/filter state | Browser region/year/filter tests and two-region API checks; independent totals, no adding nested regions | PASS / GO for these two predefined AOIs; no arbitrary polygon drawing claimed |
| E. Historical patterns; supplied objective, full official wording unconfirmed | `src/intelligence/HistoryOverview.tsx`, `src/intelligence/MonthComparison.tsx`, `shared/historyComparison.ts`, existing seasonal clock | Real source-separated 2021/2023 matched-month comparisons, actual monthly/seasonal contributions; independent Python and historical browser checks | PASS / GO for descriptive delivered histories, not exposure-corrected trends |
| F. Unusual conditions; supplied objective, full official wording unconfirmed | NEW `shared/observedPeriods.ts`, `src/intelligence/ObservedPeriodExplorer.tsx` in existing Anomaly Detection and Evidence Engine, direct Calendar entry | Ajloun S-NPP May 2025: 2 versus prior observed maximum 1 in three comparable years; raise minimum to 4 -> insufficient history; source JSON reconciles 2 original observations; North June 2020: 80 versus 63 across eight references | PASS / GO for interactive descriptive unusual observed counts; validated anomaly remains null |
| G. Critical periods; supplied objective, full official wording unconfirmed | Same explorer's **Peak delivered periods**, exact-stratum raw count ranking, source composition and period/record handoff | Ajloun S-NPP July 2023 and June 2024 tie at 5, rank 1 / 32 delivered months. July opens all-source Calendar (2 MODIS / 16 VIIRS) and Atlas (18 unchanged locations), exact record popup works without map remount | PASS / GO for highest observed periods, NOT danger, emergency severity or independent fire events |

The challenge's supplied core is now demonstrated end to end within these scientific bounds. **Full official mandatory compliance remains UNCONFIRMED**, so no universal 100% score is issued.

## What was implemented in this pass

The prior calibrated-anomaly unavailable notice was scientifically correct but did not provide functional unusual-condition exploration. It is retained; a genuine descriptive explorer now precedes it. The existing Calendar links directly to that explorer. The Evidence Engine also exposes it without a new page or duplicated fetch pipeline.

Users select an exact source stratum, candidate year and minimum reference support (3/4/5/6). They switch between strictly higher delivered months and peak delivered months, inspect all prior same-month references, view source contributions and original records, open the month in Calendar/Atlas, open one exact source record, and download reproducible JSON. The full unfiltered regional history is explicitly distinguished from mission date/quality filters. Period handoff intentionally clears incompatible quality filters and opens **all sources**, as labeled; the evidence drilldown stays source-specific.

Source-year retrieval uses the existing transport, and rejects revision or count disagreement instead of displaying false partial success. Long source lists reveal another 20 observations per action. Native selects/buttons/tables, visible focus, RTL translations and the existing responsive tokens are reused. No per-frame React animation or map initialization was added.

The shared scientific result now has an additive `observedPeriodExploration` field; existing Research Brief JSON inherits it for its explicitly selected observation scope. Existing matching behavior, endpoints and unavailable scientific gates are unchanged.

### Reproducible definition

An exact comparison stratum is `(dataset ID, original source, sensor, platform, product, raw version, processing, confidence scheme)` within **one region**. Only known archive descriptors with delivery-declared standard processing and compatible source identity qualify. Fixtures, NRT, unknown provenance and mismatched descriptor scopes do not qualify. MODIS numerical confidence and VIIRS categories are never converted or pooled. MODIS raw versions such as `6.03` and `61.03` stay separate and unchanged.

For candidate month `y-m` with count `c`, references are all **earlier delivered positive-count months** in calendar month `m` within that same stratum. Candidate/future years are excluded. Let `R` be their counts and `n=|R|`:

- Descriptive comparison support requires `n >= selected minimum` (default 3). This is a transparent software screen, **not** a validated statistical baseline or NASA-prescribed adequacy threshold.
- Prior maximum is `max(R)`; a highlighted month requires strictly `c > max(R)`.
- Comparison rank is `1 + number(r > c)` over `R`, denominator `n+1`. Ties share rank and never produce a strict-high highlight.
- Difference is `c - max(R)` only when comparison support is sufficient. Numeric unusualness rank/difference are null otherwise.
- Peak-period rank is `1 + number(other delivered same-stratum month counts > c)`, denominator all positive delivered months in that stratum. This raw ranking needs no historical anomaly baseline and explicitly has a different denominator.
- Absent dates/years do not become zero. Zero-count input rows do not provide comparison support. Unrepresented prior years are listed only within the delivered stratum extent and are not asserted missing acquisitions or platform operational years.
- Exact duplicate monthly rows are deduplicated; conflicting duplicate identities and invalid month/count/FRP summaries fail validation. Observation identity deduplication remains upstream, not a claim of unique fire-event identification.

Screening many months establishes no statistical significance; no multiple-testing, exposure or sensitivity correction is supplied. Reference histories are conditioned on delivered detections, so selection bias remains. `coverage='unknown'`, `calibrated=false`, `validatedAnomaly=null`, `forecast=null` in the new model; previous calibrated anomaly/median/event gates remain null.

### Actual examples and provenance

| Region / exact stratum | Candidate | Reference / interpretation |
|---|---|---|
| Ajloun / `ajloun-snpp-standard-c2`, S-NPP, VNP14IMGTML, raw version `2`, standard, VIIRS categorical confidence | May 2025: **2** detections, reported FRP sum 1.8 MW (2/2 reports) | May 2018 = 1, May 2021 = 1, May 2022 = 1. Maximum 1; difference +1; rank 1/4. Minimum 4 makes it insufficient. Other prior years unknown; no calibrated change claim. |
| Same Ajloun stratum | July 2023 = **5**, June 2024 = **5** | Both peak rank 1/32 delivered months. A raw peak does not itself guarantee enough prior same-month evidence for unusual-condition comparison. |
| Northern Jordan / `northern-jordan-snpp-standard-c2`, same S-NPP/product/version/processing scheme | June 2020 = **80**, reported FRP 444.81 MW (80/80) | Prior June counts 2012..2019: 33, 31, 20, 63, 27, 48, 11, 31. Maximum 63; difference +17; rank 1/9, peak rank 1/169. Unknown exposure prevents true-incidence inference. |

May 2025 Ajloun also contains 2 NOAA-20 and 1 NOAA-21 records. These are displayed as separate source contributions, not added to the S-NPP reference. June 2020 North contains MODIS Aqua 4, MODIS Terra 4, VIIRS NOAA-20 82 and VIIRS S-NPP 80. Raw composition is not a count of independent fires. A monthly sum of reported detection FRP is not regional radiant energy, burned area or a coverage-normalized intensity. NOAA-20/21 delivery lineage/early-date discrepancies remain explicitly warned; original records are preserved. The demonstration defaults to S-NPP, not these unresolved lineage strata.

## Data integrity

Active generation: `f3cb30006dd2f0ff02df206024189da7757d40cd02e6708c2e5374f03a73910f`.

SQLite SHA256 before/after: `b1e19d095190b7c6116a284080a87cd702c0927260f183d85ff9ef1a1747533e`.

Ajloun remains **143**; Northern Jordan remains **6,859**. Ajloun is a subset of Northern Jordan; these must not be summed. Standard/NRT processing, canonical IDs, timestamps, coordinates, original confidence, source provenance and archive hashes are preserved. No new observations were downloaded, imported or invented.

## Exact changed files

Implementation:

- `shared/observedPeriods.ts` (new): validated source-aware reference/ranking model, deterministic digest, eligibility and limitations.
- `shared/scientificEngine.ts`: additive reusable exploration in existing scientific output.
- `src/intelligence/ObservedPeriodExplorer.tsx` (new): interactive controls, source reconciliation, period/record navigation, JSON evidence export.
- `src/intelligence/observedPeriods.css` (new): restrained existing-token layout, focus/wrapping/responsive source lists.
- `src/intelligence/HistoryOverview.tsx`: reuse existing year/month history requests for the explorer.
- `src/intelligence/IntelligenceWorkspace.tsx`: integrate in existing modules and shared-scope handoffs.
- `src/calendar/BurningCalendar.tsx`: direct historical exploration entry action.
- `src/App.tsx`: wire existing Calendar-to-Intelligence navigation.
- `src/i18n/evidence-ar.ts`: Arabic translations for the feature.

Verification/report:

- `tests/observedPeriods.test.ts` (new): six deterministic and actual-data tests.
- `scripts/verify-observed-periods.mjs` (new): actual two-region calculations at four minimum-support settings.
- `scripts/verify-observed-periods-independent.py` (new): independently rebuild monthly strata/counts/FRP/reference/rank/tie/eligibility calculations from read-only SQLite.
- `scripts/verify-observed-period-browser.mjs` (new): actual local Chrome acceptance, exports, navigation and bilingual mobile behavior.
- `docs/SCIENTIFIC_DATA_AUDIT.json`: regenerated by the existing audit; includes additive scientific output, not modified observations.
- `docs/NASA_CHALLENGE_CORE_FINAL.md` (this report).

Generated local evidence/logs and original-file backups are in `.checkpoints/core-completion`; normal `dist` was regenerated only by the requested build. No deployment preparation/packaging scripts ran.

## Executed validation

All **23 local acceptance commands passed**, including **132/132 unit/backend tests**, zero skipped/failed. Machine-readable outcomes: `.checkpoints/core-completion/acceptance.json`; per-command logs alongside it. The expanded new browser script was then rerun successfully with native keyboard Enter, candidate-year filtering, explicit NRT ineligibility and export path-safety assertions.

| Executed command | Actual result |
|---|---|
| `npm run build` | PASS; existing >500 kB chunk-size warning remains (Earth/MapLibre chunks); no build error |
| `npm run lint` | PASS |
| `npm test` | PASS: 132 tests, 0 failures, 0 skipped; six new observed-period tests |
| `node scripts/audit-scientific-data.mjs` | PASS: real sources, archive/DB integrity, original IDs and region totals |
| `python scripts/verify-scientific-independent.py` | PASS: independent actual counts, source splits and baseline spatial/time associations |
| `node scripts/verify-scientific-completion.mjs` | PASS: existing source-month comparison and catalog-metadata pilot checks, not pixel coverage |
| `python scripts/verify-completion-independent.py` | PASS: independent UTC/catalog joins and every real 2021/2023 source-month comparison |
| `node scripts/verify-challenge-exports.mjs` | PASS: six actual region/sensor CSV/SVG scopes |
| `python scripts/verify-challenge-independent.py` | PASS: CSV coordinates/IDs/confidence/revision; parsed SVG source/day counts, FRP and missingness |
| `node scripts/verify-historical-api.mjs` | PASS: actual development API generation, manifests, year shards and summaries |
| `npm run test:filters` | PASS |
| `node scripts/verify-claim-audit.mjs` | PASS: original claims/Calendar/download/research/guided-judge workflow |
| `node scripts/verify-historical-explorer.mjs` | PASS |
| `node scripts/verify-scientific-browser.mjs` | PASS |
| `node scripts/verify-atlas-layout.mjs` | PASS |
| `node scripts/verify-exploration-panel.mjs` | PASS |
| `node scripts/verify-final-workflows.mjs` | PASS: real source/confidence/FRP/processing filters, playback, popup bounds and unchanged map canvas |
| `npm run test:e2e` | PASS |
| `npm run test:language` | PASS |
| `npm run verify:release` | PASS: existing local asset/configuration assertions only; no package, release or deployment created |
| `node scripts/verify-observed-periods.mjs` | PASS: both real regions, all four minimum-reference settings |
| `python scripts/verify-observed-periods-independent.py` | PASS: **2,284 monthly calculation checks**, settings 3/4/5/6; independent read-only SQLite reconstruction and unchanged database SHA256 |
| `node scripts/verify-observed-period-browser.mjs` | PASS: actual `localhost:5173`, real reconciled records/export, minimum-history nulls, candidate-year filter, NRT exclusion, keyboard Enter, Calendar/Atlas/source handoffs, North/Ajloun, Arabic RTL 320px, focus/reduced motion/no overflow |

The independent default-minimum check finds 12 descriptively supported candidate months across all eligible Ajloun source strata (3 strict highs), and 270 across North (38 strict highs). These are stratum-month comparisons, not distinct events; unresolved NOAA lineage caveats still apply. Default S-NPP alone has 8 supported Ajloun months and 133 supported North months. No statistical significance or sensor equivalence follows from these totals.

Two test-authoring failures were corrected, not hidden: an initial selector-escaping error, and an attempted assertion of an observation ID in session state (the existing application intentionally keeps that handoff in React props). The regression now verifies the actual map selection props and visible popup. The added native Enter check initially omitted CDP's carriage-return text; the complete native event was supplied and the expanded script passed twice. No application failure was masked and no pre-existing assertion was weakened.

No public deployment, release preparation, static packaging or new acquisition-data download was tested/performed in this scope.

Browser screenshots actually captured and inspected: `.checkpoints/core-completion/period-desktop.png` (1440x1000 English), `period-ar320.png` (320x740 Arabic). The browser run enables reduced motion and verifies focus, no horizontal document overflow, exact record reconciliation, progressive list disclosure, and the same MapLibre canvas after navigation. Existing layout/workflow scripts cover other desktop/mobile sizes and all original map behaviors. Screenshots are evidence of local rendering, not public deployment.

## Local review

Use the existing development transport (Vite mounts the backend on the same origin); do not start a second competing service:

```powershell
Set-Location C:\Users\abood\Desktop\firepulse
npm run dev -- --host localhost --port 5173 --strictPort
```

Open `http://localhost:5173/#mission-atlas`. If the existing 5173 server is already running, reuse it. To reproduce new independent/browser acceptance: `node scripts/verify-observed-periods.mjs`, `python scripts/verify-observed-periods-independent.py`, then `node scripts/verify-observed-period-browser.mjs` (Chrome installed at the path used by the existing browser scripts). Browser scripts run sequentially on CDP port 9337.

The existing E2E run deliberately tests blocked-texture/no-WebGL/error recovery; its expected diagnostic console/network errors are not silently counted as unexplained failures. It reports zero unexpected failures. No pixel acquisition coverage is established by those tests.

## Three-minute judge path

1. **0:00-0:30** Open `http://localhost:5173/#mission-atlas`, Start Mission, select Ajloun. Explain: different sensors produce different thermal detections; FIREPULSE unifies source-aware records, not calibrated fire counts.
2. **0:30-1:00** Open Burning Calendar, select July 2023. Show MODIS 2 / VIIRS 16, open July 14, download month CSV/SVG. Empty cells remain unknown coverage.
3. **1:00-1:45** Use **Explore unusual and peak observed periods**. Default exact S-NPP stratum; inspect May 2025 (2 versus 1, three observed prior years). Raise minimum to 4: insufficient history. Restore 3; download evidence JSON.
4. **1:45-2:15** Select **Peak delivered periods**, inspect July 2023 (5 S-NPP, tied highest). Show references/source contributions; open month in Atlas, click an observation. These are raw detections, not independent fires or forecast severity.
5. **2:15-3:00** Evidence Engine: use existing guided Ajloun 2023 comparison and 1 km/60 min versus 1 km/7 min settings. Show candidate edges/unique observations/groups, then Research Brief export. Explain unknown acquisition coverage and lack of calibrated anomalies. Optional North comparison: S-NPP June 2020 80 versus prior maximum 63.

## Final decision and remaining blockers

**GO for the bounded, real-data local demonstration of A-G and the supplied core objective.** F is now an actual interactive comparison, not merely a disabled anomaly notice. G is explorable delivered activity, not an unsupported hazard forecast. No functional core gap is knowingly left behind; regression status is reported above rather than assumed.

**UNCONFIRMED for complete independently verified official mandatory compliance** until the full official details/resource text can be authenticated. This is a source-verification limitation, not grounds for inventing requirements or blocking the implemented core demonstration.

Scientific boundaries remain: unknown cloud/valid-pixel/acquisition exposure; incomplete delivered temporal coverage; no detection sensitivity calibration, sensor-equivalent intensity, validated anomaly, prediction, verified no-fire days, burned-area product or confirmed independent events. NOAA-20/21 upstream lineage needs supplier clarification. Descriptive ranks cannot solve those research gaps. None is disguised by a numeric score. Additional calibration research is not required to demonstrate the bounded supplied challenge objective, and no deployment is authorized by this report.
