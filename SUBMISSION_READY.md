# RASAD | رصد — submission-ready text

## Project name

RASAD | رصد

## Challenge

Harmonization of MODIS and VIIRS Hot Spots

## High-level summary

Two sensors, different resolutions, one transparent spatial-temporal framework. RASAD brings real Brazilian MODIS and VIIRS thermal detections into a common, source-preserving map and UTC calendar. Users inspect original observations, compare H3 or equal-area cells, examine delivered overlap and source-only patterns, and export reproducible evidence. An actual exploratory machine-learning experiment is separated from the future opportunity-aware calibration roadmap.

## Detailed description

RASAD is a Brazil-only Earth-observation research demonstration built around an interactive MapLibre map. MODIS (~1 km nominal) and VIIRS (~375 m nominal) have different sensitivity, footprints, confidence meanings and observing opportunities. RASAD preserves platform, product/processing stratum, acquisition UTC, reported FRP, original confidence and source provenance rather than treating pooled raw counts as physically equivalent.

The Mato Grosso pilot uses W −57, S −14, E −55, N −12 (WGS84), August 2024. Its actual delivered records contain 6,876 detections, 152 occupied H3 resolution-6 cells and 988 source-positive cell-days with reported FRP. Source-aware aggregation supports H3 resolutions 4–8 and declared 1/2/5 km equal-area grids. The map has MODIS/VIIRS filters, before/native and after/common-support views, observation inspection and an acquisition-date playback timeline. A linked Burning Calendar exposes real history and qualified same-month seasonal references. Arabic RTL and English LTR, mobile/desktop views, CSV/JSON and printable evidence support scientific explanation and review.

On the actual H3/day support, Aqua/NOAA-20 has 131 co-detected cell-days, 23 MODIS-only delivered and 223 VIIRS-only delivered (Jaccard 0.347480). Aqua/NOAA-21: 131/23/243 (0.329975); Terra/NOAA-20: 94/12/260 (0.256831); Terra/NOAA-21: 96/10/278 (0.250000). These values come from checked source evidence. Missing counterparts are not verified negatives, false negatives or sensor errors; same cell/day does not establish simultaneous overpasses or the same physical fire.

The benefit is transparent comparison: researchers can see what is observed, how common support is constructed, which differences are descriptive, and what evidence is still needed before stronger sensor-adjustment or historical-reconstruction claims.

Tools: React, TypeScript, Vite, MapLibre GL, h3-js, Node/Express, read-only indexed SQLite/compressed observation chunks and a reproducible lightweight Node regression-tree implementation. No new model, fabricated environmental features, synthetic hotspot maps or new dataset downloads were introduced in the final restoration.

## NASA data usage and provenance

The local indexed Brazilian archive contains 26,419,602 delivered NASA FIRMS MODIS Terra/Aqua and VIIRS NOAA-20/21 records. Original supplied files, acquisition values, source membership and checksums are preserved locally. Original raw files and the multi-GB index are excluded from GitHub. The portable repository includes source, methods, tests, screenshots and small actual derived model artifacts; full public map/history operation requires the original local index or a hosted durable API.

Source-declared NOAA-20/21 Standard lineage requires supplier clarification. S-NPP Brazilian history, full swath fire masks, matched valid-pixel/cloud opportunity, geolocation and independent validation inputs are not established by the delivered hotspot CSVs. Native MODIS percent confidence is not converted into VIIRS category confidence. No-data remains unknown, not verified zero fire activity.

## Honest AI disclosure

The trained exploratory model estimates **mean reported FRP conditional on a source-positive H3 cell-day**. It is not sensor calibration, downscaling, fire forecasting or validated historical reconstruction. The committed actual experiment uses 988 labels, 282 training rows and 60 depth-3 gradient-boosting trees. Input features are cell location, calendar season and exact source stratum; target FRP and future labels are excluded. No absent-hotspot negative labels are fabricated.

| Holdout | n | Baseline MAE MW | ML MAE MW | Baseline RMSE MW | ML RMSE MW |
|---|---:|---:|---:|---:|---:|
| Temporal | 306 | 24.003 | 27.216 | 54.775 | 59.370 |
| Spatial | 252 | 24.855 | 23.889 | 80.374 | 80.520 |
| Joint spatial/temporal | 148 | 16.561 | 16.472 | 39.198 | 42.450 |

Results are mixed: temporal performance is worse than baseline and joint RMSE is worse despite marginally lower MAE. No calibrated individual prediction intervals or independent-year validation exist.

Next research milestone: native fire masks + valid observation opportunities + geolocation → matched overpasses → source-aware adjustment → independent year/geographic validation → historical reconstruction only if validated. This is a future scientific pipeline, currently **DATA-BLOCKED**, not a trained calibrated output. No NASA endorsement or emergency-response validity is claimed.

## Full Project Link — required link 1

https://github.com/aboodomari205-gif/FIREPULSE

The final source destination is the public FIREPULSE repository. The full project link is the code/project URL, not the PDF demo link. GitHub source hosting is not a deployed application. Original local databases and raw NASA deliveries are excluded.

## Separate Project Demo Link — required link 2

`[PUBLIC_SEVEN_SLIDE_PDF_URL]`

Upload the actual local `submission/RASAD_NASA_DEMO_7_SLIDES.pdf` to a service accessible to judges and enable public viewing. Test its URL in a signed-out/private window. This must be a **separate shareable seven-slide PDF URL**, not the GitHub project root or localhost.

## References

- NASA FIRMS MODIS attributes: https://firms.modaps.eosdis.nasa.gov/content/descriptions/FIRMS_MODIS_Firehotspots.html
- NASA FIRMS VIIRS attributes: https://firms.modaps.eosdis.nasa.gov/content/descriptions/FIRMS_VIIRS_Firehotspots.html
- NASA FIRMS archive access: https://firms.modaps.eosdis.nasa.gov/download/
- NASA Earthdata swath-product discovery: https://search.earthdata.nasa.gov/
- Repository methods: `docs/RASAD_RESEARCH_MODEL.md`, `docs/RASAD_BRAZIL_INVENTORY.md`, `docs/RASAD_BRAZIL_MISSING_CHECKLIST.md`.

## Final user actions

1. Verify the final accessible public project link and complete repository upload if blocked.
2. Upload the separate seven-slide PDF and obtain its public view URL.
3. Paste the two distinct links and this project text into the NASA portal; review the submission and complete the portal action yourself.

The project has **not** been submitted to the NASA portal by this workflow.
