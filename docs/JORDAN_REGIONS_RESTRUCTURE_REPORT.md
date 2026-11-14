# Jordan regions restructure

13 November 2026. Implemented in the existing repository. **Ajloun and Northern Jordan are the only active selectable observation regions.** No observations were imported, rewritten or downloaded; no deployment, publication, Git push or release packaging was performed.

## Geographic definitions and provenance

- **Ajloun Governorate** (`ajloun`): the existing `shapeName=Ajloun`, ADM1 feature in `public/jordan-adm1.geojson`, preserved unchanged.
- **Northern Jordan** (`northern-jordan`): the dissolved geometric union of Irbid, Ajloun, Jerash and Mafraq from that same ADM1 collection. It is a project-defined grouping of governorates, not an asserted separate legal administrative unit.

The existing features match geoBoundaries boundary ID **JOR-ADM1-50493656**, with 12 Jordan governorates, boundary year **2006**, source **geoBoundaries / Wikimedia**, license **Creative Commons Attribution 2.5 Generic**. The official geoBoundaries metadata endpoint was retrieved during this task and matches the existing shapeID prefix, governorate names, ADM1 level and JOR grouping. This is documented generalized administrative geometry, not a claim of survey precision or independently verified 2026 boundary currency.

- [Source metadata](https://www.geoboundaries.org/api/current/gbOpen/JOR/ADM1/)
- [Pinned source revision supplied by metadata](https://github.com/wmgeolab/geoBoundaries/raw/9469f09/releaseData/gbOpen/JOR/ADM1/geoBoundaries-JOR-ADM1.geojson)
- Attribution: geoBoundaries, Wikimedia; CC BY 2.5. Preserve this attribution with derived geometry.

Source CRS is `urn:ogc:def:crs:OGC:1.3:CRS84`: WGS84 longitude, latitude. All four members come from the same source/vintage/admin level; no bounding-box approximation or incompatible boundary dataset was introduced.

`scripts/build-northern-boundary.mjs` uses **polygon-clipping 0.15.7** to union the existing coordinates without simplification. It validates source identities/CRS, finite closed output rings and that difference(member, union) is empty for each member. Output `public/northern-jordan.geojson` is one MultiPolygon component with one exterior ring and **no holes in this actual result**. No holes were fabricated or intentionally removed; the polygon-union algorithm retains holes when present in the union.

Integrity evidence:

| Item | SHA-256 / canonical digest |
| --- | --- |
| Existing full ADM1 file bytes | `ac07027a9c413825d8628f0f4e4b39ac512904678ac855236233dd6b87ba6866` |
| Existing Ajloun geometry canonical digest | `ea4daf0c0f9ef83e0e2be08ef5efb7f9dfb52a9cb987bb02178206eeeaa4938a` — unchanged from prior activation audit |
| Derived Northern Jordan GeoJSON bytes | `ff37c79e780a42fad8b584e8d91f9f9b85ab2693f6412f8e8881bb522c0e22ed` |

Geometry tooling is isolated under `.checkpoints/jordan-geometry-tools/`, not installed as an application dependency. An initial Shapely attempt failed because local Python lacked a compatible GEOS build; no successful application Python dependency was added. The successful union uses the pinned JavaScript tool. To reproduce only the geometry:

```powershell
npm install --prefix .checkpoints/jordan-geometry-tools polygon-clipping@0.15.7 --no-audit --no-fund
node scripts/build-northern-boundary.mjs
```

## Product behavior and retirement of Brazil

The region model, allowed API scopes, restored session validation, selectors, source labels, map geometry, camera fitting and static snapshot catalog now use Ajloun / Northern Jordan. A stale retired-region session falls back to Ajloun. Retired observation API requests are rejected. No active Brazil selector, fixture catalog entry, scientific export source or fixture-file loader remains. The old file-loading function fails closed; generic synthetic schema parsing remains for isolated unit tests, never as an active regional source.

Historical audit documents and unreferenced ignored fixture files were not blindly deleted or recast as Jordan observations. README/current provenance/limitations identify the retired workflow. Historical audit records retain their historical meaning. Active source/UI/deployment tooling no longer selects or loads Brazil. Negative regression tests may still name the retired region to assert rejection.

MapLibre remains mounted while switching regions. The existing source/layer IDs (`ajloun-boundary`, etc.) are retained for compatibility, but their GeoJSON now represents the **selected region**. This avoids breaking worker/style restoration. The selected-region boundary and regional camera presets fit actual polygons rather than authoritative-looking approximate rectangles. The whole-Earth camera remains a contextual camera action, not a selectable observation region or global data claim.

Ajloun still loads **36 unchanged canonical detections: 5 MODIS / 31 VIIRS**. Northern Jordan currently returns an explicit **unavailable** collection with no datasets or observations. It does not copy Ajloun records, register the union's audited candidates or imply complete north-wide history. Calendar cells stay unknown; unavailable source totals are not shown as zero, and Calendar CSV is disabled for an unavailable source. Evidence/Research JSON includes the selected shared scope and unknown/unavailable status. Source-specific Atlas handoffs, scientific restrictions and existing exports remain available for actual Ajloun data.

## Read-only audit of existing full-input NASA files

These are potential spatially eligible rows, **not newly imported or activated observations**. Each original CSV row was evaluated against governorate geometry and the dissolved union using the existing shared `pointInRegion` function. The CSV files were read only. Dates below are actual acquisition UTC dates; precise times remain in the original files and prior satellite audit.

| Governorate / union | MODIS rows (platforms) | MODIS date extent | VIIRS rows (platform) | VIIRS date extent |
| --- | --- | --- | --- | --- |
| Ajloun | 5 (Aqua 5) | 2020-10-24–2025-07-02 | 31 (S-NPP) | 2020-08-02–2025-10-18 |
| Irbid | 6 (Aqua 4, Terra 2) | 2020-09-03–2025-11-05 | 42 (S-NPP) | 2020-05-15–2024-12-02 |
| Jerash | 8 (Aqua 4, Terra 4) | 2020-05-18–2023-06-22 | 54 (S-NPP) | 2020-05-01–2025-08-02 |
| Mafraq | 0 delivered rows in these files | Unknown | 0 delivered rows in these files | Unknown |
| **Northern Jordan union** | **19 (Aqua 13, Terra 6)** | **2020-05-18–2025-11-05** | **127 (S-NPP)** | **2020-05-01–2025-10-18** |

Input totals remain 19 MODIS and 128 VIIRS rows. The union excludes **0 MODIS and 1 VIIRS** row. Candidate rows outside Ajloun but inside the union are **14 MODIS + 96 VIIRS = 110 additional rows**. The union's 146 eligible source rows include Ajloun's 36; never sum the two selected-region totals as independent observations. Sensor totals are separate raw detections, not equivalent fire counts.

No current rows were assigned to multiple governorates in the count totals above. For future observations exactly on a shared boundary, source membership can be inclusive for both individual governorates; the selected Northern Jordan collection must evaluate each canonical source record once against the dissolved geometry, not concatenate per-governorate results. Tests cover a shared source vertex and region-union membership. Existing canonical replay handling remains distinct from cross-sensor/event deduplication.

**Coverage is unknown.** No Mafraq detections in these deliveries does not mean no fires or verified zero observations. Requested order AOI, acquisition completeness, cloud/valid-pixel conditions and north-wide historical sampling remain unverified. The existing files do not establish complete Northern Jordan history or a continuous 2000-to-present record.

## Acceptance executed

| Command | Result |
| --- | --- |
| `npm run build` | PASS; existing large-chunk advisory remains |
| `npm run lint` | PASS |
| `npm test` | PASS: **92 tests**, zero failures |
| `npm run test:e2e` | PASS Jordan real-archive workflow, API retry, texture failure and no-WebGL fallback |
| `npm run test:language` | PASS real Ajloun Arabic content, Calendar UTC keyboard behavior, responsive header and language restoration |
| `npm run verify:release` | PASS local checks; no public deployment implied |
| `node deployment/cloudflare/build-static.mjs .checkpoints/jordan-static` | PASS local test assets only |
| `node scripts/verify-static-archives.mjs .checkpoints/jordan-static --audit --after` | PASS Jordan region round-trips, scientific/CSV/guide/research controls and desktop/Arabic mobile routes without Express |

New geography tests check a deterministic geographic grid against the logical union of the four original members, closed output rings, a shared source vertex and the immutable Ajloun versus unavailable north catalog. Existing generic synthetic tests now use Jordan region IDs, preserving their malformed-row, UTC, FRP, duplicate and missing-data assertions. Retired fixture API tests were replaced with explicit unavailable-north and rejected-retired-region assertions.

Browser regressions check only two selectable regions, actual Northern Jordan boundary source, camera inclusion of every union vertex, retained map canvas, unavailable source protection, keyboard/Arabic/mobile and a Research Brief scoped to `northern-jordan` with zero delivered records and unavailable coverage context. Returning to Ajloun restores its 36 original records. Existing guide/default pair/robustness and combined Calendar CSV ID checks still run.

A real 320px bilingual header collision was fixed by hiding the small decorative brand glyph and reducing brand text only at that width; strict non-overlap assertions remain. Several old language assertions described the retired fixture's insufficiency state; they now assert real Ajloun descriptive-year evidence and unavailable anomaly scoring instead. The language test no longer relies on switching to the retired fixture to reset popup state.

Logs: `.checkpoints/jordan-build.log`, `jordan-tests.log`, `jordan-e2e.log`, `jordan-language.log`, `jordan-static-build.log`, `jordan-browser.log`. Arabic Northern Jordan screenshot: `.checkpoints/jordan-north-ar-mobile.png`. Static audit route screenshots are refreshed under the existing `.checkpoints/sprint6-*` names.

## Future historical import plan — not executed

1. Freeze current Ajloun archives, canonical IDs, database and static snapshot. Recheck actual file hashes, request AOI/UTC interval, product/collection/stage and the selected boundary checksum. Retain raw source metadata and confidence semantics.
2. **Before a Northern Jordan import is allowed**, extend the streaming import CLI's explicit region scope and boundary resolution: it currently guards imports to Ajloun. Add a tested `--region northern-jordan` option (or an equally explicit validated manifest scope), resolve `public/northern-jordan.geojson`, and never use `loadAjlounGeometry` for a north import. Do not pass an unsupported flag to today's CLI.
3. Replace the intentional unavailable-north catalog guard with an explicit region-scoped catalog/store path only after import authorization. Extend manifest validation, which currently accepts Ajloun archive registrations only. Keep north and Ajloun queries disjoint by selected region.
4. Stage current full inputs under new, truthful north-specific dataset IDs (for example `north-modis-842987`, `north-snpp-842985`) using the existing explicit `modis-firms-export` / `viirs-snpp-firms-export` profiles, standard processing and declared C6.1 / C2 delivery identity. Preserve raw revisions without conversion. Expected read-only spatial acceptance is 19 / 127; independently reconcile those counts before activation.
5. For future deliveries use the same documented FIRMS standard product families unless reviewed separately. Audit overlapping files: dataset-prefixed canonical IDs do not automatically deduplicate the same physical row across arbitrary new dataset IDs. Multiple same-sensor datasets still require explicit frontend catalog selection; do not silently concatenate them.
6. Test dry staging, transaction rollback, repeated-import idempotence, boundary inclusions/holes/shared edges, unknown Mafraq coverage, no duplicate selected-region IDs, exact CSV round-trip, calendars, evidence groups and bilingual map fitting. Recompute expected matching totals rather than weakening old 5/31 assertions.
7. Run the full acceptance commands, retain a rollback snapshot and activate only after owner review of counts, source provenance and limitations. Large history must respect existing query/matching limits and persistent-storage requirements; do not rely on ephemeral deployment filesystem writes.

**GO:** geography restructuring and local Jordan-only demonstration. **NO-GO for immediate Northern Jordan archive activation/expansion:** CLI/catalog region support and a separately authorized import are still required, and coverage evidence remains unknown. The geometry and actual candidate counts are now ready to support that bounded next task. No current observation was imported to bypass these blockers.

## Local review

```powershell
node deployment/cloudflare/build-static.mjs .checkpoints/jordan-static
node deployment/cloudflare/serve-static.mjs .checkpoints/jordan-static
```

Open **http://127.0.0.1:5179**. Enter Mission, choose Northern Jordan, inspect the four-governorate outline and unavailable observations, then return to Ajloun. Repeat in Calendar and Evidence Engine; the guide deliberately returns to the working Ajloun dataset. No public URL was deployed or verified.

## Exact changed/new files

The following list includes implementation, retired-fixture test migration, local verification tooling and current documentation. Historical audit documents and original data files remain retained. Reversible source checkpoint: `.checkpoints/jordan-before/` (earlier unchanged data-client sources are also preserved there from the prior source checkpoint).

- `README.md`
- `deployment/cloudflare/build-static.mjs`
- `deployment/cloudflare/build.mjs`
- `deployment/cloudflare/verify.mjs`
- `docs/DATA_PROVENANCE.md`
- `docs/JORDAN_REGIONS_RESTRUCTURE_REPORT.md`
- `docs/KNOWN_LIMITATIONS.md`
- `public/northern-jordan.geojson`
- `scripts/build-northern-boundary.mjs`
- `scripts/verify-deployment.mjs`
- `scripts/verify-filters.mjs`
- `scripts/verify-jordan-regions.mjs`
- `scripts/verify-language.mjs`
- `scripts/verify-motion.mjs`
- `scripts/verify-real-archives.mjs`
- `scripts/verify-region-sensitivity.mjs`
- `scripts/verify-static-archives.mjs`
- `server/app.test.js`
- `server/archive.test.js`
- `server/dataCatalog.js`
- `server/firmsArchive.js`
- `server/foundation.test.js`
- `server/observations.js`
- `server/observations.test.js`
- `server/processData.js`
- `server/productVerification.js`
- `shared/analytics.ts`
- `shared/model.ts`
- `shared/observations.ts`
- `src/FireMap.tsx`
- `src/calendar/BurningCalendar.tsx`
- `src/calendar/CalendarDayDetails.tsx`
- `src/components/AtlasFilters.tsx`
- `src/components/AtlasInspector.tsx`
- `src/components/RegionExplorer.tsx`
- `src/data/intelligence.ts`
- `src/design/AtlasPrimitives.tsx`
- `src/i18n/ar.ts`
- `src/i18n/evidence-ar.ts`
- `src/i18n/language.css`
- `src/intelligence/EvidenceEngine.tsx`
- `src/intelligence/IntelligenceWorkspace.tsx`
- `src/intelligence/useMissionData.ts`
- `src/state/MissionContext.tsx`
- `tests/activation.test.ts`
- `tests/calendar.test.ts`
- `tests/calendarCSV.test.ts`
- `tests/dataClient.test.ts`
- `tests/evidence.test.ts`
- `tests/foundation.test.ts`
- `tests/i18n.test.ts`
- `tests/jordanRegions.test.ts`
- `tests/regionScope.test.ts`
