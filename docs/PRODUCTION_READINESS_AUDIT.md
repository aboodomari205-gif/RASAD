# Production readiness audit

Date: 2026-11-13. Audit/local preparation only. No cloud account, CLI deployment, Git push, public release, ZIP, dependency installation, observation import or scientific algorithm change occurred. Secret-named files were excluded before content access; no .env was opened.

## Executive decision

**NO-GO for the current Vercel configuration unchanged. Vercel is conditionally feasible, not intrinsically incompatible with read-only SQLite.** Two confirmed blockers are omitted activated data and an oversized full-history API response. The local full application works when its actual immutable data files exist. A separate existing static transport also works locally without Express.

For the deadline-bound judge-facing website, the simplest operational architecture is an immutable static snapshot generated from the verified SQLite revision, retaining the current client-side analytics and exports. This does not provide the complete history/intelligence REST API. For a deployment that must preserve those APIs, use the existing Node Function with an explicitly bundled immutable SQLite generation and bounded responses, after the changes in DEPLOYMENT_ARCHITECTURE.md. Do not silently replace the full API with static HTML.

## Inspected architecture

- Root package.json: React/Vite/TypeScript; build = tsc -b && vite build; two lockfiles, root and server. Server dependencies include Express/CORS/csv-parse. Root and server engines currently permit Node 22.18+ or 24+; actual local test runtime was Node v26.13.0. No locally installed Vercel CLI was found; no Vercel build trace was produced.
- vite.config.ts imports createApp at development runtime and attaches Express to /api requests in Vite middleware. This is not a production proxy and is absent from dist. Explicit test proxy overrides retain priority.
- api/[...path].js exports the existing Express default handler without listen(). server/index.js is the separate listening entrypoint, default port 3001. Neither entrypoint imports dotenv.
- server/dataCatalog.js selects server/data/active-history.json, opens its named SQLite through ArchiveStore with readOnly:true and closes it per load. Relative URLs use import.meta.url, not arbitrary browser paths. There is a legacy fallback catalog if the pointer is absent: it must not be accepted as successful historical deployment.
- server/observations.js also needs the pointer's activation report and summary JSON files. Function packaging needs all of this generation together, not just SQLite. public/jordan-adm1.geojson is used by server fallback geometry; both region boundaries, Earth texture and bundled MapLibre worker are frontend assets.
- In-memory frontend caches and selection state are conveniences, not authoritative storage. Runtime GET requests need no disk writes or background jobs. Imports/activation are offline CLI procedures and must stay outside Functions; SQLite writers require persistent storage and atomic release coordination.
- Atlas, Calendar, Intelligence/Evidence and Research share the observation collection transport. CSV, associations, sensitivity and research export run in the browser using selected canonical records; no export-upload endpoint or operational alert service is required.

## Required endpoints and contracts

| Endpoint | Current contract / use |
|---|---|
| GET /api/health | JSON project/status/schema and storage configuration hint. Healthy process is not proof that activated data is present. |
| GET /api/observations?mode=ajloun or northern-jordan&manifest=1 | GeoJSON FeatureCollection with empty features, historical metadata, activationRevision, totalDelivered, yearCounts, availableYears, defaultYear, yearPaths, summaryPath and unknown-coverage availability. |
| GET /api/observations?mode=REGION&year=YYYY | Same region-scoped collection with actual year's features. A request without year defaults to latest delivered year, currently 2026. |
| GET /api/observations?mode=REGION&summary=year/month/day/1 | Activated source-separated series from generation-specific JSON. Periods are not invented acquisition-coverage observations. |
| GET /api/history/{datasets,observations,aggregates,coverage,comparison} | firepulse.observations/v1 envelope: resource, scope, availability, datasets, diagnostics, ingestion reports, coverage/caveats/capabilities; resource-specific observations, series or comparison. /api/intelligence aliases use the same handlers. |
| GET /api/hotspots | Optional key-backed live NASA proxy, independent of activated historical demo. Not required or exercised with credentials; key absence returns 503. |

History query supports region, sensor, processing, fixture, from/to, fromTime/toTime, platform, datasetId, bbox, confidence, period and FRP bounds. Validation rejects unsupported/scalar-invalid scope and parameterizes SQL. Invalid query returns 400; unknown dataset 404; oversized 50,000-record query 413; unavailable data 503. Unknown API route is JSON 404. Atlas has its narrower mode/year/manifest/summary interface; it is not the same parameter contract. Browser raw-evidence windows are limited to three consecutive years and 3000 observations, independently of the backend's larger cap.

## Confirmed blockers versus unverified risks

