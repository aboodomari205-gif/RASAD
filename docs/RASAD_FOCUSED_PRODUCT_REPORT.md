# Final focused product correction — 15 November 2026

This is the current product acceptance report. Older five-section/intro workflows and reports are retained as history, not current navigation. The original NASA archives, indexed database, model parameters, derived model samples and checkpoints were preserved. No model retraining occurred in this correction.

## Routes and judge journey

- Default `/` immediately opens **`/#harmonization-lab`**. No Earth scene, entry click, cinematic transition or hidden workspace.
- **`/#burning-calendar`** retains real daily history, source-aware monthly comparisons, conditional prior same-month references and a selectable historical seasonal fingerprint.
- **`/#ai-research-lab`** is a dedicated sidebar destination, not an embedded panel in unrelated pages.
- **`/#evidence-methods`** explains proof, limitations, native sensor semantics, provenance and exact missing calibration inputs.

The home states the scientific problem and OBSERVE → HARMONIZE → COMPARE & EXPLAIN. Side-by-side actual MODIS (~1 km nominal) and VIIRS (~375 m nominal) coordinates share one date window and one named WGS84 pilot. A same-day August 24 shortcut and the full August 2024 worked example both query original data. Original points are not replaced by H3 centers.

## Actual interactive harmonization

`GET /api/research/harmonization` runs a bounded original-record worker query for Brazil/Mato Grosso. Inputs: `from`, `to` (at most 31 days), `support=h3|equal-area`, H3 resolution 4–8 or equal-area sizes 1000/2000/5000 metres. At most 100,000 actual pilot records are admitted. Default August query: **6,876 detections**, **711 MODIS**, **6,165 VIIRS**, **152 H3 resolution-6 occupied cells**, **988 exact source-positive cell-days**.

The endpoint returns full source-specific counts and original source/platform/product/processing/UTC/FRP, bounded actual-position previews (600 per instrument), native confidence, common cell boundaries/real areas, source counts, same-day occupancy, exact source-pair comparisons and paired rows. The map cell preview is capped at 2,000 cells with an explicit flag. Counts, pair statistics and complete cell-day CSV/JSON use the full bounded query, not preview totals. User can select an original point for actual confidence, acquisition, FRP, source filename/member/hash.

The common-support switch shows MODIS-only, VIIRS-only or the source-aware union. Gold means both instruments delivered detections in the cell on at least one shared UTC day; purple means both appear during the window but only on different days. No simultaneous-acquisition or common-event inference is made.

The full-month H3 source-pair statistics are **computed from original rows**, not UI constants. Tests reconcile them exactly to the independently saved research artifact:

| Pair | Co-detected cell-days | MODIS-only delivered | VIIRS-only delivered | Delivered Jaccard |
|---|---:|---:|---:|---:|
| Aqua / NOAA-20 | 131 | 23 | 223 | 0.347480 |
| Aqua / NOAA-21 | 131 | 23 | 243 | 0.329975 |
| Terra / NOAA-20 | 94 | 12 | 260 | 0.256831 |
| Terra / NOAA-21 | 96 | 10 | 278 | 0.250000 |

Equal-area tests conserve original count totals and declared 5 km cell areas (25 km²). H3 is explicitly variable-area, not equivalent to a native sensor footprint. Source-only delivery is unknown counterpart opportunity, not a false negative or sensor error. NOAA-20/21 Standard lineage remains explicitly unresolved.

## Dedicated AI Research Lab

Existing actual `models/brazil-frp-model.json`, evaluation and `/api/research/prototype` remain the only model source. The very first visible warning states: **Experimental ML; not validated MODIS–VIIRS calibration, downscaling, reconstruction or wildfire prediction.**

The page shows 6,876 original detections, 988 actual groups, 282 training groups; 60 depth-3 gradient-boosting trees; input features; real temporal/spatial/joint baseline versus ML MAE/RMSE/bias; an actual held-out selector; separate observed and estimated mean FRP; limitations, uncertainty and missing calibration inputs. Worse temporal performance and worse joint RMSE are prominent. No fabricated accuracy or retrospective AI hotspot maps.

