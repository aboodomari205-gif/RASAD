# Brazil implementation continuation — 2026-11-15

Active scope: **Brazil only**. Original multi-country archives and datasets remain preserved. No public deployment, paid service, external upload or dataset download was performed.

## Four core pillars

| Pillar | Status | Working evidence / remaining limit |
|---|---|---|
| Early detection | PARTIAL | Real Brazil map, UTC/source/confidence/FRP and archived pilot latest acquisition, retrieval timestamp, daily drilldown; live multisensor ingest/notice service not demonstrated. Existing NOAA-20 endpoint requires local FIRMS key. Archive is explicitly labeled. |
| Environmental risk analysis | PARTIAL / INPUT BLOCKED | Non-destructive provenance/QA/units/Brazil point importer; revalidation and AOI/time matching in API; bilingual availability panel. No native rasters, raster extraction runtime or calibrated concern index. |
| Progression | DONE for descriptive detection occupancy | Source-specific daily H3 occupancy, first detected in selected window, repeat against prior observed date, 31-day daily map playback including dates without detections, daily drilldown and CSV. Not a fire perimeter or validated spread model. Burned-area reference unavailable. |
| Response support | DONE for descriptive pilot evidence | Actual bounded-query JSON report, complete source/day CSV, print action, environmental availability, generation, acquisition/retrieval timestamps and uncertainty. No dispatch/evacuation/crew integration. Human emergency guidance unavailable. |

## Scientific components

| Component | Status | Evidence |
|---|---|---|
| MODIS/VIIRS harmonization | DONE descriptive / calibration blocked | Preserved source, platform, processing, nominal footprint and raw confidence semantics; existing equal-area method retained. Detection overlap is not exposure equivalence. |
| Equal-area 1/2/5 km | DONE software | Existing area/geometry tests and real 5 km browser control pass. |
| H3 | DONE software | Resolutions 4–8, actual cell areas, parent IDs, boundary geometry and dates; real API/UI and downloaded report. H3 cells are not equal area or sensor footprints. |
| Burning calendar / seasonal history | DONE descriptive | Existing complete source summaries and calendar, real browser drilldowns. Missing dates remain unknown. |
| Seasonal anomaly | PARTIAL / validation blocked | Existing conditional prior same-month descriptive comparisons retained; no validated exposure-normalized anomaly or risk score. |
| Environmental context | PARTIAL / input blocked | Imported point contract and explicit missing panel; no raster data or independently checked raster extraction. |
| Cross-sensor calibration | NOT VALIDATED | Eligible training samples **0**; paired opportunity/cloud/valid-pixel/geolocation unavailable. NOAA-20/21 Standard lineage unresolved. No MAE, RMSE, bias or held-out metrics. |
| AI downscaling | BLOCKED | No valid matched labels, environmental features or independent validation. No invented estimates. |
| Historical reconstruction | BLOCKED | Requires validated downscaling with uncertainty and extrapolation review. Actual MODIS records retained. |
| Sensor Trust Lens | DONE descriptive | Existing source/lineage/provenance and uncertainty view retained; pilot explicitly reports NOT VALIDATED. |

Proposed calibration validation contract remains: disjoint held-out years plus disjoint geographic blocks, fit preprocessing only on training data, baseline before complex model, report eligible samples and real held-out errors. No split or model was fitted because no valid training samples can be established from hotspot-only files.

## Real inventory and pilot

Read-only indexed daily summaries reconcile **26,419,602 Brazil observations**, generation `86f1f872f7366fe4`. See `RASAD_BRAZIL_INVENTORY.md` and `RASAD_BRAZIL_INVENTORY.json` for exact per-source dates and per-year counts. MODIS Terra starts 2000-11-01, Aqua 2002-07-04; declared NOAA-20 Standard starts 2018-04-01, NOAA-21 Standard 2023-03-01. NRT extends through 2026-11-14. These are delivered observation extents, not acquisition completeness or independently accepted product operational dates.

Pilot polygon: `[[-57,-14],[-55,-14],[-55,-12],[-57,-12],[-57,-14]]`, WGS84, Mato Grosso. Real 2024-08-01–2024-08-31 query: **6,876 observations**, **152 H3 resolution-6 cells**, four delivered source strata, 31 dates with detections, no truncated cell preview. A two-day real-data test confirms MODIS/VIIRS same-cell detection overlap. This choice is justified by existing detections; environmental/reference availability has not been established.

