# FIREPULSE / Shared Data Foundation v1

## What is now shared

`shared/model.ts`, `shared/observations.ts` and `shared/contracts.ts` are the canonical runtime/type foundation for both Node and the frontend. MapLibre and Burning Calendar use the same normalization, scope filtering, duplicate policy and UTC rules. Calendar's existing exports remain as a compatibility adapter instead of retaining a second aggregation implementation. No layout, navigation, cinematic, CSS, camera or worker redesign was made.

The new Intelligence client (`src/data/intelligence.ts`) is the entry point for Fire Season Clock, Fire DNA, Sensor Comparison, Anomaly Detection and Decision Brief. Their UI/analysis modules are not fabricated by this task. The response explicitly says that no validated baseline, sensor-normalized comparison or anomaly exists and that a Decision Brief can only be descriptive.

Checkpoint: `.checkpoints/data-foundation-20261111-201933/`. Source/configuration/tests were saved before editing. Secret files, dependencies and datasets were excluded. No dataset was created, overwritten or committed, and no archive was downloaded. The pre-existing local API process was left running; isolated servers were used for integration tests.

## Canonical observation and provenance

Each `Observation` contains:

- `id`: versioned `fp1:<datasetId>:<SHA-256>` identity, independent of source-row order and presentation feature IDs.
- `datasetId`, `regionId`, `utcDate`, explicit-zone ISO UTC `acquiredAt`, and `timestampPrecision` (`instant` or `day`). A date-only legacy record retains a null timestamp rather than inventing midnight. FIRMS CSV ingestion requires HHMM and creates instant-precision records.
- WGS84 `longitude` / `latitude`, recognized `sensor`, `sensorRaw`, `platform`, and `platformRaw`. Explicit dataset metadata may supply absent CSV instrument/platform fields; the raw fields still show that the columns were absent.
- Numeric nonnegative `frp`, or null. Actual zero is preserved.
- Confidence `raw`, `scheme`, `category`, and validity. The default FIRMS VIIRS scale is categorical; MODIS is its original 0–100 scale. These are product quality semantics, not comparable probabilities of wildfire. Unrecognized values are retained and flagged rather than normalized.
- `source`, product, processing stage, collection version and fixture provenance.
- The original GeoJSON `feature`, including raw acquisition/measurement metadata and any extra archive columns. Additional columns cannot shadow canonical UTC fields.

`Dataset` contains explicit region/source/product identity, optional sensor/platform, processing/version, filename and content checksum. IDs include dataset identity and its product/stage/version/source context. A different dataset or corrected/NRT product is not silently merged. The checksum identifies exact CSV bytes; an optional pinned checksum is verified before ingestion. A checksum is provenance, not proof of NASA authenticity or coverage.

Exact duplicate rows within one dataset are removed. Canonical key ordering and SHA-256 make IDs stable across property ordering and row IDs. `_revealOrder`, generated observation IDs and dataset-ID presentation fields are excluded from row identity; actual source fields/granule identifiers remain. Nearby pixels, different acquisitions, platforms, products and source datasets remain distinct. The map and calendar now use the same deduplicated records. The legacy endpoint still exposes original valid fixture rows/feature IDs for compatibility and audit.

## Availability is separate from coverage

`Availability.state` is one of:

| State | Meaning |
| --- | --- |
| `loaded` | A real scoped collection was read; this does not establish complete satellite coverage. |
| `partial` | Some source files/rows failed or the source was explicitly declared partial. Available observations remain usable with diagnostics. |
| `unavailable` | No configured source exists for the requested region. |
| `error` | The source or its provenance could not be loaded safely. |
| `fixture` | Development/test observations, never a live or pilot historical feed. |

`fixture`, `quality` and `coverage` are independent fields: a fixture can have partial quality. Optional FRP absence is represented by reporting counts, not invented zeros. Confidence/FRP validation warnings and rejected rows are exposed. Per-dataset availability and ingestion reports distinguish successful and failed archive partitions. Legacy unconnected-pilot metadata remains compatible during a backend restart.

Current data is unchanged: seven Brazil VIIRS/N20 test records on November 7, 8 and 10, 2026. Ajloun has no configured historical archive, and no daily coverage ledger exists. Therefore all actual API responses have unknown coverage, and no current missing date is a confirmed zero.

