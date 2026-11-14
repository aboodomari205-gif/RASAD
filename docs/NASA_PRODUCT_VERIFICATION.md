# Current product verification status ? final closure

Current verified local demonstration: **36 real Ajloun detections (5 MODIS / 31 VIIRS)** with observed-date extent **2020-08-02 through 2025-10-18**. This is not continuous coverage. Default exploratory 1 km / 60 min matching gives **5 candidate edges, 6 participating observations, 1 connected group**. Across the five tested settings: **9 union edges, 0 stable across all five**. No calibrated sensor equivalence, confirmed fires, validated anomalies or historical median is claimed.

The explicit `modis-firms-export` and `viirs-snpp-firms-export` profiles now permit core-field ingestion while preserving opaque original fields. Real archive activation and source-aware candidate matching are implemented. The earlier blanket import hold and unavailable-Ajloun findings below are historical, superseded by [real activation](REAL_DATA_ACTIVATION.md), [current provenance](DATA_PROVENANCE.md) and [closure acceptance](FINAL_CLOSURE_REPORT.md).

Unresolved: raw version decomposition, VIIRS shared temperature-channel aliases, requested order completeness and verified acquisition coverage. No unsupported transformations are authorized. Historical hashes are documented but were not rechecked or bound to frontend exports in this closure. Brazil is synthetic development-only data, not NASA scientific evidence. Detailed official submission rules remain independently unverified.

## Historical verification record ? retained for audit, not current completion status

# NASA product verification — FIREPULSE

**Update: 12 November 2026 ? core observation activation completed.**

The earlier blanket import hold below is superseded for the two explicit `modis-firms-export` / `viirs-snpp-firms-export` profiles. See [REAL_DATA_ACTIVATION.md](REAL_DATA_ACTIVATION.md) for executed imports, API checks and browser results. The supported operation is raw-preserving UTC/coordinate/FRP/confidence ingestion and per-source calendar aggregation. It does **not** decode MODIS `6.03`/`61.03`, assign VIIRS `bright_t31` to a channel, validate `type`, or calibrate sensors. Those interpretations remain blocked/unavailable. Legacy profile guards remain fail-closed.

| Current acceptance check | Result |
| --- | --- |
| Delivery family, standard processing and platform from NASA delivery naming documentation | PASS, limited to documented naming and supplied file identity; not download-chain authentication |
| Both real archives imported and clipped to unchanged Ajloun polygon | PASS: MODIS 5 / VIIRS 31; zero rejected, 111 spatially excluded |
| Original row versions and shared-header temperatures retained without reinterpretation | PASS |
| Same map/calendar API and source-separated historical activity | PASS, descriptive UTC aggregation only |
| Decoding raw MODIS revisions, VIIRS channel aliases, original order coverage | NEEDS REVIEW; not required or used for core observations |
| Coverage-normalized comparison, confirmed events, calibrated anomalies | NOT AVAILABLE; no scientific validation claimed |

## Earlier review record (superseded implementation status)

The following records the pre-adapter review. Its FAIL/HOLD descriptions are historical; unresolved scientific semantics and source-access limitations still apply.

Both supplied ZIPs have now been inspected in place, without extraction, modification, ingestion or activation. Their naming conventions and embedded README link identify FIRMS **active-fire / thermal-anomaly location exports**, not burned-area products. However, the existing import profiles do not support the actual version and VIIRS field encodings safely. Authentication of the download chain, requested selection, some field meanings, and full challenge compliance remain unresolved. This is a software/documentation audit, not independent scientific validation.

Evidence labels: **PASS** means the stated, limited check has evidence; **FAIL** means the implementation does not currently satisfy it; **NEEDS REVIEW** means evidence is insufficient. A family-level PASS is not blanket approval of a delivery.

## 1. Official sources and access limits

