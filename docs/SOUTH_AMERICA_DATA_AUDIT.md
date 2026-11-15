# South America data audit

Generated from the atomically activated database and an independent raw-file reader on 2026-11-15.
Generation: `86f1f872f7366fe4`. This document supersedes previous study-area completion reports for the active application.

Independent raw rows: **48,952,994**. Imported unique polygon-contained rows: **48,552,057**.
Outside the Natural Earth continent union: **379,274**. Exact canonical duplicates: **21,661**. Quarantined: **2**.
Each delivery reconciles input = inserted + duplicates + excluded + quarantined. Source summaries independently reconcile to stored chunk counts.

| Source stratum | Unique rows | First UTC date | Last UTC date | Positive dates |
|---|---:|---|---|---:|
| sa-modis-aqua-nrt | 103,363 | 2026-09-01 | 2026-11-13 | 73 |
| sa-modis-aqua-standard | 10,772,150 | 2002-07-04 | 2026-08-31 | 8,798 |
| sa-modis-terra-nrt | 63,818 | 2026-09-01 | 2026-11-13 | 73 |
| sa-modis-terra-standard | 6,662,456 | 2000-11-01 | 2026-08-31 | 9,369 |
| sa-n20-noaa20-nrt | 847,502 | 2026-08-01 | 2026-11-14 | 106 |
| sa-n20-noaa20-standard | 21,090,900 | 2018-04-01 | 2026-07-31 | 3,038 |
| sa-n21-noaa21-nrt | 817,659 | 2026-08-01 | 2026-11-14 | 106 |
| sa-n21-noaa21-standard | 8,194,209 | 2023-03-01 | 2026-07-31 | 1,247 |

