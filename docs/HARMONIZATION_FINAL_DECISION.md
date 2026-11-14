# Harmonization final decision

2026-11-14. Implementation complete for the defensible detection-only workflow below. No new research sprint, data download, observation/SQLite edit, deployment or release was performed.

## Implemented common target

The common comparison target is a **UTC monthly vector of delivered observations, one channel per exact source stratum**, not a scalar count of equivalent fires. Strata preserve region, dataset, source, sensor, platform, product, original version, processing and confidence scheme. Existing daily/yearly/seasonal aggregation, candidate matching and threshold sensitivity are retained unchanged.

The Burning Calendar now contains **Compare this month / preserved source identity**:

- Automatically follows the selected region and UTC calendar month.
- Shows each source's delivered count, descriptive prior same-month median, actual reference sample size, eligibility and difference from the median.
- Provides a 3/4/5/6 minimum-reference control, original reference periods, unrepresented prior years, highest delivered months and years (including ties), with original source composition retained.
- Exports the selected month comparison JSON with exact strata, references, parameters, digest, dataset provenance and activation revision. Existing original-record CSV, standalone SVG, Calendar/Atlas handoffs and Research Brief remain intact.
- Explicitly labels its history as **unfiltered regional monthly history**, before mission date/quality filters. It does not misrepresent these monthly values as the currently quality-filtered day grid. The selected calendar month and region determine the comparison scope.
- Preserves missing month counts and unavailable reference support as null/unknown. NRT and unsupported provenance cannot provide medians or peak rankings; they remain visible as distinct delivered contributions.
- Includes English/Arabic copy, keyboard-accessible controls and an internally scrollable comparison table on mobile. Existing visual identity, map behavior and backend contracts are unchanged.

Existing source-specific same-calendar-month references and seasonal histories are reused, not replaced. Only earlier positive delivered months in the identical source stratum contribute to the median. Minimum support is a transparent software policy, not scientific validation; missing years do not become zero. Product versions and Standard/NRT are never pooled to manufacture support. Original numerical MODIS confidence and categorical VIIRS confidence stay separate. NOAA-20/21 lineage warnings remain visible.

No optional normalized scalar view was enabled: dividing by a source's positive-detection-conditioned median would not correct unknown sampling, exposure or sensitivity and cannot make sources equivalent. `sensorIndependentActivity` and `sensorAttributedChange` are explicitly **null**, not zero. Users can observe a difference; the fraction caused by sensor differences cannot be estimated from these inputs.

## Real examples (S-NPP, raw version 2, standard)

| Scope / month | Delivered count | Prior same-month median / support | Highest delivered month(s) / year |
|---|---:|---|---|
| Ajloun, May 2025 | 2 | 1 from May 2018/2021/2022 (n=3); difference +1. Minimum 4 -> unavailable. | July 2023 and June 2024 tie at 5; year 2024 = 9. |
| Northern Jordan, June 2020 | 80 | 31 from eight prior observed Junes; difference +49. | June 2020 = 80; year 2020 = 293. |

These are source-specific delivered counts, not exposure-corrected intensity, annual completeness, emergency severity, independent fire events or validated anomalies. The combined July 2023 Ajloun Calendar still shows MODIS 2 / VIIRS 16; source origin remains essential to interpretation.

## Exact files

- `shared/calendarComparison.ts`: reusable monthly source-vector/reference/peak model; null unsupported attribution.
- `src/data/useRegionalHistory.ts`: extract/reuse the existing validated year/month summary transport for development and static paths.
- `src/intelligence/HistoryOverview.tsx`: consume that shared hook; existing historical comparisons preserved.
- `src/calendar/CalendarComparison.tsx`: actual Calendar comparison, evidence disclosure, support control and JSON export.
- `src/calendar/BurningCalendar.tsx`: integrate the comparison in the existing Calendar.
- `src/calendar/calendar.css`: native token-based table/scroll/focus-compatible layout.
- `src/i18n/evidence-ar.ts`: reviewed Arabic labels and limitations.
- `tests/calendarComparison.test.ts`: real source-vector/reference/identity/null/reproducibility tests.
- `scripts/verify-calendar-comparison.mjs`: generate comparisons for all actually represented regional months.
- `scripts/verify-calendar-comparison-independent.py`: independent read-only SQLite reconstruction of counts, source eligibility, medians and tied monthly/yearly peaks.
- `scripts/verify-observed-period-browser.mjs`: strengthen existing actual-browser acceptance with Calendar comparison, minimum-support changes, JSON export and Arabic mobile checks.
- `docs/HARMONIZATION_FINAL_DECISION.md`: this final result. Existing scientific audit output was regenerated by its unchanged verification script.

Local pre-edit copies: `.checkpoints/harmonization-final/*before.tsx`. No dependency installation or scientific matching change.

## Executed results

**138/138 unit/backend tests; final outcomes PASS for all 25 acceptance commands.** Build and lint pass. Existing scientific/independent/history/API/filter/claim/layout/exploration/workflow/browser checks, E2E and language checks pass. Existing local release-asset assertions pass; no release/package/deployment is created. Exact commands, exit codes and outcomes are in `.checkpoints/harmonization-final/acceptance.json`, with per-command logs and final rerun logs alongside it.

Independent new checks: **275 actual region-months / 3,150 source rows**, including source/platform/version/processing eligibility, exact prior medians, unknown periods, complete tied peak lists and null sensor attribution. The previous independent **2,284 monthly cases** across four support settings also pass. Actual archive hashes, original IDs, UTC/coordinates/provenance and polygon totals remain checked by the existing full data audit.

Actual Chrome at `http://localhost:5173/#mission-atlas` verifies Calendar May 2025 S-NPP cells (2, median 1, support 3, difference 1), minimum 4 unavailable state, real comparison JSON, return to July 2023 Calendar/Atlas/source popup, both regions, original map canvas, keyboard Enter, RTL/reduced motion and mobile overflow. The new Calendar's Arabic heading and 320px layout were checked; screenshot `.checkpoints/harmonization-final/calendar-ar320.png` was captured and inspected. No public URL was verified.

One initial unit regression identified an incorrectly encoded loading-label ellipsis (`Reading source?`); it was corrected to the reviewed existing label. All 138 tests passed on rerun; no assertions were weakened. Initial results remain in `acceptance-initial.json`; targeted final build/lint/unit/browser/independent reruns are recorded. The existing large Earth/MapLibre bundle warning remains; it is not a build failure.

Original totals remain **Ajloun 143 / Northern Jordan 6,859**; Ajloun is a subset, never added to the north. SQLite SHA256 unchanged: `b1e19d095190b7c6116a284080a87cd702c0927260f183d85ff9ef1a1747533e`.

## Final decision

**GO:** implemented, tested source-aware harmonization workflow and useful unified calendar, with comparable conditional historical references and explorable delivered peaks.

**NO-GO:** claiming that detection-only archives identify sensor-independent fire activity or fully solve calibrated MODIS/VIIRS continuity. Swath/valid-pixel/cloud opportunity, independent sensitivity reference and unresolved source lineage remain missing evidence. Nominal resolution, detection ratios, median scaling and candidate associations cannot identify those effects. No coefficients, equivalent fire counts, verified zero days or forecasts were fabricated.

To review: open the local Mission Atlas, choose Burning Calendar, select May 2025 in Ajloun and scroll to the comparison; repeat June 2020 in Northern Jordan. Download the comparison JSON and inspect original Calendar CSV/SVG/provenance. No further speculative work or deployment is part of this sprint.
