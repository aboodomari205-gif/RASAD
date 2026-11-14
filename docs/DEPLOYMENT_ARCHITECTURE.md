# Deployment architecture and implementation plan

Status: local audit/proposal, 2026-11-13. No hosting configuration was changed or cloud resource created. Current Vercel deployment is NO-GO until the gates below pass. No free-tier availability, capacity or cost guarantee is made; verify the account's current conditions before any future deployment.

## Recommended choice

**Judge-facing scientific web experience:** immutable static snapshot, using the existing archive-static transport and all current client analytics. This is the lowest operational burden: no database server, API cold starts, persistent writes or NASA credential at runtime. Local build and browser experiment passed against the complete activated history, not a reduced pilot. Vercel static hosting or the previously designed static Cloudflare hosting can serve such an artifact; neither was deployed here.

**Full application including the documented REST API:** static Vite frontend plus existing Vercel Node Function reading an explicitly bundled immutable SQLite generation. This is feasible in principle at the current data size and avoids a new paid database/migration, but needs actual function tracing/runtime verification and bounded API responses. If a working unchanged full REST API is mandatory immediately, use a conventional Node host with read-only scientific data mounted persistently; do not pretend the existing Vercel config already supplies it. Host cost/free availability is not established.

Do not use Edge runtime for node:sqlite, a writable Function filesystem for imports, or an unversioned remote mutable JSON blob as the authoritative archive.

## Option A — static scientific website

Existing local experiment command:

```powershell
node scripts/verify-production-static.mjs
```

This builds into .checkpoints/production-static-audit and checks the browser without Express. It is a local audit output, not an approved release. Build-time Node reads the verified SQLite and serializes region manifests, UTC-year GeoJSON shards and source-separated summaries. Client-side filtering, CSV, associations, coverage gates and Research Brief work from these immutable inputs. No runtime environment variable or API key is required.

Required changes before future hosting:

