# Region reconciliation and harmonization sensitivity — 2026-11-12

## Implemented behavior

Mission Atlas, Burning Calendar and Intelligence share one region-transition reconciler. After the destination collection arrives, it retains compatible sensor, confidence, FRP, date and provenance choices, and clears choices incompatible with the destination. Dates wholly outside the destination's observed extent are cleared; partially overlapping windows and deliberately empty windows within the extent survive. Calendar month/day and season-year selections are reconciled too. Errors and unrelated regional responses do not reset scope. Ordinary filtering within a region does not trigger reconciliation.

The Evidence Engine now compares current spatial/UTC thresholds with a user-pinned reference over the same filtered observations. It reports candidate pairs, unique participating observation IDs, and connected association groups. Expand a group to inspect direct-edge distance/time deltas, original observations and sensor/dataset provenance; existing trace controls open the original observation in Atlas. The JSON evidence export includes both graphs and their methodology. The reference is an exploratory UI comparison, not a scientific baseline.

## Scientific definitions and limitations

- Matching retains the existing inclusive Haversine distance and absolute UTC time criteria. Bounds are `(0, 10] km` and `[0, 1440] minutes`.
- Eligible records require an exact valid timestamp, a non-fixture dataset, MODIS or VIIRS identity, and the same region and processing stage for each edge.
- Repeated identical canonical IDs count once; conflicting records sharing an ID are rejected. Separate source IDs remain separate observations. This does not establish that they are independent physical events.
- A connected group is a connected component of the many-to-many candidate graph. Transitive endpoints need not satisfy the direct matching thresholds. Neither pairs nor groups represent confirmed fires or independent events.
- Raw confidence, platform, product version and source provenance are preserved. No cross-sensor confidence conversion, calibration, event deduplication, sensor normalization or anomaly baseline is introduced.
- Coverage remains unknown. Zero qualifying candidate pairs is not proof of zero fire activity or complete acquisition coverage.
- The computation retains limits of 2,000,000 candidate comparisons and 10,000 pairs, rejecting oversized requests rather than silently truncating them. The UI shows up to 25 groups, with 100 edges/members per disclosure; export includes the full computed result.
- Current Ajloun archive: 36 detections, 5 MODIS and 31 VIIRS. At 1 km / 60 minutes: **5 candidate pairs, 6 unique participating observations, 1 connected group** (2 MODIS and 4 VIIRS). At 1 km / 7 minutes the same result survives; at 6 minutes there are no qualifying pairs. These are software results, not independent scientific validation.
- Brazil remains an explicitly labeled seven-record development fixture and is excluded from scientific association matching.

## Validation

Commands:

```powershell
npm test
npm run build
npm run lint
npm run test:e2e
npm run test:language
npm run verify:release
node deployment/cloudflare/build-static.mjs
node scripts/verify-static-archives.mjs
```

Unit/backend suite: **77 passed, zero failures**. New cases cover inclusive spatial/temporal boundaries, spatial and temporal transitivity, multiple disconnected components, duplicate observations/edges, missing timestamps, source provenance, region isolation, incompatible filters, and preservation of valid selections. Build and lint pass; Vite retains a large-chunk advisory.

Chrome regressions exercise Ajloun → Brazil → Ajloun separately through Atlas, Calendar and Sensor Intelligence, real point rendering/clicks, date/sensor changes and reset, street/satellite switching, shared analytics, sensitivity changes and pinning. Arabic checks assert actual Arabic text, 36 real Ajloun observations, both sensor families, translated metadata popups, RTL calendar keyboard navigation and language restoration. Reduced-motion and 390px mobile layout are covered. Desktop and Arabic mobile screenshots were inspected after correcting mobile metric layout.

Static verification runs a plain static server only, with no Express process, and checks `/archive-data/ajloun.json` and `/archive-data/brazil-test.json` plus rendered MapLibre observations. The existing `verify:release` command also checks legacy Function packaging safeguards; it is not evidence of a public deployment.

## Deployable release

- Static asset root: `releases/cloudflare-static-v4-final/`.
- ZIP: `releases/FIREPULSE-STATIC-WORKERS-v4.zip` (files at archive root, not a nested project directory).
- Archive snapshots: `/archive-data/ajloun.json` and `/archive-data/brazil-test.json`.
- The build-only transport adapter replaces the observation API URL in the production bundle. Source API contracts and backend code are unchanged.
- Upload as static Cloudflare Worker assets using the existing deployment process. No `_worker.js`, `_routes.json`, Express runtime, source archives, secrets or dependency folders are included.
- This is an immutable archive snapshot, not a live NASA service. Future data deliveries require rebuilding and redeploying the snapshot.
- The public deployment URL was **not tested or updated in this task**. Local static/browser validation does not establish public deployment success.

## Manual review after deployment

1. Open the public URL, enter the mission and confirm 36 Ajloun detections with 5 MODIS / 31 VIIRS when filters are reset.
2. Select MODIS and 2020-10-24; switch to Brazil from each of Atlas, Calendar and Intelligence. Incompatible filters should clear and the fixture label must remain visible.
3. Select VIIRS and 2026-11-08 in Brazil; return to Ajloun. VIIRS should survive, the incompatible date should clear, and 31 VIIRS detections should remain.
4. Open Evidence Engine with both sensors. Compare 1 km / 60 min with 6 min, pin the result, restore 60 min, and expand the group. Inspect deltas/provenance and trace an observation back to Atlas.
5. Switch to Arabic on mobile; inspect RTL labels, all three sensitivity metrics, keyboard focus and reduced-motion behavior.
6. Check both archive JSON URLs return JSON rather than an HTML fallback, and ensure the browser loads the bundled MapLibre worker.

## Exact source/configuration changes

Added:

- `shared/regionScope.ts`
- `src/intelligence/SensitivityExplorer.tsx`
- `src/intelligence/sensitivity.css`
- `tests/regionScope.test.ts`
- `scripts/verify-region-sensitivity.mjs`
- `docs/HARMONIZATION_SENSITIVITY.md`

Modified:

- `.oxlintrc.json` — exclude generated release/checkpoint/build artifacts from source lint.
- `shared/evidence.ts` — candidate graph components and unique observation summaries.
- `src/data/observations.ts` — notify shared scope when a collection loads/retries.
- `src/state/MissionContext.tsx` — central region-transition reconciliation.
- `src/FireMap.tsx` — retain valid scope instead of unconditionally resetting filters.
- `src/intelligence/IntelligenceWorkspace.tsx` — use shared region reconciliation.
- `src/intelligence/EvidenceEngine.tsx` — integrate explorer/reference/export.
- `src/i18n/evidence-ar.ts` — Arabic sensitivity labels and caveats.
- `tests/evidence.test.ts` — boundary, graph, repeated-ID and provenance regressions.
- `scripts/verify-language.mjs` — real Ajloun Arabic assertions and current module indices.
- `scripts/verify-motion.mjs` — activated-archive assertions replacing outdated empty-state expectations.
- `scripts/verify-real-archives.mjs` — shared region/sensitivity browser regressions.
- `scripts/verify-static-archives.mjs` — same regressions against static assets without Express.
- `deployment/cloudflare/build-static.mjs` — V4 release destination.
- `deployment/cloudflare/serve-static.mjs` — serve the final V4 asset root.

Reversible source checkpoint: `.checkpoints/sensitivity-20261112/`. No datasets, backend contracts, cinematic intro or MapLibre worker configuration were changed. No dependencies were added. No secrets were read or modified.
