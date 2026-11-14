# Development runtime fix — actual localhost:5173

Verified locally on 2026-11-13. No import, deployment, publication or release packaging.

## Diagnosed failures

1. The live Vite application at `http://localhost:5173` was reachable, but its `/api` proxy targeted the long-running service on port 3001. Both `/api/observations?mode=northern-jordan&manifest=1` and `&year=2026` returned **400 application/json** with `{"error":"Unsupported observation mode"}`. Calling port 3001 directly returned the same rejection. The running service did not support the mode already supported by the current repository. This was neither a genuinely empty region nor missing archive files; the frontend correctly rejected the failed request.
2. During actual development-browser verification, the map fallback was reached despite successful archive JSON. Browser console identified `TypeError: Failed to fetch dynamically imported module: http://localhost:5173/src/FireMap.tsx`. Its MapLibre optimized dependency returned **504 Outdated Optimize Dep**. Parallel-lived development and regression Vite servers were sharing `node_modules/.vite` and invalidating each other's optimized dependencies. This was a development asset-loading failure, not evidence of missing observations or a demonstrated physical WebGL failure.

The active pointer references `history-f3cb30006dd2f0ff.sqlite`, revision `f3cb30006dd2f0ff02df206024189da7757d40cd02e6708c2e5374f03a73910f`. The existing database, data pipeline and original NASA observations were not modified or reimported.

## Fix

`vite.config.ts` now mounts the existing `createApp` Express implementation directly in Vite's development middleware, at the original `/api` routes. The same process reads the current local archive catalog; no independently stale port-3001 backend is needed. Development archive queries deliberately use local storage rather than an external data-service override. The standalone backend and its production contracts remain unchanged. An explicitly configured `/api` proxy still takes precedence for regression/remote test configurations.

The development port is pinned to 5173 with strict-port behavior. Development dependency optimization uses `node_modules/.vite-firepulse-dev`; E2E/language servers use `.checkpoints/browser-vite-cache`; the new development integration test uses its own cache and disables environment-file loading. No API implementation is bundled into the client: the plugin is serve-only and imports the existing Node app at runtime. Static production transport is unchanged.

## Same-origin proof

Requests made through `http://localhost:5173`, not a substituted test origin:

| Request | Result |
|---|---|
| `/api/observations?mode=northern-jordan&manifest=1` | 200 JSON, loaded, totalDelivered 6859, defaultYear 2026, zero features as expected for an index |
| `/api/observations?mode=northern-jordan&year=2026` | 200 JSON, 803 features, correct active revision |
| `/api/observations?mode=northern-jordan&year=2021` | 200 JSON, 591 features; 3 on 2021-07-01 |
| Ajloun manifest / 2026 | loaded total 143 / 10 features |

Headless Chrome actually opened `http://localhost:5173/#mission-atlas`. It selected Northern Jordan, applied **2021-07-01**, verified **3 rendered MapLibre source observations**, clicked an observation and checked its popup date, then restored 2026 and verified **803** source observations. Further checks covered Ajloun/North switching, source-separated Standard/NRT counts, Calendar, older historical years, every Intelligence module, Evidence Engine, research/CSV exports, same-scope source handoff, Arabic RTL, reduced motion and the retained map canvas. The development browser was checked again after all regression servers finished to verify that their caches no longer break the running app.

Evidence:

- `.checkpoints/runtime-dev-fix/north-2021-07-01.png` — actual development map and popup.
- `.checkpoints/runtime-dev-fix/browser-proof.json` — actual origin and requested API manifest/year/summary URLs.
- `.checkpoints/runtime-dev-fix/browser-final.log` — successful post-regression development browser run.

## Executed gates

- `npm run build`: PASS; existing large MapLibre/Three chunk warnings remain.
- `npm run lint`: PASS, no warnings in final run.
- `npm test`: PASS, **101 tests**, zero failures/skips; includes a new real Vite same-origin regression without a separately started Express server.
- `npm run test:e2e`: PASS; original baseline assertions preserved.
- `npm run test:language`: PASS.
- `npm run verify:release`: PASS; local safeguards only, not deployment verification.
- `node scripts/verify-historical-browser.mjs .checkpoints/historical-static`: PASS, actual static historical manifests/shards without Express.
- `node scripts/verify-historical-browser.mjs --dev-existing`: PASS on actual localhost:5173, including a repeat after regression testing.

## Files changed in this fix

- `vite.config.ts`
- `tests/developmentTransport.test.ts` (new)
- `scripts/verify-historical-browser.mjs`
- `scripts/verify-motion.mjs`
- `scripts/verify-language.mjs`
- `README.md`
- `docs/DEVELOPMENT_RUNTIME_FIX.md` (new)

No UI redesign, observation changes, new dependencies or matching-algorithm changes. Existing source/platform/processing separation and unknown-coverage limitations remain. These are thermal detections and exploratory associations, not confirmed fires or calibrated equivalence. No public deployment was tested.

## Exact Windows PowerShell restart

In the terminal currently running Vite, press **Ctrl+C**. A standalone port-3001 API is no longer required for development; there is no need to kill unrelated processes.

```powershell
Set-Location 'C:\Users\abood\Desktop\firepulse'
npm run dev -- --host 127.0.0.1 --port 5173 --strictPort --force
```

Open **http://localhost:5173/#mission-atlas**. Perform **Ctrl+Shift+R** once to discard the old page's failed imports; no session or observation data needs deleting. If port 5173 is already occupied, stop the existing Vite terminal first rather than accepting a different port.

Optional same-origin PowerShell check:

```powershell
$northManifest = Invoke-RestMethod 'http://localhost:5173/api/observations?mode=northern-jordan&manifest=1'
$northManifest.metadata.totalDelivered  # 6859
$northYear = Invoke-RestMethod 'http://localhost:5173/api/observations?mode=northern-jordan&year=2026'
$northYear.features.Count              # 803
```

To repeat browser acceptance while that dev server is running:

```powershell
node scripts/verify-historical-browser.mjs --dev-existing
```

The helper requires the installed Windows Chrome path already used by the repository's browser tests. Its temporary profile is separate from the user's normal browser profile.
