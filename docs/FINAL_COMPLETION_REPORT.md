# South America execution report

Generation `86f1f872f7366fe4`. Raw source rows independently counted: 48,952,994. Active unique polygon-contained observations: 48,552,057. Active Jordan records: **0**. No deployment was performed.

Historical input files: `DL_FIRE_J1V-C2_847873old.zip`, `DL_FIRE_J2V-C2_847874old.zip`, `DL_FIRE_M-C61_847869old.zip`. NRT input files: `MOIDS.zip`, `viirs.zip`, `viirs1.zip`, plus the separately supplied NOAA-21 daily TXT. Exact members, input/imported counts, dates and SHA-256 values are in SOUTH_AMERICA_DATA_AUDIT and SOUTH_AMERICA_AUDIT.json.

The application retains its existing cinematic intro, map/inspector/filter/timeline architecture, Burning Calendar, seasonal clock, Sensor Intelligence, Evidence Engine, Fire DNA, Anomaly Detection, Decision Brief and research view. It now uses continent/country polygons and one South America API. Sensor Trust Lens explains the estimand, opportunity, grid/window sensitivity, source identity and conditional-reference eligibility. Record-level agreement/brief panels are explicitly bounded evidence-page analyses; full seasonal/calendar/history charts use database summaries.

The calendar spans the actually delivered 2000–2026 record; this is not a statement of complete sampling. Source-specific MODIS conditional references can have sufficient preceding positive years. S-NPP is absent. NOAA-20/21 declared Standard processing remains blocked from historical-reference eligibility until supplier reconciliation. Cross-sensor calibration is **NOT_CALIBRATED**, and no validated exposure-aware anomaly or prediction exists.

Current test/build/browser evidence is retained in `.checkpoints/rasad/` and `.checkpoints/south-america/`; see RASAD_FINAL_REPORT.md for the executed revision and verification limits. Re-run the listed scripts against this exact generation to reproduce. Passing compilation alone is not acceptance. The browser script checks intro, country selection, actual source metadata, calendar/day linking, Trust Lens and EN/AR RTL at 1440/390/320 px. Any expanded module/control checks are recorded separately in its output; untested permutations are not claimed.

Storage uses streaming 2,000-row ingestion, per-member transactions, a SHA identity index, compressed chunks, indexed date/country/source queries and server summaries. A failed member rolls back; existing committed members resume by checksum. Atomic activation prevents mixed-generation live data. Raw pages are limited to 3,000 rows; default 2,000. Exact grid/quality-filter windows and streaming CSV are limited to 31 UTC days. Resource limits are visible, not silently filled with synthetic data.

Local production use: `npm run build`, then `npm run serve` (same-origin read-only API plus client on localhost:4173). Data remains local/ignored. `npm run prepare:data` exports hashed source summaries. A complete continent history is not packaged as a misleading tiny static sample. Pages packaging requires an explicit HTTPS data API; publishing remains unperformed and requires user approval.

Remaining central blockers: missing S-NPP C2 history, complete acquisition/valid-pixel/cloud/geolocation opportunity, independent calibration/held-out validation, NOAA archive lineage clarification, arbitrary AOI drawing and wider production-load testing. The smallest next scientific action is to obtain the missing S-NPP South America archive and an all-overpass paired raster opportunity pilot from the acquisition manifest. This project is **not scientifically finished** while calibration and opportunity-aware anomaly remain blocked.

## Exact changed code files

- `deployment/cloudflare/api-proxy.mjs`
- `deployment/cloudflare/build-pages.mjs`
- `deployment/cloudflare/build-static.mjs`
- `deployment/cloudflare/build.mjs`
- `deployment/cloudflare/prepare-data.mjs`
- `deployment/cloudflare/prepared.mjs`
- `scripts/audit-rasad-stored.py`
- `scripts/audit-south-america.py`
- `scripts/delivery_gaps.py`
- `scripts/import-south-america.py`
- `scripts/report-rasad.py`
- `scripts/report-south-america.py`
- `scripts/verify-rasad-grid-independent.py`
- `scripts/verify-rasad-pages.mjs`
- `scripts/verify-south-america-browser.mjs`
- `server/activateHistorical.js`
- `server/app.js`
- `server/app.test.js`
- `server/dataCatalog.js`
- `server/serveProduction.js`
- `server/southAmerica.js`
- `server/southAmericaWorker.js`
- `shared/activation.ts`
- `shared/analytics.ts`
- `shared/equalArea.ts`
- `shared/evidence.ts`
- `shared/model.ts`
- `shared/observations.ts`
- `shared/observedPeriods.ts`
- `shared/regions.ts`
- `shared/scientificEngine.ts`
- `src/App.css`
- `src/App.tsx`
- `src/FireMap.tsx`
- `src/calendar/BurningCalendar.tsx`
- `src/calendar/CalendarComparison.tsx`
- `src/calendar/CalendarDayDetails.tsx`
- `src/calendar/aggregation.ts`
- `src/calendar/combined.ts`
- `src/calendar/useCalendarObservations.ts`
- `src/calendar/visualization.ts`
- `src/components/AtlasFilters.tsx`
- `src/components/AtlasInspector.tsx`
- `src/components/EarthLanding.tsx`
- `src/components/MissionIntro.tsx`
- `src/components/MissionUI.tsx`
- `src/components/RegionExplorer.tsx`
- `src/components/ScientificContext.tsx`
- `src/components/SensorTrustLens.tsx`
- `src/data/intelligence.ts`
- `src/data/observations.ts`
- `src/data/regions.ts`
- `src/data/useRegionalHistory.ts`
- `src/data/useScopedSeries.ts`
- `src/design/AtlasPrimitives.tsx`
- `src/design/atlas-tokens.css`
- `src/design/atlas.css`
- `src/i18n/ar.ts`
- `src/i18n/evidence-ar.ts`
- `src/i18n/south-america-ar.ts`
- `src/i18n/translate.ts`
- `src/intelligence/EvidenceEngine.tsx`
- `src/intelligence/HistoryOverview.tsx`
- `src/intelligence/IntelligenceWorkspace.tsx`
- `src/intelligence/JudgeGuide.tsx`
- `src/intelligence/MonthComparison.tsx`
- `src/intelligence/ObservedPeriodExplorer.tsx`
- `src/intelligence/SeasonalFingerprint.tsx`
- `src/state/MissionContext.tsx`
- `src/state/mission.ts`
- `tests/dataClient.test.ts`
- `tests/developmentTransport.test.ts`
- `tests/i18n.test.ts`
- `tests/jordanRegions.test.ts`
- `tests/observedPeriods.test.ts`
- `tests/pagesProxy.test.ts`
- `tests/rasad.test.ts`
- `tests/southAmerica.test.ts`
- `tests/staticSnapshot.test.ts`
- `vite.config.ts`
