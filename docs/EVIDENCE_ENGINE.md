# Evidence Engine and regional exploration

Implemented 12 November 2026. This extends the existing canonical observation model, source-separated calendar and sensor summaries; it does not replace Mission Atlas, the cinematic Earth landing, FIRMS routes or the MapLibre worker. Initial audit found Sensor Intelligence (UTC alignment) but no spatial-temporal association or Evidence Engine implementation. Source checkpoint: `.checkpoints/evidence-20261112/` (explicit TS/TSX/CSS only). No additional dependencies.

## Workflow

Open `http://localhost:5173`, enter the mission, then **Index > Evidence Engine**, or follow **Explore cross-sensor evidence** in Sensor Intelligence. Shared region/date/sensor/confidence/FRP filters apply. Select both sensors for associations.

- **Evidence Verdict:** delivered non-fixture observations support descriptive findings. Associations are provisional; coverage evidence is insufficient; confirmed events and calibrated anomaly scores are unavailable.
- **Cross-Sensor Evidence:** adjustable distance (greater than 0 through 10 km) and time (0 through 1440 minutes). Defaults 1 km/60 minutes are exploratory user settings, not a NASA-recommended calibration. All qualifying many-to-many pairs retain both canonical observation IDs, exact UTC difference and distance. Expand either record and inspect that exact observation in Atlas.
- **Historical Comparison:** choose two inclusive UTC periods within the shared observation scope. Source, sensor, platform, product, processing and raw version remain separated. Missing periods have null counts/unknown coverage, not verified zero. Overlap is disclosed. Counts/FRP are descriptive; no normalized delta or anomaly is computed.
- **Thermal Fingerprint:** fixed 0.02-degree coordinate bins, separated by provenance; lists actual acquisition dates and source IDs. These bins are neither equal-area density, fire perimeters, geolocation accuracy nor recurrence estimates. Complete bin results are exported.
- **Scientific Brief:** downloadable/copyable text with verdicts, thresholds, source-separated counts/FRP and historical period summaries. Downloadable JSON includes methodology, scope IDs, pairs, unmatched/excluded IDs, fingerprint, period trace IDs, complete canonical source observations and dataset metadata. Raw NASA fields retain their original values/language.

Fixture observations are excluded from scientific matching, historical comparison and fingerprint generation. Their availability remains visibly labeled. Day-only acquisitions and unknown sensors are excluded from matching. Exact duplicate IDs with identical canonical contents are counted once; conflicting duplicate IDs fail rather than silently overwrite. Different observation IDs are not merged into unique events. Pair search is UTC-sorted and bounded at 2 million comparisons/10,000 pairs; oversized scopes require narrowing. UI traces are limited to 100 records per disclosure and first 100 pairs; exports preserve full computed results.

## Actual available evidence

The activated Ajloun API provides **5 MODIS and 31 VIIRS** detections inside the unchanged polygon, covering actual observation dates **2020-08-02 to 2025-10-18**. At 1 km/60 minutes, the real dataset produces **5 candidate pairs involving 6 distinct detections**, with 30 unmatched detections and no exact-time exclusions. All five time differences are 7 minutes; distances are approximately 0.595, 0.995, 0.708, 0.822 and 0.765 km. This is one-to-many proximity, **not five independently confirmed fires**. Reducing the radius to 0.1 km produces no candidate pairs. This is software execution evidence, not independent scientific validation.

Underlying delivered CSV semantics and unresolved version/temperature interpretations are documented in [NASA_PRODUCT_VERIFICATION.md](NASA_PRODUCT_VERIFICATION.md). Import commands, checksums, counts and original API checks are in [REAL_DATA_ACTIVATION.md](REAL_DATA_ACTIVATION.md). Missing valid-pixel/overpass/cloud coverage remains unknown. FRP sums are MW of reported pixels, not energy or severity. Raw confidence schemes are unchanged. No universal count conversion, cross-sensor probability or validated baseline is introduced.