| File / member | Input | Inserted | Duplicates | Outside polygons | Quarantine |
|---|---:|---:|---:|---:|---:|
| DL_FIRE_J1V-C2_847873old.zip / fire_archive_J1V-C2_847873.csv | 21,281,290 | 21,090,900 | 0 | 190,390 | 0 |
| DL_FIRE_J1V-C2_847873old.zip / fire_nrt_J1V-C2_847873.csv | 742,861 | 739,469 | 0 | 3,392 | 0 |
| DL_FIRE_J2V-C2_847874old.zip / fire_archive_J2V-C2_847874.csv | 8,272,381 | 8,194,209 | 0 | 78,172 | 0 |
| DL_FIRE_J2V-C2_847874old.zip / fire_nrt_J2V-C2_847874.csv | 718,794 | 715,339 | 0 | 3,455 | 0 |
| DL_FIRE_M-C61_847869old.zip / fire_archive_M-C61_847869.csv | 17,535,420 | 17,434,606 | 0 | 100,812 | 2 |
| DL_FIRE_M-C61_847869old.zip / fire_nrt_M-C61_847869.csv | 137,509 | 137,068 | 0 | 441 | 0 |
| J2_VIIRS_C2_South_America_VJ214IMGTDL_NRT_2026318.txt / J2_VIIRS_C2_South_America_VJ214IMGTDL_NRT_2026318.txt | 3,512 | 3,469 | 0 | 43 | 0 |
| MOIDS.zip / MOIDS/MODIS_C6_1_South_America_MCD14DL_NRT_2026304.txt | 2,471 | 0 | 2,464 | 7 | 0 |
| MOIDS.zip / MOIDS/MODIS_C6_1_South_America_MCD14DL_NRT_2026305.txt | 2,772 | 2,734 | 0 | 38 | 0 |
| MOIDS.zip / MOIDS/MODIS_C6_1_South_America_MCD14DL_NRT_2026306.txt | 1,686 | 1,674 | 0 | 12 | 0 |
| MOIDS.zip / MOIDS/MODIS_C6_1_South_America_MCD14DL_NRT_2026308.txt | 2,471 | 2,445 | 0 | 26 | 0 |
| MOIDS.zip / MOIDS/MODIS_C6_1_South_America_MCD14DL_NRT_2026309.txt | 2,804 | 2,791 | 0 | 13 | 0 |
| MOIDS.zip / MOIDS/MODIS_C6_1_South_America_MCD14DL_NRT_2026310.txt | 4,174 | 4,141 | 0 | 33 | 0 |
| MOIDS.zip / MOIDS/MODIS_C6_1_South_America_MCD14DL_NRT_2026311.txt | 2,535 | 2,525 | 0 | 10 | 0 |
| MOIDS.zip / MOIDS/MODIS_C6_1_South_America_MCD14DL_NRT_2026312.txt | 2,579 | 2,577 | 0 | 2 | 0 |
| MOIDS.zip / MOIDS/MODIS_C6_1_South_America_MCD14DL_NRT_2026313.txt | 1,637 | 1,611 | 0 | 26 | 0 |
| MOIDS.zip / MOIDS/MODIS_C6_1_South_America_MCD14DL_NRT_2026314.txt | 2,441 | 2,437 | 0 | 4 | 0 |
| MOIDS.zip / MOIDS/MODIS_C6_1_South_America_MCD14DL_NRT_2026315.txt | 2,904 | 2,881 | 0 | 23 | 0 |
| MOIDS.zip / MOIDS/MODIS_C6_1_South_America_MCD14DL_NRT_2026316.txt | 1,659 | 1,652 | 0 | 7 | 0 |
| MOIDS.zip / MOIDS/MODIS_C6_1_South_America_MCD14DL_NRT_2026317.txt | 2,654 | 2,645 | 0 | 9 | 0 |
| viirs.zip / viirs/J2_VIIRS_C2_South_America_VJ214IMGTDL_NRT_2026304.txt | 8,460 | 0 | 8,365 | 95 | 0 |
| viirs.zip / viirs/J2_VIIRS_C2_South_America_VJ214IMGTDL_NRT_2026306.txt | 7,046 | 6,975 | 0 | 71 | 0 |
| viirs.zip / viirs/J2_VIIRS_C2_South_America_VJ214IMGTDL_NRT_2026307.txt | 7,930 | 7,859 | 0 | 71 | 0 |
| viirs.zip / viirs/J2_VIIRS_C2_South_America_VJ214IMGTDL_NRT_2026308.txt | 4,340 | 4,247 | 0 | 93 | 0 |
| viirs.zip / viirs/J2_VIIRS_C2_South_America_VJ214IMGTDL_NRT_2026309.txt | 9,316 | 9,131 | 0 | 185 | 0 |
| viirs.zip / viirs/J2_VIIRS_C2_South_America_VJ214IMGTDL_NRT_2026310.txt | 8,586 | 8,470 | 0 | 116 | 0 |
| viirs.zip / viirs/J2_VIIRS_C2_South_America_VJ214IMGTDL_NRT_2026311.txt | 10,486 | 10,397 | 0 | 89 | 0 |
| viirs.zip / viirs/J2_VIIRS_C2_South_America_VJ214IMGTDL_NRT_2026312.txt | 9,943 | 9,886 | 0 | 57 | 0 |
| viirs.zip / viirs/J2_VIIRS_C2_South_America_VJ214IMGTDL_NRT_2026313.txt | 7,243 | 7,169 | 0 | 74 | 0 |
| viirs.zip / viirs/J2_VIIRS_C2_South_America_VJ214IMGTDL_NRT_2026314.txt | 7,674 | 7,628 | 0 | 46 | 0 |
| viirs.zip / viirs/J2_VIIRS_C2_South_America_VJ214IMGTDL_NRT_2026315.txt | 6,545 | 6,468 | 0 | 77 | 0 |
| viirs.zip / viirs/J2_VIIRS_C2_South_America_VJ214IMGTDL_NRT_2026316.txt | 6,953 | 6,893 | 0 | 60 | 0 |
| viirs.zip / viirs/J2_VIIRS_C2_South_America_VJ214IMGTDL_NRT_2026317.txt | 7,149 | 7,068 | 0 | 81 | 0 |
| viirs.zip / viirs/J2_VIIRS_C2_South_America_VJ214IMGTDL_NRT_2026318 (1).txt | 3,512 | 0 | 3,469 | 43 | 0 |
| viirs.zip / viirs/J2_VIIRS_C2_South_America_VJ214IMGTDL_NRT_2026318.txt | 6,706 | 6,660 | 0 | 46 | 0 |
| viirs1.zip / viirs1/J1_VIIRS_C2_South_America_VJ114IMGTDL_NRT_2026304.txt | 7,424 | 0 | 7,363 | 61 | 0 |
| viirs1.zip / viirs1/J1_VIIRS_C2_South_America_VJ114IMGTDL_NRT_2026305.txt | 8,512 | 8,432 | 0 | 80 | 0 |
| viirs1.zip / viirs1/J1_VIIRS_C2_South_America_VJ114IMGTDL_NRT_2026306.txt | 7,826 | 7,709 | 0 | 117 | 0 |
| viirs1.zip / viirs1/J1_VIIRS_C2_South_America_VJ114IMGTDL_NRT_2026307.txt | 7,384 | 7,312 | 0 | 72 | 0 |
| viirs1.zip / viirs1/J1_VIIRS_C2_South_America_VJ114IMGTDL_NRT_2026308.txt | 9,914 | 9,814 | 0 | 100 | 0 |
| viirs1.zip / viirs1/J1_VIIRS_C2_South_America_VJ114IMGTDL_NRT_2026309.txt | 4,125 | 4,084 | 0 | 41 | 0 |
| viirs1.zip / viirs1/J1_VIIRS_C2_South_America_VJ114IMGTDL_NRT_2026310.txt | 10,229 | 10,141 | 0 | 88 | 0 |
| viirs1.zip / viirs1/J1_VIIRS_C2_South_America_VJ114IMGTDL_NRT_2026311.txt | 12,391 | 12,278 | 0 | 113 | 0 |
| viirs1.zip / viirs1/J1_VIIRS_C2_South_America_VJ114IMGTDL_NRT_2026312.txt | 9,298 | 9,224 | 0 | 74 | 0 |
| viirs1.zip / viirs1/J1_VIIRS_C2_South_America_VJ114IMGTDL_NRT_2026313.txt | 6,825 | 6,738 | 0 | 87 | 0 |
| viirs1.zip / viirs1/J1_VIIRS_C2_South_America_VJ114IMGTDL_NRT_2026314.txt | 7,750 | 7,707 | 0 | 43 | 0 |
| viirs1.zip / viirs1/J1_VIIRS_C2_South_America_VJ114IMGTDL_NRT_2026315.txt | 6,934 | 6,874 | 0 | 60 | 0 |
| viirs1.zip / viirs1/J1_VIIRS_C2_South_America_VJ114IMGTDL_NRT_2026316.txt | 7,695 | 7,636 | 0 | 59 | 0 |
| viirs1.zip / viirs1/J1_VIIRS_C2_South_America_VJ114IMGTDL_NRT_2026317.txt | 8,282 | 8,149 | 0 | 133 | 0 |
| viirs1.zip / viirs1/J1_VIIRS_C2_South_America_VJ114IMGTDL_NRT_2026318.txt | 1,962 | 1,935 | 0 | 27 | 0 |