| Finding | Evidence | Classification |
|---|---|---|
| Data absent from configured Vercel upload/function | .vercelignore excludes server/data and all SQLite; vercel.json excludes both again and only includes boundary explicitly. npm run build produces no archive-data JSON. No external data service was assumed. | **Confirmed blocker**, P0 for historical observations. Without data, North can return unavailable rather than the required 6859-record catalog. |
| Full canonical North response exceeds Function body limit | Local /api/history/observations?region=northern-jordan returned 10,474,730 UTF-8 bytes. | **Confirmed incompatibility** with the documented 4.5 MB buffered Function response limit; local HTTP success is not Vercel success. |
| Stale HTTP deployment verification | scripts/verify-deployment.mjs still asserts Northern Jordan features.length===0 and calls it fixture isolation. It was not used as a passing activation test. | **Confirmed acceptance blocker** before relying on that command; replace with activated manifest/year contracts, not weaker assertions. |
| Static builder consults legacy activation-report filename for exampleYears | build-static.mjs uses historical-activation-report.json for example presets while revision comes from active pointer. Current local experiment passed; future revision agreement is not guaranteed. | **Confirmed coupling**, repair/gate before repeatable static production builds. |
| Actual Vercel function trace / Linux runtime behavior | Local Windows Node entrypoint tested, but no Vercel CLI build or deployed sandbox. Dynamic import.meta.url file tracing and shared .ts bundling need verification. | **Unverified risk**, not an established failure. |
| Cold starts/concurrency/limits | No remote cold-start or serverless load test. Synchronous SQLite/JSON work blocks a Node event loop per request. maxDuration is configured 30 s. | **Unverified capacity risk**; local timings do not establish provider performance. |
| Arabic mobile popup readability | Actual 320 px production screenshot shows the large Northern Jordan editorial title painting over observation-popup metadata. Source selection and map assertions pass, but that does not establish readable popup content. | **Confirmed P1 UI defect** before public mobile acceptance; no UI change made in this audit. |
| Source artifact hygiene | .vercelignore omits releases and docs; current public dist contains neither. Large audit JSON and historical release trees exist locally. | **Confirmed upload-hygiene gap**, not evidence of a public leak. |

