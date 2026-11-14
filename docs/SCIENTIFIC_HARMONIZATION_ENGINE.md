# Scientific harmonization engine

Implemented and locally verified on 2026-11-13. No imports, original-observation edits, deployment, Git push or release package.

## Decision and actual contribution

GO for reproducible structural, UTC, geographic and source-aware descriptive harmonization with exploratory correspondence and sensitivity. NO-GO for calibrated equivalent counts, coverage-normalized trends, verified zero activity, historical medians/anomalies or confirmed fire events. Software verification is not independent scientific calibration.

The shared versioned engine reuses the canonical model, Calendar and Agreement Lab. New capabilities are indexed spatiotemporal matching, source-stratum seasonal series, explicit detection-extent overlap windows, source-provenance auditing and additive reproducible scientific exports. It adds no new page or Atlas overlay.

## Data audit

[SCIENTIFIC_DATA_AUDIT.json](SCIENTIFIC_DATA_AUDIT.json) contains full source-separated daily/monthly/yearly/seasonal series, source and confidence histograms, first/last dates, missing FRP/UTC counts, canonical-ID digests, original ZIP checksums, polygon membership, candidate graph and sensitivity. [SCIENTIFIC_INDEPENDENT_CHECK.json](SCIENTIFIC_INDEPENDENT_CHECK.json) contains independent Python reconciliation.

The active SQLite generation was opened read-only and its SHA-256 verified unchanged afterward. Original ZIP hashes match active provenance. All selected records satisfy their unchanged polygons; every Ajloun raw observation is already present in North, so the region totals must not be added.

Reverified inventory: Ajloun 143 (11 MODIS / 132 VIIRS; 135 standard / 8 NRT), Northern Jordan 6859 (352 MODIS / 6507 VIIRS; 6594 standard / 265 NRT). Both have Terra, Aqua, S-NPP, NOAA-20 and NOAA-21. No conflicting canonical IDs, coordinate/time repeats, null FRP or missing exact UTC were found in the current catalog. These are delivery findings, not coverage claims; synthetic tests cover missing values and duplicates.

Four separate concepts remain explicit: file delivery extent; actual detection-date extent; external satellite operational availability; verified acquisition opportunity. Only the first two are supplied by these tables. First delivered years are never interpreted as introduction years, operational lifetime or clear-sky coverage.

Original MODIS 6.03/61.03, VIIRS 2/2.0NRT, raw SNPP identifiers, confidence semantics and temperature column names remain untouched. No channel aliases, version corrections or normalized confidence are invented.

## Exact methods

### A - Structural

Reuse normalizeCollection, canonical fp1 IDs, ingestion checks and verified region membership. Dataset types now explicitly describe existing optional delivery profiles and ZIP/member provenance. No source or identity is rewritten. Identical IDs are deduplicated for analysis; conflicting content under one ID is rejected. Fixtures cannot establish scientific history.

### B - UTC time and seasons

A source stratum is the tuple (region, datasetId, source, sensor, platform, product, original version, processing, confidence scheme).

For a day/month/year bucket B, N(B) is its distinct canonical-ID count. Reported FRP is summed only over known values; FRP_reported counts those values, including actual zero. If all FRP is missing, the sum is null. No unobserved period is zero-filled. The existing historicalSummary implementation is reused.

UTC meteorological seasons are DJF/MAM/JJA/SON. December belongs to the following DJF year. December 2026 can therefore contribute to the label 2027-DJF without inventing any 2027 acquisition. Seasonal rows carry actual first/last delivered dates and source IDs. Counts reconcile exactly to unique observations; a season label never implies complete coverage.

Unobserved dates within a detection extent are dates with no delivered rows between the first and last detection. They do not establish missing acquisitions or zero thermal activity.

### C - Geography and descriptive fingerprints

Reuse exact Ajloun ADM1 and the dissolved Northern Jordan union, with the existing outer-boundary, hole and multipolygon rules. Audit every selected record and governorate assignment. Ajloun is included once in North.

Reuse the existing source-separated 0.02-degree bins. They are descriptive occupancy, not equal-area density, pixel accuracy, event counts or burned area. The existing software gate requires at least two observed years of the same real standard source/platform/product/version for year-to-year descriptive fingerprints. Two years alone do not validate recurrence or a historical baseline. No calibrated fingerprint or anomaly score is returned.

### D - Indexed exploratory association

Default remains 1 km / 60 minutes. Eligibility requires non-fixture MODIS or VIIRS, finite coordinates and exact UTC, and known standard or NRT processing. Unknown processing cannot be matched against another unknown stage. Candidate edges require the same region and processing stage, opposite sensor families, and inclusive distance/time predicates.

Final distance is unchanged: with R=6371.0088 km,

h = sin^2((lat2-lat1)/2) + cos(lat1)*cos(lat2)*sin^2((lon2-lon1)/2)

d = 2*R*asin(sqrt(min(1,h))) <= selected radius

and abs(t2-t1) <= selected minutes*60000.

