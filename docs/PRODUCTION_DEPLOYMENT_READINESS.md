# Production deployment readiness

2026-11-14. **GO for the prepared GitHub source and Cloudflare Pages build.** No push, account changes, deployment, public URL verification or ZIP creation was performed.

## Exact settings

| Setting | Value |
|---|---|
| Repository/root directory | Project root |
| Cloudflare Pages build command | `npm run build:cloudflare` |
| Output directory | `dist` |
| Runtime/environment variables | None required; no NASA key or backend origin |
| Build Node selection | `.node-version`: 24, within package engines; local executed tests used Node 26.13.0 |
| Public data source | Checked-in `deployment/static-data/` JSON, copied to `/archive-data/` |
| Backend / SQLite / Functions / Worker runtime | Not required for current historical application |

Cloudflare supports a custom build command/output directory and file-based Node selection: [build configuration](https://developers.cloudflare.com/pages/configuration/build-configuration/), [build image](https://developers.cloudflare.com/pages/configuration/build-image/). Use the explicit custom command above; `npm run build` remains the general API-mode frontend build.

## Strategy and implemented fixes

The previous static exporter depended on local SQLite, which is correctly excluded from GitHub. It therefore could not serve as a clean GitHub build command. Added a two-stage workflow:

1. **Already executed locally:** `npm run prepare:data` exports the activated regional records and summaries without modifying observations. The intentionally publishable snapshot contains 52 JSON files (10,521,605 bytes), 143 Ajloun / 6,859 Northern Jordan observations, and an index pinning file hashes and the activation revision. These scoped NASA derivatives are the explicit public-data exception; original deliveries remain private/local.
2. **GitHub/Cloudflare:** `npm run build:cloudflare` type-checks, validates the prepared snapshot, compiles the existing static observation transport, copies only prepared data, writes revalidation headers and scans the completed output. It never imports the backend or reads SQLite. External environment-variable injection into the client build is disabled. A clean generated `dist` avoids obsolete asset/Worker leftovers.

Existing API-equivalent data paths are `/archive-data/ajloun.json`, `/archive-data/northern-jordan.json`, region/year shards and daily/monthly/yearly summaries. All active region/year metadata and provenance travel with them. Shared filtering and scientific analytics execute unchanged in the browser. This is immutable historical data, not live NASA polling. Actual `/api/*` endpoints are not hosted by static Pages; the current UI does not need them. Existing Express routes remain available locally; a separate backend would be needed for future live ingestion or external dynamic API consumers.

No scientific calculation, observation ID, UTC timestamp, coordinate, source field, processing identity or boundary was changed. Ajloun remains a subset of the north; totals are not added. Unknown acquisition coverage and uncalibrated cross-sensor limitations remain visible.

## Verified outcomes

**All 31 final check outcomes PASS; 140/140 unit/backend tests PASS.** Build, lint, E2E, filters, language, existing scientific/independent/API/history/claim/layout workflows and static production checks executed. Exact commands, statuses and logs: `.checkpoints/deployment-prep/acceptance.json` and adjacent files.

- Static-only local Chrome at `http://127.0.0.1:5179` passes three full groups: claims/judge journey, Calendar harmonization and final map/filter/playback workflows. The preview has no Express and `/api/observations` returns 404. App manifests/year-shards/summaries load from real JSON assets.
- Region/year/date/sensor/confidence/FRP/processing changes, unchanged map canvas, observation popup metadata, Calendar/day details, descriptive history/medians/observed periods, candidate sensitivity, CSV/SVG/comparison/research JSON, English/Arabic and mobile/RTL interactions pass. The map popup/scroll checks include 1366x768,1440x900,1920x1080,390x844,320x740.
- Every exported regional feature deep-equals the original data-catalog feature, including all properties/IDs/UTC/coordinates/provenance. Independent Python checks pass: 3,150 Calendar source rows and 2,284 monthly-reference cases, plus existing scientific comparisons and export checks. Source/archive integrity checks pass; SQLite SHA256 remains `b1e19d095190b7c6116a284080a87cd702c0927260f183d85ff9ef1a1747533e`.
- A clean-source build without `server`, source archives, SQLite, checkpoints or environment files passes using the installed frontend dependencies. This was not a fresh network `npm ci` or a hosted Cloudflare build.
- Final `dist`: **79 files; 15,875,955 bytes; largest file 1,511,379 bytes**. All files fit the documented Pages limits of 20,000 files and 25 MiB per asset: [official limits](https://developers.cloudflare.com/pages/platform/limits/).
- Publication validation rejects unlisted/orphaned/tampered files, mixed revisions, missing shards, duplicate IDs, count disagreements, symlinks, local paths and known credential markers. Output contains no `.env`, SQLite, input ZIP/CSV, server, node_modules, checkpoints, `_worker.js` or `_routes.json`.
- Actual Git ignore rules tested in a disposable repository: 17 local/secret/raw-data patterns excluded; 5 representative app/snapshot paths included. Main project has no `.git` initialized; nothing was staged, committed or pushed. GitHub history/account state has not been inspected.

Two non-product test issues were resolved honestly: the static workflow test initially called a development-only API directly; it now selects the actual static manifest/shard URLs under `--static`, retaining all ID/date/filter assertions. Later the local disk filled (`ENOSPC`), interrupting language/screenshots and SQLite temporary processing. Only disposable generated build output and 207 `firepulse-motion-*` test profiles were removed after target-path checks; original scientific files were untouched. Affected checks were rerun successfully; initial failure logs and the pre-recovery result snapshot remain. Existing large Earth/MapLibre chunk warnings remain, not build failures.

## Changed files

- `package.json`, `.node-version`, `.gitignore`, `README.md`, `deployment/cloudflare/README.txt`.
- New `deployment/cloudflare/{prepare-data,build-pages,prepared}.mjs`.
- New `deployment/static-data/index.json`, 52 regional JSON assets and its README; these are intentionally included in the future GitHub commit.
- New `scripts/verify-{prepared-static,pages-preview,clean-pages-build,static-original,github-rules}.mjs`.
- `scripts/verify-final-workflows.mjs`: preserve development assertions, add real static data-source selection.
- New `tests/staticSnapshot.test.ts`: real snapshot validation plus unlisted/tampered-file rejection.
- This report. Existing scientific audit output was regenerated by its verification command.

Original-source checkpoints are under `.checkpoints/deployment-prep`. Ignore rules now cover raw ZIP/CSV/SQLite, server/data, local tooling/credential configuration, Microsoft files, node_modules, checkpoints and legacy releases. A clean `dist` and the explicit snapshot allowlist protect publication independently of Git ignore rules.

## Open locally and next authorized action

```powershell
npm ci
npm run build:cloudflare
npm run preview:cloudflare
```

Open `http://127.0.0.1:5179/#mission-atlas`. The original API development experience at localhost:5173 is preserved. Source-only reviewers use the static preview above; local ingestion/API testing additionally needs the existing private scientific archive and server dependencies.

No known local deployment blocker remains. The owner must include the prepared public snapshot when committing, then configure Pages with the exact settings above. Hosted dependency installation, Node 24 execution and the eventual public URL remain unverified until an approved deployment occurs. Basemap/imagery access still depends on the existing external providers. The historical snapshot updates only through a deliberate local refresh and rebuild; it does not provide a live backend. No scientific calibration claim is implied by deployment readiness.
