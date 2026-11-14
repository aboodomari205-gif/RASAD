# Exploration panel / historical timeline overlap fix

Local verification date: 2026-11-13. Actual browser origin: **http://localhost:5173**. No data import, observation/algorithm/region/year-selector changes, deployment or Git push.

## Exact reproduced cause

The correct panel is the existing `RegionExplorer` details popover, manually opened from the mission header (Arabic title: Explore Earth / Understand the Data). Its original opening behavior was not a defect and remains unchanged.

Before the fix, desktop `.region-explorer-panel` had no height constraint and `overflow:visible`. Mobile used `max-height:calc(100dvh - 140px)` and `top:120px`, accounting for the viewport/header but **not the actual historical timeline or footer**. The timeline retained its own stacking context, so the lower panel content was drawn underneath it. Raising panel z-index would merely obscure the timeline.

Actual manually opened Arabic DOM measurements:

| Viewport | Panel bottom | Timeline top | Overlap |
|---|---:|---:|---:|
| 1366×768 | 637.91px | 608.41px | 29.50px |
| 1440×900 | 637.91px | 740.41px | none at this size |
| 1920×1080 | 637.91px | 920.41px | none at this size |
| 390×844 | 671.83px | 661.20px | 10.63px |
| 320×740 | 691.63px | 557.20px | 134.42px |

Evidence: `.checkpoints/exploration-before.log`. Initial reproduction used the default Ajloun selection; acceptance tests used Northern Jordan, which adds a longer governorate explanation. These measurements explain why the bug depends on language and viewport height.

## Focused implementation

- Reuse the Atlas layout's existing measured CSS custom properties for actual header, timeline and footer heights, plus the design-system gap. Panel maximum height subtracts those reservations from `100dvh`; it no longer assumes only 140px of unavailable screen space.
- Keep the existing desktop anchor. Mobile top placement follows the measured header height. Existing panel stacking order is unchanged; the timeline is never covered or hidden.
- Use a flex column with a non-scrolling header and an independently scrollable `.region-explorer-content` body (`min-height:0`, vertical overflow, overscroll containment, stable scrollbar gutter).
- All existing camera buttons, region selector, coverage explanations and navigation remain in the body, in their original order with original handlers.
- Add a visible close button to the fixed header, using the exact same existing `close()` function as camera/region actions and Escape. It returns focus to the original summary.
- Preserve the native details/summary trigger and Escape handling. No automatic onboarding/opening behavior was disabled or changed.
- Add English/Arabic accessible labels for the close control and scrollable options region.

## Real-browser regression

`node scripts/verify-exploration-panel.mjs` runs against the existing development server on localhost:5173. It physically clicks the original summary, rather than forcing `.open=true` for acceptance.

For **both English and Arabic** at **1366×768, 1440×900, 1920×1080, 390×844 and 320×740**, it asserts:

1. Panel bottom is above the timeline top; panel top is below the mission header.
2. Panel stays within horizontal viewport bounds and causes no page overflow.
3. After scrolling the inner body to its end, the final region selector is fully visible within the body and above the timeline.
4. Header coordinates do not change when the body scrolls; the close button remains reachable by a real pointer hit.
5. The final selector accepts focus and the close button closes normally.
6. The final camera action is physically clickable after scrolling and closes normally, without changing observation scope.
7. The existing region action still closes the panel and loads Ajloun's real 2026 observations.
8. The timeline's year selector remains an unobscured hit target while the panel is open.

Recorded Arabic post-fix panel bottom / timeline top: approximately **564.1 / 598.4px** at 1366×768, and **519.2 / 557.2px** at 320×740. Larger viewports use their natural content height; scrolling is enabled only when needed.

Evidence:

- `.checkpoints/exploration-rectangles.json`
- `.checkpoints/exploration-browser.log` and final `.checkpoints/exploration-panel.log`
- `.checkpoints/exploration-en-1366.png`, `exploration-en-1440.png`, `exploration-en-1920.png`, `exploration-en-390.png`, `exploration-en-320.png`
- `.checkpoints/exploration-ar-1366.png`, `exploration-ar-1440.png`, `exploration-ar-1920.png`, `exploration-ar-390.png`, `exploration-ar-320.png`

The actual Arabic 320px screenshot was visually inspected: header and close control remain visible, the last camera option and full region selector are reachable, scientific explanations remain available, and the timeline is fully separated.

## Exact files changed

- `src/components/RegionExplorer.tsx` — fixed header/close control and scrollable body wrapper; original trigger/actions preserved.
- `src/components/regionExplorer.css` — measured responsive height reservation and internal scrolling.
- `src/i18n/evidence-ar.ts` — two accessibility translations.
- `scripts/verify-exploration-panel.mjs` — new actual-browser regression.
- `docs/EXPLORATION_PANEL_TIMELINE_FIX.md` — this report.

Initial component/style copies are under `.checkpoints/exploration-before/`. No dependencies were installed. NASA observations, scientific algorithms, administrative boundaries and Atlas year-selector implementation were not edited.

## Local reproduction

With the existing integrated development server running, open **http://localhost:5173/#mission-atlas**, enter the mission, switch to Arabic and manually open Region Explorer. At 320×740, scroll its body to the last option; header/close must stay visible, with the timeline independently usable below.

```powershell
Set-Location 'C:\Users\abood\Desktop\firepulse'
npm run dev -- --host 127.0.0.1 --port 5173 --strictPort
# In another terminal:
node scripts/verify-exploration-panel.mjs
```

Browser testing uses local Chrome with emulated viewport sizes, not physical-device testing. External map tiles still require connectivity. Existing large MapLibre/Three build warnings remain. This fix makes no new scientific claims or public-deployment claim.

## Final executed test results

| Command | Result |
|---|---|
| `npm run build` | PASS |
| `npm run lint` | PASS |
| `npm test` | PASS ? 105 tests; zero failures/skips |
| `npm run test:e2e` | PASS |
| `npm run test:language` | PASS |
| `node scripts/verify-atlas-layout.mjs` | PASS |
| `node scripts/verify-exploration-panel.mjs` | PASS |
| `node scripts/verify-historical-explorer.mjs` | PASS |
| `npm run verify:release` | PASS |

All nine exit codes were 0. Exact results: `.checkpoints/exploration-acceptance.json`; logs: `.checkpoints/exploration-<name>.log`. Lint completed without warnings. Build retained only the existing large-chunk warning. The final actual-browser suites include source handoff, year/region/style switching and observation-pane layout regression checks. No failures remain in the final run.
