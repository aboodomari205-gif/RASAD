# Mission Atlas layout refinement and intro cleanup

Verified locally: 2026-11-13. No deployment, publication, Git push, data import or changes to original NASA observations.

## Reproduced root cause

Actual Chrome measurements on **http://localhost:5173**, with Arabic enabled, showed the expanded historical timeline and inspector using inconsistent independent bottom offsets:

| Viewport | Inspector bottom | Timeline top | Defect |
|---|---:|---:|---|
| 1366×768 | 598px | 586px | 12px overlap; the higher-stacked timeline covered the panel |
| 1440×900 | 718px | 718px | No separation or allowance for content growth |
| 1920×1080 | 898px | 898px | No separation or allowance for content growth |
| 320×740 | Tool rail bottom 565px | Timeline top 516px | 49px vertical collision with the rail |

The previous year-selector sprint increased timeline height to 144px desktop / 176px mobile while inspector and map-tool offsets still assumed the earlier, shorter layout. RTL changed text metrics and wrapping. Independently positioned attribution/scale controls also intruded into the mobile timeline/style-switcher space.

Original measurements: `.checkpoints/layout-before-rects.log`.

## Implemented layout

- The existing timeline remains one temporal instrument, including manifest-derived year selector, previous/next available year, actual date labels, All Dates, native range input and the existing honestly disabled playback control. No dates or playback were invented.
- Reduced timeline padding, gaps and duplicate labels. It now sizes to its contents rather than a fixed expanded height. Typical observed desktop height is approximately 125–132px, mobile 129–135px, compared with 144/176px before.
- A small `ResizeObserver` measures the real header, timeline and basemap-control heights into CSS custom properties. Inspector bounds and control reservations use those measurements; no per-frame React state updates or map recreation.
- Inspector uses an explicit grid: header, source provenance, count summary, `minmax(0,1fr)` scroll body, and scientific footer. Its top/bottom fit the available map viewport. Header/footer remain accessible while observations scroll internally.
- Responsive inspector/control placement reserves the timeline, footer, basemap switcher and an information gutter. The fix does not increase z-index or cover the timeline.
- Desktop editorial region heading is offset clear of the raised tool rail; small-screen inspector-open mode removes the duplicate large title.
- Tool rail has a viewport-derived maximum height and its own overflow if needed. Scale and attribution occupy the reserved gutter above the timeline. The redundant mobile boundary legend is omitted; region identity, actual polygon, source provenance and scientific caveats remain in header/ledger/footer.
- On narrow screens, the oversized editorial region title and view-coordinate caption are hidden while the inspector is open. The selected region remains visible in the mission header and ledger; closing the inspector restores the map composition.
- Preserved both region geometries, observations, source metadata, MapLibre worker/style setup, camera behavior, year/date state and scientific interpretation.
- Fixed an observed selection race: when a same-year request finishes after a user opens an observation, the popup/highlight is retained if its immutable ID still belongs to the filtered collection. Incompatible region/date/sensor scopes still clear it. The existing historical browser popup assertion exposed this race; its exact timeout and successful recheck are recorded in the local logs.

## Intro cleanup

Removed the active cinematic landing header's **Skip Intro / Enter Directly** button, its dedicated CSS, translation and direct-entry Escape handler. The existing primary **Enter Mission / ابدأ المهمة** CTA is the single mission-entry action and now receives initial keyboard focus. Its original camera-push sequence, reduced-motion path, loading/error behavior and Earth interaction remain unchanged.

Browser helpers now enter using the real primary CTA instead of the removed shortcut. Assertions for observations, exports and science were retained. The new layout test asserts the shortcut is absent while the intro is still mounted and exactly one primary entry CTA exists.

## Browser acceptance

`node scripts/verify-atlas-layout.mjs` uses the actual development origin, **not a replacement static test page**. It measures DOM rectangles in both languages at:

- 1366×768
- 1440×900
- 1920×1080
- 390×844
- 320×740

Assertions cover pairwise non-overlap of mission header, inspector, timeline, tool rail, basemap switcher, footer, scale and attribution. They also verify a visible inspector footer, positive usable scroll-body height, no horizontal page overflow, close/reopen and the original retained MapLibre canvas. The North 2026 list is expanded with its real Show Next control until all **803** loaded observations are present; the final observation is scrolled fully into the body's visible bounds.

