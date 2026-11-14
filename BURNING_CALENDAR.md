# Task 08 / Burning Calendar

## Implemented

Open **Index → Burning Calendar**. This replaces the old calendar preview entry within the existing navigation; its styling and the rest of the application are unchanged.

The module uses the existing Atlas tokens, custom glyphs, source stamps and metadata details. It provides a monthly grid, previous/next month, month/year selectors (1900–2100), Current month, Latest observation, region selection, separate MODIS/VIIRS views, detection-count / reported-FRP metrics, day selection and original observation metadata. Mobile has a selected-day inspection shortcut and a vertically flowing detail view. The desktop record panel scrolls independently.

The calendar is lazy-loaded. The existing MapLibre instance remains mounted and inert while the calendar is open. A day’s **Open this day/date in Mission Atlas** action explicitly transfers region, UTC date and instrument to that same map, clears the old confidence constraint, and opens the ledger. Cross-region transfers wait for the correct collection; a later manual region change cancels the pending selection. Closing the calendar via normal navigation retains the map's prior filters. No cinematic, Atlas visual-identity, worker, API, processing or dataset change is involved.

## Data actually available

The current endpoint remains `GET /api/observations?mode=ajloun|brazil-test`.

| Current source | Instrument | UTC date | Detections | Sum of reported FRP |
| --- | --- | --- | --- | --- |
| Brazil local development fixture | VIIRS / N20 | 2026-11-07 | 2 | 23.54 MW |
| Brazil local development fixture | VIIRS / N20 | 2026-11-08 | 4 | 48.10 MW |
| Brazil local development fixture | VIIRS / N20 | 2026-11-10 | 1 | 1.19 MW |

Ajloun currently returns no connected observations. The fixture has no MODIS records. No source supplies a verified coverage ledger. Therefore **no current calendar date is labeled a verified zero**. Selecting MODIS, an empty month, or Ajloun shows unavailable dates rather than invented zero activity. The Brazil fixture remains visibly marked local/development/not live.

FRP here is a sum across the reported detections, not integrated daily energy, fire size, unique burned area or a count of fires. Repeated satellite overpasses remain distinct records. MODIS and VIIRS raw counts are never combined in a calendar cell.

## Aggregation contract

`src/calendar/aggregation.ts` accepts the existing point FeatureCollection and a region + one instrument. Future historical collections using that schema need no calendar UI rewrite. A future data adapter can additionally pass `VerifiedDayCoverage[]` into the calendar without changing rendering.

- Explicit-zone `acquiredAt` is normalized to UTC for grouping. Otherwise the existing UTC `date` / HHMM `time` fields are used. Timezone-less timestamps, invalid dates/times and invalid coordinates are rejected. No local-browser datetime parsing is used.
- Exact source-row duplicates are removed using canonical geometry/properties, independent of object-key order and GeoJSON feature IDs. The presentation-only `_revealOrder` is ignored; other source fields remain part of identity. Nearby pixels, other acquisitions, satellites and source products are not merged. Audit counts are available.
- Finite, nonnegative numeric FRP contributes to the sum. Zero is preserved. Missing/invalid FRP is null, excluded from the sum, and reported through `frpReported` / `frpComplete`. All-missing FRP is unavailable, never fabricated as zero. Partial FRP sums carry an asterisk.
- `observed` means one or more valid records. It does not establish complete daily coverage or confirmed fires.
- `verified-zero` requires an explicitly complete, verified day for the same region/instrument, a valid date and nonempty coverage provenance, with no observations.
- `unavailable` means no records and no such coverage evidence. An empty response or a source-level record count does not establish coverage.
- Heat intensity is relative to the displayed month and selected metric/instrument, never severity or a historical baseline. Large cell values may use compact notation; details retain the full reported values.

Calendar counts are deduplicated under this exact-row policy. Mission Atlas continues to display its existing raw source collection; future duplicate-containing datasets can therefore have different raw map counts. No map aggregation behavior was changed.

## Accessibility and resilience

