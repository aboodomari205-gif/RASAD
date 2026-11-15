# RASAD implementation — Batch 1

## Exact files changed

- `src/App.tsx`
- `src/components/MissionUI.tsx`
- `src/components/RasadBrand.tsx`
- `src/components/AtlasTimeline.tsx`
- `src/components/AtlasInspector.tsx`
- `src/components/EarthLanding.tsx`
- `src/components/SensorTrustLens.tsx`
- `src/calendar/BurningCalendar.tsx`
- `src/intelligence/IntelligenceWorkspace.tsx`
- `src/design/atlas-tokens.css`
- `src/design/rasad-workspace.css`
- `src/i18n/south-america-ar.ts`
- `scripts/verify-south-america-browser.mjs`
- `scripts/verify-rasad-batch1-browser.mjs`
- `docs/RASAD_BATCH1_REPORT.md`

## Screenshot paths

All images were captured from the actual localhost React app, with real active NASA observations. BEFORE captures precede this batch's code changes. AFTER captures cover all five sections at 1440×1000 and 390×844, plus Arabic desktop, Arabic drawer and 320×740. Supplemental desktop captures show the complete calendar and spatial grid.

- `.checkpoints/rasad-batch1/screenshots/after-activity-intelligence-desktop.png`
- `.checkpoints/rasad-batch1/screenshots/after-activity-intelligence-mobile.png`
- `.checkpoints/rasad-batch1/screenshots/after-arabic-mobile-320.png`
- `.checkpoints/rasad-batch1/screenshots/after-arabic-mobile-navigation.png`
- `.checkpoints/rasad-batch1/screenshots/after-burning-calendar-desktop.png`
- `.checkpoints/rasad-batch1/screenshots/after-burning-calendar-grid-desktop.png`
- `.checkpoints/rasad-batch1/screenshots/after-burning-calendar-mobile.png`
- `.checkpoints/rasad-batch1/screenshots/after-mission-atlas-arabic-desktop.png`
- `.checkpoints/rasad-batch1/screenshots/after-mission-atlas-desktop.png`
- `.checkpoints/rasad-batch1/screenshots/after-mission-atlas-mobile.png`
- `.checkpoints/rasad-batch1/screenshots/after-research-export-desktop.png`
- `.checkpoints/rasad-batch1/screenshots/after-research-export-mobile.png`
- `.checkpoints/rasad-batch1/screenshots/after-sensor-harmonization-desktop.png`
- `.checkpoints/rasad-batch1/screenshots/after-sensor-harmonization-grid-desktop.png`
- `.checkpoints/rasad-batch1/screenshots/after-sensor-harmonization-mobile.png`
- `.checkpoints/rasad-batch1/screenshots/before-burning-calendar-desktop.png`
- `.checkpoints/rasad-batch1/screenshots/before-mission-atlas-desktop.png`
- `.checkpoints/rasad-batch1/screenshots/before-mobile.png`

## Actual visible changes

- Persistent full-label desktop sidebar replaces the hidden index. English navigation is on the left and Arabic on the right; all five sections have active-state indicators and descriptive labels.
- Labeled mobile navigation exposes the same sections in a modal drawer, with keyboard focus handling, Escape dismissal, focus return and a visible current-section label.
- The actual supplied `public/brand/rasad-source.jpeg` is integrated without changing the original file. The full symbol and lettering remain visible; only exterior white space is outside the sidebar frame. No replacement logo was generated.
- Coordinated deep navy/forest green tokens, redesigned page headers, filter wells, cards, tables and source notices. Map tools, ledger and timeline have measured spacing; the ledger pagination no longer overlaps observations.
- UTC date input plus previous/next delivered-date and latest-date controls. The active date scrolls into the timeline viewport. Existing playback, year navigation, source identities and uncertainty remain intact.
- Calendar source values are larger, source separated and compactly formatted, with exact values available in inspection/exports. Missing dates retain Unknown semantics.
- The expanded Sensor Trust Lens and equal-area grid live in Sensor Harmonization. Calendar content is no longer preceded by a duplicate Lens. Activity Intelligence surfaces full-history conditional references and suppresses the misleading legacy bounded-page insufficient-history card. Research methodology precedes supplementary evidence details.

## Test results

- Production build: PASS. Existing large map/3D chunk warning remains.
- Unit/integration suite: 152 passed, 0 failed, 0 skipped.
- New real Chrome workflow: PASS all five sections, logo loading, persistent sidebar placement in LTR/RTL, desktop/mobile screenshots, drawer dismissal/focus return, live UTC/previous/next/latest date controls, real platform filtering, calendar detail and grid-size switching.
- Updated existing real Chrome regression: PASS intro, continent/Brazil, source metadata, filters, playback/map controls, calendar, RTL/mobile, grid modes/sensitivity, real JSON/SVG downloads, historical conditional references, seasonal heatmap and drill-down.
- Production bundle audit: PASS, zero retired Jordan/Ajloun study labels or visible FIREPULSE branding.
- Data preservation: PASS. Generation `86f1f872f7366fe4`, 48,552,057 accepted observations. Active pointer, SQLite size/modified time and original archive sizes/modified times are unchanged. Historical ingestion was not rerun. Existing checkpoint `checkpoint-rasad-20261115` and `.checkpoints/rasad/source-backup.zip` verified; batch source backup is `.checkpoints/rasad-batch1/source/`.
- No deployment or cloud-resource changes.

## Remaining blockers

No blocking Batch 1 UI failures were found in the tested workflows. Scientific calibration remains NOT VALIDATED because the required observation-opportunity and independent validation inputs are absent; that prior limitation is unchanged. Large map/3D chunks remain a build warning. Browser coverage is representative rather than an exhaustive accessibility or device certification.
