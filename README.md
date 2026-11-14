# FIREPULSE — Earth Intelligence OS

A regional research application for NASA FIRMS MODIS/VIIRS thermal detections: a shared UTC/source model, an interactive burning-activity calendar and transparent exploratory cross-sensor associations. **Detections and candidate groups are not confirmed wildfires.**

Current activated observations: **Ajloun 143** (11 MODIS / 132 VIIRS), **Northern Jordan 6859** (352 / 6507). Ajloun is contained in Northern Jordan; never add these totals. Detection-date extents are 2006-12-03–2026-09-04 and 2001-05-20–2026-11-10 respectively, not continuous verified acquisition coverage. All five platforms are represented in the activated catalog; every individual record retains its own provenance.

Start with [final acceptance](docs/FIREPULSE_FINAL_ACCEPTANCE.md), [three-minute demo](docs/THREE_MINUTE_DEMO.md) and [exact requirement traceability](docs/OFFICIAL_REQUIREMENTS_TRACEABILITY.md). Some older reports deliberately preserve an earlier 36-record pilot; those counts are not the active catalog.

## Cloudflare Pages / source-only preview

The current historical application supports a fully static deployment. Include the reviewed `deployment/static-data/` JSON snapshot in the future GitHub commit; keep original SQLite, input ZIP/CSV files and checkpoints excluded. No NASA key, runtime environment variables, Express or SQLite is required for this build.

```powershell
npm ci
npm run build:cloudflare
npm run preview:cloudflare
```

Open http://127.0.0.1:5179/#mission-atlas. Cloudflare Pages settings: repository root, build command `npm run build:cloudflare`, output directory `dist`. `.node-version` selects Node 24. [Current deployment readiness and exact verification](docs/PRODUCTION_DEPLOYMENT_READINESS.md) supersedes earlier provider blocker reports. Nothing has been pushed or deployed.

## Install and run locally

Tested runtime: Node v26.13.0, npm and Python 3 for independent stdlib checks. See package engines for supported ranges; rerun acceptance when changing runtime. Existing archive demonstration needs no NASA API key or .env. Never share credentials, commit raw archives/SQLite or edit secrets to run the historical demo.

For a fresh authorized source checkout with its lockfiles:

```powershell
npm ci
npm --prefix server ci
npm run dev
```

Open http://localhost:5173/#mission-atlas and select Start Mission. Vite mounts Express on the same origin; no separate port 3001 process is needed. Do not run multiple development servers on 5173. No installation is needed when dependencies already exist.

Original archive inputs and activated SQLite are intentionally excluded from version control. The reviewed public JSON snapshot supports the complete static historical experience above. Running the local Express ingestion/development API additionally requires the operator to restore the verified SQLite generation, active-history pointer, referenced activation report and summaries from their authorized local scientific archive. Do not create fake empty datasets or run an import to hide missing files. [Scientific methodology](docs/SCIENTIFIC_HARMONIZATION_ENGINE.md) and [archive procedures](ARCHIVE_INGESTION.md) document integrity requirements.

## What to demonstrate

Choose Ajloun and year 2023: **22 observations** (2 MODIS Aqua / 20 VIIRS). Open Burning Calendar, July 2023: **18 records** (2 / 16); July 14 contains 2 / 11. CSV and standalone SVG export the displayed filtered month, preserving original IDs/source metadata; CSV includes coordinates. Missing contributions stay unknown.

Atlas playback visits the available observed dates only. Play/pause, Escape and manual date selection stop it; the last date ends the sequence. It does not interpolate dates, prove coverage or loop the camera. Keyboard range navigation and reduced motion remain supported.

In Evidence Engine, Start Guide restores its explicit Ajloun 2023 scope. Exploratory 1 km/60 min matching gives **12 candidate edges, 13 participating IDs, 1 connected group**; 1 km/7 min gives **5/6/1**. These are different graph quantities, not events or probabilities. Inspect source metadata and export Research Brief. Delivered history offers source-consistent matched-month comparisons; raw count differences are not calibrated trends or anomalies.

## Architecture and scientific limits

React/Vite/TypeScript renders the intro, MapLibre Atlas, Calendar and Intelligence experiences. Express serves region manifests/year shards and source-separated history contracts from immutable read-only SQLite. Shared canonical/filter/aggregation/matching/research utilities keep scopes consistent. Local production simulations and a separate immutable static transport exist; development middleware must not be mistaken for production routing.

Original confidence semantics, UTC acquisition values, FRP and source/platform/product/version/processing strata are retained. Standard and NRT are not silently equated. The 1 km/60 min radius/time rule is exploratory, not a NASA-prescribed calibration. NOAA-20/21 upstream lineage remains unresolved. Valid-pixel acquisition opportunity, sensor sensitivity calibration, verified zero days, historical medians and validated anomalies are not established. Official full challenge detail/resource retrieval remains incomplete; do not claim 100% compliance or NASA endorsement.

## Verification

```powershell
npm run build
npm run lint
npm test
npm run test:e2e
npm run test:language
node scripts/verify-final-workflows.mjs
node scripts/verify-claim-audit.mjs
node scripts/verify-historical-explorer.mjs
node scripts/verify-scientific-browser.mjs
node scripts/verify-atlas-layout.mjs
node scripts/verify-exploration-panel.mjs
node scripts/verify-historical-api.mjs
node scripts/audit-scientific-data.mjs
python scripts/verify-scientific-independent.py
node scripts/verify-scientific-completion.mjs
python scripts/verify-completion-independent.py
node scripts/verify-challenge-exports.mjs
python scripts/verify-challenge-independent.py
npm run verify:release
```

Browser checks use existing local Chrome at the path in the scripts; run them sequentially because they share a debugging port. Some legacy E2E/language tests use a controlled older pilot; real-data suites independently check current activation. A passing build is not scientific or official challenge acceptance.

For local production semantics, build then run `node scripts/serve-production-audit.mjs` in a clean environment and inspect http://127.0.0.1:5187/#mission-atlas. `node scripts/verify-production-audit.mjs` checks actual API/data/assets. This is not cloud-runtime emulation. Current provider packaging/payload blockers are documented in [production audit](docs/PRODUCTION_READINESS_AUDIT.md) and [deployment checklist](docs/DEPLOYMENT_CHECKLIST.md); no deployment is authorized or performed.

## Acknowledgments and source evidence

NASA FIRMS/MODIS/VIIRS provide the original thermal-detection deliveries; no NASA endorsement is implied. Administrative geometry retains its documented source/license in [Jordan regions report](docs/JORDAN_REGIONS_RESTRUCTURE_REPORT.md). Earth imagery attribution is in EARTH_ALIVE.md and the Earth asset directory; basemap attribution remains visible for Esri/OpenFreeMap providers. Open-source dependencies retain their respective licenses. Product semantics and caveats: [NASA product verification](docs/NASA_PRODUCT_VERIFICATION.md), [current scientific audit](docs/SCIENTIFIC_DATA_AUDIT.json), [independent check](docs/SCIENTIFIC_INDEPENDENT_CHECK.json).

A safe read-only native-file prescreen and exact candidate manifest are available for later manually authorized opportunity files: `node scripts/verify-opportunity-inputs.mjs .checkpoints/opportunity-inputs`. Exit 2 means missing/rejected inputs. Even a native signature/hash pass does not decode masks or enable coverage/calibration/anomalies. See [advanced input requirements](docs/ADVANCED_SCIENCE_DATA_REQUIREMENTS.md).