The grid has weekday headings and a single roving Tab stop. Arrow keys move by day/week; Home/End move within a week; Page Up/Down changes month; Shift + Page Up/Down changes year. Enter/Space selects a day. Keyboard navigation scrolls the focused cell into view below the sticky header. Native controls and details/summary provide standard keyboard behavior. Selected days, source state, metric and fixture labels are exposed through accessible names and descriptions.

Source loading is real, with no artificial progress. Requests abort on source changes, stale collections are hidden immediately, and response metadata is checked against the requested mode. Error states offer retry. Current empty data is accompanied by coverage caveats. Failed sources never become zero activity. No new animation loops, WebGL contexts or dependencies were added.

## Files

Added `src/calendar/aggregation.ts`, `useCalendarObservations.ts`, `BurningCalendar.tsx`, `CalendarDayDetails.tsx`, `calendar.css`, and `tests/calendar.test.ts`.

Updated `src/App.tsx` (module wiring and retained-map host), `src/components/MissionUI.tsx` (calendar entry), `src/FireMap.tsx` (explicit date/instrument handoff), `scripts/verify-motion.mjs` (calendar checks), and README. Existing Atlas and Earth CSS/assets are untouched.

Checkpoint: `.checkpoints/burning-calendar-20261111-195827/`, created before edits and excluding backend files, secrets, datasets and dependencies.

## Verification

Passed:
- `npm run build`
- `npm run lint` (clean)
- `node --test tests/calendar.test.ts server/observations.test.js` — 12 tests: 10 calendar, 2 backend
- `node scripts/verify-motion.mjs` — actual isolated Chrome checks including the calendar and existing Earth/Atlas regressions

Calendar tests cover missing dates, explicit coverage/verified zeros, incomplete and unverified coverage, UTC midnight/offset/year boundaries, invalid dates/times, leap months, sensor isolation, exact duplicates, source/granule distinctions, FRP null/zero/partial aggregation, region guards, and a future historical collection using the same schema.

Browser checks verified current Ajloun unknown days; three Brazil activity dates; 2/4/1 VIIRS counts; 23.54 MW on November 7; FRP and MODIS switching; empty month/year states; Arrow/Enter selection; mobile width; API error/retry and region isolation; and a November 8 handoff displaying four map observations without replacing the canvas. Existing map layers, basemaps, source filters, popups, camera cancellation, intro and WebGL fallbacks also passed. Desktop and 390px mobile calendar renders were inspected and refined.

Manual checks:
1. Index → Burning Calendar. Confirm Ajloun unknown days, then explicitly choose Brazil and verify the development stamp.
2. Select November 2026, VIIRS and each actual activity date. Toggle Reported FRP, expand daily metadata, then choose MODIS and confirm unavailable data instead of verified zeros.
3. Navigate months/years and use Latest observation. Exercise Arrow, Home/End, Page Up/Down and Shift + Page Up/Down, then Enter/Space.
4. Open a selected date in Atlas. Check region, date and sensor, point/ledger counts, popups and satellite/street restoration. Return via Index without losing the map instance.
5. On a physical phone/tablet, verify readable FRP cells, scrolling, the selected-day shortcut and focus. Screen-reader and broad-browser/hardware validation remain manual.

Remaining data dependencies: validated historical observations for broader dates, actual Ajloun records, MODIS records, and provenance-backed daily coverage. No historical baseline, anomaly score, confirmed fire classification or inferred coverage is introduced. Vite's existing large renderer/map chunk warnings remain.

## Shared data foundation update

The original Task 08 implementation notes above are now complemented by [DATA_FOUNDATION.md](./DATA_FOUNDATION.md). Canonical UTC parsing, filtering, duplicate identity and FRP/coverage aggregation are shared across Node, map and calendar. The earlier raw-map-versus-deduplicated-calendar difference is superseded: both frontend consumers now use the same exact-row duplicate policy, while the backward-compatible GeoJSON API retains raw valid fixture rows for audit. No calendar styling or interaction redesign was made. Historical coverage remains unavailable; no missing date becomes a verified zero.
