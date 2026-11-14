# Known limitations

Current verified local demonstration: **36 real Ajloun detections (5 MODIS / 31 VIIRS)** with observed-date extent **2020-08-02 through 2025-10-18**. This is not continuous coverage. Default exploratory 1 km / 60 min matching gives **5 candidate edges, 6 participating observations, 1 connected group**. Across the five tested settings: **9 union edges, 0 stable across all five**. No calibrated sensor equivalence, confirmed fires, validated anomalies or historical median is claimed.

1. Acquisition, cloud/valid-pixel and overpass coverage are unknown. No verified zero activity, sensor miss, recurrence, anomaly or true fire incidence follows from missing rows.
2. Matching thresholds are exploratory; many-to-many edges and transitive groups are not independently confirmed events. Confidence scales and raw counts are not interchangeable.
3. Raw MODIS row revisions and VIIRS shared temperature fields remain opaque. No temperature aliases or unsupported revision decoding are used in matching.
4. Historical archive hashes are documented but missing from frontend dataset provenance; independent delivery integrity and upstream lineage remain unverified.
5. Static archive operation works without Express and is not live. Future deliveries require rebuilding the snapshot. Persistent SQLite requires durable disk when running the import service; ephemeral serverless writes are unsuitable.
6. Existing query/matching/display limits are retained. Large requests may require a narrower scope. Local Chromium tests do not certify physical touch devices, screen readers, all browsers or public hosting.
7. Basemap tiles require external network access; large lazy Three.js/MapLibre bundles remain. No public deployment is verified here.
8. Official challenge objectives were supplied by the owner; independent retrieval of detailed submission rules/platform obligations remains outstanding. No NASA endorsement or independent scientific calibration is claimed.
9. The former development-fixture workflow is retired. Northern Jordan data are not imported or activated; lack of displayed records is not verified zero activity.
