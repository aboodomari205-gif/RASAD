# Core alignment and final closure

13 November 2026. **GO for a locally demonstrated, honestly scoped prototype submission, subject to owner verification of actual submission rules and deliverables.** This is not certification of scientific calibration or full official-rule compliance. No publication, deployment, release ZIP, dependency installation or source NASA-observation modification was performed.

## Implemented closure

The existing Burning Calendar now treats shared `sensor:all` as **Both sources / separate contributions**. It reuses canonical normalization/filtering and existing UTC daily aggregation independently for MODIS and VIIRS. Individual modes remain available. Calendar dates use the union of delivered source dates, while each cell and daily detail retains separate source contributions. No combined equivalent-fire count, shared severity scale or cross-sensor FRP total is introduced.

Missing contributions remain unknown unless explicit complete scoped coverage supports a source-specific verified zero. A day observed by one source does not establish coverage for the other. Same-day observations are explicitly not asserted to be simultaneous or the same fire. Both-source details contain separate panels and source-specific Atlas handoffs with unique DOM identifiers. The keyboard grid always retains an entry tab stop when the displayed month changes.

Direct **Download displayed month CSV** exports filtered original observation rows for the visible month, not all dates in the archive. The observation-level table avoids ambiguous cross-source daily totals: each delivered record has `reported_count=1`; users can group by UTC date/source without treating that as sensor-equivalent activity. No empty-date or missing-source zero rows are fabricated. A header-only CSV represents no delivered rows within that scope, not verified zero activity.

CSV fields: UTC date, sensor, platform, dataset ID, product, original product version, processing, availability state, source, canonical observation ID, exact UTC acquisition/precision, original confidence and scheme, nullable reported FRP in MW, reporting status, reported count, per-record FRP completeness, observed status, unknown coverage, fixture flag and exact scope JSON (including displayed month). Rows sort by canonical ID; missing FRP is blank with explicit missing status, while genuinely reported FRP zero remains zero. Quoting and spreadsheet-formula protection are applied. Existing scientific JSON and other exports remain unchanged.

## Real evidence and scientific boundary

- **36 real Ajloun observations: 5 MODIS / 31 VIIRS.** Observed-date extent **2020-08-02 through 2025-10-18**, not continuous coverage.
- Actual delivery families: MODIS Collection 6.1 / MCD14ML and VIIRS S-NPP Collection 2 / VNP14IMGTML.
- Exploratory 1 km / 60 min: **5 candidate edges, 6 participating observations, 1 connected group**.
- Existing five tested configurations: **9 union edges, 0 stable across all five**. These results are neither probabilities nor validated event counts.
- Original timestamps, raw confidence, platform, source, dataset/product metadata and opaque version/channel fields are retained. No calibrated equivalence, confirmed fires, historical median, verified anomalies or complete coverage is claimed.
- Brazil is a synthetic development fixture, not NASA scientific evidence or Ajloun data. It remains isolated and excluded from scientific matching.
- Historical archive hashes remain in audit documents. Their bytes were not rechecked or bound to frontend/export provenance in this closure; Research Brief continues to report missing checksum metadata honestly.

## Executed acceptance

| Command | Executed result |
| --- | --- |
| `npm run build` | PASS; existing large-chunk advisory remains |
| `npm run lint` | PASS, clean final run |
| `npm test` | PASS: **89 tests, 0 failures** |
| `npm run test:e2e` | PASS |
| `npm run test:language` | PASS |
| `npm run verify:release` | PASS local asset/configuration checks |
| `node deployment/cloudflare/build-static.mjs .checkpoints/final-closure-static` | PASS; local test assets only |
| `node scripts/verify-static-archives.mjs .checkpoints/final-closure-static --audit --after` | PASS; plain static server, no Express |

Logs are `.checkpoints/closure-build.log`, `closure-tests.log`, `closure-e2e.log`, `closure-language.log`, `closure-static-build.log` and `closure-browser.log`. Some redirected Vite warnings appear as PowerShell native-error formatting; explicit final build exit codes were zero. They are advisory chunk-size output, not a hidden failed compilation.

Three new unit/backend-suite tests cover source-separated UTC date union, midnight, canonical duplicate handling, missing dates, null versus zero FRP, partial/unknown availability, deterministic CSV scope filtering, source isolation, and real Ajloun totals/ID round-trip across every observed month. Existing scientific tests remain intact.

