> **Current activation (12 November 2026):** both supplied real Ajloun archives are now imported using explicit raw-preserving export profiles. The earlier blanket HOLD and no-archive status below are superseded by [executed activation and exact commands](docs/REAL_DATA_ACTIVATION.md). Unknown channel/version interpretation remains prohibited; no calibration or complete coverage is claimed.

# Task 10 — archive ingestion and scientific harmonization

**Scientific verification hold (12 November 2026):** Do not apply the example commands below to `DL_FIRE_M-C61_842987.zip` or `DL_FIRE_SV-C2_842985.zip`, or rewrite their headers/versions to satisfy these profiles. The existing profiles describe supported software schemas, not authenticated delivery identities. MODIS `6.03` / `61.03` row versions and the shared VIIRS `brightness,bright_t31` export require review; imports encountering them now stop with `PRODUCT_VERIFICATION_REQUIRED` and streaming transactions roll back. They are **not declared corrupt NASA data**. See [NASA product verification](docs/NASA_PRODUCT_VERIFICATION.md) for evidence, unresolved fields, challenge gaps and release conditions. No real archive is approved by this document.

Completion-sprint integration note: the archive parser, streaming importer, SQLite adapter and their scientific identity rules are unchanged and remain regression-tested. New UI modules consume the same data foundation; additive FRP filters are documented in [methodology](docs/METHODOLOGY.md). Vercel serving uses an optional HTTPS persistent-service facade rather than importing into ephemeral storage; see [deployment](docs/DEPLOYMENT.md). Current whole-dataset 50,000-detection limits still apply. No real archive has been activated by the sprint.

This extends Task 09; it does not replace its model, legacy routes or UI. The source-only reversible checkpoint is `.checkpoints/archive-ingestion-20261111-210444/`. No production archive or verified coverage has been registered. Existing Brazil observations remain a development fixture. All new test rows are explicitly synthetic schema examples, created only in test memory/temporary directories.

## Safe import procedure (PowerShell, repository root)

Requirements: the existing root/server dependencies, Node `^22.18.0 || >=24.0.0` with `node:sqlite`, a persistent writable disk, and genuine FIRMS archive deliveries. No credentials, network download or environment file is used by the import commands. The importer reads only explicitly named non-hidden CSVs, plus the public Ajloun boundary. It never downloads data or uploads it through an HTTP endpoint.

1. Obtain standard-processing FIRMS CSV exports through the official archive download. Inspect the delivery documentation and **actual collection/product** before selecting a profile. Keep deliveries outside source control (`server/data/archives/` is ignored). Do not use the Brazil fixture as an archive. Back up any existing persistent SQLite store before importing, using SQLite backup or a stopped-writer consistent snapshot, including WAL consistency.
2. Import without `--activate` to stage a dataset. Example commands below assume actual deliveries have been saved under the shown filenames; they do not generate observations. `VNP14IMGML` and `MCD14ML` are example source-product identifiers: replace them if delivery documentation specifies a different product; product strings are recorded, not scientifically authenticated by the adapter.

```powershell
node server/importArchive.js --file server/data/archives/ajloun-snpp-2020.csv --id ajloun-snpp-c2-standard --profile viirs-snpp --version 2.0 --product VNP14IMGML
node server/importArchive.js --file server/data/archives/ajloun-modis-2020.csv --id ajloun-modis-c61-standard --profile modis-c61 --version 6.1 --product MCD14ML
node server/archiveReport.js
node server/archiveReport.js --dataset ajloun-snpp-c2-standard
node server/archiveReport.js --import 1 --offset 0 --limit 100
```

3. Check accepted, inserted, duplicate, rejected, excluded and issue counts. Issues include physical CSV **ending line numbers**, codes, fields and safe reasons; values/raw rows are not printed. Null/invalid FRP does not discard an otherwise valid detection: invalid supplied FRP yields a warning, stays raw, and is excluded from numeric summaries. Other invalid required/profile values reject the row. Rejections/warnings mark the logical dataset partial. This is intentionally sticky: later deliveries do not prove earlier rejected data was repaired. Publish a reviewed replacement under a new ID when correcting a partial product.
4. When reviewed, repeat the same command with `--activate`. Exact reimport is idempotent for observations (a new delivery audit is retained). Activation changes only the active selection for that sensor; other sensors remain active. Map and calendar automatically read active datasets through the existing GeoJSON endpoint. Restart an older backend process to load these source changes; the task does not stop user-owned processes.

```powershell
node server/importArchive.js --file server/data/archives/ajloun-snpp-2020.csv --id ajloun-snpp-c2-standard --profile viirs-snpp --version 2.0 --product VNP14IMGML --activate
node server/importArchive.js --file server/data/archives/ajloun-snpp-2021.csv --file server/data/archives/ajloun-snpp-2022.csv --id ajloun-snpp-c2-standard --profile viirs-snpp --version 2.0 --product VNP14IMGML
```