The prefilter indexes VIIRS unit-sphere vectors (cos(lat)*cos(lon), cos(lat)*sin(lon), sin(lat)). Spatial cell width is 2*sin(radius/(2*R))*(1+1e-12). An eligible pair cannot differ by more than this chord in any Cartesian coordinate, so neighboring cells suffice. UTC bucket width is the time tolerance; zero-tolerance uses the exact timestamp. Keys retain region and processing.

Each MODIS record examines at most 27 spatial times 3 temporal neighboring buckets, followed by exact predicates. Poles and the antimeridian need no approximate longitude box. Sorting by UTC/ID makes results reproducible. Candidate edges, participating IDs and connected groups remain different quantities. Transitive endpoints may exceed direct thresholds.

This is candidate/output-sensitive indexing, not a claim of universal subquadratic runtime: truly dense co-located observations can yield quadratic edge output. Existing caps remain 10000 candidate edges and 2000000 exact evaluations; dense cases fail explicitly rather than truncate. Coverage-gate eligibility also uses a set lookup instead of nested scans.

The existing sensitivity settings remain 0.25km/6min, 0.5km/7min, 1km/7min, 1km/60min and 2km/120min. They are exploratory assumptions, not calibrated probabilities or uncertainty intervals.

### E - Defensible comparability

For each opposite-sensor stratum pair in the same region and known processing stage, intersect the delivered detection extents: from=max(first_M,first_V), to=min(last_M,last_V). Retain separate IDs/counts within that geographic/time window and the actual dates with contributions from both. Empty intersection is unavailable. A shared date is neither simultaneous acquisition nor a confirmed event.

This is explicitly detection-extent overlap, not verified acquisition overlap. No universal count/FRP coefficient is fitted. Dividing counts by nominal pixel area or detected days is not implemented: neither supplies a defensible opportunity denominator, and detected days themselves depend on activity. Cloud/valid-pixel/acquisition masks and independent calibration are missing.

## Official documentation and published methods

[NASA MODIS attributes](https://firms.modaps.eosdis.nasa.gov/content/descriptions/FIRMS_MODIS_Firehotspots.html), [VIIRS attributes](https://firms.modaps.eosdis.nasa.gov/content/descriptions/FIRMS_VIIRS_Firehotspots.html) and the [FIRMS delivery README](https://firms.modaps.eosdis.nasa.gov/download/Readme.txt) were retrieved. They establish source-specific metadata and distinct processing/confidence semantics, not local acquisition masks. The README still conflicts with actual NOAA-20/21 standard archive deliveries, and some web availability dates differ from early delivered rows. Source lineage remains NEEDS REVIEW; records are preserved rather than silently corrected.

[Schroeder et al. 2014, NASA-hosted full paper](https://directreadout.sci.gsfc.nasa.gov/publications_documents/Schroeder_et_al_2014b_RSE.pdf) describes 375m detection, sampling and sensitivity differences. Its study results are not conversion coefficients for Jordan.

[Li et al. 2018](https://doi.org/10.1029/2017JD027823) examines geometry/scale-dependent FRP relationships in a MODIS C6 versus 750m VIIRS context. That is not a calibration of our Collection-2 375m deliveries; no published coefficients are transferred.

The two full papers were accessible. Alternate Earthdata PDF URLs returned 403 and the VIIRS ATBD timed out. The [official 2026 challenge page](https://www.spaceappschallenge.org/2026/challenges/modis-and-viirs-hot-spots/) returned 502 in this run. Full official submission compliance is UNVERIFIED; this implementation follows the user-supplied objectives without claiming NASA endorsement.

## Integration and reproducibility

ScientificContext is a collapsed section inside existing modules. Calendar passes displayed-month records after filters. Fire Season Clock, Fire DNA, Sensor Intelligence and Decision Brief pass the active mission scope. Evidence Engine/Agreement Lab pass their selected thresholds. No Atlas widgets were added.

The section shows source/platform/processing contributions, first delivered dates, matched detection-extent windows and UTC seasons, with English/Arabic limitations. Scoped JSON contains IDs, methodology, source provenance, seasonal reconciliation, association and sensitivity. Evidence JSON and Research Brief include the same engine result additively; original observation arrays and dataset checksums remain present. Backend routes are unchanged.

Browser raw limits remain three consecutive years / 3000 observations. The full audit is a separate Node calculation, never an automatic browser payload.

Reproduce without importing:

```powershell
node scripts/audit-scientific-data.mjs
python scripts/verify-scientific-independent.py
```

Open http://localhost:5173/#mission-atlas. In Evidence Engine start the existing real Ajloun 2023 guide; expand Scientific harmonization / scoped evidence, vary thresholds and export both JSON and Research Brief. Calendar July 2023 has 18 observations, distinct from the full-year 22.

## Claim gate

GO: source-aware UTC/geographic calendar; raw processing-separated historical/seasonal summaries; descriptive overlap-period comparisons; exploratory candidate correspondence with provenance/sensitivity.

NO-GO: operational availability from first detection; continuous sensor-independent event counts; calibrated equivalence; verified zero activity; validated historical median/anomaly; burned area; predictions or operational alerts.

Next requirement: authoritative platform-specific swath/acquisition/cloud/valid-pixel coverage, resolved processing lineage and independently validated exposure-aware methodology. Software tests cannot supply that missing scientific evidence.
