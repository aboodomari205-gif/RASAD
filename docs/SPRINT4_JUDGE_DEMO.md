# Sprint 4 — Sensor Agreement Lab and guided demonstration

Implemented in the existing repository, 13 November 2026. No deployment, upload, release ZIP, dependency installation, backend contract change or dataset change was performed.

## Judge-visible workflow

Enter the mission, open **Index → Evidence Engine**, and choose **Start guided demonstration**. Starting or restarting explicitly selects the full Ajloun archive and resets exploratory thresholds to 1 km / 60 minutes. The guide is self-paced (approximately 90 seconds), not a timed slideshow or synthetic loader.

1. **Problem:** different sensor sampling and non-interchangeable raw counts/confidence.
2. **Real observations:** actual scope counts (full Ajloun: 5 MODIS, 31 VIIRS); inspect an original record in Atlas. Return through Index → Evidence Engine; the step is retained for this browser session.
3. **Harmonization:** focus the actual candidate edge/source inspector. Advancing after inspecting a single observation restores the full demonstration scope.
4. **Sensitivity:** select one of five spatial/UTC settings. The existing candidate pairs, unique observation counts, connected groups and provenance update using the actual records. The original user-editable controls and pinned-reference explorer remain available.
5. **Evidence verdict:** focus the coverage/sufficiency gate and read the reason for each supported, provisional or unavailable claim.
6. **Export:** download the scientific comparison JSON with selected thresholds, original observations, source datasets, methodology, complete graph, sensitivity series and caveats.

Back, Next, Exit and Restart are functional. Exit restores focus to the launch button. Targets receive keyboard focus. Arabic, RTL, mobile layout and the application's reduced-motion policy are retained. No map reinitialization was added.

## Scientific implementation

`shared/agreement.ts` reuses `associateSensors` from `shared/evidence.ts`; it does not replace or recalibrate the existing matcher. The 1 km / 60 minute setting remains explicitly exploratory.

The comparative visualization evaluates 0.25 km / 6 min, 0.5 km / 7 min, 1 km / 7 min, 1 km / 60 min and 2 km / 120 min. The same count scale is used for three separately labeled quantities; the scale is not fire intensity. Selecting a setting changes the actual matching controls, with an accessible pressed state.

The gate distinguishes delivered-record descriptions, provisional cross-sensor associations, and source-separated multi-year descriptions. Historical eligibility requires at least two observed years within the same region, sensor, platform, dataset, source and provenance grouping. This is a conservative software screen, not scientific sufficiency for trend estimation. Partial collections are provisional; error/unavailable/fixture collections cannot support real-data claims. Exact UTC and compatible processing are required for associations. An availability flag alone cannot establish scoped verified-zero coverage.

The reproducible brief has schema `firepulse.scientific-comparison/v1`. Canonical observations and source datasets are sorted by ID; no wall-clock timestamp or random value enters the comparison payload. Identical canonical IDs are deduplicated, conflicting identities are rejected. Original confidence and provenance are retained. The existing broader evidence JSON also includes this comparison payload; the existing readable brief remains available.

## Validation

- `npm run build`: passed; existing large-bundle advisory remains.
- `npm run lint`: passed.
- `npm test`: **81 passed, 0 failed**, including existing backend tests and four new deterministic scientific test cases.
- `npm run test:e2e`: passed, including cinematic entry/fallbacks, map interactions, Calendar, existing analytics and error recovery.
- `npm run test:language`: passed, including actual Arabic content and real Ajloun observations.
- `npm run verify:release`: passed. This is a local asset/configuration check, not a public deployment check.
- Static archive browser verification: executed against `.checkpoints/sprint4-static`, with no Express process. Includes all six guide steps, real map/source handoff, thresholds, gate, exported JSON contents, back/restart/exit, focus, Arabic mobile and existing region round-trips.
- Actual desktop and Arabic mobile screenshots were inspected. The sensitivity chart was refined to a shared aligned plot with an explicit selected-setting state.

New deterministic tests cover inclusive time boundaries and transitive groups, repeated observations, unavailable/partial/fixture states, missing timestamps, incompatible processing, incomparable historical sources, conservative zero/anomaly gating, order-independent export, raw confidence/source preservation, and conflicting IDs. Existing Sprint 3 tests continue to cover spatial boundaries and region reconciliation.

## Local opening and verification

From the repository root, without Express or secrets:

```powershell
node deployment/cloudflare/build-static.mjs .checkpoints/sprint4-static
node deployment/cloudflare/serve-static.mjs .checkpoints/sprint4-static
```

Open **http://127.0.0.1:5179**, enter the mission, then **Index → Evidence Engine → Start guided demonstration**. The generated directory is local test output, not a prepared release. Stop the server before running the browser verifier, which starts its own server:

```powershell
node scripts/verify-static-archives.mjs .checkpoints/sprint4-static
```

The ordinary development workflow remains `node server/index.js` and `npm run dev` in separate terminals. No environment-file edits are required for the archive demonstration.

## Exact changed files

Added:

- `shared/agreement.ts`
- `src/intelligence/AgreementLab.tsx`
- `src/intelligence/JudgeGuide.tsx`
- `src/intelligence/agreement.css`
- `tests/agreement.test.ts`
- `scripts/verify-judge-guide.mjs`
- `docs/SPRINT4_JUDGE_DEMO.md`

Modified:

- `src/intelligence/EvidenceEngine.tsx`
- `src/intelligence/IntelligenceWorkspace.tsx`
- `src/i18n/evidence-ar.ts`
- `scripts/verify-region-sensitivity.mjs`
- `scripts/verify-static-archives.mjs`
- `deployment/cloudflare/build-static.mjs` — optional restricted local test-output argument; default release behavior retained.
- `deployment/cloudflare/serve-static.mjs` — optional static test-root argument.

Source checkpoint: `.checkpoints/sprint4-before/`. Build outputs and verification logs/screenshots are generated locally in `dist/` and `.checkpoints/`; release ZIPs were not created or modified.

## Remaining scientific limitations

Acquisition coverage is unknown. No verified-zero activity, independently confirmed fires, sensor failure, normalized cross-sensor intensity, calibrated confidence conversion or validated anomaly is inferred. Candidate edges are many-to-many; connected components can contain transitive endpoints outside direct matching thresholds and are not independent events. The matcher retains its bounded computation limits; large requests can require a narrower observation scope. The current real archive remains 36 Ajloun detections, not complete satellite acquisition coverage. Brazil stays a labeled fixture excluded from scientific matching. No independent scientific calibration, NASA endorsement or public deployment validation is claimed.