New browser acceptance verifies October 2020's separate **1 MODIS / 1 VIIRS** contributions, CSV parser round-trip and distinct source IDs, repeated-export equality, all/MODIS/VIIRS transitions, two daily source panels, Arabic mobile overflow and source-specific MODIS Atlas handoff. Existing suites retain region round-trips, date/quality reset, keyboard, basemap, timeline, cinematic entry/fallbacks, matching/sensitivity, guide and research exports. The production audit visits all nine routes in desktop and Arabic mobile.

Two initial regressions were corrected and rerun: the old single-sensor browser test now explicitly selects VIIRS before asserting its original exact counts/FRP, and the combined cell uses the established Arabic “coverage not verified” wording. Existing exact assertions were preserved rather than weakened. Arabic mobile combined-calendar screenshot: `.checkpoints/closure-calendar-ar.png`; production route screenshots are refreshed under `.checkpoints/sprint6-desktop-*` and `sprint6-ar-mobile-*`.

## Exact changed files

Application/data presentation:

- `src/calendar/BurningCalendar.tsx`
- `src/calendar/CalendarDayDetails.tsx`
- `src/calendar/calendar.css`
- `src/calendar/combined.ts` — added deterministic scoped CSV utility.
- `src/i18n/evidence-ar.ts`

Tests and verification:

- `tests/calendarCSV.test.ts` — added.
- `scripts/verify-combined-calendar.mjs` — added.
- `scripts/verify-motion.mjs` — explicit single-sensor selection, unchanged exact value assertions.
- `scripts/verify-region-sensitivity.mjs` — combined-mode browser acceptance and scope restoration.

Documentation:

- `README.md`
- `docs/DATA_PROVENANCE.md`
- `docs/KNOWN_LIMITATIONS.md`
- `docs/SENSOR_DIFFERENCES.md`
- `docs/DEMO_AND_SUBMISSION.md`
- `docs/NASA_PRODUCT_VERIFICATION.md` — authoritative current status with superseded historical audit explicitly retained.
- `docs/SUBMISSION_STORY.md` — added 30-second pitch and 90-second calendar-first rehearsal.
- `docs/SUBMISSION_REQUIREMENTS_CHECKLIST.md` — added supplied core objectives versus examples/suggestions and unverified official rules.
- `docs/FINAL_CLOSURE_REPORT.md` — this report.

Reversible checkpoint: `.checkpoints/final-closure-before/`. Generated `dist/` and `.checkpoints/final-closure-static/` assets are local acceptance output, not a prepared release. No backend contracts, original archives, cinematic intro, MapLibre worker setup or scientific matching algorithms were changed.

## Exact local demonstration

From the repository root with existing dependencies:

```powershell
node deployment/cloudflare/build-static.mjs .checkpoints/final-closure-static
node deployment/cloudflare/serve-static.mjs .checkpoints/final-closure-static
```

Open **http://127.0.0.1:5179**. Enter Mission → Index → Burning Calendar → **Both sources / separate contributions**. Choose **October 2020**, inspect October 24 and the two original source contributions, download the displayed-month CSV, then open either source's day in Atlas. Continue through Evidence Engine / GUIDED DEMO. Starting the guide restores the full Ajloun scope and default exploratory thresholds. Use [submission story](SUBMISSION_STORY.md) for the short presentation. Stop the manual server before running the browser verifier, which starts its own server on port 5179.

## Remaining owner acceptance and stop condition

1. Detailed official submission rules, actual deadline/time zone, required platform scope, project/team fields and presentation assets must be verified through an accessible official channel. Supplied scientific objectives are distinguished from still-unverified rules in [the checklist](SUBMISSION_REQUIREMENTS_CHECKLIST.md).
2. A human 30/90-second novice rehearsal and physical-device/screen-reader/target-browser acceptance are not established by automated Chromium checks.
3. Source-delivery integrity, acquisition coverage, independent event evidence and validated baselines remain external scientific dependencies. Do not conceal them or start a hurried normalization/anomaly feature to fill the gap.
4. No public URL, hosted persistence, deployment success or NASA endorsement was verified. If a public URL is later submitted by the owner, test it separately.

**GO:** demonstrate and submit the bounded regional calendar/traceability prototype with these limitations disclosed after owner acceptance of actual official rules. **NO-GO:** represent it as calibrated sensor-equivalent fire history, complete coverage or operationally validated fire intelligence. Local engineering acceptance closes this implementation slice; further feature development is not required to replace missing external evidence.
