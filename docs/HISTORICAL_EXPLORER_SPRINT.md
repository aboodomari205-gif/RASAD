# Historical Explorer, RTL map fix and scientific UX

Date: 2026-11-13. Implementation in the existing repository. No data import, source-archive modifications, publication, deployment or release packaging.

## Arabic basemap root cause and fix

Reproduced by actual Chrome pointer hit testing on **http://localhost:5173** before editing. At 1366×768 and 1024×768, the center of the Arabic Street button hit the observation-ledger SVG path instead of the button. The same overlap occurred at 320×740. Satellite remained reachable. At 1440×900 and 1920×1080 both buttons were reachable; this explains why earlier large-desktop checks missed the defect.

The basemap panel and tool rail used independent fixed left/bottom positioning. RTL flex order placed Street at the left edge under the higher-stacked rail in shorter viewports. Neither a disabled state nor a failed NASA request caused the blocked click.

The panel now sits clear of the rail: left 88px desktop / 68px mobile, with larger button targets. Its vertical position accommodates the historical timeline. This avoids exchanging one obscured control for another by increasing z-index. The existing MapLibre styles, camera and worker configuration remain unchanged.

Basemap switching no longer deliberately removes the popup. Selected observation ID is retained for style-layer restoration; it is cleared on actual scope/filter changes. Original coordinates and source IDs remain unchanged. The new browser regression physically dispatches mouse events after checking the hit target, rather than using DOM `.click()` to bypass an overlay.

## Historical navigation rules

- Atlas has a native accessible year select plus previous/next **available** year buttons in its existing temporal instrument. Options come from the active manifest, never a hardcoded year list.
- Direct selection sets January 1–December 31 UTC for that year, clears the previous single-day/time selection, and keeps region/sensor/processing/quality filters. It requests only that year's raw shard through the existing loader.
- Explicit Atlas year choices are retained separately for Ajloun and Northern Jordan in session scope. Returning to a region restores its chosen year; when the target year equals the current year, the compatible selected date is retained. A restored different year selects the whole target year. Until a region has its own explicit year choice, switching preserves the current historical year.
- Timeline dates are the selected year's actual delivered dates under sensor, processing and quality filters. A selected day does not hide alternative dates from that same scoped year. All Dates selects the full year, not the entire archive.
- An unavailable year remains explicitly selected and is labeled unavailable. No implicit jump to 2026 or fabricated zero activity. The user can choose a manifest-listed year. Missing selected dates under changed filters receive an explicit unknown-coverage explanation.
- Calendar uses the shared historical capability even while a new region's data is loading. This fixes a second reproduced race where changing Calendar year quickly updated the month but retained the prior year's date bounds.
- Calendar, Evidence Engine, Research Brief and CSV retain the same mission region/date/sensor/processing scope. Existing canonical IDs and source exports are preserved.
- Advanced multi-year evidence filters remain bounded to three consecutive years / 3000 raw observations. Oversized scopes produce the existing explicit errors, now exposed in the Atlas temporal status with Arabic translations; they are never silently truncated. Choosing an Atlas year returns to a one-year window. With an advanced multi-year scope, the temporal status identifies a custom UTC range and the date strip remains for the indicated first year; selecting a day or All Dates explicitly narrows the evidence scope.

## Scientific historical comparison

Enhanced the existing unfiltered regional historical overview instead of introducing a new module. Users can select two delivered years and inspect side-by-side source contributions. Rows retain dataset ID, source, sensor, platform, product, raw version, processing and original confidence-scheme grouping. Standard and NRT remain separate. Missing source/year contributions are null / Unknown, never filled with zero. The original source-separated annual count/FRP table remains available.

This is a descriptive comparison of files delivered for one region, not a current-filter statistic or calibrated fire-activity comparison. The UI explains that platform availability, scheduling, sensitivity and observation opportunities may differ. Detection dates cannot establish actual operational coverage. No percent-normalized intensity, baseline, sensor conversion, verified zero day, confirmed fire event or validated anomaly is generated.

Still required for stronger scientific claims: authoritative acquisition/valid-pixel/cloud coverage, exposure and sampling methodology, independent validation and resolved NOAA-20/21 standard-processing lineage. Ajloun remains the default primary case study; Northern Jordan remains a separate selectable union with Ajloun included once. Totals remain 143 / 6859, not additive.

## Verification actually executed

