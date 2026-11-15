# Active South America migration ? 2026-11-14

The active implementation and scientific status are governed by [NASA_ACCEPTANCE_MATRIX.md](NASA_ACCEPTANCE_MATRIX.md) and [FINAL_COMPLETION_REPORT.md](FINAL_COMPLETION_REPORT.md). Prior study-area reports and the tracker below are historical records, not active claims. Calibration is NOT_CALIBRATED; S-NPP history, opportunity inputs and independent validation remain missing.

---

# FIREPULSE completion tracker

Audit baseline: 2026-11-11. Source checkpoint `.checkpoints/completion-20261111-213252/` (no Git repository; no secrets/datasets copied). Baseline: 48 tests, lint and production build pass. Existing lazy Three/MapLibre bundle warnings remain.

**Current handoff:** implemented and locally verified; **not fully production/submission READY**. Actual Vercel deployment, durable hosted data, genuine Ajloun history/coverage and the explicitly listed human/device checks remain external/unverified. The first table records the original audit; the final status below supersedes it.

| Area | Audit status | Priority / acceptance criteria | Dependency |
| --- | --- | --- | --- |
| Earth / MapLibre lifecycle | COMPLETE | Preserve intro, workers, gestures, reduced motion and fallback; rerun CDP | Browser/WebGL |
| Mission Atlas | PARTIAL | Add real FRP/date-range filtering, shared state; preserve points/popups/basemaps | Existing observation API |
| Task 08 Calendar | COMPLETE / integration PARTIAL | Preserve tested daily aggregation; retain region/sensor/month/metric across navigation | Shared scope |
| Task 09 Foundation | COMPLETE | Reuse canonical IDs/filtering/provenance and aggregation; test additions | None |
| Task 10 Archive | COMPLETE software / data BLOCKED | Preserve streaming, SQLite, import CLI, rollback and 12 archive tests | Genuine Ajloun archives / durable hosting |
| Task 11 Season Clock | MISSING | Twelve selectable months, available years, separate sensors, FRP, drilldown, accessible table | Observations (fixture preview explicit) |
| Task 12 Sensor Intelligence | MISSING | Use existing comparison model; separate summaries/coverage/time, no false event matching | Comparable coverage unavailable |
| Task 13 Fire DNA | MISSING | Real historical annual/monthly descriptive fingerprint or explicit insufficiency; never fixture-derived | Multiple real archive years |
| Task 14 Anomaly | MISSING | Tested baseline eligibility engine; numerical score disabled without validated method and coverage | Validated baseline methodology/data |
| Task 15 Brief | MISSING | Real filtered summaries, source/time/limitations, CSV/copy/print and truthful unavailable states | Clipboard/print browser capabilities |
| Navigation / state | PARTIAL | One region/sensor/date/metric state, retained map; replace preview navigation | None |
| Task 16 Vercel | MISSING / external BLOCKED | Vite/static + credential-safe serverless Express entry, bounded upstream requests, verification script | No project authorization/CLI; persistent external data service |
| Tasks 17–18 QA/docs/demo | PARTIAL | Test all new modules and controls; publish method, interaction audit, walkthrough and blockers | Actual preview URL unavailable |

## Execution order

1. Audit/checkpoint/baseline; early Vercel review (done). Current Express binds a local listener, NASA fetch has no timeout and logs raw upstream errors. SQLite cannot be used as durable Vercel storage. No Vercel configuration/CLI/project is present.
2. Shared mission scope and canonical FRP filters; tested descriptive analytics and scientific eligibility gate.
3. Native-design seasonal/sensor/DNA/anomaly modules, calendar/map handoff and Decision Brief exports.
4. Reusable Express app, serverless adapter, production routing and external durable-service option.
5. Unit/backend/browser QA; fix defects, update interaction audit and scientific/deployment/demo documentation.

Status definitions: COMPLETE = implemented and acceptance checks passed; PARTIAL = functional subset or verification remaining; BLOCKED = external data/account/methodology required, not a fabricated success. No claim of NASA endorsement, predictive validity or live data connection.

## Final implementation status

| Area | Current classification | Evidence / remaining acceptance |
| --- | --- | --- |
| Earth / existing visual identity | COMPLETE locally | Landing/scene/CSS byte-unchanged; CDP texture, entry, skip, replay, keyboard, reduced motion and failure checks pass |
| Mission Atlas | COMPLETE for current data | Retained MapLibre/worker, explicit regions, basemaps, date/confidence/FRP filters, provenance and camera handoff; CDP and canonical tests |
| Task 08 Calendar | COMPLETE for current data | Native design preserved; shared region/sensor/metric/range, retained month/day, real UTC details and handoff; coverage stays unknown |
| Task 09 Foundation | COMPLETE software | Canonical IDs, scoped filters, raw sensor semantics, availability and source-separated aggregates reused; FRP tests added |
| Task 10 Archive | COMPLETE software / real delivery BLOCKED | Existing parser/store/importer byte-unchanged; 12 archive tests including 12,000 synthetic rows pass; actual delivery review still needed |
| Task 11 Clock | COMPLETE for available observations / real multi-year acceptance PARTIAL | Radial 12 months, actual years, multi-year selection, separate source table, FRP, keyboard month and Calendar drilldown. Fixture explicitly labeled; actual multiple archive-year UI not browser-tested |
| Task 12 Sensor Intelligence | COMPLETE descriptive view | Separate sensor/platform summaries, monthly/yearly source charts/tables, original confidence and footprint/acquisition caveats, unknown coverage, month drilldown. Calibration/overlap-event scoring unavailable by design |
| Task 13 Fire DNA | PARTIAL / historical data BLOCKED | Comparable real-series admission and temporal rendering implemented; fixture rejection and eligibility unit-tested, insufficient-data UI CDP-tested. Genuine historical rendered branch not demonstrated |
| Task 14 Anomaly | COMPLETE gated workflow / scoring BLOCKED | Transparent prerequisite engine with null baseline/score and disabled action; controlled synthetic tests. Independently validated scoring/full-window coverage not supplied |
| Task 15 Brief | COMPLETE locally | Actual scoped summaries and provenance, safe CSV, copy/fallback, print action and headless PDF; real OS print/save review remains manual |
| Navigation/state | COMPLETE locally | 8 working destinations, scope in current-tab session, module hash Back/Forward/refresh, retained map. Focused Chrome checks pass |
| Task 16 Deployment | PARTIAL / authorization and persistent hosting BLOCKED | Listener-free Express entry, Vercel config/exclusions, upstream timeout/sanitization, HTTPS persistent-service facade, release/deployment verifiers. No real preview or URL |
| Task 17 QA | PARTIAL acceptance | 58 unit/API tests, 27 backend subset, build/lint/release and both Chrome suites pass. Physical device/screen reader and specific future-data cases remain in interaction audit |
| Task 18 Documentation/demo | COMPLETE artifacts / submission external | Architecture, methodology, sensor/provenance/limitations, exact import/deployment actions, walkthrough and presentation script provided. No submission/deadline/deployment claim |

