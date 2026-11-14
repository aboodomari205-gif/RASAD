# Deployment acceptance checklist

Audit date: 2026-11-13. **Current configuration: NO-GO.** This checklist authorizes no deployment, account creation, data import or public release. See PRODUCTION_READINESS_AUDIT.md for measured evidence and DEPLOYMENT_ARCHITECTURE.md for the two explicit hosting choices.

## Gates before any future deployment

- [ ] Fix the confirmed Arabic 320 px map popup/editorial-title overlap and inspect screenshots; functional source/popup assertions alone do not prove readability.
- [ ] Choose static scientific website versus full REST API explicitly. Do not advertise absent APIs in the static variant.
- [ ] Confirm provider/account terms, limits, supported Node version and any applicable submission URL requirements independently. No free-tier guarantee or official submission-rule verification is supplied here.
- [ ] For full Vercel API: fix the conflicting .vercelignore / Function data exclusions with an exact private generation allowlist. Include pointer, SQLite, activation report, both summary JSONs and required geometry/code/dependencies. Prove they exist in the actual Function output.
- [ ] For full Vercel API: resolve the measured 10,474,730-byte broad North response through a documented complete pagination/narrow-scope contract and byte limits. Exercise every alias/resource. Never truncate silently.
- [ ] For static website: use the archive-static build, not ordinary dist, and align exampleYears with the active report pointer. Add a revision/hash generation consistency gate. Configure immutable data caching safely across frontend updates.
- [ ] Replace stale scripts/verify-deployment.mjs Northern Jordan zero/fixture assertions with real activated manifest/year/isolation checks. Do not run its current form and claim activation success.
- [ ] Produce/review the actual provider build output locally when tooling is deliberately supplied; no Vercel CLI is installed here. Confirm shared TypeScript, node:sqlite, dynamic file tracing, Node version and total Function size. Local Windows runtime success is insufficient proof.
- [ ] Exclude original ZIPs/CSVs, unused SQLite generations, journals, large audit reports, checkpoints, old releases, secret/tool-state directories and private machine-path documentation from uploads. Scan only an allowlisted staging artifact, without reading secret files.
- [ ] Keep the NASA live key route disabled/unconfigured unless needed; historical observations require no credential. Add API complexity/rate controls if publishing Node endpoints.
- [ ] Keep region IDs, source provenance, standard/NRT separation and unknown acquisition coverage unchanged. Retain unresolved NOAA lineage disclosures and disabled unsupported scores.

## Reproduce local production checks

Prerequisite: existing installed dependencies and Chrome at the path used by the browser scripts. No dependency installation is part of this audit.

```powershell
npm run build
npm run lint
npm test
```

In PowerShell terminal A, start the actual API export and built frontend independently of Vite. Pass only conventional OS variables to a Node process, plus NODE_ENV=production; no .env or application secrets are needed. The audit runner under .checkpoints/run-production-audit.mjs demonstrates that sanitized environment. To start directly in an already clean environment:

```powershell
node scripts/serve-production-audit.mjs
```

In terminal B:

```powershell
node scripts/verify-production-audit.mjs
node scripts/verify-claim-audit.mjs --origin http://127.0.0.1:5187 --refresh
node scripts/verify-historical-explorer.mjs --origin http://127.0.0.1:5187
npm run verify:release
```

Open http://127.0.0.1:5187/#mission-atlas for visual review. This is a local simulation, not Vercel emulation. Use Ctrl+C in terminal A afterward. The local server binds loopback and exposes dist plus API only.

The separate immutable static experiment builds into an isolated checkpoint directory and launches/stops its own local static server:

```powershell
node scripts/verify-production-static.mjs
```

It exercises real archive-data manifests and UTC shards on port 5179 without Express. Do not run multiple Chrome regression scripts concurrently: they share a debugging port. The script creates no release ZIP or public output.

For existing development browser regressions, keep `npm run dev` running on http://localhost:5173, then sequentially run:

```powershell
npm run test:e2e
npm run test:language
node scripts/audit-scientific-data.mjs
python scripts/verify-scientific-independent.py
```

Legacy E2E/language tests use their controlled pilot fixture; production/archive browser checks separately use current activated history. No original observation is replaced by those tests.

## Scientific acceptance assertions

- [ ] Ajloun manifest total 143, North 6859; every advertised year's actual feature count sums to its region total. No duplicate IDs within a region. Ajloun is a subset: never add both totals.
- [ ] Default 2026 map views 10 and 803; switch regions and 2021/2026 without stale timelines or source errors. North 2021 contains 591 delivered observations, not complete coverage.
- [ ] Ajloun 2023 guide scope 22: 2 MODIS and 20 VIIRS. Map source coordinates/IDs and popup correspond to actual records. Basemap changes preserve map canvas and selection.
- [ ] Ajloun July 2023 Calendar 18 monthly records; July 14 2 MODIS / 11 VIIRS. Monthly CSV contains 18 rows with identity, UTC and provenance, not synthesized missing days.
- [ ] Evidence 1 km/60 min = 12 candidate edges, 13 participating IDs, 1 connected group; 1 km/7 min = 5/6/1. Groups are not independent events.
- [ ] Research JSON at the latter setting includes 22 observations and five edges, original source metadata, unvalidated methodology and null unsupported median/anomaly outputs. No internal absolute filesystem paths or credentials.
- [ ] English/Arabic RTL and 320/390 px controls work; separately verify popup metadata is not obscured by editorial text (currently an open defect); refresh/deep link loads the built app and correct scope. Intro re-entry after refresh is existing behavior, not data loss.
- [ ] Database SHA256 remains b1e19d095190b7c6116a284080a87cd702c0927260f183d85ff9ef1a1747533e. Revision remains f3cb30006dd2f0ff02df206024189da7757d40cd02e6708c2e5374f03a73910f. Source ZIP hashes unchanged.

## Executed results

| Check | Result |
|---|---|
| npm run build | PASS; existing >500 kB chunk warnings remain |
| npm run lint | PASS |
| npm test | PASS: 114 tests, zero failed/skipped |
| Real production API/SPA/assets, all advertised years, filters and response path scan | PASS |
| Current-data production claim/demo browser | PASS |
| Production historical explorer / map / region / sensor / responsive browser | PASS |
| Static-only generated data and browser | PASS |
| npm run test:e2e | PASS |
| npm run test:language | PASS |
| npm run verify:release | PASS; not public deployment verification |
| Read-only scientific audit and independent Python check | PASS |

Exact command exits: .checkpoints/production-acceptance.json and production-regressions.json. HTTP bytes/timings/hash: production-http.json. Static build/browser logs: production-static-build.log and production-static-browser.log. Early harness failures were corrected; browser list waits preserve actual assertions. The final acceptance log identifies the refresh-enabled command.

## Future post-deployment and rollback checks — NOT executed

After a separately authorized deployment, test its actual HTTPS URL, deep links, assets/worker, missing JSON behavior, all manifests/shards, exact revision/counts, export reproducibility and source caveats. Exercise a real cold invocation and response-size failures, confirm there is no server-side write/import surface, and verify no private artifact is publicly addressable. Do not label these checks passed from localhost results.

Rollback must restore one complete frontend/data generation and its hash manifest; verify totals and the same candidate/export results. Do not roll back a pointer without its database/report/summaries. Keep the prior artifact privately; no new package or deployment was produced here.