## Filtering and aggregation semantics

Use `filterObservations` for canonical records, or `filterObservationCollection` for existing GeoJSON UI consumers. They share region, sensor, platform, dataset, UTC date/time, confidence and fixture policies. Date limits are inclusive UTC calendar dates. Timestamp bounds require an explicit timezone. Bounding boxes use `[west,south,east,north]`; west > east supports an antimeridian-spanning box. Ajloun can never admit fixture observations. Polygon/MultiPolygon ingestion clipping uses the existing pilot geometry, including holes; it is planar WGS84 clipping intended for this regional pilot.

`aggregateDays` powers the existing daily calendar adapter. It requires a single explicit dataset per selected instrument instead of silently adding incompatible products. The legacy catalog permits at most one active archive per sensor. `aggregatePeriods`, `aggregateDailySeries`, `aggregateMonthlySeries` and `aggregateYearlySeries` return separate series by dataset, sensor, platform, source, product, processing/version and confidence semantics. There is no sensor-combined fire-intensity total.

Each period includes count, sum of reported FRP, reporting count/completeness, observed/unavailable/verified-zero state, date scope, expected period days, verified and unknown coverage days, and whether it represents a full period. A missing period has null FRP and unavailable activity, not zero activity. FRP sums over detections are MW samples, not integrated daily/monthly energy, severity, unique fire events or burned area.

A verified-zero requires explicit, complete and verified day coverage with matching region, sensor and dataset plus provenance. All days of a full month/year must be verified before a full-period zero is allowed. A clipped month query, timestamp-restricted window, partial delivery or failed source cannot imply a complete zero period. Current API CSV inputs never establish coverage automatically. The pure coverage interfaces are ready for a separately validated future coverage adapter; no coverage-import service or baseline is claimed here.

## API contracts

All new resources use `schemaVersion: "firepulse.observations/v1"` and shared discriminated TypeScript response contracts. Existing `/api/health`, `/api/hotspots` and the GeoJSON shape/modes of `/api/observations` survive. The original live NASA route is untouched; the foundation currently reads local sources and makes no new authenticated NASA requests.

| Endpoint | Response |
| --- | --- |
| `GET /api/observations?mode=ajloun|brazil-test` | Backward-compatible GeoJSON plus additive dataset, availability, coverage and audit metadata. |
| `GET /api/intelligence/datasets` | Scoped dataset descriptors, availability and ingestion diagnostics. |
| `GET /api/intelligence/observations` | Canonical deduplicated observations and provenance-separated sensor summaries. |
| `GET /api/intelligence/aggregates?period=day|month|year` | Provenance-separated temporal series, unknown gaps and reporting/coverage measures. |

New endpoint query fields: `region` (default `ajloun`), `sensor` (`VIIRS`, `MODIS`, `UNKNOWN`, `all`), `platform`, `datasetId`, `from` / `to` (YYYY-MM-DD), `fromTime` / `toTime` (explicit-zone ISO), `bbox`, `confidence` (raw sensor value) and `fixture` (`include`, `exclude`, `only`). Aggregates additionally accept `period` (default `day`). Unknown or invalid parameters are rejected; query parameters never select arbitrary files.

Examples:

```text
/api/intelligence/observations?region=brazil-test&sensor=VIIRS&from=2026-11-07&to=2026-11-07
/api/intelligence/aggregates?region=brazil-test&period=month&from=2026-11-01&to=2026-11-30
/api/intelligence/datasets?region=ajloun
```

Success envelopes include scope, availability, datasets, canonical diagnostics, ingestion reports, coverage, caveats and capability gates. `datasets` describes sources, not proof of available matching observations. Empty query matches do not mean verified zero activity. Grouped series never silently average MODIS against VIIRS or corrected products against NRT.

Errors use typed availability and sanitized `error.code` / `error.message`. Invalid queries are HTTP 400, unknown dataset IDs 404, and source failures 503. A missing configured pilot source is HTTP 200 with availability `unavailable`. Successfully loaded sources with some failed files retain partial data and explicit `partial` availability. No raw parser exception, file path, credential or CSV row is returned as an error message.

