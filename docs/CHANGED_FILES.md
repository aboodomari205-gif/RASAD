# Exact completion-sprint file changes

Baseline: `.checkpoints/completion-20261111-213252/`. No dependencies were added; root package scripts changed. No dataset, environment file, texture, boundary geometry or credential file was edited/committed. Source snapshots exclude datasets/secrets.

## Added

- `src/components/AnalysisBoundary.tsx` ? recoverable analysis/calendar fallback.
- `src/state/MissionContext.tsx`
- `src/state/mission.ts`
- `src/intelligence/IntelligenceWorkspace.tsx`
- `src/intelligence/intelligence.css`
- `src/intelligence/useMissionData.ts`
- `shared/analytics.ts`
- `server/app.js`
- `server/app.test.js`
- `api/[...path].js`
- `vercel.json`
- `.vercelignore`
- `scripts/verify-filters.mjs`
- `scripts/verify-release.mjs`
- `scripts/verify-deployment.mjs`
- `tests/analytics.test.ts`
- `docs/COMPLETION_TRACKER.md`
- `docs/INTERACTION_AUDIT.md`
- `docs/METHODOLOGY.md`
- `docs/SENSOR_DIFFERENCES.md`
- `docs/DATA_PROVENANCE.md`
- `docs/KNOWN_LIMITATIONS.md`
- `docs/DEPLOYMENT.md`
- `docs/DEMO_AND_SUBMISSION.md`
- `docs/CHANGED_FILES.md`

## Modified

- `src/main.tsx` — shared mission provider.
- `src/App.tsx` — lazy intelligence routing, retained map and hash navigation.
- `src/FireMap.tsx` — shared filters, range/FRP integration, provenance rendering and calendar camera handoff fix; worker initialization unchanged.
- `src/components/AtlasFilters.tsx` — UTC/FRP inputs, safe validation and source-aware notice.
- `src/components/AtlasTimeline.tsx` — custom-range selected semantics.
- `src/components/MissionUI.tsx` — functional index destinations and metadata, remove obsolete preview-only panels.
- `src/calendar/BurningCalendar.tsx` — shared scope/selection/metric and explicit inherited-filter clearing.
- `src/data/intelligence.ts` — typed FRP query parameters.
- `src/design/atlas.css` — bounded scrolling/filter form styles within the existing visual system.
- `shared/model.ts` — optional FRP filter bounds.
- `shared/observations.ts` — shared FRP validation/filtering and uppercase ALL handling.
- `server/index.js` — thin local listener using the reusable app.
- `server/observations.js` — additive validated FRP query support.
- `scripts/verify-motion.mjs` — isolated app server and expanded analytics/export/keyboard/browser checks.
- `package.json` — QA/release script aliases.
- `.gitignore` — environment/SQLite/Vercel-local artifacts excluded.
- `README.md`
- `DATA_FOUNDATION.md`
- `ARCHIVE_INGESTION.md`

## Preserved and checked

Byte comparisons against the baseline confirmed unchanged EarthLanding/EarthScene/landing CSS, map camera/signal helper, calendar aggregation, archive parser/store/importer. The bundled MapLibre worker filename is unchanged. No claim of unchanged full Map source is made: the narrow integration changes above were required.
