# Real NASA activation — 12 November 2026

## Executed import

Both ZIPs were located in `server/data/archives/`. CSV members were extracted byte-for-byte into that ignored directory. No dataset or SQLite file was committed. Checkpoint: `.checkpoints/activation-20261112/`; no secret files were read or included.

| Delivery | Input | Imported inside Ajloun | Rejected | Duplicates | Spatially excluded |
| --- | ---: | ---: | ---: | ---: | ---: |
| MODIS M-C61 842987 | 19 | 5 | 0 | 0 | 14 |
| VIIRS SV-C2 842985 | 128 | 31 | 0 | 0 | 97 |

Unchanged boundary: `public/jordan-adm1.geojson`, Ajloun feature; Polygon/MultiPolygon point membership, outer edges included and holes excluded. Boundary checksum `ea4daf0c0f9ef83e0e2be08ef5efb7f9dfb52a9cb987bb02178206eeeaa4938a`.

```powershell
node server/importArchive.js --file server/data/archives/fire_archive_M-C61_842987.csv --id ajloun-modis-842987 --profile modis-firms-export --version 6.1 --product MCD14ML --checksum 4733b146e4de6de0cf62dddd090b17fedd32f31d24fbae232e7054ea635f66e0 --activate
node server/importArchive.js --file server/data/archives/fire_archive_SV-C2_842985.csv --id ajloun-snpp-842985 --profile viirs-snpp-firms-export --version 2 --product VNP14IMGTML --checksum b2aa325124f7cb032a1025eedda10dc9521558fa27e000521274a0e092d981bc --activate
```

Reimports are idempotent for identical records; a repeated run reports duplicates rather than new insertions. Keep the SQLite store on a persistent backed-up volume; the local activation does not deploy it to Vercel. Existing 50,000-record query limit remains.

## Scientific interpretation

[NASA delivery README](https://firms.modaps.eosdis.nasa.gov/download/Readme.txt) identifies the two prefixes as standard active-fire/thermal-anomaly exports, not burned area. Product names follow that README exactly. The new opt-in profiles retain raw `6.03`/`61.03`/`2` values, original SNPP instrument/platform strings, acquisition fields, confidence and temperatures in `archiveRaw`. Collection identity comes from the delivery family, not a rewrite of row versions. Canonical VIIRS/S-NPP identity is derived only in the explicit SV-C2 profile. No VIIRS temperature-channel alias is inferred; these fields are not used in harmonization. Original numeric MODIS and categorical VIIRS confidence remain separate.

[MODIS attributes](https://firms.modaps.eosdis.nasa.gov/content/descriptions/FIRMS_MODIS_Firehotspots.html) and [VIIRS attributes](https://firms.modaps.eosdis.nasa.gov/content/descriptions/FIRMS_VIIRS_Firehotspots.html) support WGS84 pixel locations, UTC acquisition and pixel FRP in MW. Requested order AOI/date range and valid-pixel coverage are not established by these detection CSVs. The actual inside-polygon date extent is **2020-08-02 through 2025-10-18**, not proof of complete 2020–2025 coverage. Empty dates remain unknown. Raw row-version decoding, VIIRS shared temperature fields and inferred `type` still need source-specific clarification. No independent scientific validation or confirmed fire count is claimed.

## Activation and API checks

The existing running API at `http://localhost:3001` returned HTTP 200:

- `/api/observations?mode=ajloun`: 36 GeoJSON features, availability loaded, fixture false, coverage unknown.
- `/api/history/observations?region=ajloun&sensor=MODIS`: 5 records.
- `/api/history/observations?region=ajloun&sensor=VIIRS`: 31 records.
- `/api/history/coverage?region=ajloun`: unknown coverage.
- `/api/observations?mode=brazil-test`: 7 isolated fixture records.

No route contracts changed. Mission Atlas, Calendar and Intelligence use the same region loader and canonical filters. A once-per-archive-revision migration clears stale dates/hidden filters and selects the real date extent; subsequent intentional selections survive. Timeline source status now says archive rather than unconnected. Reset clears hidden FRP/source filters. MapLibre uses `promoteId` for canonical string IDs: without it rendered IDs collapsed to 0 and direct point clicks failed. Worker configuration remains unchanged.

## Executed verification

`npm test`: 68/68 passed at activation checkpoint; `npm run build` and `npm run lint` passed (existing large bundle warnings). Unit tests for empty pilot API scenarios now inject an empty catalog rather than depend on the developer's live database.

`node scripts/verify-real-archives.mjs`: headless Chrome verified actual API counts, all source coordinates inside Ajloun, migration from 2012-12-21 plus FRP 999, rendered point layer, direct mouse click and inspector metadata, sensor filters 5/31, date filtering/reset, Brazil 7 then Ajloun 36, Calendar observed days, all five existing intelligence modules, street/satellite source restoration and no uncaught exceptions. Desktop/mobile screenshots were captured and inspected. The test starts its own local services and closes only its children; the existing app at localhost:5173 remains available. Signal reveal is allowed to finish before screenshots.

Manual replay: refresh localhost:5173, skip intro, inspect header date extent and separate 31/5 ledger; click a visible point; change sensor/date/FRP and reset; switch Brazil and return; switch basemaps; open Calendar and the intelligence modules. Anomaly scores remain unavailable, and Fire DNA is descriptive only.

## Activation files

`server/archiveProfiles.js`, `server/productVerification.js`, `server/firmsArchive.js`, `server/importArchive.js`, `server/exportActivation.test.js`, `server/observations.test.js`, `server/foundation.test.js`; `shared/model.ts`, `shared/activation.ts`; `src/state/mission.ts`, `src/state/MissionContext.tsx`, `src/FireMap.tsx`, `src/motion/mapMotion.ts`, `src/components/AtlasTimeline.tsx`; `tests/activation.test.ts`, `scripts/verify-real-archives.mjs`, `docs/NASA_PRODUCT_VERIFICATION.md`, this report and `ARCHIVE_INGESTION.md`.