## Phase records and checkpoints

1. Audit/checkpoint/baseline complete: 48 initial tests, clean lint/build. Early Vercel blocker found before feature implementation.
2. Shared scientific integration complete: same UTC/region/sensor/data layer, FRP bounds and tested baseline/fingerprint/export utilities. Source snapshot `.checkpoints/completion-phase2/`.
3. Analytics complete for available/gated data: Season/Sensor/DNA/Anomaly use existing observations and conservative semantics. Snapshot `.checkpoints/completion-phase3-analytics/`.
4. Brief/navigation/state complete: actual exports, provenance, hash history and tab-session filters. Snapshot `.checkpoints/completion-phase4-brief-state/`.
5. Deployment preparation complete; public deployment blocked: Function-compatible app, safe upstream and persistent-service strategy. Snapshot `.checkpoints/completion-phase5-deployment/`.
6. Regression fixes verified: single-date header, hidden-map calendar camera handoff, custom-range All-date state, synchronous invalid-filter handling and hidden MapLibre control bleed. `AnalysisBoundary` additionally provides a tested reset/return fallback for oversized aggregation windows. Browser harness fixed to reacquire Map references after reload, use public `getData()` and explicitly settle/open inspector for retry assertions. Final QA source snapshot `.checkpoints/completion-phase6-qa/`.
7. Documentation/submission handoff prepared. Final source snapshot `.checkpoints/completion-phase7-handoff/`.

## Actual commands and results

- `npm test`: **58 passed**, no failures. Includes original tests and six new analytics/four new app tests.
- `npm --prefix server test`: **27 passed**, subset of the 58 (not an additional 27 independent tests).
- `npm run lint`: passed without warnings on the final checked code.
- `npm run build`: passed; existing large lazy Three/MapLibre chunk warnings remain.
- `node scripts/verify-release.mjs`: passed static asset/worker, server-client identifier separation and packaging checks; not a deployed-system certification.
- `node scripts/verify-motion.mjs`: full Chrome pass; existing Earth/Atlas/Calendar plus Season/Sensor/DNA-gate/Anomaly-gate/Brief/CSV/PDF/copy fallback and retry. Normal workflows have no unexpected exceptions; injected texture/no-WebGL failures and canceled/inspector-blocked requests are tracked separately in final diagnostics rather than mislabeled as normal operation.
- `node scripts/verify-filters.mjs`: passed real FRP keyboard input, invalid range retention, date synchronization, zoom/north/temporal focus, network retry, calendar clear, Back/Forward, non-default-module refresh, month-to-Atlas range/reset and intentionally oversized UTC scope recovery. The deliberate aggregation-range exception is distinguished from unexpected errors.
- `scripts/verify-deployment.mjs`: exercised against the isolated local HTTP server by the focused suite; **not run against a public URL** because none exists in this task. This does not validate Vercel routing/tracing.

Actual desktop/mobile Season renders were inspected from CDP screenshots. They retain the established typography/palette/layout primitives; the hidden-map attribution bleed found during review was fixed. Headless PDF output was generated in the system temporary directory; no screenshot/PDF artifact was fabricated or added as scientific evidence.

## Exact user/external actions

1. Restart an older local backend to load the reusable app (existing user process on 3001 was left untouched).
2. Obtain/review genuine MODIS/VIIRS Ajloun archives, import with the documented Task 10 commands, review reports, then explicitly activate. Obtain validated coverage before stronger historical interpretation.
3. Provision a durable observation service/volume or managed adapter; configure the server-only HTTPS origin. Local data is intentionally excluded from Vercel artifacts.
4. Authorize/link a Vercel project, select Node 24.x, configure server-side variable names, create an actual preview, then run the deployment verifier and browser checklist. No credential values should be pasted into source or this handoff.
5. Complete remaining human/device checks in [INTERACTION_AUDIT.md](INTERACTION_AUDIT.md) and scientific review before claiming complete production/submission readiness.

Exact file changes: [CHANGED_FILES.md](CHANGED_FILES.md). Scientific limits: [KNOWN_LIMITATIONS.md](KNOWN_LIMITATIONS.md). Presentation: [DEMO_AND_SUBMISSION.md](DEMO_AND_SUBMISSION.md).