Vercel supports [Express](https://vercel.com/docs/frameworks/backend/express) and [Node functions](https://vercel.com/docs/functions/runtimes/node-js). Its [runtime filesystem](https://vercel.com/docs/functions/runtimes) is read-only except temporary scratch storage. Thus immutable reads are feasible; persistent in-place imports are not. The current archive alone is about 23.5 MB, below the ordinary 250 MB uncompressed Function bundle ceiling, but dependencies/runtime layers still count. The same [limits documentation](https://vercel.com/docs/functions/limitations) establishes the 4.5 MB buffered response ceiling. No paid-tier exemption or free-tier guarantee is assumed. [Node version documentation](https://vercel.com/docs/functions/runtimes/node-js/node-js-versions) must be checked against the chosen project setting; pin the tested supported major rather than leaving an open-ended range.

## Security and scientific integrity

There is no .git directory in this working copy, so tracked versus untracked status cannot be established. A filename-first local inventory scanned 324 non-secret text files; one secret-named file was deliberately not read. High-specificity private-key/AWS/GitHub-token pattern checks found no matching file in that scanned scope. This is not a comprehensive secret/PII certification. Four historical docs contained machine paths; those docs are not copied into dist. Checkpoints, tool-state directories and Microsoft artifacts were excluded from content scans.

.gitignore excludes .env patterns, server/data, SQLite and checkpoints. .vercelignore excludes secret files, ZIPs, server/data, SQLite and checkpoints, but does not itself exclude old releases/docs. Never remove all exclusions to make data work: allowlist only the required immutable scientific generation in a future private staging design. ZIPs and raw CSVs do not belong in public static output.

API/export checks found no internal absolute home paths in tested JSON; Research Brief JSON was also scanned in the browser. Source ZIP/member basenames, SHA256, dataset IDs, raw acquisition fields, import metadata and timestamps remain intentional provenance. Generated timestamps can vary; scientific inputs/results should be compared independently of report generation time. No source-row calibration or dates were rewritten.

SQL uses bound parameters; region is allowlisted. Configured archive filenames require safe basenames; CSV reads resolve real paths inside a configured data directory. JSON generation pointer names have regex guards; request inputs cannot name arbitrary files. /api uses no-store and nosniff, hides Express branding and returns generic server failures. CORS admits localhost development origins; same-origin production needs no CORS permission. There is no public import/write route. No rate limiter is present: broad comparison/query endpoints need bounds and abuse controls before opening a public API. The optional remote proxy accepts only configured credential-free HTTPS origins with timeout, no redirects and an 8 MiB upstream cap; this is not a client-supplied destination. A trusted configured-origin allowlist remains prudent. Leave NASA key-backed live retrieval disabled for this archive-only submission unless explicitly needed.

## Actual local production verification

scripts/serve-production-audit.mjs serves only dist plus the real api/[...path].js handler on 127.0.0.1:5187. The runner passed an OS-only environment plus NODE_ENV=production: no dotenv or application credentials. This simulates application semantics, **not Vercel routing, tracing, read-only microVM, quotas or cold starts**.

- Actual manifests and every advertised year fetched: Ajloun total 143, North 6859; latest-year views 10 and 803. Region, UTC-year counts, revision and unknown coverage checked.
- Both sensors, datasets, coverage, comparison, aggregates and summary periods exercised with actual data; malformed inputs, unknown API route, CORS and private-path nonexposure checked.
- SPA/deep-link HTML and hashed asset requests checked. Actual browser tests exercise region/year changes including 2021/2026, real map source IDs, record popup, sensor filters, Calendar scope, monthly CSV, Evidence sensitivity, Research JSON, English/Arabic and 390/320 px map tools. A refresh check is included in the final production run.
- Existing static builder independently generated .checkpoints/production-static-audit only: 77 files, 15,815,777 bytes; all-year unique IDs reconcile to 143/6859. Static browser workflow passed without Express. This local test directory is not a new release package or upload artifact. Static-only mode lacks full REST API/health; deployment fallback rules must reflect the chosen architecture.
- API byte sizes and timings are in .checkpoints/production-http.json. One local run: North manifest 30,418 bytes / approximately 14 ms; North 2026 shard 745,825 bytes / approximately 17 ms; broad North canonical response 10,474,730 bytes / approximately 285 ms. Single machine, unthrottled samples; no performance SLA or before/after optimization claim.
- Build warns about chunks above 500 kB: EarthScene about 924 kB and FireMap about 1105 kB minified, loaded separately. Map worker is 519,372 bytes. Existing lazy boundaries retained; no unmeasured optimization or redesign performed. Tiles/styles remain external ArcGIS/OpenFreeMap dependencies; Earth texture is local.

The active database is history-f3cb30006dd2f0ff.sqlite, 23,465,984 bytes; SHA256 b1e19d095190b7c6116a284080a87cd702c0927260f183d85ff9ef1a1747533e, unchanged across HTTP checks. Revision f3cb30006dd2f0ff02df206024189da7757d40cd02e6708c2e5374f03a73910f is stable. Eleven local ZIP files were hashed before/after with no differences; the existing scientific audit separately checks original-delivery provenance.

## Tests and exact changes

Final execution results are recorded in .checkpoints/production-acceptance.json, production-regressions.json and production-static-browser.log. Required acceptance is all exit codes zero; no public test is implied. Unit baseline is 114. Early audit-harness attempts failed on its trailing-root/fallback handling and headless browser startup; fixed in the local harness. Production browser synchronization was made explicit for animated observation lists rather than removing assertions.

Added: scripts/serve-production-audit.mjs, scripts/verify-production-audit.mjs, scripts/verify-production-static.mjs, docs/PRODUCTION_READINESS_AUDIT.md, docs/DEPLOYMENT_ARCHITECTURE.md, docs/DEPLOYMENT_CHECKLIST.md.

Modified: scripts/verify-claim-audit.mjs and scripts/verify-historical-explorer.mjs (local-origin parameter, correct origin logging, completed-list waits; claim test additionally checks export path safety and optional refresh). Existing audit JSON reports may be regenerated by their read-only audit commands. Local .checkpoints runners/logs/security inventory/build experiment are verification artifacts. No application, vercel.json, .vercelignore, database, source observation or scientific calculation was changed.

## Final interpretation

The verified prototype works in local production semantics. **Do not deploy current Vercel configuration.** Choose a documented architecture and clear its packaging/API-size acceptance gates first. Unknown satellite acquisition coverage and NOAA-20/21 lineage discrepancies remain scientific limitations, unchanged by hosting. Successful arithmetic, local browser tests and immutable hashes do not imply calibration, complete coverage, NASA endorsement or a verified public deployment.

## Rendered screenshot review and final command outcomes

Inspected .checkpoints/readiness-evidence.png (desktop Evidence Engine) and .checkpoints/explorer-ar-320.png (production Arabic map). The latter confirms an editorial-title/popup collision: metadata is partly visually obscured despite correct data selection and passing map-state assertions. This is a real remaining mobile acceptance item, not a claim that responsive browser assertions prove visual perfection. No redesign was attempted.

Final production acceptance: build, lint, 114 unit tests, HTTP smoke, refresh-enabled claims browser, historical browser and release verification all exited 0. Separate E2E, language, read-only data audit, independent Python and final lint all exited 0; static build/browser experiment also exited 0. The earlier observation-list race was in test synchronization with exiting animated rows: current-scope selection guards correctly rejected stale rows; waits now require the populated current list. No assertion was weakened. Public mobile acceptance remains NO-GO until the observed popup collision is corrected and screenshot-tested.
