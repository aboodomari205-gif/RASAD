# Advanced science data requirements

2026-11-14. No opportunity estimator, calibration coefficient or anomaly score is enabled by this report. The existing CMR audit is metadata/time corroboration only. Source evidence and prior actual access probes are in OBSERVATION_OPPORTUNITY_FEASIBILITY.md and .checkpoints/scientific-completion. No credential was accessed or authentication bypass attempted.

## Smallest candidate input package

Target the existing Aqua/S-NPP Ajloun comparison on 2023-07-14, not a bulk historical archive. The following are exact public download URLs returned in saved NASA CMR metadata. They identify candidate matching acquisitions and collections, **not yet verified identical FIRMS processing lineage**. The fire product's actual input-pointer metadata must confirm its geolocation dependency after download. If it names another granule/revision, obtain that referenced input instead of silently substituting the candidate below.

| Input | Exact filename / official link | Reported size | Purpose |
|---|---|---:|---|
| Aqua C6.1 fire mask and algorithm QA | [MYD14.A2023195.1040.061.2023196115913.hdf](https://data.lpdaac.earthdatacloud.nasa.gov/lp-prod-protected/MYD14.061/MYD14.A2023195.1040.061.2023196115913/MYD14.A2023195.1040.061.2023196115913.hdf) | 0.428275 MB | Full swath classes/QA, 10:40–10:45 UTC; sparse FIRMS detections are insufficient. |
| Aqua geolocation candidate | [MYD03.A2023195.1040.061.2023196153018.hdf](https://data.laadsdaac.earthdatacloud.nasa.gov/prod-lads/MYD03/MYD03.A2023195.1040.061.2023196153018.hdf) | 33.8434247970581 MB | Pixel geolocation/quality, same nominal interval. |
| S-NPP C2 fire mask and algorithm QA | [VNP14IMG.A2023195.1036.002.2024079195729.nc](https://data.lpdaac.earthdatacloud.nasa.gov/lp-prod-protected/VNP14IMG.002/VNP14IMG.A2023195.1036.002.2024079195729/VNP14IMG.A2023195.1036.002.2024079195729.nc) | 2.56643486022949 MB | 375 m L2 classes/QA, 10:36–10:42 UTC. |
| S-NPP geolocation candidate | [VNP03IMG.A2023195.1036.002.2023195181200.nc](https://data.laadsdaac.earthdatacloud.nasa.gov/prod-lads/VNP03IMG/VNP03IMG.A2023195.1036.002.2023195181200.nc) | 175.832138061523 MB | Image-band geolocation and quality, same nominal interval. |

Total is approximately 212.67 reported MB, excluding any additional required input revisions/ancillaries. These are metadata sizes, not downloaded bytes or measured compute cost. The four-file package is for **one daytime comparison**, not complete daily or historical opportunity. The independently identified 22:54 S-NPP granule and its geolocation are outside this minimum. Terra, NOAA-20/21 and all other relevant overpasses would require their own verified packages. No complete-pass inventory is asserted.

CMR references: [Aqua fire collection](https://cmr.earthdata.nasa.gov/search/concepts/C2278858993-LPCLOUD.umm_json), [S-NPP fire collection](https://cmr.earthdata.nasa.gov/search/concepts/C2734202914-LPCLOUD.umm_json), [Aqua geolocation collection](https://cmr.earthdata.nasa.gov/search/concepts/C1379841358-LAADS.umm_json), [S-NPP geolocation collection](https://cmr.earthdata.nasa.gov/search/concepts/C2105092163-LAADS.umm_json). Provider-specific version labels differ: fire 061/002 versus geolocation catalog 6.1/2. Original FIRMS versions are not rewritten from these labels.

## Safe manual download procedure

1. Open [NASA Earthdata Search](https://search.earthdata.nasa.gov/) in the owner's browser. Authenticate directly with Earthdata at its official login page. Do not give an assistant credentials, paste tokens in chat, edit .env or put authentication parameters into source code/logs.
2. Select the linked collection/version and the exact acquisition/granule, or open the direct provider link above. Confirm native filename, product, platform and UTC interval. Download individually through the provider's authenticated browser flow. Do not launch recursive archive download commands.
3. Save the native files into a separate local .checkpoints/opportunity-inputs directory, outside server/data and public. Do not rename HTML login/error responses to .hdf/.nc. Check status/type/size and native format before interpreting a successful-looking browser download.
4. Record native filename, collection/concept ID, source URL without temporary authentication parameters, actual bytes, download date and SHA256. Compare provider checksums when available. `Get-FileHash -Algorithm SHA256 -LiteralPath '<downloaded-file>'` requires no credential. Expected file SHA256 is unknown until verified; do not manufacture one.
5. Do not import or activate these files as detections. First inspect their native attributes, dimensions, input pointers and processing lineage in an isolated read-only workflow. Stop on inconsistent platform, collection, geolocation/QA dimensions, schema, checksum or lineage.

Actual anonymous probes of the first Aqua and S-NPP fire files ended with HTTP 401 at Earthdata in the prior pilot. This pass reuses that preserved evidence; it does not claim a new successful science download. Collection metadata/data-use links are documented in the feasibility report; confirm current product usage/citation terms. An empty UseConstraints field is not proof of a license grant.

## Opportunity method acceptance gate

Authoritative guides: [MODIS C6/C6.1](https://modis-fire.umd.edu/files/MODIS_C6_C6.1_Fire_User_Guide_1.0.pdf), [VIIRS C2 375 m](https://www.earthdata.nasa.gov/s3fs-public/2025-06/VIIRS_C2_AF-375m_User_Guide_1.2.pdf), [NASA VNP03IMG geolocation](https://ladsweb.modaps.eosdis.nasa.gov/missions-and-measurements/products/VNP03IMG/). Verify the exact versioned schema from the files and guide before implementing bit decoding.

Minimum checks before any numerical pilot:

- Correct HDF4 versus NetCDF4/HDF5 decoding and native fill/scaling/QA interpretation, including not-processed/cloud/unclassified/bow-tie conditions. Do not treat every non-fire cell as a valid observation.
- Source granule/acquisition/orbit and processing input alignment. Product-family/time compatibility alone is insufficient, especially with differing production revisions.
- Actual geolocated samples filtered against the unchanged Ajloun polygon, with explicit shared-boundary/holes policy. A search bbox never supplies authoritative AOI membership.
- Specify the estimand first. A count of valid geolocated pixel centers inside the polygon is a **sample count**, not covered area. Fractional regional coverage requires verified footprints or independently assessed footprint reconstruction and spatial union/area calculations; do not multiply by nominal 1 km or 375 m squares.
- Independently decode a subset using a second implementation or validated reference tool; compare exact selected sample IDs/classes/QA and geometry results. Validate fill values, off-swath areas, missing granules, duplication and negative cases. Preserve file hashes.
- If actual footprints are validated, valid area per independent pass can be area(R intersect union(valid pixel footprints)). Repeated coverage in one pass must not double count. Accumulated area-overpasses is not a detection probability or daily certainty of no activity.

The environment lacks the necessary scientific raster/geospatial decoder libraries, and no protected inputs have been retrieved. No dependencies were installed speculatively. No runtime/memory or scientific validation result can be claimed from metadata alone.

## Calibration and anomalies need additional evidence

Opportunity is not calibration. Sensitivity estimation needs independent, co-temporal fire/no-fire reference labels with known limitations, sampled under measured opportunity and relevant viewing/background conditions. Another FIRMS sensor, agreement rate or raw count ratio is not automatically ground truth. The [published observation-operator study](https://gmd.copernicus.org/articles/19/10123/2026/) supplies a methodological research lead, not validated coefficients for this Ajloun delivery.

A defensible anomaly model needs a source-consistent historical exposure inventory, comparable seasonal support, explicit missingness, appropriate count/dispersion modeling and temporally held-out independent checks. A one-pass mask pilot cannot establish that baseline. There is no justified universal minimum year count or arbitrary z-score threshold that unlocks validation here.

NOAA-20/21 delivery lineage remains unresolved; do not transfer S-NPP masks or calibration to those platforms. Until these inputs and checks exist, opportunity, calibrated equivalents, historical-median/anomaly scores and confirmed-fire outputs remain null/unavailable. No assumed daily overpass, detection-date denominator or nominal-pixel conversion is permitted.