Frontend integration:

```ts
import { fetchIntelligenceData, DataFoundationError } from './data/intelligence';

const monthly = await fetchIntelligenceData('aggregates', {
  region: 'ajloun', sensor: 'VIIRS',
  startDate: '2020-01-01', endDate: '2025-12-31',
}, { period: 'month', signal });
// Check monthly.availability before rendering. monthly.series is typed.
// Keep each dataset/platform/product series distinct. Unknown periods stay unknown.
// Catch DataFoundationError for transport/schema/source availability; cancellation
// remains an AbortError. Invalid filter input is a RangeError.
```

The dates in this example are a requested scope, not a claim that those historical records exist. Dataset selection is explicit for future multi-product sources. The raw GeoJSON client rejects ambiguous same-sensor dataset combinations; new Lab modules may request individual dataset IDs or render the grouped contract side by side.

## Importing a future archive without frontend changes

Runtime: Node 22.18+ on the 22.x line, or Node 24+. Native erasable-TypeScript execution is required by the shared server module. The implementation was tested on the installed Node 26. Install dependencies from both project root and `server`; deploy the shared directory and root dependencies with the server. `@noble/hashes` is the only added dependency, used for SHA-256 in both runtimes.

1. Obtain an authorized NASA FIRMS archive outside this task. Check the actual product, instrument, platform, collection/version and standard/NRT status. Do not infer product equivalence from filenames or date ranges.
2. Place the CSV under ignored `server/data/archives/`, e.g. `ajloun_viirs.csv`. This task does not create that dataset. Required row fields are latitude, longitude, acquisition date and time, and an instrument either in the CSV or explicit product metadata. Platform/FRP/confidence can be absent and remain unknown unless explicit platform metadata is supplied.
3. Run the read-only validator from the repository root, replacing uppercase placeholders with the actual metadata:

```text
node server/validateArchive.js --filename ajloun_viirs.csv --id ajloun-viirs-archive-v1 --sensor VIIRS --product ACTUAL_FIRMS_PRODUCT --version ACTUAL_COLLECTION_VERSION --processing standard
```

Use `nrt` and the actual NRT collection version when that is what the source contains. The adapter checks internal consistency; it does not independently authenticate NASA provenance. Diagnostics identify malformed physical CSV lines, schema/UTC failures, sensor/platform/version conflicts, duplicates, FRP warnings and valid observations outside the pilot polygon. Invalid quoted-file syntax is fatal rather than guessed. No raw rows are printed. Exit 0 means required validation passed, 2 means partial input needs review, and 1 means fatal validation failure. A zero-record valid file is still not proof of coverage.

4. Copy and fill `docs/archive-manifest.example.json` into ignored `server/data/archive-manifest.json`. The example is configuration only, not an imported dataset. Entries have unique immutable IDs, public source metadata, safe CSV basenames, and `kind: archive`, `regionId: ajloun`. Pin the returned checksum when desired. Put at most one dataset ID per sensor in `active`; all registered IDs remain discoverable through the new catalog for explicit Lab queries. Different products/releases should have different IDs. Do not add credentials to the manifest.
5. Restart the backend process. No frontend rewrite is needed: the map and calendar read the same `/api/observations` source, now backed by the selected validated archive(s). Ajloun rows are clipped to the existing polygon. The Brazil fixture remains a separate fixed development source and cannot be registered as pilot data.
6. Verify the catalog, canonical observations, diagnostics and daily/monthly series before interpreting them. Coverage remains unknown until a separate provenance-backed coverage process is implemented. Do not claim anomalies or Fire DNA baselines merely because a file loaded.

The file reader accepts CSV basenames only, checks resolved paths/extensions, and rejects traversal or secret-file names before reading. It never uploads, modifies or commits archives. Processing is synchronous/in-memory and intended for the current local prototype; very large archives need a streaming/worker/indexed-store step and pagination before production scale. A request range is capped at 40,000 days. No spherical/dateline-crossing polygon engine, deduplication across corrected releases, validated anomaly baseline or coverage acquisition service is claimed.

## Validation and preservation

Passed commands:

```text
npm test
npm run build
npm run lint
npm --prefix server test
node scripts/verify-motion.mjs
```

