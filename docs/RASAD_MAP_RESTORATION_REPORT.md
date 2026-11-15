# Emergency interactive-map restoration

Default route remains `/#harmonization-lab`, now with the **actual original MapLibre FireMap as the first primary panel**, above the detailed introduction/comparison. Explicit desktop/mobile height prevents ancestor collapse. Actual Esri imagery and original NASA points, existing selection/provenance, source filters, basemaps, navigation controls, date/year controls, timeline and playback are retained.

`MapHarmonization.tsx` wraps the original component contract and adds real common-support layers to the same MapLibre instance, not a replacement static map. Before/native and after/H3 or equal-area modes toggle actual layers. H3 resolutions 4–8 and 1/2/5 km equal-area cells come from the existing bounded harmonization API. Cells are source-specific; same-day shared cells are not calibrated sensor equivalence. Raw native points remain original positions. Pilot bbox filtering is applied on the backend before evidence pagination and retained through the existing client filter contract. Full-query counts and paginated native-point totals are explicitly distinguished.

The first explicit pilot is 2024-08-24: **141 actual observations**, 16 MODIS and 125 VIIRS. The full August source-pair worked example remains available through detailed comparison and the AI lab's checked-artifact overlap table. Existing historical data, trained model artifacts, original source files and checkpoints remain unchanged.

AI Lab's primary workflow is OBSERVE → ALIGN → COMPARE → LEARN → VALIDATE, with actual checked source-pair evidence and a link to before/after on the interactive map. Native masks, matched opportunity, cloud/valid-pixel QA, geolocation and independent holdouts form a clearly marked future **DATA-BLOCKED** calibration pipeline. The actual conditional-FRP model is a secondary expandable experiment, retaining its real held-out metrics and example inference. No sensor-adjusted or reconstructed hotspot outputs are invented.

## Exact changed implementation

- `src/App.tsx`: mount the map wrapper as default first panel; detailed comparison below; primary calibration roadmap and secondary FRP; calendar/map date handoff.
- `src/FireMap.tsx`: optional actual MapLibre instance callback; retain original component and include bbox in evidence refresh dependencies.
- `src/intelligence/MapHarmonization.tsx`: actual map-layer control, pilot, source counts, before/after, H3/equal-area polygons, cell popup, source/date filters and honest overlap.
- `src/design/restored-map.css`: explicit non-collapsing map dimensions; mobile map area.
- `src/intelligence/CalibrationRoadmap.tsx`, `ObservedSensorPairs.tsx`: primary challenge workflow and actual source-pair comparison without presenting FRP as calibration.
- `src/data/observations.ts`, `server/southAmerica.js`: validated real bbox filtering before native map pagination.
- `src/i18n/south-america-ar.ts`: preserve and translate additional workspace labels found during final tests.
- `scripts/verify-restored-map.mjs`, package e2e command, release check and bbox/source integration tests.
- README/current evidence, real restored screenshots, separate updated seven-slide PDF and `SUBMISSION_READY.md`.

## Actual browser proof

The production server on **4190 was stopped and restarted** to load the current backend/build. `scripts/verify-restored-map.mjs` verifies HTTP-200 imagery tile responses, visible rendered native NASA features inside the pilot bbox, MODIS/VIIRS source-data changes, actual rendered H3 polygons and 25 km² equal-area cells, a changing playback date, calendar, AI roadmap plus actual FRP metrics, and populated mobile RTL map rendering. Runtime exceptions: zero in the passed run. Evidence: `.checkpoints/rasad-map-restored/browser-proof.json` and actual screenshots. No component-mount-only success claim.

Verified restored screenshots: `docs/screenshots/restored-map.png`, `restored-h3.png`, `restored-map-mobile-ar.png`. No model was retrained and no external dataset was downloaded.

Final acceptance: **165 tests passed, 0 failures, 0 skipped**; production build and release checks passed, including the restored MapLibre worker. A large MapLibre bundle warning remains. The restored-map browser workflow passed against the freshly restarted current production server on port 4190, including an actual changing playback date and rendered native points on mobile. The updated real-map demo PDF was verified as **7 pages, 2,784,853 bytes** and copied to `submission/RASAD_NASA_DEMO_7_SLIDES.pdf`. The source HTML uses real map screenshots; rendering uses a local file URL because a large screenshot-based data URL exceeded the browser navigation limit. No stale prior PDF is presented as the restored-map deck.

## Delivery distinction

The final requested FIREPULSE remote was checked outside the sandbox and returned **Repository not found**. The earlier RASAD public repository remains intact. Do not report a successful final correction push to FIREPULSE. Source is prepared on the delivery branch and the existing staged-file audit excludes private/raw archives, credentials, dependencies and checkpoints. The user must make the intended destination accessible or explicitly choose the existing RASAD destination for the final correction.

The separate real seven-slide PDF is provided under `submission/`; it requires a **public shareable demo URL distinct from the GitHub project URL**. `SUBMISSION_READY.md` contains the exact project text, AI disclosure, data provenance, references and two separate link placeholders. No NASA portal submission or public application hosting was performed.
