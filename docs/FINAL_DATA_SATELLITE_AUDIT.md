# Final data and satellite audit

13 November 2026. Read-only examination of the two existing local ZIPs, their CSV members, extracted CSVs, documented provenance and current import/query/frontend code. No code changes, imports, large downloads, deployment or release packaging were performed. This report is the only intended repository change.

## Decision and exact next step

**GO: retain the verified 36-record Ajloun demonstration for an honestly scoped submission. NO-GO: expand archives or platforms in the remaining pre-submission window.** The actual sample demonstrates both instruments, a combined source-separated calendar and exploratory correspondence. It does not demonstrate Terra detections inside Ajloun, continuous 2000-to-present history, validated sampling completeness or calibrated sensor equivalence.

The next step is to freeze the observations, use the precise platform statement below in the presentation, and complete the submission-rule check and human rehearsal. Do not expand the polygon to manufacture Terra detections. A future expansion should start as an isolated, reviewed same-region standard-processing delivery, never by replacing the active demonstration or concatenating raw files.

## Actual record evidence

Counts and UTC extrema below were recomputed directly from the named CSV members inside the actual ZIPs. Polygon membership used the existing shared `pointInRegion` and `loadAjlounGeometry`, not a bounding box or inferred requested AOI.

| Delivery / scope | Rows | Actual platform fields | Earliest acquisition UTC | Latest acquisition UTC |
| --- | ---: | --- | --- | --- |
| MODIS `fire_archive_M-C61_842987.csv`, full input | 19 | Aqua 13; Terra 6 | 2020-05-18T11:05:00Z | 2025-11-05T12:20:00Z |
| Same MODIS, inside Ajloun | 5 | Aqua 5; Terra 0 | 2020-10-24T10:22:00Z | 2025-07-02T11:18:00Z |
| VIIRS `fire_archive_SV-C2_842985.csv`, full input | 128 | raw satellite `SNPP` 128 | 2020-05-01T10:53:00Z | 2025-10-18T10:32:00Z |
| Same VIIRS, inside Ajloun | 31 | raw satellite `SNPP` 31 | 2020-08-02T10:09:00Z | 2025-10-18T10:32:00Z |

MODIS spatial exclusion is 14 records: the remaining 8 Aqua and all 6 Terra rows. VIIRS spatial exclusion is 97 records. These counts agree with the prior activation report. Combined inside-polygon observed-date extent is **2020-08-02–2025-10-18**, not the full-input MODIS end date or proof of continuous coverage.

**Presentation wording:** “Our MODIS delivery contains Terra and Aqua records. Within the unchanged Ajloun pilot polygon, the available MODIS detections are all Aqua; we compare those five detections with 31 S-NPP VIIRS detections.” Individual MODIS platforms are supported by actual `satellite` values, not inferred merely because MCD14 is a combined product family.

## Product, source and raw revisions

| Property | MODIS delivery | VIIRS delivery |
| --- | --- | --- |
| ZIP | `DL_FIRE_M-C61_842987.zip` | `DL_FIRE_SV-C2_842985.zip` |
| Documented delivery family | MODIS Collection 6.1 standard active-fire locations, MCD14ML | S-NPP VIIRS Collection 2 standard active-fire locations, VNP14IMGTML |
| Raw `instrument` field | `MODIS` on all 19 rows | `SNPP` on all 128 rows |
| Raw `satellite` field | `Aqua` / `Terra` | `SNPP` |
| Raw `version`, full input | `6.03`: 14; `61.03`: 5 | `2`: 128 |
| Raw `version`, Ajloun | `6.03`: 2; `61.03`: 3 | `2`: 31 |
| Source column in CSV | Absent | Absent |

NASA FIRMS source/product attribution comes from delivery naming/documentation and dataset metadata, not a source string measured in each CSV row. Canonical VIIRS/S-NPP identity is derived by the explicit delivery profile while original `SNPP` fields remain retained. Collection declaration and opaque raw row revision are different fields. Do not silently rewrite `6.03`/`61.03`, treat them as calibration eras, or infer VIIRS temperature-channel meanings from shared headers.