| Reference | Exact official source | What was available |
| --- | --- | --- |
| S1 | [NASA Space Apps 2026 — Harmonization of MODIS and VIIRS Hot Spots](https://www.spaceappschallenge.org/2026/challenges/modis-and-viirs-hot-spots/) | Official indexed summary retrieved. Direct full-page retrieval repeatedly returned HTTP 502. The full detailed requirements/resources were **not** verified. |
| S2 | [FIRMS archive download](https://firms.modaps.eosdis.nasa.gov/download/) | Active-fire download formats and platform availability. Burned-area downloads are described separately. |
| S3 | [FIRMS MODIS attributes](https://firms.modaps.eosdis.nasa.gov/content/descriptions/FIRMS_MODIS_Firehotspots.html) | Sensor-specific fields and processing examples. |
| S4 | [FIRMS VIIRS attributes](https://firms.modaps.eosdis.nasa.gov/content/descriptions/FIRMS_VIIRS_Firehotspots.html) | VIIRS fields, aliases, platforms and caveats. |
| S5 | [FIRMS delivery README](https://firms.modaps.eosdis.nasa.gov/download/Readme.txt) | This is the link contained in **both actual ZIP Readme.txt members**. It identifies delivery prefixes, standard/NRT file families and WGS84 coordinates. |
| S6 | [NASA LAADS VNP14IMG](https://ladsweb.modaps.eosdis.nasa.gov/missions-and-measurements/products/VNP14IMG) | Independently identifies the VIIRS/Suomi-NPP active-fire family and Collection 2.0. This L2 product is not asserted to be the downloaded CSV itself. |
| S7 | [NASA FIRMS Academy notice](https://firms.modaps.eosdis.nasa.gov/academy/) | Official indexed notice concerning Collection-2 monthly-product Type classifications; rendered page extraction was empty. |
| S8 | [NASA Earthdata Forum: shared brightness headers](https://forum.earthdata.nasa.gov/viewtopic.php?t=6092) | User reports the shared headers; a FIRMS representative links the official attributes page. The reply does **not** explicitly resolve this archive's `bright_t31` mapping. |
| S9 | [FIRMS data API tutorial](https://firms.modaps.eosdis.nasa.gov/content/academy/data_api/firms_api_use.html) | Demonstrates SP/NRT and platform-specific dataset availability. It is not the order receipt for these ZIPs. |
| S10 | [NASA Earthdata combined attributes](https://www.earthdata.nasa.gov/data/tools/firms/active-fire-data-attributes-modis-viirs) and [FIRMS FAQ](https://www.earthdata.nasa.gov/data/tools/firms/faq) | Both returned HTTP 403 in this review. No unavailable content is treated as verified evidence. |

S5 names `fire_archive_M-C61` as the UMD-processed standard MODIS `MCD14ML` delivery and `fire_archive_SV-C2` as the standard S-NPP `VNP14IMGTML` delivery. Preserve that latter spelling as **documented by this source**; existing code uses `VNP14IMGML`, while S7 discusses the `Vxx14IMGML` family. Do not silently assert these strings are interchangeable. Collection, source product/export family, raw row version and processing revision need distinct provenance fields. [S5](https://firms.modaps.eosdis.nasa.gov/download/Readme.txt), [S7](https://firms.modaps.eosdis.nasa.gov/academy/)

There are observable inconsistencies between official pages: S5 describes an approximately three-month replacement lag and says standard NOAA-20/21 data are not yet available; S2 describes approximately five months, and S9 demonstrates NOAA-20 SP. These are **documentation-context differences**, not grounds for changing a delivery's identity. No fixed lag or universal platform availability is inferred. [S2](https://firms.modaps.eosdis.nasa.gov/download/), [S5](https://firms.modaps.eosdis.nasa.gov/download/Readme.txt), [S9](https://firms.modaps.eosdis.nasa.gov/content/academy/data_api/firms_api_use.html)

## 2. Actual delivery inspection

Local location: `server/data/archives/`. Reproducible aggregate results, numeric checks and complete checksums: [NASA_ARCHIVE_AUDIT.json](NASA_ARCHIVE_AUDIT.json).

| Evidence from file bytes | MODIS delivery | VIIRS S-NPP delivery |
| --- | --- | --- |
| ZIP | `DL_FIRE_M-C61_842987.zip` | `DL_FIRE_SV-C2_842985.zip` |
| CSV member | `fire_archive_M-C61_842987.csv` | `fire_archive_SV-C2_842985.csv` |
| CSV rows | 19 | 128 |
| Raw `instrument` | `MODIS`: 19 | **`SNPP`: 128**, not `VIIRS` |
| Raw `satellite` | `Aqua`: 13; `Terra`: 6 | **`SNPP`: 128**, not the profile's `N` / `S-NPP` |
| Raw `version` | **`6.03`: 14; `61.03`: 5** | **`2`: 128**, not `2.0` |
| Confidence | Numeric 15–100 | `l`: 23; `n`: 99; `h`: 6 |
| Day/night | D: 15; N: 4 | D: 99; N: 29 |
| Raw `type` | `0`: 19 | `0`: 128 |
| Exact repeated parsed CSV rows | 0 | 0 |
| Distinct dates with rows | 17 | 76 |
| Invalid acquisitions under shared UTC parser | 0 | 0 |
| Missing/invalid/negative FRP | 0 / 0 / 0 | 0 / 0 / 0 |

Both have exactly the reported 15-column header:

```text
latitude,longitude,brightness,scan,track,acq_date,acq_time,satellite,instrument,confidence,version,bright_t31,frp,daynight,type
```

This identical schema **does not imply identical sensor physics**. Numerical fields are finite and positive in these files; that is a syntax/range finding, not validation of radiometry, correct classification or complete sampling.

### Acquisition extent versus requested coverage

| Observed extent only | MODIS | VIIRS S-NPP |
| --- | --- | --- |
| First UTC timestamp | `2020-05-18T11:05:00.000Z` | `2020-05-01T10:53:00.000Z` |
| Last UTC timestamp | `2025-11-05T12:20:00.000Z` | `2025-10-18T10:32:00.000Z` |
| Bounds `[west,south,east,north]` | `[35.5912,32.1708,35.8923,32.4138]` | `[35.59639,32.17173,35.89929,32.4148]` |
| Inside existing Ajloun polygon | **5** | **31** |
| Outside existing Ajloun polygon | **14** | **97** |
| Inside-polygon UTC range | `2020-10-24T10:22:00.000Z` – `2025-07-02T11:18:00.000Z` | `2020-08-02T10:09:00.000Z` – `2025-10-18T10:32:00.000Z` |

The spatial audit uses **the existing** `loadAjlounGeometry()` and `pointInRegion()` with the current public boundary, not a replacement rectangle. The boundary checksum is recorded. This verifies membership under that implementation, not independent accuracy of the administrative boundary. Do not expand Ajloun's boundary to absorb the other detections.

**NEEDS REVIEW:** neither ZIP contains the original order's requested start/end dates or AOI geometry. Its README is only a public documentation link. Row minima/maxima cannot establish the requested selection, complete archive delivery, cloud-free coverage, or zero activity on absent days. Obtain the non-secret request parameters/order metadata. Do not supply a login token or private download URL.

## 3. Field semantics and product identity checklist

| Requirement | Status | Evidence / permitted interpretation / blocker |
| --- | --- | --- |
| Active-fire rather than burned area | **PASS — family identity** | S2 separates the products; matching ZIP and `fire_archive` prefixes follow S5. These are location detections, not burned-area polygons or estimates. Local hashes establish identity of reviewed bytes, not NASA download-chain authentication. |
| MODIS sensor/platform/family | **PASS — source convention** | S3 identifies Terra MOD14 / Aqua MYD14 and combined MCD14 active-fire products. Actual rows identify Aqua/Terra; S5 identifies this standard delivery as MCD14ML. |
| MODIS collection / raw version semantics | **NEEDS REVIEW** | Delivery prefix declares C6.1. Actual `6.03` and `61.03` are preserved verbatim. S3's examples use `6.1` and processing suffixes; those examples do not establish how these two delivered strings decompose. Do not call them erroneous, strip `.03`, parse them as collection decimals, or merge them under one inferred revision. |
| S-NPP sensor/platform/collection | **PASS — family; NEEDS REVIEW — adapter encoding** | S5 identifies `SV-C2` as S-NPP VIIRS 375 m; S6 confirms VIIRS/NPP C2. Raw row fields say `SNPP`/`SNPP`/`2`. The future adapter must derive canonical identity from verified source context while retaining these exact originals, rather than rejecting the platform string as a non-existent sensor. |
| Processing status | **PASS — delivery naming; NEEDS REVIEW — row revision mapping** | The members are `fire_archive_*`, not `fire_nrt_*`; S5 describes standard processing. ZIP names alone should not determine processing for arbitrary future members. No observed date or absence of an NRT suffix proves a raw revision mapping. |
| MODIS temperatures | **PASS — definition** | S3: `brightness` is channel 21/22 brightness temperature, `bright_t31` is channel 31; Kelvin. They are not surface or flame temperatures. |
| VIIRS `brightness` | **NEEDS REVIEW — delivery profile** | S4 documents `Bright_ti4 / Brightness (in web services)` as I‑4, Kelvin. The verified web-service alias must not automatically be applied to every CSV delivery. Keep this file's header and raw values while resolving its export-specific mapping. |
| VIIRS `bright_t31` | **NEEDS REVIEW — import blocker** | S4 documents I‑5 as `Bright_ti5 / Brightness_2`, not this delivered name. S8 acknowledges shared-header reports without an explicit channel mapping. No I‑5 or MODIS channel-31 meaning is assigned here. Numeric plausibility is insufficient evidence. |
| Time / coordinates | **PASS — interpretation and parsing** | S3/S4 document UTC acquisition times; S5 states geographic WGS84. Shared parsing validates all delivered acquisitions. Civil UTC dates remain separate from any local-time display. Requested extent remains unverified as described above. |
| Pixel footprint / FRP | **PASS — limited semantics** | S3/S4 describe variable scan/track footprints and pixel-integrated FRP in MW. VIIRS retrieval combines information at different resolutions. Never infer burned area from `scan × track`, integrate a daily energy estimate by summing MW, or calibrate counts from nominal resolution. |
| Confidence | **PASS — separate scales** | S3 numeric MODIS confidence and S4 categorical VIIRS `l/n/h` remain separate. Actual values conform to those respective syntaxes. Do not map 80 to `h`, assign VIIRS numerical probabilities, or share thresholds across sensors. |
| `type=0` / vegetation attribution | **NEEDS REVIEW** | S3/S4 describe an inferred hotspot type, not independent confirmation. S7 reports a C2 monthly-product Type bug corrected in May 2025 with reprocessing to product version 3. This file's raw `version=2` must **not** be assumed to mean affected monthly-product revision 2. Confirm upstream revision/reprocessing before vegetation-specific conclusions. |
| Additional VIIRS platforms | **NEEDS REVIEW — challenge mandate** | S4 identifies S-NPP, NOAA-20 and NOAA-21 as distinct platforms. Retrieved S1 summary does not establish whether every platform is compulsory. S-NPP + MODIS is a technically coherent **explicitly scoped historical demonstration**, not verified complete challenge compliance or global/current coverage. |
| Actual archive compatibility with current profiles | **FAIL** | MODIS profile expects `6.1`; VIIRS expects `1.0/2.0`, `VIIRS` instrument, supported S-NPP spellings and `bright_ti4/bright_ti5`. The files do not match. Tests of synthetic schemas did not prove compatibility with these deliveries. |

The S-NPP availability endpoint displayed by S2 ends on **2 November 2026**, while these delivered records end in 2025. This is a current service availability statement, not evidence of the requested window or an inferred spacecraft operational lifetime. NOAA platform start dates differ between S2 and S4, reinforcing the need for product-specific coverage evidence. [S2](https://firms.modaps.eosdis.nasa.gov/download/), [S4](https://firms.modaps.eosdis.nasa.gov/content/descriptions/FIRMS_VIIRS_Firehotspots.html)

## 4. Detections, duplication, association and events

These are separate concepts and must remain separate data entities:

1. **Raw detection:** one source row and its provenance. Retain original strings and unchanged coordinates alongside canonical fields.
2. **Exact replay:** byte/field-identical records within the same source identity. The inspection found none within either CSV. Existing ingestion identifiers preserve source context; this finding does not exclude duplicates against future deliveries.
3. **Possible repeated observation:** similar location/time but different metadata or acquisition. Keep it; proximity is not sufficient to delete a record.
4. **Candidate cross-sensor association:** a future documented spatial/temporal matching output, with member IDs, footprint assumptions and uncertainty. Not implemented or evaluated in this review. It must not replace raw records or be called a confirmed fire.
5. **Independently confirmed event:** requires external corroboration and an explicit event methodology. Neither CSV supplies that evidence. No confirmed-event count, calibration accuracy or validated anomaly score is produced.

## 5. Does FIREPULSE satisfy the challenge's central requirement?

S1 asks for harmonized MODIS/VIIRS records in a historical burning-activity calendar for a selected area, with exploration of patterns and critical periods. This supports an evidence-based integration requirement; it does not justify a universal sensor conversion or invented operational advice. [Official challenge summary](https://www.spaceappschallenge.org/2026/challenges/modis-and-viirs-hot-spots/)

**Overall: FAIL to demonstrate completion with these archives; partial software foundation exists.**

| Implementation evidence | Status |
| --- | --- |
| `src/calendar/aggregation.ts` uses shared normalization/daily aggregation; calendar dates, region and instrument filters work | **PASS — software implementation** |
| `shared/observations.ts` preserves provenance, filters UTC/region, separates incompatible source series, and retains unknown coverage | **PASS — software implementation** |
| `shared/harmonization.ts` explicitly reports `validatedNormalization:false`, `conversionFactor:null`, `fireEventClustering:false` | **PASS — honest limits** |
| Calendar shows one selected sensor; comparison aligns separate raw series rather than calibrated events | **PASS — descriptive alignment; not a validated sensor-equivalent history** |
| These actual deliveries populate the shared map/calendar after a verified adapter | **FAIL — no import or activation performed** |
| Validated treatment of sensor transitions, detection sensitivity, overpass/valid-pixel coverage and comparable history | **FAIL — not implemented/validated** |
| End-to-end historical acceptance test against these deliveries and verified request metadata | **FAIL — blocked by unresolved semantics** |
| Full detailed 2026 challenge/platform obligations | **NEEDS REVIEW — full page inaccessible** |

Do not present a working calendar or passed unit tests as proof of scientific harmonization. A defensible first release can provide a **provenance-separated historical detection calendar**, explicitly scoped and caveated; demonstrating that with actual verified inputs is still outstanding. Stronger normalized activity, anomaly, recurrence or confirmed-fire claims require separate methods and validation.

## 6. Enforced hold and release conditions

`server/productVerification.js` now throws **`PRODUCT_VERIFICATION_REQUIRED`** for MODIS `6.03`/`61.03` encountered in archive metadata or rows, and unverified VIIRS shared brightness headers. It is called by both profile validation and the generic archive adapter. This is an **unsupported-interpretation hold, not a finding of bad NASA data**. It stops the delivery; the streaming transaction rolls back even if earlier batches were written, and activation is not reached. Known supported schemas and the separate Brazil fixture remain unchanged. The gate is not an authenticity verifier for other inputs.

Release requires:

1. An official delivery-specific explanation of the two MODIS version strings, VIIRS raw `2`, `SNPP` field encoding, and VIIRS `brightness`/`bright_t31` mappings. Preserve citations and source versions; obtain NASA support clarification if documentation remains ambiguous. No message has been sent to NASA by this task.
2. Confirmed requested UTC interval/AOI and upstream processing/reprocessing lineage. Preserve collection, export product name and row version as distinct fields; keep source files immutable and checksummed.
3. An explicit new export adapter tested against the now-inspected schema. Do not rename CSV headers or edit versions to pass the old profile. Keep MODIS and VIIRS series separate and clip to the existing Ajloun polygon after source audit.
4. Review staging reports and verify exact raw-field round trips, date boundaries, 5/31 polygon membership under the pinned boundary, rejected/excluded counts, and calendar/map consistency before activation. These counts are audit expectations, never manufactured observations.
5. Resolve the full challenge requirements; label the demonstration's platform/time scope honestly. Obtain coverage/baseline evidence before stronger historical or risk claims.

## 7. Reproduce / changed files / test status

```powershell
python scripts/audit-nasa-deliveries.py --write-report
npm test
npm run lint
npm run build
```

The audit reads only the two named ZIPs and expected CSV members, reuses shared UTC/polygon logic, and writes only aggregate metadata to `docs/NASA_ARCHIVE_AUDIT.json`. It does not extract ZIPs, create a database, authenticate, fetch NASA data, or change active datasets.

Source checkpoint: `.checkpoints/nasa-verification-20261112/`. Added this report, the aggregate JSON, audit script, `server/productVerification.js` and its tests. Modified `server/archiveProfiles.js`, `server/firmsArchive.js` and the warning at the top of `ARCHIVE_INGESTION.md`. Existing APIs, UI/localization, map worker, datasets and secrets were not changed. No dataset was committed.

Software tests verify preservation/blocking and transaction behavior only. They do not establish product authenticity, calibration, coverage completeness, or NASA endorsement.

**Executed results:** `python scripts/audit-nasa-deliveries.py --write-report` completed for both supplied ZIPs; `npm test` passed **65/65** tests, including three new review-gate scenarios; `npm run lint` passed cleanly; `npm run build` passed with the existing large Three.js/MapLibre chunk warnings. The late-batch rollback test uses a transaction spy; the existing archive suite separately exercises real SQLite rollback/storage behavior. No end-to-end import of these real files, cross-sensor calibration, independent validation, or new browser test is claimed.