## Geographic architecture

The header's Region Explorer separates **camera destination** from **observation region**. Global Earth, North Jordan and Ajloun camera presets use cancellable MapLibre camera movement with reduced-motion support; they do not request or invent global detections. A persistent exploration notice clarifies the regional data extent. The data selector explicitly distinguishes Ajloun archive and Brazil development fixture. Original cinematic Earth entry remains intact.

The API/canonical model continue to use explicit registered `regionId`, dataset identity and polygon validation. Adding another real region requires registering its region identifier in the model/API whitelist, adding its boundary and dataset descriptor/import scope, and supplying its actual catalog; the evidence algorithms work by region/provenance and need no matching/calibration rewrite. Global camera access is not a claim that global data/storage ingestion is already implemented. A persistent service/volume is still required for deployed archive storage; local SQLite activation does not upload data to Vercel.

## Verification performed

- `npm test`: **72/72 passed**, including backend ingestion/API tests and four new evidence cases (UTC midnight/inclusive bounds, same-day non-simultaneity, spatial/dateline boundaries, many-to-many and duplicates, missing times, fixture/region/processing separation, original confidence, FRP null vs zero, unknown periods, trace IDs and verdict limitations).
- `npm run build`: passed including TypeScript; existing Three.js/MapLibre chunk-size warnings remain.
- `npm run lint`: passed without new warnings.
- `node scripts/verify-real-archives.mjs`: passed in actual headless Chrome against local real archives. Verified direct point clicks, inspector details, counts/date/sensor/reset, fixture isolation, existing modules, basemap restoration, five real pairs, threshold changes, raw source trace, JSON export, exact-observation drill-through, Arabic/English, mobile overflow, camera destinations/data isolation, and no uncaught exceptions.
- `npm run test:filters`: passed existing browser regressions, including FRP validation, network failure/retry, UTC-range/calendar synchronization, history navigation, seasonal drill-through and recoverable oversized scopes. The test now checks the actual pilot count rather than assuming Ajloun is empty. A date selection now also synchronizes Calendar's visible month.
- Screenshots captured and visually inspected: desktop Evidence Engine, Arabic mobile, desktop/mobile Atlas. Existing editorial typography, restrained coral/cyan identity, spacing and responsive hierarchy remain coherent. No visual redesign of the landing was performed.

Manual replay: open Evidence Engine with all sensors and cleared filters; inspect 5 pairs; set radius 0.1; restore 1; compare 2020 and 2025; expand source records; download text/JSON; inspect a source on the map. Open Region Explorer, fly to Earth then North Jordan then Ajloun, and confirm the regional scope warning. Repeat in Arabic and a narrow viewport. Keyboard: Tab/Enter opens explorer and native disclosures, Escape closes explorer, native inputs/buttons retain visible focus. Reduced motion shortens camera transitions; no per-frame React state or new WebGL context is added.

## Files changed for this extension

- Added `shared/evidence.ts`, `tests/evidence.test.ts`.
- Added `src/intelligence/EvidenceEngine.tsx`, `src/intelligence/evidence.css`; integrated in `src/intelligence/IntelligenceWorkspace.tsx` and `src/state/mission.ts`.
- Added `src/components/RegionExplorer.tsx`, `src/components/regionExplorer.css`; integrated into `src/FireMap.tsx` without changing the worker setup. Added optional observation-ID drill-through in `src/calendar/aggregation.ts`.
- Updated `src/state/MissionContext.tsx` for explicit-date/calendar-month synchronization and `scripts/verify-filters.mjs` for archive-aware assertions.
- Updated `src/components/MissionUI.tsx` to derive the navigation count.
- Added `src/i18n/evidence-ar.ts`; included its dictionary in `src/i18n/translate.ts`.
- Extended `scripts/verify-real-archives.mjs`; added this documentation.

No backend routes, dataset bytes, secret files, or dependency versions changed in this extension. Existing user edits to Atlas styles were preserved.