Multiple files are sequential, **atomic per delivery**, not one transaction for the entire command. A later fatal file failure leaves prior committed deliveries intact; reports remain available with `archiveReport.js`. Previously active datasets remain selected unless activation was explicitly requested. Stable logical dataset IDs must span compatible deliveries for cross-file deduplication. Changing sensor/product/collection/processing/source/profile/platform under an existing ID is rejected. Distinct collection versions, NRT versus standard, platforms and source products are never silently reconciled. Different IDs remain separate even if their rows look alike.

Optional pinned SHA-256: append `--checksum <64-character-delivery-sha256>` for a single delivery. Mismatch rolls back that file. The report records the checksum of exact input bytes, delivery basename, import timestamp, boundary checksum/method, and counts. An observation-to-delivery table links retained observations to every delivery that supplied them. Header-only exports are allowed, but establish **no coverage**.

For a staging/durable volume path, use `--store D:/firepulse-data/history.sqlite` on both CLI commands. API serving currently opens **`server/data/history.sqlite` only**, so mount the durable volume at `server/data` (or deploy a consistent, closed staging store at that path). A custom CLI store is not automatically published. Do not overlay an existing active CSV manifest catalog with SQLite data: migrate/remove its active registrations deliberately after backup; simultaneous conflicting catalogs fail explicitly rather than double-counting. The legacy manifest-based small-CSV loader remains supported when no matching persistent dataset is present.

## Profiles and validation

`modis-c61`: MODIS, standard `6.1`, satellite `A`/`Aqua` or `T`/`Terra`; original numeric confidence 0–100; `brightness` and `bright_t31`.

`viirs-snpp`: VIIRS, standard `1.0` or `2.0` (explicit collection required), satellite `N`/`S-NPP`/`Suomi NPP`; original `l/n/h` confidence; `bright_ti4` and `bright_ti5`. NOAA-20/21 are deliberately rejected by this S-NPP profile. The existing generic Brazil NOAA-20 fixture adapter is unchanged.

Both require unique case-insensitive CSV headers and `latitude,longitude,acq_date,acq_time,satellite,confidence,frp,version,scan,track,daynight` plus profile brightness columns. `instrument` may be absent when explicitly supplied by profile provenance; if present it must agree. Versions must match the declared standard archive collection exactly. `scan/track` and brightness values must be finite positive decimals; coordinates must be numeric WGS84 values; `daynight` is D/N. Dates are strictly validated civil dates; HHMM acquisition time is interpreted in **UTC**, including leading-zero padding. Leap dates and midnight/year boundaries use the shared Task 09 parser.

The canonical Task 09 observation retains ID, UTC time, coordinates, sensor, platform, original confidence, nullable FRP, source, product/stage/version and original feature. Profile imports add `feature.properties.archiveRaw` with all trimmed CSV column values (including original date/time, satellite, instrument if present, scan/track, day/night, brightness and extra columns). Canonical platforms become Aqua/Terra/S-NPP; `platformRaw`, `rawSatellite`, `sensorRaw` and `rawInstrument` preserve originals or absence. Exact file bytes are represented by SHA-256, not copied into JSON. No original raw confidence is converted to another sensor scale.

Deduplication reuses Task 09's SHA-256 canonical observation ID, scoped to logical dataset + source/product/stage/version/sensor/platform + original metadata and location. Delivery filename, row ordering and generated feature IDs do not change identity. Distinct FRP, raw metadata, acquisitions, sensor or products remain distinct. This is deliberately conservative: it does not collapse spatially nearby pixels, Terra/Aqua or coincident MODIS/VIIRS into one fire. Batch metadata inference is disabled so varying batch composition cannot change IDs.

The streaming parser limits individual records to 1 MiB. Default canonical batches are 1,000 records (programmatic range 1–10,000), with stream backpressure, no full-file read, and a disk-backed uniqueness index. Issues are written to SQLite per batch rather than accumulating an unbounded array. Fatal syntax/schema/read/checksum errors or cancellation roll back all writes for that file. Valid/rejected rows in a parseable delivery are auditable; parser-fatal files are not committed. Programmatic `AbortSignal` cancels ingestion. CLI process termination lets SQLite recover the uncommitted transaction.

Ajloun clipping uses the existing `public/jordan-adm1.geojson` Ajloun geometry and shared Polygon/MultiPolygon algorithm. Exterior boundary points are included; holes and their boundaries are excluded. Reports separately count out-of-region records, which are not imported. The implementation is planar WGS84 point-in-polygon for the small pilot; it is not a global antimeridian/polar geometry engine. Archive extent or polygon inclusion never proves satellite coverage.

