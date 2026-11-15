# RASAD common spatial grid

Estimand: source-specific observed occupied cells within a polygon AOI and UTC time window. This is a descriptive detected footprint, never a calibrated fire count or burned area.

Use cylindrical equal area on the declared authalic sphere R=6371007.1809 m, standard parallel 30°: x=R λ cos(30°), y=R sin(φ)/cos(30°). The common origin is (0,0); cell IDs use mathematical floor(x/s), floor(y/s). Configurable s=1000, 2000, 5000 metres. Equal area is exact on the declared spherical model, not an ellipsoidal survey-area model. Original coordinates are assigned once, without inventing finer MODIS detections. Both API occupancy and retained fingerprint exports use this model.

Sources remain separated by dataset, sensor, platform, product, collection and processing. UTC window counts, observed dates and reported FRP sums retain source identity. Summed pixel FRP across overpasses is not energy and can repeatedly observe the same activity. No cross-sensor FRP calibration is performed. Same-day observations are not necessarily simultaneous. Unknown acquisitions never become observed zeros.

Full-window occupancy is recomputed from original records for at most 31 UTC days; daily unique-cell counts are never added to estimate monthly unique cells. Two worker threads maximum and generation-keyed cache keep expensive work off the main server event loop. The map-like SVG shows at most 1,200 occupied projected cells; its explicit preview limit does not limit the source or sensitivity table counts. Orange/cyan denote MODIS/VIIRS channels, pale cells both sensor channels. It is a bounded occupancy preview, without a fire perimeter claim.

Independent original-ZIP/GEOS/projection/HTTP verification: Brazil, 2026-11-13; CSV rows 9,829.

| Cell size km | MODIS cells | VIIRS cells | Shared cells | Union cells |
|---:|---:|---:|---:|---:|
| 1 | 1429 | 4565 | 251 | 5743 |
| 2 | 1182 | 3629 | 291 | 4520 |
| 5 | 946 | 2885 | 325 | 3506 |

Larger cells merge nearby detections and increase apparent overlap. No size is chosen to maximize agreement. Finer grids better retain separation but are sensitive to geolocation and footprint differences; coarser grids smooth those differences while merging unrelated activity. Union cells are a descriptive multi-sensor footprint; processing and opportunity differences remain. Evidence: `tests/rasad.test.ts`, `tests/southAmerica.test.ts`, `scripts/verify-rasad-grid-independent.py`.