Environment: no local GeoTIFF/HDF/HDF5/NetCDF/GRIB rasters discovered. The current Python lacks numpy, rasterio, GDAL, xarray and h5py. The supplied original logo exists and is already integrated. Native data are unchanged; no 48-million-row re-ingestion was needed.

## Changed implementation files in this continuation

- `src/intelligence/BrazilPilot.tsx`: bilingual pilot workflows, H3/source evidence, playback, daily drilldown, JSON/CSV/print.
- `src/intelligence/IntelligenceWorkspace.tsx`: integrate into Activity Intelligence, Sensor Harmonization and Research & Export without adding a sixth navigation section.
- `shared/pilot.js`: retain actual observed dates on each bounded-preview H3 cell for playback.
- `server/pilot.js`: revalidate environmental manifests and restrict indicators to selected polygon/date overlap.
- `server/southAmerica.js`: reject inactive region parameters even when mode is Brazil; fresh pilot queries do not serve a stale cached environment response.
- `tests/pilot.test.ts`: source-separated progression, missing/zero FRP, geometry rejection, H3 dates/area, real overlap and inactive-region/window rejection.
- `scripts/inventory-brazil.py`: read-only Brazil/year/source inventory.
- `scripts/verify-rasad-batch1-browser.mjs`: configurable local URL/CDP port; new real pilot playback/export/mobile checks.
- `scripts/verify-release.mjs`: Brazil boundary, original branding and sole active region acceptance replace retired Jordan asset requirement.
- Inventory/checklist/status/report documentation. Broad inventory was rerun using the existing read-only script; its totals describe retained inputs, not active Brazil scope.

## Actual verification

- `npm test`: **155 passed, 0 failed**.
- `npm run build`: passed; existing large MapLibre/Three bundle warnings remain.
- `npm run lint`: exit 0, **10 warnings** in pre-existing hooks/ref/browser-harness patterns; no clean-warning claim.
- `python scripts/inventory-brazil.py`: reconciled Brazil-only indexed totals; no raw-row audit claim.
- `node scripts/verify-release.mjs`: passed after replacing obsolete Jordan packaging expectation.
- `RASAD_TEST_ORIGIN=http://localhost:4186 RASAD_CDP_PORT=9587 node scripts/verify-rasad-batch1-browser.mjs`: passed five sections, source/logo, filters, LTR/RTL desktop/mobile, navigation and grid checks.
- Same script with `--pilot`: passed real 6,876/152 reconciliation, daily playback, actual downloaded JSON/CSV and mobile LTR/RTL. Proof: `.checkpoints/rasad-brazil/browser-proof.json`; downloaded artifacts: `.checkpoints/rasad-brazil/downloads/`.
- Real API payload saved to `.checkpoints/rasad-brazil/pilot-real-evidence.json`. JSON/CSV browser downloads reconcile with the API daily totals.

Chrome required execution outside the sandbox; sandboxed attempts timed out and are not counted as passed. The first pilot test used an unsupported section hash and was corrected to click the actual navigation button. Original failure evidence was not presented as success.

Screenshots: `.checkpoints/rasad-batch1/screenshots/brazil-pilot-desktop.png`, `brazil-pilot-progression-desktop.png`, `brazil-pilot-mobile.png`, `brazil-pilot-arabic-mobile.png`; existing `after-*` screenshots cover all five sections. The test captures actual rendered localhost UI.

## Preservation and deployment

Local branch checkpoint `checkpoint-rasad-brazil-continuation-20261115`; **current uncommitted source** backup `.checkpoints/rasad/full-implementation/source-brazil-continuation.zip` (the branch alone does not capture uncommitted work). Earlier checkpoints/archives remain intact.

Built frontend: **23 files, 5,399,332 bytes** uncompressed. Existing indexed database: **4,473,511,936 bytes**; supplied archive files: **884,503,305 bytes**. The database includes retained countries and cannot be described as a compact Brazil-only deployment. No free durable API host was provisioned. Local Node hosting works; Pages read-only proxy preparation remains available, but hosting a full indexed API requires a separate durable service and is not certified zero-cost. Native SQLite/datasets stay out of frontend bundles.

## Necessary external inputs

See `RASAD_BRAZIL_MISSING_CHECKLIST.md` for exact products, bbox, dates, minimum delivery, official links, local folders and authentication. Initial environmental request is **one month and one pilot bbox**, not all Brazil or historical years. Continue with actual observations until authentic environmental/opportunity/validation inputs arrive. No scientific validation or complete live operational system is claimed.
