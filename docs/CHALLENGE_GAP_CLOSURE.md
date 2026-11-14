# Challenge gap closure

2026-11-14. Implementation performed in the existing repository, without redesign, new data import, algorithm change, deployment or Git activity. This pass is grounded in OFFICIAL_REQUIREMENTS_TRACEABILITY.md; it does not invent mandatory calibration or forecasting requirements from secondary text.

## Material review and completed changes

The active prototype already supports two exact geographic scopes, shared UTC/source normalization, source-separated daily/monthly/yearly history, a combined Calendar, bounded raw date selection, exploratory associations, threshold sensitivity, matched-month comparison and Research Brief. Repeating these as new features would obscure the real gaps.

Two feasible download gaps were closed:

1. **Reusable spatial CSV.** Existing month CSV carried canonical IDs/provenance but omitted coordinates. Added latitude, longitude, raw sensor/platform, original acquisition date/time and day/night when available, plus activation revision. Existing columns remain in their order; new columns are appended. Raw values are preserved, not reconstructed when absent. Numeric negative coordinates remain numeric; string formula protection and CSV quoting remain active.
2. **Standalone scientific visualization.** Added Download displayed month SVG beside the existing CSV action. It exports the actual filtered region/month/metric, using the same canonical normalization/filter routine as CSV. Separate MODIS/VIIRS values, explicit unknown cells, source IDs, original dataset provenance, scope and revision are embedded. No external image/script/font dependency or fabricated dates/observations are used. This closes a practical visual-output gap corroborated by supplied/secondary objectives, without declaring it independently verified mandatory text.

Both outputs validate month syntax. The SVG calendar uses Monday-based UTC slots, mirrors weekday placement for Arabic and retains native Arabic labels. Count and reported-FRP modes are supported; FRP shows reported-value completeness n/N. Zero reported FRP remains distinct from missing FRP; missing source/date contributions remain unknown. A visual summary may show raw totals within a selected sensor, as the existing Calendar does; platform/product/processing identity remains in metadata. Those sensor totals are not interchangeable fire intensity or calibrated events.

The visualization is a data-derived export, not a screenshot of the application or a map-coverage product. No imagery footprint, acquisition opportunity, confidence conversion, independent event deduplication or anomaly score is introduced. Excluded filtered dates cannot be interpreted as zero activity. Reports remain source-aware; the additions do not make sensor identity scientifically irrelevant.

## Actual test scopes

Independent exported July 2023 results:

| Region | Both sources | MODIS only | VIIRS only |
|---|---:|---:|---:|
| Ajloun | 18 | 2 | 16 |
| Northern Jordan | 120 | 12 | 108 |

Each CSV ID matches SQLite; coordinates, original confidence/platform and activation revision match exactly. Python's stdlib CSV and XML readers independently verify each SVG metadata day/source count, nullable missingness, FRP sum/completeness and source-ID set. No JS aggregator is reused by that verification. The database hash is unchanged.

Actual browser coverage downloads English SVG, parses it without XML errors, decodes it as an image, checks 18 source IDs, and downloads its Arabic counterpart with the expected Arabic caveat. Existing CSV, map/year/sensor/region, matched-month, Research Brief, language and reduced-motion regressions remain active. No assertion was removed to accommodate the new outputs.

## Remaining gaps and feasible next actions

| Gap | Technically fixable with existing data? | Decision |
|---|---|---|
| Exact complete official requirement/resource preservation | No: live retrieval failed; only official indexed summary verified | Keep precise source hierarchy and seek an authenticated statement; no fabricated acceptance rubric. |
| Portable geographic CSV / visual export | Yes | Implemented and independently checked. |
| A sensor-independent historical reconstruction | Not through existing detections alone | No universal ratios/coefficient fitting; requires a defensible model with appropriate exposure and independent evaluation. |
| Exact valid-pixel opportunity | No verified mask/QA/geolocation inputs accessible | Candidate four-file manual package documented; no estimator enabled. |
| NOAA-20/21 upstream lineage | No | Supplier/product documentation needed; original rows stay unchanged. |
| Validated anomalies or operational predictions | No | No exposure-consistent baseline or held-out independent validation; outputs remain null/unavailable. |
| Unlimited geography/date/raw export | Requires scope/data/architecture expansion | Not claimed and not added for speculative completeness. Existing bounded UI and full-history summaries remain explicit. |

The highest-impact scientific next step remains a verified small acquisition-mask pilot, followed separately by independent sensitivity evidence. More detection-only statistics would not close the scientific harmonization gap. Current additions improve usability and reproducibility of the existing valid core; they are not substitutes for that research.

Exact modified files, commands and final acceptance are in FINAL_CHALLENGE_ACCEPTANCE.md. Advanced input paths and safe manual procedure are in ADVANCED_SCIENCE_DATA_REQUIREMENTS.md.
