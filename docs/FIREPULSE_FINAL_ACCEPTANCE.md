# FIREPULSE final acceptance — strict evidence, not a completion score

**Audit date: 2026-11-14, Asia/Amman.** One implementation/acceptance sprint. No deployment, Git push, cloud migration, public release/ZIP, dependency installation, data import, original observation change or secret-file access.

## Decisions

- **GO for the bounded local judge demonstration.** The actual application, regional data, source-aware Calendar, exploratory correspondence, sensitivity and evidence exports work in the executed acceptance suite.
- **NO-GO for claiming 100% official compliance or complete sensor-independent scientific harmonization.** Full live official details/resources remain UNCONFIRMED; structural harmonization is not calibrated sensor equivalence.
- **NO-GO for deploying the present provider configuration unchanged.** Local production/static simulations pass, but the existing Vercel data exclusions and large buffered API response remain confirmed blockers. No public URL was tested.

These decisions are distinct. Passing software tests does not turn missing acquisition coverage, ground truth or official wording into verified evidence.

## 1. Exact requirement acceptance matrix

Primary source O1: [official challenge URL](https://www.spaceappschallenge.org/2026/challenges/modis-and-viirs-hot-spots/). Its official-domain indexed summary was retrieved and preserved in [OFFICIAL_REQUIREMENTS_EVIDENCE.json](OFFICIAL_REQUIREMENTS_EVIDENCE.json). This sprint's single direct retry again returned HTTP 502. The following short quotations are exact **summary excerpts**, not a claim to possess the full live statement or a legal mandatory checklist.

| Core objective / exact O1 excerpt | Authority and classification | Implemented feature / exact files | Actual demonstration and executed test | Acceptance |
|---|---|---|---|---|
| R1: “web application” | Independently retrieved official indexed summary; core objective | React/Vite mission entry, MapLibre and existing routes; src/App.tsx, src/FireMap.tsx | Start Mission, real-data navigation, keyboard/Arabic/mobile workflows; test:e2e, test:language, verify-final-workflows.mjs, clean production browser | **PASS**, local functional behavior. No public availability claim. |
| R2/R3: “harmonizes these records into a burning activity calendar” | Official indexed summary; joint core objective; exact required scientific depth ambiguous | shared/model.ts, observations.ts, harmonization.ts, scientificEngine.ts; src/calendar/BurningCalendar.tsx, aggregation.ts, combined.ts, visualization.ts | Real Ajloun July 2023: 2 MODIS/16 VIIRS; same canonical IDs/UTC/source fields in Calendar, CSV/SVG/JSON; 126 unit tests, independent CSV/XML and scientific checks, actual browser | **PARTIAL overall. Calendar/structural computation PASS; a calibrated/source-independent record is NOT established.** Do not count schema consistency alone as full scientific compliance. |
| R4: “selected area of interest” | Official indexed summary; core objective | Exact Ajloun and Northern Jordan polygons; shared/regionScope.ts, observations.ts; Atlas/Calendar region selectors | Both actual catalogs and all year shards; exact polygon checks, region switching and preserved IDs; Jordan tests, historical API/browser, final workflows, independent audit | **PASS for the two documented selectable regions.** No global/arbitrary-AOI claim. |
| R5: “historical fire patterns” | Official summary purpose, descriptive support is demonstrated; a quantitative mandatory rubric is not retrieved | shared/historySummary.ts, historyComparison.ts, scientificEngine.ts; src/intelligence/HistoryOverview.tsx, MonthComparison.tsx | Same-source July S-NPP 2021 vs 2023: 1 vs 5 delivered Ajloun detections; 42 independent comparison checks; live table/export and source-stratum seasons | **PASS for descriptive examination only.** No calibrated trend/recurrence conclusion. |
| R6: “unusual conditions, and critical periods” | Official summary purpose; required metric/model unspecified | Evidence/coverage gate and unavailable anomaly outputs; shared/agreement.ts, research.ts, scientificEngine.ts; IntelligenceWorkspace | Actual UI explains unavailable scores; report exports retain null median/anomaly/calibrated outputs; claim/scientific browser and unit checks | **PARTIAL / no validated detector or forecast.** Guardrails work; unavailable science is not a completed quantitative requirement. |

All O1 quotations together are deliberately brief. [OFFICIAL_REQUIREMENTS_TRACEABILITY.md](OFFICIAL_REQUIREMENTS_TRACEABILITY.md) contains the full project traceability taxonomy and source hierarchy.

### Supplied/secondary details: not silently promoted to independently verified mandatory text

The [HackAthlone local-event reproduction](https://hackathlone.com/challenges/modis-and-viirs-hot-spots) corroborates supplied details, but is secondary. Its scientific ambition includes sensor-origin-independent interpretation; that remains substantively incomplete. Date-window choice and numerical/visual downloads work (including this project's CSV/JSON/SVG). Broad continuous history and median examples are not established by the available data. AOI drawing and particular presentation/output suggestions are not treated as individually verified mandatory artifacts. A specific calibration algorithm, predictive model or validated anomaly score is **not independently established as mandatory**.

**Full mandatory enumeration, official full resources, eligibility, submission formats and detailed judging compliance: UNCONFIRMED.** The unavailable statement cannot be replaced by a 100% score, another team's interpretation, a staging page or a previous year's rules. No further repetitive network retries were used to stall implementation.

## 2. Implemented fixes and root causes

### Functional observed-date playback

The Atlas button was literally disabled and no playback controller existed. Implemented a finite 1.6-second sequence through the existing sorted observed UTC dates. Play/pause, manual scrub/date selection, Escape, last-date stop, explicit restart, source/year/region cancellation, outside interaction and background-tab pause are handled. Empty/single-date scopes are disabled. Reduced motion removes decorative cursor transitions but does not prevent an explicitly requested discrete sequence. No date interpolation, synthetic points, looped camera or inferred coverage is introduced.

Date selection formerly retriggered the same full-year fetch because its effect depended on complete start/end dates. Loading now depends on actual requested UTC-year bounds. Actual browser acceptance observed **zero extra year requests across playback steps**, exact source IDs and an unchanged map canvas. This is a measured request result, not an unmeasured latency/cold-start improvement claim.

### Popup and responsive reading defects

The fixed popup anchor was chosen before camera recentering, while height used a viewport-derived constant rather than the actual space above the timeline. The noninteractive region headline and map-coordinate caption could paint over metadata. Simply increasing z-index would not fix these constraints.

The same native MapLibre popup now measures header/timeline/basemap/tools and gets a scrollable border-box height. When an anchored popup cannot fit, its reading box is pinned inside that measured space; its displaced tip is hidden to avoid implying a false anchor. Original source coordinates, popup getLngLat, selected observation, map camera and worker configuration are unchanged. The noninteractive headline/coordinate caption yields while a record is selected. The last scientific caveat is reachable through internal scrolling.

Measured EN/AR bounds passed at **1366x768, 1440x900, 1920x1080, 390x844 and 320x740**. Screenshot evidence: .checkpoints/final-sprint/popup-en-*.png and popup-ar-*.png. Inspected the actual Arabic 320 px render; metadata/close control and basemap/timeline remain usable. Calendar notices/export actions now have responsive margins/wrapping. Existing design, intro and navigation were preserved.

### Stale documentation and acceptance tools

README and SUBMISSION_STORY still described 36 records and unavailable North, and referenced a removed Skip Intro action. Updated them to the activated catalogs and current guide. Kept older provenance/checklist content explicitly historical rather than deleting audit evidence.

verify-deployment.mjs incorrectly expected North to contain zero observations. It now checks both actual manifests, every UTC-year count/ID/revision, defaults and unknown coverage. This strengthens acceptance; it does not substitute mock data.

The static builder read example years from a legacy report filename. It now follows the active generation's report pointer and rejects a pointer change during build. No deployment configuration or scientific API contract was changed.

## 3. Scientific baseline rechecked

Read-only audits and independent Python reconciliation reran against the original activated archive; numbers below are results, not product hardcoding.

| Scope / quantity | Result |
|---|---|
| Ajloun catalog | 143: MODIS 11 / VIIRS 132; standard 135 / NRT 8 |
| Northern Jordan catalog | 6859: MODIS 352 / VIIRS 6507; standard 6594 / NRT 265 |
| Ajloun guided 2023 | 22: 2 MODIS Aqua / 20 VIIRS |
| Ajloun July 2023 Calendar/export | 18: 2 MODIS / 16 VIIRS; July 14 contributes 2 / 11 |
| North July 2023 exports | 120: 12 MODIS / 108 VIIRS |
| Guided 1 km/60 min | 12 candidate edges / 13 participating IDs / 1 connected group |
| Guided 1 km/7 min | 5 / 6 / 1 |
| Full-history 1 km/60 min | Ajloun 15/18/3; North 245/272/52 |
| Matched-month verification | 42 source-consistent comparison results independently checked; selected 2021/2023 support: Ajloun 1 source-month, North 24 |

Ajloun is contained within North; region totals are never added. Raw confidence schemes, nullable FRP semantics, original versions/platforms and standard/NRT strata remain intact. FRP sums are reported detection MW, not energy or interchangeable intensity. Reported acquisition times have minute precision; normalized :00 strings are not sub-minute accuracy claims. Candidate edges/groups are not independent confirmed events or probabilities. The 1 km/60 min rule is exploratory, not a NASA-prescribed calibration.

Active revision: f3cb30006dd2f0ff02df206024189da7757d40cd02e6708c2e5374f03a73910f. SQLite SHA256: b1e19d095190b7c6116a284080a87cd702c0927260f183d85ff9ef1a1747533e, unchanged. Original delivery hashes and unchanged polygon membership are checked by the scientific integrity audit. Historical extent is delivery extent, not complete acquisition coverage.

## 4. Advanced science: precise blocked status and usable next path

No native HDF/NetCDF science granules were found in the workspace scan. A fresh bounded anonymous Range probe of the exact Aqua/S-NPP pilot fire URLs again ended with **401 at urs.earthdata.nasa.gov**; no science body was saved. This is an authentication/input blocker, not verified zero activity or proof of unavailable historical acquisitions.

Added [OPPORTUNITY_INPUT_MANIFEST.json](OPPORTUNITY_INPUT_MANIFEST.json): four exact candidate filenames, official URLs, concept IDs, intervals and formats for one 2023-07-14 daytime pair. The existing [advanced data requirements](ADVANCED_SCIENCE_DATA_REQUIREMENTS.md) provide the manual download procedure. No credentials are needed by the prescreen:

```powershell
node scripts/verify-opportunity-inputs.mjs .checkpoints/opportunity-inputs
```

Actual result: **exit 2, four missing files, BLOCKED**, not scientific PASS. The read-only path rejects unsafe names, symlinks, HTML/native-signature failures and checksum mismatches, streams hashes and preserves unknown expected checksums. Unit tests use explicitly synthetic format headers outside active data. Even a signature/hash pass leaves decoded/lineageVerified false and polygonCoverage/calibration/anomaly null. It never imports detections or enables an estimator automatically.

A real opportunity pilot still requires exact native QA/mask decoding, verified geolocation input lineage, polygon sample/footprint handling, specified area or sample-count units and independent scientific verification. Sensitivity requires independent co-temporal reference labels. Historical anomalies additionally require comparable exposure periods, missingness treatment and held-out evaluation. One catalog-time pilot or clear pass cannot supply these. NOAA-20/21 lineage discrepancies remain disclosed; original dates/versions were not altered.

## 5. Executed tests and actual workflow coverage

Ledger: .checkpoints/final-sprint/acceptance.json. **22 checks PASS (exit 0); one advanced-input check BLOCKED as expected (exit 2); no unexpected failure remains.** The affected build/lint/workflow/layout/production/static checks were rerun after final touch-target and stronger filter assertions. Intermediate UI/harness defects were fixed rather than deleting assertions.

| Executed command | Final outcome |
|---|---|
| npm run build | PASS; existing large-chunk warning remains |
| npm run lint | PASS, no final lint warnings |
| npm test | **126 tests PASS**, zero failures/skips; previous 123 retained plus three playback/prescreen tests |
| node scripts/audit-scientific-data.mjs | PASS: original integrity, canonical/source/polygon reconciliation |
| python scripts/verify-scientific-independent.py | PASS: period/FRP/season counts and exhaustive selected-scope matching |
| node scripts/verify-scientific-completion.mjs | PASS |
| python scripts/verify-completion-independent.py | PASS: 42 comparisons and real metadata interval checks |
| node scripts/verify-challenge-exports.mjs | PASS: six actual region/sensor scopes |
| python scripts/verify-challenge-independent.py | PASS: CSV coordinates/IDs/confidence/revision and SVG daily counts/FRP/nulls |
| node scripts/verify-historical-api.mjs | PASS: actual manifests/year/aggregate responses |
| npm run test:filters | PASS: existing filter/mission regression |
| node scripts/verify-claim-audit.mjs | PASS: actual Calendar CSV/SVG, guide/sensitivity/Research JSON and Arabic |
| node scripts/verify-historical-explorer.mjs | PASS: region/year/date/map/source handoff; unavailable-year playback disabled; matched-month export |
| node scripts/verify-scientific-browser.mjs | PASS: scientific scope, Season/DNA/Sensor and unavailable outputs |
| node scripts/verify-atlas-layout.mjs | PASS: five viewports, both languages; inspector/timeline/tools/footer bounds and all 803 listed records reachable |
| node scripts/verify-exploration-panel.mjs | PASS: existing opening behavior, internal scroll and no timeline overlap |
| node scripts/verify-final-workflows.mjs | PASS: actual source/raw-confidence/FRP/processing filters; playback and exact map IDs; pause/end/restart/Escape/native range keyboard/reduced motion/scope changes; no same-year refetch/remount; popup bounds and last caveat; Calendar text bounds |
| npm run test:e2e | PASS: intro/fallback, map, guided journey/navigation/export and related regressions |
| npm run test:language | PASS: English/Arabic, persistence, keyboard/mobile and translated report behavior |
| npm run verify:release | PASS: local asset/worker/configuration safeguard, not publication |
| node scripts/verify-final-production.mjs | PASS: clean production environment, actual API export + dist; nested checks below |
| node scripts/verify-production-static.mjs | PASS: current immutable static browser/data path without Express; checkpoint output only |
| node scripts/verify-opportunity-inputs.mjs .checkpoints/opportunity-inputs | **BLOCKED_INPUTS_EXPECTED**, exit 2; no fake coverage acceptance |

Production nested commands also exited 0: verify-production-audit.mjs; `npm run verify:deployment -- http://127.0.0.1:5187`; refresh-enabled verify-claim-audit.mjs; and verify-final-workflows.mjs on that same origin. They use the actual api/[...path].js export independently of Vite middleware, not a mock or smaller pilot. See production.json and production-*.log in the sprint evidence folder.

Legacy E2E/language suites intentionally use a controlled historical pilot. Separate real-history/API/independent/workflow suites verify the activated 143/6859 catalog. No dataset was replaced to satisfy a test. Console/network failure simulations exercise real fallbacks; they are not hidden source-data success states. A local software-WebGL browser is not a physical-device performance or public-host test.

## 6. Production, security and performance findings

Local full Node API and static scientific web paths work. The corrected static builder uses matching generation metadata; the corrected HTTP verifier no longer asserts an empty North. Read-only immutable SQLite is viable locally; no runtime import/write/background process is required by the demo.

Still **NO-GO for current Vercel config unchanged**: server/data/SQLite are excluded by upload/function configuration, and the broad North canonical JSON is 10,474,730 bytes, exceeding the documented buffered Function body limit reviewed in PRODUCTION_READINESS_AUDIT.md. Actual provider tracing/Linux runtime, remote cold starts, public routing and account limits are not verified. The static web variant does not provide the full historical REST API. No provider, paid service or cloud resource was created. Existing DEPLOYMENT_ARCHITECTURE.md and DEPLOYMENT_CHECKLIST.md remain the plan, subject to a separately authorized deployment decision.

Measured safe optimization: no redundant same-year data requests during real playback, map canvas retained. Large MapLibre/Three chunks remain an acknowledged build warning; no unmeasured broad optimization was claimed.

A filename-first non-secret scan found no high-specificity credential patterns in 351 scanned text files; one secret-named file was not read. This is not exhaustive secret/PII certification. Four historical docs contain local machine paths and are not served from dist. There is no .git directory in this copy, so tracked/untracked status cannot be certified. No secret value was read/printed. Production HTTP checks verify private data/docs paths are not exposed by the local static root. No original ZIP/audit/checkpoint artifact was copied into public assets.

## 7. Exact changed files

New:

- shared/observedPlayback.ts
- src/motion/popupLayout.ts
- scripts/verify-final-workflows.mjs
- scripts/verify-final-production.mjs
- scripts/verify-opportunity-inputs.mjs
- tests/finalSprint.test.ts
- docs/OPPORTUNITY_INPUT_MANIFEST.json
- docs/FIREPULSE_FINAL_ACCEPTANCE.md

Modified:

- src/components/AtlasTimeline.tsx
- src/FireMap.tsx
- src/design/atlas.css
- src/calendar/BurningCalendar.tsx
- src/calendar/calendar.css
- src/i18n/evidence-ar.ts
- deployment/cloudflare/build-static.mjs
- scripts/verify-deployment.mjs
- scripts/verify-historical-explorer.mjs
- README.md
- docs/SUBMISSION_STORY.md
- docs/DATA_PROVENANCE.md
- docs/SUBMISSION_REQUIREMENTS_CHECKLIST.md

Existing SCIENTIFIC_DATA_AUDIT.json and SCIENTIFIC_INDEPENDENT_CHECK.json were regenerated by read-only verifiers. Reversible source copies, measured proofs, screenshots, access statuses and logs are under .checkpoints/final-sprint. Temporary static outputs are private test artifacts, not a release package. No source archive, active database/pointer, region definition, matching algorithm, dependency/lockfile or .env was modified.

## 8. Submission assets, owner actions and stop condition

Ready local assets: current README/install/runtime/architecture instructions; SUBMISSION_STORY.md; THREE_MINUTE_DEMO.md; current scientific methodology/source/independent reports; actual Calendar CSV/SVG and Research Brief JSON exports; measured EN/AR desktop/mobile screenshots; strict matrix and exact advanced input manifest. No mandatory video length, format, deadline/timezone or public hosting requirement is invented.

Owner actions, in priority order:

1. **Rehearse the current three-minute path once.** `npm run dev`, open http://localhost:5173/#mission-atlas, Start Mission, explicitly Ajloun/2023, Calendar/July/July 14/export, Evidence Engine/Start Guide, 1 km/60 to 1 km/7, source evidence/limitations, Research Brief. The script is a target, not a measured novice completion guarantee. Optional observed-date playback is functional; do not narrate skipped days as verified zero.
2. **Obtain the complete official statement/resource list or challenge-author clarification** and check actual submission-platform/eligibility requirements. Present this as a source-aware research prototype, not 100% calibrated harmonization. The strict source-independent interpretation remains unresolved and scientifically incomplete.
3. **If pursuing the advanced pilot, manually retrieve the four exact candidate files through official Earthdata login** into the separate local input directory, without sharing credentials. Run the read-only prescreen, then independently verify native decoding/lineage/geometry before any estimator. This is separate research, not a hidden prerequisite to opening the existing demo. Calibration/anomaly claims need additional independent evidence beyond those four files.
4. **Do not deploy/push/publish from this report.** Choose and approve a hosting approach only after its real packaging/payload/security gates are fixed and tested. No public success is inferred from localhost.

Stop adding speculative scores. No known local functional P0/P1 failure remains in the exercised workflows, but that is not proof of an unknown official rubric or complete scientific calibration. Final position: **GO for an honest bounded demonstration; UNCONFIRMED for unqualified official submission compliance; NO-GO for stronger unsupported scientific claims or unchanged production configuration.**