| Check | Outcome |
|---|---|
| Actual localhost Arabic hit-target diagnosis before edits | PASS: overlap reproduced at short desktop and 320px |
| `node scripts/verify-historical-explorer.mjs` on actual localhost:5173 | PASS at the recorded browser checkpoint |
| Atlas manifest years 2006, 2021, 2023, 2026 | PASS against active API counts |
| Previous/next available-year buttons | PASS (2006 → 2010 → 2006) |
| Independent region year choices | PASS: Ajloun 2006 / North 2021 round-trip |
| Actual date selection / All Dates / sensor-scoped date strip | PASS |
| English and Arabic physical Street → Satellite | PASS at 1366×768, 390×740 and 320×740 |
| Style preservation | PASS: same canvas, camera, boundary GeoJSON, observation IDs, popup text and shared scope |
| Calendar year agreement and unavailable Ajloun 2001 | PASS |
| Research export | PASS: 22 actual Ajloun 2023 observations, original provenance retained |
| Two-year descriptive comparison controls | PASS in browser; deterministic calculations unit tested |
| `npm run build` after final edits | PASS; existing large MapLibre/Three chunk warnings remain |
| `npm run lint` after final edits | PASS, no warnings |
| `npm test` after final edits | PASS: **105 tests**, zero failures/skips |
| `npm run verify:release` after final edits | PASS local safeguards; no public deployment claim |
| Full `npm run test:e2e` and `npm run test:language` for this sprint | **NOT EXECUTED: browser approval-review service became unavailable** |
| Final repeated browser round after last status/translation refinements | **BLOCKED by the same approval-review limit** |

Evidence logs: `.checkpoints/rtl-diagnosis.log`, `.checkpoints/explorer-browser.log`, `.checkpoints/explorer-final-build.log`, `.checkpoints/explorer-final-lint.log`, `.checkpoints/explorer-final-tests.log`, `.checkpoints/explorer-final-release.log`.

New deterministic tests cover year-bound scope/reset behavior, independent region year maps, sensor/processing date-strip filtering, unavailable-year retention and reproducible source/platform/processing-separated comparison with null missing contributions. Existing tests continue to pass unchanged. Native select keyboard behavior is provided by HTML; the additional dedicated real-browser keyboard sequence and explicit selected-feature-state assertion were not executed. They are remaining manual acceptance items, not claimed passes.

The successful browser checkpoint preceded the final extra unknown-date/custom-range messages, selected-year date-strip loading filter, translation deduplication and selected-ID cleanup. Those final changes passed build/lint/unit/release, but have not received a repeated browser run. Therefore **full sprint browser acceptance remains pending**, despite successful demonstrated fixes.

Automatic approval review rejected the additional Chrome invocation because its service hit a usage limit. Its message explicitly said this was a review failure, not a determination that the action was unsafe. No attempt was made to bypass that approval check.

## Screenshots and visual review

Captured actual local-browser English/Arabic screenshots at both 390 and 320px:

- `.checkpoints/explorer-en-390.png`
- `.checkpoints/explorer-en-320.png`
- `.checkpoints/explorer-ar-390.png`
- `.checkpoints/explorer-ar-320.png`

The Arabic 320px image was inspected: year selector and basemap controls fit without horizontal overflow and remain separated from the rail. Existing large regional title/popup overlap on very small screens remains an inherited visual limitation; it was not used to justify a redesign. No claim is made that every final layout refinement was browser-reviewed after the approval interruption.

## Files changed

- `src/FireMap.tsx`
- `src/components/AtlasTimeline.tsx`
- `src/design/atlas.css`
- `src/i18n/evidence-ar.ts`
- `src/intelligence/HistoryOverview.tsx`
- `src/calendar/BurningCalendar.tsx`
- `src/state/MissionContext.tsx`
- `src/state/mission.ts`
- `shared/activation.ts`
- `shared/regionScope.ts`
- `shared/atlasTemporal.ts` (new)
- `shared/historyComparison.ts` (new)
- `tests/historicalExplorer.test.ts` (new)
- `scripts/verify-historical-explorer.mjs` (new)
- `docs/HISTORICAL_EXPLORER_SPRINT.md` (new)

Reversible source copies for the initial directly affected files are under `.checkpoints/historical-explorer-before/`. No dependencies were installed.

## Remaining acceptance commands

Start the existing integrated development server if needed:

```powershell
Set-Location 'C:\Users\abood\Desktop\firepulse'
npm run dev -- --host 127.0.0.1 --port 5173 --strictPort
```

Open **http://localhost:5173/#mission-atlas**. In another PowerShell terminal, once browser execution is available:

```powershell
npm run test:e2e
npm run test:language
node scripts/verify-historical-explorer.mjs
node scripts/verify-historical-browser.mjs --dev-existing
```

Manually Tab to the Atlas year selector and use arrow keys/Enter; select 2006, 2021, 2023 and 2026; confirm unavailable Ajloun 2001 remains unavailable rather than resetting. At Arabic 1366×768 and 320px, physically click Street then Satellite with an open observation popup. Verify boundary, highlight, camera, date/sensor/processing scope and popup persistence. Check historical Calendar day-to-map handoff and CSV/Research Brief date scope; inspect reduced-motion behavior.

No original archive was read for reimport or modified. No deployment, publishing, Git push or release archive was created. Acquisition coverage and cross-sensor scientific equivalence remain unknown/unvalidated.