1. Make the static builder read exampleYears from active-history.json's reportFile rather than the legacy report filename; validate report/summary revision consistency and all source IDs. Refuse absent/mixed generations.
2. Define a clean static build command/output directory explicitly in the chosen host configuration. Do not use ordinary npm run build and expect archive-data to appear. Do not merely point Vercel at the existing unrelated releases tree.
3. For this variant, remove/disable Node function discovery through an explicit reviewed build/source layout and replace API rewrites with static archive routing. This is a deployment variant, not removal of the repository's backend.
4. Serve /assets, /earth, boundary GeoJSON and /archive-data files before the SPA fallback. Hash routes (/#mission-atlas) need only index.html; clean deep paths need index fallback. Missing JSON must be a real 404, never index.html with HTTP 200.
5. Generate a machine-readable release manifest recording DB SHA256, activation revision, pointer/report/summary and public-file hashes. Use an atomic immutable build; avoid mutable same-URL caches across mixed generations. Either version archive URLs or apply revalidation/no-cache policy to manifests and non-hashed shards; hashed JS/assets may be immutable.
6. Allowlist only generated static output for upload. Do not upload SQLite, source ZIP/CSV, audit JSON, logs, scripts, machine-path docs or checkpoints.

Limitation: this is the complete current web demonstration, **not** a substitute implementation of /api/history or /api/hotspots. Integrators requiring those endpoints need Option B. The temporary local static file server does not implement clean-path SPA fallback; configure it explicitly on the future host.

## Option B — Vercel Node Function plus immutable SQLite

Keep the existing catch-all API handler and same-origin frontend contract. No production standalone listen process is needed on Vercel. Build/install are conceptually:

```powershell
npm ci
npm --prefix server ci
npm run build
```

No dependency installation was performed by this audit. Pin a supported, tested Node major in package/project settings; local execution here is v26.13.0. Re-run all checks if selecting another supported major. The server imports shared .ts files and node:sqlite, so inspect the actual Linux Function build output and run it locally before accepting provider compatibility.

Required data allowlist, outside public/dist:

- server/data/active-history.json;
- exactly its referenced history-f3cb30006dd2f0ff.sqlite;
- exactly its reportFile JSON;
- both region summary JSON files matching its summaryPrefix;
- any explicitly needed boundary GeoJSON, server/shared code and traced production dependencies.

Do not allowlist server/data/** broadly. Current .vercelignore and Function excludeFiles prevent the required files from entering the build. A future change must reconcile upload exclusions AND function include/exclude rules, or stage the reviewed generation into a private explicit runtime path with a correspondingly reviewed loader. Keeping filenames stable relative to import.meta.url is the minimum-change route. Do not copy old SQLite generations, WAL/SHM journals, raw ZIP/CSV or imports into the Function. Assert journal consistency/read-only reopening and matching hashes without mutating the source database.

The measured SQLite is 23,465,984 bytes. Include production dependencies and runtime-layer overhead in the actual uncompressed Function size; do not use this file size as a bundle-size measurement. Configure all required JSON through explicit includes because dynamic URLs may not trace automatically. Verify vercel.json function schema and routing in an actual local Vercel build when the tooling/account prerequisites are intentionally provided. That build was not run here.

### API byte and computational bounds

Before publishing the full API, add deterministic pagination or an explicit required narrow scope plus a byte-safe response limit. Preserve whole-query scientific meaning: never silently truncate records or change a successful response into an incomplete collection. Document page ordering and snapshot revision, retain IDs and expose a continuation contract if pagination is selected. Test all history/intelligence aliases, aggregates and comparison response sizes, not just map-year shards.

The measured unrestricted North canonical response is 10,474,730 bytes; a 50,000-observation count limit is insufficient to enforce a 4.5 MB provider response ceiling. The optional proxy's 8 MiB upstream cap is also not a safe Vercel output bound. Standard buffered res.json cannot be assumed to bypass that limit. Streaming would require a reviewed transport/contract change and offers no scientific benefit for the current bounded UI.

Add request rate/complexity controls for public broad queries. Keep existing parameterized SQL, safe filenames, region allowlist, generic errors and unknown-coverage fields. Keep imports private/offline. No background importer should run in the Function.

### Environment and runtime configuration

| Name | Role | Required for historical demo? |
|---|---|---|
| NODE_ENV=production | Conventional runtime mode | Yes for ordinary Node hosting; provider manages production mode. |
| PORT | server/index.js listener only | No on Vercel; not a frontend variable. |
| FIREPULSE_DATA_API_ORIGIN | Optional trusted HTTPS persistent-service origin for server proxy | No for bundled SQLite or static variant. Set only with a real verified service; never invent one to hide unavailable data. |
| FIRMS_MAP_KEY | Optional live FIRMS /api/hotspots credential | No. Keep server-side and unset for archive-only demonstration. Never prefix with VITE_. |

No environment values or credentials were inspected or documented. Do not use a frontend build variable to embed a server credential. Same-origin API needs no production CORS permission; external browsers need an explicit reviewed origin allowlist if supported later.

### Node host fallback

On a conventional Node host, install both dependency trees, build Vite, run `node server/index.js` and serve dist with a reverse proxy. Route /api/* to the Node listener before static/SPA fallback. Mount the verified data read-only; store imports in a separate offline persistent workspace. TLS, restart policy, byte/CPU limits and a health check that verifies revision/counts are required. A process-only /api/health is insufficient. This alternative preserves current REST semantics but transfers operations/availability responsibility to the host operator.

## Reproducibility and rollback

Treat frontend, DB pointer, SQLite, report, summaries and provenance as one immutable version. Before future upload, compare SHA256 and 143/6859 totals, all year counts and source strata. Export scientific IDs/thresholds and raw source metadata; generatedAt/builtAt may differ, so reproducibility comparisons should normalize only presentation timestamps, never scientific inputs or outputs.

Keep the last known-good complete artifact in private controlled storage, with its hash manifest and source revision. Future rollback must restore the entire matching generation, not just index.html or active-history.json. Test rollback locally, including CSV and the Ajloun 2023 12/13/1 to 5/6/1 sensitivity result. No rollback/deployment was executed in this audit.

References: [Express support](https://vercel.com/docs/frameworks/backend/express), [Node runtime](https://vercel.com/docs/functions/runtimes/node-js), [filesystem constraints](https://vercel.com/docs/functions/runtimes), [Function limits](https://vercel.com/docs/functions/limitations), [Node versions](https://vercel.com/docs/functions/runtimes/node-js/node-js-versions), [project configuration](https://vercel.com/docs/project-configuration). Provider limits and account terms must be rechecked at implementation time.
