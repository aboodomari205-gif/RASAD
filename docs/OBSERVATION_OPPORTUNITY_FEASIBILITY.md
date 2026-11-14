# Observation opportunity feasibility: investigated, not inferred

2026-11-13. Priority A is separated into (1) opportunity estimation and (2) true detection sensitivity calibration. Priority B is an exposure-aware, independently validated historical anomaly method. None of these is established by a detection-only CSV.

## Actual authoritative-data investigation

A bounded public NASA CMR query was executed from this machine, without credentials. The search bounding box was calculated from the existing Ajloun polygon: west 35.59931737679557, south 32.179165775380284, east 35.889010035784565, north 32.40865490190225. **This is a catalog search envelope, not a replacement region boundary or an authoritative coverage polygon.** No observations or geometry were imported/changed.

Pilot: 14 July 2023, because real Ajloun Aqua and S-NPP detections and candidate associations already exist that day. The authoritative sources are [CMR search API](https://cmr.earthdata.nasa.gov/search/site/docs/search/api.html), [MYD14 collection metadata](https://cmr.earthdata.nasa.gov/search/concepts/C2278858993-LPCLOUD.umm_json) and [VNP14IMG collection metadata](https://cmr.earthdata.nasa.gov/search/concepts/C2734202914-LPCLOUD.umm_json). Metadata can locate a candidate acquisition, but does not show the valid/cloud-free pixels in Ajloun.

| Actual catalog result | UTC interval | Reported science-file size | Actual access |
|---|---|---:|---|
| MYD14.A2023195.1040.061.2023196115913 | 10:40–10:45 | 0.428275 MB | Anonymous range probe ended at urs.earthdata.nasa.gov, HTTP 401 |
| VNP14IMG.A2023195.1036.002.2024079195729 | 10:36–10:42 | 2.56643486022949 MB | First S-NPP science-file probe ended at Earthdata login, HTTP 401 |
| VNP14IMG.A2023195.2254.002.2024079195727 | 22:54–23:00 | 0.755777359008789 MB | Catalog identified; this second file was not independently probed |
| MYD03 geolocation G2735498612-LAADS | 10:40–10:45 | 33.8434247970581 MB | Metadata only; no file downloaded |
| VNP03IMG geolocation G2735480895-LAADS | 10:36–10:42 | 175.832138061523 MB | Metadata only; no file downloaded |

The two fire-product catalog responses were only 4,948 and 11,099 bytes. HEAD initially returned 303; a bounded anonymous Range request, canceled without reading science content, followed redirects and established the 401 access blocker. No token, .env, account or credential was inspected. No authentication bypass was attempted. This is a specific access finding, not a claim that NASA data are paid or permanently inaccessible.

Provider version labels matter: LP DAAC fire collections use MYD14 061 and VNP14IMG 002; current CMR LAADS geolocation collections use MYD03 6.1 (C1379841358-LAADS) and VNP03IMG 2 (C2105092163-LAADS). Initial searches using 061/002 for geolocation returned no results; collection discovery resolved the provider-specific labels. Those empty searches were NOT interpreted as missing acquisitions. None of these labels was used to rewrite FIRMS original 6.03/61.03/2/2.0NRT values.

Reproduction:

```powershell
node scripts/discover-opportunity.mjs
node scripts/verify-scientific-completion.mjs
python scripts/verify-completion-independent.py
```

The first command performs small public metadata queries and anonymous HEAD/Range probes only, with per-response 2 MiB metadata limits and timeouts. It does not retrieve protected masks or geolocation grids. Evidence, raw catalog JSON and SHA256 are retained under .checkpoints/scientific-completion. Network availability can change; use the saved hashes for the audited run. Granule metadata is not yet tied to exact original FIRMS production-granule identifiers, which are absent from the CSV.

## Platform, product and lineage alignment

The [NASA VIIRS product page](https://ladsweb.modaps.eosdis.nasa.gov/missions-and-measurements/products/VNP14IMG/) identifies the 375 m S-NPP L2 swath product and C2 archive set. [VNP03IMG documentation](https://ladsweb.modaps.eosdis.nasa.gov/missions-and-measurements/products/VNP03IMG/) identifies per-pixel geolocation/quality fields. The [MODIS C6/C6.1 guide](https://modis-fire.umd.edu/files/MODIS_C6_C6.1_Fire_User_Guide_1.0.pdf) and [VIIRS C2 375 m guide](https://www.earthdata.nasa.gov/s3fs-public/2025-06/VIIRS_C2_AF-375m_User_Guide_1.2.pdf) describe fire-mask and QA layers. Direct PDF retrieval was blocked/timed out in this review; the official indexed class descriptions were available. Implementing a decoder requires the actual product/collection schema, not an old C1 file specification copied blindly.

For MODIS, Terra requires MOD14/MOD03 and Aqua MYD14/MYD03 in the appropriate C6.1 standard lineage. For S-NPP, VNP14IMG and VNP03IMG must be aligned by granule acquisition/orbit/processing metadata. NOAA-20/21 candidate families and their own geolocation/cloud products require separate collection/lineage verification; this pilot deliberately does not use S-NPP metadata to corroborate NOAA records. Existing documented NOAA-20/21 archive-lineage and early-date discrepancies remain unresolved.

Class masks distinguish processed land/fire from cloud, unclassified, unprocessed and, for VIIRS, bow-tie deletion/sun-glint conditions. MODIS land/water QA is necessary because some fire/cloud/unknown classes can also occur over water. A class lookup alone is not enough: geolocation, QA, polygon clipping, duplicated footprint handling and exact lineage must be verified. Daily or eight-day composites are not substitutes for per-overpass opportunities.

## What is actually implemented and independently verified

The new catalogAcquisitionAudit performs a conservative **temporal catalog corroboration**:

- Same supported platform/sensor, standard processing, non-fixture observation and exact UTC are required.
- An acquisition timestamp t may link to a catalog granule if start <= t < end. Half-open intervals prevent artificial double membership at adjacent granule boundaries.
- Original observation IDs, dataset IDs, timestamps, candidate granule IDs and catalog hashes remain traceable. Conflicting observation IDs or repeated granule IDs fail closed.
- Actual July 14 Ajloun input contains 13 records: two Aqua, four S-NPP and seven NOAA-20. The first six have one temporal catalog candidate each; the seven NOAA-20 records are explicitly unsupported by this pilot, not invalidated or discarded.
- coverage, validPixelOpportunity, sensitivityCalibration and anomaly remain null; lineageVerified remains false. Existing candidate pairs are unchanged.

An independent Python implementation re-reads the raw CMR responses, verifies their SHA256/IDs/times/titles, and recomputes each interval join from read-only SQLite without importing JS. This validates catalog linkage computation only. Bounding-envelope hits, granule time ranges and a compatible product family do not prove exact source-reprocessing identity, actual pixel intersection or clear-sky observation.

## A1: proposed opportunity method — not enabled

For region R and a verified platform/product/processing stratum s, reconstruct geolocated pixel footprints and apply documented collection-specific land, processing and cloud/QA tests. For each independent overpass g, let Vsg be the union of accepted pixel footprints. Define:

- valid sampled area A(s,g,R) = area(R intersect Vsg), using an appropriate equal-area/geodesic area calculation;
- per-overpass regional valid fraction f(s,g,R) = A(s,g,R) / area(R);
- accumulated area-overpass exposure E(s,P,R) = sum of A(s,g,R) over verified distinct overpasses in period P.

Repeated coverage over separate passes contributes repeated area-overpass exposure intentionally; overlapping pixels within one pass must be unioned rather than double counted. E is not a probability, fraction of all fires seen or equivalent cross-sensor exposure. If acquisition inventory, geometry, QA, lineage or required files are incomplete, the applicable denominator is unknown, not zero. A verified clear pixel without a fire flag describes that sampled instant only; it does not prove no activity throughout the day.

Required acceptance: independently validate decoded class/QA values, dimensions/geolocation, exact polygon clipping (including holes), pass deduplication and area units, missing-granule behavior, and a hand-inspected subset against a second decoder/reference. Do not infer opportunity from the set of detection dates, swath catalog availability percentages, nominal daily passes, nominal pixel size or this bbox query.

## A2: sensitivity calibration — a different task

Even complete valid-pixel exposure cannot establish detection sensitivity. A calibration target is conditional P(detected by s | independently established thermal activity, valid opportunity, fire characteristics, viewing conditions). Estimation requires independent, co-temporal reference labels, including appropriate non-detections, with reference uncertainty and explicit spatial/temporal support. A contemporaneous high-resolution thermal/fire reference or a validated field campaign could help; another FIRMS sensor is not automatically ground truth.

The primary [2026 observation-operator study](https://gmd.copernicus.org/articles/19/10123/2026/) was examined: it shows dependence on pixel geometry/viewing conditions and uses overpass/weather information in its gridded methodology. Its published global parameters are not independent Ajloun validation or permission to import universal conversion coefficients. No coefficients or probability estimates from it were copied into FIREPULSE.

## B: opportunity-aware anomaly feasibility

A future source-consistent model could relate detection counts N(s,P) to verified exposure E(s,P), conditioned on calendar season and relevant acquisition/product changes. This is a research specification, not a fitted model. A simple N/E descriptive rate would still be a rate of satellite detections, not unique fires, and would require compatible measurement units and nonzero verified exposure.

A defensible anomaly score additionally needs: enough comparable non-overlapping historical periods; explicit missingness; a justified distribution/overdispersion treatment; reference and test periods separated in time; no selection on detections alone; source/processing stability; and held-out checks of false positives/calibration using independent evidence. There is no universally justified minimum number of years or z-score threshold for this sparse local data, so no arbitrary count of years unlocks validation.

The current delivery cannot distinguish no thermal activity from no usable acquisition on missing dates. The one-day catalog pilot does not create a historical denominator or independent outcome truth. Consequently no historical median, exposure-adjusted score, calibrated anomaly or prediction is enabled. The new matched-month count difference is expressly descriptive and selected-support-biased.

## Practical cost, access, licensing and blockers

The three fire masks sum to roughly 3.75 reported MB; the two daytime geolocation files alone sum to roughly 209.68 reported MB. Nighttime geolocation, other platforms and QA ancillary inputs are additional and unmeasured. These are reported catalog sizes, not bytes actually downloaded. A one-day pilot is computationally plausible on a suitable local machine, but whole-history processing would require a real file inventory and budget before any bulk retrieval.

This environment currently has no numpy, pyhdf, h5py, rasterio or shapely installed. MODIS HDF4 and VIIRS NetCDF4/HDF5 decoding, geospatial footprint computation and a second independent implementation are nontrivial new prerequisites. No libraries were installed merely to manufacture a partial result while files remained inaccessible. No reliable local runtime/memory estimate is claimed without the data and decoder.

MYD14 collection metadata points to [NASA data-use policy](https://earthdata.nasa.gov/earth-observation-data/data-use-policy). The queried VNP14IMG collection did not populate UseConstraints; absence is not an affirmative license grant. Preserve NASA product citations and verify current product-specific usage terms before redistributing new raw files. Earthdata login requirements are an access mechanism, not evidence of a paid data license.

**Decision:** GO for the verified catalog-time pilot and matched-month descriptive computation. NO-GO for numerical opportunity/calibration/anomaly claims with current accessible inputs. This is not a claim that the research is permanently impossible. Exact aligned masks/QA/geolocation, a successful authenticated/manual data delivery, independent decoder/geometry checks and reference labels would change the decision. Do not send credentials in chat or read secret files to overcome this boundary.

Reported FIRMS acquisition times have minute resolution in these deliveries. Normalized UTC strings ending in :00 do not establish sub-minute acquisition accuracy. Catalog interval linkage uses the reported time and remains candidate corroboration only.
