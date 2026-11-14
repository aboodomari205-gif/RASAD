# Data provenance and available evidence

Current activation (2026-11-14): Ajloun 143 and Northern Jordan 6859 detections. Use SCIENTIFIC_DATA_AUDIT.json, SCIENTIFIC_HARMONIZATION_ENGINE.md and FIREPULSE_FINAL_ACCEPTANCE.md for current counts, all platform strata, source hashes and limits. The following earlier 36-record delivery audit is retained as historical evidence; it is not the current application dataset.

Historical pilot snapshot (not current activation): **36 real Ajloun detections (5 MODIS / 31 VIIRS)** with observed-date extent **2020-08-02 through 2025-10-18**. This is not continuous coverage. Default exploratory 1 km / 60 min matching gives **5 candidate edges, 6 participating observations, 1 connected group**. Across the five tested settings: **9 union edges, 0 stable across all five**. No calibrated sensor equivalence, confirmed fires, validated anomalies or historical median is claimed.

Ajloun deliveries: MODIS `DL_FIRE_M-C61_842987.zip` / `MCD14ML` / collection 6.1, and S-NPP VIIRS `DL_FIRE_SV-C2_842985.zip` / `VNP14IMGTML` / collection 2. Explicit export profiles preserve raw row revisions, original SNPP strings and opaque temperature fields without inventing channel mappings. Collection identity is distinct from raw row version.

The activation report records 19 MODIS rows (5 inside, 14 excluded) and 128 VIIRS rows (31 inside, 97 excluded), no rejected or duplicate rows in those imports. The existing Ajloun GeoJSON polygon is retained. See [activation](REAL_DATA_ACTIVATION.md) and [historical byte audit](NASA_ARCHIVE_AUDIT.json).

Historical ZIP/CSV hashes exist in the audit documentation. Current frontend dataset metadata does not expose archive checksums; Research Brief reports that gap. Those historical hashes were not rechecked or bound to exports in this closure. Byte identity is not authentication of a NASA delivery chain.

Historical fixture note: the former Brazil development workflow is retired. No fixture is registered in the active catalog or scientific exports. Historical audit files remain historical; they are not an active data source.

The local historical database and static archive snapshot are different transports of canonical observations; static loading needs no Express service. Import/storage success does not prove acquisition coverage. Source data and secrets must not be committed.

Earth imagery attribution remains in [NASA asset credits](../public/earth/ATTRIBUTION.md); it is historical illustrative imagery, not live observations.

References: [NASA MODIS attributes](https://firms.modaps.eosdis.nasa.gov/content/descriptions/FIRMS_MODIS_Firehotspots.html), [NASA VIIRS attributes](https://firms.modaps.eosdis.nasa.gov/content/descriptions/FIRMS_VIIRS_Firehotspots.html), [FIRMS delivery README](https://firms.modaps.eosdis.nasa.gov/download/Readme.txt).
Current geographic scope: Ajloun and Northern Jordan only. North boundary is available; archive activation is intentionally unavailable pending a separately authorized import. See [Jordan restructuring](JORDAN_REGIONS_RESTRUCTURE_REPORT.md).