The source files remain unmodified in incoming directories. ZIP SHA-256, member SHA-256, byte sizes, source-specific counts and year matrix are in [SOUTH_AMERICA_AUDIT.json](SOUTH_AMERICA_AUDIT.json).
The separate `csv.reader` / GEOS union audit imports no ingestion code and recomputes input counts, dates and polygon exclusions. Duplicate accounting is checked against the import ledger; independent audit does not pretend to independently certify every deduplication key.

## Geography

Natural Earth 5.1.2 admin-0, 1:110 million, public domain. South America is the union of its South American country components, including the French Guiana component of France. European France and Corsica are excluded. Country membership uses GEOS polygon coverage, with boundary included and holes excluded. A border tie uses the first declared polygon. The [-82,-56,-34,13] box is a camera/search extent only.
Generalized coastlines can exclude offshore/coastal detections. These are reported as polygon exclusions, not invalid NASA observations. These are cartographic study boundaries, not survey-grade or legal boundary determinations.
Source, version and upstream SHA are embedded in `public/south-america-countries.geojson`.

## Missingness and lineage

No South America S-NPP historical archive was supplied. The old `DL_FIRE_SV-C2_844716.zip` belongs to the retired study and is never substituted.
MODIS begins at the actual supplied 2000-11-01 record, not an invented January 2000 start. Missing positive dates do not prove missing files, complete delivery or zero detections.
NOAA-20/21 `fire_archive` members declare Standard processing, but the current [NASA export Readme](https://firms.modaps.eosdis.nasa.gov/download/Readme.txt) conflicts with that availability. Their original processing and values remain preserved and displayed as declared; they are blocked from historical-reference eligibility pending supplier clarification. The delivery dates are never claimed as satellite commissioning dates.

Active API regions and records are South American only. Original Jordan databases, raw backups and regression fixtures remain available outside production loading. No fallback to them is registered by the production API.