## API contracts

All existing `/api/observations?mode=ajloun|brazil-test`, live NASA routes and `firepulse.observations/v1` fields survive. New resources are additive, available under both `/api/intelligence/` and `/api/history/`:

| GET resource | Payload beyond common v1 envelope |
| --- | --- |
| `datasets` | Dataset descriptors, ingestion reports, availability and provenance |
| `observations` | Canonical observations and separate sensor/platform/product summaries |
| `aggregates?period=day` | Existing provenance-separated daily series |
| `aggregates?period=month` | Monthly series, reported FRP completeness, unknown coverage days |
| `aggregates?period=year` | Yearly series with the same coverage semantics |
| `coverage` | `coverageStatus: "unknown"`, evidence explanation, per-dataset unknown statuses; `coverage: []` |
| `comparison?period=day` | `comparison` with methodology, separate raw series/summaries, aligned periods, dataset context and limitations |

Shared query parameters: `region` (default ajloun), `from/to` inclusive UTC dates, `fromTime/toTime` explicit-zone timestamps, `sensor=MODIS|VIIRS|UNKNOWN|all`, `platform` canonical identifier, `datasetId`, `confidence` original value, `fixture=include|exclude|only`, WGS84 `bbox`, and `period=day|month|year`. Duplicate/non-scalar/unknown parameters and invalid scopes fail 400. Missing dataset fails 404; unavailable registered source fails 503. An unconfigured region returns availability `unavailable`, not a false covered zero. Loaded/partial/error/fixture remain distinct.

Examples:

```text
GET /api/history/observations?region=ajloun&sensor=VIIRS&from=2020-01-01&to=2020-01-31
GET /api/history/aggregates?region=ajloun&period=month&datasetId=ajloun-snpp-c2-standard&from=2020-01-01&to=2020-12-31
GET /api/history/comparison?region=ajloun&period=month&from=2020-01-01&to=2020-12-31
GET /api/history/coverage?region=ajloun&from=2020-01-01&to=2020-01-31
```

Queries use an indexed dataset/date/sensor scan and canonical shared filters. To bound response/aggregation memory, requests matching more than 50,000 persistent observations fail **413 `QUERY_TOO_LARGE`**, without truncation. Narrow the date/sensor/dataset range. The legacy whole-dataset map/calendar endpoint also fails safely above this limit (503 under its unchanged error contract): server-windowed/paginated UI retrieval is future work for very large pilot histories. Temporal aggregation is currently bounded in-process using the shared utilities; it is not a warehouse-wide SQL aggregate service. Catalog/report responses include the latest 100 imports per dataset; CLI issue pages allow up to 1,000 issues. No coverage proof is fabricated from import success. Verified coverage ingestion is intentionally not implemented until validated overpass/quality evidence is available.

## Transparent scientific comparison

`shared/harmonization.ts` exposes methodology `firepulse.sensor-alignment/v1`. This is **UTC calendar alignment of raw, provenance-separated detections**, not a sensor normalization algorithm. It returns:

- Raw per-dataset/sensor/platform/product/processing/version series and confidence semantics.
- Period alignment references with explicit observed/unavailable status and unknown/verified coverage; absent buckets are null with `status: unavailable`.
- Nominal sensor resolution (MODIS 1,000 m, VIIRS 375 m), acquisition caveats and observed temporal ranges. Observed ranges are not full operational lifetimes or coverage guarantees. Actual scan/track and timestamps survive in each original feature.
- `conversionFactor: null`, `crossSensorCountTotal: null`, `validatedNormalization: false`, `fireEventClustering: false`. Existing capabilities for baselines/anomalies remain false.

The observations endpoint is the conservative discovery view: it lists detections while retaining provenance; no inter-sensor matching, spatial union/event deduplication or inferred fire count is supplied. FRP sums are reported pixel MW, not energy, burned area or a universal sensor conversion. VIIRS FRP retrieval uses 375/750 m information; cloud/smoke, saturation, view angle, overpass timing and detection sensitivity matter. A missing record is not verified zero. No product-specific operational end date is hardcoded; consult current delivery documentation.

## Deployment/storage requirements and risks