The main suite has 36 passing tests, including all previous calendar/backend tests. Scenarios cover stable IDs, raw provenance, UTC offsets/year/leap boundaries, inclusive scopes, sensor/platform/product differences, confidence scales, null/zero/partial FRP, duplicate records, invalid schema/quoted CSV, row counts, out-of-region points and polygon holes, secret/path rejection, checksums, processing conflicts, partial/failed catalog loads, all availability states, monthly/yearly unknown periods, full/partial coverage, fixture isolation, typed clients, sanitized errors and backward compatibility.

Chrome checks run against their own ephemeral backend port and temporary Vite proxy, leaving the user's existing port-3001 process untouched. They verified the canonical API and all existing Earth/Atlas/calendar interaction checks, including the 2/4/1 fixture days, 23.54 MW first-day sum, date transfer without map recreation, basemap restore, hover/selection, region isolation, keyboard/mobile behavior, error recovery, reduced motion and WebGL fallbacks. A pre-existing running backend needs a restart for the new routes; the frontend remains compatible with its old GeoJSON response until then.

Checkpoint comparisons confirmed no changes to the cinematic source, navigation source, Atlas/calendar styles, camera helper or original live NASA server entry. Vite still warns about the existing large lazy Three/MapLibre chunks. Physical-device, screen-reader and large-archive performance testing remain separate work.

## Exact changed files

Modified:
- `package.json`
- `package-lock.json`
- `server/package.json`
- `server/package-lock.json`
- `server/processData.js`
- `server/observations.js`
- `src/FireMap.tsx`
- `src/components/AtlasInspector.tsx`
- `src/calendar/aggregation.ts`
- `src/calendar/useCalendarObservations.ts`
- `src/calendar/BurningCalendar.tsx`
- `scripts/verify-motion.mjs`
- `README.md`
- `BURNING_CALENDAR.md`

Added:
- `shared/model.ts`
- `shared/observations.ts`
- `shared/contracts.ts`
- `src/data/observations.ts`
- `src/data/intelligence.ts`
- `server/firmsArchive.js`
- `server/dataCatalog.js`
- `server/validateArchive.js`
- `server/foundation.test.js`
- `tests/foundation.test.ts`
- `tests/dataClient.test.ts`
- `docs/archive-manifest.example.json`
- `DATA_FOUNDATION.md`

## Task 10 continuation

Completion sprint: [shared methodology](docs/METHODOLOGY.md) and [tracker](docs/COMPLETION_TRACKER.md) record the current module integration. Optional `frpMin`/`frpMax` MW filters now use the same canonical validation/filtering in APIs, Map, Calendar and Intelligence. Missing FRP is excluded only when a bound is active; reported zero remains valid. Source grouping, IDs, coverage semantics and v1 contracts remain intact. Browser mission state is separate from observation data and contains no credentials.

The bounded-memory archive importer, persistent SQLite adapter, coverage/comparison resources and current limitations are documented in [ARCHIVE_INGESTION.md](./ARCHIVE_INGESTION.md). That guide supersedes this Task 09 document's sync-only ingestion/storage limitations and historical next-task notes; the canonical model and existing routes remain compatible.

## Next implementation task (Task 09 record)

Validate/register the first real Ajloun archive, then implement Fire Season Clock using `aggregateMonthlySeries` or the aggregates endpoint. Show per-sensor observed seasonality with unknown coverage explicit. Fire DNA, normalized Sensor Comparison, anomalies and operational Decision Brief claims require separately validated history/baseline/coverage, not fixture extrapolation.

## Primary references

- NASA FIRMS VIIRS acquisition/confidence/FRP descriptions: https://firms.modaps.eosdis.nasa.gov/content/descriptions/FIRMS_VIIRS_Firehotspots.html
- NASA MODIS file contents: https://firms.modaps.eosdis.nasa.gov/content/descriptions/FIRMS_MODIS_Firehotspots.html
- NASA archive download and corrected/NRT context: https://firms2.modaps.eosdis.nasa.gov/download/
- Node native TypeScript support: https://nodejs.org/en/blog/release/v22.18.0
- SHA-256 package documentation: https://github.com/paulmillr/noble-hashes