Additional real-browser suites check year/region round-trips, 2006/2021/2023/2026, Arabic/English physical basemap clicks, popup and source-ID preservation, Calendar, Evidence Engine, Research Brief, CSV and reduced motion. The actual development-browser suite verifies North **2021-07-01 = 3 observations**, then restores **2026 = 803**. Full delivered manifests remain **Ajloun 143 / Northern Jordan 6859**, with standard/NRT separation and unknown acquisition coverage unchanged.

Evidence:

- `.checkpoints/layout-rectangles.json` — all ten viewport/language measurements and empty overlap lists.
- `.checkpoints/layout-en-1366.png`, `layout-en-1440.png`, `layout-en-1920.png`, `layout-en-390.png`, `layout-en-320.png`.
- `.checkpoints/layout-ar-1366.png`, `layout-ar-1440.png`, `layout-ar-1920.png`, `layout-ar-390.png`, `layout-ar-320.png`.
- `.checkpoints/layout-acceptance.json` — exact command exit codes.

Screenshots were visually reviewed for inspector/timeline separation and Arabic mobile readability. Browser resizing automatically dismisses the inspector on mobile as before; tests explicitly reopen it after that responsive transition, rather than testing a closed panel.

## Files changed

- `src/FireMap.tsx` — measured layout reservations.
- `src/design/atlas.css` — compact temporal layout, inspector grid, responsive control and information gutters.
- `src/components/EarthLanding.tsx` — remove redundant action/shortcut, focus primary CTA.
- `src/components/EarthLanding.css` — remove dedicated skip styles.
- `src/i18n/ar.ts` — remove the removed action's translation.
- `src/i18n/language.css` — remove the removed action's RTL rule.
- `scripts/verify-motion.mjs`
- `scripts/verify-language.mjs`
- `scripts/verify-static-archives.mjs`
- `scripts/verify-historical-browser.mjs`
- `scripts/verify-historical-explorer.mjs`
- `scripts/verify-atlas-layout.mjs` (new actual-origin regression).
- `docs/ATLAS_LAYOUT_REFINEMENT.md` (this report).

`AtlasInspector.tsx` record rendering and `AtlasTimeline.tsx` temporal logic were preserved; their layout is fixed through the existing stylesheet. Initial affected-file checkpoints are under `.checkpoints/layout-before/`. No dependencies were installed.

## Limitations and local review

The inherited MapLibre/Three bundle-size warnings remain. External street/satellite tiles still require network access. Testing used local desktop Chrome with emulated mobile widths and software WebGL support, not physical phones. No scientific calibration, complete acquisition coverage or confirmed-fire inference was introduced.

No public deployment was tested. `.checkpoints/layout-static` is a local browser-test build, not a release package or deployment ZIP.

```powershell
Set-Location 'C:\Users\abood\Desktop\firepulse'
npm run dev -- --host 127.0.0.1 --port 5173 --strictPort
```

Open **http://localhost:5173/#mission-atlas**. Use the single primary mission CTA. Open the observation ledger, select Northern Jordan/2026, scroll the list, and switch English/Arabic and Street/Satellite. The year selector and scientific footer must remain accessible. Repeat the automated layout check with:

```powershell
node scripts/verify-atlas-layout.mjs
```

## Final executed results

| Command | Result |
|---|---|
| `npm run build` | PASS |
| `npm run lint` | PASS |
| `npm test` | PASS ? 105 tests, 0 failed/skipped |
| `npm run verify:release` | PASS |
| `npm run test:e2e` | PASS |
| `npm run test:language` | PASS |
| `node scripts/verify-historical-explorer.mjs` | PASS |
| `node scripts/verify-historical-browser.mjs --dev-existing` | PASS |
| `node deployment/cloudflare/build-static.mjs .checkpoints/layout-static` | PASS |
| `node scripts/verify-historical-browser.mjs .checkpoints/layout-static` | PASS |
| `node scripts/verify-atlas-layout.mjs` | PASS |

All final command exit codes were 0. Build retains the pre-existing large-chunk warning; lint has no warnings. Logs: `.checkpoints/layout-<name>.log`. Initial layout-test failures for attribution/scale overlap were fixed by the final reserved information gutter; none remain in the final run. No old assertion was weakened.

Final confirmation: the complete eleven-command sequence was rerun after the desktop-heading and popup-retention fixes; every exit code was 0. `.checkpoints/layout-historical-recheck.log` also records the immediate successful reproduction check for the popup race.