- SQLite is a **persistent single-node adapter**, not Vercel ephemeral storage. Use a durable mounted volume with writable database/WAL/SHM files, filesystem locking, regular consistent backups and restore tests. Never run imports on Vercel's deployment or temporary filesystem expecting retention. Serverless/multi-instance production needs a managed SQL/object-store adapter and a separate ingestion worker; preserve the canonical contracts and shared filters.
- One writer holds a transaction for an entire delivery. Ingestion is intended as an offline CLI/worker, not inside an Express request. WAL permits readers of committed snapshots; large transactions consume disk/WAL and imports are not all-files atomic. Avoid network filesystems with unreliable locking. No database migration beyond schema v1 is shipped; unknown versions fail.
- Source files, database and audit reports may be large; plan disk capacity, retention, backup access controls, observability and import scheduling. Do not copy a live database file without a consistent SQLite backup. No dataset/secret is committed by this task; default storage stays under ignored `server/data/`.
- Same-sensor incompatible products/collections remain separate. The UI uses one explicitly active logical dataset per sensor. Do not register overlapping IDs just to aggregate deliveries. Review source duplication, collection corrections, licensing and acquisition extent before activation. Adapter tests validate software semantics, not NASA product authenticity or scientific fitness.
- Original UI, cinematic code, MapLibre source/layer/camera/worker code, basemap switching and calendar components are unchanged. No new dependency was installed. Node's built-in SQLite support must be present in the deployment runtime; the frontend does not bundle it.

## Validation and remaining work

Automated scenarios: profile-specific columns/confidence/platform/version validation; malformed numeric/date/HHMM/CSV fields; raw metadata preservation; null/zero/invalid FRP; leap/midnight filtering; exact replay/cross-batch/cross-file duplicates; source conflicts; fatal-file rollback; cancellation; persistent reopen and audit retrieval; 12,000-row generated synthetic streaming import at a 127-row cap; Polygon/MultiPolygon edges/holes; separate sensor summaries and empty series; shared map/calendar normalization and historical HTTP integration. Synthetic rows are never registered in the real store or displayed in the application.

Final results: `npm test` passed 48 tests; `npm --prefix server test` passed 23 backend tests (a subset of the 48); `npm run build` and `npm run lint` passed. `node --test server/archive.test.js` passed all 12 new archive/integration tests. `node scripts/verify-motion.mjs` passed with its isolated credential-free backend: Earth entry/skip, Ajloun default, fixture isolation, circle reveal, filters, popup/focus, camera interruption, street/satellite restoration, calendar metrics/keyboard/date handoff, mobile/tablet, reduced motion, network recovery and WebGL fallbacks, with no uncaught browser exceptions. The production assets retain the same UI/CSS bundle hashes as the baseline. Build retains the existing large Three/MapLibre lazy-chunk warning. Large-file throughput/peak RSS beyond the synthetic batch test, actual delivered archive variants, physical-device behavior and scientific validation remain unverified.

Manual acceptance after actual delivery: import/stage/review/activate; verify Ajloun points are inside its outline; compare map/calendar same-sensor same-date counts; inspect raw confidence/FRP/daynight; switch to Brazil and back; verify source labels, satellite/street, date handoff, missing dates and empty/error states. Check `coverage` stays unknown and comparison never returns a combined fire-event count.

**Next task:** import and review the first genuine Ajloun delivery, verify count reconciliation against its source, and obtain validated acquisition/clear-sky coverage evidence. Fire Season Clock can consume raw monthly per-sensor series now, but defensible seasonality requires sufficient multi-year history and explicit sampling limitations. Fire DNA additionally needs a defined/validated feature methodology, temporal completeness rules, spatial/event definitions, uncertainty treatment and a validated regional historical baseline. Normalized anomalies and operational Decision Brief claims remain unavailable until those dependencies are met.

## Exact changed files

Added: `server/archiveProfiles.js`, `server/archiveStore.js`, `server/importArchive.js`, `server/archiveReport.js`, `server/archive.test.js`, `shared/harmonization.ts`, `ARCHIVE_INGESTION.md`.

Modified: `server/firmsArchive.js`, `server/dataCatalog.js`, `server/observations.js`, `shared/model.ts`, `shared/observations.ts`, `shared/contracts.ts`, `src/data/intelligence.ts`, `scripts/verify-motion.mjs`, `DATA_FOUNDATION.md`, `README.md`. The browser harness now starts a credential-free isolated Express observation server directly, without loading the live server entry or dotenv.

## Primary references

- [NASA FIRMS MODIS attributes](https://firms.modaps.eosdis.nasa.gov/content/descriptions/FIRMS_MODIS_Firehotspots.html): UTC acquisition, collection/stage, confidence, pixel dimensions, FRP and day/night.
- [NASA FIRMS VIIRS attributes](https://firms.modaps.eosdis.nasa.gov/content/descriptions/FIRMS_VIIRS_Firehotspots.html): platform codes, categorical confidence, pixel dimensions and hybrid FRP retrieval.
- [NASA FIRMS archive delivery](https://firms2.modaps.eosdis.nasa.gov/download/): obtain and document actual standard-processing source products.
- [Node SQLite documentation](https://nodejs.org/api/sqlite.html): built-in SQLite API, prepared queries, persistent database behavior and runtime support.
