# Sensor differences and implemented alignment

Current verified local demonstration: **36 real Ajloun detections (5 MODIS / 31 VIIRS)** with observed-date extent **2020-08-02 through 2025-10-18**. This is not continuous coverage. Default exploratory 1 km / 60 min matching gives **5 candidate edges, 6 participating observations, 1 connected group**. Across the five tested settings: **9 union edges, 0 stable across all five**. No calibrated sensor equivalence, confirmed fires, validated anomalies or historical median is claimed.

MODIS nominal detection pixels are 1 km; VIIRS nominal pixels are 375 m at nadir. Actual footprints, acquisition schedules, detection sensitivity and retrieval behavior differ. Specifications come from NASA documentation, not inference from the sample. Preserve actual platform and UTC acquisition values.

MODIS numeric confidence and VIIRS categorical low/nominal/high remain original source semantics. FRP is pixel-integrated MW, not energy; reported sums expose missing contributions and are not cross-sensor normalized severity.

Implemented: common schema, UTC/date filters, source-separated daily/monthly/yearly alignment, a combined calendar with distinct source contributions, and exploratory proximity matching with adjustable sensitivity and edge-robustness views. Not implemented scientifically: exposure correction, calibrated sensor equivalence, universal count conversion, validated event deduplication, or anomaly baseline.

Same UTC date does not establish simultaneous acquisition or the same physical fire. A missing source contribution is unknown, not a zero or missed fire. Brazil is synthetic development-only evidence excluded from scientific matching.

References: [NASA MODIS attributes](https://firms.modaps.eosdis.nasa.gov/content/descriptions/FIRMS_MODIS_Firehotspots.html), [NASA VIIRS attributes](https://firms.modaps.eosdis.nasa.gov/content/descriptions/FIRMS_VIIRS_Firehotspots.html), [FIRMS delivery README](https://firms.modaps.eosdis.nasa.gov/download/Readme.txt).