The existing target remains **mean reported FRP conditional on a source-positive H3 cell-day**, not sensor calibration. No negatives are created from missing hotspot records. Actual JSON download and research PDF rendering were verified.

## Visible removals

The old cinematic Earth entry, generic risk/dispatch/evacuation/environmental dashboards, Activity Intelligence/Evidence Engine subnavigation, redundant Season Clock/Fire DNA destinations and old broad analytical workspace are unmounted from the active product. Their source files and tests remain preserved. Only four public navigation destinations remain. Seasonal patterns are available inside Burning Calendar rather than as a redundant page. Brazil remains the sole active region.

## Verification and real artifacts

- `npm test`: **164 passed, 0 failed, 0 skipped** on the actual-data machine.
- `npm run build`: passed; the focused client compiles 71 modules and excludes the unused Three/Earth/MapLibre interactive scene from the entry graph. Original modules/assets remain in source. No Vite large-chunk warning on this build.
- `node scripts/verify-release.mjs`: passed focused product assets, dedicated research bundle, no cinematic entry and server configuration separation. The old required MapLibre-worker check was replaced because that map renderer is no longer mounted in this product.
- `npm run lint`: exit 0 with 10 retained warnings in old modules/harnesses; no clean-warning claim.
- `RASAD_TEST_ORIGIN=http://localhost:4192 node scripts/verify-focused-product.mjs` (also `npm run test:e2e`): passed default home, four sections, original source-point inspection, source switching, actual same-day comparison, 5 km equal-area support, source-pair artifact reconciliation, linked calendar/month/seasonal history, dedicated model route/selector, actual JSON/CSV downloads, research and harmonization PDFs, mobile/desktop LTR/RTL and route refresh. Runtime exceptions: **0**.

Current browser proof and full-size captures: `.checkpoints/rasad-focused/`. Vetted screenshots are included in `docs/screenshots/`: `harmonization-home.png`, `sensor-comparison.png`, `equal-area-comparison.png`, `calendar-linked.png`, `ai-research-lab.png`, `harmonization-arabic-mobile.png`. These are actual rendered localhost captures, not mockups.

Separate seven-slide demo: **`artifacts/RASAD_NASA_DEMO_7_SLIDES.pdf`**, verified **7 pages**, **770,230 bytes**. Self-contained HTML is alongside it. Slides use the real checked model/source-pair evidence and verified screenshots, and explicitly show mixed ML results and unvalidated capabilities. Rebuild HTML with `npm run demo:build`, then render/verify PDF with `npm run demo:pdf` (Windows Chrome required).

## Scientific acceptance

**Proved software/evidence:** real Brazil ingestion/indexing, source-aware H3/equal-area aggregation, delivered overlap, authentic calendar and seasonal comparisons, real exploratory conditional-FRP model and held-out evaluations.

**Not proved:** sensor sensitivity calibration, true-negative opportunity, physical fire spread, AI downscaling or VIIRS-like pre-2012 reconstruction. Conditional descriptive references are not exposure-normalized anomalies. VIIRS is not ground truth. Missing cloud/valid-pixel masks, geolocation/opportunity and independent validation remain exact scientific blockers, not hidden empty cards.

## Delivery

The current repository remains https://github.com/aboodomari205-gif/RASAD, `main`. Final source/screenshots/seven-slide artifact will be committed and pushed after staged-file review; final response records the actual commit/push result. No public application hosting or NASA submission is performed by this task. Full native maps/history require the local ignored index or a durable API; small model artifacts do not fabricate an archive. The seven-slide PDF itself has no remaining generation blocker.

## Changed source

`src/App.tsx`, `src/state/mission.ts`, `src/components/MissionUI.tsx`, `src/intelligence/HarmonizationLab.tsx`, `src/design/focused-lab.css`, `src/calendar/BurningCalendar.tsx`, `src/i18n/south-america-ar.ts`, `src/intelligence/printEvidence.ts`; `shared/harmonizationLab.js`, `server/southAmerica.js`, `server/southAmericaWorker.js`; `tests/harmonizationLab.test.ts`, `tests/rasad.test.ts`; focused/browser/demo/release scripts, package scripts, manifest, README and current documentation/screenshots/demo artifacts. The trained `models/` files have no diff.