[NASA's delivery README](https://firms.modaps.eosdis.nasa.gov/download/Readme.txt) documents these standard-delivery names and distinguishes them from NRT products. The [MODIS attributes](https://firms.modaps.eosdis.nasa.gov/content/descriptions/FIRMS_MODIS_Firehotspots.html) document UTC, platform identity and numeric confidence. The [VIIRS attributes](https://firms.modaps.eosdis.nasa.gov/content/descriptions/FIRMS_VIIRS_Firehotspots.html) document UTC and a separate categorical confidence scale. These are hotspot detections, not burned-area products or independently confirmed fires.

## Byte integrity recheck

The following hashes were recomputed during this review and match `docs/NASA_ARCHIVE_AUDIT.json`. Each extracted local CSV was also byte-equal to its ZIP member. No frontend metadata or export manifest was changed to bind these hashes.

| File | SHA-256 |
| --- | --- |
| MODIS ZIP | `03196399f1bbd9feaa46e3cc7557a6c62ff3a544dc5d4c5cd03e48393b84268a` |
| MODIS CSV member | `4733b146e4de6de0cf62dddd090b17fedd32f31d24fbae232e7054ea635f66e0` |
| VIIRS ZIP | `3117f6ccce99d31cacd7892ea5bf27eadc3af790a22f8a9e999be88bc158f59f` |
| VIIRS CSV member | `b2aa325124f7cb032a1025eedda10dc9521558fa27e000521274a0e092d981bc` |

This establishes consistency with the previously audited local bytes. It does not authenticate the upstream download chain, prove request completeness or resolve opaque raw fields. Earlier closure statements that hashes were not rechecked describe that earlier task; this audit now performs the recheck without altering their historical records.

## Known observations versus unknown coverage

Known: the actual rows, platform strings, acquisition extrema, delivery families, local byte identities and membership under the existing Ajloun geometry. Unknown: exact order request parameters, complete requested date/AOI delivery, acquisition opportunities, cloud/valid-pixel masks, and whether an absent row indicates no detection, obstruction, missing acquisition or missing delivery.

**A 2000-to-present observational series cannot be constructed from these files.** Their full inputs start in May 2020 and end in 2025. Rendering earlier empty calendar cells would add no historical evidence. A source-separated index of delivered observation dates can be constructed; a complete burning-activity or verified-zero time series cannot.

Official attribute pages currently list Terra product temporal availability from November 2000 and Aqua from July 2002, while the VIIRS page lists S-NPP from January 2012, NOAA-20 from January 2020 and NOAA-21 from January 2024. These are documented product availability statements, not evidence that our files contain those histories or that every day/region was observed. The S-NPP page currently ends at 2 November 2026; do not describe it as an indefinitely current feed or infer spacecraft operational conclusions from that service listing.

## Expansion options and GO/NO-GO

Effort estimates are for a familiar engineer and exclude uncertain NASA delivery latency and independent scientific review.

| Option | Exact intended source/product | Effort / risks | Decision before submission |
| --- | --- | --- | --- |
| Extend same AOI backward with MODIS | [FIRMS archive download](https://firms.modaps.eosdis.nasa.gov/download/), M-C61, standard `fire_archive_M-C61_*`, MCD14ML C6.1; retain actual Terra/Aqua fields | 6–12 h engineering plus delivery/review; changed counts/expectations and early Terra-only availability; same-sensor catalog limitation below | **NO-GO now**; defensible later with isolated staging |
| Extend same AOI backward with S-NPP | FIRMS SV-C2, standard `fire_archive_SV-C2_*`, VNP14IMGTML C2, explicit export schema review | 6–12 h plus delivery/review; earlier source revisions may exceed current allowlist; no new coverage proof | **NO-GO now**; coherent future partner to MODIS |
| Add NOAA-20/21 | FIRMS J1V-C2 / J2V-C2; documented NRT names VJ114IMGDL / VJ214IMGDL in the delivery README | 1–3+ days including explicit platform profiles, source separation and acceptance; current README says standard-quality FIRMS data are not yet available for these platforms | **NO-GO**; never insert their NRT data into standard S-NPP history |
| Obtain another historical product through another NASA archive | Requires delivery-specific product/version/processing documentation and adapter review | Unbounded without inspecting actual schema and lineage | **NO-GO for this deadline** |
| Retain current data and clarify exact satellite scope | Existing immutable deliveries, no import | 1–2 h presentation/rehearsal; no new scientific transformation | **GO — recommended** |

The official FIRMS delivery README was retrieved during this audit and explicitly separates NRT and standard products. Its statement about NOAA standard-data availability should be checked again when a future delivery is ordered; do not invent a standard NOAA archive product/version from analogy. [Source](https://firms.modaps.eosdis.nasa.gov/download/Readme.txt)

Future same-family expansion should pin **C6.1 standard MODIS** and **C2 standard S-NPP**, not silently mix MODIS C6/C6.1, VIIRS C1/C2, or standard/NRT. Existing `viirs-snpp` legacy profile accepts different declared version encodings/product metadata than the actual shared-header export profile; profile acceptance alone is not proof of scientific compatibility. Inspect and select the actual delivery schema rather than renaming fields or changing versions to satisfy a validator.

## Effects on the working application

| Area | Actual implementation implication |
| --- | --- |
| Canonical IDs | `shared/observations.ts` prefixes IDs with dataset identity. Importing overlapping records under a new dataset ID can preserve them as different identities; do not assume global overlap deduplication. Reusing an ID requires preserving truthful metadata/lineage. |
| Deduplication | Exact canonical replay handling is not event deduplication. Reprocessing, changed metadata and cross-source proximity must not silently delete observations. |
| UTC | Keep exact acquisition dates/times and original precision; midnight associations must not move observations to a different day. |
| Import profiles | `server/archiveProfiles.js` explicitly allowlists raw revisions/platforms for current exports. New raw revisions require review rather than a permissive bypass. |
| Frontend catalog | `src/data/observations.ts` currently rejects multiple datasets for the same sensor with “Explicit dataset selection required.” Importing additional files as independent same-sensor datasets may break loading even though backend storage accepts them. |
| Storage/query scale | Existing persistent query limit is 50,000 records; temporal aggregation and matching limits also remain. Do not assume expanded history fits whole-collection map/calendar loading. |
| Calendar | More observed dates/platform strata would be useful, but missing dates remain unknown. Both-source mode retains distinct source contributions; no continuous combined fire count is justified. |
| CSV | New rows change totals and original ID sets. CSV must retain dataset/product/version/processing/availability and exact displayed scope; overlapping catalogs must not inflate counts unnoticed. |
| Evidence Engine | More observations change pair/group counts and robustness. Matching is many-to-many, same-region/processing; larger files may hit 2-million-comparison / 10,000-pair guards. These are not calibration mechanisms. |
| Tests/presentation | Current 89-test baseline and browser assertions intentionally pin actual 5/31 totals and 5-edge results. An intentional data expansion needs independent new expected counts, updated scope-aware assertions and full rerun, not weakened assertions. |

## Minimum acceptance for any later expansion

1. Preserve current archives, active database and static snapshot; stage separately. Record order AOI/UTC window, product/collection/processing, source files, hashes and actual platform fields.
2. Review schema and raw revisions against delivery-specific documentation. Keep originals; do not infer channel aliases, source equivalence or coverage.
3. Independently compute full-input and exact-polygon counts, UTC extrema and per-platform counts. Reconcile rejected/duplicate/excluded rows and overlap against current data.
4. Resolve the same-sensor multi-dataset loader limitation explicitly before activation; verify identity/lineage policy and replay behavior under overlapping deliveries.
5. Test midnight, missing FRP, confidence separation, collection/stage mismatches, unknown availability and fixture isolation. No absent date becomes a verified zero.
6. Verify Calendar/CSV original-ID round-trip, full month/date filters, region handoff, source details and export reproducibility. Independently recalculate matching/sensitivity expected results.
7. Run build, lint, all unit/backend tests, E2E, language, release checks and static production-browser acceptance. Retain a rollback snapshot and rehearse the exact new data scope.

## Submission sufficiency and remaining uncertainty

The actual data are sufficient to demonstrate an **explicitly scoped Aqua-MODIS / S-NPP-VIIRS Ajloun prototype**, supported by a wider input MODIS delivery that includes Terra. They are insufficient to claim complete Terra/Aqua sampling inside Ajloun or any continuous 2000-to-present record. Adding observations before the deadline would increase engineering and lineage risk without supplying the missing coverage or calibration evidence.

Detailed official platform mandates and submission rules remain independently unverified; this data audit does not certify compliance with requirements not retrieved. If verified rules specifically mandate additional platforms or temporal scope, reassess compliance and disclose the limitation rather than silently importing incompatible data. No code/test-suite rerun was necessary for this read-only document; the 89-test passing baseline is prior executed acceptance, not newly claimed execution here. The read-only ZIP/CSV/hash/polygon calculations and official-reference retrieval above were executed in this audit.
